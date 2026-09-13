# Dashboard Executive Summary Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill in the three stubbed dashboard sections (Operations Alert Center, Business Workflow Overview, Executive KPI Snapshot) on `/dashboard/overview` with real backend-driven content, per `docs/spark/specs/2026-07-18-dashboard-executive-summary-design.md`.

**Architecture:** Backend (`Warehouse-be`, NestJS + Prisma) adds a `DocStatusHistory` table recorded going forward from existing status-change call sites (Inbound/Outbound/Putaway/Opname), plus three new dashboard read endpoints (`/dashboard/alerts`, `/dashboard/workflow-overview`, `/dashboard/kpi-snapshot`) computed on-demand like existing dashboard endpoints. Frontend (`Warehouse`, Vue 3) adds matching service/composable wiring and three new Tailwind-based components rendered inside the existing `DashboardPage.vue`.

**Tech Stack:** NestJS 10, Prisma 5, Jest (backend); Vue 3 `<script setup>`, Vitest, Tailwind (frontend).

## Global Constraints

- Backend: follow existing module structure (`controller.ts`/`service.ts`/`module.ts`/`dto/`), `class-validator` DTOs extending `PaginationDto`, `successResponse`/`paginatedResponse` envelope, `@ApiBearerAuthProtected()` + `@ApiStandardOkResponse(...)` decorator pairs, manual `companyId`/`warehouseId` where-clause scoping — no automatic tenant guard exists.
- Backend: no historical backfill for `DocStatusHistory` — trend/wait-time fields must return `null` when insufficient history exists, never a fabricated number.
- Backend: no RFID reader/device alert type — do not add one.
- Backend: no cron/scheduler — all new endpoints compute synchronously on request, same as existing dashboard endpoints.
- Backend tests use Jest + `Test.createTestingModule` with a hand-rolled `mockPrismaService` object (see `warehouses.service.spec.ts`), not a real database.
- Frontend: match existing Tailwind design system (`Card`, `Icon` from `lucide-vue-next`, existing color tokens) — do not import the mockup's standalone CSS.
- Frontend tests use Vitest + `createSSRApp`/`renderToString` for page-level tests (see `DashboardPage.test.ts`).
- Frontend: `dashboard.service.ts` methods take a `DashboardFilterState` and return already-shaped data (query-param building + response reshaping happens here, not in components).

---

## Backend Tasks (`/Users/syillaeltaniadaffa/Documents/Warehouse-be`)

### Task 1: `DocStatusHistory` Prisma model + migration

**Files:**

- Modify: `prisma/schema.prisma` (append after line 1082, end of file)
- Test: manual verification via `npx prisma validate` (no unit test framework covers schema files)

**Interfaces:**

- Produces: Prisma model `DocStatusHistory` with fields `id`, `docType`, `docId`, `companyId`, `warehouseId`, `fromStatus`, `toStatus`, `changedAt`, accessible at runtime as `prisma.docStatusHistory`.

- [ ] **Step 1: Append the model to `prisma/schema.prisma`**

```prisma
model DocStatusHistory {
  id          String   @id @default(uuid()) @db.Uuid
  docType     String   @map("doc_type") @db.VarChar
  docId       String   @map("doc_id") @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  warehouseId String   @map("warehouse_id") @db.Uuid
  fromStatus  String   @map("from_status") @db.VarChar
  toStatus    String   @map("to_status") @db.VarChar
  changedAt   DateTime @default(now()) @map("changed_at") @db.Timestamptz(6)

  @@index([docType, docId])
  @@index([companyId])
  @@index([warehouseId])
  @@index([changedAt])
  @@map("doc_status_history")
}
```

- [ ] **Step 2: Validate the schema**

Run: `npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 3: Generate the migration**

Run: `npm run prisma:migrate:dev -- --name add_doc_status_history`
Expected: prompts create `prisma/migrations/<timestamp>_add_doc_status_history/migration.sql` containing `CREATE TABLE "doc_status_history" (...)`, then runs `prisma generate`, ending with `Your database is now in sync with your schema.`

- [ ] **Step 4: Regenerate the Prisma client**

Run: `npm run prisma:generate`
Expected: `✔ Generated Prisma Client` with no errors, and `PrismaService['docStatusHistory']` now type-checks.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add DocStatusHistory table for stage transition tracking"
```

---

### Task 2: `DocStatusHistoryService` + module

**Files:**

- Create: `src/modules/warehouse/doc-status-history/doc-status-history.types.ts`
- Create: `src/modules/warehouse/doc-status-history/doc-status-history.service.ts`
- Create: `src/modules/warehouse/doc-status-history/doc-status-history.module.ts`
- Test: `src/modules/warehouse/doc-status-history/doc-status-history.service.spec.ts`

**Interfaces:**

- Consumes: `PrismaService` (`../../../shared/prisma/prisma.service`).
- Produces: `DocStatusHistoryService.recordTransition(params: RecordTransitionParams, client?: DocStatusHistoryTransactionClient): Promise<void>`; `DocStatusHistoryService.getDailyTransitionCounts(params: { docType: DocStatusHistoryDocType; toStatus: string; companyId?: string; warehouseId?: string; sinceDays: number }): Promise<{ date: string; count: number }[]>` — used by Tasks 8/9 for trend calculations. `DocStatusHistoryTransactionClient` type, `DocStatusHistoryDocType` union `'inbound' | 'outbound' | 'putaway' | 'opname'`, exported from `doc-status-history.types.ts`.

- [ ] **Step 1: Write the failing test**

Create `src/modules/warehouse/doc-status-history/doc-status-history.service.spec.ts`:

```ts
import { Test, TestingModule } from "@nestjs/testing";
import { DocStatusHistoryService } from "./doc-status-history.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";

describe("DocStatusHistoryService", () => {
    let service: DocStatusHistoryService;

    const mockPrismaService: any = {
        docStatusHistory: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DocStatusHistoryService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<DocStatusHistoryService>(DocStatusHistoryService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    describe("recordTransition", () => {
        it("writes a history row with the given transition", async () => {
            await service.recordTransition({
                docType: "inbound",
                docId: "doc-1",
                companyId: "company-1",
                warehouseId: "wh-1",
                fromStatus: "draft",
                toStatus: "posted",
            });

            expect(
                mockPrismaService.docStatusHistory.create,
            ).toHaveBeenCalledWith({
                data: {
                    docType: "inbound",
                    docId: "doc-1",
                    companyId: "company-1",
                    warehouseId: "wh-1",
                    fromStatus: "draft",
                    toStatus: "posted",
                },
            });
        });

        it("writes through a transaction client when one is provided", async () => {
            const txCreate = jest.fn();
            const tx = { docStatusHistory: { create: txCreate } };

            await service.recordTransition(
                {
                    docType: "outbound",
                    docId: "doc-2",
                    companyId: "company-1",
                    warehouseId: "wh-1",
                    fromStatus: "draft",
                    toStatus: "posted",
                },
                tx as any,
            );

            expect(txCreate).toHaveBeenCalledTimes(1);
            expect(
                mockPrismaService.docStatusHistory.create,
            ).not.toHaveBeenCalled();
        });
    });

    describe("getDailyTransitionCounts", () => {
        it("groups history rows into daily counts", async () => {
            mockPrismaService.docStatusHistory.findMany.mockResolvedValue([
                { changedAt: new Date("2026-07-10T09:00:00Z") },
                { changedAt: new Date("2026-07-10T14:00:00Z") },
                { changedAt: new Date("2026-07-11T08:00:00Z") },
            ]);

            const result = await service.getDailyTransitionCounts({
                docType: "inbound",
                toStatus: "posted",
                companyId: "company-1",
                sinceDays: 7,
            });

            expect(result).toEqual([
                { date: "2026-07-10", count: 2 },
                { date: "2026-07-11", count: 1 },
            ]);
        });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/modules/warehouse/doc-status-history/doc-status-history.service.spec.ts`
Expected: FAIL — `Cannot find module './doc-status-history.service'`

- [ ] **Step 3: Write `doc-status-history.types.ts`**

```ts
import type { PrismaService } from "../../../shared/prisma/prisma.service";

export type DocStatusHistoryDocType =
    | "inbound"
    | "outbound"
    | "putaway"
    | "opname";

export interface RecordTransitionParams {
    docType: DocStatusHistoryDocType;
    docId: string;
    companyId: string;
    warehouseId: string;
    fromStatus: string;
    toStatus: string;
}

/** Transaction client for use inside $transaction callback (model access only). */
export type DocStatusHistoryTransactionClient = {
    docStatusHistory: PrismaService["docStatusHistory"];
};
```

- [ ] **Step 4: Write `doc-status-history.service.ts`**

```ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import type {
    DocStatusHistoryDocType,
    DocStatusHistoryTransactionClient,
    RecordTransitionParams,
} from "./doc-status-history.types";

@Injectable()
export class DocStatusHistoryService {
    constructor(private readonly prisma: PrismaService) {}

    async recordTransition(
        params: RecordTransitionParams,
        client: DocStatusHistoryTransactionClient = this.prisma,
    ): Promise<void> {
        await client.docStatusHistory.create({
            data: {
                docType: params.docType,
                docId: params.docId,
                companyId: params.companyId,
                warehouseId: params.warehouseId,
                fromStatus: params.fromStatus,
                toStatus: params.toStatus,
            },
        });
    }

    async getDailyTransitionCounts(params: {
        docType: DocStatusHistoryDocType;
        toStatus: string;
        companyId?: string;
        warehouseId?: string;
        sinceDays: number;
    }): Promise<{ date: string; count: number }[]> {
        const since = new Date();
        since.setDate(since.getDate() - params.sinceDays);

        const rows = await this.prisma.docStatusHistory.findMany({
            where: {
                docType: params.docType,
                toStatus: params.toStatus,
                companyId: params.companyId,
                warehouseId: params.warehouseId,
                changedAt: { gte: since },
            },
            select: { changedAt: true },
        });

        const counts = new Map<string, number>();
        rows.forEach((row) => {
            const day = row.changedAt.toISOString().split("T")[0];
            counts.set(day, (counts.get(day) ?? 0) + 1);
        });

        return [...counts.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, count]) => ({ date, count }));
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/modules/warehouse/doc-status-history/doc-status-history.service.spec.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Write `doc-status-history.module.ts`**

```ts
import { Module } from "@nestjs/common";
import { DocStatusHistoryService } from "./doc-status-history.service";

@Module({
    providers: [DocStatusHistoryService],
    exports: [DocStatusHistoryService],
})
export class DocStatusHistoryModule {}
```

- [ ] **Step 7: Commit**

```bash
git add src/modules/warehouse/doc-status-history
git commit -m "feat: add DocStatusHistoryService for recording and querying doc status transitions"
```

---

### Task 3: Wire `DocStatusHistoryService` into `InboundService`

**Files:**

- Modify: `src/modules/warehouse/inbound/inbound.service.ts` (`post()` ~line 210, `cancel()` ~line 274)
- Modify: `src/modules/warehouse/inbound/inbound.module.ts`
- Test: `src/modules/warehouse/inbound/inbound.service.spec.ts` (create if it doesn't exist — check first with `ls src/modules/warehouse/inbound/*.spec.ts`; if one exists, add these two `it` blocks to it instead of creating a new file)

**Interfaces:**

- Consumes: `DocStatusHistoryService.recordTransition` (Task 2), `DocStatusHistoryModule` (Task 2).

- [ ] **Step 1: Check for an existing spec file**

Run: `ls src/modules/warehouse/inbound/*.spec.ts`

- [ ] **Step 2: Write the failing test**

If `inbound.service.spec.ts` exists, add the two `it` blocks below inside a `describe('post')` / `describe('cancel')`. If it does not exist, create it with this minimal structure (adjust the mocked `stockService`/exception imports if the real file already provides them):

```ts
import { Test, TestingModule } from "@nestjs/testing";
import { InboundService } from "./inbound.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { StockService } from "../stock/stock.service";
import { DocStatusHistoryService } from "../doc-status-history/doc-status-history.service";

describe("InboundService status history", () => {
    let service: InboundService;

    const mockPrismaService: any = {
        inboundDoc: {
            findUnique: jest.fn(),
            findUniqueOrThrow: jest.fn(),
            update: jest.fn(),
        },
        $transaction: jest.fn((callback: any) => callback(mockPrismaService)),
    };
    const mockStockService: any = { applyInboundMovement: jest.fn() };
    const mockDocStatusHistoryService: any = { recordTransition: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InboundService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: StockService, useValue: mockStockService },
                {
                    provide: DocStatusHistoryService,
                    useValue: mockDocStatusHistoryService,
                },
            ],
        }).compile();

        service = module.get<InboundService>(InboundService);
    });

    afterEach(() => jest.clearAllMocks());

    it("records a draft->posted transition when posting", async () => {
        const doc = {
            id: "doc-1",
            companyId: "company-1",
            warehouse_id: "wh-1",
            status: "draft",
            inbound_no: "IN-001",
            lines: [
                {
                    qty: { toNumber: () => 5 },
                    productId: "prod-1",
                    location: { id: "loc-1", warehouseId: "wh-1" },
                },
            ],
        };
        mockPrismaService.inboundDoc.findUnique.mockResolvedValue(doc);
        mockPrismaService.inboundDoc.findUniqueOrThrow.mockResolvedValue(doc);

        await service.post("doc-1", { id: "user-1" } as any);

        expect(
            mockDocStatusHistoryService.recordTransition,
        ).toHaveBeenCalledWith(
            {
                docType: "inbound",
                docId: "doc-1",
                companyId: "company-1",
                warehouseId: "wh-1",
                fromStatus: "draft",
                toStatus: "posted",
            },
            mockPrismaService,
        );
    });

    it("records a draft->canceled transition when canceling", async () => {
        const doc = {
            id: "doc-2",
            companyId: "company-1",
            warehouse_id: "wh-1",
            status: "draft",
        };
        mockPrismaService.inboundDoc.findUnique.mockResolvedValue(doc);
        mockPrismaService.inboundDoc.findUniqueOrThrow.mockResolvedValue(doc);

        await service.cancel("doc-2");

        expect(
            mockDocStatusHistoryService.recordTransition,
        ).toHaveBeenCalledWith({
            docType: "inbound",
            docId: "doc-2",
            companyId: "company-1",
            warehouseId: "wh-1",
            fromStatus: "draft",
            toStatus: "canceled",
        });
    });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/modules/warehouse/inbound/inbound.service.spec.ts`
Expected: FAIL — `Nest can't resolve dependencies of the InboundService` (unknown `DocStatusHistoryService`) or `mockDocStatusHistoryService.recordTransition` never called.

- [ ] **Step 4: Inject `DocStatusHistoryService` and call it at both sites**

In `inbound.service.ts`, add the import:

```ts
import { DocStatusHistoryService } from "../doc-status-history/doc-status-history.service";
```

Update the constructor (find the existing `constructor(` block and add the parameter):

```ts
@Injectable()
export class InboundService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly docStatusHistoryService: DocStatusHistoryService,
  ) {}
```

In `post()`, immediately after `await tx.inboundDoc.update({ where: { id }, data: { status: 'posted' } });` add:

```ts
await this.docStatusHistoryService.recordTransition(
    {
        docType: "inbound",
        docId: id,
        companyId: doc.companyId,
        warehouseId: doc.lines[0]?.location.warehouseId ?? "",
        fromStatus: doc.status,
        toStatus: "posted",
    },
    tx,
);
```

In `cancel()`, immediately after `await this.prisma.inboundDoc.update({ where: { id }, data: { status: 'canceled' } });` add:

```ts
await this.docStatusHistoryService.recordTransition({
    docType: "inbound",
    docId: id,
    companyId: doc.companyId,
    warehouseId: doc.warehouse_id,
    fromStatus: doc.status,
    toStatus: "canceled",
});
```

Note: `post()`'s `doc` (fetched via `findUnique` with `lines` include) does not select the top-level `warehouse_id` column in its `include`, so use `doc.lines[0]?.location.warehouseId` (already validated single-warehouse via the existing `warehouseIds.size > 1` check just above). `cancel()`'s `doc` is fetched with a plain `findUnique({ where: { id } })`, which returns the full row including `warehouse_id` directly.

- [ ] **Step 5: Update `inbound.module.ts` to provide `DocStatusHistoryService`**

```ts
import { Module } from "@nestjs/common";
import { InboundController } from "./inbound.controller";
import { InboundService } from "./inbound.service";
import { StockModule } from "../stock/stock.module";
import { DocStatusHistoryModule } from "../doc-status-history/doc-status-history.module";

/**
 * Inbound Module — Goods receipt documents.
 * Posting creates stock ledger entries and updates balance via StockService (same transaction).
 */
