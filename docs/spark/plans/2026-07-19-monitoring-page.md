# Monitoring Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/dashboard/monitoring` Monitoring page — a real-time-feeling command center showing per-domain health (Stock In, Stock Out, Inventory) and a live RFID event feed, backed by real `EpcEvent`/doc data — per `docs/spark/specs/2026-07-19-monitoring-page-design.md`, the final (4th) sub-project of the Operational Intelligence Platform.

**Architecture:** Backend (`Warehouse-be`) adds a new `GET /dashboard/monitoring` endpoint backed by a new `DashboardMonitoringService`, following the "new service per page" convention established by `DashboardKpiDetailService`/`DashboardProcessDetailService`. Unlike those two, this endpoint takes no activity/domain/period query param — it returns all three domains plus the live feed in one response, scoped only by the inherited `companyId`/`warehouseId` on `DashboardQueryDto` (no new DTO class needed). Frontend (`Warehouse`) adds a new page (`MonitoringPage.vue`), a composable (`useMonitoring.ts`) that owns a 20-second poll via `setInterval`/`clearInterval` (the first such infra in this app), and 2 new components, replacing the `/dashboard/monitoring` route's `PageShell` placeholder — the last of the four placeholder routes.

**Tech Stack:** NestJS + Prisma (backend), Vue 3 + `<script setup>` + Vitest SSR render tests (frontend), Tailwind CSS design tokens.

## Global Constraints

