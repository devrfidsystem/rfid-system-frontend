# Executive KPI Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/dashboard/kpi` Executive KPI page — domain drill-down (Stock In / Inventory / Stock Out) with hero score + 8-week timeline, per-warehouse ranking, sub-process contributors, and supporting metrics — per `docs/spark/specs/2026-07-19-executive-kpi-page-design.md`.

**Architecture:** Backend (`Warehouse-be`) adds a new `GET /dashboard/kpi-detail?domain=...` endpoint backed by a new `DashboardKpiDetailService`, reusing the pure scoring functions from `dashboard-kpi.util.ts` and following the exact query/window patterns already established in `dashboard-kpi.service.ts`. Frontend (`Warehouse`) adds a new page (`ExecutiveKpiPage.vue`), composable, and 5 components, replacing the `/dashboard/kpi` route's current `PageShell` placeholder.

## Global Constraints

- No cron/scheduler — computed synchronously per request, same as all other dashboard endpoints.
- Response envelope: `successResponse(data)`; decorators `@ApiBearerAuthProtected()` + `@ApiStandardOkResponse(...)`.
- Manual `companyId`/`warehouseId` where-clause scoping (no automatic tenant guard).
- Frontend: match the existing Tailwind design system. Only use color tokens already confirmed real: `gray`, `primary` (50-900), `success`/`warning`/`danger`/`info` (50/500/600 only), `surface`, `surface-secondary`, `border`, `text`, `text-secondary`, `text-muted`, or plain Tailwind defaults. Never use `bg-workspace-bg`, `border-border-default`, `text-action-orange`, `text-signal-red`, `text-text-tertiary`, `bg-primary-light` — these are confirmed dead (removed from `tailwind.config.ts`, compile to nothing).
- No charting library (Chart.js, etc.) — timeline is a plain inline SVG polyline, same technique as `DashboardKpiSnapshot.vue`'s sparkline.
- This sub-project depends on `PutawayDoc` and `DocStatusHistory` wiring for Putaway, which exist only in the user's own uncommitted working-tree state — accepted as a known, already-documented constraint (do not attempt to fix or work around it).

---

## Backend Tasks (`/Users/syillaeltaniadaffa/Documents/Warehouse-be`)

### Task 1: `dashboard-kpi-detail.types.ts` + extend `dashboard-kpi.util.ts`

**Files:**

- Create: `src/modules/warehouse/dashboard/dashboard-kpi-detail.types.ts`
- Modify: `src/modules/warehouse/dashboard/dashboard-kpi.util.ts`
- Test: `src/modules/warehouse/dashboard/dashboard-kpi.util.spec.ts` (extend existing file)

**Interfaces:**

- Produces: `DashboardKpiDomain` (`'stockIn' | 'inventory' | 'stockOut'`), `DashboardKpiTimelinePoint`, `DashboardKpiWarehouseRankEntry`, `DashboardKpiContributor`, `DashboardKpiDetailResponse` types; `computeContributorSplit(a: number, b: number): [number, number]` pure function — consumed by Task 2.

- [ ] **Step 1: Write the failing test for `computeContributorSplit`**

Add to `src/modules/warehouse/dashboard/dashboard-kpi.util.spec.ts` (append a new `describe` block after the existing ones):

```ts
describe("computeContributorSplit", () => {
    it("splits proportionally to the two inputs", () => {
        const [a, b] = computeContributorSplit(60, 40);
        expect(a).toBe(60);
        expect(b).toBe(40);
    });

    it("rounds to whole percentages summing to 100", () => {
        const [a, b] = computeContributorSplit(1, 2);
        expect(a + b).toBe(100);
        expect(a).toBe(33);
        expect(b).toBe(67);
    });

    it("falls back to an even 50/50 split when both inputs are zero", () => {
        const [a, b] = computeContributorSplit(0, 0);
        expect(a).toBe(50);
        expect(b).toBe(50);
    });
});
```

Update the top of the spec file's import to include `computeContributorSplit`:

```ts
import {
    clampScore,
    computePctChange,
    computeThroughputScore,
    computeInventoryScore,
    computeContributorSplit,
} from "./dashboard-kpi.util";
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-kpi.util.spec.ts`
Expected: FAIL — `computeContributorSplit is not a function` (or `TS2305: Module has no exported member`)

- [ ] **Step 3: Add `computeContributorSplit` to `dashboard-kpi.util.ts`**

Append to the end of the file:

```ts
export function computeContributorSplit(
    a: number,
    b: number,
): [number, number] {
    const total = a + b;
    if (total === 0) return [50, 50];
    const pctA = Math.round((a / total) * 100);
    return [pctA, 100 - pctA];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-kpi.util.spec.ts`
Expected: PASS (all tests, including the 3 new ones)

- [ ] **Step 5: Create `dashboard-kpi-detail.types.ts`**

```ts
export type DashboardKpiDomain = "stockIn" | "inventory" | "stockOut";

export interface DashboardKpiTimelinePoint {
    period: string;
    score: number;
}

export interface DashboardKpiWarehouseRankEntry {
    warehouseId: string;
    warehouseName: string;
    score: number;
}

export interface DashboardKpiContributor {
    label: string;
    pct: number;
}

export interface DashboardKpiDetailSupportingMetric {
    label: string;
    value: string;
}

export interface DashboardKpiDetailResponse {
    domain: DashboardKpiDomain;
    label: string;
    derivedFrom: string;
    score: number;
    previousScore: number;
    trendVsPrevious: number;
    timeline: DashboardKpiTimelinePoint[];
    warehouseComparison: {
        top: DashboardKpiWarehouseRankEntry[];
        bottom: DashboardKpiWarehouseRankEntry[];
    };
    contributors: DashboardKpiContributor[];
    supportingMetrics: DashboardKpiDetailSupportingMetric[];
}
```

- [ ] **Step 6: Commit**

```bash
git add src/modules/warehouse/dashboard/dashboard-kpi-detail.types.ts src/modules/warehouse/dashboard/dashboard-kpi.util.ts src/modules/warehouse/dashboard/dashboard-kpi.util.spec.ts
git commit -m "feat: add computeContributorSplit and Executive KPI detail types"
```

---

### Task 2: `DashboardKpiDetailService`

**Files:**

- Create: `src/modules/warehouse/dashboard/dashboard-kpi-detail.service.ts`
- Test: `src/modules/warehouse/dashboard/dashboard-kpi-detail.service.spec.ts`

**Interfaces:**

- Consumes: `PrismaService`, `computeThroughputScore`/`computeInventoryScore`/`computeContributorSplit`/`clampScore` (Task 1 + existing `dashboard-kpi.util.ts`), `DashboardKpiDomain`/`DashboardKpiDetailResponse` (Task 1).
- Produces: `DashboardKpiDetailService.getKpiDetail(domain: DashboardKpiDomain, query: DashboardQueryDto): Promise<DashboardKpiDetailResponse>` — consumed by Task 3.

- [ ] **Step 1: Write the failing test**

