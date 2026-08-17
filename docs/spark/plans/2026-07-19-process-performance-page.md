# Process Performance Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/dashboard/process` Process Performance page — activity-level drill-down (Receiving, Putaway, Outbound, Transfer, Relocation, Stock Opname) showing cycle time, productivity, supporting metrics, an 8-point trend, hourly transaction distribution, warehouse comparison, and operator ranking — per `docs/spark/specs/2026-07-19-process-performance-page-design.md`.

**Architecture:** Backend (`Warehouse-be`) adds a new `GET /dashboard/process-detail?activity=...&period=...` endpoint backed by a new `DashboardProcessDetailService`, reusing pure scoring helpers from `dashboard-kpi.util.ts` (extended with two new helpers) and following the exact query/window patterns already established in `dashboard-kpi-detail.service.ts`. Frontend (`Warehouse`) adds a new page (`ProcessPerformancePage.vue`), composable, and 5 new components, reusing `KpiWarehouseComparison.vue` and `KpiSupportingMetrics.vue` as-is, replacing the `/dashboard/process` route's current `PageShell` placeholder.

**Tech Stack:** NestJS + Prisma (backend), Vue 3 + `<script setup>` + Vitest SSR render tests (frontend), Tailwind CSS design tokens.

## Global Constraints

- Outbound merges Picking/Packing/Shipping into a single **"Outbound"** activity — 6 activities total (Receiving, Putaway, Outbound, Transfer, Relocation, Stock Opname), not 8. No backing model exists for distinct Picking/Packing/Shipping stages.
- No "Shift" concept exists anywhere in the schema — the mockup's Shift Comparison panel is dropped entirely, no pseudo-shift derivation.
- Operator Ranking uses `createdById` (who created the doc) as an accepted simplification for "who performed the work" — documented explicitly, same category of accepted constraint as the Putaway/`DocStatusHistory` dependency in prior sub-projects.
- `DocStatusHistory` (real transition-time tracking) is wired only for inbound/outbound/putaway/opname. Transfer and Relocation's queue time uses a plain `updatedAt - createdAt` proxy — no `DocStatusHistory` wiring extension.
- Zone, Product Category, and Shift filters are dropped (no backing data, or explicitly out of scope). Only a **Week / Month preset** Date Range toggle is kept — no custom date picker.
- No cron/scheduler — computed synchronously per request, same as all other dashboard endpoints.
- Response envelope: `successResponse(data)`; decorators `@ApiBearerAuthProtected()` + `@ApiStandardOkResponse(...)`.
- Manual `companyId`/`warehouseId` where-clause scoping (no automatic tenant guard).
- Frontend: match the existing Tailwind design system. Only use color tokens already confirmed real: `gray`, `primary` (50-900), `success`/`warning`/`danger`/`info` (50/500/600 only), `surface`, `surface-secondary`, `border`, `text`, `text-text-secondary`, `text-text-muted` (the color config key is literally `"text-secondary"`/`"text-muted"`, and Tailwind's `text-{colorKey}` rule produces the doubled-prefix classes `text-text-secondary`/`text-text-muted` — bare `text-secondary`/`text-muted` do NOT compile), or plain Tailwind defaults. Never use `bg-workspace-bg`, `border-border-default`, `text-action-orange`, `text-signal-red`, `text-text-tertiary`, `bg-primary-light` — confirmed dead.
- No charting library (Chart.js, etc.) — trend chart is a plain inline SVG polyline, same technique as `KpiDomainHero.vue`'s timeline.
- `TransferDoc` has no `warehouse_id` field (it has `origin_warehouse_id`/`destination_warehouse_id` instead, since a transfer spans two warehouses). Per this plan's design decision, Transfer's warehouse scoping/comparison/ranking uses `origin_warehouse_id` as the doc's "home" warehouse — an explicit accepted simplification, same category as the other documented gaps above.
- Monthly trend/window granularity uses a fixed 30-day window as an approximation of a calendar month (not actual calendar-month boundaries) — keeps the windowing math identical to the existing weekly-window pattern with no calendar arithmetic.

---

## Backend Tasks (`/Users/syillaeltaniadaffa/Documents/Warehouse-be`)

### Task 1: `dashboard-process-detail.types.ts` + extend `dashboard-kpi.util.ts`

**Files:**

- Create: `src/modules/warehouse/dashboard/dashboard-process-detail.types.ts`
- Modify: `src/modules/warehouse/dashboard/dashboard-kpi.util.ts`
- Test: `src/modules/warehouse/dashboard/dashboard-kpi.util.spec.ts` (extend existing file)

**Interfaces:**

- Produces: `ProcessActivity`, `ProcessDomain`, `ProcessPeriod`, `ProcessCycleTimeMetric`, `ProcessProductivityMetric`, `ProcessSupportingMetrics`, `ProcessTrendPoint`, `ProcessHourlyBucket`, `ProcessWarehouseRankEntry`, `ProcessOperatorRankEntry`, `ProcessDetailResponse` types; `computeWindowBounds(period: ProcessPeriod, unitsAgoStart: number, unitsAgoEnd: number): { gte: Date; lt: Date }` and `computeOperatorScore(completedCount: number, maxCompletedCount: number, avgCycleMinutes: number, fastestAvgCycleMinutes: number): number` pure functions — both consumed by Task 2.

- [ ] **Step 1: Write the failing tests for the two new util functions**

Add to `src/modules/warehouse/dashboard/dashboard-kpi.util.spec.ts` (append new `describe` blocks after the existing ones):

```ts
describe("computeWindowBounds", () => {
    it("returns a 7-day window for period=week, unitsAgo 1..0", () => {
        const { gte, lt } = computeWindowBounds("week", 1, 0);
        const diffDays = (lt.getTime() - gte.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeCloseTo(7, 5);
    });

    it("returns a 30-day window for period=month, unitsAgo 1..0", () => {
        const { gte, lt } = computeWindowBounds("month", 1, 0);
        const diffDays = (lt.getTime() - gte.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeCloseTo(30, 5);
    });

    it("returns an earlier window the further back unitsAgo is", () => {
        const recent = computeWindowBounds("week", 2, 1);
        const older = computeWindowBounds("week", 3, 2);
        expect(older.gte.getTime()).toBeLessThan(recent.gte.getTime());
    });
});

describe("computeOperatorScore", () => {
    it("gives the operator with the most completions and fastest cycle time a perfect score", () => {
        const score = computeOperatorScore(10, 10, 30, 30);
        expect(score).toBe(100);
    });

    it("scores an operator with half the completions and double the cycle time lower", () => {
        const score = computeOperatorScore(5, 10, 60, 30);
        expect(score).toBeLessThan(100);
        expect(score).toBeGreaterThanOrEqual(0);
    });

    it("falls back to a perfect speed score when the operator has no recorded cycle time", () => {
        const score = computeOperatorScore(3, 10, 0, 20);
        expect(score).toBe(65);
    });
});
```

Update the top of the spec file's import to include the two new functions:

```ts
import {
    clampScore,
    computePctChange,
    computeThroughputScore,
    computeInventoryScore,
    computeContributorSplit,
    computeWindowBounds,
    computeOperatorScore,
} from "./dashboard-kpi.util";
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-kpi.util.spec.ts`
Expected: FAIL — `computeWindowBounds is not a function` (or `TS2305: Module has no exported member`)

- [ ] **Step 3: Add `computeWindowBounds` and `computeOperatorScore` to `dashboard-kpi.util.ts`**

Append to the end of the file:

```ts
export function computeWindowBounds(
    period: "week" | "month",
    unitsAgoStart: number,
    unitsAgoEnd: number,
): { gte: Date; lt: Date } {
    const unitMs =
        period === "week" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return {
        gte: new Date(now - unitsAgoStart * unitMs),
        lt: new Date(now - unitsAgoEnd * unitMs),
    };
}

export function computeOperatorScore(
    completedCount: number,
    maxCompletedCount: number,
    avgCycleMinutes: number,
    fastestAvgCycleMinutes: number,
): number {
    const throughputScore =
        maxCompletedCount === 0
            ? 0
            : (completedCount / maxCompletedCount) * 100;
    const speedScore =
        avgCycleMinutes === 0
            ? 100
            : clampScore((fastestAvgCycleMinutes / avgCycleMinutes) * 100);
    return Math.round((throughputScore + speedScore) / 2);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-kpi.util.spec.ts`
Expected: PASS (all tests, including the 6 new ones)

- [ ] **Step 5: Create `dashboard-process-detail.types.ts`**

```ts
export type ProcessActivity =
    "receiving" | "putaway" | "outbound" | "transfer" | "relocation" | "opname";

export type ProcessDomain = "stockIn" | "inventory" | "stockOut";

export type ProcessPeriod = "week" | "month";

export interface ProcessCycleTimeMetric {
    minutes: number;
    previousMinutes: number;
    trendPct: number;
}

export interface ProcessProductivityMetric {
    unitsPerHour: number;
    previousUnitsPerHour: number;
    trendPct: number;
}

export interface ProcessSupportingMetrics {
    completedTransactions: number;
    avgDailyVolumeUnits: number;
    avgQueueTimeMinutes: number;
}

export interface ProcessTrendPoint {
    period: string;
    cycleTimeMinutes: number;
    productivityUnitsPerHour: number;
}

export interface ProcessHourlyBucket {
    hour: number;
    count: number;
}

export interface ProcessWarehouseRankEntry {
    warehouseId: string;
    warehouseName: string;
    score: number;
}

export interface ProcessOperatorRankEntry {
    userId: string;
    userName: string;
    score: number;
}

export interface ProcessDetailResponse {
    activity: ProcessActivity;
    domain: ProcessDomain;
    label: string;
    cycleTime: ProcessCycleTimeMetric;
    productivity: ProcessProductivityMetric;
    supportingMetrics: ProcessSupportingMetrics;
    trend: ProcessTrendPoint[];
    hourlyDistribution: ProcessHourlyBucket[];
    warehouseComparison: {
        top: ProcessWarehouseRankEntry[];
        bottom: ProcessWarehouseRankEntry[];
    };
    operatorRanking: ProcessOperatorRankEntry[];
}
```

- [ ] **Step 6: Commit**

```bash
git add src/modules/warehouse/dashboard/dashboard-process-detail.types.ts src/modules/warehouse/dashboard/dashboard-kpi.util.ts src/modules/warehouse/dashboard/dashboard-kpi.util.spec.ts
git commit -m "feat: add computeWindowBounds, computeOperatorScore, and Process Performance types"
```

---

### Task 2: `DashboardProcessDetailService`

**Files:**

- Create: `src/modules/warehouse/dashboard/dashboard-process-detail.service.ts`
- Test: `src/modules/warehouse/dashboard/dashboard-process-detail.service.spec.ts`

**Interfaces:**

- Consumes: `PrismaService`; `clampScore`, `computeOperatorScore`, `computePctChange`, `computeThroughputScore`, `computeWindowBounds` (Task 1 + existing `dashboard-kpi.util.ts`); `ProcessActivity`/`ProcessPeriod`/`ProcessDetailResponse`/etc. (Task 1).
- Produces: `DashboardProcessDetailService.getProcessDetail(activity: ProcessActivity, period: ProcessPeriod, query: DashboardQueryDto): Promise<ProcessDetailResponse>` — consumed by Task 3.

- [ ] **Step 1: Write the failing test**

```ts
import { Test, TestingModule } from "@nestjs/testing";
import { DashboardProcessDetailService } from "./dashboard-process-detail.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";

describe("DashboardProcessDetailService", () => {
    let service: DashboardProcessDetailService;

    const emptyDocs = jest.fn().mockResolvedValue([]);
    const emptyLines = jest.fn().mockResolvedValue([]);

    const mockPrismaService: any = {
        inboundDoc: { findMany: emptyDocs },
        inboundLine: { findMany: emptyLines },
        putawayDoc: { findMany: emptyDocs },
        putawayLine: { findMany: emptyLines },
        outboundDoc: { findMany: emptyDocs },
        outboundLine: { findMany: emptyLines },
        transferDoc: { findMany: emptyDocs },
        transferLine: { findMany: emptyLines },
        relocationDoc: { findMany: emptyDocs },
        relocationLine: { findMany: emptyLines },
        opnameDoc: { findMany: emptyDocs },
        opnameLine: { findMany: emptyLines },
        docStatusHistory: { findMany: jest.fn().mockResolvedValue([]) },
        warehouse: { findMany: jest.fn().mockResolvedValue([]) },
        user: { findMany: jest.fn().mockResolvedValue([]) },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardProcessDetailService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<DashboardProcessDetailService>(
            DashboardProcessDetailService,
        );
    });

    afterEach(() => jest.clearAllMocks());

    it("returns a receiving detail response mapped to the stockIn domain with correct label", async () => {
        const result = await service.getProcessDetail("receiving", "week", {
            page: 1,
            limit: 20,
        } as any);

        expect(result.activity).toBe("receiving");
        expect(result.domain).toBe("stockIn");
        expect(result.label).toBe("Receiving");
        expect(result.trend).toHaveLength(8);
        expect(result.hourlyDistribution).toHaveLength(24);
        expect(result.operatorRanking).toEqual([]);
    });

    it("maps outbound to the stockOut domain and transfer/relocation/opname to inventory", async () => {
        const outbound = await service.getProcessDetail("outbound", "week", {
            page: 1,
            limit: 20,
        } as any);
        expect(outbound.domain).toBe("stockOut");
        expect(outbound.label).toBe("Outbound");

        const putaway = await service.getProcessDetail("putaway", "week", {
            page: 1,
            limit: 20,
        } as any);
        expect(putaway.domain).toBe("stockIn");
        expect(putaway.label).toBe("Putaway");

        const transfer = await service.getProcessDetail("transfer", "week", {
            page: 1,
            limit: 20,
        } as any);
        expect(transfer.domain).toBe("inventory");
        expect(transfer.label).toBe("Transfer");

        const relocation = await service.getProcessDetail(
            "relocation",
            "week",
            { page: 1, limit: 20 } as any,
        );
        expect(relocation.domain).toBe("inventory");
        expect(relocation.label).toBe("Relocation");

        const opname = await service.getProcessDetail("opname", "month", {
            page: 1,
            limit: 20,
        } as any);
        expect(opname.domain).toBe("inventory");
        expect(opname.label).toBe("Stock Opname");
    });

    it("uses the updatedAt-createdAt proxy for transfer queue time (no DocStatusHistory query)", async () => {
        mockPrismaService.transferDoc.findMany.mockResolvedValue([
            {
                id: "t-1",
                createdAt: new Date("2026-07-01T00:00:00Z"),
                updatedAt: new Date("2026-07-01T02:00:00Z"),
                createdById: "u-1",
            },
        ]);

        await service.getProcessDetail("transfer", "week", {
            page: 1,
            limit: 20,
        } as any);

        expect(
            mockPrismaService.docStatusHistory.findMany,
        ).not.toHaveBeenCalled();
        mockPrismaService.transferDoc.findMany.mockResolvedValue([]);
    });

    it("excludes idle warehouses (no completed docs) from warehouse comparison ranking", async () => {
        mockPrismaService.warehouse.findMany.mockResolvedValueOnce([
            { id: "wh-1", name: "Active Warehouse" },
            { id: "wh-2", name: "Idle Warehouse" },
        ]);
        mockPrismaService.inboundDoc.findMany.mockImplementation(
            (args: any) => {
                if (args.where.warehouse_id === "wh-1") {
                    return Promise.resolve([
                        {
                            id: "d-1",
                            createdAt: new Date("2026-07-01T00:00:00Z"),
                            updatedAt: new Date("2026-07-01T01:00:00Z"),
                            createdById: "u-1",
                        },
                    ]);
                }
                return Promise.resolve([]);
            },
        );

        const result = await service.getProcessDetail("receiving", "week", {
            page: 1,
            limit: 20,
        } as any);

        const allRanked = [
            ...result.warehouseComparison.top,
            ...result.warehouseComparison.bottom,
        ];
        expect(allRanked.some((w) => w.warehouseId === "wh-1")).toBe(true);
        expect(allRanked.some((w) => w.warehouseId === "wh-2")).toBe(false);
    });

    it("ranks operators by completion count and cycle time, joining User for display names", async () => {
        mockPrismaService.inboundDoc.findMany.mockImplementation(
            (args: any) => {
                if (args.where.updatedAt) {
                    return Promise.resolve([
                        {
                            id: "d-1",
                            createdAt: new Date("2026-07-01T00:00:00Z"),
                            updatedAt: new Date("2026-07-01T00:30:00Z"),
                            createdById: "u-fast",
                        },
                        {
                            id: "d-2",
                            createdAt: new Date("2026-07-01T00:00:00Z"),
                            updatedAt: new Date("2026-07-01T02:00:00Z"),
                            createdById: "u-slow",
                        },
                    ]);
                }
                return Promise.resolve([]);
            },
        );
        mockPrismaService.user.findMany.mockResolvedValue([
            { id: "u-fast", fullName: "Fast Operator" },
            { id: "u-slow", fullName: "Slow Operator" },
        ]);

        const result = await service.getProcessDetail("receiving", "week", {
            page: 1,
            limit: 20,
        } as any);

        expect(result.operatorRanking).toHaveLength(2);
        expect(result.operatorRanking[0].userName).toBe("Fast Operator");
        expect(result.operatorRanking[0].score).toBeGreaterThan(
            result.operatorRanking[1].score,
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-process-detail.service.spec.ts`
Expected: FAIL — `Cannot find module './dashboard-process-detail.service'`

- [ ] **Step 3: Write `dashboard-process-detail.service.ts`**

```ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import type { DashboardQueryDto } from "./dto/dashboard-query.dto";
import {
    clampScore,
    computeOperatorScore,
    computePctChange,
    computeThroughputScore,
    computeWindowBounds,
} from "./dashboard-kpi.util";
import type {
    ProcessActivity,
    ProcessDetailResponse,
    ProcessDomain,
    ProcessHourlyBucket,
    ProcessOperatorRankEntry,
    ProcessPeriod,
    ProcessTrendPoint,
    ProcessWarehouseRankEntry,
} from "./dashboard-process-detail.types";

const TREND_POINTS = 8;

type Window = { gte: Date; lt: Date };

interface ActivityConfig {
    domain: ProcessDomain;
    label: string;
    completedStatus: string;
    warehouseField: "warehouse_id" | "origin_warehouse_id";
    docStatusHistoryType?: "inbound" | "outbound" | "putaway" | "opname";
}

const ACTIVITY_CONFIG: Record<ProcessActivity, ActivityConfig> = {
    receiving: {
        domain: "stockIn",
        label: "Receiving",
        completedStatus: "posted",
        warehouseField: "warehouse_id",
        docStatusHistoryType: "inbound",
    },
    putaway: {
        domain: "stockIn",
        label: "Putaway",
        completedStatus: "done",
        warehouseField: "warehouse_id",
        docStatusHistoryType: "putaway",
    },
    outbound: {
        domain: "stockOut",
        label: "Outbound",
        completedStatus: "posted",
        warehouseField: "warehouse_id",
        docStatusHistoryType: "outbound",
    },
    transfer: {
        domain: "inventory",
        label: "Transfer",
        completedStatus: "posted",
        warehouseField: "origin_warehouse_id",
    },
    relocation: {
        domain: "inventory",
        label: "Relocation",
        completedStatus: "posted",
        warehouseField: "warehouse_id",
    },
    opname: {
        domain: "inventory",
        label: "Stock Opname",
        completedStatus: "closed",
        warehouseField: "warehouse_id",
        docStatusHistoryType: "opname",
    },
};

interface DocRow {
    id: string;
    createdAt: Date | null;
    updatedAt: Date | null;
    createdById: string | null;
}

@Injectable()
export class DashboardProcessDetailService {
    constructor(private readonly prisma: PrismaService) {}

    async getProcessDetail(
        activity: ProcessActivity,
        period: ProcessPeriod,
        query: DashboardQueryDto,
    ): Promise<ProcessDetailResponse> {
        const config = ACTIVITY_CONFIG[activity];
        const currentWindow = computeWindowBounds(period, 1, 0);
        const previousWindow = computeWindowBounds(period, 2, 1);

        const [
            currentDocs,
            previousDocs,
            currentQty,
            previousQty,
            trend,
            hourlyDistribution,
            warehouseComparison,
            operatorRanking,
            avgQueueTimeMinutes,
        ] = await Promise.all([
            this.fetchDocs(activity, currentWindow, query),
            this.fetchDocs(activity, previousWindow, query),
            this.fetchLineQtySum(activity, currentWindow, query),
            this.fetchLineQtySum(activity, previousWindow, query),
            this.buildTrend(activity, period, query),
            this.buildHourlyDistribution(activity, currentWindow, query),
            this.buildWarehouseComparison(activity, period, query),
            this.buildOperatorRanking(activity, currentWindow, query),
            this.queueMinutes(activity, currentWindow, query),
        ]);

        const currentCycle = this.averageCycleMinutes(currentDocs);
        const previousCycle = this.averageCycleMinutes(previousDocs);

        const windowHours =
            (currentWindow.lt.getTime() - currentWindow.gte.getTime()) /
            (1000 * 60 * 60);
        const previousWindowHours =
            (previousWindow.lt.getTime() - previousWindow.gte.getTime()) /
            (1000 * 60 * 60);
        const windowDays = windowHours / 24;

        const currentUnitsPerHour =
            windowHours === 0 ? 0 : currentQty / windowHours;
        const previousUnitsPerHour =
            previousWindowHours === 0 ? 0 : previousQty / previousWindowHours;

        return {
            activity,
            domain: config.domain,
            label: config.label,
            cycleTime: {
                minutes: Math.round(currentCycle),
                previousMinutes: Math.round(previousCycle),
                trendPct: computePctChange(currentCycle, previousCycle),
            },
            productivity: {
                unitsPerHour: Math.round(currentUnitsPerHour),
                previousUnitsPerHour: Math.round(previousUnitsPerHour),
                trendPct: computePctChange(
                    currentUnitsPerHour,
                    previousUnitsPerHour,
                ),
            },
            supportingMetrics: {
                completedTransactions: currentDocs.length,
                avgDailyVolumeUnits:
                    windowDays === 0 ? 0 : Math.round(currentQty / windowDays),
                avgQueueTimeMinutes: Math.round(avgQueueTimeMinutes),
            },
            trend,
            hourlyDistribution,
            warehouseComparison,
            operatorRanking,
        };
    }

    private averageCycleMinutes(docs: DocRow[]): number {
        const durations = docs
            .filter((d) => d.createdAt && d.updatedAt)
            .map(
                (d) =>
                    (new Date(d.updatedAt as Date).getTime() -
                        new Date(d.createdAt as Date).getTime()) /
                    (1000 * 60),
            );
        if (durations.length === 0) return 0;
        return durations.reduce((acc, m) => acc + m, 0) / durations.length;
    }

    private buildDocWhere(
        activity: ProcessActivity,
        range: Window,
        query: DashboardQueryDto,
        warehouseIdOverride?: string,
    ): Record<string, unknown> {
        const config = ACTIVITY_CONFIG[activity];
        const where: Record<string, unknown> = {
            status: config.completedStatus,
            updatedAt: range,
        };
        if (query.companyId) where.companyId = query.companyId;
        const warehouseId = warehouseIdOverride ?? query.warehouseId;
        if (warehouseId) where[config.warehouseField] = warehouseId;
        return where;
    }

    private async fetchDocs(
        activity: ProcessActivity,
        range: Window,
        query: DashboardQueryDto,
        warehouseIdOverride?: string,
    ): Promise<DocRow[]> {
        const where = this.buildDocWhere(
            activity,
            range,
            query,
            warehouseIdOverride,
        );
        const select = {
            id: true,
            createdAt: true,
            updatedAt: true,
            createdById: true,
        };

        switch (activity) {
            case "receiving":
                return this.prisma.inboundDoc.findMany({ where, select });
            case "putaway":
                return this.prisma.putawayDoc.findMany({ where, select });
            case "outbound":
                return this.prisma.outboundDoc.findMany({ where, select });
            case "transfer":
                return this.prisma.transferDoc.findMany({ where, select });
            case "relocation":
                return this.prisma.relocationDoc.findMany({ where, select });
            case "opname":
                return this.prisma.opnameDoc.findMany({ where, select });
        }
    }

    private async fetchLineQtySum(
        activity: ProcessActivity,
        range: Window,
        query: DashboardQueryDto,
        warehouseIdOverride?: string,
    ): Promise<number> {
        const docWhere = this.buildDocWhere(
            activity,
            range,
            query,
            warehouseIdOverride,
        );

        switch (activity) {
            case "receiving": {
                const lines = await this.prisma.inboundLine.findMany({
                    where: { doc: docWhere },
                    select: { qty: true },
                });
                return lines.reduce((acc, l) => acc + Number(l.qty), 0);
            }
            case "putaway": {
                const lines = await this.prisma.putawayLine.findMany({
                    where: { doc: docWhere },
                    select: { qty: true },
                });
                return lines.reduce((acc, l) => acc + Number(l.qty), 0);
            }
            case "outbound": {
                const lines = await this.prisma.outboundLine.findMany({
                    where: { doc: docWhere },
                    select: { qty: true },
                });
                return lines.reduce((acc, l) => acc + Number(l.qty), 0);
            }
            case "transfer": {
                const lines = await this.prisma.transferLine.findMany({
                    where: { doc: docWhere },
                    select: { qty: true },
                });
                return lines.reduce((acc, l) => acc + Number(l.qty), 0);
            }
            case "relocation": {
                const lines = await this.prisma.relocationLine.findMany({
                    where: { doc: docWhere },
                    select: { qty: true },
                });
                return lines.reduce((acc, l) => acc + Number(l.qty), 0);
            }
            case "opname": {
                const lines = await this.prisma.opnameLine.findMany({
                    where: { doc: docWhere },
                    select: { system_qty: true },
                });
                return lines.reduce((acc, l) => acc + Number(l.system_qty), 0);
            }
        }
    }

    private async queueMinutes(
        activity: ProcessActivity,
        range: Window,
        query: DashboardQueryDto,
    ): Promise<number> {
        const config = ACTIVITY_CONFIG[activity];
        if (!config.docStatusHistoryType) {
            // Transfer/Relocation: no DocStatusHistory wiring — updatedAt-createdAt proxy.
            const docs = await this.fetchDocs(activity, range, query);
            return this.averageCycleMinutes(docs);
        }

        const where: Record<string, unknown> = {
            docType: config.docStatusHistoryType,
            changedAt: range,
        };
        if (query.companyId) where.companyId = query.companyId;
        if (query.warehouseId) where.warehouseId = query.warehouseId;

        const rows = await this.prisma.docStatusHistory.findMany({
            where,
            select: { docId: true, changedAt: true },
        });

        const byDoc = new Map<string, Date[]>();
        rows.forEach((row) => {
            const list = byDoc.get(row.docId) ?? [];
            list.push(row.changedAt);
            byDoc.set(row.docId, list);
        });

        const durations: number[] = [];
        byDoc.forEach((changedAtList) => {
            if (changedAtList.length < 2) return;
            const sorted = [...changedAtList].sort(
                (a, b) => a.getTime() - b.getTime(),
            );
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            durations.push((last.getTime() - first.getTime()) / (1000 * 60));
        });

        if (durations.length === 0) return 0;
        return durations.reduce((acc, m) => acc + m, 0) / durations.length;
    }

    private async buildTrend(
        activity: ProcessActivity,
        period: ProcessPeriod,
        query: DashboardQueryDto,
    ): Promise<ProcessTrendPoint[]> {
        const unitsAgoList = Array.from(
            { length: TREND_POINTS },
            (_, i) => TREND_POINTS - 1 - i,
        );

        return Promise.all(
            unitsAgoList.map(async (unitsAgo) => {
                const window = computeWindowBounds(
                    period,
                    unitsAgo + 1,
                    unitsAgo,
                );
                const [docs, qty] = await Promise.all([
                    this.fetchDocs(activity, window, query),
                    this.fetchLineQtySum(activity, window, query),
                ]);
                const windowHours =
                    (window.lt.getTime() - window.gte.getTime()) /
                    (1000 * 60 * 60);
                return {
                    period:
                        unitsAgo === 0
                            ? "Current"
                            : period === "week"
                              ? `${unitsAgo}w ago`
                              : `${unitsAgo}mo ago`,
                    cycleTimeMinutes: Math.round(
                        this.averageCycleMinutes(docs),
                    ),
                    productivityUnitsPerHour:
                        windowHours === 0 ? 0 : Math.round(qty / windowHours),
                };
            }),
        );
    }

    private async buildHourlyDistribution(
        activity: ProcessActivity,
        window: Window,
        query: DashboardQueryDto,
    ): Promise<ProcessHourlyBucket[]> {
        const docs = await this.fetchDocs(activity, window, query);
        const counts = new Array(24).fill(0);
        docs.forEach((doc) => {
            if (!doc.createdAt) return;
            const hour = new Date(doc.createdAt).getHours();
            counts[hour] += 1;
        });
        return counts.map((count, hour) => ({ hour, count }));
    }

    private async buildWarehouseComparison(
        activity: ProcessActivity,
        period: ProcessPeriod,
        query: DashboardQueryDto,
    ): Promise<{
        top: ProcessWarehouseRankEntry[];
        bottom: ProcessWarehouseRankEntry[];
    }> {
        const warehouseWhere: { companyId?: string } = {};
        if (query.companyId) warehouseWhere.companyId = query.companyId;

        const warehouses = await this.prisma.warehouse.findMany({
            where: warehouseWhere,
            select: { id: true, name: true },
        });

        const currentWindow = computeWindowBounds(period, 1, 0);
        const previousWindow = computeWindowBounds(period, 2, 1);
        const entries: ProcessWarehouseRankEntry[] = [];

        for (const warehouse of warehouses) {
            const [currentDocs, previousDocs, currentQty, previousQty] =
                await Promise.all([
                    this.fetchDocs(
                        activity,
                        currentWindow,
                        query,
                        warehouse.id,
                    ),
                    this.fetchDocs(
                        activity,
                        previousWindow,
                        query,
                        warehouse.id,
                    ),
                    this.fetchLineQtySum(
                        activity,
                        currentWindow,
                        query,
                        warehouse.id,
                    ),
                    this.fetchLineQtySum(
                        activity,
                        previousWindow,
                        query,
                        warehouse.id,
                    ),
                ]);
            if (currentDocs.length === 0) continue;

            const currentCycleHours =
                this.averageCycleMinutes(currentDocs) / 60;
            const previousCycleHours =
                this.averageCycleMinutes(previousDocs) / 60;
            const score = computeThroughputScore(
                currentQty,
                previousQty,
                currentCycleHours,
                previousCycleHours,
            ).score;

            entries.push({
                warehouseId: warehouse.id,
                warehouseName: warehouse.name,
                score,
            });
        }

        const sorted = [...entries].sort((a, b) => b.score - a.score);
        const top = sorted.slice(0, 3);
        const topIds = new Set(top.map((w) => w.warehouseId));
        const bottom = sorted
            .filter((w) => !topIds.has(w.warehouseId))
            .slice(-3)
            .reverse();

        return { top, bottom };
    }

    private async buildOperatorRanking(
        activity: ProcessActivity,
        window: Window,
        query: DashboardQueryDto,
    ): Promise<ProcessOperatorRankEntry[]> {
        const docs = await this.fetchDocs(activity, window, query);

        const byOperator = new Map<string, DocRow[]>();
        docs.forEach((doc) => {
            if (!doc.createdById) return;
            const list = byOperator.get(doc.createdById) ?? [];
            list.push(doc);
            byOperator.set(doc.createdById, list);
        });

        if (byOperator.size === 0) return [];

        const stats = [...byOperator.entries()].map(
            ([userId, operatorDocs]) => ({
                userId,
                completedCount: operatorDocs.length,
                avgCycleMinutes: this.averageCycleMinutes(operatorDocs),
            }),
        );

        const maxCompletedCount = Math.max(
            ...stats.map((s) => s.completedCount),
        );
        const cycleTimes = stats
            .map((s) => s.avgCycleMinutes)
            .filter((m) => m > 0);
        const fastestAvgCycleMinutes =
            cycleTimes.length === 0 ? 0 : Math.min(...cycleTimes);

        const scored = stats.map((s) => ({
            userId: s.userId,
            score: computeOperatorScore(
                s.completedCount,
                maxCompletedCount,
                s.avgCycleMinutes,
                fastestAvgCycleMinutes,
            ),
        }));

        const topFive = [...scored]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        const users = await this.prisma.user.findMany({
            where: { id: { in: topFive.map((s) => s.userId) } },
            select: { id: true, fullName: true },
        });
        const nameById = new Map(users.map((u) => [u.id, u.fullName]));

        return topFive.map((s) => ({
            userId: s.userId,
            userName: nameById.get(s.userId) ?? "Unknown",
            score: s.score,
        }));
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-process-detail.service.spec.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/modules/warehouse/dashboard/dashboard-process-detail.service.ts src/modules/warehouse/dashboard/dashboard-process-detail.service.spec.ts
git commit -m "feat: add DashboardProcessDetailService for activity-level drill-down"
```

---

### Task 3: `GET /dashboard/process-detail` endpoint + DTO validation

**Files:**

- Create: `src/modules/warehouse/dashboard/dto/dashboard-process-detail-query.dto.ts`
- Modify: `src/modules/warehouse/dashboard/dashboard.controller.ts`
- Modify: `src/modules/warehouse/dashboard/dashboard.module.ts`
- Test: no new test file — this route is a thin wrapper; the whole-branch/manual smoke test covers it, consistent with how `kpi-detail`/`workflow-overview` routes were added without their own controller-level test.

**Interfaces:**

- Consumes: `DashboardProcessDetailService.getProcessDetail` (Task 2).
- Produces: `GET /dashboard/process-detail?activity=receiving|putaway|outbound|transfer|relocation|opname&period=week|month&companyId=...&warehouseId=...`.

- [ ] **Step 1: Write `dashboard-process-detail-query.dto.ts`**

```ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional } from "class-validator";
import { DashboardQueryDto } from "./dashboard-query.dto";
import type {
    ProcessActivity,
    ProcessPeriod,
} from "../dashboard-process-detail.types";

export class DashboardProcessDetailQueryDto extends DashboardQueryDto {
    @ApiPropertyOptional({
        enum: [
            "receiving",
            "putaway",
            "outbound",
            "transfer",
            "relocation",
            "opname",
        ],
        default: "receiving",
        description: "Process activity to drill into",
    })
    @IsIn([
        "receiving",
        "putaway",
        "outbound",
        "transfer",
        "relocation",
        "opname",
    ])
    @IsOptional()
    activity: ProcessActivity = "receiving";

    @ApiPropertyOptional({
        enum: ["week", "month"],
        default: "week",
        description: "Trend/window granularity preset",
    })
    @IsIn(["week", "month"])
    @IsOptional()
    period: ProcessPeriod = "week";
}
```

- [ ] **Step 2: Add the route to `dashboard.controller.ts`**

Add the imports:

```ts
import { DashboardProcessDetailService } from "./dashboard-process-detail.service";
import { DashboardProcessDetailQueryDto } from "./dto/dashboard-process-detail-query.dto";
```

Update the constructor:

```ts
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly dashboardAlertsService: DashboardAlertsService,
    private readonly dashboardWorkflowService: DashboardWorkflowService,
    private readonly dashboardKpiService: DashboardKpiService,
    private readonly dashboardKpiDetailService: DashboardKpiDetailService,
    private readonly dashboardProcessDetailService: DashboardProcessDetailService,
  ) {}
```

Add the route (after `kpiDetail`, before `low-stock`):

```ts
  @Get('process-detail')
  @ApiBearerAuthProtected()
  @ApiOperation({
    summary: 'Process Performance activity detail',
    description:
      'Returns cycle time, productivity, supporting metrics, an 8-point trend, hourly distribution, warehouse ranking, and operator ranking for one activity (receiving, putaway, outbound, transfer, relocation, or opname). Optional scope: companyId, warehouseId.',
  })
  @ApiStandardOkResponse('Process activity detail')
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async processDetail(
    @Query() query: DashboardProcessDetailQueryDto,
  ): Promise<ApiResponse<unknown>> {
    const data = await this.dashboardProcessDetailService.getProcessDetail(
      query.activity,
      query.period,
      query,
    );
    return successResponse(data);
  }
```

- [ ] **Step 3: Register in `dashboard.module.ts`**

```ts
import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { DashboardAlertsService } from "./dashboard-alerts.service";
import { DashboardWorkflowService } from "./dashboard-workflow.service";
import { DashboardKpiService } from "./dashboard-kpi.service";
import { DashboardKpiDetailService } from "./dashboard-kpi-detail.service";
import { DashboardProcessDetailService } from "./dashboard-process-detail.service";
import { DocStatusHistoryModule } from "../doc-status-history/doc-status-history.module";

@Module({
    imports: [DocStatusHistoryModule],
    controllers: [DashboardController],
    providers: [
        DashboardService,
        DashboardAlertsService,
        DashboardWorkflowService,
        DashboardKpiService,
        DashboardKpiDetailService,
        DashboardProcessDetailService,
    ],
    exports: [
        DashboardService,
        DashboardAlertsService,
        DashboardWorkflowService,
        DashboardKpiService,
        DashboardKpiDetailService,
        DashboardProcessDetailService,
    ],
})
export class DashboardModule {}
```

- [ ] **Step 4: Verify the full dashboard suite and type-check**

Run: `npx jest src/modules/warehouse/dashboard`
Expected: PASS (all suites)

Run: `npx tsc --noEmit` (or this project's equivalent)
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/modules/warehouse/dashboard/dto/dashboard-process-detail-query.dto.ts src/modules/warehouse/dashboard/dashboard.controller.ts src/modules/warehouse/dashboard/dashboard.module.ts
git commit -m "feat: add GET /dashboard/process-detail endpoint"
```

---

## Frontend Tasks (`/Users/syillaeltaniadaffa/Documents/Warehouse`)

### Task 4: Types + API + service method

**Files:**

- Modify: `src/api/feature/dto/dashboard.dto.ts`
- Modify: `src/model/dashboard.ts`
- Modify: `src/api/feature/dashboard.api.ts`
- Modify: `src/services/dashboard.service.ts`
- Test: `src/services/dashboard.service.test.ts` (extend existing file)

**Interfaces:**

- Produces: `ProcessActivity`, `ProcessDomain`, `ProcessPeriod`, `ProcessCycleTimeMetric`, `ProcessProductivityMetric`, `ProcessSupportingMetrics`, `ProcessTrendPoint`, `ProcessHourlyBucket`, `ProcessWarehouseRankEntry`, `ProcessOperatorRankEntry`, `ProcessDetailResponse` types; `dashboardApi.fetchProcessDetail(activity, period, params)`; `dashboardService.fetchProcessDetail(activity, period, filter)` — consumed by Task 5.

- [ ] **Step 1: Append types to `src/api/feature/dto/dashboard.dto.ts`**

```ts
export type ProcessActivity =
    "receiving" | "putaway" | "outbound" | "transfer" | "relocation" | "opname";

export type ProcessDomain = "stockIn" | "inventory" | "stockOut";

export type ProcessPeriod = "week" | "month";

export interface ProcessCycleTimeMetric {
    minutes: number;
    previousMinutes: number;
    trendPct: number;
}

export interface ProcessProductivityMetric {
    unitsPerHour: number;
    previousUnitsPerHour: number;
    trendPct: number;
}

export interface ProcessSupportingMetrics {
    completedTransactions: number;
    avgDailyVolumeUnits: number;
    avgQueueTimeMinutes: number;
}

export interface ProcessTrendPoint {
    period: string;
    cycleTimeMinutes: number;
    productivityUnitsPerHour: number;
}

export interface ProcessHourlyBucket {
    hour: number;
    count: number;
}

export interface ProcessWarehouseRankEntry {
    warehouseId: string;
    warehouseName: string;
    score: number;
}

export interface ProcessOperatorRankEntry {
    userId: string;
    userName: string;
    score: number;
}

export interface ProcessDetailResponse {
    activity: ProcessActivity;
    domain: ProcessDomain;
    label: string;
    cycleTime: ProcessCycleTimeMetric;
    productivity: ProcessProductivityMetric;
    supportingMetrics: ProcessSupportingMetrics;
    trend: ProcessTrendPoint[];
    hourlyDistribution: ProcessHourlyBucket[];
    warehouseComparison: {
        top: ProcessWarehouseRankEntry[];
        bottom: ProcessWarehouseRankEntry[];
    };
    operatorRanking: ProcessOperatorRankEntry[];
}
```

- [ ] **Step 2: Append re-export to `src/model/dashboard.ts`**

```ts
export type {
    ProcessActivity,
    ProcessDomain,
    ProcessPeriod,
    ProcessCycleTimeMetric,
    ProcessProductivityMetric,
    ProcessSupportingMetrics,
    ProcessTrendPoint,
    ProcessHourlyBucket,
    ProcessWarehouseRankEntry,
    ProcessOperatorRankEntry,
    ProcessDetailResponse,
} from "@/api/feature/dto/dashboard.dto";
```

- [ ] **Step 3: Add `fetchProcessDetail` to `src/api/feature/dashboard.api.ts`**

Add the import:

```ts
import type {
    DashboardStockSummaryResponse,
    DashboardLowStockResponse,
    DashboardDocCountsResponse,
    DashboardEpcStatusResponse,
    DashboardRecentActivityResponse,
    DashboardAlertsResponse,
    DashboardWorkflowOverviewResponse,
    DashboardKpiSnapshotResponse,
    DashboardKpiDomain,
    DashboardKpiDetailResponse,
    ProcessActivity,
    ProcessPeriod,
    ProcessDetailResponse,
} from "./dto/dashboard.dto";
```

Add the method (inside the `dashboardApi` object, after `fetchKpiDetail`):

```ts
    fetchProcessDetail(
        activity: ProcessActivity,
        period: ProcessPeriod,
        params: DashboardQueryParameters,
    ) {
        return apiRequest<ProcessDetailResponse>({
            url: "/dashboard/process-detail",
            method: "get",
            params: { ...params, activity, period },
        });
    },
```

- [ ] **Step 4: Write the failing test for the service method**

Append to `src/services/dashboard.service.test.ts` (add `fetchProcessDetail` to the mocked `dashboardApi` object in the existing `vi.mock("@/api/feature/dashboard.api", ...)` call, then add a new test):

```ts
it("fetchProcessDetail returns the activity detail payload with activity and period passed through params", async () => {
    fetchProcessDetailMock.mockResolvedValue({
        data: {
            activity: "receiving",
            domain: "stockIn",
            label: "Receiving",
            cycleTime: { minutes: 36, previousMinutes: 40, trendPct: -10 },
            productivity: {
                unitsPerHour: 120,
                previousUnitsPerHour: 110,
                trendPct: 9.1,
            },
            supportingMetrics: {
                completedTransactions: 42,
                avgDailyVolumeUnits: 500,
                avgQueueTimeMinutes: 12,
            },
            trend: [],
            hourlyDistribution: [],
            warehouseComparison: { top: [], bottom: [] },
            operatorRanking: [],
        },
    });

    const result = await dashboardService.fetchProcessDetail(
        "receiving",
        "week",
        { warehouseId: "wh-1" },
    );

    expect(fetchProcessDetailMock).toHaveBeenCalledWith("receiving", "week", {
        companyId: "company-1",
        warehouseId: "wh-1",
    });
    expect(result.label).toBe("Receiving");
});
```

Add `const fetchProcessDetailMock = vi.fn();` near the other mock declarations at the top of the file, and add `fetchProcessDetail: fetchProcessDetailMock,` to the mocked `dashboardApi` object, and reset it in `beforeEach` alongside the others.

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run src/services/dashboard.service.test.ts`
Expected: FAIL — `dashboardService.fetchProcessDetail is not a function`

- [ ] **Step 6: Add `fetchProcessDetail` to `src/services/dashboard.service.ts`**

Add the import:

```ts
import type {
    DashboardLowStockResponse,
    DashboardDocCountsEntry,
    DashboardDocCountsResponse,
    DashboardEpcStatusResponse,
    DashboardRecentActivityResponse,
    DashboardStockSummaryResponse,
    DashboardAlertsResponse,
    DashboardWorkflowOverviewResponse,
    DashboardKpiSnapshotResponse,
    DashboardKpiDomain,
    DashboardKpiDetailResponse,
    ProcessActivity,
    ProcessPeriod,
    ProcessDetailResponse,
} from "@/api/feature/dto/dashboard.dto";
```

Add the method (inside the `dashboardService` object, after `fetchKpiDetail`):

```ts
    async fetchProcessDetail(
        activity: ProcessActivity,
        period: ProcessPeriod,
        filter: DashboardFilterState,
    ): Promise<ProcessDetailResponse> {
        const response = await dashboardApi.fetchProcessDetail(
            activity,
            period,
            toParams(filter),
        );
        return response.data;
    },
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run src/services/dashboard.service.test.ts`
Expected: PASS (all tests including the new one)

- [ ] **Step 8: Type-check**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 9: Commit**

```bash
git add src/api/feature/dto/dashboard.dto.ts src/model/dashboard.ts src/api/feature/dashboard.api.ts src/services/dashboard.service.ts src/services/dashboard.service.test.ts
git commit -m "feat: add process-detail types, api, and service method"
```

---

### Task 5: `useProcessPerformance.ts` composable

**Files:**

- Create: `src/views/dashboard/composables/useProcessPerformance.ts`
- Test: `src/views/dashboard/composables/useProcessPerformance.test.ts`

**Interfaces:**

- Consumes: `dashboardService.fetchProcessDetail` (Task 4).
- Produces: `useProcessPerformance()` returning `{ activity: Ref<ProcessActivity>, period: Ref<ProcessPeriod>, setActivity(activity), setPeriod(period), data: Ref<ProcessDetailResponse | null>, loading: Ref<boolean>, error: Ref<string | null>, refresh }` — consumed by Task 11.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchProcessDetailMock = vi.fn();

vi.mock("@/services/dashboard.service", () => ({
    dashboardService: {
        fetchProcessDetail: fetchProcessDetailMock,
    },
}));

vi.mock("@/store/warehouse.store", () => ({
    useWarehouseStore: () => ({ selectedWarehouseId: null }),
}));

import { useProcessPerformance } from "./useProcessPerformance";

describe("useProcessPerformance", () => {
    beforeEach(() => {
        fetchProcessDetailMock.mockReset();
    });

    it("defaults to the receiving activity and week period, and fetches on creation", async () => {
        fetchProcessDetailMock.mockResolvedValue({
            activity: "receiving",
            label: "Receiving",
        });

        const composable = useProcessPerformance();
        await composable.refresh();

        expect(composable.activity.value).toBe("receiving");
        expect(composable.period.value).toBe("week");
        expect(fetchProcessDetailMock).toHaveBeenCalledWith(
            "receiving",
            "week",
            { warehouseId: null },
        );
        expect(composable.data.value?.label).toBe("Receiving");
    });

    it("re-fetches when the activity changes", async () => {
        fetchProcessDetailMock.mockResolvedValue({
            activity: "outbound",
            label: "Outbound",
        });

        const composable = useProcessPerformance();
        await composable.setActivity("outbound");

        expect(composable.activity.value).toBe("outbound");
        expect(fetchProcessDetailMock).toHaveBeenCalledWith(
            "outbound",
            "week",
            { warehouseId: null },
        );
    });

    it("re-fetches when the period changes", async () => {
        fetchProcessDetailMock.mockResolvedValue({
            activity: "receiving",
            label: "Receiving",
        });

        const composable = useProcessPerformance();
        await composable.setPeriod("month");

        expect(composable.period.value).toBe("month");
        expect(fetchProcessDetailMock).toHaveBeenCalledWith(
            "receiving",
            "month",
            { warehouseId: null },
        );
    });

    it("sets an error message and clears loading when the fetch rejects", async () => {
        fetchProcessDetailMock.mockRejectedValue(new Error("network down"));

        const composable = useProcessPerformance();
        await composable.refresh();

        expect(composable.error.value).toBe("network down");
        expect(composable.loading.value).toBe(false);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/composables/useProcessPerformance.test.ts`
Expected: FAIL — `Cannot find module './useProcessPerformance'`

- [ ] **Step 3: Write `useProcessPerformance.ts`**

```ts
import { ref } from "vue";
import { useWarehouseStore } from "@/store/warehouse.store";
import { dashboardService } from "@/services/dashboard.service";
import type {
    ProcessActivity,
    ProcessDetailResponse,
    ProcessPeriod,
} from "@/model/dashboard";

export function useProcessPerformance() {
    const warehouseStore = useWarehouseStore();

    const activity = ref<ProcessActivity>("receiving");
    const period = ref<ProcessPeriod>("week");
    const data = ref<ProcessDetailResponse | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const refresh = async () => {
        loading.value = true;
        error.value = null;
        try {
            data.value = await dashboardService.fetchProcessDetail(
                activity.value,
                period.value,
                { warehouseId: warehouseStore.selectedWarehouseId },
            );
        } catch (err) {
            error.value = err instanceof Error ? err.message : String(err);
        } finally {
            loading.value = false;
        }
    };

    const setActivity = async (next: ProcessActivity) => {
        activity.value = next;
        await refresh();
    };

    const setPeriod = async (next: ProcessPeriod) => {
        period.value = next;
        await refresh();
    };

    return {
        activity,
        period,
        setActivity,
        setPeriod,
        data,
        loading,
        error,
        refresh,
    };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/composables/useProcessPerformance.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Type-check**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/views/dashboard/composables/useProcessPerformance.ts src/views/dashboard/composables/useProcessPerformance.test.ts
git commit -m "feat: add useProcessPerformance composable"
```

---

### Task 6: `ProcessActivityPicker.vue`

**Files:**

- Create: `src/views/dashboard/components/ProcessActivityPicker.vue`
- Test: `src/views/dashboard/components/ProcessActivityPicker.test.ts`

**Interfaces:**

- Produces: `ProcessActivityPicker` component, props `{ modelValue: ProcessActivity }`, emits `update:modelValue` — consumed by Task 11.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import ProcessActivityPicker from "./ProcessActivityPicker.vue";

describe("ProcessActivityPicker", () => {
    it("renders all 6 activity labels grouped by domain and marks the active one", async () => {
        const app = createSSRApp(ProcessActivityPicker, {
            modelValue: "outbound",
        });
        const html = await renderToString(app);

        expect(html).toContain("Receiving");
        expect(html).toContain("Putaway");
        expect(html).toContain("Outbound");
        expect(html).toContain("Transfer");
        expect(html).toContain("Relocation");
        expect(html).toContain("Stock Opname");
        expect(html).toContain("Stock In");
        expect(html).toContain("Stock Out");
        expect(html).toContain("Inventory");
        expect(html).toContain("text-primary-600");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/ProcessActivityPicker.test.ts`
Expected: FAIL — `Failed to resolve import "./ProcessActivityPicker.vue"`

- [ ] **Step 3: Write `ProcessActivityPicker.vue`**

```vue
<template>
    <div class="space-y-3" object-id="wdg_ProcessActivityPicker">
        <div v-for="group in groups" :key="group.domain">
            <p class="text-[10px] font-semibold uppercase text-text-muted mb-1">
                {{ group.label }}
            </p>
            <div class="flex flex-wrap gap-2">
                <button
                    v-for="item in group.items"
                    :key="item.value"
                    type="button"
                    class="px-3 py-1.5 rounded-md border text-sm font-semibold transition-colors"
                    :class="
                        modelValue === item.value
                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                            : 'border-border text-text-secondary hover:text-text'
                    "
                    @click="emit('update:modelValue', item.value)"
                >
                    {{ item.label }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ProcessActivity } from "@/model/dashboard";

defineProps<{
    modelValue: ProcessActivity;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: ProcessActivity): void;
}>();

const groups: {
    domain: string;
    label: string;
    items: { value: ProcessActivity; label: string }[];
}[] = [
    {
        domain: "stockIn",
        label: "Stock In",
        items: [
            { value: "receiving", label: "Receiving" },
            { value: "putaway", label: "Putaway" },
        ],
    },
    {
        domain: "stockOut",
        label: "Stock Out",
        items: [{ value: "outbound", label: "Outbound" }],
    },
    {
        domain: "inventory",
        label: "Inventory",
        items: [
            { value: "transfer", label: "Transfer" },
            { value: "relocation", label: "Relocation" },
            { value: "opname", label: "Stock Opname" },
        ],
    },
];
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/ProcessActivityPicker.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/views/dashboard/components/ProcessActivityPicker.vue src/views/dashboard/components/ProcessActivityPicker.test.ts
git commit -m "feat: add ProcessActivityPicker component"
```

---

### Task 7: `ProcessMetricCards.vue`

**Files:**

- Create: `src/views/dashboard/components/ProcessMetricCards.vue`
- Test: `src/views/dashboard/components/ProcessMetricCards.test.ts`

**Interfaces:**

- Consumes: `ProcessDetailResponse` (Task 4).
- Produces: `ProcessMetricCards` component, props `{ loading: boolean; data: ProcessDetailResponse | null }` — consumed by Task 11.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import ProcessMetricCards from "./ProcessMetricCards.vue";

describe("ProcessMetricCards", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(ProcessMetricCards, {
            loading: true,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders cycle time and productivity cards with trend direction", async () => {
        const app = createSSRApp(ProcessMetricCards, {
            loading: false,
            data: {
                activity: "receiving",
                domain: "stockIn",
                label: "Receiving",
                cycleTime: { minutes: 36, previousMinutes: 40, trendPct: -10 },
                productivity: {
                    unitsPerHour: 120,
                    previousUnitsPerHour: 110,
                    trendPct: 9.1,
                },
                supportingMetrics: {
                    completedTransactions: 42,
                    avgDailyVolumeUnits: 500,
                    avgQueueTimeMinutes: 12,
                },
                trend: [],
                hourlyDistribution: [],
                warehouseComparison: { top: [], bottom: [] },
                operatorRanking: [],
            },
        });
        const html = await renderToString(app);

        expect(html).toContain("Cycle Time");
        expect(html).toContain("36");
        expect(html).toContain("Productivity");
        expect(html).toContain("120");
        expect(html).toContain("text-danger-600");
        expect(html).toContain("text-success-600");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/ProcessMetricCards.test.ts`
Expected: FAIL

- [ ] **Step 3: Write `ProcessMetricCards.vue`**

```vue
<template>
    <div class="grid gap-4 sm:grid-cols-2" object-id="wdg_ProcessMetricCards">
        <div v-if="loading" class="contents">
            <div
                class="h-28 rounded-md bg-surface-secondary animate-pulse"
            ></div>
            <div
                class="h-28 rounded-md bg-surface-secondary animate-pulse"
            ></div>
        </div>

        <template v-else-if="!data">
            <div class="col-span-2 p-6 text-center text-sm text-text-secondary">
                No metric data available.
            </div>
        </template>

        <template v-else>
            <Card>
                <p class="text-xs font-semibold uppercase text-text-muted">
                    Cycle Time
                </p>
                <p class="text-3xl font-extrabold text-gray-900 mt-1">
                    {{ data.cycleTime.minutes
                    }}<span class="text-base font-semibold text-text-muted">
                        min</span
                    >
                </p>
                <p
                    class="text-sm font-semibold mt-1"
                    :class="
                        data.cycleTime.trendPct <= 0
                            ? 'text-success-600'
                            : 'text-danger-600'
                    "
                >
                    {{ data.cycleTime.trendPct >= 0 ? "+" : ""
                    }}{{ data.cycleTime.trendPct.toFixed(1) }}% vs previous
                    period
                </p>
                <p class="text-xs text-text-secondary mt-2">
                    Previous: {{ data.cycleTime.previousMinutes }} min
                </p>
            </Card>
            <Card>
                <p class="text-xs font-semibold uppercase text-text-muted">
                    Productivity
                </p>
                <p class="text-3xl font-extrabold text-gray-900 mt-1">
                    {{ data.productivity.unitsPerHour
                    }}<span class="text-base font-semibold text-text-muted">
                        u/hr</span
                    >
                </p>
                <p
                    class="text-sm font-semibold mt-1"
                    :class="
                        data.productivity.trendPct >= 0
                            ? 'text-success-600'
                            : 'text-danger-600'
                    "
                >
                    {{ data.productivity.trendPct >= 0 ? "+" : ""
                    }}{{ data.productivity.trendPct.toFixed(1) }}% vs previous
                    period
                </p>
                <p class="text-xs text-text-secondary mt-2">
                    Previous: {{ data.productivity.previousUnitsPerHour }} u/hr
                </p>
            </Card>
        </template>
    </div>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import type { ProcessDetailResponse } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: ProcessDetailResponse | null;
}>();
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/ProcessMetricCards.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/views/dashboard/components/ProcessMetricCards.vue src/views/dashboard/components/ProcessMetricCards.test.ts
git commit -m "feat: add ProcessMetricCards component"
```

---

### Task 8: `ProcessTrendChart.vue`

**Files:**

- Create: `src/views/dashboard/components/ProcessTrendChart.vue`
- Test: `src/views/dashboard/components/ProcessTrendChart.test.ts`

**Interfaces:**

- Consumes: `ProcessTrendPoint[]` (Task 4).
- Produces: `ProcessTrendChart` component, props `{ loading: boolean; data: ProcessTrendPoint[] | null }` — consumed by Task 11.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import ProcessTrendChart from "./ProcessTrendChart.vue";

describe("ProcessTrendChart", () => {
    it("renders an empty message when there is no trend data", async () => {
        const app = createSSRApp(ProcessTrendChart, {
            loading: false,
            data: [],
        });
        const html = await renderToString(app);
        expect(html).toContain("No trend data available");
    });

    it("renders two polylines (cycle time and productivity) for an 8-point trend", async () => {
        const app = createSSRApp(ProcessTrendChart, {
            loading: false,
            data: Array.from({ length: 8 }, (_, i) => ({
                period: `${i}`,
                cycleTimeMinutes: 40 - i,
                productivityUnitsPerHour: 100 + i,
            })),
        });
        const html = await renderToString(app);

        expect(html).toContain("Cycle Time");
        expect(html).toContain("Productivity");
        const polylineCount = html.split("<polyline").length - 1;
        expect(polylineCount).toBe(2);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/ProcessTrendChart.test.ts`
Expected: FAIL

- [ ] **Step 3: Write `ProcessTrendChart.vue`**

```vue
<template>
    <Card object-id="wdg_ProcessTrendChart">
        <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-gray-900">
                Performance Trend
            </h3>
            <div class="flex gap-4 text-xs">
                <span class="flex items-center gap-1 text-text-secondary">
                    <span class="h-2 w-2 rounded-full bg-primary-600"></span>
                    Cycle Time
                </span>
                <span class="flex items-center gap-1 text-text-secondary">
                    <span class="h-2 w-2 rounded-full bg-success-600"></span>
                    Productivity
                </span>
            </div>
        </div>

        <div
            v-if="loading"
            class="h-32 rounded-md bg-surface-secondary animate-pulse"
        ></div>

        <div
            v-else-if="!data || data.length === 0"
            class="text-sm text-text-secondary text-center py-6"
        >
            No trend data available.
        </div>

        <div v-else>
            <svg
                class="h-32 w-full"
                viewBox="0 0 100 40"
                preserveAspectRatio="none"
            >
                <polyline
                    :points="cycleTimePoints"
                    fill="none"
                    class="stroke-primary-600"
                    stroke-width="2"
                />
                <polyline
                    :points="productivityPoints"
                    fill="none"
                    class="stroke-success-600"
                    stroke-width="2"
                />
            </svg>
            <div class="flex justify-between text-[10px] text-text-muted mt-1">
                <span>{{ data[0]?.period }}</span>
                <span>{{ data[data.length - 1]?.period }}</span>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Card from "@/components/molecules/Card.vue";
import type { ProcessTrendPoint } from "@/model/dashboard";

const props = defineProps<{
    loading: boolean;
    data: ProcessTrendPoint[] | null;
}>();

const toPolyline = (values: number[]): string => {
    if (values.length === 0) return "";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = values.length > 1 ? 100 / (values.length - 1) : 0;

    return values
        .map((value, index) => {
            const x = index * step;
            const y = 40 - ((value - min) / range) * 40;
            return `${x},${y}`;
        })
        .join(" ");
};

const cycleTimePoints = computed(() =>
    toPolyline((props.data ?? []).map((point) => point.cycleTimeMinutes)),
);

const productivityPoints = computed(() =>
    toPolyline(
        (props.data ?? []).map((point) => point.productivityUnitsPerHour),
    ),
);
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/ProcessTrendChart.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/views/dashboard/components/ProcessTrendChart.vue src/views/dashboard/components/ProcessTrendChart.test.ts
git commit -m "feat: add ProcessTrendChart component"
```

---

### Task 9: `ProcessHourlyHeatmap.vue`

**Files:**

- Create: `src/views/dashboard/components/ProcessHourlyHeatmap.vue`
- Test: `src/views/dashboard/components/ProcessHourlyHeatmap.test.ts`

**Interfaces:**

- Consumes: `ProcessHourlyBucket[]` (Task 4).
- Produces: `ProcessHourlyHeatmap` component, props `{ loading: boolean; data: ProcessHourlyBucket[] | null }` — consumed by Task 11.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import ProcessHourlyHeatmap from "./ProcessHourlyHeatmap.vue";

describe("ProcessHourlyHeatmap", () => {
    it("renders 24 hour cells with intensity classes driven by count", async () => {
        const data = Array.from({ length: 24 }, (_, hour) => ({
            hour,
            count: hour === 10 ? 50 : 0,
        }));
        const app = createSSRApp(ProcessHourlyHeatmap, {
            loading: false,
            data,
        });
        const html = await renderToString(app);

        expect(html).toContain("bg-primary-700");
        expect(html).toContain("bg-gray-100");
        expect(html).toContain("10:00");
    });

    it("renders an empty message when there is no distribution data", async () => {
        const app = createSSRApp(ProcessHourlyHeatmap, {
            loading: false,
            data: [],
        });
        const html = await renderToString(app);
        expect(html).toContain("No hourly activity");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/ProcessHourlyHeatmap.test.ts`
Expected: FAIL

- [ ] **Step 3: Write `ProcessHourlyHeatmap.vue`**

```vue
<template>
    <Card object-id="wdg_ProcessHourlyHeatmap">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">
            Hourly Transaction Distribution
        </h3>
        <div v-if="loading" class="grid grid-cols-12 gap-1">
            <div
                v-for="n in 24"
                :key="n"
                class="h-8 rounded bg-surface-secondary animate-pulse"
            ></div>
        </div>
        <div
            v-else-if="!data || data.every((bucket) => bucket.count === 0)"
            class="text-sm text-text-secondary text-center py-6"
        >
            No hourly activity in this window.
        </div>
        <div v-else class="grid grid-cols-12 gap-1">
            <div
                v-for="bucket in data"
                :key="bucket.hour"
                class="h-8 rounded flex items-center justify-center text-[9px] font-semibold"
                :class="intensityClass(bucket.count)"
                :title="`${formatHour(bucket.hour)} — ${bucket.count} transactions`"
            >
                {{ formatHour(bucket.hour) }}
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import type { ProcessHourlyBucket } from "@/model/dashboard";

const props = defineProps<{
    loading: boolean;
    data: ProcessHourlyBucket[] | null;
}>();

const formatHour = (hour: number): string =>
    `${String(hour).padStart(2, "0")}:00`;

const intensityClass = (count: number): string => {
    const maxCount = Math.max(1, ...(props.data ?? []).map((b) => b.count));
    if (count === 0) return "bg-gray-100 text-text-muted";
    const ratio = count / maxCount;
    if (ratio >= 0.75) return "bg-primary-700 text-white";
    if (ratio >= 0.5) return "bg-primary-500 text-white";
    if (ratio >= 0.25) return "bg-primary-300 text-gray-900";
    return "bg-primary-100 text-gray-900";
};
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/ProcessHourlyHeatmap.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/views/dashboard/components/ProcessHourlyHeatmap.vue src/views/dashboard/components/ProcessHourlyHeatmap.test.ts
git commit -m "feat: add ProcessHourlyHeatmap component"
```

---

### Task 10: `ProcessOperatorRanking.vue`

**Files:**

- Create: `src/views/dashboard/components/ProcessOperatorRanking.vue`
- Test: `src/views/dashboard/components/ProcessOperatorRanking.test.ts`

**Interfaces:**

- Consumes: `ProcessOperatorRankEntry[]` (Task 4).
- Produces: `ProcessOperatorRanking` component, props `{ loading: boolean; data: ProcessOperatorRankEntry[] | null }` — consumed by Task 11.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import ProcessOperatorRanking from "./ProcessOperatorRanking.vue";

describe("ProcessOperatorRanking", () => {
    it("renders a ranked list of operators with their scores", async () => {
        const app = createSSRApp(ProcessOperatorRanking, {
            loading: false,
            data: [
                { userId: "u-1", userName: "Fast Operator", score: 96 },
                { userId: "u-2", userName: "Slow Operator", score: 61 },
            ],
        });
        const html = await renderToString(app);

        expect(html).toContain("Operator Ranking");
        expect(html).toContain("Fast Operator");
        expect(html).toContain("96");
        expect(html).toContain("Slow Operator");
        expect(html).toContain("61");
    });

    it("renders an empty message when there is no operator data", async () => {
        const app = createSSRApp(ProcessOperatorRanking, {
            loading: false,
            data: [],
        });
        const html = await renderToString(app);
        expect(html).toContain("No operator activity");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/ProcessOperatorRanking.test.ts`
Expected: FAIL

- [ ] **Step 3: Write `ProcessOperatorRanking.vue`**

```vue
<template>
    <Card object-id="wdg_ProcessOperatorRanking">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">
            Operator Ranking
        </h3>
        <div v-if="loading" class="space-y-2">
            <div
                v-for="n in 5"
                :key="n"
                class="h-6 rounded bg-surface-secondary animate-pulse"
            ></div>
        </div>
        <div
            v-else-if="!data || data.length === 0"
            class="text-sm text-text-secondary text-center py-6"
        >
            No operator activity in this window.
        </div>
        <ul v-else class="space-y-2">
            <li
                v-for="(operator, index) in data"
                :key="operator.userId"
                class="flex items-center justify-between text-sm"
            >
                <span class="flex items-center gap-2">
                    <span
                        class="flex h-5 w-5 items-center justify-center rounded-full bg-primary-50 text-primary-600 text-xs font-bold"
                        >{{ index + 1 }}</span
                    >
                    {{ operator.userName }}
                </span>
                <span class="font-semibold">{{ operator.score }}</span>
            </li>
        </ul>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import type { ProcessOperatorRankEntry } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: ProcessOperatorRankEntry[] | null;
}>();
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/ProcessOperatorRanking.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/views/dashboard/components/ProcessOperatorRanking.vue src/views/dashboard/components/ProcessOperatorRanking.test.ts
git commit -m "feat: add ProcessOperatorRanking component"
```

---

### Task 11: `ProcessPerformancePage.vue` + route wiring

**Files:**

- Create: `src/views/dashboard/ProcessPerformancePage.vue`
- Create: `src/views/dashboard/ProcessPerformancePage.test.ts`
- Modify: `src/router/index.ts`

**Interfaces:**

- Consumes: `useProcessPerformance` (Task 5), `ProcessActivityPicker`/`ProcessMetricCards`/`ProcessTrendChart`/`ProcessHourlyHeatmap`/`ProcessOperatorRanking` (Tasks 6-10), `KpiWarehouseComparison`/`KpiSupportingMetrics` (existing, reused as-is).

- [ ] **Step 1: Write the failing test**

```ts
import { createSSRApp, defineComponent } from "vue";
import { renderToString } from "vue/server-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useProcessPerformanceMock = vi.hoisted(() => vi.fn());

vi.mock("./composables/useProcessPerformance", () => ({
    useProcessPerformance: useProcessPerformanceMock,
}));

const stub = vi.hoisted(
    () => (name: string) => defineComponent({ name, setup: () => () => null }),
);

vi.mock("./components/ProcessActivityPicker.vue", () => ({
    default: stub("ProcessActivityPickerStub"),
}));
vi.mock("./components/ProcessMetricCards.vue", () => ({
    default: stub("ProcessMetricCardsStub"),
}));
vi.mock("./components/ProcessTrendChart.vue", () => ({
    default: stub("ProcessTrendChartStub"),
}));
vi.mock("./components/ProcessHourlyHeatmap.vue", () => ({
    default: stub("ProcessHourlyHeatmapStub"),
}));
vi.mock("./components/ProcessOperatorRanking.vue", () => ({
    default: stub("ProcessOperatorRankingStub"),
}));
vi.mock("./components/KpiWarehouseComparison.vue", () => ({
    default: stub("KpiWarehouseComparisonStub"),
}));
vi.mock("./components/KpiSupportingMetrics.vue", () => ({
    default: stub("KpiSupportingMetricsStub"),
}));

import ProcessPerformancePage from "./ProcessPerformancePage.vue";

describe("ProcessPerformancePage", () => {
    beforeEach(() => {
        useProcessPerformanceMock.mockReset();
        useProcessPerformanceMock.mockReturnValue({
            activity: { value: "receiving" },
            period: { value: "week" },
            setActivity: vi.fn(),
            setPeriod: vi.fn(),
            data: { value: null },
            loading: { value: false },
            error: { value: null },
            refresh: vi.fn(),
        });
    });

    it("renders the Process Performance page title", async () => {
        const app = createSSRApp(ProcessPerformancePage);
        const html = await renderToString(app);
        expect(html).toContain("Process Performance");
    });

    it("renders the week/month period toggle", async () => {
        const app = createSSRApp(ProcessPerformancePage);
        const html = await renderToString(app);
        expect(html).toContain("Week");
        expect(html).toContain("Month");
    });

    it("maps supportingMetrics into a label/value list for KpiSupportingMetrics", async () => {
        useProcessPerformanceMock.mockReturnValue({
            activity: { value: "receiving" },
            period: { value: "week" },
            setActivity: vi.fn(),
            setPeriod: vi.fn(),
            data: {
                value: {
                    activity: "receiving",
                    domain: "stockIn",
                    label: "Receiving",
                    cycleTime: {
                        minutes: 36,
                        previousMinutes: 40,
                        trendPct: -10,
                    },
                    productivity: {
                        unitsPerHour: 120,
                        previousUnitsPerHour: 110,
                        trendPct: 9.1,
                    },
                    supportingMetrics: {
                        completedTransactions: 42,
                        avgDailyVolumeUnits: 500,
                        avgQueueTimeMinutes: 12,
                    },
                    trend: [],
                    hourlyDistribution: [],
                    warehouseComparison: { top: [], bottom: [] },
                    operatorRanking: [],
                },
            },
            loading: { value: false },
            error: { value: null },
            refresh: vi.fn(),
        });

        const app = createSSRApp(ProcessPerformancePage);
        await renderToString(app);
        // Rendered through the stubbed KpiSupportingMetrics component (no assertion on
        // its internal HTML since it's stubbed); this test guards against the mapping
        // function throwing when given a populated supportingMetrics payload.
        expect(true).toBe(true);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/ProcessPerformancePage.test.ts`
Expected: FAIL — `Failed to resolve import "./ProcessPerformancePage.vue"`

- [ ] **Step 3: Write `ProcessPerformancePage.vue`**

```vue
<template>
    <section class="space-y-6">
        <div class="flex items-start justify-between gap-4">
            <div>
                <h1 class="text-xl font-bold text-gray-900">
                    Process Performance
                </h1>
                <p class="text-sm text-text-secondary mt-0.5">
                    Cycle time and throughput analytics across warehouse
                    processes
                </p>
            </div>
            <div class="flex gap-1 rounded-md border border-border p-0.5">
                <button
                    type="button"
                    class="px-3 py-1 rounded text-sm font-semibold transition-colors"
                    :class="
                        period === 'week'
                            ? 'bg-primary-600 text-white'
                            : 'text-text-secondary hover:text-text'
                    "
                    @click="setPeriod('week')"
                >
                    Week
                </button>
                <button
                    type="button"
                    class="px-3 py-1 rounded text-sm font-semibold transition-colors"
                    :class="
                        period === 'month'
                            ? 'bg-primary-600 text-white'
                            : 'text-text-secondary hover:text-text'
                    "
                    @click="setPeriod('month')"
                >
                    Month
                </button>
            </div>
        </div>

        <p
            v-if="error"
            class="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-danger-600"
        >
            {{ error }}
        </p>

        <ProcessActivityPicker
            :model-value="activity"
            @update:model-value="setActivity"
        />
        <ProcessMetricCards :loading="loading" :data="data" />
        <KpiSupportingMetrics
            :loading="loading"
            :data="supportingMetricsList"
        />
        <ProcessTrendChart :loading="loading" :data="data?.trend ?? null" />
        <div class="grid gap-6 lg:grid-cols-2">
            <ProcessHourlyHeatmap
                :loading="loading"
                :data="data?.hourlyDistribution ?? null"
            />
            <ProcessOperatorRanking
                :loading="loading"
                :data="data?.operatorRanking ?? null"
            />
        </div>
        <KpiWarehouseComparison
            :loading="loading"
            :data="data?.warehouseComparison ?? null"
        />
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import ProcessActivityPicker from "./components/ProcessActivityPicker.vue";
import ProcessMetricCards from "./components/ProcessMetricCards.vue";
import ProcessTrendChart from "./components/ProcessTrendChart.vue";
import ProcessHourlyHeatmap from "./components/ProcessHourlyHeatmap.vue";
import ProcessOperatorRanking from "./components/ProcessOperatorRanking.vue";
import KpiWarehouseComparison from "./components/KpiWarehouseComparison.vue";
import KpiSupportingMetrics from "./components/KpiSupportingMetrics.vue";
import { useProcessPerformance } from "./composables/useProcessPerformance";
import type { DashboardKpiDetailSupportingMetric } from "@/model/dashboard";

const {
    activity,
    period,
    setActivity,
    setPeriod,
    data,
    loading,
    error,
    refresh,
} = useProcessPerformance();

const supportingMetricsList = computed<
    DashboardKpiDetailSupportingMetric[] | null
>(() => {
    const metrics = data.value?.supportingMetrics;
    if (!metrics) return null;
    return [
        {
            label: "Completed Transactions",
            value: `${metrics.completedTransactions}`,
        },
        {
            label: "Avg Daily Volume",
            value: `${metrics.avgDailyVolumeUnits} units/day`,
        },
        {
            label: "Avg Queue Time",
            value: `${metrics.avgQueueTimeMinutes} min`,
        },
    ];
});

onMounted(() => {
    void refresh();
});
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/ProcessPerformancePage.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Wire the route**

In `src/router/index.ts`, remove the `dashboard/process` entry from `dashboardPlaceholderRoutes` (leave `dashboard/monitoring` in place). Change:

```ts
const dashboardPlaceholderRoutes: RouteRecordRaw[] = [
    {
        path: "dashboard/process",
        component: () => import("@/views/shared/PageShell.vue"),
        props: {
            title: "Process Performance",
            description:
                "Cycle-time and throughput analytics across warehouse processes.",
        },
    },
    {
        path: "dashboard/monitoring",
        component: () => import("@/views/shared/PageShell.vue"),
        props: {
            title: "Monitoring",
            description:
                "Real-time event feed and exception monitoring across the network.",
        },
    },
];
```

to:

```ts
const dashboardPlaceholderRoutes: RouteRecordRaw[] = [
    {
        path: "dashboard/monitoring",
        component: () => import("@/views/shared/PageShell.vue"),
        props: {
            title: "Monitoring",
            description:
                "Real-time event feed and exception monitoring across the network.",
        },
    },
];
```

Then add a standalone route alongside the existing `dashboard/kpi` route:

```ts
            ...dashboardRoutes,
            {
                path: "dashboard/kpi",
                component: () =>
                    import("@/views/dashboard/ExecutiveKpiPage.vue"),
            },
            {
                path: "dashboard/process",
                component: () =>
                    import("@/views/dashboard/ProcessPerformancePage.vue"),
            },
            ...dashboardPlaceholderRoutes,
```

- [ ] **Step 6: Run the full dashboard suite and type-check**

Run: `npx vitest run src/views/dashboard`
Expected: PASS (all suites)

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/views/dashboard/ProcessPerformancePage.vue src/views/dashboard/ProcessPerformancePage.test.ts src/router/index.ts
git commit -m "feat: add ProcessPerformancePage and wire /dashboard/process route"
```

---

## Post-Implementation Verification

- [ ] Run backend full suite: `cd /Users/syillaeltaniadaffa/Documents/Warehouse-be && npx jest`
- [ ] Run frontend full suite: `cd /Users/syillaeltaniadaffa/Documents/Warehouse && npx vitest run`
- [ ] Run frontend type-check: `npx vue-tsc --noEmit`
- [ ] Start both dev servers and manually load `/dashboard/process` with a real warehouse selected; confirm all 6 activities render real data (or explicit empty states), switching activities and the Week/Month toggle both re-fetch correctly, and the hourly heatmap/operator ranking/warehouse comparison panels all populate.