- **Zone/dock concept** exists via the `Location` model (hierarchical, per-warehouse `code`/`name`/`path`), already referenced by every doc line type — usable for the mockup's "Zone"/"Dock" labels.
- **RFID event logging is fully functional**: `EpcEvent` (table `epc_events`) is actively written by `rfid.service.ts`/`rfid-log.service.ts` on register/encode/assign/unassign/retire/status-change/move_in/move_out — the "Live Transactions" feed is built from real `EpcEvent` data, not a mockup fabrication.
- **No "Priority" field exists anywhere.** Priority (low/med/high) is derived from each event's age at fetch time: **`durationMinutes < 5` → low, `5 <= durationMinutes <= 15` → med, `durationMinutes > 15` → high** (exactly 5 and exactly 15 both resolve to "med") — an explicit, documented simplification, not real business-assigned priority.
- **SLA/deadline data exists only for `OutboundDoc.deadlineAt`.** The SLA progress bar is shown **only for event rows tied to an Outbound doc with a `deadlineAt`**; all other rows render no SLA bar (a dash, not a fabricated bar). Note: as of this writing, no `EpcEvent` write path in `rfid.service.ts`/`rfid-log.service.ts` populates `doc_type`/`doc_id`, so in practice `slaPct` will be `null` for all current rows — the trace-when-present logic is still implemented faithfully per the schema's capability, ready for the day a write path starts populating those columns.
- **"Exceptions" is approximated as the count of documents with status `canceled`** in the window — an explicit, documented simplification, same category as prior accepted constraints (Putaway/`DocStatusHistory` dependency, `createdById` operator attribution, etc.).
- **3-stat grid, not 4**: Current Queue (`draft` count), Completed Today (terminal status, `updatedAt` today), and Exceptions (`canceled` count, `updatedAt` today) — consistently derivable across all three domains. "Active Tasks" and "Pending" are dropped rather than shown as always-zero.
- **Health chip thresholds**: `critical` if `exceptionsCount >= 5`; `warning` if `1 <= exceptionsCount <= 4`; `nominal` if `exceptionsCount === 0`.
- **20-second polling** is the first such infrastructure in this app — a `setInterval` at the composable level, cleared on unmount, no new dependency. The initial fetch shows a loading state; subsequent silent polls update `data` without flashing a loading skeleton.
- **`OpnameDoc` has no doc-number-like field** (only `title`/`profile_id`) — its `queueTasks[].docCode` uses `title` as an explicit accepted simplification, same category as the constraints above.
- **Color tokens**: only use tokens already confirmed real: `gray`, `primary` (50-900), `success`/`warning`/`danger`/`info` (50/500/600 only), `surface`, `surface-secondary`, `border`, `text`, `text-text-secondary`, `text-text-muted` (the color config key is literally `"text-secondary"`/`"text-muted"`, and Tailwind's `text-{colorKey}` rule produces the doubled-prefix classes `text-text-secondary`/`text-text-muted` — bare `text-secondary`/`text-muted` do NOT compile), or plain Tailwind defaults. Never use `bg-workspace-bg`, `border-border-default`, `text-action-orange`, `text-signal-red`, `text-text-tertiary`, `bg-primary-light` — confirmed dead.
- No cron/scheduler on the backend — computed synchronously per request, same as all other dashboard endpoints; the 20-second refresh is a frontend polling concern only.
- Response envelope: `successResponse(data)`; decorators `@ApiBearerAuthProtected()` + `@ApiStandardOkResponse(...)`.
- Manual `companyId`/`warehouseId` where-clause scoping (no automatic tenant guard).
- Zone/dock is not an interactive filter — `Location` is used for display labels only.
- No true WebSocket/SSE push updates — the 20-second poll approximates "live" with no new infrastructure.
- No client-side search box on the Live Transactions table, no warehouse-level filtering on this page — consistent with prior sub-projects' decisions.

---

## Backend Tasks (`/Users/syillaeltaniadaffa/Documents/Warehouse-be`)

### Task 1: `dashboard-monitoring.types.ts` + `dashboard-monitoring.util.ts`

**Files:**

- Create: `src/modules/warehouse/dashboard/dashboard-monitoring.types.ts`
- Create: `src/modules/warehouse/dashboard/dashboard-monitoring.util.ts`
- Test: `src/modules/warehouse/dashboard/dashboard-monitoring.util.spec.ts`

**Interfaces:**

- Produces: `MonitoringDomainKey`, `MonitoringHealth`, `MonitoringPriority`, `MonitoringQueueTask`, `DomainHealth`, `LiveTransactionRow`, `MonitoringResponse` types; `deriveHealth(exceptionsCount: number): MonitoringHealth`, `derivePriority(durationMinutes: number): MonitoringPriority`, `getTodayWindowBounds(referenceDate?: Date): { gte: Date; lt: Date }` pure functions — all consumed by Task 2.

- [ ] **Step 1: Write the failing test**

Create `src/modules/warehouse/dashboard/dashboard-monitoring.util.spec.ts`:

```ts
import {
    deriveHealth,
    derivePriority,
    getTodayWindowBounds,
} from "./dashboard-monitoring.util";

describe("deriveHealth", () => {
    it("returns nominal when there are zero exceptions", () => {
        expect(deriveHealth(0)).toBe("nominal");
    });

    it("returns warning for 1 to 4 exceptions inclusive", () => {
        expect(deriveHealth(1)).toBe("warning");
        expect(deriveHealth(4)).toBe("warning");
    });

    it("returns critical at 5 or more exceptions", () => {
        expect(deriveHealth(5)).toBe("critical");
        expect(deriveHealth(20)).toBe("critical");
    });
});

describe("derivePriority", () => {
    it("returns low for durations strictly under 5 minutes", () => {
        expect(derivePriority(0)).toBe("low");
        expect(derivePriority(4.9)).toBe("low");
    });

    it("returns med from exactly 5 minutes up to and including 15 minutes", () => {
        expect(derivePriority(5)).toBe("med");
        expect(derivePriority(10)).toBe("med");
        expect(derivePriority(15)).toBe("med");
    });

    it("returns high strictly above 15 minutes", () => {
        expect(derivePriority(15.1)).toBe("high");
        expect(derivePriority(30)).toBe("high");
    });
});

describe("getTodayWindowBounds", () => {
    it("returns the UTC day window [00:00:00.000, next day 00:00:00.000) for the reference date", () => {
        const { gte, lt } = getTodayWindowBounds(
            new Date("2026-07-18T15:42:00Z"),
        );
        expect(gte.toISOString()).toBe("2026-07-18T00:00:00.000Z");
        expect(lt.toISOString()).toBe("2026-07-19T00:00:00.000Z");
    });

    it("defaults to the current date when no reference date is given", () => {
        const { gte, lt } = getTodayWindowBounds();
        expect(lt.getTime() - gte.getTime()).toBe(24 * 60 * 60 * 1000);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-monitoring.util.spec.ts`
Expected: FAIL — `Cannot find module './dashboard-monitoring.util'`

- [ ] **Step 3: Create `dashboard-monitoring.types.ts`**

```ts
export type MonitoringDomainKey = "stockIn" | "stockOut" | "inventory";

export type MonitoringHealth = "nominal" | "warning" | "critical";

export type MonitoringPriority = "low" | "med" | "high";

export interface MonitoringQueueTask {
    docCode: string;
    locationLabel: string | null;
}

export interface DomainHealth {
    label: string;
    health: MonitoringHealth;
    queueCount: number;
    completedTodayCount: number;
    exceptionsCount: number;
    queueTasks: MonitoringQueueTask[];
}

export interface LiveTransactionRow {
    warehouseName: string;
    zoneLabel: string | null;
    operatorName: string;
    eventLabel: string;
    timestamp: string;
    durationMinutes: number;
    priority: MonitoringPriority;
    slaPct: number | null;
}

export interface MonitoringResponse {
    domains: {
        stockIn: DomainHealth;
        stockOut: DomainHealth;
        inventory: DomainHealth;
    };
    liveTransactions: LiveTransactionRow[];
}
```

- [ ] **Step 4: Create `dashboard-monitoring.util.ts`**

```ts
import type {
    MonitoringHealth,
    MonitoringPriority,
} from "./dashboard-monitoring.types";

/**
 * Health threshold rule: critical if 5+ exceptions, warning if 1-4, nominal if 0.
 * Not derived from any existing business threshold — no such threshold exists in the
 * schema, so this is an explicit, simple, documented rule.
 */
export function deriveHealth(exceptionsCount: number): MonitoringHealth {
    if (exceptionsCount >= 5) return "critical";
    if (exceptionsCount >= 1) return "warning";
    return "nominal";
}

/**
 * Priority derivation from event age, since no real "Priority" field exists anywhere.
 * Boundaries (explicit, unambiguous):
 *   - durationMinutes < 5           -> 'low'
 *   - 5 <= durationMinutes <= 15    -> 'med'  (5 exactly and 15 exactly are both "med")
 *   - durationMinutes > 15          -> 'high'
 */
export function derivePriority(durationMinutes: number): MonitoringPriority {
    if (durationMinutes < 5) return "low";
    if (durationMinutes <= 15) return "med";
    return "high";
}

/**
 * Returns the [gte, lt) UTC calendar-day window containing referenceDate, used for
 * "updatedAt = today" filters (Completed Today / Exceptions). Accepts an optional
 * referenceDate so the boundary math is fully deterministic and unit-testable.
 */
export function getTodayWindowBounds(referenceDate: Date = new Date()): {
    gte: Date;
    lt: Date;
} {
    const gte = new Date(
        Date.UTC(
            referenceDate.getUTCFullYear(),
            referenceDate.getUTCMonth(),
            referenceDate.getUTCDate(),
        ),
    );
    const lt = new Date(gte.getTime() + 24 * 60 * 60 * 1000);
    return { gte, lt };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-monitoring.util.spec.ts`
Expected: PASS (8 tests)

- [ ] **Step 6: Commit**

```bash
git add src/modules/warehouse/dashboard/dashboard-monitoring.types.ts src/modules/warehouse/dashboard/dashboard-monitoring.util.ts src/modules/warehouse/dashboard/dashboard-monitoring.util.spec.ts
git commit -m "feat: add Monitoring page types and deriveHealth/derivePriority/getTodayWindowBounds helpers"
```

---

### Task 2: `DashboardMonitoringService`

**Files:**

- Create: `src/modules/warehouse/dashboard/dashboard-monitoring.service.ts`
- Test: `src/modules/warehouse/dashboard/dashboard-monitoring.service.spec.ts`

**Interfaces:**

- Consumes: `PrismaService`; `deriveHealth`, `derivePriority`, `getTodayWindowBounds` (Task 1); `clampScore` (existing `dashboard-kpi.util.ts`); `MonitoringResponse`/`DomainHealth`/`LiveTransactionRow`/etc. (Task 1).
- Produces: `DashboardMonitoringService.getMonitoring(query: DashboardQueryDto): Promise<MonitoringResponse>` — consumed by Task 3.

- [ ] **Step 1: Write the failing test**

```ts
import { Test, TestingModule } from "@nestjs/testing";
import { DashboardMonitoringService } from "./dashboard-monitoring.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";

describe("DashboardMonitoringService", () => {
    let service: DashboardMonitoringService;

    const emptyFindMany = jest.fn().mockResolvedValue([]);
    const zeroCount = jest.fn().mockResolvedValue(0);

    const mockPrismaService: any = {
        inboundDoc: { count: zeroCount, findMany: emptyFindMany },
        putawayDoc: { count: zeroCount, findMany: emptyFindMany },
        outboundDoc: { count: zeroCount, findMany: emptyFindMany },
        transferDoc: { count: zeroCount, findMany: emptyFindMany },
        relocationDoc: { count: zeroCount, findMany: emptyFindMany },
        opnameDoc: { count: zeroCount, findMany: emptyFindMany },
        epcEvent: { findMany: emptyFindMany },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardMonitoringService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<DashboardMonitoringService>(
            DashboardMonitoringService,
        );
    });

    afterEach(() => jest.clearAllMocks());

    it("returns nominal health with zero counts for all three domains when there is no activity", async () => {
        const result = await service.getMonitoring({
            page: 1,
            limit: 20,
        } as any);

        expect(result.domains.stockIn).toEqual({
            label: "Stock In",
            health: "nominal",
            queueCount: 0,
            completedTodayCount: 0,
            exceptionsCount: 0,
            queueTasks: [],
        });
        expect(result.domains.stockOut.label).toBe("Stock Out");
        expect(result.domains.inventory.label).toBe("Inventory");
        expect(result.liveTransactions).toEqual([]);
    });

    it("maps exceptionsCount to the warning and critical health thresholds", async () => {
        mockPrismaService.inboundDoc.count.mockImplementation((args: any) => {
            if (args.where.status === "canceled") return Promise.resolve(2);
            return Promise.resolve(0);
        });

        const warningResult = await service.getMonitoring({
            page: 1,
            limit: 20,
        } as any);
        expect(warningResult.domains.stockIn.health).toBe("warning");
        expect(warningResult.domains.stockIn.exceptionsCount).toBe(2);

        mockPrismaService.inboundDoc.count.mockImplementation((args: any) => {
            if (args.where.status === "canceled") return Promise.resolve(5);
            return Promise.resolve(0);
        });

        const criticalResult = await service.getMonitoring({
            page: 1,
            limit: 20,
        } as any);
        expect(criticalResult.domains.stockIn.health).toBe("critical");
    });

    it("merges and ranks queueTasks by recency across a domain's doc types, capped at 5", async () => {
        mockPrismaService.inboundDoc.findMany.mockResolvedValue([
            {
                inbound_no: "IN-OLD",
                createdAt: new Date("2026-07-01T00:00:00Z"),
                lines: [{ location: { name: "Zone A" } }],
            },
            {
                inbound_no: "IN-NEW",
                createdAt: new Date("2026-07-18T00:00:00Z"),
                lines: [{ location: null }],
            },
        ]);
        mockPrismaService.putawayDoc.findMany.mockResolvedValue([
            {
                docNumber: "PUT-MID",
                createdAt: new Date("2026-07-10T00:00:00Z"),
                lines: [
                    {
                        locations_putaway_lines_target_location_idTolocations: {
                            name: "Dock 02",
                        },
                    },
                ],
            },
        ]);

        const result = await service.getMonitoring({
            page: 1,
            limit: 20,
        } as any);

        expect(result.domains.stockIn.queueTasks).toEqual([
            { docCode: "IN-NEW", locationLabel: null },
            { docCode: "PUT-MID", locationLabel: "Dock 02" },
            { docCode: "IN-OLD", locationLabel: "Zone A" },
        ]);
    });

    it("derives priority from event age and only populates slaPct for outbound-traced events with a deadline", async () => {
        const now = Date.now();
        mockPrismaService.epcEvent.findMany.mockResolvedValue([
            {
                eventType: "move_in",
                event_time: new Date(now - 2 * 60 * 1000),
                doc_type: null,
                doc_id: null,
                warehouses: { name: "Jakarta DC" },
                locations: { name: "Dock 02" },
                users: { fullName: "Budi Santoso" },
            },
            {
                eventType: "move_out",
                event_time: new Date(now - 20 * 60 * 1000),
                doc_type: "outbound",
                doc_id: "ob-1",
                warehouses: { name: "Surabaya DC" },
                locations: null,
                users: { fullName: "Siti Aminah" },
            },
        ]);
        // NOTE: outboundDoc.findMany is called both by fetchQueueTasks('outbound') (queried
        // by status: 'draft', for the Stock Out domain card) and by the SLA trace lookup
        // below (queried by id: { in: [...] }) — the mock must branch on args.where so the
        // queueTasks call still resolves to [] instead of malformed doc-shaped rows.
        mockPrismaService.outboundDoc.findMany = jest
            .fn()
            .mockImplementation((args: any) => {
                if (args.where?.id) {
                    return Promise.resolve([
                        {
                            id: "ob-1",
                            createdAt: new Date(now - 60 * 60 * 1000),
                            deadlineAt: new Date(now + 60 * 60 * 1000),
                        },
                    ]);
                }
                return Promise.resolve([]);
            });

        const result = await service.getMonitoring({
            page: 1,
            limit: 20,
        } as any);

        expect(result.liveTransactions[0].priority).toBe("low");
        expect(result.liveTransactions[0].slaPct).toBeNull();
        expect(result.liveTransactions[1].priority).toBe("high");
        expect(result.liveTransactions[1].slaPct).toBe(50);
        expect(result.liveTransactions[1].eventLabel).toBe(
            "Picked / Moved Out",
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-monitoring.service.spec.ts`
Expected: FAIL — `Cannot find module './dashboard-monitoring.service'`

- [ ] **Step 3: Write `dashboard-monitoring.service.ts`**

```ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import type { DashboardQueryDto } from "./dto/dashboard-query.dto";
import { clampScore } from "./dashboard-kpi.util";
import {
    deriveHealth,
    derivePriority,
    getTodayWindowBounds,
} from "./dashboard-monitoring.util";
import type {
    DomainHealth,
    LiveTransactionRow,
    MonitoringDomainKey,
    MonitoringQueueTask,
    MonitoringResponse,
} from "./dashboard-monitoring.types";

const LIVE_FEED_LIMIT = 20;
const QUEUE_TASK_CANDIDATE_LIMIT = 5;
const QUEUE_TASK_FINAL_LIMIT = 5;

type MonitoringDocType =
    "inbound" | "putaway" | "outbound" | "transfer" | "relocation" | "opname";

interface DocTypeConfig {
    completedStatus: string;
    warehouseField: "warehouse_id" | "origin_warehouse_id";
}

const DOC_TYPE_CONFIG: Record<MonitoringDocType, DocTypeConfig> = {
    inbound: { completedStatus: "posted", warehouseField: "warehouse_id" },
    putaway: { completedStatus: "done", warehouseField: "warehouse_id" },
    outbound: { completedStatus: "posted", warehouseField: "warehouse_id" },
    transfer: {
        completedStatus: "posted",
        warehouseField: "origin_warehouse_id",
    },
    relocation: { completedStatus: "posted", warehouseField: "warehouse_id" },
    opname: { completedStatus: "closed", warehouseField: "warehouse_id" },
};

const DOMAIN_DOC_TYPES: Record<
    MonitoringDomainKey,
    { label: string; docTypes: MonitoringDocType[] }
> = {
    stockIn: { label: "Stock In", docTypes: ["inbound", "putaway"] },
    stockOut: { label: "Stock Out", docTypes: ["outbound"] },
    inventory: {
        label: "Inventory",
        docTypes: ["transfer", "relocation", "opname"],
    },
};

/** EpcEvent.eventType -> human label. Falls back to the raw value for anything unmapped. */
const EVENT_LABEL_MAP: Record<string, string> = {
    register: "Registered",
    encode: "Encoded",
    move_in: "Putaway Confirmed",
    move_out: "Picked / Moved Out",
    status_change: "Status Updated",
    read: "Scanned",
    encoded: "Encoded",
    assigned: "Assigned",
    unassigned: "Unassigned",
    in_stock: "In Stock",
    out_stock: "Out of Stock",
    returned: "Returned",
    damaged: "Damaged",
    quarantined: "Quarantined",
    retired: "Retired",
};

interface QueueTaskCandidate extends MonitoringQueueTask {
    createdAt: Date;
}

@Injectable()
export class DashboardMonitoringService {
    constructor(private readonly prisma: PrismaService) {}

    async getMonitoring(query: DashboardQueryDto): Promise<MonitoringResponse> {
        const todayWindow = getTodayWindowBounds();

        const [stockIn, stockOut, inventory, liveTransactions] =
            await Promise.all([
                this.buildDomainHealth("stockIn", query, todayWindow),
                this.buildDomainHealth("stockOut", query, todayWindow),
                this.buildDomainHealth("inventory", query, todayWindow),
                this.fetchLiveTransactions(query),
            ]);

        return {
            domains: { stockIn, stockOut, inventory },
            liveTransactions,
        };
    }

    private buildScopedWhere(
        docType: MonitoringDocType,
        status: string,
        query: DashboardQueryDto,
        dateRange?: { gte: Date; lt: Date },
    ): Record<string, unknown> {
        const config = DOC_TYPE_CONFIG[docType];
        const where: Record<string, unknown> = { status };
        if (query.companyId) where.companyId = query.companyId;
        if (query.warehouseId) where[config.warehouseField] = query.warehouseId;
        if (dateRange) where.updatedAt = dateRange;
        return where;
    }

    private async countDocs(
        docType: MonitoringDocType,
        where: Record<string, unknown>,
    ): Promise<number> {
        switch (docType) {
            case "inbound":
                return this.prisma.inboundDoc.count({ where });
            case "putaway":
                return this.prisma.putawayDoc.count({ where });
            case "outbound":
                return this.prisma.outboundDoc.count({ where });
            case "transfer":
                return this.prisma.transferDoc.count({ where });
            case "relocation":
                return this.prisma.relocationDoc.count({ where });
            case "opname":
                return this.prisma.opnameDoc.count({ where });
        }
    }

    private async fetchQueueTasks(
        docType: MonitoringDocType,
        query: DashboardQueryDto,
    ): Promise<QueueTaskCandidate[]> {
        const where = this.buildScopedWhere(docType, "draft", query);
        const commonArgs = {
            where,
            orderBy: { createdAt: "desc" as const },
            take: QUEUE_TASK_CANDIDATE_LIMIT,
        };

        switch (docType) {
            case "inbound": {
                const docs = await this.prisma.inboundDoc.findMany({
                    ...commonArgs,
                    select: {
                        inbound_no: true,
                        createdAt: true,
                        lines: {
                            take: 1,
                            orderBy: { lineNo: "asc" },
                            select: { location: { select: { name: true } } },
                        },
                    },
                });
                return docs.map((doc) => ({
                    docCode: doc.inbound_no,
                    locationLabel: doc.lines[0]?.location?.name ?? null,
                    createdAt: doc.createdAt ?? new Date(0),
                }));
            }
            case "putaway": {
                const docs = await this.prisma.putawayDoc.findMany({
                    ...commonArgs,
                    select: {
                        docNumber: true,
                        createdAt: true,
                        lines: {
                            take: 1,
                            orderBy: { lineNo: "asc" },
                            select: {
                                locations_putaway_lines_target_location_idTolocations:
                                    { select: { name: true } },
                            },
                        },
                    },
                });
                return docs.map((doc) => ({
                    docCode: doc.docNumber,
                    locationLabel:
                        doc.lines[0]
                            ?.locations_putaway_lines_target_location_idTolocations
                            ?.name ?? null,
                    createdAt: doc.createdAt ?? new Date(0),
                }));
            }
            case "outbound": {
                const docs = await this.prisma.outboundDoc.findMany({
                    ...commonArgs,
                    select: {
                        outbound_no: true,
                        createdAt: true,
                        lines: {
                            take: 1,
                            orderBy: { lineNo: "asc" },
                            select: { location: { select: { name: true } } },
                        },
                    },
                });
                return docs.map((doc) => ({
                    docCode: doc.outbound_no,
                    locationLabel: doc.lines[0]?.location?.name ?? null,
                    createdAt: doc.createdAt ?? new Date(0),
                }));
            }
            case "transfer": {
                const docs = await this.prisma.transferDoc.findMany({
                    ...commonArgs,
                    select: {
                        transfer_no: true,
                        createdAt: true,
                        lines: {
                            take: 1,
                            orderBy: { lineNo: "asc" },
                            select: {
                                locations_transfer_lines_destination_location_idTolocations:
                                    { select: { name: true } },
                            },
                        },
                    },
                });
                return docs.map((doc) => ({
                    docCode: doc.transfer_no,
                    locationLabel:
                        doc.lines[0]
                            ?.locations_transfer_lines_destination_location_idTolocations
                            ?.name ?? null,
                    createdAt: doc.createdAt ?? new Date(0),
                }));
            }
            case "relocation": {
                const docs = await this.prisma.relocationDoc.findMany({
                    ...commonArgs,
                    select: {
                        relocation_no: true,
                        createdAt: true,
                        locations_relocation_docs_origin_location_idTolocations:
                            { select: { name: true } },
                    },
                });
                return docs.map((doc) => ({
                    docCode: doc.relocation_no,
                    locationLabel:
                        doc
                            .locations_relocation_docs_origin_location_idTolocations
                            ?.name ?? null,
                    createdAt: doc.createdAt ?? new Date(0),
                }));
            }
            case "opname": {
                // OpnameDoc has no doc-number-like field — `title` is used as an explicit,
                // documented accepted simplification (same category as other accepted gaps).
                const docs = await this.prisma.opnameDoc.findMany({
                    ...commonArgs,
                    select: {
                        title: true,
                        createdAt: true,
                        lines: {
                            take: 1,
                            orderBy: { lineNo: "asc" },
                            select: { locations: { select: { name: true } } },
                        },
                    },
                });
                return docs.map((doc) => ({
                    docCode: doc.title,
                    locationLabel: doc.lines[0]?.locations?.name ?? null,
                    createdAt: doc.createdAt ?? new Date(0),
                }));
            }
        }
    }

    private async buildDomainHealth(
        domainKey: MonitoringDomainKey,
        query: DashboardQueryDto,
        todayWindow: { gte: Date; lt: Date },
    ): Promise<DomainHealth> {
        const { label, docTypes } = DOMAIN_DOC_TYPES[domainKey];

        const [
            queueCounts,
            completedCounts,
            exceptionCounts,
            queueTaskCandidatesByType,
        ] = await Promise.all([
            Promise.all(
                docTypes.map((docType) =>
                    this.countDocs(
                        docType,
                        this.buildScopedWhere(docType, "draft", query),
                    ),
                ),
            ),
            Promise.all(
                docTypes.map((docType) =>
                    this.countDocs(
                        docType,
                        this.buildScopedWhere(
                            docType,
                            DOC_TYPE_CONFIG[docType].completedStatus,
                            query,
                            todayWindow,
                        ),
                    ),
                ),
            ),
            Promise.all(
                docTypes.map((docType) =>
                    this.countDocs(
                        docType,
                        this.buildScopedWhere(
                            docType,
                            "canceled",
                            query,
                            todayWindow,
                        ),
                    ),
                ),
            ),
            Promise.all(
                docTypes.map((docType) => this.fetchQueueTasks(docType, query)),
            ),
        ]);

        const queueCount = queueCounts.reduce((sum, n) => sum + n, 0);
        const completedTodayCount = completedCounts.reduce(
            (sum, n) => sum + n,
            0,
        );
        const exceptionsCount = exceptionCounts.reduce((sum, n) => sum + n, 0);

        // Correctness note: taking the top QUEUE_TASK_CANDIDATE_LIMIT (5) from each doc
        // type and merge-sorting by createdAt is guaranteed to contain the true global
        // top-5 across the whole domain, since no doc type can contribute more than 5 to
        // the final top-5 anyway.
        const queueTasks: MonitoringQueueTask[] = queueTaskCandidatesByType
            .flat()
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, QUEUE_TASK_FINAL_LIMIT)
            .map(({ docCode, locationLabel }) => ({ docCode, locationLabel }));

        return {
            label,
            health: deriveHealth(exceptionsCount),
            queueCount,
            completedTodayCount,
            exceptionsCount,
            queueTasks,
        };
    }

    private async fetchLiveTransactions(
        query: DashboardQueryDto,
    ): Promise<LiveTransactionRow[]> {
        const where: Record<string, unknown> = {};
        if (query.companyId) where.company_id = query.companyId;
        if (query.warehouseId) where.warehouse_id = query.warehouseId;

        const events = await this.prisma.epcEvent.findMany({
            where,
            orderBy: { event_time: "desc" },
            take: LIVE_FEED_LIMIT,
            select: {
                eventType: true,
                event_time: true,
                doc_type: true,
                doc_id: true,
                warehouses: { select: { name: true } },
                locations: { select: { name: true } },
                users: { select: { fullName: true } },
            },
        });

        const outboundDocIds = [
            ...new Set(
                events
                    .filter(
                        (event) =>
                            event.doc_type === "outbound" && event.doc_id,
                    )
                    .map((event) => event.doc_id as string),
            ),
        ];

        const outboundDocs =
            outboundDocIds.length === 0
                ? []
                : await this.prisma.outboundDoc.findMany({
                      where: { id: { in: outboundDocIds } },
                      select: { id: true, createdAt: true, deadlineAt: true },
                  });
        const outboundById = new Map(outboundDocs.map((doc) => [doc.id, doc]));

        const now = Date.now();

        return events.map((event) => {
            const eventTime = event.event_time ?? new Date();
            const durationMinutes = Math.max(
                0,
                Math.round((now - eventTime.getTime()) / (1000 * 60)),
            );

            let slaPct: number | null = null;
            if (event.doc_type === "outbound" && event.doc_id) {
                const outboundDoc = outboundById.get(event.doc_id);
                if (outboundDoc?.deadlineAt && outboundDoc.createdAt) {
                    const total =
                        outboundDoc.deadlineAt.getTime() -
                        outboundDoc.createdAt.getTime();
                    if (total > 0) {
                        const elapsed = now - outboundDoc.createdAt.getTime();
                        slaPct = clampScore((elapsed / total) * 100);
                    }
                }
            }

            return {
                warehouseName: event.warehouses?.name ?? "Unknown",
                zoneLabel: event.locations?.name ?? null,
                operatorName: event.users?.fullName ?? "Unknown",
                eventLabel: EVENT_LABEL_MAP[event.eventType] ?? event.eventType,
                timestamp: eventTime.toISOString(),
                durationMinutes,
                priority: derivePriority(durationMinutes),
                slaPct,
            };
        });
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-monitoring.service.spec.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/modules/warehouse/dashboard/dashboard-monitoring.service.ts src/modules/warehouse/dashboard/dashboard-monitoring.service.spec.ts
git commit -m "feat: add DashboardMonitoringService for per-domain health and live transaction feed"
```

---

### Task 3: `GET /dashboard/monitoring` endpoint

**Files:**

- Modify: `src/modules/warehouse/dashboard/dashboard.controller.ts`
- Modify: `src/modules/warehouse/dashboard/dashboard.module.ts`
- Test: no new test file — this route is a thin wrapper reusing the existing `DashboardQueryDto` with no new fields; the whole-branch/manual smoke test covers it, consistent with how `stock-summary`/`alerts` routes were added without their own controller-level test.

**Interfaces:**

- Consumes: `DashboardMonitoringService.getMonitoring` (Task 2); existing `DashboardQueryDto` (no new DTO class — this endpoint takes no `domain`/`activity`/`period` param, only the inherited `companyId`/`warehouseId`).
- Produces: `GET /dashboard/monitoring?companyId=...&warehouseId=...`.

- [ ] **Step 1: Add the route to `dashboard.controller.ts`**

Add the import (alongside the other dashboard-service imports):

```ts
import { DashboardMonitoringService } from "./dashboard-monitoring.service";
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
    private readonly dashboardMonitoringService: DashboardMonitoringService,
  ) {}
```

Add the route (after `processDetail`, before `low-stock`):

```ts
  @Get('monitoring')
  @ApiBearerAuthProtected()
  @ApiOperation({
    summary: 'Real-time monitoring snapshot',
    description:
      'Returns per-domain health (Stock In, Stock Out, Inventory) with queue/completed/exception counts and top queued docs, plus the 20 most recent EPC live transaction events. Optional scope: companyId, warehouseId. Intended to be polled every 20 seconds by the frontend.',
  })
  @ApiStandardOkResponse('Monitoring snapshot')
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async monitoring(@Query() query: DashboardQueryDto): Promise<ApiResponse<unknown>> {
    const data = await this.dashboardMonitoringService.getMonitoring(query);
    return successResponse(data);
  }
```

- [ ] **Step 2: Register in `dashboard.module.ts`**

```ts
import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { DashboardAlertsService } from "./dashboard-alerts.service";
import { DashboardWorkflowService } from "./dashboard-workflow.service";
import { DashboardKpiService } from "./dashboard-kpi.service";
import { DashboardKpiDetailService } from "./dashboard-kpi-detail.service";
import { DashboardProcessDetailService } from "./dashboard-process-detail.service";
import { DashboardMonitoringService } from "./dashboard-monitoring.service";
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
        DashboardMonitoringService,
    ],
    exports: [
        DashboardService,
        DashboardAlertsService,
        DashboardWorkflowService,
        DashboardKpiService,
        DashboardKpiDetailService,
        DashboardProcessDetailService,
        DashboardMonitoringService,
    ],
})
export class DashboardModule {}
```

- [ ] **Step 3: Verify the full dashboard suite and type-check**

Run: `npx jest src/modules/warehouse/dashboard`
Expected: PASS (all suites)

Run: `npx tsc --noEmit` (or this project's equivalent)
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/modules/warehouse/dashboard/dashboard.controller.ts src/modules/warehouse/dashboard/dashboard.module.ts
git commit -m "feat: add GET /dashboard/monitoring endpoint"
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

- Produces: `MonitoringDomainKey`, `MonitoringHealth`, `MonitoringPriority`, `MonitoringQueueTask`, `DomainHealth`, `LiveTransactionRow`, `MonitoringResponse` types; `dashboardApi.fetchMonitoring(params)`; `dashboardService.fetchMonitoring(filter): Promise<MonitoringResponse>` — consumed by Task 5.

- [ ] **Step 1: Append types to `src/api/feature/dto/dashboard.dto.ts`**

```ts
export type MonitoringDomainKey = "stockIn" | "stockOut" | "inventory";

export type MonitoringHealth = "nominal" | "warning" | "critical";

export type MonitoringPriority = "low" | "med" | "high";

export interface MonitoringQueueTask {
    docCode: string;
    locationLabel: string | null;
}

export interface DomainHealth {
    label: string;
    health: MonitoringHealth;
    queueCount: number;
    completedTodayCount: number;
    exceptionsCount: number;
    queueTasks: MonitoringQueueTask[];
}

export interface LiveTransactionRow {
    warehouseName: string;
    zoneLabel: string | null;
    operatorName: string;
    eventLabel: string;
    timestamp: string;
    durationMinutes: number;
    priority: MonitoringPriority;
    slaPct: number | null;
}

export interface MonitoringResponse {
    domains: {
        stockIn: DomainHealth;
        stockOut: DomainHealth;
        inventory: DomainHealth;
    };
    liveTransactions: LiveTransactionRow[];
}
```

- [ ] **Step 2: Append re-export to `src/model/dashboard.ts`**

```ts
export type {
    MonitoringDomainKey,
    MonitoringHealth,
    MonitoringPriority,
    MonitoringQueueTask,
    DomainHealth,
    LiveTransactionRow,
    MonitoringResponse,
} from "@/api/feature/dto/dashboard.dto";
```

- [ ] **Step 3: Add `fetchMonitoring` to `src/api/feature/dashboard.api.ts`**

Add to the existing type-only import:

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
    MonitoringResponse,
} from "./dto/dashboard.dto";
```

Add the method (inside the `dashboardApi` object, after `fetchProcessDetail`):

```ts
    fetchMonitoring(params: DashboardQueryParameters) {
        return apiRequest<MonitoringResponse>({
            url: "/dashboard/monitoring",
            method: "get",
            params,
        });
    },
```

- [ ] **Step 4: Write the failing test for the service method**

Extend `src/services/dashboard.service.test.ts`. Add `const fetchMonitoringMock = vi.hoisted(() => vi.fn());` alongside the other `vi.hoisted` mocks, add `fetchMonitoring: fetchMonitoringMock,` to the mocked `dashboardApi` object, reset it in `beforeEach` alongside the others, then add:

```ts
it("fetchMonitoring returns the monitoring snapshot payload", async () => {
    fetchMonitoringMock.mockResolvedValue({
        data: {
            domains: {
                stockIn: {
                    label: "Stock In",
                    health: "nominal",
                    queueCount: 4,
                    completedTodayCount: 12,
                    exceptionsCount: 0,
                    queueTasks: [],
                },
                stockOut: {
                    label: "Stock Out",
                    health: "warning",
                    queueCount: 2,
                    completedTodayCount: 6,
                    exceptionsCount: 2,
                    queueTasks: [],
                },
                inventory: {
                    label: "Inventory",
                    health: "critical",
                    queueCount: 1,
                    completedTodayCount: 3,
                    exceptionsCount: 5,
                    queueTasks: [],
                },
            },
            liveTransactions: [],
        },
    });

    const result = await dashboardService.fetchMonitoring({
        warehouseId: "wh-1",
    });

    expect(fetchMonitoringMock).toHaveBeenCalledWith({
        companyId: "company-1",
        warehouseId: "wh-1",
    });
    expect(result.domains.stockIn.health).toBe("nominal");
    expect(result.domains.inventory.health).toBe("critical");
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run src/services/dashboard.service.test.ts`
Expected: FAIL — `dashboardService.fetchMonitoring is not a function`

- [ ] **Step 6: Add `fetchMonitoring` to `src/services/dashboard.service.ts`**

Add to the existing type-only import from `@/api/feature/dto/dashboard.dto`:

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
    MonitoringResponse,
} from "@/api/feature/dto/dashboard.dto";
```

Add the method (inside the `dashboardService` object, after `fetchProcessDetail`):

```ts
    async fetchMonitoring(
        filter: DashboardFilterState,
    ): Promise<MonitoringResponse> {
        const response = await dashboardApi.fetchMonitoring(toParams(filter));
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
git commit -m "feat: add monitoring types, api, and service method"
```

---

### Task 5: `useMonitoring.ts` composable with 20-second polling

**Design note:** this composable exposes `start()`/`stop()` rather than calling `onMounted`/`onUnmounted` internally. The page component (Task 8) calls `start()` in its own `onMounted` and `stop()` in its own `onUnmounted` — the same convention `ProcessPerformancePage.vue` already uses for `refresh()`. This keeps the composable testable directly (calling `onMounted` inside a composable is a no-op outside an active component instance, and this project's Vitest setup runs under `environment: "node"` with no `@vue/test-utils`/jsdom available to mount a real component) while still giving `MonitoringPage.vue` the exact "fetch on mount, poll every 20s, clear on unmount" behavior the design calls for.

**Files:**

- Create: `src/views/dashboard/composables/useMonitoring.ts`
- Test: `src/views/dashboard/composables/useMonitoring.test.ts`

**Interfaces:**

- Consumes: `dashboardService.fetchMonitoring` (Task 4).
- Produces: `useMonitoring()` returning `{ data: Ref<MonitoringResponse | null>, loading: Ref<boolean>, error: Ref<string | null>, refresh(): Promise<void>, start(): void, stop(): void }` — consumed by Task 8.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const fetchMonitoringMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/dashboard.service", () => ({
    dashboardService: {
        fetchMonitoring: fetchMonitoringMock,
    },
}));

vi.mock("@/store/warehouse.store", () => ({
    useWarehouseStore: () => ({ selectedWarehouseId: null }),
}));

import { useMonitoring } from "./useMonitoring";

const emptyResponse = {
    domains: {
        stockIn: {
            label: "Stock In",
            health: "nominal",
            queueCount: 0,
            completedTodayCount: 0,
            exceptionsCount: 0,
            queueTasks: [],
        },
        stockOut: {
            label: "Stock Out",
            health: "nominal",
            queueCount: 0,
            completedTodayCount: 0,
            exceptionsCount: 0,
            queueTasks: [],
        },
        inventory: {
            label: "Inventory",
            health: "nominal",
            queueCount: 0,
            completedTodayCount: 0,
            exceptionsCount: 0,
            queueTasks: [],
        },
    },
    liveTransactions: [],
};

describe("useMonitoring", () => {
    beforeEach(() => {
        fetchMonitoringMock.mockReset();
        fetchMonitoringMock.mockResolvedValue(emptyResponse);
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("fetches immediately on start() and shows a loading state during the initial fetch", async () => {
        const composable = useMonitoring();

        composable.start();
        expect(composable.loading.value).toBe(true);

        await vi.runOnlyPendingTimersAsync();
        expect(composable.loading.value).toBe(false);
        expect(composable.data.value).toEqual(emptyResponse);
        expect(fetchMonitoringMock).toHaveBeenCalledTimes(1);

        composable.stop();
    });

    it("polls every 20 seconds after start() without toggling loading back to true", async () => {
        const composable = useMonitoring();

        composable.start();
        await vi.runOnlyPendingTimersAsync();
        expect(fetchMonitoringMock).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(20000);
        expect(fetchMonitoringMock).toHaveBeenCalledTimes(2);
        expect(composable.loading.value).toBe(false);

        await vi.advanceTimersByTimeAsync(20000);
        expect(fetchMonitoringMock).toHaveBeenCalledTimes(3);
        expect(composable.loading.value).toBe(false);

        composable.stop();
    });

    it("stop() clears the interval so no further polling occurs", async () => {
        const composable = useMonitoring();

        composable.start();
        await vi.runOnlyPendingTimersAsync();
        expect(fetchMonitoringMock).toHaveBeenCalledTimes(1);

        composable.stop();
        await vi.advanceTimersByTimeAsync(60000);
        expect(fetchMonitoringMock).toHaveBeenCalledTimes(1);
    });

    it("sets an error message and clears loading when the initial fetch rejects", async () => {
        fetchMonitoringMock.mockRejectedValue(new Error("network down"));
        const composable = useMonitoring();

        composable.start();
        await vi.runOnlyPendingTimersAsync();

        expect(composable.error.value).toBe("network down");
        expect(composable.loading.value).toBe(false);

        composable.stop();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/composables/useMonitoring.test.ts`
Expected: FAIL — `Cannot find module './useMonitoring'`

- [ ] **Step 3: Write `useMonitoring.ts`**

```ts
import { ref } from "vue";
import { useWarehouseStore } from "@/store/warehouse.store";
import { dashboardService } from "@/services/dashboard.service";
import type { MonitoringResponse } from "@/model/dashboard";

const POLL_INTERVAL_MS = 20000;

export function useMonitoring() {
    const warehouseStore = useWarehouseStore();

    const data = ref<MonitoringResponse | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const fetchMonitoring = async (showLoading: boolean): Promise<void> => {
        if (showLoading) loading.value = true;
        error.value = null;
        try {
            data.value = await dashboardService.fetchMonitoring({
                warehouseId: warehouseStore.selectedWarehouseId,
            });
        } catch (err) {
            error.value = err instanceof Error ? err.message : String(err);
        } finally {
            if (showLoading) loading.value = false;
        }
    };

    /** Manual refresh — always shows the loading state (used by a future retry button). */
    const refresh = (): Promise<void> => fetchMonitoring(true);

    /** Initial fetch (with loading state) + starts the 20-second silent poll. */
    const start = (): void => {
        void fetchMonitoring(true);
        intervalId = setInterval(() => {
            void fetchMonitoring(false);
        }, POLL_INTERVAL_MS);
    };

    /** Clears the poll interval. Safe to call more than once. */
    const stop = (): void => {
        if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    return { data, loading, error, refresh, start, stop };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/composables/useMonitoring.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Type-check**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/views/dashboard/composables/useMonitoring.ts src/views/dashboard/composables/useMonitoring.test.ts
git commit -m "feat: add useMonitoring composable with 20-second polling"
```

---

### Task 6: `MonitoringDomainCard.vue`

**Files:**

- Create: `src/views/dashboard/components/MonitoringDomainCard.vue`
- Test: `src/views/dashboard/components/MonitoringDomainCard.test.ts`

**Interfaces:**

- Consumes: `DomainHealth` (Task 4).
- Produces: `MonitoringDomainCard` component, props `{ loading: boolean; data: DomainHealth | null }` — consumed by Task 8 (rendered 3 times, once per domain).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import MonitoringDomainCard from "./MonitoringDomainCard.vue";

describe("MonitoringDomainCard", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(MonitoringDomainCard, {
            loading: true,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders an empty message when there is no domain data", async () => {
        const app = createSSRApp(MonitoringDomainCard, {
            loading: false,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("No domain data available");
    });

    it("renders the health chip, stat grid, and queue task list for a nominal domain", async () => {
        const app = createSSRApp(MonitoringDomainCard, {
            loading: false,
            data: {
                label: "Stock In",
                health: "nominal",
                queueCount: 12,
                completedTodayCount: 48,
                exceptionsCount: 0,
                queueTasks: [
                    { docCode: "IN-2026-0042", locationLabel: "Dock 02" },
                    { docCode: "IN-2026-0043", locationLabel: null },
                ],
            },
        });
        const html = await renderToString(app);

        expect(html).toContain("Stock In");
        expect(html).toContain("bg-success-50");
        expect(html).toContain("text-success-600");
        expect(html).toContain("12");
        expect(html).toContain("48");
        expect(html).toContain("Exceptions");
        expect(html).toContain("IN-2026-0042");
        expect(html).toContain("Dock 02");
        expect(html).toContain("IN-2026-0043");
    });

    it("renders the warning and critical health chip colors", async () => {
        const warningApp = createSSRApp(MonitoringDomainCard, {
            loading: false,
            data: {
                label: "Stock Out",
                health: "warning",
                queueCount: 3,
                completedTodayCount: 10,
                exceptionsCount: 2,
                queueTasks: [],
            },
        });
        const warningHtml = await renderToString(warningApp);
        expect(warningHtml).toContain("bg-warning-50");
        expect(warningHtml).toContain("text-warning-600");

        const criticalApp = createSSRApp(MonitoringDomainCard, {
            loading: false,
            data: {
                label: "Inventory",
                health: "critical",
                queueCount: 5,
                completedTodayCount: 2,
                exceptionsCount: 7,
                queueTasks: [],
            },
        });
        const criticalHtml = await renderToString(criticalApp);
        expect(criticalHtml).toContain("bg-danger-50");
        expect(criticalHtml).toContain("text-danger-600");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/MonitoringDomainCard.test.ts`
Expected: FAIL — `Failed to resolve import "./MonitoringDomainCard.vue"`

- [ ] **Step 3: Write `MonitoringDomainCard.vue`**

```vue
<template>
    <Card object-id="wdg_MonitoringDomainCard">
        <div v-if="loading" class="space-y-3">
            <div
                class="h-5 w-24 rounded bg-surface-secondary animate-pulse"
            ></div>
            <div
                class="h-16 rounded-md bg-surface-secondary animate-pulse"
            ></div>
            <div
                class="h-20 rounded-md bg-surface-secondary animate-pulse"
            ></div>
        </div>

        <div
            v-else-if="!data"
            class="text-sm text-text-secondary text-center py-6"
        >
            No domain data available.
        </div>

        <div v-else class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-gray-900">
                    {{ data.label }}
                </h3>
                <span
                    class="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase"
                    :class="healthChipClass"
                >
                    {{ data.health }}
                </span>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center">
                <div class="rounded-md bg-surface-secondary py-2">
                    <p class="text-lg font-bold text-gray-900">
                        {{ data.queueCount }}
                    </p>
                    <p
                        class="text-[10px] font-semibold uppercase text-text-muted"
                    >
                        Queue
                    </p>
                </div>
                <div class="rounded-md bg-surface-secondary py-2">
                    <p class="text-lg font-bold text-gray-900">
                        {{ data.completedTodayCount }}
                    </p>
                    <p
                        class="text-[10px] font-semibold uppercase text-text-muted"
                    >
                        Completed Today
                    </p>
                </div>
                <div class="rounded-md bg-surface-secondary py-2">
                    <p class="text-lg font-bold text-gray-900">
                        {{ data.exceptionsCount }}
                    </p>
                    <p
                        class="text-[10px] font-semibold uppercase text-text-muted"
                    >
                        Exceptions
                    </p>
                </div>
            </div>

            <div>
                <p class="text-xs font-semibold text-text-secondary mb-2">
                    Queue
                </p>
                <ul v-if="data.queueTasks.length > 0" class="space-y-1.5">
                    <li
                        v-for="task in data.queueTasks"
                        :key="task.docCode"
                        class="flex items-center justify-between text-sm"
                    >
                        <span class="font-medium text-gray-900">{{
                            task.docCode
                        }}</span>
                        <span class="text-text-muted">{{
                            task.locationLabel ?? "—"
                        }}</span>
                    </li>
                </ul>
                <p v-else class="text-sm text-text-secondary">
                    Queue is empty.
                </p>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Card from "@/components/molecules/Card.vue";
import type { DomainHealth } from "@/model/dashboard";

const props = defineProps<{
    loading: boolean;
    data: DomainHealth | null;
}>();

const healthChipClass = computed(() => {
    switch (props.data?.health) {
        case "critical":
            return "bg-danger-50 text-danger-600";
        case "warning":
            return "bg-warning-50 text-warning-600";
        default:
            return "bg-success-50 text-success-600";
    }
});
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/MonitoringDomainCard.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/views/dashboard/components/MonitoringDomainCard.vue src/views/dashboard/components/MonitoringDomainCard.test.ts
git commit -m "feat: add MonitoringDomainCard component"
```

---

### Task 7: `MonitoringLiveFeed.vue`

**Files:**

- Create: `src/views/dashboard/components/MonitoringLiveFeed.vue`
- Test: `src/views/dashboard/components/MonitoringLiveFeed.test.ts`

**Interfaces:**

- Consumes: `LiveTransactionRow[]` (Task 4).
- Produces: `MonitoringLiveFeed` component, props `{ loading: boolean; data: LiveTransactionRow[] | null }` — consumed by Task 8.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import MonitoringLiveFeed from "./MonitoringLiveFeed.vue";

describe("MonitoringLiveFeed", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(MonitoringLiveFeed, {
            loading: true,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders an empty message when there are no live transactions", async () => {
        const app = createSSRApp(MonitoringLiveFeed, {
            loading: false,
            data: [],
        });
        const html = await renderToString(app);
        expect(html).toContain("No live transactions");
    });

    it("renders rows with an OK status badge, priority color, and an SLA bar only when slaPct is present", async () => {
        const app = createSSRApp(MonitoringLiveFeed, {
            loading: false,
            data: [
                {
                    warehouseName: "Jakarta DC",
                    zoneLabel: "Dock 02",
                    operatorName: "Budi Santoso",
                    eventLabel: "Putaway Confirmed",
                    timestamp: "2026-07-18T09:00:00.000Z",
                    durationMinutes: 2,
                    priority: "low",
                    slaPct: null,
                },
                {
                    warehouseName: "Surabaya DC",
                    zoneLabel: null,
                    operatorName: "Siti Aminah",
                    eventLabel: "Picked / Moved Out",
                    timestamp: "2026-07-18T08:40:00.000Z",
                    durationMinutes: 22,
                    priority: "high",
                    slaPct: 68,
                },
            ],
        });
        const html = await renderToString(app);

        expect(html).toContain("OK");
        expect(html).toContain("Jakarta DC");
        expect(html).toContain("Dock 02");
        expect(html).toContain("Budi Santoso");
        expect(html).toContain("Putaway Confirmed");
        expect(html).toContain("text-success-600");
        expect(html).toContain("Surabaya DC");
        expect(html).toContain("text-danger-600");
        expect(html).toContain("68%");
        const slaBarCount = html.split('role="progressbar"').length - 1;
        expect(slaBarCount).toBe(1);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/MonitoringLiveFeed.test.ts`
Expected: FAIL — `Failed to resolve import "./MonitoringLiveFeed.vue"`

- [ ] **Step 3: Write `MonitoringLiveFeed.vue`**

```vue
<template>
    <Card object-id="wdg_MonitoringLiveFeed">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">
            Live Transactions
        </h3>

        <div v-if="loading" class="space-y-2">
            <div
                v-for="n in 6"
                :key="n"
                class="h-8 rounded bg-surface-secondary animate-pulse"
            ></div>
        </div>

        <div
            v-else-if="!data || data.length === 0"
            class="text-sm text-text-secondary text-center py-6"
        >
            No live transactions in the current window.
        </div>

        <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr
                        class="text-left text-[10px] font-semibold uppercase text-text-muted"
                    >
                        <th class="pb-2 pr-3">Status</th>
                        <th class="pb-2 pr-3">Warehouse</th>
                        <th class="pb-2 pr-3">Zone</th>
                        <th class="pb-2 pr-3">Operator</th>
                        <th class="pb-2 pr-3">Event</th>
                        <th class="pb-2 pr-3">Timestamp</th>
                        <th class="pb-2 pr-3">Duration</th>
                        <th class="pb-2 pr-3">Priority</th>
                        <th class="pb-2">SLA</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(row, index) in data"
                        :key="index"
                        class="border-t border-border"
                    >
                        <td class="py-2 pr-3">
                            <span
                                class="rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-semibold text-success-600"
                            >
                                OK
                            </span>
                        </td>
                        <td class="py-2 pr-3">{{ row.warehouseName }}</td>
                        <td class="py-2 pr-3">{{ row.zoneLabel ?? "—" }}</td>
                        <td class="py-2 pr-3">{{ row.operatorName }}</td>
                        <td class="py-2 pr-3">{{ row.eventLabel }}</td>
                        <td class="py-2 pr-3 text-text-secondary">
                            {{ formatTimestamp(row.timestamp) }}
                        </td>
                        <td class="py-2 pr-3">{{ row.durationMinutes }} min</td>
                        <td class="py-2 pr-3">
                            <span
                                class="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase"
                                :class="priorityClass(row.priority)"
                            >
                                {{ row.priority }}
                            </span>
                        </td>
                        <td class="py-2">
                            <template v-if="row.slaPct !== null">
                                <div class="flex items-center gap-1.5">
                                    <div
                                        role="progressbar"
                                        :aria-valuenow="row.slaPct"
                                        class="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100"
                                    >
                                        <div
                                            class="h-full rounded-full bg-primary-600"
                                            :style="{ width: `${row.slaPct}%` }"
                                        ></div>
                                    </div>
                                    <span class="text-xs text-text-muted"
                                        >{{ row.slaPct }}%</span
                                    >
                                </div>
                            </template>
                            <span v-else class="text-xs text-text-muted"
                                >—</span
                            >
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import type { LiveTransactionRow } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: LiveTransactionRow[] | null;
}>();

const formatTimestamp = (iso: string): string => {
    const date = new Date(iso);
    return date.toLocaleString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
    });
};

const priorityClass = (priority: LiveTransactionRow["priority"]): string => {
    switch (priority) {
        case "high":
            return "bg-danger-50 text-danger-600";
        case "med":
            return "bg-warning-50 text-warning-600";
        default:
            return "bg-success-50 text-success-600";
    }
};
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/MonitoringLiveFeed.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/views/dashboard/components/MonitoringLiveFeed.vue src/views/dashboard/components/MonitoringLiveFeed.test.ts
git commit -m "feat: add MonitoringLiveFeed component"
```

---

### Task 8: `MonitoringPage.vue` assembly + route wiring

**Files:**

- Create: `src/views/dashboard/MonitoringPage.vue`
- Create: `src/views/dashboard/MonitoringPage.test.ts`
- Modify: `src/router/index.ts`

**Interfaces:**

- Consumes: `useMonitoring` (Task 5), `MonitoringDomainCard`/`MonitoringLiveFeed` (Tasks 6-7).

- [ ] **Step 1: Write the failing test**

```ts
import { createSSRApp, defineComponent } from "vue";
import { renderToString } from "vue/server-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useMonitoringMock = vi.hoisted(() => vi.fn());

vi.mock("./composables/useMonitoring", () => ({
    useMonitoring: useMonitoringMock,
}));

const stub = vi.hoisted(
    () => (name: string) => defineComponent({ name, setup: () => () => null }),
);

vi.mock("./components/MonitoringDomainCard.vue", () => ({
    default: stub("MonitoringDomainCardStub"),
}));
vi.mock("./components/MonitoringLiveFeed.vue", () => ({
    default: stub("MonitoringLiveFeedStub"),
}));

import MonitoringPage from "./MonitoringPage.vue";

describe("MonitoringPage", () => {
    const start = vi.fn();
    const stop = vi.fn();

    beforeEach(() => {
        useMonitoringMock.mockReset();
        start.mockReset();
        stop.mockReset();
        useMonitoringMock.mockReturnValue({
            data: { value: null },
            loading: { value: false },
            error: { value: null },
            refresh: vi.fn(),
            start,
            stop,
        });
    });

    it("renders the Monitoring page title", async () => {
        const app = createSSRApp(MonitoringPage);
        const html = await renderToString(app);
        expect(html).toContain("Monitoring");
    });

    it("renders the error banner when the composable reports an error", async () => {
        useMonitoringMock.mockReturnValue({
            data: { value: null },
            loading: { value: false },
            error: { value: "network down" },
            refresh: vi.fn(),
            start,
            stop,
        });

        const app = createSSRApp(MonitoringPage);
        const html = await renderToString(app);
        expect(html).toContain("network down");
    });

    it("does not throw when rendering with a fully populated monitoring snapshot", async () => {
        useMonitoringMock.mockReturnValue({
            data: {
                value: {
                    domains: {
                        stockIn: {
                            label: "Stock In",
                            health: "nominal",
                            queueCount: 4,
                            completedTodayCount: 12,
                            exceptionsCount: 0,
                            queueTasks: [],
                        },
                        stockOut: {
                            label: "Stock Out",
                            health: "warning",
                            queueCount: 2,
                            completedTodayCount: 6,
                            exceptionsCount: 2,
                            queueTasks: [],
                        },
                        inventory: {
                            label: "Inventory",
                            health: "critical",
                            queueCount: 1,
                            completedTodayCount: 3,
                            exceptionsCount: 5,
                            queueTasks: [],
                        },
                    },
                    liveTransactions: [],
                },
            },
            loading: { value: false },
            error: { value: null },
            refresh: vi.fn(),
            start,
            stop,
        });

        const app = createSSRApp(MonitoringPage);
        await expect(renderToString(app)).resolves.toContain("Monitoring");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/MonitoringPage.test.ts`
Expected: FAIL — `Failed to resolve import "./MonitoringPage.vue"`

- [ ] **Step 3: Write `MonitoringPage.vue`**

```vue
<template>
    <section class="space-y-6">
        <div>
            <h1 class="text-xl font-bold text-gray-900">Monitoring</h1>
            <p class="text-sm text-text-secondary mt-0.5">
                Real-time event feed and exception monitoring across the network
            </p>
        </div>

        <p
            v-if="error"
            class="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-danger-600"
        >
            {{ error }}
        </p>

        <div class="grid gap-4 lg:grid-cols-3">
            <MonitoringDomainCard
                :loading="loading"
                :data="data?.domains.stockIn ?? null"
            />
            <MonitoringDomainCard
                :loading="loading"
                :data="data?.domains.stockOut ?? null"
            />
            <MonitoringDomainCard
                :loading="loading"
                :data="data?.domains.inventory ?? null"
            />
        </div>

        <MonitoringLiveFeed
            :loading="loading"
            :data="data?.liveTransactions ?? null"
        />
    </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import MonitoringDomainCard from "./components/MonitoringDomainCard.vue";
import MonitoringLiveFeed from "./components/MonitoringLiveFeed.vue";
import { useMonitoring } from "./composables/useMonitoring";

const { data, loading, error, start, stop } = useMonitoring();

onMounted(() => {
    start();
});

onUnmounted(() => {
    stop();
});
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/MonitoringPage.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Wire the route**

In `src/router/index.ts`, remove the `dashboard/monitoring` entry from `dashboardPlaceholderRoutes` — this is the last of the four placeholders, so the array becomes empty. Change:

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

to:

```ts
// All four original dashboard placeholder routes (kpi, process, monitoring, and one
// earlier) have now been replaced by real pages — this stays as an empty array (rather
// than deleting the const and its spread below) so a future placeholder page can be
// added here without touching the route-assembly wiring.
const dashboardPlaceholderRoutes: RouteRecordRaw[] = [];
```

Then add a standalone route alongside the existing `dashboard/kpi`/`dashboard/process` routes:

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
            {
                path: "dashboard/monitoring",
                component: () =>
                    import("@/views/dashboard/MonitoringPage.vue"),
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
git add src/views/dashboard/MonitoringPage.vue src/views/dashboard/MonitoringPage.test.ts src/router/index.ts
git commit -m "feat: add MonitoringPage and wire /dashboard/monitoring route"
```

---

## Post-Implementation Verification

- [ ] Run backend full suite: `cd /Users/syillaeltaniadaffa/Documents/Warehouse-be && npx jest`
- [ ] Run frontend full suite: `cd /Users/syillaeltaniadaffa/Documents/Warehouse && npx vitest run`
- [ ] Run frontend type-check: `npx vue-tsc --noEmit`
- [ ] Start both dev servers and manually load `/dashboard/monitoring` with a real warehouse selected; confirm all 3 domain cards render real queue/completed/exception counts and a health chip, the Live Transactions table populates from real `EpcEvent` rows (or shows the explicit empty state), and the page keeps refreshing every ~20 seconds without a loading flash (open the network tab and confirm a request every 20s after the first).
- [ ] Confirm `dashboardPlaceholderRoutes` in `src/router/index.ts` is now empty — all four original placeholder pages (kpi, process, monitoring, and the earlier one) have real implementations.