```ts
import { Test, TestingModule } from "@nestjs/testing";
import { DashboardKpiDetailService } from "./dashboard-kpi-detail.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";

describe("DashboardKpiDetailService", () => {
    let service: DashboardKpiDetailService;

    const mockPrismaService: any = {
        stockLedger: {
            aggregate: jest
                .fn()
                .mockResolvedValue({ _sum: { qty_in: 0, qty_out: 0 } }),
        },
        inboundDoc: { findMany: jest.fn().mockResolvedValue([]) },
        outboundDoc: { findMany: jest.fn().mockResolvedValue([]) },
        putawayDoc: { findMany: jest.fn().mockResolvedValue([]) },
        opnameLine: { findMany: jest.fn().mockResolvedValue([]) },
        warehouse: { findMany: jest.fn().mockResolvedValue([]) },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardKpiDetailService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<DashboardKpiDetailService>(
            DashboardKpiDetailService,
        );
    });

    afterEach(() => jest.clearAllMocks());

    it("returns a stockIn detail response with an 8-point timeline and correct label/derivedFrom", async () => {
        const result = await service.getKpiDetail("stockIn", {
            page: 1,
            limit: 20,
        } as any);

        expect(result.domain).toBe("stockIn");
        expect(result.label).toBe("Stock In Performance");
        expect(result.derivedFrom).toBe("Receiving and Putaway");
        expect(result.timeline).toHaveLength(8);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
    });

    it("returns stockOut contributors as a single 100% Outbound entry", async () => {
        const result = await service.getKpiDetail("stockOut", {
            page: 1,
            limit: 20,
        } as any);

        expect(result.domain).toBe("stockOut");
        expect(result.derivedFrom).toBe("Outbound");
        expect(result.contributors).toEqual([{ label: "Outbound", pct: 100 }]);
    });

    it("returns inventory contributors as an even 50/50 Accuracy vs Turnover split", async () => {
        const result = await service.getKpiDetail("inventory", {
            page: 1,
            limit: 20,
        } as any);

        expect(result.domain).toBe("inventory");
        expect(result.contributors).toEqual([
            { label: "Accuracy", pct: 50 },
            { label: "Turnover", pct: 50 },
        ]);
    });

    it("excludes idle warehouses (no activity) from warehouse comparison ranking", async () => {
        mockPrismaService.warehouse.findMany.mockResolvedValueOnce([
            { id: "wh-1", name: "Active Warehouse" },
            { id: "wh-2", name: "Idle Warehouse" },
        ]);
        mockPrismaService.stockLedger.aggregate.mockImplementation(
            (args: any) => {
                if (args.where.warehouseId === "wh-1") {
                    return Promise.resolve({
                        _sum: { qty_in: 100, qty_out: 0 },
                    });
                }
                return Promise.resolve({ _sum: { qty_in: 0, qty_out: 0 } });
            },
        );

        const result = await service.getKpiDetail("stockIn", {
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-kpi-detail.service.spec.ts`
Expected: FAIL — `Cannot find module './dashboard-kpi-detail.service'`

- [ ] **Step 3: Write `dashboard-kpi-detail.service.ts`**

```ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import type { DashboardQueryDto } from "./dto/dashboard-query.dto";
import {
    clampScore,
    computeContributorSplit,
    computeInventoryScore,
    computeThroughputScore,
} from "./dashboard-kpi.util";
import type {
    DashboardKpiDetailResponse,
    DashboardKpiDomain,
    DashboardKpiTimelinePoint,
    DashboardKpiWarehouseRankEntry,
} from "./dashboard-kpi-detail.types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const TIMELINE_WEEKS = 8;

const DOMAIN_LABEL: Record<DashboardKpiDomain, string> = {
    stockIn: "Stock In Performance",
    inventory: "Inventory Performance",
    stockOut: "Stock Out Performance",
};

const DOMAIN_DERIVED_FROM: Record<DashboardKpiDomain, string> = {
    stockIn: "Receiving and Putaway",
    inventory: "Opname and Stock Movement",
    stockOut: "Outbound",
};

@Injectable()
export class DashboardKpiDetailService {
    constructor(private readonly prisma: PrismaService) {}

    async getKpiDetail(
        domain: DashboardKpiDomain,
        query: DashboardQueryDto,
    ): Promise<DashboardKpiDetailResponse> {
        const currentWindow = this.windowBounds(1, 0);
        const previousWindow = this.windowBounds(2, 1);

        const [score, previousScore] = await Promise.all([
            this.computeDomainScore(domain, currentWindow, query),
            this.computeDomainScore(domain, previousWindow, query),
        ]);

        const [timeline, warehouseComparison, contributors, supportingMetrics] =
            await Promise.all([
                this.buildTimeline(domain, query),
                this.buildWarehouseComparison(domain, query),
                this.buildContributors(domain, currentWindow, query),
                this.buildSupportingMetrics(domain, currentWindow, query),
            ]);

        return {
            domain,
            label: DOMAIN_LABEL[domain],
            derivedFrom: DOMAIN_DERIVED_FROM[domain],
            score,
            previousScore,
            trendVsPrevious: score - previousScore,
            timeline,
            warehouseComparison,
            contributors,
            supportingMetrics,
        };
    }

    private windowBounds(weeksAgoStart: number, weeksAgoEnd: number) {
        const now = Date.now();
        return {
            gte: new Date(now - weeksAgoStart * WEEK_MS),
            lt: new Date(now - weeksAgoEnd * WEEK_MS),
        };
    }

    private async sumLedgerQty(
        movementType: "inbound" | "outbound",
        range: { gte: Date; lt: Date },
        query: DashboardQueryDto,
        warehouseIdOverride?: string,
    ): Promise<number> {
        const where: {
            movementType: string;
            createdAt: { gte: Date; lt: Date };
            company_id?: string;
            warehouseId?: string;
        } = {
            movementType,
            createdAt: range,
        };
        if (query.companyId) where.company_id = query.companyId;
        const warehouseId = warehouseIdOverride ?? query.warehouseId;
        if (warehouseId) where.warehouseId = warehouseId;

        const result = await this.prisma.stockLedger.aggregate({
            where,
            _sum: { qty_in: true, qty_out: true },
        });
        const field =
            movementType === "inbound"
                ? result._sum.qty_in
                : result._sum.qty_out;
        return field ? Number(field) : 0;
    }

    private async cycleStats(
        docType: "inbound" | "outbound" | "putaway",
        range: { gte: Date; lt: Date },
        query: DashboardQueryDto,
    ): Promise<{ avgCycleHours: number; docCount: number }> {
        const where: {
            status: string;
            updatedAt: { gte: Date; lt: Date };
            companyId?: string;
            warehouse_id?: string;
        } = {
            status: docType === "putaway" ? "done" : "posted",
            updatedAt: range,
        };
        if (query.companyId) where.companyId = query.companyId;
        if (query.warehouseId) where.warehouse_id = query.warehouseId;

        const docs =
            docType === "inbound"
                ? await this.prisma.inboundDoc.findMany({
                      where,
                      select: { createdAt: true, updatedAt: true },
                  })
                : docType === "outbound"
                  ? await this.prisma.outboundDoc.findMany({
                        where,
                        select: { createdAt: true, updatedAt: true },
                    })
                  : await this.prisma.putawayDoc.findMany({
                        where,
                        select: { createdAt: true, updatedAt: true },
                    });

        const durations = docs
            .filter((d) => d.createdAt && d.updatedAt)
            .map(
                (d) =>
                    (new Date(d.updatedAt as Date).getTime() -
                        new Date(d.createdAt as Date).getTime()) /
                    (1000 * 60 * 60),
            );

        return {
            avgCycleHours:
                durations.length === 0
                    ? 0
                    : durations.reduce((acc, h) => acc + h, 0) /
                      durations.length,
            docCount: docs.length,
        };
    }

    private async computeDomainScore(
        domain: DashboardKpiDomain,
        window: { gte: Date; lt: Date },
        query: DashboardQueryDto,
    ): Promise<number> {
        if (domain === "stockIn" || domain === "stockOut") {
            const movementType = domain === "stockIn" ? "inbound" : "outbound";
            const previousWindow = {
                gte: new Date(window.gte.getTime() - WEEK_MS),
                lt: window.gte,
            };
            const [currentQty, previousQty, currentCycle, previousCycle] =
                await Promise.all([
                    this.sumLedgerQty(movementType, window, query),
                    this.sumLedgerQty(movementType, previousWindow, query),
                    this.cycleStats(movementType, window, query),
                    this.cycleStats(movementType, previousWindow, query),
                ]);
            return computeThroughputScore(
                currentQty,
                previousQty,
                currentCycle.avgCycleHours,
                previousCycle.avgCycleHours,
            ).score;
        }

        const opnameWhere: {
            doc: { companyId?: string; warehouse_id?: string };
        } = { doc: {} };
        if (query.companyId) opnameWhere.doc.companyId = query.companyId;
        if (query.warehouseId) opnameWhere.doc.warehouse_id = query.warehouseId;

        const [lines, currentOut, previousOut] = await Promise.all([
            this.prisma.opnameLine.findMany({
                where: { ...opnameWhere, created_at: window },
                select: { system_qty: true, variance_qty: true },
            }),
            this.sumLedgerQty("outbound", window, query),
            this.sumLedgerQty(
                "outbound",
                {
                    gte: new Date(window.gte.getTime() - WEEK_MS),
                    lt: window.gte,
                },
                query,
            ),
        ]);
        const systemTotal = lines.reduce(
            (acc, l) => acc + Number(l.system_qty),
            0,
        );
        const varianceTotal = lines.reduce(
            (acc, l) => acc + Math.abs(Number(l.variance_qty)),
            0,
        );
        const varianceRatio =
            systemTotal === 0 ? 0 : varianceTotal / systemTotal;
        return clampScore(
            computeInventoryScore(varianceRatio, currentOut, previousOut).score,
        );
    }

    private async buildTimeline(
        domain: DashboardKpiDomain,
        query: DashboardQueryDto,
    ): Promise<DashboardKpiTimelinePoint[]> {
        const weeksAgoList = Array.from(
            { length: TIMELINE_WEEKS },
            (_, i) => TIMELINE_WEEKS - 1 - i,
        );
        const scores = await Promise.all(
            weeksAgoList.map((weeksAgo) =>
                this.computeDomainScore(
                    domain,
                    this.windowBounds(weeksAgo + 1, weeksAgo),
                    query,
                ),
            ),
        );
        return weeksAgoList.map((weeksAgo, index) => ({
            period: weeksAgo === 0 ? "This week" : `${weeksAgo}w ago`,
            score: scores[index],
        }));
    }

    private async buildWarehouseComparison(
        domain: DashboardKpiDomain,
        query: DashboardQueryDto,
    ): Promise<{
        top: DashboardKpiWarehouseRankEntry[];
        bottom: DashboardKpiWarehouseRankEntry[];
    }> {
        const warehouseWhere: { companyId?: string } = {};
        if (query.companyId) warehouseWhere.companyId = query.companyId;

        const warehouses = await this.prisma.warehouse.findMany({
            where: warehouseWhere,
            select: { id: true, name: true },
        });

        const currentWindow = this.windowBounds(1, 0);
        const entries: DashboardKpiWarehouseRankEntry[] = [];

        for (const warehouse of warehouses) {
            const scopedQuery = { ...query, warehouseId: warehouse.id };
            const hasActivity = await this.warehouseHasActivity(
                domain,
                currentWindow,
                scopedQuery,
            );
            if (!hasActivity) continue;
            const score = await this.computeDomainScore(
                domain,
                currentWindow,
                scopedQuery,
            );
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

    private async warehouseHasActivity(
        domain: DashboardKpiDomain,
        window: { gte: Date; lt: Date },
        query: DashboardQueryDto,
    ): Promise<boolean> {
        if (domain === "stockIn" || domain === "stockOut") {
            const qty = await this.sumLedgerQty(
                domain === "stockIn" ? "inbound" : "outbound",
                window,
                query,
            );
            return qty > 0;
        }
        const opnameWhere: {
            doc: { companyId?: string; warehouse_id?: string };
        } = { doc: {} };
        if (query.companyId) opnameWhere.doc.companyId = query.companyId;
        if (query.warehouseId) opnameWhere.doc.warehouse_id = query.warehouseId;
        const count = await this.prisma.opnameLine.findMany({
            where: { ...opnameWhere, created_at: window },
            select: { id: true },
        });
        return count.length > 0;
    }

    private async buildContributors(
        domain: DashboardKpiDomain,
        window: { gte: Date; lt: Date },
        query: DashboardQueryDto,
    ) {
        if (domain === "stockOut") {
            return [{ label: "Outbound", pct: 100 }];
        }
        if (domain === "inventory") {
            return [
                { label: "Accuracy", pct: 50 },
                { label: "Turnover", pct: 50 },
            ];
        }
        const [receiving, putaway] = await Promise.all([
            this.cycleStats("inbound", window, query),
            this.cycleStats("putaway", window, query),
        ]);
        const [receivingPct, putawayPct] = computeContributorSplit(
            receiving.docCount,
            putaway.docCount,
        );
        return [
            { label: "Receiving", pct: receivingPct },
            { label: "Putaway", pct: putawayPct },
        ];
    }

    private async buildSupportingMetrics(
        domain: DashboardKpiDomain,
        window: { gte: Date; lt: Date },
        query: DashboardQueryDto,
    ) {
        const windowHours =
            (window.lt.getTime() - window.gte.getTime()) / (1000 * 60 * 60);

        if (domain === "stockOut") {
            const [cycle, qty] = await Promise.all([
                this.cycleStats("outbound", window, query),
                this.sumLedgerQty("outbound", window, query),
            ]);
            return [
                {
                    label: "Outbound — Avg Cycle Time",
                    value: `${cycle.avgCycleHours.toFixed(1)}h`,
                },
                {
                    label: "Outbound — Productivity",
                    value: `${Math.round(qty / windowHours)} u/hr`,
                },
            ];
        }

        if (domain === "inventory") {
            const opnameWhere: {
                doc: { companyId?: string; warehouse_id?: string };
            } = { doc: {} };
            if (query.companyId) opnameWhere.doc.companyId = query.companyId;
            if (query.warehouseId)
                opnameWhere.doc.warehouse_id = query.warehouseId;
            const lines = await this.prisma.opnameLine.findMany({
                where: { ...opnameWhere, created_at: window },
                select: { system_qty: true, variance_qty: true },
            });
            const systemTotal = lines.reduce(
                (acc, l) => acc + Number(l.system_qty),
                0,
            );
            const varianceTotal = lines.reduce(
                (acc, l) => acc + Math.abs(Number(l.variance_qty)),
                0,
            );
            const accuracyPct =
                systemTotal === 0
                    ? 100
                    : clampScore(100 - (varianceTotal / systemTotal) * 100);
            const outboundQty = await this.sumLedgerQty(
                "outbound",
                window,
                query,
            );
            return [
                {
                    label: "Inventory Accuracy",
                    value: `${accuracyPct.toFixed(1)}%`,
                },
                {
                    label: "Turnover Rate",
                    value: `${Math.round(outboundQty / windowHours)} u/hr`,
                },
            ];
        }

        const [receiving, putaway, receivingQty] = await Promise.all([
            this.cycleStats("inbound", window, query),
            this.cycleStats("putaway", window, query),
            this.sumLedgerQty("inbound", window, query),
        ]);
        return [
            {
                label: "Receiving — Avg Cycle Time",
                value: `${receiving.avgCycleHours.toFixed(1)}h`,
            },
            {
                label: "Putaway — Avg Cycle Time",
                value: `${putaway.avgCycleHours.toFixed(1)}h`,
            },
            {
                label: "Receiving — Productivity",
                value: `${Math.round(receivingQty / windowHours)} u/hr`,
            },
        ];
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-kpi-detail.service.spec.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/modules/warehouse/dashboard/dashboard-kpi-detail.service.ts src/modules/warehouse/dashboard/dashboard-kpi-detail.service.spec.ts
git commit -m "feat: add DashboardKpiDetailService for domain drill-down"
```