@Module({
    imports: [StockModule, DocStatusHistoryModule],
    controllers: [InboundController],
    providers: [InboundService],
    exports: [InboundService],
})
export class InboundModule {}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx jest src/modules/warehouse/inbound/inbound.service.spec.ts`
Expected: PASS

- [ ] **Step 7: Run the full inbound test suite to check for regressions**

Run: `npx jest src/modules/warehouse/inbound`
Expected: PASS (all inbound tests, including any pre-existing `post`/`cancel` tests unaffected by the new call)

- [ ] **Step 8: Commit**

```bash
git add src/modules/warehouse/inbound
git commit -m "feat: record inbound doc status transitions to DocStatusHistory"
```

---

### Task 4: Wire `DocStatusHistoryService` into `OutboundService`

**Files:**

- Modify: `src/modules/warehouse/outbound/outbound.service.ts` (`post()` ~line 221, `cancel()` ~line 276)
- Modify: `src/modules/warehouse/outbound/outbound.module.ts`
- Test: `src/modules/warehouse/outbound/outbound.service.spec.ts` (create or extend, same rule as Task 3 Step 1)

**Interfaces:**

- Consumes: `DocStatusHistoryService.recordTransition` (Task 2).

- [ ] **Step 1: Check for an existing spec file**

Run: `ls src/modules/warehouse/outbound/*.spec.ts`

- [ ] **Step 2: Write the failing test**

Mirror Task 3 Step 2 exactly, substituting `OutboundService`, `outboundDoc`, `outbound_no`, and `docType: 'outbound'`:

```ts
import { Test, TestingModule } from "@nestjs/testing";
import { OutboundService } from "./outbound.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { StockService } from "../stock/stock.service";
import { DocStatusHistoryService } from "../doc-status-history/doc-status-history.service";

describe("OutboundService status history", () => {
    let service: OutboundService;

    const mockPrismaService: any = {
        outboundDoc: {
            findUnique: jest.fn(),
            findUniqueOrThrow: jest.fn(),
            update: jest.fn(),
        },
        $transaction: jest.fn((callback: any) => callback(mockPrismaService)),
    };
    const mockStockService: any = { applyOutboundMovement: jest.fn() };
    const mockDocStatusHistoryService: any = { recordTransition: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OutboundService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: StockService, useValue: mockStockService },
                {
                    provide: DocStatusHistoryService,
                    useValue: mockDocStatusHistoryService,
                },
            ],
        }).compile();

        service = module.get<OutboundService>(OutboundService);
    });

    afterEach(() => jest.clearAllMocks());

    it("records a draft->posted transition when posting", async () => {
        const doc = {
            id: "doc-1",
            companyId: "company-1",
            warehouse_id: "wh-1",
            status: "draft",
            outbound_no: "OUT-001",
            lines: [
                {
                    qty: { toNumber: () => 5 },
                    productId: "prod-1",
                    location: { id: "loc-1", warehouseId: "wh-1" },
                },
            ],
        };
        mockPrismaService.outboundDoc.findUnique.mockResolvedValue(doc);
        mockPrismaService.outboundDoc.findUniqueOrThrow.mockResolvedValue(doc);

        await service.post("doc-1", { id: "user-1" } as any);

        expect(
            mockDocStatusHistoryService.recordTransition,
        ).toHaveBeenCalledWith(
            {
                docType: "outbound",
                docId: "doc-1",
                companyId: "company-1",
                warehouseId: "wh-1",
                fromStatus: "draft",
                toStatus: "posted",
            },
            mockPrismaService,
        );
    });

    it("records a draft->canceled transition when canceling", async () => {
        const doc = {
            id: "doc-2",
            companyId: "company-1",
            warehouse_id: "wh-1",
            status: "draft",
        };
        mockPrismaService.outboundDoc.findUnique.mockResolvedValue(doc);
        mockPrismaService.outboundDoc.findUniqueOrThrow.mockResolvedValue(doc);

        await service.cancel("doc-2");

        expect(
            mockDocStatusHistoryService.recordTransition,
        ).toHaveBeenCalledWith({
            docType: "outbound",
            docId: "doc-2",
            companyId: "company-1",
            warehouseId: "wh-1",
            fromStatus: "draft",
            toStatus: "canceled",
        });
    });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/modules/warehouse/outbound/outbound.service.spec.ts`
Expected: FAIL

- [ ] **Step 4: Inject and call `DocStatusHistoryService`**

Add the import and constructor parameter (same shape as Task 3 Step 4), then in `post()` after `await tx.outboundDoc.update({ where: { id }, data: { status: 'posted' } });` add:

```ts
await this.docStatusHistoryService.recordTransition(
    {
        docType: "outbound",
        docId: id,
        companyId: doc.companyId,
        warehouseId: doc.lines[0]?.location.warehouseId ?? "",
        fromStatus: doc.status,
        toStatus: "posted",
    },
    tx,
);
```

In `cancel()` after `await this.prisma.outboundDoc.update({ where: { id }, data: { status: 'canceled' } });` add:

```ts
await this.docStatusHistoryService.recordTransition({
    docType: "outbound",
    docId: id,
    companyId: doc.companyId,
    warehouseId: doc.warehouse_id,
    fromStatus: doc.status,
    toStatus: "canceled",
});
```

- [ ] **Step 5: Update `outbound.module.ts`**

```ts
import { Module } from "@nestjs/common";
import { OutboundController } from "./outbound.controller";
import { OutboundService } from "./outbound.service";
import { StockModule } from "../stock/stock.module";
import { DocStatusHistoryModule } from "../doc-status-history/doc-status-history.module";

@Module({
    imports: [StockModule, DocStatusHistoryModule],
    controllers: [OutboundController],
    providers: [OutboundService],
    exports: [OutboundService],
})
export class OutboundModule {}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx jest src/modules/warehouse/outbound/outbound.service.spec.ts`
Expected: PASS

- [ ] **Step 7: Run the full outbound test suite to check for regressions**

Run: `npx jest src/modules/warehouse/outbound`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/modules/warehouse/outbound
git commit -m "feat: record outbound doc status transitions to DocStatusHistory"
```

---

### Task 5: Wire `DocStatusHistoryService` into `PutawayService`

**Files:**

- Modify: `src/modules/warehouse/putaway/putaway.service.ts` (`post()` ~178, `cancel()` ~201, `complete()` ~218)
- Modify: `src/modules/warehouse/putaway/putaway.module.ts`
- Test: `src/modules/warehouse/putaway/putaway.service.spec.ts` (create or extend)

**Interfaces:**

- Consumes: `DocStatusHistoryService.recordTransition` (Task 2).

- [ ] **Step 1: Check for an existing spec file**

Run: `ls src/modules/warehouse/putaway/*.spec.ts`

- [ ] **Step 2: Write the failing test**

```ts
import { Test, TestingModule } from "@nestjs/testing";
import { PutawayService } from "./putaway.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { DocStatusHistoryService } from "../doc-status-history/doc-status-history.service";

describe("PutawayService status history", () => {
    let service: PutawayService;

    const mockPrismaService: any = {
        putawayDoc: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };
    const mockDocStatusHistoryService: any = { recordTransition: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PutawayService,
                { provide: PrismaService, useValue: mockPrismaService },
                {
                    provide: DocStatusHistoryService,
                    useValue: mockDocStatusHistoryService,
                },
            ],
        }).compile();

        service = module.get<PutawayService>(PutawayService);
    });

    afterEach(() => jest.clearAllMocks());

    it("records a draft->posted transition when posting", async () => {
        const doc = {
            id: "doc-1",
            companyId: "company-1",
            warehouse_id: "wh-1",
            status: "draft",
            lines: [{ id: "line-1" }],
        };
        mockPrismaService.putawayDoc.findUnique.mockResolvedValue(doc);
        mockPrismaService.putawayDoc.update.mockResolvedValue({
            ...doc,
            status: "posted",
        });

        await service.post("doc-1");

        expect(
            mockDocStatusHistoryService.recordTransition,
        ).toHaveBeenCalledWith({
            docType: "putaway",
            docId: "doc-1",
            companyId: "company-1",
            warehouseId: "wh-1",
            fromStatus: "draft",
            toStatus: "posted",
        });
    });

    it("records a posted->done transition when completing", async () => {
        const doc = {
            id: "doc-2",
            companyId: "company-1",
            warehouse_id: "wh-1",
            status: "posted",
        };
        mockPrismaService.putawayDoc.findUnique.mockResolvedValue(doc);
        mockPrismaService.putawayDoc.update.mockResolvedValue({
            ...doc,
            status: "done",
        });

        await service.complete("doc-2");

        expect(
            mockDocStatusHistoryService.recordTransition,
        ).toHaveBeenCalledWith({
            docType: "putaway",
            docId: "doc-2",
            companyId: "company-1",
            warehouseId: "wh-1",
            fromStatus: "posted",
            toStatus: "done",
        });
    });

    it("records a transition to canceled when canceling", async () => {
        const doc = {
            id: "doc-3",
            companyId: "company-1",
            warehouse_id: "wh-1",
            status: "draft",
        };
        mockPrismaService.putawayDoc.findUnique.mockResolvedValue(doc);
        mockPrismaService.putawayDoc.update.mockResolvedValue({
            ...doc,
            status: "canceled",
        });

        await service.cancel("doc-3");

        expect(
            mockDocStatusHistoryService.recordTransition,
        ).toHaveBeenCalledWith({
            docType: "putaway",
            docId: "doc-3",
            companyId: "company-1",
            warehouseId: "wh-1",
            fromStatus: "draft",
            toStatus: "canceled",
        });
    });
});
```

Note: the real `putaway.service.ts` includes `PUTAWAY_DOC_INCLUDE` on its `update()` calls — the mocked `update` above returns a plain object, which is fine since the test only asserts on `recordTransition`'s arguments, not the full returned shape.

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/modules/warehouse/putaway/putaway.service.spec.ts`
Expected: FAIL

- [ ] **Step 4: Inject and call `DocStatusHistoryService` at all three sites**

Add the import and constructor parameter:

```ts
import { DocStatusHistoryService } from "../doc-status-history/doc-status-history.service";
```

```ts
@Injectable()
export class PutawayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly docStatusHistoryService: DocStatusHistoryService,
  ) {}
```

In `post()`, after `const updated = await this.prisma.putawayDoc.update({ where: { id }, data: { status: 'posted' }, include: PUTAWAY_DOC_INCLUDE });` add:

```ts
await this.docStatusHistoryService.recordTransition({
    docType: "putaway",
    docId: id,
    companyId: doc.companyId,
    warehouseId: doc.warehouse_id,
    fromStatus: doc.status,
    toStatus: "posted",
});
```

In `cancel()`, after its `update(...)` call add:

```ts
await this.docStatusHistoryService.recordTransition({
    docType: "putaway",
    docId: id,
    companyId: doc.companyId,
    warehouseId: doc.warehouse_id,
    fromStatus: doc.status,
    toStatus: "canceled",
});
```

In `complete()`, after its `update(...)` call add:

```ts
await this.docStatusHistoryService.recordTransition({
    docType: "putaway",
    docId: id,
    companyId: doc.companyId,
    warehouseId: doc.warehouse_id,
    fromStatus: doc.status,
    toStatus: "done",
});
```

- [ ] **Step 5: Update `putaway.module.ts`**

```ts
import { Module } from "@nestjs/common";
import { PutawayController } from "./putaway.controller";
import { PutawayService } from "./putaway.service";
import { DocStatusHistoryModule } from "../doc-status-history/doc-status-history.module";

@Module({
    imports: [DocStatusHistoryModule],
    controllers: [PutawayController],
    providers: [PutawayService],
    exports: [PutawayService],
})
export class PutawayModule {}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx jest src/modules/warehouse/putaway/putaway.service.spec.ts`
Expected: PASS

- [ ] **Step 7: Run the full putaway test suite to check for regressions**

Run: `npx jest src/modules/warehouse/putaway`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/modules/warehouse/putaway
git commit -m "feat: record putaway doc status transitions to DocStatusHistory"
```

---

### Task 6: Wire `DocStatusHistoryService` into `OpnameMutationService`

**Files:**

- Modify: `src/modules/warehouse/opname/opname-mutation.service.ts` (`startCounting()` ~155, `reconcile()` ~216, `close()` ~272, `cancel()` ~296)
- Modify: `src/modules/warehouse/opname/opname.module.ts`
- Test: `src/modules/warehouse/opname/opname-mutation.service.spec.ts` (create or extend)

**Interfaces:**

- Consumes: `DocStatusHistoryService.recordTransition` (Task 2).

- [ ] **Step 1: Check for an existing spec file**

Run: `ls src/modules/warehouse/opname/*.spec.ts`

- [ ] **Step 2: Write the failing test**

```ts
import { Test, TestingModule } from "@nestjs/testing";
import { OpnameMutationService } from "./opname-mutation.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { StockService } from "../stock/stock.service";
import { DocStatusHistoryService } from "../doc-status-history/doc-status-history.service";

describe("OpnameMutationService status history", () => {
    let service: OpnameMutationService;

    const mockPrismaService: any = {
        opnameDoc: {
            findUnique: jest.fn(),
            findUniqueOrThrow: jest.fn(),
            update: jest.fn(),
        },
        $transaction: jest.fn((callback: any) => callback(mockPrismaService)),
    };
    const mockStockService: any = { applyOpnameAdjustment: jest.fn() };
    const mockDocStatusHistoryService: any = { recordTransition: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OpnameMutationService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: StockService, useValue: mockStockService },
                {
                    provide: DocStatusHistoryService,
                    useValue: mockDocStatusHistoryService,
                },
            ],
        }).compile();

        service = module.get<OpnameMutationService>(OpnameMutationService);
    });

    afterEach(() => jest.clearAllMocks());

    it("records draft->counting on startCounting", async () => {
        const doc = {
            id: "doc-1",
            companyId: "company-1",
            warehouse_id: "wh-1",
            status: "draft",
        };
        mockPrismaService.opnameDoc.findUnique.mockResolvedValue(doc);
        mockPrismaService.opnameDoc.update.mockResolvedValue({
            ...doc,
            status: "counting",
        });

        await service.startCounting("doc-1", {} as any);

        expect(
            mockDocStatusHistoryService.recordTransition,
        ).toHaveBeenCalledWith(
            {
                docType: "opname",
                docId: "doc-1",
                companyId: "company-1",
                warehouseId: "wh-1",
                fromStatus: "draft",
                toStatus: "counting",
            },
            mockPrismaService,
        );
    });

    it("records counting->reconciled on reconcile", async () => {
        const doc = {
            id: "doc-2",
            companyId: "company-1",
            warehouse_id: "wh-1",
            status: "counting",
        };
        mockPrismaService.opnameDoc.findUnique.mockResolvedValue(doc);
        mockPrismaService.opnameDoc.update.mockResolvedValue({
            ...doc,
            status: "reconciled",
        });

        await service.reconcile("doc-2");

        expect(
            mockDocStatusHistoryService.recordTransition,
        ).toHaveBeenCalledWith({
            docType: "opname",
            docId: "doc-2",
            companyId: "company-1",
            warehouseId: "wh-1",
            fromStatus: "counting",
            toStatus: "reconciled",
        });
    });

    it("records reconciled->closed on close", async () => {
        const doc = {
            id: "doc-3",
            companyId: "company-1",
            warehouse_id: "wh-1",
            status: "reconciled",
            profile_id: "PROF-1",
            title: "Profile 1",
            lines: [],
        };
        mockPrismaService.opnameDoc.findUnique.mockResolvedValue(doc);
        mockPrismaService.opnameDoc.findUniqueOrThrow.mockResolvedValue(doc);

        await service.close("doc-3", { id: "user-1" } as any);

        expect(
            mockDocStatusHistoryService.recordTransition,
        ).toHaveBeenCalledWith(
            {
                docType: "opname",
                docId: "doc-3",
                companyId: "company-1",
                warehouseId: "wh-1",
                fromStatus: "reconciled",
                toStatus: "closed",
            },
            mockPrismaService,
        );
    });

    it("records a transition to canceled on cancel", async () => {
        const doc = {
            id: "doc-4",
            companyId: "company-1",
            warehouse_id: "wh-1",
            status: "draft",
        };
        mockPrismaService.opnameDoc.findUnique.mockResolvedValue(doc);
        mockPrismaService.opnameDoc.update.mockResolvedValue({
            ...doc,
            status: "canceled",
        });

        await service.cancel("doc-4");

        expect(
            mockDocStatusHistoryService.recordTransition,
        ).toHaveBeenCalledWith({
            docType: "opname",
            docId: "doc-4",
            companyId: "company-1",
            warehouseId: "wh-1",
            fromStatus: "draft",
            toStatus: "canceled",
        });
    });
});
```

Note: the plan assumes `startCounting`, `reconcile`, `close`, `cancel` have the signatures implied by the earlier exploration (`startCounting(id, dto)`, `reconcile(id)`, `close(id, user)`, `cancel(id)`). Before writing this test, open `opname-mutation.service.ts` and confirm each method's actual parameter list, adjusting the test calls to match exactly.

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/modules/warehouse/opname/opname-mutation.service.spec.ts`
Expected: FAIL

- [ ] **Step 4: Inject and call `DocStatusHistoryService` at all four sites**

Add the import and constructor parameter:

```ts
import { DocStatusHistoryService } from "../doc-status-history/doc-status-history.service";
```

```ts
@Injectable()
export class OpnameMutationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly docStatusHistoryService: DocStatusHistoryService,
  ) {
```

(keep any additional existing constructor lines below `stockService` as-is — only add the new parameter.)

In `startCounting()`, after `await tx.opnameDoc.update({ where: { id }, data: { status: 'counting' } });` add:

```ts
await this.docStatusHistoryService.recordTransition(
    {
        docType: "opname",
        docId: id,
        companyId: doc.companyId,
        warehouseId: doc.warehouse_id,
        fromStatus: doc.status,
        toStatus: "counting",
    },
    tx,
);
```

In `reconcile()`, after `await this.prisma.opnameDoc.update({ where: { id }, data: { status: 'reconciled' } });` add:

```ts
await this.docStatusHistoryService.recordTransition({
    docType: "opname",
    docId: id,
    companyId: doc.companyId,
    warehouseId: doc.warehouse_id,
    fromStatus: doc.status,
    toStatus: "reconciled",
});
```

In `close()`, after `await tx.opnameDoc.update({ where: { id }, data: { status: 'closed' } });` add:

```ts
await this.docStatusHistoryService.recordTransition(
    {
        docType: "opname",
        docId: id,
        companyId: doc.companyId,
        warehouseId: doc.warehouse_id,
        fromStatus: doc.status,
        toStatus: "closed",
    },
    tx,
);
```

In `cancel()`, after `await this.prisma.opnameDoc.update({ where: { id }, data: { status: 'canceled' } });` add:

```ts
await this.docStatusHistoryService.recordTransition({
    docType: "opname",
    docId: id,
    companyId: doc.companyId,
    warehouseId: doc.warehouse_id,
    fromStatus: doc.status,
    toStatus: "canceled",
});
```

For each of `startCounting`/`reconcile`/`cancel`, confirm the pre-fetched `doc` variable (fetched via `findUnique` earlier in the method, before the update) is still in scope at the point of insertion — if the existing code re-fetches or shadows `doc`, use whichever variable holds the row fetched before the status update.

- [ ] **Step 5: Update `opname.module.ts`**

```ts
import { Module } from "@nestjs/common";
import { OpnameController } from "./opname.controller";
import { OpnameService } from "./opname.service";
import { OpnameMutationService } from "./opname-mutation.service";
import { OpnameQueryService } from "./opname-query.service";
import { StockModule } from "../stock/stock.module";
import { DocStatusHistoryModule } from "../doc-status-history/doc-status-history.module";

@Module({
    imports: [StockModule, DocStatusHistoryModule],
    controllers: [OpnameController],
    providers: [OpnameService, OpnameMutationService, OpnameQueryService],
    exports: [OpnameService],
})
export class OpnameModule {}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx jest src/modules/warehouse/opname/opname-mutation.service.spec.ts`
Expected: PASS

- [ ] **Step 7: Run the full opname test suite to check for regressions**

Run: `npx jest src/modules/warehouse/opname`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/modules/warehouse/opname
git commit -m "feat: record opname doc status transitions to DocStatusHistory"
```

---

### Task 7: `GET /dashboard/alerts` endpoint

**Files:**

- Create: `src/modules/warehouse/dashboard/dashboard-alert.types.ts`
- Create: `src/modules/warehouse/dashboard/dashboard-alerts.service.ts`
- Modify: `src/modules/warehouse/dashboard/dashboard.controller.ts` (add route)
- Modify: `src/modules/warehouse/dashboard/dashboard.module.ts` (register new service)
- Test: `src/modules/warehouse/dashboard/dashboard-alerts.service.spec.ts`

**Interfaces:**

- Consumes: `PrismaService`, `DashboardQueryDto` (existing).
- Produces: `DashboardAlertsService.getAlerts(query: DashboardQueryDto): Promise<DashboardAlertsResponse>` where `DashboardAlertsResponse = { counts: { critical: number; warning: number; info: number }; alerts: DashboardAlert[] }`, exposed at `GET /dashboard/alerts`.

- [ ] **Step 1: Write `dashboard-alert.types.ts`**

```ts
export type DashboardAlertSeverity = "critical" | "warning" | "info";

export interface DashboardAlert {
    severity: DashboardAlertSeverity;
    title: string;
    tag: string;
    category: string;
    summary: string;
    businessImpact: string;
    recommendedAction: string;
    docRef: string | null;
    occurredAt: string;
}

export interface DashboardAlertsResponse {
    counts: { critical: number; warning: number; info: number };
    alerts: DashboardAlert[];
}
```

- [ ] **Step 2: Write the failing test**

```ts
import { Test, TestingModule } from "@nestjs/testing";
import { DashboardAlertsService } from "./dashboard-alerts.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";

describe("DashboardAlertsService", () => {
    let service: DashboardAlertsService;

    const mockPrismaService: any = {
        stockBalance: { findMany: jest.fn().mockResolvedValue([]) },
        inboundDoc: { count: jest.fn().mockResolvedValue(0) },
        outboundDoc: { count: jest.fn().mockResolvedValue(0) },
        opnameLine: { findMany: jest.fn().mockResolvedValue([]) },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardAlertsService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<DashboardAlertsService>(DashboardAlertsService);
    });

    afterEach(() => jest.clearAllMocks());

    it("returns a single info alert when there is nothing to flag", async () => {
        const result = await service.getAlerts({ page: 1, limit: 20 } as any);

        expect(result.counts).toEqual({ critical: 0, warning: 0, info: 1 });
        expect(result.alerts).toHaveLength(1);
        expect(result.alerts[0].severity).toBe("info");
    });

    it("produces a critical alert for out-of-stock items", async () => {
        mockPrismaService.stockBalance.findMany.mockResolvedValue([
            {
                qty_on_hand: { toNumber: () => 0 },
                product: {
                    code: "SKU-1",
                    name: "Widget",
                    qty_min: { toNumber: () => 10 },
                },
                warehouse: { name: "Jakarta Hub" },
            },
        ]);

        const result = await service.getAlerts({ page: 1, limit: 20 } as any);

        expect(result.counts.critical).toBe(1);
        expect(result.alerts[0]).toMatchObject({
            severity: "critical",
            category: "Inventory",
            tag: "Jakarta Hub",
        });
    });

    it("produces a warning alert for outbound docs aging past the threshold", async () => {
        const oldDate = new Date();
        oldDate.setHours(oldDate.getHours() - 30);
        mockPrismaService.outboundDoc.count.mockResolvedValue(3);

        const result = await service.getAlerts({ page: 1, limit: 20 } as any);

        expect(result.counts.warning).toBeGreaterThanOrEqual(1);
        expect(result.alerts.some((a) => a.category === "Sales Order")).toBe(
            true,
        );
    });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-alerts.service.spec.ts`
Expected: FAIL — `Cannot find module './dashboard-alerts.service'`

- [ ] **Step 4: Write `dashboard-alerts.service.ts`**

```ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import type { DashboardQueryDto } from "./dto/dashboard-query.dto";
import type {
    DashboardAlert,
    DashboardAlertsResponse,
} from "./dashboard-alert.types";

const OUTBOUND_AGING_THRESHOLD_HOURS = 24;

@Injectable()
export class DashboardAlertsService {
    constructor(private readonly prisma: PrismaService) {}

    async getAlerts(
        query: DashboardQueryDto,
    ): Promise<DashboardAlertsResponse> {
        const alerts: DashboardAlert[] = [];

        alerts.push(...(await this.getLowStockAlerts(query)));
        alerts.push(...(await this.getOutboundAgingAlert(query)));
        alerts.push(...(await this.getOpnameAccuracyAlert(query)));

        if (alerts.length === 0) {
            alerts.push({
                severity: "info",
                title: "All systems operating within normal parameters",
                tag: "Network",
                category: "General",
                summary: "No alerts triggered for the selected scope.",
                businessImpact: "None.",
                recommendedAction: "No action required.",
                docRef: null,
                occurredAt: new Date().toISOString(),
            });
        }

        const counts = {
            critical: alerts.filter((a) => a.severity === "critical").length,
            warning: alerts.filter((a) => a.severity === "warning").length,
            info: alerts.filter((a) => a.severity === "info").length,
        };

        return { counts, alerts };
    }

    private async getLowStockAlerts(
        query: DashboardQueryDto,
    ): Promise<DashboardAlert[]> {
        const where: { warehouse?: { companyId?: string; id?: string } } = {};
        if (query.companyId) where.warehouse = { companyId: query.companyId };
        if (query.warehouseId)
            where.warehouse = { ...where.warehouse, id: query.warehouseId };

        const balances = await this.prisma.stockBalance.findMany({
            where,
            include: {
                product: { select: { code: true, name: true, qty_min: true } },
                warehouse: { select: { name: true } },
            },
        });

        const now = new Date().toISOString();
        return balances
            .filter(
                (b) =>
                    b.qty_on_hand.toNumber() <
                    (b.product?.qty_min?.toNumber() ?? 0),
            )
            .map((b) => {
                const currentQty = b.qty_on_hand.toNumber();
                const severity =
                    currentQty === 0
                        ? ("critical" as const)
                        : ("warning" as const);
                return {
                    severity,
                    title: `${b.product?.name ?? "Item"} below minimum stock`,
                    tag: b.warehouse?.name ?? "Unknown Warehouse",
                    category: "Inventory",
                    summary: `${b.product?.code ?? ""} at ${currentQty} units, below minimum ${
                        b.product?.qty_min?.toNumber() ?? 0
                    }.`,
                    businessImpact: "Risk of stockout affecting fulfillment.",
                    recommendedAction: "Trigger replenishment for this item.",
                    docRef: null,
                    occurredAt: now,
                };
            });
    }

    private async getOutboundAgingAlert(
        query: DashboardQueryDto,
    ): Promise<DashboardAlert[]> {
        const threshold = new Date();
        threshold.setHours(
            threshold.getHours() - OUTBOUND_AGING_THRESHOLD_HOURS,
        );

        const where: {
            status: { in: string[] };
            createdAt: { lt: Date };
            companyId?: string;
            warehouse_id?: string;
        } = {
            status: { in: ["draft", "posted"] },
            createdAt: { lt: threshold },
        };
        if (query.companyId) where.companyId = query.companyId;
        if (query.warehouseId) where.warehouse_id = query.warehouseId;

        const count = await this.prisma.outboundDoc.count({ where });
        if (count === 0) return [];

        return [
            {
                severity: "warning",
                title: "Outbound documents aging past 24 hours",
                tag: "Network",
                category: "Sales Order",
                summary: `${count} outbound document(s) open for more than ${OUTBOUND_AGING_THRESHOLD_HOURS}h.`,
                businessImpact: "Potential shipment delay for affected orders.",
                recommendedAction:
                    "Review outbound queue and reassign picking capacity.",
                docRef: null,
                occurredAt: new Date().toISOString(),
            },
        ];
    }

    private async getOpnameAccuracyAlert(
        query: DashboardQueryDto,
    ): Promise<DashboardAlert[]> {
        const currentWindowStart = new Date();
        currentWindowStart.setDate(currentWindowStart.getDate() - 14);
        const previousWindowStart = new Date();
        previousWindowStart.setDate(previousWindowStart.getDate() - 28);

        const where: {
            doc: { companyId?: string; warehouse_id?: string; status: string };
        } = {
            doc: { status: "closed" },
        };
        if (query.companyId) where.doc.companyId = query.companyId;
        if (query.warehouseId) where.doc.warehouse_id = query.warehouseId;

        const [currentLines, previousLines] = await Promise.all([
            this.prisma.opnameLine.findMany({
                where: { ...where, created_at: { gte: currentWindowStart } },
                select: { system_qty: true, variance_qty: true },
            }),
            this.prisma.opnameLine.findMany({
                where: {
                    ...where,
                    created_at: {
                        gte: previousWindowStart,
                        lt: currentWindowStart,
                    },
                },
                select: { system_qty: true, variance_qty: true },
            }),
        ]);

        const varianceRatio = (
            lines: {
                system_qty: { toNumber(): number };
                variance_qty: { toNumber(): number };
            }[],
        ) => {
            const systemTotal = lines.reduce(
                (acc, l) => acc + l.system_qty.toNumber(),
                0,
            );
            if (systemTotal === 0) return 0;
            const varianceTotal = lines.reduce(
                (acc, l) => acc + Math.abs(l.variance_qty.toNumber()),
                0,
            );
            return varianceTotal / systemTotal;
        };

        const currentRatio = varianceRatio(currentLines);
        const previousRatio = varianceRatio(previousLines);

        if (previousLines.length === 0 || currentRatio <= previousRatio)
            return [];

        return [
            {
                severity: "warning",
                title: "Inventory accuracy trending down",
                tag: "Network",
                category: "Inventory",
                summary: `Variance ratio increased from ${(previousRatio * 100).toFixed(1)}% to ${(
                    currentRatio * 100
                ).toFixed(1)}% over the last 14 days.`,
                businessImpact:
                    "Reduced confidence in stock accuracy for planning.",
                recommendedAction:
                    "Schedule a targeted cycle count for high-variance locations.",
                docRef: null,
                occurredAt: new Date().toISOString(),
            },
        ];
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-alerts.service.spec.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Add the controller route**

In `dashboard.controller.ts`, add the import and inject the new service:

```ts
import { DashboardAlertsService } from "./dashboard-alerts.service";
```

```ts
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly dashboardAlertsService: DashboardAlertsService,
  ) {}
```

Add the route (after `stockSummary`, before `low-stock`):

```ts
  @Get('alerts')
  @ApiBearerAuthProtected()
  @ApiOperation({
    summary: 'Operations alerts',
    description:
      'Returns severity-tagged operational alerts (critical/warning/info) with business impact and recommended action. Optional scope: companyId, warehouseId.',
  })
  @ApiStandardOkResponse('Operations alerts')
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async alerts(@Query() query: DashboardQueryDto): Promise<ApiResponse<unknown>> {
    const data = await this.dashboardAlertsService.getAlerts(query);
    return successResponse(data);
  }
```

- [ ] **Step 7: Register `DashboardAlertsService` in `dashboard.module.ts`**

```ts
import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { DashboardAlertsService } from "./dashboard-alerts.service";

@Module({
    controllers: [DashboardController],
    providers: [DashboardService, DashboardAlertsService],
    exports: [DashboardService, DashboardAlertsService],
})
export class DashboardModule {}
```

- [ ] **Step 8: Run the full dashboard test suite**

Run: `npx jest src/modules/warehouse/dashboard`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/modules/warehouse/dashboard/dashboard-alert.types.ts src/modules/warehouse/dashboard/dashboard-alerts.service.ts src/modules/warehouse/dashboard/dashboard-alerts.service.spec.ts src/modules/warehouse/dashboard/dashboard.controller.ts src/modules/warehouse/dashboard/dashboard.module.ts
git commit -m "feat: add GET /dashboard/alerts endpoint"
```

---

### Task 8: `GET /dashboard/workflow-overview` endpoint

**Files:**

- Create: `src/modules/warehouse/dashboard/dashboard-workflow.types.ts`
- Create: `src/modules/warehouse/dashboard/dashboard-workflow.service.ts`
- Modify: `src/modules/warehouse/dashboard/dashboard.controller.ts` (add route)
- Modify: `src/modules/warehouse/dashboard/dashboard.module.ts` (register new service, import `DocStatusHistoryModule`)
- Test: `src/modules/warehouse/dashboard/dashboard-workflow.service.spec.ts`

**Interfaces:**

- Consumes: `PrismaService`, `DocStatusHistoryService.getDailyTransitionCounts` (Task 2).
- Produces: `DashboardWorkflowService.getWorkflowOverview(query: DashboardQueryDto): Promise<DashboardWorkflowOverviewResponse>`, `GET /dashboard/workflow-overview`.

- [ ] **Step 1: Write `dashboard-workflow.types.ts`**

```ts
export interface DashboardWorkflowStage {
    name: string;
    count: number;
    pctOfOpen: number | null;
    avgWaitHours: number | null;
    trendPct: number | null;
}

export interface DashboardWorkflowPanel {
    key: "inboundPutaway" | "outbound";
    title: string;
    openCount: number;
    avgCycleTimeHours: number | null;
    completionRate: number;
    bottleneckStage: string;
    stages: DashboardWorkflowStage[];
}

export interface DashboardWorkflowOverviewResponse {
    panels: DashboardWorkflowPanel[];
}
```

- [ ] **Step 2: Write the failing test**

```ts
import { Test, TestingModule } from "@nestjs/testing";
import { DashboardWorkflowService } from "./dashboard-workflow.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { DocStatusHistoryService } from "../doc-status-history/doc-status-history.service";

describe("DashboardWorkflowService", () => {
    let service: DashboardWorkflowService;

    const mockPrismaService: any = {
        inboundDoc: { count: jest.fn() },
        putawayDoc: { count: jest.fn() },
        outboundDoc: { count: jest.fn() },
    };
    const mockDocStatusHistoryService: any = {
        getDailyTransitionCounts: jest.fn().mockResolvedValue([]),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardWorkflowService,
                { provide: PrismaService, useValue: mockPrismaService },
                {
                    provide: DocStatusHistoryService,
                    useValue: mockDocStatusHistoryService,
                },
            ],
        }).compile();

        service = module.get<DashboardWorkflowService>(
            DashboardWorkflowService,
        );
    });

    afterEach(() => jest.clearAllMocks());

    it("builds the inbound & putaway and outbound panels with null trend when history is insufficient", async () => {
        mockPrismaService.inboundDoc.count
            .mockResolvedValueOnce(428)
            .mockResolvedValueOnce(120);
        mockPrismaService.putawayDoc.count
            .mockResolvedValueOnce(64)
            .mockResolvedValueOnce(30)
            .mockResolvedValueOnce(200);
        mockPrismaService.outboundDoc.count
            .mockResolvedValueOnce(50)
            .mockResolvedValueOnce(30)
            .mockResolvedValueOnce(5);

        const result = await service.getWorkflowOverview({
            page: 1,
            limit: 20,
        } as any);

        expect(result.panels).toHaveLength(2);
        const inboundPanel = result.panels.find(
            (p) => p.key === "inboundPutaway",
        )!;
        expect(inboundPanel.openCount).toBe(428);
        expect(inboundPanel.stages.every((s) => s.trendPct === null)).toBe(
            true,
        );
        expect(inboundPanel.stages.every((s) => s.avgWaitHours === null)).toBe(
            true,
        );
    });

    it("computes a trend percentage when at least 7 days of history exist", async () => {
        mockPrismaService.inboundDoc.count.mockResolvedValue(100);
        mockPrismaService.putawayDoc.count.mockResolvedValue(50);
        mockPrismaService.outboundDoc.count.mockResolvedValue(20);
        mockDocStatusHistoryService.getDailyTransitionCounts.mockResolvedValue([
            { date: "2026-07-11", count: 10 },
            { date: "2026-07-12", count: 12 },
            { date: "2026-07-13", count: 8 },
            { date: "2026-07-14", count: 9 },
            { date: "2026-07-15", count: 11 },
            { date: "2026-07-16", count: 10 },
            { date: "2026-07-17", count: 10 },
        ]);

        const result = await service.getWorkflowOverview({
            page: 1,
            limit: 20,
        } as any);

        const inboundPanel = result.panels.find(
            (p) => p.key === "inboundPutaway",
        )!;
        expect(
            inboundPanel.stages.some((s) => typeof s.trendPct === "number"),
        ).toBe(true);
    });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-workflow.service.spec.ts`
Expected: FAIL

- [ ] **Step 4: Write `dashboard-workflow.service.ts`**

```ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { DocStatusHistoryService } from "../doc-status-history/doc-status-history.service";
import type { DashboardQueryDto } from "./dto/dashboard-query.dto";
import type {
    DashboardWorkflowOverviewResponse,
    DashboardWorkflowPanel,
    DashboardWorkflowStage,
} from "./dashboard-workflow.types";

const MIN_HISTORY_DAYS = 7;

export function computeStageTrendPct(
    dailyCounts: { date: string; count: number }[],
    currentCount: number,
): number | null {
    if (dailyCounts.length < MIN_HISTORY_DAYS) return null;
    const avg =
        dailyCounts.reduce((acc, d) => acc + d.count, 0) / dailyCounts.length;
    if (avg === 0) return null;
    return ((currentCount - avg) / avg) * 100;
}

@Injectable()
export class DashboardWorkflowService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly docStatusHistoryService: DocStatusHistoryService,
    ) {}

    async getWorkflowOverview(
        query: DashboardQueryDto,
    ): Promise<DashboardWorkflowOverviewResponse> {
        const [inboundPutawayPanel, outboundPanel] = await Promise.all([
            this.buildInboundPutawayPanel(query),
            this.buildOutboundPanel(query),
        ]);

        return { panels: [inboundPutawayPanel, outboundPanel] };
    }

    private async buildInboundPutawayPanel(
        query: DashboardQueryDto,
    ): Promise<DashboardWorkflowPanel> {
        const inboundWhere: { companyId?: string; warehouse_id?: string } = {};
        if (query.companyId) inboundWhere.companyId = query.companyId;
        if (query.warehouseId) inboundWhere.warehouse_id = query.warehouseId;

        const [
            openInbound,
            waitingPutaway,
            putawayDraft,
            putawayPosted,
            putawayDone,
        ] = await Promise.all([
            this.prisma.inboundDoc.count({
                where: { ...inboundWhere, status: "posted" },
            }),
            this.prisma.inboundDoc.count({
                where: { ...inboundWhere, status: "posted" },
            }),
            this.prisma.putawayDoc.count({
                where: { ...inboundWhere, status: "draft" },
            }),
            this.prisma.putawayDoc.count({
                where: { ...inboundWhere, status: "posted" },
            }),
            this.prisma.putawayDoc.count({
                where: { ...inboundWhere, status: "done" },
            }),
        ]);

        const total =
            openInbound + putawayDraft + putawayPosted + putawayDone || 1;
        const dailyPutawayDone =
            await this.docStatusHistoryService.getDailyTransitionCounts({
                docType: "putaway",
                toStatus: "done",
                companyId: query.companyId,
                warehouseId: query.warehouseId,
                sinceDays: MIN_HISTORY_DAYS,
            });

        const stages: DashboardWorkflowStage[] = [
            {
                name: "Waiting Putaway",
                count: waitingPutaway,
                pctOfOpen: Math.round((waitingPutaway / total) * 100),
                avgWaitHours: null,
                trendPct: null,
            },
            {
                name: "Putaway In Progress",
                count: putawayDraft + putawayPosted,
                pctOfOpen: Math.round(
                    ((putawayDraft + putawayPosted) / total) * 100,
                ),
                avgWaitHours: null,
                trendPct: null,
            },
            {
                name: "Completed",
                count: putawayDone,
                pctOfOpen: Math.round((putawayDone / total) * 100),
                avgWaitHours: null,
                trendPct: computeStageTrendPct(dailyPutawayDone, putawayDone),
            },
        ];

        const bottleneckStage =
            [...stages].sort((a, b) => b.count - a.count)[0]?.name ??
            "Waiting Putaway";

        return {
            key: "inboundPutaway",
            title: "Inbound & Putaway Workflow",
            openCount: openInbound,
            avgCycleTimeHours: null,
            completionRate: Math.round((putawayDone / total) * 100) / 100,
            bottleneckStage,
            stages,
        };
    }

    private async buildOutboundPanel(
        query: DashboardQueryDto,
    ): Promise<DashboardWorkflowPanel> {
        const where: { companyId?: string; warehouse_id?: string } = {};
        if (query.companyId) where.companyId = query.companyId;
        if (query.warehouseId) where.warehouse_id = query.warehouseId;

        const [draft, posted, canceled] = await Promise.all([
            this.prisma.outboundDoc.count({
                where: { ...where, status: "draft" },
            }),
            this.prisma.outboundDoc.count({
                where: { ...where, status: "posted" },
            }),
            this.prisma.outboundDoc.count({
                where: { ...where, status: "canceled" },
            }),
        ]);

        const total = draft + posted + canceled || 1;
        const dailyPosted =
            await this.docStatusHistoryService.getDailyTransitionCounts({
                docType: "outbound",
                toStatus: "posted",
                companyId: query.companyId,
                warehouseId: query.warehouseId,
                sinceDays: MIN_HISTORY_DAYS,
            });

        const stages: DashboardWorkflowStage[] = [
            {
                name: "Open",
                count: draft,
                pctOfOpen: Math.round((draft / total) * 100),
                avgWaitHours: null,
                trendPct: null,
            },
            {
                name: "Posted",
                count: posted,
                pctOfOpen: Math.round((posted / total) * 100),
                avgWaitHours: null,
                trendPct: computeStageTrendPct(dailyPosted, posted),
            },
            {
                name: "Canceled",
                count: canceled,
                pctOfOpen: Math.round((canceled / total) * 100),
                avgWaitHours: null,
                trendPct: null,
            },
        ];

        const bottleneckStage =
            [...stages].sort((a, b) => b.count - a.count)[0]?.name ?? "Open";

        return {
            key: "outbound",
            title: "Outbound Workflow",
            openCount: draft,
            avgCycleTimeHours: null,
            completionRate: Math.round((posted / total) * 100) / 100,
            bottleneckStage,
            stages,
        };
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-workflow.service.spec.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Add the controller route**

Add the import and inject the new service in `dashboard.controller.ts`:

```ts
import { DashboardWorkflowService } from "./dashboard-workflow.service";
```

```ts
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly dashboardAlertsService: DashboardAlertsService,
    private readonly dashboardWorkflowService: DashboardWorkflowService,
  ) {}
```

```ts
  @Get('workflow-overview')
  @ApiBearerAuthProtected()
  @ApiOperation({
    summary: 'Business workflow overview',
    description:
      'Returns Inbound & Putaway and Outbound stage pipelines with counts, completion rate, and bottleneck. Optional scope: companyId, warehouseId.',
  })
  @ApiStandardOkResponse('Workflow overview panels')
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async workflowOverview(@Query() query: DashboardQueryDto): Promise<ApiResponse<unknown>> {
    const data = await this.dashboardWorkflowService.getWorkflowOverview(query);
    return successResponse(data);
  }
```

- [ ] **Step 7: Register in `dashboard.module.ts` and import `DocStatusHistoryModule`**

```ts
import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { DashboardAlertsService } from "./dashboard-alerts.service";
import { DashboardWorkflowService } from "./dashboard-workflow.service";
import { DocStatusHistoryModule } from "../doc-status-history/doc-status-history.module";

@Module({
    imports: [DocStatusHistoryModule],
    controllers: [DashboardController],
    providers: [
        DashboardService,
        DashboardAlertsService,
        DashboardWorkflowService,
    ],
    exports: [
        DashboardService,
        DashboardAlertsService,
        DashboardWorkflowService,
    ],
})
export class DashboardModule {}
```

- [ ] **Step 8: Run the full dashboard test suite**

Run: `npx jest src/modules/warehouse/dashboard`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/modules/warehouse/dashboard
git commit -m "feat: add GET /dashboard/workflow-overview endpoint"
```

---

### Task 9: `GET /dashboard/kpi-snapshot` endpoint

**Files:**

- Create: `src/modules/warehouse/dashboard/dashboard-kpi.util.ts`
- Create: `src/modules/warehouse/dashboard/dashboard-kpi.types.ts`
- Create: `src/modules/warehouse/dashboard/dashboard-kpi.service.ts`
- Modify: `src/modules/warehouse/dashboard/dashboard.controller.ts` (add route)
- Modify: `src/modules/warehouse/dashboard/dashboard.module.ts` (register new service)
- Test: `src/modules/warehouse/dashboard/dashboard-kpi.util.spec.ts`
- Test: `src/modules/warehouse/dashboard/dashboard-kpi.service.spec.ts`

**Interfaces:**

- Consumes: `PrismaService` (`StockLedger`, `OpnameLine`).
- Produces: pure functions `clampScore`, `computePctChange`, `computeThroughputScore`, `computeInventoryScore` (`dashboard-kpi.util.ts`); `DashboardKpiService.getKpiSnapshot(query: DashboardQueryDto): Promise<DashboardKpiSnapshotResponse>`, `GET /dashboard/kpi-snapshot`.

- [ ] **Step 1: Write the failing test for the pure scoring functions**

Create `src/modules/warehouse/dashboard/dashboard-kpi.util.spec.ts`:

```ts
import {
    clampScore,
    computePctChange,
    computeThroughputScore,
    computeInventoryScore,
} from "./dashboard-kpi.util";

describe("dashboard-kpi.util", () => {
    describe("clampScore", () => {
        it("clamps below 0 up to 0", () => expect(clampScore(-10)).toBe(0));
        it("clamps above 100 down to 100", () =>
            expect(clampScore(150)).toBe(100));
        it("rounds fractional scores", () => expect(clampScore(83.6)).toBe(84));
    });

    describe("computePctChange", () => {
        it("returns 0 when both current and previous are 0", () => {
            expect(computePctChange(0, 0)).toBe(0);
        });
        it("returns 100 when previous is 0 and current is positive", () => {
            expect(computePctChange(5, 0)).toBe(100);
        });
        it("computes a standard percentage change", () => {
            expect(computePctChange(110, 100)).toBe(10);
        });
    });

    describe("computeThroughputScore", () => {
        it("scores higher when productivity and cycle time both improve", () => {
            const result = computeThroughputScore(110, 100, 4, 5);
            expect(result.productivityImprovementPct).toBeCloseTo(10);
            expect(result.cycleTimeImprovementPct).toBeCloseTo(20);
            expect(result.score).toBe(clampScore(70 + 10 + 20));
        });
    });

    describe("computeInventoryScore", () => {
        it("scores accuracy and turnover improvement together", () => {
            const result = computeInventoryScore(0.02, 110, 100);
            expect(result.accuracyPct).toBe(98);
            expect(result.productivityImprovementPct).toBeCloseTo(10);
            expect(result.score).toBe(clampScore(98 * 0.8 + 20 + 10 * 0.2));
        });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-kpi.util.spec.ts`
Expected: FAIL — `Cannot find module './dashboard-kpi.util'`

- [ ] **Step 3: Write `dashboard-kpi.util.ts`**

```ts
export function clampScore(score: number): number {
    return Math.max(0, Math.min(100, Math.round(score)));
}

export function computePctChange(current: number, previous: number): number {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
}

export function computeThroughputScore(
    currentQty: number,
    previousQty: number,
    currentAvgCycleHours: number,
    previousAvgCycleHours: number,
): {
    score: number;
    productivityImprovementPct: number;
    cycleTimeImprovementPct: number;
} {
    const productivityImprovementPct = computePctChange(
        currentQty,
        previousQty,
    );
    const cycleTimeImprovementPct =
        previousAvgCycleHours === 0
            ? 0
            : ((previousAvgCycleHours - currentAvgCycleHours) /
                  previousAvgCycleHours) *
              100;
    const score = clampScore(
        70 + productivityImprovementPct + cycleTimeImprovementPct,
    );
    return { score, productivityImprovementPct, cycleTimeImprovementPct };
}

export function computeInventoryScore(
    currentVarianceRatio: number,
    currentTurnover: number,
    previousTurnover: number,
): { score: number; accuracyPct: number; productivityImprovementPct: number } {
    const accuracyPct = clampScore(100 - currentVarianceRatio * 100);
    const productivityImprovementPct = computePctChange(
        currentTurnover,
        previousTurnover,
    );
    const score = clampScore(
        accuracyPct * 0.8 + 20 + productivityImprovementPct * 0.2,
    );
    return { score, accuracyPct, productivityImprovementPct };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-kpi.util.spec.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Write `dashboard-kpi.types.ts`**

```ts
export interface DashboardKpiSubMetric {
    label: string;
    value: string;
}

export interface DashboardKpiCard {
    key: "stockIn" | "inventory" | "stockOut";
    label: string;
    score: number;
    trendVsPrevious: number;
    subMetrics: DashboardKpiSubMetric[];
    sparkline: number[];
}

export interface DashboardKpiSnapshotResponse {
    cards: DashboardKpiCard[];
}
```

- [ ] **Step 6: Write the failing test for the service**

Create `src/modules/warehouse/dashboard/dashboard-kpi.service.spec.ts`:

```ts
import { Test, TestingModule } from "@nestjs/testing";
import { DashboardKpiService } from "./dashboard-kpi.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";

describe("DashboardKpiService", () => {
    let service: DashboardKpiService;

    const mockPrismaService: any = {
        stockLedger: {
            aggregate: jest
                .fn()
                .mockResolvedValue({ _sum: { qty_in: 0, qty_out: 0 } }),
        },
        stockBalance: {
            aggregate: jest
                .fn()
                .mockResolvedValue({ _sum: { qty_on_hand: 0 } }),
        },
        opnameLine: { findMany: jest.fn().mockResolvedValue([]) },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardKpiService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<DashboardKpiService>(DashboardKpiService);
    });

    afterEach(() => jest.clearAllMocks());

    it("returns one card per domain with a score between 0 and 100", async () => {
        const result = await service.getKpiSnapshot({
            page: 1,
            limit: 20,
        } as any);

        expect(result.cards.map((c) => c.key)).toEqual([
            "stockIn",
            "inventory",
            "stockOut",
        ]);
        result.cards.forEach((card) => {
            expect(card.score).toBeGreaterThanOrEqual(0);
            expect(card.score).toBeLessThanOrEqual(100);
            expect(card.sparkline).toHaveLength(6);
        });
    });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-kpi.service.spec.ts`
Expected: FAIL

- [ ] **Step 8: Write `dashboard-kpi.service.ts`**

```ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import type { DashboardQueryDto } from "./dto/dashboard-query.dto";
import type {
    DashboardKpiCard,
    DashboardKpiSnapshotResponse,
} from "./dashboard-kpi.types";
import {
    computeInventoryScore,
    computeThroughputScore,
} from "./dashboard-kpi.util";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class DashboardKpiService {
    constructor(private readonly prisma: PrismaService) {}

    async getKpiSnapshot(
        query: DashboardQueryDto,
    ): Promise<DashboardKpiSnapshotResponse> {
        const [stockIn, inventory, stockOut] = await Promise.all([
            this.buildThroughputCard(
                "stockIn",
                "Stock In Performance",
                "inbound",
                query,
            ),
            this.buildInventoryCard(query),
            this.buildThroughputCard(
                "stockOut",
                "Stock Out Performance",
                "outbound",
                query,
            ),
        ]);

        return { cards: [stockIn, inventory, stockOut] };
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
        if (query.warehouseId) where.warehouseId = query.warehouseId;

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

    private async buildThroughputCard(
        key: "stockIn" | "stockOut",
        label: string,
        movementType: "inbound" | "outbound",
        query: DashboardQueryDto,
    ): Promise<DashboardKpiCard> {
        const currentWindow = this.windowBounds(1, 0);
        const previousWindow = this.windowBounds(2, 1);

        const [currentQty, previousQty] = await Promise.all([
            this.sumLedgerQty(movementType, currentWindow, query),
            this.sumLedgerQty(movementType, previousWindow, query),
        ]);

        const { score, productivityImprovementPct, cycleTimeImprovementPct } =
            computeThroughputScore(currentQty, previousQty, 0, 0);

        const sparkline = await this.buildThroughputSparkline(
            movementType,
            query,
        );

        return {
            key,
            label,
            score,
            trendVsPrevious: Math.round(productivityImprovementPct * 10) / 10,
            subMetrics: [
                {
                    label: "Productivity Improvement",
                    value: `${productivityImprovementPct >= 0 ? "+" : ""}${productivityImprovementPct.toFixed(1)}%`,
                },
                {
                    label: "Cycle Time Improvement",
                    value: `${cycleTimeImprovementPct >= 0 ? "+" : ""}${cycleTimeImprovementPct.toFixed(1)}%`,
                },
            ],
            sparkline,
        };
    }

    private async buildThroughputSparkline(
        movementType: "inbound" | "outbound",
        query: DashboardQueryDto,
    ): Promise<number[]> {
        const weeks = [5, 4, 3, 2, 1, 0];
        const qtys = await Promise.all(
            weeks.map((weeksAgo) =>
                this.sumLedgerQty(
                    movementType,
                    this.windowBounds(weeksAgo + 1, weeksAgo),
                    query,
                ),
            ),
        );
        return qtys;
    }

    private async buildInventoryCard(
        query: DashboardQueryDto,
    ): Promise<DashboardKpiCard> {
        const currentWindow = this.windowBounds(2, 0);
        const previousWindow = this.windowBounds(4, 2);

        const opnameWhere: {
            doc: { companyId?: string; warehouse_id?: string };
        } = { doc: {} };
        if (query.companyId) opnameWhere.doc.companyId = query.companyId;
        if (query.warehouseId) opnameWhere.doc.warehouse_id = query.warehouseId;

        const currentLines = await this.prisma.opnameLine.findMany({
            where: { ...opnameWhere, created_at: currentWindow },
            select: { system_qty: true, variance_qty: true },
        });

        const systemTotal = currentLines.reduce(
            (acc, l) => acc + Number(l.system_qty),
            0,
        );
        const varianceTotal = currentLines.reduce(
            (acc, l) => acc + Math.abs(Number(l.variance_qty)),
            0,
        );
        const currentVarianceRatio =
            systemTotal === 0 ? 0 : varianceTotal / systemTotal;

        const [currentOut, previousOut] = await Promise.all([
            this.sumLedgerQty("outbound", currentWindow, query),
            this.sumLedgerQty("outbound", previousWindow, query),
        ]);

        const { score, accuracyPct, productivityImprovementPct } =
            computeInventoryScore(
                currentVarianceRatio,
                currentOut,
                previousOut,
            );

        const sparkline = await this.buildThroughputSparkline(
            "outbound",
            query,
        );

        return {
            key: "inventory",
            label: "Inventory Performance",
            score,
            trendVsPrevious: Math.round(productivityImprovementPct * 10) / 10,
            subMetrics: [
                { label: "Accuracy", value: `${accuracyPct.toFixed(1)}%` },
                {
                    label: "Productivity Improvement",
                    value: `${productivityImprovementPct >= 0 ? "+" : ""}${productivityImprovementPct.toFixed(1)}%`,
                },
            ],
            sparkline,
        };
    }
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npx jest src/modules/warehouse/dashboard/dashboard-kpi.service.spec.ts`
Expected: PASS

- [ ] **Step 10: Add the controller route**

```ts
import { DashboardKpiService } from "./dashboard-kpi.service";
```

```ts
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly dashboardAlertsService: DashboardAlertsService,
    private readonly dashboardWorkflowService: DashboardWorkflowService,
    private readonly dashboardKpiService: DashboardKpiService,
  ) {}
```

```ts
  @Get('kpi-snapshot')
  @ApiBearerAuthProtected()
  @ApiOperation({
    summary: 'Executive KPI snapshot',
    description:
      'Returns composite 0-100 scores for Stock In, Inventory, and Stock Out performance with sub-metrics and a 6-week sparkline. Optional scope: companyId, warehouseId.',
  })
  @ApiStandardOkResponse('KPI snapshot cards')
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async kpiSnapshot(@Query() query: DashboardQueryDto): Promise<ApiResponse<unknown>> {
    const data = await this.dashboardKpiService.getKpiSnapshot(query);
    return successResponse(data);
  }
```

- [ ] **Step 11: Register in `dashboard.module.ts`**

```ts
import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { DashboardAlertsService } from "./dashboard-alerts.service";
import { DashboardWorkflowService } from "./dashboard-workflow.service";
import { DashboardKpiService } from "./dashboard-kpi.service";
import { DocStatusHistoryModule } from "../doc-status-history/doc-status-history.module";

@Module({
    imports: [DocStatusHistoryModule],
    controllers: [DashboardController],
    providers: [
        DashboardService,
        DashboardAlertsService,
        DashboardWorkflowService,
        DashboardKpiService,
    ],
    exports: [
        DashboardService,
        DashboardAlertsService,
        DashboardWorkflowService,
        DashboardKpiService,
    ],
})
export class DashboardModule {}
```

- [ ] **Step 12: Run the full dashboard test suite**

Run: `npx jest src/modules/warehouse/dashboard`
Expected: PASS

- [ ] **Step 13: Run the full backend test suite to check for regressions**

Run: `npx jest`
Expected: PASS

- [ ] **Step 14: Commit**

```bash
git add src/modules/warehouse/dashboard
git commit -m "feat: add GET /dashboard/kpi-snapshot endpoint"
```

---

## Frontend Tasks (`/Users/syillaeltaniadaffa/Documents/Warehouse`)

### Task 10: Types for alerts, workflow, and KPI data

**Files:**

- Modify: `src/api/feature/dto/dashboard.dto.ts` (append response types)
- Modify: `src/model/dashboard.ts` (append domain types)

**Interfaces:**

- Produces: `DashboardAlertSeverity`, `DashboardAlert`, `DashboardAlertsResponse`, `DashboardWorkflowStage`, `DashboardWorkflowPanel`, `DashboardWorkflowOverviewResponse`, `DashboardKpiSubMetric`, `DashboardKpiCard`, `DashboardKpiSnapshotResponse` — all consumed by Tasks 11-15.

- [ ] **Step 1: Append to `src/api/feature/dto/dashboard.dto.ts`**

```ts
export type DashboardAlertSeverity = "critical" | "warning" | "info";

export interface DashboardAlert {
    severity: DashboardAlertSeverity;
    title: string;
    tag: string;
    category: string;
    summary: string;
    businessImpact: string;
    recommendedAction: string;
    docRef: string | null;
    occurredAt: string;
}

export interface DashboardAlertsResponse {
    counts: { critical: number; warning: number; info: number };
    alerts: DashboardAlert[];
}

export interface DashboardWorkflowStage {
    name: string;
    count: number;
    pctOfOpen: number | null;
    avgWaitHours: number | null;
    trendPct: number | null;
}

export interface DashboardWorkflowPanel {
    key: "inboundPutaway" | "outbound";
    title: string;
    openCount: number;
    avgCycleTimeHours: number | null;
    completionRate: number;
    bottleneckStage: string;
    stages: DashboardWorkflowStage[];
}

export interface DashboardWorkflowOverviewResponse {
    panels: DashboardWorkflowPanel[];
}

export interface DashboardKpiSubMetric {
    label: string;
    value: string;
}

export interface DashboardKpiCard {
    key: "stockIn" | "inventory" | "stockOut";
    label: string;
    score: number;
    trendVsPrevious: number;
    subMetrics: DashboardKpiSubMetric[];
    sparkline: number[];
}

export interface DashboardKpiSnapshotResponse {
    cards: DashboardKpiCard[];
}
```

- [ ] **Step 2: Append to `src/model/dashboard.ts`**

```ts
export type {
    DashboardAlertSeverity,
    DashboardAlert,
    DashboardAlertsResponse,
    DashboardWorkflowStage,
    DashboardWorkflowPanel,
    DashboardWorkflowOverviewResponse,
    DashboardKpiSubMetric,
    DashboardKpiCard,
    DashboardKpiSnapshotResponse,
} from "@/api/feature/dto/dashboard.dto";
```

- [ ] **Step 3: Type-check**

Run: `npx vue-tsc --noEmit`
Expected: no new errors referencing `dashboard.dto.ts` or `model/dashboard.ts`

- [ ] **Step 4: Commit**

```bash
git add src/api/feature/dto/dashboard.dto.ts src/model/dashboard.ts
git commit -m "feat: add types for dashboard alerts, workflow overview, and KPI snapshot"
```

---

### Task 11: API + service methods for the three new endpoints

**Files:**

- Modify: `src/api/feature/dashboard.api.ts`
- Modify: `src/services/dashboard.service.ts`
- Test: `src/services/dashboard.service.test.ts` (create — no existing file for this service; follow the pattern in `src/services/transactions.service.test.ts`)

**Interfaces:**

- Consumes: `DashboardAlertsResponse`, `DashboardWorkflowOverviewResponse`, `DashboardKpiSnapshotResponse` (Task 10).
- Produces: `dashboardApi.fetchAlerts`, `dashboardApi.fetchWorkflowOverview`, `dashboardApi.fetchKpiSnapshot`; `dashboardService.fetchAlerts(filter)`, `dashboardService.fetchWorkflowOverview(filter)`, `dashboardService.fetchKpiSnapshot(filter)` — each consumed by Task 12.

- [ ] **Step 1: Read the existing service test pattern**

Run: `cat src/services/transactions.service.test.ts | head -40` to confirm the mocking approach for `dashboardApi` (mock the api module, assert the service reshapes/passes through data correctly).

- [ ] **Step 2: Write the failing test**

Create `src/services/dashboard.service.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchAlertsMock = vi.fn();
const fetchWorkflowOverviewMock = vi.fn();
const fetchKpiSnapshotMock = vi.fn();

vi.mock("@/api/feature/dashboard.api", () => ({
    dashboardApi: {
        fetchStockSummary: vi.fn(),
        fetchDocCounts: vi.fn(),
        fetchLowStock: vi.fn(),
        fetchEpcStatus: vi.fn(),
        fetchRecentActivity: vi.fn(),
        fetchAlerts: fetchAlertsMock,
        fetchWorkflowOverview: fetchWorkflowOverviewMock,
        fetchKpiSnapshot: fetchKpiSnapshotMock,
    },
}));

vi.mock("@/store/auth.store", () => ({
    useAuthStore: () => ({ currentCompanyId: "company-1" }),
}));

import { dashboardService } from "./dashboard.service";

describe("dashboardService", () => {
    beforeEach(() => {
        fetchAlertsMock.mockReset();
        fetchWorkflowOverviewMock.mockReset();
        fetchKpiSnapshotMock.mockReset();
    });

    it("fetchAlerts returns the alerts payload", async () => {
        fetchAlertsMock.mockResolvedValue({
            data: { counts: { critical: 1, warning: 0, info: 0 }, alerts: [] },
        });

        const result = await dashboardService.fetchAlerts({
            warehouseId: "wh-1",
        });

        expect(fetchAlertsMock).toHaveBeenCalledWith({
            companyId: "company-1",
            warehouseId: "wh-1",
        });
        expect(result.counts.critical).toBe(1);
    });

    it("fetchWorkflowOverview returns the panels payload", async () => {
        fetchWorkflowOverviewMock.mockResolvedValue({ data: { panels: [] } });

        const result = await dashboardService.fetchWorkflowOverview({
            warehouseId: null,
        });

        expect(result.panels).toEqual([]);
    });

    it("fetchKpiSnapshot returns the cards payload", async () => {
        fetchKpiSnapshotMock.mockResolvedValue({ data: { cards: [] } });

        const result = await dashboardService.fetchKpiSnapshot({
            warehouseId: null,
        });

        expect(result.cards).toEqual([]);
    });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/services/dashboard.service.test.ts`
Expected: FAIL — `dashboardApi.fetchAlerts is not a function` / `dashboardService.fetchAlerts is not a function`

- [ ] **Step 4: Add the three endpoints to `dashboard.api.ts`**

Add the import and three methods:

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
} from "./dto/dashboard.dto";
```

```ts
    fetchAlerts(params: DashboardQueryParameters) {
        return apiRequest<DashboardAlertsResponse>({
            url: "/dashboard/alerts",
            method: "get",
            params,
        });
    },

    fetchWorkflowOverview(params: DashboardQueryParameters) {
        return apiRequest<DashboardWorkflowOverviewResponse>({
            url: "/dashboard/workflow-overview",
            method: "get",
            params,
        });
    },

    fetchKpiSnapshot(params: DashboardQueryParameters) {
        return apiRequest<DashboardKpiSnapshotResponse>({
            url: "/dashboard/kpi-snapshot",
            method: "get",
            params,
        });
    },
```

(insert these three methods inside the exported `dashboardApi` object, after `fetchRecentActivity`)

- [ ] **Step 5: Add the three methods to `dashboard.service.ts`**

Add the import and three methods:

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
} from "@/api/feature/dto/dashboard.dto";
```

```ts
    async fetchAlerts(
        filter: DashboardFilterState,
    ): Promise<DashboardAlertsResponse> {
        const response = await dashboardApi.fetchAlerts(toParams(filter));
        return response.data;
    },

    async fetchWorkflowOverview(
        filter: DashboardFilterState,
    ): Promise<DashboardWorkflowOverviewResponse> {
        const response = await dashboardApi.fetchWorkflowOverview(
            toParams(filter),
        );
        return response.data;
    },

    async fetchKpiSnapshot(
        filter: DashboardFilterState,
    ): Promise<DashboardKpiSnapshotResponse> {
        const response = await dashboardApi.fetchKpiSnapshot(
            toParams(filter),
        );
        return response.data;
    },
```

(insert these three methods inside the exported `dashboardService` object, after `fetchHeatmap`)

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/services/dashboard.service.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 7: Commit**

```bash
git add src/api/feature/dashboard.api.ts src/services/dashboard.service.ts src/services/dashboard.service.test.ts
git commit -m "feat: add dashboard alerts, workflow overview, and KPI snapshot service methods"
```

---

### Task 12: Extend `useDashboard.ts` composable

**Files:**

- Modify: `src/views/dashboard/composables/useDashboard.ts`
- Test: `src/views/dashboard/composables/useDashboard.test.ts` (create — no existing file; assert the composable's returned refs and loading behavior using a minimal Vue test setup, mocking `dashboardService`, `useWarehouseOptions`, `useAuthStore`, `useWarehouseStore`, and `vue-router`)

**Interfaces:**

- Consumes: `dashboardService.fetchAlerts/fetchWorkflowOverview/fetchKpiSnapshot` (Task 11).
- Produces: `alertsData`, `alertsLoading`, `workflowData`, `workflowLoading`, `kpiSnapshotData`, `kpiSnapshotLoading` refs/computed, returned from `useDashboard()` — consumed by Tasks 13-16.

- [ ] **Step 1: Write the failing test**

There is no `@vue/test-utils` dependency in this project, so composable tests here do not mount a component — they mock `vue-router` directly (see `useOpnameDetail.test.ts`) and call the composable function itself. `onMounted`/`onBeforeRouteUpdate` are no-ops when there is no active component instance, so the test triggers the fetch explicitly via the composable's own exported `refreshDashboard()` instead of relying on mount timing:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchSummaryMock = vi.fn().mockResolvedValue({
    totalStock: 0,
    epcActive: 0,
    latestInboundDate: null,
    inboundToday: 0,
    latestOutboundDate: null,
    outboundToday: 0,
    opnamePending: 0,
});
const fetchAlertsMock = vi.fn().mockResolvedValue({
    counts: { critical: 1, warning: 0, info: 0 },
    alerts: [{ severity: "critical", title: "Test alert" }],
});
const fetchWorkflowOverviewMock = vi.fn().mockResolvedValue({ panels: [] });
const fetchKpiSnapshotMock = vi.fn().mockResolvedValue({ cards: [] });

vi.mock("@/services/dashboard.service", () => ({
    dashboardService: {
        fetchSummary: fetchSummaryMock,
        fetchHeatmap: vi.fn().mockResolvedValue({ rows: [], maxQuantity: 0 }),
        fetchChart: vi.fn().mockResolvedValue([]),
        fetchLowStock: vi
            .fn()
            .mockResolvedValue({ totalLowStock: 0, items: [] }),
        fetchAlerts: fetchAlertsMock,
        fetchWorkflowOverview: fetchWorkflowOverviewMock,
        fetchKpiSnapshot: fetchKpiSnapshotMock,
    },
}));

vi.mock("@/composable/useDebouncedWatch", () => ({
    useDebouncedWatch: vi.fn(),
}));

vi.mock("@/composable/useWarehouseOptions", async () => {
    const { ref } = await import("vue");
    return {
        useWarehouseOptions: () => ({
            options: ref([]),
            loading: ref(false),
            error: ref(null),
        }),
    };
});

vi.mock("@/store/auth.store", () => ({
    useAuthStore: () => ({ profile: { warehouses: [] } }),
}));

vi.mock("@/store/warehouse.store", () => ({
    useWarehouseStore: () => ({
        selectedWarehouseId: null,
        setWarehouse: vi.fn(),
        syncWarehouseSelection: vi.fn(),
    }),
}));

vi.mock("vue-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("vue-router")>();
    return {
        ...actual,
        useRoute: () => ({ query: {}, meta: { section: "overview" } }),
        useRouter: () => ({ replace: vi.fn() }),
        onBeforeRouteUpdate: vi.fn(),
    };
});

import { useDashboard } from "./useDashboard";

describe("useDashboard alerts/workflow/kpi state", () => {
    beforeEach(() => {
        fetchAlertsMock.mockClear();
        fetchWorkflowOverviewMock.mockClear();
        fetchKpiSnapshotMock.mockClear();
    });

    it("loads alerts, workflow overview, and kpi snapshot when refreshed for the overview section", async () => {
        const composable = useDashboard();

        await composable.refreshDashboard();

        expect(fetchAlertsMock).toHaveBeenCalled();
        expect(fetchWorkflowOverviewMock).toHaveBeenCalled();
        expect(fetchKpiSnapshotMock).toHaveBeenCalled();
        expect(composable.alertsData.value?.counts.critical).toBe(1);
        expect(composable.workflowData.value?.panels).toEqual([]);
        expect(composable.kpiSnapshotData.value?.cards).toEqual([]);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/composables/useDashboard.test.ts`
Expected: FAIL — `composable.alertsData` is `undefined`

- [ ] **Step 3: Add the new state and fetch calls to `useDashboard.ts`**

Add new data/loading refs after the existing ones (near `recentActivityData`/`recentActivityLoading`):

```ts
const alertsData = ref<DashboardAlertsResponse | null>(null);
const workflowData = ref<DashboardWorkflowOverviewResponse | null>(null);
const kpiSnapshotData = ref<DashboardKpiSnapshotResponse | null>(null);

const alertsLoading = ref(false);
const workflowLoading = ref(false);
const kpiSnapshotLoading = ref(false);
```

Add the corresponding type imports at the top:

```ts
import type {
    DashboardAlertsResponse,
    DashboardWorkflowOverviewResponse,
    DashboardKpiSnapshotResponse,
} from "@/model/dashboard";
```

Update `dashboardLoading` to include the three new loading flags:

```ts
const dashboardLoading = computed(
    () =>
        summaryLoading.value ||
        heatmapLoading.value ||
        chartLoading.value ||
        lowStockLoading.value ||
        epcStatusLoading.value ||
        recentActivityLoading.value ||
        alertsLoading.value ||
        workflowLoading.value ||
        kpiSnapshotLoading.value,
);
```

Inside `refreshDashboard()`, in the `if (section.value === "overview")` branch, add after the existing `lowStockLoading` block:

```ts
alertsLoading.value = true;
dashboardService
    .fetchAlerts(filter)
    .then((res) => (alertsData.value = res))
    .catch((err) => (dashboardError.value = err.message))
    .finally(() => (alertsLoading.value = false));

workflowLoading.value = true;
dashboardService
    .fetchWorkflowOverview(filter)
    .then((res) => (workflowData.value = res))
    .catch((err) => (dashboardError.value = err.message))
    .finally(() => (workflowLoading.value = false));

kpiSnapshotLoading.value = true;
dashboardService
    .fetchKpiSnapshot(filter)
    .then((res) => (kpiSnapshotData.value = res))
    .catch((err) => (dashboardError.value = err.message))
    .finally(() => (kpiSnapshotLoading.value = false));
```

Add the three refs and their loading flags to the `return { ... }` object at the bottom of `useDashboard`:

```ts
        alertsData,
        alertsLoading,
        workflowData,
        workflowLoading,
        kpiSnapshotData,
        kpiSnapshotLoading,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/composables/useDashboard.test.ts`
Expected: PASS

- [ ] **Step 5: Run the full dashboard test suite to check for regressions**

Run: `npx vitest run src/views/dashboard`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/views/dashboard/composables/useDashboard.ts src/views/dashboard/composables/useDashboard.test.ts
git commit -m "feat: wire alerts, workflow overview, and kpi snapshot into useDashboard"
```

---

### Task 13: `DashboardAlertCenter.vue` component

**Files:**

- Create: `src/views/dashboard/components/DashboardAlertCenter.vue`
- Test: `src/views/dashboard/components/DashboardAlertCenter.test.ts`

**Interfaces:**

- Consumes: `DashboardAlert`, `DashboardAlertsResponse` (Task 10), `Card`/`Icon` (existing), `lucide-vue-next` icons.
- Produces: `DashboardAlertCenter` component with props `{ loading: boolean; data: DashboardAlertsResponse | null }` — consumed by Task 16.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import DashboardAlertCenter from "./DashboardAlertCenter.vue";

describe("DashboardAlertCenter", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(DashboardAlertCenter, {
            loading: true,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders an empty state when there is no data", async () => {
        const app = createSSRApp(DashboardAlertCenter, {
            loading: false,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("No alerts");
    });

    it("renders alert cards with severity, business impact, and recommended action", async () => {
        const app = createSSRApp(DashboardAlertCenter, {
            loading: false,
            data: {
                counts: { critical: 1, warning: 1, info: 0 },
                alerts: [
                    {
                        severity: "critical",
                        title: "Sales Orders waiting Picking exceed threshold",
                        tag: "Jakarta Hub",
                        category: "Inventory",
                        summary:
                            "212 Sales Orders queued, 38% above normal threshold",
                        businessImpact:
                            "Potential shipment delay for 14 outbound Sales Orders",
                        recommendedAction:
                            "Reassign pickers from Zone A to Zone C-4.",
                        docRef: null,
                        occurredAt: "2026-07-18T09:12:00.000Z",
                    },
                ],
            },
        });
        const html = await renderToString(app);
        expect(html).toContain("Sales Orders waiting Picking exceed threshold");
        expect(html).toContain(
            "Potential shipment delay for 14 outbound Sales Orders",
        );
        expect(html).toContain("Reassign pickers from Zone A to Zone C-4.");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/DashboardAlertCenter.test.ts`
Expected: FAIL — `Failed to resolve import "./DashboardAlertCenter.vue"`

- [ ] **Step 3: Write `DashboardAlertCenter.vue`**

```vue
<template>
    <Card object-id="wdg_DashboardAlertCenter">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
                <h2 class="text-lg font-semibold text-gray-900">
                    Operations Alert Center
                </h2>
                <p class="text-sm text-gray-500 mt-0.5">
                    What requires immediate attention right now
                </p>
            </div>
            <div
                v-if="data"
                class="flex items-center gap-2 text-xs font-semibold"
            >
                <span
                    class="rounded-full bg-red-50 px-2.5 py-1 text-signal-red ring-1 ring-red-200/60"
                >
                    Critical {{ data.counts.critical }}
                </span>
                <span
                    class="rounded-full bg-orange-50 px-2.5 py-1 text-action-orange ring-1 ring-orange-200/60"
                >
                    Warning {{ data.counts.warning }}
                </span>
                <span
                    class="rounded-full bg-blue-50 px-2.5 py-1 text-primary-600 ring-1 ring-blue-200/60"
                >
                    Info {{ data.counts.info }}
                </span>
            </div>
        </div>

        <div class="mt-6">
            <div v-if="loading" class="space-y-3">
                <div
                    v-for="n in 3"
                    :key="`alert-skel-${n}`"
                    class="h-24 rounded-md bg-workspace-bg animate-pulse"
                ></div>
            </div>

            <div
                v-else-if="!data || data.alerts.length === 0"
                class="rounded-lg border border-gray-100 bg-gray-50/50 p-8 flex flex-col items-center text-center"
            >
                <div
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 mb-3 text-emerald-500"
                >
                    <Icon :icon="CheckCircle2" :size="20" />
                </div>
                <p class="text-sm font-medium text-gray-900">No alerts</p>
                <p class="text-xs text-gray-500 mt-1">
                    Nothing requires attention for the selected warehouse.
                </p>
            </div>

            <ul v-else class="space-y-3">
                <li
                    v-for="(alert, index) in data.alerts"
                    :key="`${alert.title}-${index}`"
                    class="rounded-md border border-border-default bg-white p-4 shadow-xs"
                >
                    <div class="flex items-start gap-3">
                        <div
                            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                            :class="severityIconClass(alert.severity)"
                        >
                            <Icon
                                :icon="severityIcon(alert.severity)"
                                :size="16"
                            />
                        </div>
                        <div class="flex-1">
                            <div class="flex flex-wrap items-center gap-2">
                                <span
                                    class="text-sm font-semibold text-gray-900"
                                    >{{ alert.title }}</span
                                >
                                <span
                                    class="rounded-full bg-workspace-bg px-2 py-0.5 text-xs font-medium text-text-secondary"
                                >
                                    {{ alert.tag }}
                                </span>
                                <span
                                    class="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary-600"
                                >
                                    {{ alert.category }}
                                </span>
                            </div>
                            <p class="text-xs text-text-secondary mt-1">
                                {{ alert.summary }}
                            </p>
                            <div
                                class="mt-3 grid gap-2 sm:grid-cols-2 bg-workspace-bg rounded-md p-3"
                            >
                                <div>
                                    <p
                                        class="text-[10px] font-semibold uppercase text-text-tertiary"
                                    >
                                        Business Impact
                                    </p>
                                    <p class="text-xs text-gray-700 mt-0.5">
                                        {{ alert.businessImpact }}
                                    </p>
                                </div>
                                <div>
                                    <p
                                        class="text-[10px] font-semibold uppercase text-text-tertiary"
                                    >
                                        Recommended Action
                                    </p>
                                    <p class="text-xs text-gray-700 mt-0.5">
                                        {{ alert.recommendedAction }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import Icon from "@/components/atoms/Icon.vue";
import { AlertTriangle, CheckCircle2, Info } from "lucide-vue-next";
import type {
    DashboardAlert,
    DashboardAlertsResponse,
} from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardAlertsResponse | null;
}>();

const severityIcon = (severity: DashboardAlert["severity"]) =>
    severity === "info" ? Info : AlertTriangle;

const severityIconClass = (severity: DashboardAlert["severity"]) => {
    if (severity === "critical") return "bg-red-50 text-signal-red";
    if (severity === "warning") return "bg-orange-50 text-action-orange";
    return "bg-blue-50 text-primary-600";
};
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/DashboardAlertCenter.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/views/dashboard/components/DashboardAlertCenter.vue src/views/dashboard/components/DashboardAlertCenter.test.ts
git commit -m "feat: add DashboardAlertCenter component"
```

---

### Task 14: `DashboardWorkflowOverview.vue` component

**Files:**

- Create: `src/views/dashboard/components/DashboardWorkflowOverview.vue`
- Test: `src/views/dashboard/components/DashboardWorkflowOverview.test.ts`

**Interfaces:**

- Consumes: `DashboardWorkflowPanel`, `DashboardWorkflowOverviewResponse` (Task 10), `Card` (existing).
- Produces: `DashboardWorkflowOverview` component with props `{ loading: boolean; data: DashboardWorkflowOverviewResponse | null }` — consumed by Task 16.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import DashboardWorkflowOverview from "./DashboardWorkflowOverview.vue";

describe("DashboardWorkflowOverview", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(DashboardWorkflowOverview, {
            loading: true,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders panel titles, kpi row, and insufficient-data state for trend", async () => {
        const app = createSSRApp(DashboardWorkflowOverview, {
            loading: false,
            data: {
                panels: [
                    {
                        key: "inboundPutaway",
                        title: "Inbound & Putaway Workflow",
                        openCount: 428,
                        avgCycleTimeHours: null,
                        completionRate: 0.88,
                        bottleneckStage: "Waiting Putaway",
                        stages: [
                            {
                                name: "Waiting Putaway",
                                count: 120,
                                pctOfOpen: 28,
                                avgWaitHours: null,
                                trendPct: null,
                            },
                        ],
                    },
                ],
            },
        });
        const html = await renderToString(app);
        expect(html).toContain("Inbound &amp; Putaway Workflow");
        expect(html).toContain("Waiting Putaway");
        expect(html).toContain("Insufficient data yet");
    });

    it("renders a trend percentage when present", async () => {
        const app = createSSRApp(DashboardWorkflowOverview, {
            loading: false,
            data: {
                panels: [
                    {
                        key: "outbound",
                        title: "Outbound Workflow",
                        openCount: 50,
                        avgCycleTimeHours: null,
                        completionRate: 0.6,
                        bottleneckStage: "Open",
                        stages: [
                            {
                                name: "Posted",
                                count: 30,
                                pctOfOpen: 60,
                                avgWaitHours: null,
                                trendPct: 12.5,
                            },
                        ],
                    },
                ],
            },
        });
        const html = await renderToString(app);
        expect(html).toContain("+12.5%");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/DashboardWorkflowOverview.test.ts`
Expected: FAIL

- [ ] **Step 3: Write `DashboardWorkflowOverview.vue`**

```vue
<template>
    <Card object-id="wdg_DashboardWorkflowOverview">
        <div>
            <h2 class="text-lg font-semibold text-gray-900">
                Business Workflow Overview
            </h2>
            <p class="text-sm text-gray-500 mt-0.5">
                Where business objects stand right now — not warehouse activity
            </p>
        </div>

        <div class="mt-6">
            <div v-if="loading" class="grid gap-4 lg:grid-cols-2">
                <div
                    v-for="n in 2"
                    :key="`wf-skel-${n}`"
                    class="h-48 rounded-md bg-workspace-bg animate-pulse"
                ></div>
            </div>

            <div
                v-else-if="!data || data.panels.length === 0"
                class="rounded-lg border border-gray-100 bg-gray-50/50 p-8 text-center text-sm text-gray-500"
            >
                No workflow data available.
            </div>

            <div v-else class="grid gap-4 lg:grid-cols-2">
                <div
                    v-for="panel in data.panels"
                    :key="panel.key"
                    class="rounded-md border border-border-default p-4"
                >
                    <h3 class="text-sm font-semibold text-gray-900">
                        {{ panel.title }}
                    </h3>
                    <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div>
                            <p
                                class="text-[10px] font-semibold uppercase text-text-tertiary"
                            >
                                Open
                            </p>
                            <p class="text-sm font-bold text-gray-900">
                                {{ panel.openCount }}
                            </p>
                        </div>
                        <div>
                            <p
                                class="text-[10px] font-semibold uppercase text-text-tertiary"
                            >
                                Completion Rate
                            </p>
                            <p class="text-sm font-bold text-gray-900">
                                {{ Math.round(panel.completionRate * 100) }}%
                            </p>
                        </div>
                        <div class="col-span-2">
                            <p
                                class="text-[10px] font-semibold uppercase text-text-tertiary"
                            >
                                Bottleneck
                            </p>
                            <p class="text-sm font-bold text-action-orange">
                                {{ panel.bottleneckStage }}
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 space-y-2">
                        <div
                            v-for="stage in panel.stages"
                            :key="stage.name"
                            class="flex items-center justify-between rounded-md bg-workspace-bg px-3 py-2 text-xs"
                        >
                            <span class="font-medium text-gray-700">{{
                                stage.name
                            }}</span>
                            <span class="text-text-secondary"
                                >{{ stage.count }} ·
                                {{ stage.pctOfOpen ?? 0 }}%</span
                            >
                            <span
                                v-if="stage.trendPct === null"
                                class="text-text-tertiary italic"
                            >
                                Insufficient data yet
                            </span>
                            <span
                                v-else
                                :class="
                                    stage.trendPct >= 0
                                        ? 'text-emerald-600'
                                        : 'text-signal-red'
                                "
                                class="font-semibold"
                            >
                                {{ stage.trendPct >= 0 ? "+" : ""
                                }}{{ stage.trendPct.toFixed(1) }}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import type { DashboardWorkflowOverviewResponse } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardWorkflowOverviewResponse | null;
}>();
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/DashboardWorkflowOverview.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/views/dashboard/components/DashboardWorkflowOverview.vue src/views/dashboard/components/DashboardWorkflowOverview.test.ts
git commit -m "feat: add DashboardWorkflowOverview component"
```

---

### Task 15: `DashboardKpiSnapshot.vue` component

**Files:**

- Create: `src/views/dashboard/components/DashboardKpiSnapshot.vue`
- Test: `src/views/dashboard/components/DashboardKpiSnapshot.test.ts`

**Interfaces:**

- Consumes: `DashboardKpiCard`, `DashboardKpiSnapshotResponse` (Task 10), `Card` (existing).
- Produces: `DashboardKpiSnapshot` component with props `{ loading: boolean; data: DashboardKpiSnapshotResponse | null }` — consumed by Task 16.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import DashboardKpiSnapshot from "./DashboardKpiSnapshot.vue";

describe("DashboardKpiSnapshot", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(DashboardKpiSnapshot, {
            loading: true,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders score cards with sub-metrics and a disabled view-performance link", async () => {
        const app = createSSRApp(DashboardKpiSnapshot, {
            loading: false,
            data: {
                cards: [
                    {
                        key: "stockIn",
                        label: "Stock In Performance",
                        score: 83,
                        trendVsPrevious: 0.8,
                        subMetrics: [
                            {
                                label: "Productivity Improvement",
                                value: "+1.1%",
                            },
                            { label: "Cycle Time Improvement", value: "+1.6%" },
                        ],
                        sparkline: [80, 81, 82, 81, 82, 83],
                    },
                ],
            },
        });
        const html = await renderToString(app);
        expect(html).toContain("Stock In Performance");
        expect(html).toContain("83");
        expect(html).toContain("Productivity Improvement");
        expect(html).toContain("View Performance");
        expect(html).toContain("disabled");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/DashboardKpiSnapshot.test.ts`
Expected: FAIL

- [ ] **Step 3: Write `DashboardKpiSnapshot.vue`**

```vue
<template>
    <Card object-id="wdg_DashboardKpiSnapshot">
        <div>
            <h2 class="text-lg font-semibold text-gray-900">
                Executive KPI Snapshot
            </h2>
            <p class="text-sm text-gray-500 mt-0.5">
                Operational improvement vs previous period
            </p>
        </div>

        <div class="mt-6">
            <div v-if="loading" class="grid gap-4 sm:grid-cols-3">
                <div
                    v-for="n in 3"
                    :key="`kpi-skel-${n}`"
                    class="h-40 rounded-md bg-workspace-bg animate-pulse"
                ></div>
            </div>

            <div
                v-else-if="!data || data.cards.length === 0"
                class="rounded-lg border border-gray-100 bg-gray-50/50 p-8 text-center text-sm text-gray-500"
            >
                No KPI data available.
            </div>

            <div v-else class="grid gap-4 sm:grid-cols-3">
                <div
                    v-for="card in data.cards"
                    :key="card.key"
                    class="rounded-md border border-border-default p-4"
                >
                    <div class="flex items-center justify-between">
                        <span
                            class="text-xs font-semibold uppercase text-text-tertiary"
                            >{{ card.label }}</span
                        >
                        <span
                            :class="
                                card.trendVsPrevious >= 0
                                    ? 'text-emerald-600'
                                    : 'text-signal-red'
                            "
                            class="text-xs font-semibold"
                        >
                            {{ card.trendVsPrevious >= 0 ? "+" : ""
                            }}{{ card.trendVsPrevious }}pt
                        </span>
                    </div>
                    <p class="text-3xl font-extrabold text-gray-900 mt-2">
                        {{ card.score
                        }}<span
                            class="text-xs font-semibold text-text-tertiary"
                        >
                            / 100</span
                        >
                    </p>
                    <div class="mt-3 space-y-1.5">
                        <div
                            v-for="metric in card.subMetrics"
                            :key="metric.label"
                            class="flex items-center justify-between text-xs"
                        >
                            <span class="text-text-secondary">{{
                                metric.label
                            }}</span>
                            <span class="font-semibold text-emerald-600">{{
                                metric.value
                            }}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled
                        class="mt-4 text-xs font-semibold text-text-tertiary cursor-not-allowed"
                    >
                        View Performance →
                    </button>
                </div>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import type { DashboardKpiSnapshotResponse } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardKpiSnapshotResponse | null;
}>();
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/DashboardKpiSnapshot.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/views/dashboard/components/DashboardKpiSnapshot.vue src/views/dashboard/components/DashboardKpiSnapshot.test.ts
git commit -m "feat: add DashboardKpiSnapshot component"
```

---

### Task 16: Wire the three components into `DashboardPage.vue`

**Files:**

- Modify: `src/views/dashboard/DashboardPage.vue`
- Modify: `src/views/dashboard/DashboardPage.test.ts`

**Interfaces:**

- Consumes: `DashboardAlertCenter` (Task 13), `DashboardWorkflowOverview` (Task 14), `DashboardKpiSnapshot` (Task 15), `alertsData`/`alertsLoading`/`workflowData`/`workflowLoading`/`kpiSnapshotData`/`kpiSnapshotLoading` from `useDashboard()` (Task 12).

- [ ] **Step 1: Update `DashboardPage.test.ts`'s mock return value**

Add the new fields to the object returned by `useDashboardMock.mockReturnValue({...})`:

```ts
useDashboardMock.mockReturnValue({
    dashboardSections: [
        { key: "alerts", heading: "Operations Alert Center" },
        { key: "workflow", heading: "Business Workflow Overview" },
        { key: "kpi", heading: "Executive KPI Snapshot" },
    ],
    warehouseOptions: [],
    warehousesLoading: false,
    warehouseError: null,
    dashboardLoading: false,
    dashboardError: null,
    refreshDashboard: vi.fn(),
    selectedWarehouseId: null,
    setSelectedWarehouse: vi.fn(),
    alertsData: null,
    alertsLoading: false,
    workflowData: null,
    workflowLoading: false,
    kpiSnapshotData: null,
    kpiSnapshotLoading: false,
});
```

Add stub mocks for the three new components alongside the existing `DashboardToolbar.vue` stub:

```ts
vi.mock("./components/DashboardAlertCenter.vue", () => ({
    default: defineComponent({
        name: "DashboardAlertCenterStub",
        setup: () => () => null,
    }),
}));

vi.mock("./components/DashboardWorkflowOverview.vue", () => ({
    default: defineComponent({
        name: "DashboardWorkflowOverviewStub",
        setup: () => () => null,
    }),
}));

vi.mock("./components/DashboardKpiSnapshot.vue", () => ({
    default: defineComponent({
        name: "DashboardKpiSnapshotStub",
        setup: () => () => null,
    }),
}));
```

Add one more assertion inside the existing `it` block to prove the page still surfaces the section headings (already covered) — no new assertions are required since the components are stubbed to render `null`; the existing three `expect(html).toContain(...)` calls remain the coverage for headings.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/DashboardPage.test.ts`
Expected: FAIL — `Failed to resolve import "./components/DashboardAlertCenter.vue"` is NOT expected (it exists from Task 13), so this should actually still pass at this point since the component files exist. Instead, confirm the CURRENT (pre-Step-3) `DashboardPage.vue` template renders nothing when using the mocked data — this step exists to lock in the updated mock shape before changing the template. If the test already passes unchanged, proceed directly to Step 3.

- [ ] **Step 3: Rewrite `DashboardPage.vue`'s template**

```vue
<template>
    <section class="space-y-6">
        <DashboardToolbar
            :warehouse-id="selectedWarehouseId"
            :warehouse-options="warehouseOptions"
            :loading="dashboardLoading"
            @update:warehouse-id="setSelectedWarehouse"
            @refresh="refreshDashboard"
        />

        <p
            v-if="dashboardError && !dashboardLoading"
            class="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-signal-red"
        >
            {{ dashboardError }}
        </p>
        <p
            v-if="warehouseError && !warehousesLoading"
            class="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-signal-red"
        >
            {{ warehouseError }}
        </p>

        <div class="space-y-6">
            <section class="space-y-3">
                <h2 class="text-lg font-semibold text-slate-900">
                    Operations Alert Center
                </h2>
                <DashboardAlertCenter
                    :loading="alertsLoading"
                    :data="alertsData"
                />
            </section>

            <section class="space-y-3">
                <h2 class="text-lg font-semibold text-slate-900">
                    Business Workflow Overview
                </h2>
                <DashboardWorkflowOverview
                    :loading="workflowLoading"
                    :data="workflowData"
                />
            </section>

            <section class="space-y-3">
                <h2 class="text-lg font-semibold text-slate-900">
                    Executive KPI Snapshot
                </h2>
                <DashboardKpiSnapshot
                    :loading="kpiSnapshotLoading"
                    :data="kpiSnapshotData"
                />
            </section>
        </div>
    </section>
</template>

<script setup lang="ts">
import DashboardToolbar from "./components/DashboardToolbar.vue";
import DashboardAlertCenter from "./components/DashboardAlertCenter.vue";
import DashboardWorkflowOverview from "./components/DashboardWorkflowOverview.vue";
import DashboardKpiSnapshot from "./components/DashboardKpiSnapshot.vue";
import { useDashboard } from "./composables/useDashboard";

const {
    warehouseOptions,
    warehousesLoading,
    warehouseError,
    dashboardLoading,
    dashboardError,
    refreshDashboard,
    selectedWarehouseId,
    setSelectedWarehouse,
    alertsData,
    alertsLoading,
    workflowData,
    workflowLoading,
    kpiSnapshotData,
    kpiSnapshotLoading,
} = useDashboard();
</script>
```

Note: `dashboardSections` is no longer used by the template now that each section is rendered explicitly with its real component — remove it from the destructured import. If `dashboardSections` in `useDashboard.ts` is not referenced anywhere else, leave its declaration and export in place (removing it is out of scope for this task and would break the `DashboardPage.test.ts` mock shape which still provides it).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/DashboardPage.test.ts`
Expected: PASS

- [ ] **Step 5: Run the full frontend test suite to check for regressions**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 6: Type-check**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/views/dashboard/DashboardPage.vue src/views/dashboard/DashboardPage.test.ts
git commit -m "feat: render Operations Alert Center, Business Workflow Overview, and Executive KPI Snapshot on the dashboard"
```

---

## Post-Implementation Verification

- [ ] Run backend full suite: `cd /Users/syillaeltaniadaffa/Documents/Warehouse-be && npx jest`
- [ ] Run frontend full suite: `cd /Users/syillaeltaniadaffa/Documents/Warehouse && npx vitest run`
- [ ] Run frontend type-check: `npx vue-tsc --noEmit`
- [ ] Start both dev servers and manually load `/dashboard/overview` with a real warehouse selected; confirm all three sections render real data (or explicit empty/insufficient-data states) instead of bare headings.