---

### Task 3: `GET /dashboard/kpi-detail` endpoint + DTO validation

**Files:**

- Create: `src/modules/warehouse/dashboard/dto/dashboard-kpi-detail-query.dto.ts`
- Modify: `src/modules/warehouse/dashboard/dashboard.controller.ts`
- Modify: `src/modules/warehouse/dashboard/dashboard.module.ts`
- Test: no new test file — this route is a thin wrapper; the whole-branch/manual smoke test covers it, consistent with how `kpiSnapshot`/`workflowOverview` routes were added without their own controller-level test.

**Interfaces:**

- Consumes: `DashboardKpiDetailService.getKpiDetail` (Task 2).
- Produces: `GET /dashboard/kpi-detail?domain=stockIn|inventory|stockOut&companyId=...&warehouseId=...`.

- [ ] **Step 1: Write `dashboard-kpi-detail-query.dto.ts`**

```ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional } from "class-validator";
import { DashboardQueryDto } from "./dashboard-query.dto";
import type { DashboardKpiDomain } from "../dashboard-kpi-detail.types";

export class DashboardKpiDetailQueryDto extends DashboardQueryDto {
    @ApiPropertyOptional({
        enum: ["stockIn", "inventory", "stockOut"],
        default: "stockIn",
        description: "KPI domain to drill into",
    })
    @IsIn(["stockIn", "inventory", "stockOut"])
    @IsOptional()
    domain: DashboardKpiDomain = "stockIn";
}
```

- [ ] **Step 2: Add the route to `dashboard.controller.ts`**

Add the imports:

```ts
import { DashboardKpiDetailService } from "./dashboard-kpi-detail.service";
import { DashboardKpiDetailQueryDto } from "./dto/dashboard-kpi-detail-query.dto";
```

Update the constructor:

```ts
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly dashboardAlertsService: DashboardAlertsService,
    private readonly dashboardWorkflowService: DashboardWorkflowService,
    private readonly dashboardKpiService: DashboardKpiService,
    private readonly dashboardKpiDetailService: DashboardKpiDetailService,
  ) {}
```

Add the route (after `kpiSnapshot`, before `low-stock`):

```ts
  @Get('kpi-detail')
  @ApiBearerAuthProtected()
  @ApiOperation({
    summary: 'Executive KPI domain detail',
    description:
      'Returns hero score, 8-week timeline, warehouse ranking, sub-process contributors, and supporting metrics for one KPI domain (stockIn, inventory, or stockOut). Optional scope: companyId, warehouseId.',
  })
  @ApiStandardOkResponse('KPI domain detail')
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async kpiDetail(@Query() query: DashboardKpiDetailQueryDto): Promise<ApiResponse<unknown>> {
    const data = await this.dashboardKpiDetailService.getKpiDetail(query.domain, query);
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
    ],
    exports: [
        DashboardService,
        DashboardAlertsService,
        DashboardWorkflowService,
        DashboardKpiService,
        DashboardKpiDetailService,
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
git add src/modules/warehouse/dashboard/dto/dashboard-kpi-detail-query.dto.ts src/modules/warehouse/dashboard/dashboard.controller.ts src/modules/warehouse/dashboard/dashboard.module.ts
git commit -m "feat: add GET /dashboard/kpi-detail endpoint"
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

- Produces: `DashboardKpiDomain`, `DashboardKpiTimelinePoint`, `DashboardKpiWarehouseRankEntry`, `DashboardKpiContributor`, `DashboardKpiDetailResponse` types; `dashboardApi.fetchKpiDetail(domain, params)`; `dashboardService.fetchKpiDetail(domain, filter)` — consumed by Task 5.

- [ ] **Step 1: Append types to `src/api/feature/dto/dashboard.dto.ts`**

```ts
export type DashboardKpiDomain = "stockIn" | "inventory" | "stockOut";

export interface DashboardKpiTimelinePoint {
    period: string;
    score: number;
}

export interface DashboardKpiWarehouseRankEntry {
    warehouseId: string;
    warehouseName: string;
    score: number;
}

export interface DashboardKpiContributor {
    label: string;
    pct: number;
}

export interface DashboardKpiDetailSupportingMetric {
    label: string;
    value: string;
}

export interface DashboardKpiDetailResponse {
    domain: DashboardKpiDomain;
    label: string;
    derivedFrom: string;
    score: number;
    previousScore: number;
    trendVsPrevious: number;
    timeline: DashboardKpiTimelinePoint[];
    warehouseComparison: {
        top: DashboardKpiWarehouseRankEntry[];
        bottom: DashboardKpiWarehouseRankEntry[];
    };
    contributors: DashboardKpiContributor[];
    supportingMetrics: DashboardKpiDetailSupportingMetric[];
}
```

- [ ] **Step 2: Append re-export to `src/model/dashboard.ts`**

```ts
export type {
    DashboardKpiDomain,
    DashboardKpiTimelinePoint,
    DashboardKpiWarehouseRankEntry,
    DashboardKpiContributor,
    DashboardKpiDetailSupportingMetric,
    DashboardKpiDetailResponse,
} from "@/api/feature/dto/dashboard.dto";
```

- [ ] **Step 3: Add `fetchKpiDetail` to `src/api/feature/dashboard.api.ts`**

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
} from "./dto/dashboard.dto";
```

Add the method (inside the `dashboardApi` object, after `fetchKpiSnapshot`):

```ts
    fetchKpiDetail(domain: DashboardKpiDomain, params: DashboardQueryParameters) {
        return apiRequest<DashboardKpiDetailResponse>({
            url: "/dashboard/kpi-detail",
            method: "get",
            params: { ...params, domain },
        });
    },
```

- [ ] **Step 4: Write the failing test for the service method**

Append to `src/services/dashboard.service.test.ts` (add `fetchKpiDetail` to the mocked `dashboardApi` object in the existing `vi.mock("@/api/feature/dashboard.api", ...)` call, then add a new test):

```ts
it("fetchKpiDetail returns the domain detail payload with domain passed through params", async () => {
    fetchKpiDetailMock.mockResolvedValue({
        data: {
            domain: "stockIn",
            label: "Stock In Performance",
            derivedFrom: "Receiving and Putaway",
            score: 83,
            previousScore: 82,
            trendVsPrevious: 1,
            timeline: [],
            warehouseComparison: { top: [], bottom: [] },
            contributors: [],
            supportingMetrics: [],
        },
    });

    const result = await dashboardService.fetchKpiDetail("stockIn", {
        warehouseId: "wh-1",
    });

    expect(fetchKpiDetailMock).toHaveBeenCalledWith("stockIn", {
        companyId: "company-1",
        warehouseId: "wh-1",
    });
    expect(result.label).toBe("Stock In Performance");
});
```

Add `const fetchKpiDetailMock = vi.fn();` near the other mock declarations at the top of the file, and add `fetchKpiDetail: fetchKpiDetailMock,` to the mocked `dashboardApi` object, and reset it in `beforeEach` alongside the others.

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run src/services/dashboard.service.test.ts`
Expected: FAIL — `dashboardService.fetchKpiDetail is not a function`

- [ ] **Step 6: Add `fetchKpiDetail` to `src/services/dashboard.service.ts`**

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
} from "@/api/feature/dto/dashboard.dto";
```

Add the method (inside the `dashboardService` object, after `fetchKpiSnapshot`):

```ts
    async fetchKpiDetail(
        domain: DashboardKpiDomain,
        filter: DashboardFilterState,
    ): Promise<DashboardKpiDetailResponse> {
        const response = await dashboardApi.fetchKpiDetail(
            domain,
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
git commit -m "feat: add dashboard kpi-detail types, api, and service method"
```

---

### Task 5: `useExecutiveKpi.ts` composable

**Files:**

- Create: `src/views/dashboard/composables/useExecutiveKpi.ts`
- Test: `src/views/dashboard/composables/useExecutiveKpi.test.ts`

**Interfaces:**

- Consumes: `dashboardService.fetchKpiDetail` (Task 4).
- Produces: `useExecutiveKpi()` returning `{ domain: Ref<DashboardKpiDomain>, setDomain(domain), data: Ref<DashboardKpiDetailResponse | null>, loading: Ref<boolean>, error: Ref<string | null> }` — consumed by Task 10.

- [ ] **Step 1: Write the failing test**

Following this repo's established composable-test convention (no `@vue/test-utils`; mock dependencies directly; call the composable function and its methods directly — see `src/views/dashboard/composables/useDashboard.test.ts` for the pattern):

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchKpiDetailMock = vi.fn();

vi.mock("@/services/dashboard.service", () => ({
    dashboardService: {
        fetchKpiDetail: fetchKpiDetailMock,
    },
}));

vi.mock("@/store/warehouse.store", () => ({
    useWarehouseStore: () => ({ selectedWarehouseId: null }),
}));

import { useExecutiveKpi } from "./useExecutiveKpi";

describe("useExecutiveKpi", () => {
    beforeEach(() => {
        fetchKpiDetailMock.mockReset();
    });

    it("defaults to the stockIn domain and fetches on creation", async () => {
        fetchKpiDetailMock.mockResolvedValue({
            domain: "stockIn",
            label: "Stock In Performance",
        });

        const composable = useExecutiveKpi();
        await composable.refresh();

        expect(composable.domain.value).toBe("stockIn");
        expect(fetchKpiDetailMock).toHaveBeenCalledWith("stockIn", {
            warehouseId: null,
        });
        expect(composable.data.value?.label).toBe("Stock In Performance");
    });

    it("re-fetches when the domain changes", async () => {
        fetchKpiDetailMock.mockResolvedValue({
            domain: "inventory",
            label: "Inventory Performance",
        });

        const composable = useExecutiveKpi();
        await composable.setDomain("inventory");

        expect(composable.domain.value).toBe("inventory");
        expect(fetchKpiDetailMock).toHaveBeenCalledWith("inventory", {
            warehouseId: null,
        });
    });

    it("sets an error message and clears loading when the fetch rejects", async () => {
        fetchKpiDetailMock.mockRejectedValue(new Error("network down"));

        const composable = useExecutiveKpi();
        await composable.refresh();

        expect(composable.error.value).toBe("network down");
        expect(composable.loading.value).toBe(false);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/composables/useExecutiveKpi.test.ts`
Expected: FAIL — `Cannot find module './useExecutiveKpi'`

- [ ] **Step 3: Write `useExecutiveKpi.ts`**

```ts
import { ref } from "vue";
import { useWarehouseStore } from "@/store/warehouse.store";
import { dashboardService } from "@/services/dashboard.service";
import type {
    DashboardKpiDetailResponse,
    DashboardKpiDomain,
} from "@/model/dashboard";

export function useExecutiveKpi() {
    const warehouseStore = useWarehouseStore();

    const domain = ref<DashboardKpiDomain>("stockIn");
    const data = ref<DashboardKpiDetailResponse | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const refresh = async () => {
        loading.value = true;
        error.value = null;
        try {
            data.value = await dashboardService.fetchKpiDetail(domain.value, {
                warehouseId: warehouseStore.selectedWarehouseId,
            });
        } catch (err) {
            error.value = err instanceof Error ? err.message : String(err);
        } finally {
            loading.value = false;
        }
    };

    const setDomain = async (next: DashboardKpiDomain) => {
        domain.value = next;
        await refresh();
    };

    return {
        domain,
        setDomain,
        data,
        loading,
        error,
        refresh,
    };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/composables/useExecutiveKpi.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Type-check**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/views/dashboard/composables/useExecutiveKpi.ts src/views/dashboard/composables/useExecutiveKpi.test.ts
git commit -m "feat: add useExecutiveKpi composable"
```

---

### Task 6: `KpiDomainTabs.vue`

**Files:**

- Create: `src/views/dashboard/components/KpiDomainTabs.vue`
- Test: `src/views/dashboard/components/KpiDomainTabs.test.ts`

**Interfaces:**

- Produces: `KpiDomainTabs` component, props `{ modelValue: DashboardKpiDomain }`, emits `update:modelValue` — consumed by Task 10.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import KpiDomainTabs from "./KpiDomainTabs.vue";

describe("KpiDomainTabs", () => {
    it("renders all three tab labels and marks the active one", async () => {
        const app = createSSRApp(KpiDomainTabs, { modelValue: "inventory" });
        const html = await renderToString(app);

        expect(html).toContain("Stock In");
        expect(html).toContain("Inventory");
        expect(html).toContain("Stock Out");
        expect(html).toContain("text-primary-600");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/KpiDomainTabs.test.ts`
Expected: FAIL — `Failed to resolve import "./KpiDomainTabs.vue"`

- [ ] **Step 3: Write `KpiDomainTabs.vue`**

```vue
<template>
    <div
        class="flex gap-2 border-b border-border"
        object-id="wdg_KpiDomainTabs"
    >
        <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            class="px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors"
            :class="
                modelValue === tab.value
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-text-secondary hover:text-text'
            "
            @click="emit('update:modelValue', tab.value)"
        >
            {{ tab.label }}
        </button>
    </div>
</template>

<script setup lang="ts">
import type { DashboardKpiDomain } from "@/model/dashboard";

defineProps<{
    modelValue: DashboardKpiDomain;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: DashboardKpiDomain): void;
}>();

const tabs: { value: DashboardKpiDomain; label: string }[] = [
    { value: "stockIn", label: "Stock In" },
    { value: "inventory", label: "Inventory" },
    { value: "stockOut", label: "Stock Out" },
];
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/KpiDomainTabs.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/views/dashboard/components/KpiDomainTabs.vue src/views/dashboard/components/KpiDomainTabs.test.ts
git commit -m "feat: add KpiDomainTabs component"
```

---

### Task 7: `KpiDomainHero.vue`

**Files:**

- Create: `src/views/dashboard/components/KpiDomainHero.vue`
- Test: `src/views/dashboard/components/KpiDomainHero.test.ts`

**Interfaces:**

- Consumes: `DashboardKpiDetailResponse` (Task 4).
- Produces: `KpiDomainHero` component, props `{ loading: boolean; data: DashboardKpiDetailResponse | null }` — consumed by Task 10.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import KpiDomainHero from "./KpiDomainHero.vue";

describe("KpiDomainHero", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(KpiDomainHero, { loading: true, data: null });
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders score, trend, derivedFrom, and an 8-point timeline", async () => {
        const app = createSSRApp(KpiDomainHero, {
            loading: false,
            data: {
                domain: "stockIn",
                label: "Stock In Performance",
                derivedFrom: "Receiving and Putaway",
                score: 83,
                previousScore: 82,
                trendVsPrevious: 1,
                timeline: Array.from({ length: 8 }, (_, i) => ({
                    period: `${i}`,
                    score: 80 + i,
                })),
                warehouseComparison: { top: [], bottom: [] },
                contributors: [],
                supportingMetrics: [],
            },
        });
        const html = await renderToString(app);

        expect(html).toContain("Stock In Performance");
        expect(html).toContain("Derived from Receiving and Putaway");
        expect(html).toContain("83");
        expect(html).toContain("polyline");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/KpiDomainHero.test.ts`
Expected: FAIL

- [ ] **Step 3: Write `KpiDomainHero.vue`**

```vue
<template>
    <Card object-id="wdg_KpiDomainHero">
        <div v-if="loading" class="grid gap-4 sm:grid-cols-2">
            <div
                class="h-32 rounded-md bg-surface-secondary animate-pulse"
            ></div>
            <div
                class="h-32 rounded-md bg-surface-secondary animate-pulse"
            ></div>
        </div>

        <div
            v-else-if="!data"
            class="p-6 text-center text-sm text-text-secondary"
        >
            No KPI data available.
        </div>

        <div v-else class="grid gap-6 sm:grid-cols-2">
            <div>
                <p class="text-xs font-semibold uppercase text-text-muted">
                    {{ data.label }}
                </p>
                <p class="text-4xl font-extrabold text-gray-900 mt-1">
                    {{ data.score
                    }}<span class="text-base font-semibold text-text-muted">
                        / 100</span
                    >
                </p>
                <p
                    class="text-sm font-semibold mt-1"
                    :class="
                        data.trendVsPrevious >= 0
                            ? 'text-success-600'
                            : 'text-danger-600'
                    "
                >
                    {{ data.trendVsPrevious >= 0 ? "+" : ""
                    }}{{ data.trendVsPrevious.toFixed(1) }}pt vs previous period
                </p>
                <p class="text-xs text-text-secondary mt-2">
                    Derived from {{ data.derivedFrom }}
                </p>
                <div class="flex gap-6 mt-3">
                    <div>
                        <p
                            class="text-[10px] font-semibold uppercase text-text-muted"
                        >
                            Current Period
                        </p>
                        <p class="text-sm font-bold">{{ data.score }}</p>
                    </div>
                    <div>
                        <p
                            class="text-[10px] font-semibold uppercase text-text-muted"
                        >
                            Previous Period
                        </p>
                        <p class="text-sm font-bold">
                            {{ data.previousScore }}
                        </p>
                    </div>
                </div>
            </div>
            <div>
                <p class="text-xs font-semibold text-text-secondary mb-2">
                    {{ data.label }} — Performance Timeline
                </p>
                <svg
                    class="h-32 w-full"
                    viewBox="0 0 100 40"
                    preserveAspectRatio="none"
                >
                    <polyline
                        :points="timelinePoints"
                        fill="none"
                        class="stroke-primary-600"
                        stroke-width="2"
                    />
                </svg>
                <div
                    class="flex justify-between text-[10px] text-text-muted mt-1"
                >
                    <span>{{ data.timeline[0]?.period }}</span>
                    <span>{{
                        data.timeline[data.timeline.length - 1]?.period
                    }}</span>
                </div>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Card from "@/components/molecules/Card.vue";
import type { DashboardKpiDetailResponse } from "@/model/dashboard";

const props = defineProps<{
    loading: boolean;
    data: DashboardKpiDetailResponse | null;
}>();

const timelinePoints = computed(() => {
    const values = props.data?.timeline.map((point) => point.score) ?? [];
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
});
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/KpiDomainHero.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/views/dashboard/components/KpiDomainHero.vue src/views/dashboard/components/KpiDomainHero.test.ts
git commit -m "feat: add KpiDomainHero component"
```

---

### Task 8: `KpiWarehouseComparison.vue` + `KpiContributors.vue`

**Files:**

- Create: `src/views/dashboard/components/KpiWarehouseComparison.vue`
- Create: `src/views/dashboard/components/KpiContributors.vue`
- Test: `src/views/dashboard/components/KpiWarehouseComparison.test.ts`
- Test: `src/views/dashboard/components/KpiContributors.test.ts`

**Interfaces:**

- Consumes: `DashboardKpiDetailResponse['warehouseComparison']`, `DashboardKpiDetailResponse['contributors']` (Task 4).
- Produces: `KpiWarehouseComparison` props `{ loading: boolean; data: DashboardKpiDetailResponse['warehouseComparison'] | null }`; `KpiContributors` props `{ loading: boolean; data: DashboardKpiContributor[] | null }` — both consumed by Task 10.

- [ ] **Step 1: Write the failing tests**

```ts
// src/views/dashboard/components/KpiWarehouseComparison.test.ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import KpiWarehouseComparison from "./KpiWarehouseComparison.vue";

describe("KpiWarehouseComparison", () => {
    it("renders top and bottom performing warehouses", async () => {
        const app = createSSRApp(KpiWarehouseComparison, {
            loading: false,
            data: {
                top: [
                    {
                        warehouseId: "wh-1",
                        warehouseName: "Batam Gateway",
                        score: 93,
                    },
                ],
                bottom: [
                    {
                        warehouseId: "wh-2",
                        warehouseName: "Jakarta Hub",
                        score: 58,
                    },
                ],
            },
        });
        const html = await renderToString(app);

        expect(html).toContain("Top Performing");
        expect(html).toContain("Batam Gateway");
        expect(html).toContain("93");
        expect(html).toContain("Needs Attention");
        expect(html).toContain("Jakarta Hub");
        expect(html).toContain("58");
    });

    it("renders an empty message when there is no ranked warehouse", async () => {
        const app = createSSRApp(KpiWarehouseComparison, {
            loading: false,
            data: { top: [], bottom: [] },
        });
        const html = await renderToString(app);
        expect(html).toContain("No warehouse activity");
    });
});
```

```ts
// src/views/dashboard/components/KpiContributors.test.ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import KpiContributors from "./KpiContributors.vue";

describe("KpiContributors", () => {
    it("renders a labeled bar per contributor with its percentage", async () => {
        const app = createSSRApp(KpiContributors, {
            loading: false,
            data: [
                { label: "Receiving", pct: 66 },
                { label: "Putaway", pct: 34 },
            ],
        });
        const html = await renderToString(app);

        expect(html).toContain("Receiving");
        expect(html).toContain("66%");
        expect(html).toContain("Putaway");
        expect(html).toContain("34%");
        expect(html).toContain("width:66%");
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/views/dashboard/components/KpiWarehouseComparison.test.ts src/views/dashboard/components/KpiContributors.test.ts`
Expected: FAIL

- [ ] **Step 3: Write `KpiWarehouseComparison.vue`**

```vue
<template>
    <Card object-id="wdg_KpiWarehouseComparison">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">
            Warehouse Comparison
        </h3>
        <div v-if="loading" class="grid gap-4 sm:grid-cols-2">
            <div
                class="h-24 rounded-md bg-surface-secondary animate-pulse"
            ></div>
            <div
                class="h-24 rounded-md bg-surface-secondary animate-pulse"
            ></div>
        </div>
        <div
            v-else-if="
                !data || (data.top.length === 0 && data.bottom.length === 0)
            "
            class="text-sm text-text-secondary text-center py-6"
        >
            No warehouse activity in this window.
        </div>
        <div v-else class="grid gap-6 sm:grid-cols-2">
            <div>
                <p class="text-xs font-semibold text-text-secondary mb-2">
                    Top Performing
                </p>
                <ul class="space-y-2">
                    <li
                        v-for="(warehouse, index) in data.top"
                        :key="warehouse.warehouseId"
                        class="flex items-center justify-between text-sm"
                    >
                        <span class="flex items-center gap-2">
                            <span
                                class="flex h-5 w-5 items-center justify-center rounded-full bg-success-50 text-success-600 text-xs font-bold"
                                >{{ index + 1 }}</span
                            >
                            {{ warehouse.warehouseName }}
                        </span>
                        <span class="font-semibold">{{ warehouse.score }}</span>
                    </li>
                </ul>
            </div>
            <div>
                <p class="text-xs font-semibold text-text-secondary mb-2">
                    Needs Attention
                </p>
                <ul class="space-y-2">
                    <li
                        v-for="warehouse in data.bottom"
                        :key="warehouse.warehouseId"
                        class="flex items-center justify-between text-sm"
                    >
                        <span class="flex items-center gap-2">
                            <span
                                class="flex h-5 w-5 items-center justify-center rounded-full bg-danger-50 text-danger-600 text-xs font-bold"
                                >!</span
                            >
                            {{ warehouse.warehouseName }}
                        </span>
                        <span class="font-semibold">{{ warehouse.score }}</span>
                    </li>
                </ul>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import type { DashboardKpiDetailResponse } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardKpiDetailResponse["warehouseComparison"] | null;
}>();
</script>
```

- [ ] **Step 4: Write `KpiContributors.vue`**

```vue
<template>
    <Card object-id="wdg_KpiContributors">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">
            Main Contributors
        </h3>
        <div v-if="loading" class="space-y-3">
            <div class="h-4 rounded bg-surface-secondary animate-pulse"></div>
            <div class="h-4 rounded bg-surface-secondary animate-pulse"></div>
        </div>
        <div
            v-else-if="!data || data.length === 0"
            class="text-sm text-text-secondary text-center py-6"
        >
            No contributor data available.
        </div>
        <div v-else class="space-y-3">
            <div
                v-for="contributor in data"
                :key="contributor.label"
                class="flex items-center gap-3"
            >
                <span class="w-20 text-xs font-semibold text-text-secondary">{{
                    contributor.label
                }}</span>
                <div
                    class="flex-1 h-2 rounded-full bg-surface-secondary overflow-hidden"
                >
                    <div
                        class="h-full rounded-full bg-primary-600"
                        :style="{ width: `${contributor.pct}%` }"
                    ></div>
                </div>
                <span class="w-10 text-right text-xs font-mono"
                    >{{ contributor.pct }}%</span
                >
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import type { DashboardKpiContributor } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardKpiContributor[] | null;
}>();
</script>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/views/dashboard/components/KpiWarehouseComparison.test.ts src/views/dashboard/components/KpiContributors.test.ts`
Expected: PASS (3 tests total)

- [ ] **Step 6: Commit**

```bash
git add src/views/dashboard/components/KpiWarehouseComparison.vue src/views/dashboard/components/KpiWarehouseComparison.test.ts src/views/dashboard/components/KpiContributors.vue src/views/dashboard/components/KpiContributors.test.ts
git commit -m "feat: add KpiWarehouseComparison and KpiContributors components"
```

---

### Task 9: `KpiSupportingMetrics.vue`

**Files:**

- Create: `src/views/dashboard/components/KpiSupportingMetrics.vue`
- Test: `src/views/dashboard/components/KpiSupportingMetrics.test.ts`

**Interfaces:**

- Consumes: `DashboardKpiDetailSupportingMetric[]` (Task 4).
- Produces: `KpiSupportingMetrics` props `{ loading: boolean; data: DashboardKpiDetailSupportingMetric[] | null }` — consumed by Task 10.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import KpiSupportingMetrics from "./KpiSupportingMetrics.vue";

describe("KpiSupportingMetrics", () => {
    it("renders one card per metric with its label and value", async () => {
        const app = createSSRApp(KpiSupportingMetrics, {
            loading: false,
            data: [
                { label: "Receiving — Avg Cycle Time", value: "0.6h" },
                { label: "Putaway — Avg Cycle Time", value: "0.4h" },
            ],
        });
        const html = await renderToString(app);

        expect(html).toContain("Receiving — Avg Cycle Time");
        expect(html).toContain("0.6h");
        expect(html).toContain("Putaway — Avg Cycle Time");
        expect(html).toContain("0.4h");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/KpiSupportingMetrics.test.ts`
Expected: FAIL

- [ ] **Step 3: Write `KpiSupportingMetrics.vue`**

```vue
<template>
    <Card object-id="wdg_KpiSupportingMetrics">
        <h3 class="text-sm font-semibold text-gray-900 mb-1">
            Supporting Metrics
        </h3>
        <div v-if="loading" class="grid gap-3 sm:grid-cols-4">
            <div
                v-for="n in 4"
                :key="n"
                class="h-16 rounded-md bg-surface-secondary animate-pulse"
            ></div>
        </div>
        <div
            v-else-if="!data || data.length === 0"
            class="text-sm text-text-secondary text-center py-6"
        >
            No supporting metrics available.
        </div>
        <div v-else class="grid gap-3 sm:grid-cols-4 mt-3">
            <div
                v-for="metric in data"
                :key="metric.label"
                class="rounded-md border border-border p-3"
            >
                <p class="text-[11px] text-text-secondary">
                    {{ metric.label }}
                </p>
                <p class="text-base font-bold text-gray-900 mt-1">
                    {{ metric.value }}
                </p>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import type { DashboardKpiDetailSupportingMetric } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardKpiDetailSupportingMetric[] | null;
}>();
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/KpiSupportingMetrics.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/views/dashboard/components/KpiSupportingMetrics.vue src/views/dashboard/components/KpiSupportingMetrics.test.ts
git commit -m "feat: add KpiSupportingMetrics component"
```

---

### Task 10: `ExecutiveKpiPage.vue` + route wiring

**Files:**

- Create: `src/views/dashboard/ExecutiveKpiPage.vue`
- Create: `src/views/dashboard/ExecutiveKpiPage.test.ts`
- Modify: `src/router/index.ts`

**Interfaces:**

- Consumes: `useExecutiveKpi` (Task 5), `KpiDomainTabs`/`KpiDomainHero`/`KpiWarehouseComparison`/`KpiContributors`/`KpiSupportingMetrics` (Tasks 6-9).

- [ ] **Step 1: Write the failing test**

```ts
import { createSSRApp, defineComponent } from "vue";
import { renderToString } from "vue/server-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useExecutiveKpiMock = vi.hoisted(() => vi.fn());

vi.mock("./composables/useExecutiveKpi", () => ({
    useExecutiveKpi: useExecutiveKpiMock,
}));

const stub = (name: string) =>
    defineComponent({ name, setup: () => () => null });

vi.mock("./components/KpiDomainTabs.vue", () => ({
    default: stub("KpiDomainTabsStub"),
}));
vi.mock("./components/KpiDomainHero.vue", () => ({
    default: stub("KpiDomainHeroStub"),
}));
vi.mock("./components/KpiWarehouseComparison.vue", () => ({
    default: stub("KpiWarehouseComparisonStub"),
}));
vi.mock("./components/KpiContributors.vue", () => ({
    default: stub("KpiContributorsStub"),
}));
vi.mock("./components/KpiSupportingMetrics.vue", () => ({
    default: stub("KpiSupportingMetricsStub"),
}));

import ExecutiveKpiPage from "./ExecutiveKpiPage.vue";

describe("ExecutiveKpiPage", () => {
    beforeEach(() => {
        useExecutiveKpiMock.mockReset();
        useExecutiveKpiMock.mockReturnValue({
            domain: { value: "stockIn" },
            setDomain: vi.fn(),
            data: { value: null },
            loading: { value: false },
            error: { value: null },
            refresh: vi.fn(),
        });
    });

    it("renders the Executive KPI page title", async () => {
        const app = createSSRApp(ExecutiveKpiPage);
        const html = await renderToString(app);
        expect(html).toContain("Executive KPI");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/ExecutiveKpiPage.test.ts`
Expected: FAIL — `Failed to resolve import "./ExecutiveKpiPage.vue"`

- [ ] **Step 3: Write `ExecutiveKpiPage.vue`**

```vue
<template>
    <section class="space-y-6">
        <div>
            <h1 class="text-xl font-bold text-gray-900">Executive KPI</h1>
            <p class="text-sm text-text-secondary mt-0.5">
                Explaining why operations improved or declined compared with the
                previous period
            </p>
        </div>

        <p
            v-if="error"
            class="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-danger-600"
        >
            {{ error }}
        </p>

        <KpiDomainTabs :model-value="domain" @update:model-value="setDomain" />
        <KpiDomainHero :loading="loading" :data="data" />
        <div class="grid gap-6 lg:grid-cols-2">
            <KpiWarehouseComparison
                :loading="loading"
                :data="data?.warehouseComparison ?? null"
            />
            <KpiContributors
                :loading="loading"
                :data="data?.contributors ?? null"
            />
        </div>
        <KpiSupportingMetrics
            :loading="loading"
            :data="data?.supportingMetrics ?? null"
        />
    </section>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import KpiDomainTabs from "./components/KpiDomainTabs.vue";
import KpiDomainHero from "./components/KpiDomainHero.vue";
import KpiWarehouseComparison from "./components/KpiWarehouseComparison.vue";
import KpiContributors from "./components/KpiContributors.vue";
import KpiSupportingMetrics from "./components/KpiSupportingMetrics.vue";
import { useExecutiveKpi } from "./composables/useExecutiveKpi";

const { domain, setDomain, data, loading, error, refresh } = useExecutiveKpi();

onMounted(() => {
    void refresh();
});
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/ExecutiveKpiPage.test.ts`
Expected: PASS

- [ ] **Step 5: Wire the route**

In `src/router/index.ts`, replace the `dashboard/kpi` entry inside `dashboardPlaceholderRoutes` (remove it from that array) and add a dedicated route instead. Change:

```ts
const dashboardPlaceholderRoutes: RouteRecordRaw[] = [
    {
        path: "dashboard/kpi",
        component: () => import("@/views/shared/PageShell.vue"),
        props: {
            title: "Executive KPI",
            description:
                "Composite performance scores and drill-down analytics for stock in, inventory, and stock out.",
        },
    },
    {
        path: "dashboard/process",
        ...
```

to:

```ts
const dashboardPlaceholderRoutes: RouteRecordRaw[] = [
    {
        path: "dashboard/process",
        ...
```

(i.e., delete the `dashboard/kpi` object entirely from `dashboardPlaceholderRoutes`), and add a standalone route in its place alongside `...dashboardPlaceholderRoutes` in the routes array:

```ts
            ...dashboardRoutes,
            {
                path: "dashboard/kpi",
                component: () => import("@/views/dashboard/ExecutiveKpiPage.vue"),
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
git add src/views/dashboard/ExecutiveKpiPage.vue src/views/dashboard/ExecutiveKpiPage.test.ts src/router/index.ts
git commit -m "feat: add ExecutiveKpiPage and wire /dashboard/kpi route"
```

---

## Post-Implementation Verification

- [ ] Run backend full suite: `cd /Users/syillaeltaniadaffa/Documents/Warehouse-be && npx jest`
- [ ] Run frontend full suite: `cd /Users/syillaeltaniadaffa/Documents/Warehouse && npx vitest run`
- [ ] Run frontend type-check: `npx vue-tsc --noEmit`
- [ ] Start both dev servers and manually load `/dashboard/kpi` with a real warehouse selected; confirm all 3 domain tabs render real data (or explicit empty states) and switching tabs re-fetches correctly.
