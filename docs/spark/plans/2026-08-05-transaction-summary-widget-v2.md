# Transaction Summary Widget v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the client-side-only Transaction Summary Widget with a backend-backed one that reflects the FULL filtered result set, and add percentage-per-status, a most-recent-transaction card, and a needs-attention indicator.

**Architecture:** Add a `GET /{type}/summary` endpoint to each of the 7 doc-type modules in `Warehouse-be` (inbound, outbound, relocation, transfer, returns, putaway, register), each computed from the same filter logic as that module's existing `list()` (extracted into a shared private `buildListWhere()` per module so the two never drift). The frontend (`Warehouse`) fetches this endpoint alongside the existing table fetch, replacing the old client-side derivation composable, and renders it as a 4-card grid.

**Tech Stack:** Backend: NestJS 10, Prisma 5.x, Jest. Frontend: Vue 3 (`<script setup>`, Composition API), TypeScript, Vitest.

## Global Constraints

- No new DTO classes — the summary endpoints reuse each module's existing `<Type>ListFilterDto` (`page`/`limit` present but unused by the summary method).
- `@Get('summary')` must be declared BEFORE `@Get(':id')` in every controller, or NestJS's route matching will try to parse `"summary"` as a UUID and 400.
- Percentage = `count / totalCount * 100`, rounded to 1 decimal via `Math.round((count / totalCount) * 1000) / 10`; `0` when `totalCount` is `0`.
- "Needs attention" = `canceled` count + `draft` count older than 3 days (`new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)`), evaluated within the SAME filtered `where` as the rest of the summary. The 3-day cutoff on the date field must be combined with any existing date-range filter on that same field via Prisma's `AND` array — never via object-spread override, which would silently drop the user's own `dateFrom`/`dateTo` filter for that one count.
- Each doc-type module uses whichever date field it already uses for its own list filtering: `createdAt` for inbound/outbound/relocation/transfer/returns, `docDate` for putaway/register.
- Each doc-type module's creator relation: `users` for inbound/outbound/relocation/transfer/returns/putaway; `createdBy` for register (confirmed via `prisma/schema.prisma` — register is the one exception with an explicit relation name).
- The raw Prisma doc-number field (`inbound_no`, `outbound_no`, `relocation_no`, `transfer_no`, `return_no`, or `docNumber` for putaway/register) is always renamed to `docNo` in the response — never passed through as-is.
- `buildListWhere()` extraction must be behavior-preserving — existing `list()` tests (where they exist) must still pass unmodified after the refactor.
- Frontend: the summary fetch is independent of the table fetch — a `/summary` failure must never clear `rows` or set the table's `error`, and a `/{type}` list failure must never clear `summary` or set `summaryError`.
- Frontend: `loadSummary()` fires alongside `loadRows()` on mount and on filter change (keyword/date/warehouse/partner) and on `refresh()` — but NOT on page/limit change, since the summary always covers the full filtered set regardless of which page the table shows.
- All backend commands run from `/Users/syillaeltaniadaffa/Documents/Warehouse-be`; all frontend commands run from `/Users/syillaeltaniadaffa/Documents/Warehouse`. There is no `npm test` script in the frontend repo — use `npx vitest run <path>`. The backend test runner is Jest — use `npx jest <path>`.

---

### Task 1: Inbound — `buildListWhere` extraction + `getSummary()` + `GET /inbound/summary` (template module)

**Files:**

- Modify: `src/modules/warehouse/inbound/inbound.service.ts`
- Modify: `src/modules/warehouse/inbound/inbound.controller.ts`
- Modify: `src/modules/warehouse/inbound/inbound.service.spec.ts`

**Interfaces:**

- Produces: `InboundService.getSummary(query: InboundListFilterDto, user?: RequestUser)` returning `{ totalCount: number; statusBreakdown: { status: string; count: number; percentage: number }[]; mostRecent: { docNo: string; createdByName: string | null; createdAt: string } | null; needsAttention: { count: number; canceledCount: number; staleDraftCount: number } }`. This exact return shape is the template for Tasks 2–7 and for the frontend's `TransactionSummaryResponse` type in Task 8.
- Produces: `InboundController.getSummary` at `GET /inbound/summary`, returning `successResponse(summary, 'Inbound summary')`.

- [ ] **Step 1: Extract the existing inline `where` construction into a private method**

In `src/modules/warehouse/inbound/inbound.service.ts`, replace the body of `list()` (currently starting at `async list(query: InboundListFilterDto, user?: RequestUser): Promise<PaginatedResult<unknown>> {`) with:

```ts
  private buildListWhere(
    query: InboundListFilterDto,
    user?: RequestUser,
  ): Prisma.InboundDocWhereInput {
    const where: Prisma.InboundDocWhereInput = {};

    if (query.companyId) where.companyId = query.companyId;
    if (query.warehouseId) where.warehouse_id = query.warehouseId;
    if (query.postedOnly === 'true') where.status = 'posted';
    else if (query.status && isValidDocStatus(query.status)) where.status = query.status;
    if (query.mine === 'true' && user?.id) where.createdById = user.id;
    const searchTerm = query.docNumber ?? query.search?.trim();
    if (searchTerm) {
      where.inbound_no = { contains: searchTerm, mode: 'insensitive' };
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = buildDateRangeWhere(query.dateFrom, query.dateTo);
    }

    return where;
  }

  async list(query: InboundListFilterDto, user?: RequestUser): Promise<PaginatedResult<unknown>> {
    const { skip, take } = this.prisma.getPaginationArgs(query.page, query.limit);
    const where = this.buildListWhere(query, user);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.inboundDoc.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, code: true, name: true } },
          supplier: { select: { id: true, name: true } },
          warehouses: { select: { id: true, code: true, name: true } },
          _count: { select: { lines: true } },
        },
      }),
      this.prisma.inboundDoc.count({ where }),
    ]);

    return { items, meta: buildMeta(total, query.page, query.limit) };
  }
```

- [ ] **Step 2: Run the existing `list()` tests to confirm the refactor is behavior-preserving**

Run: `npx jest src/modules/warehouse/inbound/inbound.service.spec.ts -t "list"`
Expected: PASS (3 tests: "should filter by warehouseId when provided", "should not add warehouse_id to where when warehouseId is omitted", "should treat search as an inbound document number alias").

- [ ] **Step 3: Write the failing test for `getSummary()`**

First, in `src/modules/warehouse/inbound/inbound.service.spec.ts`, add `groupBy: jest.fn(), findFirst: jest.fn()` to the `inboundDoc` mock object (near the top of the file) alongside its existing `findUnique`/`create`/`update`/`findUniqueOrThrow`/`findMany`/`count` entries — the test code below reassigns these with `mockResolvedValueOnce`/`mockResolvedValue` chains, which requires the properties to already exist on the mock object's inferred type; adding them only inside a test body (rather than the base object literal) would not compile.

Then add this `describe` block to the same file, before the final closing `});` of the outer `describe('InboundService', ...)`:

```ts
  describe('getSummary()', () => {
    it('computes totals, status-breakdown percentages, most recent doc, and needs-attention counts', async () => {
      mockPrismaService.inboundDoc.count = jest
        .fn()
        .mockResolvedValueOnce(3) // totalCount
        .mockResolvedValueOnce(1) // canceledCount
        .mockResolvedValueOnce(1); // staleDraftCount
      mockPrismaService.inboundDoc.groupBy = jest.fn().mockResolvedValue([
        { status: 'posted', _count: { _all: 1 } },
        { status: 'draft', _count: { _all: 2 } },
      ]);
      mockPrismaService.inboundDoc.findFirst = jest.fn().mockResolvedValue({
        inbound_no: 'IN-010',
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        users: { fullName: 'Jane Doe' },
      });

      const result = await service.getSummary({ page: 1, limit: 20 } as never);

      expect(result.totalCount).toBe(3);
      expect(result.statusBreakdown).toEqual([
        { status: 'posted', count: 1, percentage: 33.3 },
        { status: 'draft', count: 2, percentage: 66.7 },
      ]);
      expect(result.mostRecent).toEqual({
        docNo: 'IN-010',
        createdByName: 'Jane Doe',
        createdAt: '2026-08-01T00:00:00.000Z',
      });
      expect(result.needsAttention).toEqual({
        count: 2,
        canceledCount: 1,
        staleDraftCount: 1,
      });
    });

    it('returns a null mostRecent and an empty breakdown when there are no matching documents', async () => {
      mockPrismaService.inboundDoc.count = jest
        .fn()
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrismaService.inboundDoc.groupBy = jest.fn().mockResolvedValue([]);
      mockPrismaService.inboundDoc.findFirst = jest.fn().mockResolvedValue(null);

      const result = await service.getSummary({ page: 1, limit: 20 } as never);

      expect(result.totalCount).toBe(0);
      expect(result.statusBreakdown).toEqual([]);
      expect(result.mostRecent).toBeNull();
      expect(result.needsAttention).toEqual({
        count: 0,
        canceledCount: 0,
        staleDraftCount: 0,
      });
    });

    it('combines the 3-day staleness cutoff with an existing date-range filter via AND, not override', async () => {
      mockPrismaService.inboundDoc.count = jest
        .fn()
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrismaService.inboundDoc.groupBy = jest.fn().mockResolvedValue([]);
      mockPrismaService.inboundDoc.findFirst = jest.fn().mockResolvedValue(null);

      await service.getSummary({
        page: 1,
        limit: 20,
        dateFrom: '2026-07-01T00:00:00.000Z',
      } as never);

      const staleDraftCall = mockPrismaService.inboundDoc.count.mock.calls[2][0];
      expect(staleDraftCall.where.AND).toEqual([
        expect.objectContaining({ createdAt: { gte: new Date('2026-07-01T00:00:00.000Z') } }),
        expect.objectContaining({ status: 'draft' }),
      ]);
    });
  });
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx jest src/modules/warehouse/inbound/inbound.service.spec.ts -t "getSummary"`
Expected: FAIL — `service.getSummary is not a function`.

- [ ] **Step 5: Implement `getSummary()`**

Add this method to `src/modules/warehouse/inbound/inbound.service.ts`, directly after `list()`:

```ts
  async getSummary(query: InboundListFilterDto, user?: RequestUser) {
    const where = this.buildListWhere(query, user);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const [totalCount, statusGroups, mostRecentDoc, canceledCount, staleDraftCount] =
      await this.prisma.$transaction([
        this.prisma.inboundDoc.count({ where }),
        this.prisma.inboundDoc.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
        }),
        this.prisma.inboundDoc.findFirst({
          where,
          orderBy: { createdAt: 'desc' },
          select: { inbound_no: true, createdAt: true, users: { select: { fullName: true } } },
        }),
        this.prisma.inboundDoc.count({ where: { ...where, status: 'canceled' } }),
        this.prisma.inboundDoc.count({
          where: { AND: [where, { status: 'draft', createdAt: { lt: threeDaysAgo } }] },
        }),
      ]);

    const statusBreakdown = statusGroups.map((group) => ({
      status: group.status,
      count: group._count._all,
      percentage: totalCount > 0 ? Math.round((group._count._all / totalCount) * 1000) / 10 : 0,
    }));

    return {
      totalCount,
      statusBreakdown,
      mostRecent: mostRecentDoc
        ? {
            docNo: mostRecentDoc.inbound_no,
            createdByName: mostRecentDoc.users?.fullName ?? null,
            createdAt: mostRecentDoc.createdAt.toISOString(),
          }
        : null,
      needsAttention: {
        count: canceledCount + staleDraftCount,
        canceledCount,
        staleDraftCount,
      },
    };
  }
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx jest src/modules/warehouse/inbound/inbound.service.spec.ts`
Expected: PASS (all tests in the file, including the pre-existing ones from Step 2 and the 3 new `getSummary()` tests).

- [ ] **Step 7: Add the controller route**

In `src/modules/warehouse/inbound/inbound.controller.ts`, add this method directly BEFORE the existing `@Get(':id')` method (`getDetail`):

```ts
  @Get('summary')
  @ApiBearerAuthProtected()
  @ApiOperation({
    summary: 'Get inbound summary',
    description:
      'Aggregate totals, status breakdown, most recent document, and needs-attention counts across the full filtered result set (not paginated). Accepts the same filters as GET /inbound.',
  })
  @ApiStandardOkResponse('Inbound summary')
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async getSummary(
    @Query() query: InboundListFilterDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ApiResponse<unknown>> {
    const summary = await this.inboundService.getSummary(query, user);
    return successResponse(summary, 'Inbound summary');
  }

```

- [ ] **Step 8: Type-check and run the full inbound test suite**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new type errors.

Run: `npx jest src/modules/warehouse/inbound`
Expected: PASS (all tests).

- [ ] **Step 9: Commit**

```bash
git add src/modules/warehouse/inbound/inbound.service.ts src/modules/warehouse/inbound/inbound.controller.ts src/modules/warehouse/inbound/inbound.service.spec.ts
git commit -m "feat(inbound): add GET /inbound/summary aggregate endpoint"
```

---

### Task 2: Outbound — `buildListWhere` extraction + `getSummary()` + `GET /outbound/summary`

**Files:**

- Modify: `src/modules/warehouse/outbound/outbound.service.ts`
- Modify: `src/modules/warehouse/outbound/outbound.controller.ts`
- Modify: `src/modules/warehouse/outbound/outbound.service.spec.ts`

**Interfaces:**

- Consumes: the same response shape and percentage/needs-attention rules established in Task 1.
- Produces: `OutboundService.getSummary(query: OutboundListFilterDto, user?: RequestUser)`, `OutboundController.getSummary` at `GET /outbound/summary`.

Note: outbound's `mine` filter maps to `assignedById`, not `createdById` — this only affects `buildListWhere`, not `getSummary`'s creator lookup, which still reads the `users` relation (the document's original creator via `createdById`, unrelated to the assignee).

- [ ] **Step 1: Extract `buildListWhere` and refactor `list()`**

In `src/modules/warehouse/outbound/outbound.service.ts`, replace the body of `list()` with:

```ts
  private buildListWhere(
    query: OutboundListFilterDto,
    user?: RequestUser,
  ): Prisma.OutboundDocWhereInput {
    const where: Prisma.OutboundDocWhereInput = {};

    if (query.companyId) where.companyId = query.companyId;
    if (query.warehouseId) where.warehouse_id = query.warehouseId;
    if (query.postedOnly === 'true') where.status = 'posted';
    else if (query.status && isValidDocStatus(query.status)) where.status = query.status;
    if (query.mine === 'true' && user?.id) where.assignedById = user.id;
    const searchTerm = query.docNumber ?? query.search?.trim();
    if (searchTerm) where.outbound_no = { contains: searchTerm, mode: 'insensitive' };
    if (query.dateFrom || query.dateTo) {
      where.createdAt = buildDateRangeWhere(query.dateFrom, query.dateTo);
    }

    return where;
  }

  async list(query: OutboundListFilterDto, user?: RequestUser): Promise<PaginatedResult<unknown>> {
    const { skip, take } = this.prisma.getPaginationArgs(query.page, query.limit);
    const where = this.buildListWhere(query, user);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.outboundDoc.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, code: true, name: true } },
          assignedBy: { select: { id: true, fullName: true } },
          customer: { select: { id: true, name: true } },
          warehouses: { select: { id: true, code: true, name: true } },
          _count: { select: { lines: true } },
        },
      }),
      this.prisma.outboundDoc.count({ where }),
    ]);
    return {
      items: items.map((doc) => decorateOutboundDoc(doc)),
      meta: buildMeta(total, query.page, query.limit),
    };
  }
```

- [ ] **Step 2: Run existing tests to confirm the refactor is behavior-preserving**

Run: `npx jest src/modules/warehouse/outbound/outbound.service.spec.ts`
Expected: PASS (all pre-existing tests).

- [ ] **Step 3: Write the failing test for `getSummary()`**

Add to `src/modules/warehouse/outbound/outbound.service.spec.ts` (adjust the mock setup to match this file's existing `mockPrismaService` variable name and structure — add `groupBy: jest.fn()` and `findFirst: jest.fn()` to the `outboundDoc` mock object if not already present):

```ts
  describe('getSummary()', () => {
    it('computes totals, status-breakdown percentages, most recent doc, and needs-attention counts', async () => {
      mockPrismaService.outboundDoc.count = jest
        .fn()
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);
      mockPrismaService.outboundDoc.groupBy = jest.fn().mockResolvedValue([
        { status: 'posted', _count: { _all: 1 } },
        { status: 'draft', _count: { _all: 2 } },
      ]);
      mockPrismaService.outboundDoc.findFirst = jest.fn().mockResolvedValue({
        outbound_no: 'OUT-010',
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        users: { fullName: 'Jane Doe' },
      });

      const result = await service.getSummary({ page: 1, limit: 20 } as never);

      expect(result.totalCount).toBe(3);
      expect(result.statusBreakdown).toEqual([
        { status: 'posted', count: 1, percentage: 33.3 },
        { status: 'draft', count: 2, percentage: 66.7 },
      ]);
      expect(result.mostRecent).toEqual({
        docNo: 'OUT-010',
        createdByName: 'Jane Doe',
        createdAt: '2026-08-01T00:00:00.000Z',
      });
      expect(result.needsAttention).toEqual({
        count: 2,
        canceledCount: 1,
        staleDraftCount: 1,
      });
    });

    it('returns a null mostRecent and an empty breakdown when there are no matching documents', async () => {
      mockPrismaService.outboundDoc.count = jest
        .fn()
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrismaService.outboundDoc.groupBy = jest.fn().mockResolvedValue([]);
      mockPrismaService.outboundDoc.findFirst = jest.fn().mockResolvedValue(null);

      const result = await service.getSummary({ page: 1, limit: 20 } as never);

      expect(result.totalCount).toBe(0);
      expect(result.statusBreakdown).toEqual([]);
      expect(result.mostRecent).toBeNull();
      expect(result.needsAttention).toEqual({
        count: 0,
        canceledCount: 0,
        staleDraftCount: 0,
      });
    });
  });
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx jest src/modules/warehouse/outbound/outbound.service.spec.ts -t "getSummary"`
Expected: FAIL — `service.getSummary is not a function`.

- [ ] **Step 5: Implement `getSummary()`**

Add to `src/modules/warehouse/outbound/outbound.service.ts`, directly after `list()`:

```ts
  async getSummary(query: OutboundListFilterDto, user?: RequestUser) {
    const where = this.buildListWhere(query, user);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const [totalCount, statusGroups, mostRecentDoc, canceledCount, staleDraftCount] =
      await this.prisma.$transaction([
        this.prisma.outboundDoc.count({ where }),
        this.prisma.outboundDoc.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
        }),
        this.prisma.outboundDoc.findFirst({
          where,
          orderBy: { createdAt: 'desc' },
          select: { outbound_no: true, createdAt: true, users: { select: { fullName: true } } },
        }),
        this.prisma.outboundDoc.count({ where: { ...where, status: 'canceled' } }),
        this.prisma.outboundDoc.count({
          where: { AND: [where, { status: 'draft', createdAt: { lt: threeDaysAgo } }] },
        }),
      ]);

    const statusBreakdown = statusGroups.map((group) => ({
      status: group.status,
      count: group._count._all,
      percentage: totalCount > 0 ? Math.round((group._count._all / totalCount) * 1000) / 10 : 0,
    }));

    return {
      totalCount,
      statusBreakdown,
      mostRecent: mostRecentDoc
        ? {
            docNo: mostRecentDoc.outbound_no,
            createdByName: mostRecentDoc.users?.fullName ?? null,
            createdAt: mostRecentDoc.createdAt.toISOString(),
          }
        : null,
      needsAttention: {
        count: canceledCount + staleDraftCount,
        canceledCount,
        staleDraftCount,
      },
    };
  }
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx jest src/modules/warehouse/outbound/outbound.service.spec.ts`
Expected: PASS.

- [ ] **Step 7: Add the controller route**

In `src/modules/warehouse/outbound/outbound.controller.ts`, add directly BEFORE the existing `@Get(':id')` method:

```ts
  @Get('summary')
  @ApiBearerAuthProtected()
  @ApiOperation({
    summary: 'Get outbound summary',
    description:
      'Aggregate totals, status breakdown, most recent document, and needs-attention counts across the full filtered result set (not paginated). Accepts the same filters as GET /outbound.',
  })
  @ApiStandardOkResponse('Outbound summary')
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async getSummary(
    @Query() query: OutboundListFilterDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ApiResponse<unknown>> {
    const summary = await this.outboundService.getSummary(query, user);
    return successResponse(summary, 'Outbound summary');
  }

```

- [ ] **Step 8: Type-check and run the full outbound test suite**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new type errors.

Run: `npx jest src/modules/warehouse/outbound`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/modules/warehouse/outbound/outbound.service.ts src/modules/warehouse/outbound/outbound.controller.ts src/modules/warehouse/outbound/outbound.service.spec.ts
git commit -m "feat(outbound): add GET /outbound/summary aggregate endpoint"
```

---

### Task 3: Relocation — `buildListWhere` extraction + `getSummary()` + `GET /relocation/summary`

**Files:**

- Modify: `src/modules/warehouse/relocation/relocation.service.ts`
- Modify: `src/modules/warehouse/relocation/relocation.controller.ts`
- Modify: `src/modules/warehouse/relocation/relocation.service.spec.ts`

**Interfaces:**

- Consumes: the response shape from Task 1.
- Produces: `RelocationService.getSummary(query: RelocationListFilterDto, user?: RequestUser)`, `RelocationController.getSummary` at `GET /relocation/summary`.

Note: relocation's `list()` uses a hand-rolled inline `where` type (not `Prisma.RelocationDocWhereInput`) and has NO `warehouseId` filter at all (confirmed: relocation is filtered by company/status/creator/docNumber/date only). `buildListWhere` must preserve this exactly — do not add a warehouse filter that doesn't exist today. Also note: `relocation.service.spec.ts`'s existing `mockPrismaService.relocationDoc` mock object has no `findMany`/`count`/`groupBy`/`findFirst` entries yet (relocation's `list()` has no existing test coverage) — add all four when extending the mock.

- [ ] **Step 1: Extract `buildListWhere` and refactor `list()`**

In `src/modules/warehouse/relocation/relocation.service.ts`, replace the body of `list()` with:

```ts
  private buildListWhere(
    query: RelocationListFilterDto,
    user?: RequestUser,
  ): {
    companyId?: string;
    status?: DocStatus;
    createdById?: string;
    relocation_no?: { contains: string; mode: 'insensitive' };
    createdAt?: { gte?: Date; lte?: Date };
  } {
    const where: {
      companyId?: string;
      status?: DocStatus;
      createdById?: string;
      relocation_no?: { contains: string; mode: 'insensitive' };
      createdAt?: { gte?: Date; lte?: Date };
    } = {};
    if (query.companyId) where.companyId = query.companyId;
    if (query.postedOnly === 'true') where.status = 'posted';
    else if (query.status && isValidDocStatus(query.status)) where.status = query.status;
    if (query.mine === 'true' && user?.id) where.createdById = user.id;
    if (query.docNumber) where.relocation_no = { contains: query.docNumber, mode: 'insensitive' };
    if (query.dateFrom || query.dateTo) {
      where.createdAt = buildDateRangeWhere(query.dateFrom, query.dateTo);
    }
    return where;
  }

  async list(
    query: RelocationListFilterDto,
    user?: RequestUser,
  ): Promise<PaginatedResult<unknown>> {
    const { skip, take } = this.prisma.getPaginationArgs(query.page, query.limit);
    const where = this.buildListWhere(query, user);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.relocationDoc.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, code: true, name: true } },
          _count: { select: { lines: true } },
        },
      }),
      this.prisma.relocationDoc.count({ where }),
    ]);
    return { items, meta: buildMeta(total, query.page, query.limit) };
  }
```

- [ ] **Step 2: Add `getSummary()`**

Add to `src/modules/warehouse/relocation/relocation.service.ts`, directly after `list()`:

```ts
  async getSummary(query: RelocationListFilterDto, user?: RequestUser) {
    const where = this.buildListWhere(query, user);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const [totalCount, statusGroups, mostRecentDoc, canceledCount, staleDraftCount] =
      await this.prisma.$transaction([
        this.prisma.relocationDoc.count({ where }),
        this.prisma.relocationDoc.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
        }),
        this.prisma.relocationDoc.findFirst({
          where,
          orderBy: { createdAt: 'desc' },
          select: {
            relocation_no: true,
            createdAt: true,
            users: { select: { fullName: true } },
          },
        }),
        this.prisma.relocationDoc.count({ where: { ...where, status: 'canceled' } }),
        this.prisma.relocationDoc.count({
          where: { AND: [where, { status: 'draft', createdAt: { lt: threeDaysAgo } }] },
        }),
      ]);

    const statusBreakdown = statusGroups.map((group) => ({
      status: group.status,
      count: group._count._all,
      percentage: totalCount > 0 ? Math.round((group._count._all / totalCount) * 1000) / 10 : 0,
    }));

    return {
      totalCount,
      statusBreakdown,
      mostRecent: mostRecentDoc
        ? {
            docNo: mostRecentDoc.relocation_no,
            createdByName: mostRecentDoc.users?.fullName ?? null,
            createdAt: mostRecentDoc.createdAt.toISOString(),
          }
        : null,
      needsAttention: {
        count: canceledCount + staleDraftCount,
        canceledCount,
        staleDraftCount,
      },
    };
  }
```

- [ ] **Step 3: Write the failing tests for `list()` regression and `getSummary()`**

Add to `src/modules/warehouse/relocation/relocation.service.spec.ts` — first extend the `relocationDoc` mock object (near the top of the file) to include `findMany: jest.fn(), count: jest.fn(), groupBy: jest.fn(), findFirst: jest.fn()` alongside its existing `findUnique`/`update`/`findUniqueOrThrow` entries, then add:

```ts
  describe('list()', () => {
    it('filters by status and applies date range', async () => {
      mockPrismaService.relocationDoc.findMany.mockResolvedValue([]);
      mockPrismaService.relocationDoc.count.mockResolvedValue(0);

      await service.list({
        page: 1,
        limit: 20,
        status: 'posted',
        dateFrom: '2026-07-01T00:00:00.000Z',
      } as never);

      expect(mockPrismaService.relocationDoc.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'posted',
            createdAt: { gte: new Date('2026-07-01T00:00:00.000Z') },
          }),
        }),
      );
    });
  });

  describe('getSummary()', () => {
    it('computes totals, status-breakdown percentages, most recent doc, and needs-attention counts', async () => {
      mockPrismaService.relocationDoc.count = jest
        .fn()
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);
      mockPrismaService.relocationDoc.groupBy = jest.fn().mockResolvedValue([
        { status: 'posted', _count: { _all: 1 } },
        { status: 'draft', _count: { _all: 2 } },
      ]);
      mockPrismaService.relocationDoc.findFirst = jest.fn().mockResolvedValue({
        relocation_no: 'REL-010',
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        users: { fullName: 'Jane Doe' },
      });

      const result = await service.getSummary({ page: 1, limit: 20 } as never);

      expect(result.totalCount).toBe(3);
      expect(result.statusBreakdown).toEqual([
        { status: 'posted', count: 1, percentage: 33.3 },
        { status: 'draft', count: 2, percentage: 66.7 },
      ]);
      expect(result.mostRecent).toEqual({
        docNo: 'REL-010',
        createdByName: 'Jane Doe',
        createdAt: '2026-08-01T00:00:00.000Z',
      });
      expect(result.needsAttention).toEqual({
        count: 2,
        canceledCount: 1,
        staleDraftCount: 1,
      });
    });

    it('returns a null mostRecent and an empty breakdown when there are no matching documents', async () => {
      mockPrismaService.relocationDoc.count = jest
        .fn()
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrismaService.relocationDoc.groupBy = jest.fn().mockResolvedValue([]);
      mockPrismaService.relocationDoc.findFirst = jest.fn().mockResolvedValue(null);

      const result = await service.getSummary({ page: 1, limit: 20 } as never);

      expect(result.totalCount).toBe(0);
      expect(result.statusBreakdown).toEqual([]);
      expect(result.mostRecent).toBeNull();
      expect(result.needsAttention).toEqual({
        count: 0,
        canceledCount: 0,
        staleDraftCount: 0,
      });
    });
  });
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/modules/warehouse/relocation/relocation.service.spec.ts`
Expected: PASS (all pre-existing tests plus the new `list()` and `getSummary()` tests).

- [ ] **Step 5: Add the controller route**

In `src/modules/warehouse/relocation/relocation.controller.ts`, add directly BEFORE the existing `@Get(':id')` method:

```ts
  @Get('summary')
  @ApiBearerAuthProtected()
  @ApiOperation({
    summary: 'Get relocation summary',
    description:
      'Aggregate totals, status breakdown, most recent document, and needs-attention counts across the full filtered result set (not paginated). Accepts the same filters as GET /relocation.',
  })
  @ApiStandardOkResponse('Relocation summary')
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async getSummary(
    @Query() query: RelocationListFilterDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ApiResponse<unknown>> {
    const summary = await this.relocationService.getSummary(query, user);
    return successResponse(summary, 'Relocation summary');
  }

```

- [ ] **Step 6: Type-check and run the full relocation test suite**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new type errors.

Run: `npx jest src/modules/warehouse/relocation`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/modules/warehouse/relocation/relocation.service.ts src/modules/warehouse/relocation/relocation.controller.ts src/modules/warehouse/relocation/relocation.service.spec.ts
git commit -m "feat(relocation): add GET /relocation/summary aggregate endpoint"
```

---

### Task 4: Transfer — `buildListWhere` extraction + `getSummary()` + `GET /transfer/summary` (+ new spec file)

**Files:**

- Modify: `src/modules/warehouse/transfer/transfer.service.ts`
- Modify: `src/modules/warehouse/transfer/transfer.controller.ts`
- Create: `src/modules/warehouse/transfer/transfer.service.spec.ts`

**Interfaces:**

- Consumes: the response shape from Task 1.
- Produces: `TransferService.getSummary(query: TransferListFilterDto, user?: RequestUser)`, `TransferController.getSummary` at `GET /transfer/summary`.

Note: transfer has NO existing spec file — this task creates one, scoped to `list()` and `getSummary()` only (not the full create/post/cancel surface, which is out of scope for this plan).

- [ ] **Step 1: Extract `buildListWhere` and refactor `list()`**

In `src/modules/warehouse/transfer/transfer.service.ts`, replace the body of `list()` with:

```ts
  private buildListWhere(
    query: TransferListFilterDto,
    user?: RequestUser,
  ): {
    companyId?: string;
    status?: DocStatus;
    createdById?: string;
    transfer_no?: { contains: string; mode: 'insensitive' };
    createdAt?: { gte?: Date; lte?: Date };
  } {
    const where: {
      companyId?: string;
      status?: DocStatus;
      createdById?: string;
      transfer_no?: { contains: string; mode: 'insensitive' };
      createdAt?: { gte?: Date; lte?: Date };
    } = {};
    if (query.companyId) where.companyId = query.companyId;
    if (query.postedOnly === 'true') where.status = 'posted';
    else if (query.status && isValidDocStatus(query.status)) where.status = query.status;
    if (query.mine === 'true' && user?.id) where.createdById = user.id;
    if (query.docNumber) where.transfer_no = { contains: query.docNumber, mode: 'insensitive' };
    if (query.dateFrom || query.dateTo) {
      where.createdAt = buildDateRangeWhere(query.dateFrom, query.dateTo);
    }
    return where;
  }

  async list(query: TransferListFilterDto, user?: RequestUser): Promise<PaginatedResult<unknown>> {
    const { skip, take } = this.prisma.getPaginationArgs(query.page, query.limit);
    const where = this.buildListWhere(query, user);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transferDoc.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, code: true, name: true } },
          _count: { select: { lines: true } },
        },
      }),
      this.prisma.transferDoc.count({ where }),
    ]);
    return { items, meta: buildMeta(total, query.page, query.limit) };
  }
```

- [ ] **Step 2: Add `getSummary()`**

Add to `src/modules/warehouse/transfer/transfer.service.ts`, directly after `list()`:

```ts
  async getSummary(query: TransferListFilterDto, user?: RequestUser) {
    const where = this.buildListWhere(query, user);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const [totalCount, statusGroups, mostRecentDoc, canceledCount, staleDraftCount] =
      await this.prisma.$transaction([
        this.prisma.transferDoc.count({ where }),
        this.prisma.transferDoc.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
        }),
        this.prisma.transferDoc.findFirst({
          where,
          orderBy: { createdAt: 'desc' },
          select: {
            transfer_no: true,
            createdAt: true,
            users: { select: { fullName: true } },
          },
        }),
        this.prisma.transferDoc.count({ where: { ...where, status: 'canceled' } }),
        this.prisma.transferDoc.count({
          where: { AND: [where, { status: 'draft', createdAt: { lt: threeDaysAgo } }] },
        }),
      ]);

    const statusBreakdown = statusGroups.map((group) => ({
      status: group.status,
      count: group._count._all,
      percentage: totalCount > 0 ? Math.round((group._count._all / totalCount) * 1000) / 10 : 0,
    }));

    return {
      totalCount,
      statusBreakdown,
      mostRecent: mostRecentDoc
        ? {
            docNo: mostRecentDoc.transfer_no,
            createdByName: mostRecentDoc.users?.fullName ?? null,
            createdAt: mostRecentDoc.createdAt.toISOString(),
          }
        : null,
      needsAttention: {
        count: canceledCount + staleDraftCount,
        canceledCount,
        staleDraftCount,
      },
    };
  }
```

- [ ] **Step 3: Write the failing test file**

Create `src/modules/warehouse/transfer/transfer.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import { TransferService } from './transfer.service';

describe('TransferService', () => {
  let service: TransferService;

  const mockPrismaService = {
    transferDoc: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      findFirst: jest.fn(),
    },
    getPaginationArgs: jest.fn().mockReturnValue({ skip: 0, take: 20 }),
    $transaction: jest.fn(),
  };

  mockPrismaService.$transaction.mockImplementation((arg: unknown) => {
    if (typeof arg === 'function') return arg(mockPrismaService);
    return Promise.all(arg as Promise<unknown>[]);
  });

  const mockStockService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StockService, useValue: mockStockService },
      ],
    }).compile();

    service = module.get<TransferService>(TransferService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list()', () => {
    it('filters by status and applies date range', async () => {
      mockPrismaService.transferDoc.findMany.mockResolvedValue([]);
      mockPrismaService.transferDoc.count.mockResolvedValue(0);

      await service.list({
        page: 1,
        limit: 20,
        status: 'posted',
        dateFrom: '2026-07-01T00:00:00.000Z',
      } as never);

      expect(mockPrismaService.transferDoc.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'posted',
            createdAt: { gte: new Date('2026-07-01T00:00:00.000Z') },
          }),
        }),
      );
    });
  });

  describe('getSummary()', () => {
    it('computes totals, status-breakdown percentages, most recent doc, and needs-attention counts', async () => {
      mockPrismaService.transferDoc.count = jest
        .fn()
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);
      mockPrismaService.transferDoc.groupBy = jest.fn().mockResolvedValue([
        { status: 'posted', _count: { _all: 1 } },
        { status: 'draft', _count: { _all: 2 } },
      ]);
      mockPrismaService.transferDoc.findFirst = jest.fn().mockResolvedValue({
        transfer_no: 'TRF-010',
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        users: { fullName: 'Jane Doe' },
      });

      const result = await service.getSummary({ page: 1, limit: 20 } as never);

      expect(result.totalCount).toBe(3);
      expect(result.statusBreakdown).toEqual([
        { status: 'posted', count: 1, percentage: 33.3 },
        { status: 'draft', count: 2, percentage: 66.7 },
      ]);
      expect(result.mostRecent).toEqual({
        docNo: 'TRF-010',
        createdByName: 'Jane Doe',
        createdAt: '2026-08-01T00:00:00.000Z',
      });
      expect(result.needsAttention).toEqual({
        count: 2,
        canceledCount: 1,
        staleDraftCount: 1,
      });
    });

    it('returns a null mostRecent and an empty breakdown when there are no matching documents', async () => {
      mockPrismaService.transferDoc.count = jest
        .fn()
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrismaService.transferDoc.groupBy = jest.fn().mockResolvedValue([]);
      mockPrismaService.transferDoc.findFirst = jest.fn().mockResolvedValue(null);

      const result = await service.getSummary({ page: 1, limit: 20 } as never);

      expect(result.totalCount).toBe(0);
      expect(result.statusBreakdown).toEqual([]);
      expect(result.mostRecent).toBeNull();
      expect(result.needsAttention).toEqual({
        count: 0,
        canceledCount: 0,
        staleDraftCount: 0,
      });
    });
  });
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/modules/warehouse/transfer/transfer.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Add the controller route**

In `src/modules/warehouse/transfer/transfer.controller.ts`, add directly BEFORE the existing `@Get(':id')` method:

```ts
  @Get('summary')
  @ApiBearerAuthProtected()
  @ApiOperation({
    summary: 'Get transfer summary',
    description:
      'Aggregate totals, status breakdown, most recent document, and needs-attention counts across the full filtered result set (not paginated). Accepts the same filters as GET /transfer.',
  })
  @ApiStandardOkResponse('Transfer summary')
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async getSummary(
    @Query() query: TransferListFilterDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ApiResponse<unknown>> {
    const summary = await this.transferService.getSummary(query, user);
    return successResponse(summary, 'Transfer summary');
  }

```

- [ ] **Step 6: Type-check and run the full transfer test suite**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new type errors.

Run: `npx jest src/modules/warehouse/transfer`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/modules/warehouse/transfer/transfer.service.ts src/modules/warehouse/transfer/transfer.controller.ts src/modules/warehouse/transfer/transfer.service.spec.ts
git commit -m "feat(transfer): add GET /transfer/summary aggregate endpoint"
```

---

### Task 5: Returns — `buildListWhere` extraction + `getSummary()` + `GET /returns/summary` (+ new spec file)

**Files:**

- Modify: `src/modules/warehouse/returns/returns.service.ts`
- Modify: `src/modules/warehouse/returns/returns.controller.ts`
- Create: `src/modules/warehouse/returns/returns.service.spec.ts`

**Interfaces:**

- Consumes: the response shape from Task 1.
- Produces: `ReturnsService.getSummary(query: ReturnListFilterDto, user?: RequestUser)`, `ReturnsController.getSummary` at `GET /returns/summary`.

- [ ] **Step 1: Extract `buildListWhere` and refactor `list()`**

In `src/modules/warehouse/returns/returns.service.ts`, replace the body of `list()` with:

```ts
  private buildListWhere(
    query: ReturnListFilterDto,
    user?: RequestUser,
  ): {
    companyId?: string;
    status?: DocStatus;
    createdById?: string;
    return_no?: { contains: string; mode: 'insensitive' };
    createdAt?: { gte?: Date; lte?: Date };
  } {
    const where: {
      companyId?: string;
      status?: DocStatus;
      createdById?: string;
      return_no?: { contains: string; mode: 'insensitive' };
      createdAt?: { gte?: Date; lte?: Date };
    } = {};
    if (query.companyId) where.companyId = query.companyId;
    if (query.postedOnly === 'true') where.status = 'posted';
    else if (query.status && isValidDocStatus(query.status)) where.status = query.status;
    if (query.mine === 'true' && user?.id) where.createdById = user.id;
    if (query.docNumber) where.return_no = { contains: query.docNumber, mode: 'insensitive' };
    if (query.dateFrom || query.dateTo) {
      where.createdAt = buildDateRangeWhere(query.dateFrom, query.dateTo);
    }
    return where;
  }

  async list(query: ReturnListFilterDto, user?: RequestUser): Promise<PaginatedResult<unknown>> {
    const { skip, take } = this.prisma.getPaginationArgs(query.page, query.limit);
    const where = this.buildListWhere(query, user);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.returnDoc.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, code: true, name: true } },
          customer: { select: { id: true, name: true } },
          _count: { select: { lines: true } },
        },
      }),
      this.prisma.returnDoc.count({ where }),
    ]);
    return { items, meta: buildMeta(total, query.page, query.limit) };
  }
```

- [ ] **Step 2: Add `getSummary()`**

Add to `src/modules/warehouse/returns/returns.service.ts`, directly after `list()`:

```ts
  async getSummary(query: ReturnListFilterDto, user?: RequestUser) {
    const where = this.buildListWhere(query, user);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const [totalCount, statusGroups, mostRecentDoc, canceledCount, staleDraftCount] =
      await this.prisma.$transaction([
        this.prisma.returnDoc.count({ where }),
        this.prisma.returnDoc.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
        }),
        this.prisma.returnDoc.findFirst({
          where,
          orderBy: { createdAt: 'desc' },
          select: {
            return_no: true,
            createdAt: true,
            users: { select: { fullName: true } },
          },
        }),
        this.prisma.returnDoc.count({ where: { ...where, status: 'canceled' } }),
        this.prisma.returnDoc.count({
          where: { AND: [where, { status: 'draft', createdAt: { lt: threeDaysAgo } }] },
        }),
      ]);

    const statusBreakdown = statusGroups.map((group) => ({
      status: group.status,
      count: group._count._all,
      percentage: totalCount > 0 ? Math.round((group._count._all / totalCount) * 1000) / 10 : 0,
    }));

    return {
      totalCount,
      statusBreakdown,
      mostRecent: mostRecentDoc
        ? {
            docNo: mostRecentDoc.return_no,
            createdByName: mostRecentDoc.users?.fullName ?? null,
            createdAt: mostRecentDoc.createdAt.toISOString(),
          }
        : null,
      needsAttention: {
        count: canceledCount + staleDraftCount,
        canceledCount,
        staleDraftCount,
      },
    };
  }
```

- [ ] **Step 3: Write the failing test file**

Create `src/modules/warehouse/returns/returns.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import { ReturnsService } from './returns.service';

describe('ReturnsService', () => {
  let service: ReturnsService;

  const mockPrismaService = {
    returnDoc: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      findFirst: jest.fn(),
    },
    getPaginationArgs: jest.fn().mockReturnValue({ skip: 0, take: 20 }),
    $transaction: jest.fn(),
  };

  mockPrismaService.$transaction.mockImplementation((arg: unknown) => {
    if (typeof arg === 'function') return arg(mockPrismaService);
    return Promise.all(arg as Promise<unknown>[]);
  });

  const mockStockService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReturnsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StockService, useValue: mockStockService },
      ],
    }).compile();

    service = module.get<ReturnsService>(ReturnsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list()', () => {
    it('filters by status and applies date range', async () => {
      mockPrismaService.returnDoc.findMany.mockResolvedValue([]);
      mockPrismaService.returnDoc.count.mockResolvedValue(0);

      await service.list({
        page: 1,
        limit: 20,
        status: 'posted',
        dateFrom: '2026-07-01T00:00:00.000Z',
      } as never);

      expect(mockPrismaService.returnDoc.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'posted',
            createdAt: { gte: new Date('2026-07-01T00:00:00.000Z') },
          }),
        }),
      );
    });
  });

  describe('getSummary()', () => {
    it('computes totals, status-breakdown percentages, most recent doc, and needs-attention counts', async () => {
      mockPrismaService.returnDoc.count = jest
        .fn()
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);
      mockPrismaService.returnDoc.groupBy = jest.fn().mockResolvedValue([
        { status: 'posted', _count: { _all: 1 } },
        { status: 'draft', _count: { _all: 2 } },
      ]);
      mockPrismaService.returnDoc.findFirst = jest.fn().mockResolvedValue({
        return_no: 'RET-010',
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        users: { fullName: 'Jane Doe' },
      });

      const result = await service.getSummary({ page: 1, limit: 20 } as never);

      expect(result.totalCount).toBe(3);
      expect(result.statusBreakdown).toEqual([
        { status: 'posted', count: 1, percentage: 33.3 },
        { status: 'draft', count: 2, percentage: 66.7 },
      ]);
      expect(result.mostRecent).toEqual({
        docNo: 'RET-010',
        createdByName: 'Jane Doe',
        createdAt: '2026-08-01T00:00:00.000Z',
      });
      expect(result.needsAttention).toEqual({
        count: 2,
        canceledCount: 1,
        staleDraftCount: 1,
      });
    });

    it('returns a null mostRecent and an empty breakdown when there are no matching documents', async () => {
      mockPrismaService.returnDoc.count = jest
        .fn()
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrismaService.returnDoc.groupBy = jest.fn().mockResolvedValue([]);
      mockPrismaService.returnDoc.findFirst = jest.fn().mockResolvedValue(null);

      const result = await service.getSummary({ page: 1, limit: 20 } as never);

      expect(result.totalCount).toBe(0);
      expect(result.statusBreakdown).toEqual([]);
      expect(result.mostRecent).toBeNull();
      expect(result.needsAttention).toEqual({
        count: 0,
        canceledCount: 0,
        staleDraftCount: 0,
      });
    });
  });
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/modules/warehouse/returns/returns.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Add the controller route**

In `src/modules/warehouse/returns/returns.controller.ts`, add directly BEFORE the existing `@Get(':id')` method:

```ts
  @Get('summary')
  @ApiBearerAuthProtected()
  @ApiOperation({
    summary: 'Get returns summary',
    description:
      'Aggregate totals, status breakdown, most recent document, and needs-attention counts across the full filtered result set (not paginated). Accepts the same filters as GET /returns.',
  })
  @ApiStandardOkResponse('Return summary')
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async getSummary(
    @Query() query: ReturnListFilterDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ApiResponse<unknown>> {
    const summary = await this.returnsService.getSummary(query, user);
    return successResponse(summary, 'Return summary');
  }

```

- [ ] **Step 6: Type-check and run the full returns test suite**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new type errors.

Run: `npx jest src/modules/warehouse/returns`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/modules/warehouse/returns/returns.service.ts src/modules/warehouse/returns/returns.controller.ts src/modules/warehouse/returns/returns.service.spec.ts
git commit -m "feat(returns): add GET /returns/summary aggregate endpoint"
```

---

### Task 6: Putaway — `buildListWhere` extraction + `getSummary()` + `GET /putaway/summary`

**Files:**

- Modify: `src/modules/warehouse/putaway/putaway.service.ts`
- Modify: `src/modules/warehouse/putaway/putaway.controller.ts`
- Modify: `src/modules/warehouse/putaway/putaway.service.spec.ts`

**Interfaces:**

- Consumes: the response shape from Task 1.
- Produces: `PutawayService.getSummary(query: PutawayListFilterDto, user?: RequestUser)`, `PutawayController.getSummary` at `GET /putaway/summary`.

Note: putaway is the one module with a 4th status (`done`) — it needs no special handling in `getSummary()`, since `needsAttention` only ever checks `canceled`/`draft` and `groupBy` naturally reports `done` as its own bucket. Putaway also uses `docDate` (not `createdAt`) as its date field, matching what its own `list()` already uses for date-range filtering.

- [ ] **Step 1: Extract `buildListWhere` and refactor `list()`**

In `src/modules/warehouse/putaway/putaway.service.ts`, replace the body of `list()` with:

```ts
  private buildListWhere(
    query: PutawayListFilterDto,
    user?: RequestUser,
  ): Prisma.PutawayDocWhereInput {
    const where: Prisma.PutawayDocWhereInput = {};

    if (query.companyId) where.companyId = query.companyId;
    if (query.warehouseId) where.warehouse_id = query.warehouseId;
    if (query.postedOnly === 'true') where.status = 'posted';
    else if (query.status) where.status = query.status as PutawayStatus;
    if (query.mine === 'true' && user?.id) where.createdById = user.id;
    const searchTerm = query.docNumber ?? query.search?.trim();
    if (searchTerm) {
      where.docNumber = { contains: searchTerm, mode: 'insensitive' };
    }
    if (query.dateFrom || query.dateTo) {
      where.docDate = buildDateRangeWhere(query.dateFrom, query.dateTo);
    }

    return where;
  }

  async list(query: PutawayListFilterDto, user?: RequestUser): Promise<PaginatedResult<unknown>> {
    const { skip, take } = this.prisma.getPaginationArgs(query.page, query.limit);
    const where = this.buildListWhere(query, user);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.putawayDoc.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, code: true, name: true } },
          warehouses: { select: { id: true, code: true, name: true } },
          users: { select: { id: true, fullName: true } },
          _count: { select: { lines: true } },
        },
      }),
      this.prisma.putawayDoc.count({ where }),
    ]);

    return {
      items: items.map((item) => ({ ...item, warehouse: item.warehouses, createdBy: item.users })),
      meta: buildMeta(total, query.page, query.limit),
    };
  }
```

- [ ] **Step 2: Run existing tests to confirm the refactor is behavior-preserving**

Run: `npx jest src/modules/warehouse/putaway/putaway.service.spec.ts`
Expected: PASS (all pre-existing tests).

- [ ] **Step 3: Write the failing test for `getSummary()`**

Add to `src/modules/warehouse/putaway/putaway.service.spec.ts` (add `groupBy: jest.fn(), findFirst: jest.fn()` to the `putawayDoc` mock object alongside its existing `findMany`/`count`):

```ts
  describe('getSummary()', () => {
    it('computes totals, status-breakdown percentages, most recent doc, and needs-attention counts', async () => {
      mockPrismaService.putawayDoc.count = jest
        .fn()
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);
      mockPrismaService.putawayDoc.groupBy = jest.fn().mockResolvedValue([
        { status: 'posted', _count: { _all: 1 } },
        { status: 'draft', _count: { _all: 2 } },
      ]);
      mockPrismaService.putawayDoc.findFirst = jest.fn().mockResolvedValue({
        docNumber: 'PUT-010',
        docDate: new Date('2026-08-01T00:00:00.000Z'),
        users: { fullName: 'Jane Doe' },
      });

      const result = await service.getSummary({ page: 1, limit: 20 } as never);

      expect(result.totalCount).toBe(3);
      expect(result.statusBreakdown).toEqual([
        { status: 'posted', count: 1, percentage: 33.3 },
        { status: 'draft', count: 2, percentage: 66.7 },
      ]);
      expect(result.mostRecent).toEqual({
        docNo: 'PUT-010',
        createdByName: 'Jane Doe',
        createdAt: '2026-08-01T00:00:00.000Z',
      });
      expect(result.needsAttention).toEqual({
        count: 2,
        canceledCount: 1,
        staleDraftCount: 1,
      });
    });

    it('returns a null mostRecent and an empty breakdown when there are no matching documents', async () => {
      mockPrismaService.putawayDoc.count = jest
        .fn()
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrismaService.putawayDoc.groupBy = jest.fn().mockResolvedValue([]);
      mockPrismaService.putawayDoc.findFirst = jest.fn().mockResolvedValue(null);

      const result = await service.getSummary({ page: 1, limit: 20 } as never);

      expect(result.totalCount).toBe(0);
      expect(result.statusBreakdown).toEqual([]);
      expect(result.mostRecent).toBeNull();
      expect(result.needsAttention).toEqual({
        count: 0,
        canceledCount: 0,
        staleDraftCount: 0,
      });
    });

    it('correctly buckets the done status without treating it as needing attention', async () => {
      mockPrismaService.putawayDoc.count = jest
        .fn()
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrismaService.putawayDoc.groupBy = jest
        .fn()
        .mockResolvedValue([{ status: 'done', _count: { _all: 1 } }]);
      mockPrismaService.putawayDoc.findFirst = jest.fn().mockResolvedValue(null);

      const result = await service.getSummary({ page: 1, limit: 20 } as never);

      expect(result.statusBreakdown).toEqual([{ status: 'done', count: 1, percentage: 100 }]);
      expect(result.needsAttention).toEqual({
        count: 0,
        canceledCount: 0,
        staleDraftCount: 0,
      });
    });
  });
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx jest src/modules/warehouse/putaway/putaway.service.spec.ts -t "getSummary"`
Expected: FAIL — `service.getSummary is not a function`.

- [ ] **Step 5: Implement `getSummary()`**

Add to `src/modules/warehouse/putaway/putaway.service.ts`, directly after `list()`:

```ts
  async getSummary(query: PutawayListFilterDto, user?: RequestUser) {
    const where = this.buildListWhere(query, user);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const [totalCount, statusGroups, mostRecentDoc, canceledCount, staleDraftCount] =
      await this.prisma.$transaction([
        this.prisma.putawayDoc.count({ where }),
        this.prisma.putawayDoc.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
        }),
        this.prisma.putawayDoc.findFirst({
          where,
          orderBy: { docDate: 'desc' },
          select: { docNumber: true, docDate: true, users: { select: { fullName: true } } },
        }),
        this.prisma.putawayDoc.count({ where: { ...where, status: 'canceled' } }),
        this.prisma.putawayDoc.count({
          where: { AND: [where, { status: 'draft', docDate: { lt: threeDaysAgo } }] },
        }),
      ]);

    const statusBreakdown = statusGroups.map((group) => ({
      status: group.status,
      count: group._count._all,
      percentage: totalCount > 0 ? Math.round((group._count._all / totalCount) * 1000) / 10 : 0,
    }));

    return {
      totalCount,
      statusBreakdown,
      mostRecent: mostRecentDoc
        ? {
            docNo: mostRecentDoc.docNumber,
            createdByName: mostRecentDoc.users?.fullName ?? null,
            createdAt: mostRecentDoc.docDate.toISOString(),
          }
        : null,
      needsAttention: {
        count: canceledCount + staleDraftCount,
        canceledCount,
        staleDraftCount,
      },
    };
  }
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx jest src/modules/warehouse/putaway/putaway.service.spec.ts`
Expected: PASS.

- [ ] **Step 7: Add the controller route**

In `src/modules/warehouse/putaway/putaway.controller.ts`, add directly BEFORE the existing `@Get(':id')` method:

```ts
  @Get('summary')
  @ApiBearerAuthProtected()
  @ApiOperation({
    summary: 'Get putaway summary',
    description:
      'Aggregate totals, status breakdown, most recent document, and needs-attention counts across the full filtered result set (not paginated). Accepts the same filters as GET /putaway.',
  })
  @ApiStandardOkResponse('Putaway summary')
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async getSummary(
    @Query() query: PutawayListFilterDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ApiResponse<unknown>> {
    const summary = await this.putawayService.getSummary(query, user);
    return successResponse(summary, 'Putaway summary');
  }

```

- [ ] **Step 8: Type-check and run the full putaway test suite**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new type errors.

Run: `npx jest src/modules/warehouse/putaway`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/modules/warehouse/putaway/putaway.service.ts src/modules/warehouse/putaway/putaway.controller.ts src/modules/warehouse/putaway/putaway.service.spec.ts
git commit -m "feat(putaway): add GET /putaway/summary aggregate endpoint"
```

---

### Task 7: Register — `buildListWhere` extraction + `getSummary()` + `GET /register/summary`

**Files:**

- Modify: `src/modules/warehouse/register/register.service.ts`
- Modify: `src/modules/warehouse/register/register.controller.ts`
- Modify: `src/modules/warehouse/register/register.service.spec.ts`

**Interfaces:**

- Consumes: the response shape from Task 1.
- Produces: `RegisterService.getSummary(query: RegisterListFilterDto, user?: RequestUser)`, `RegisterController.getSummary` at `GET /register/summary`.

Note: register is the ONE module whose creator relation is named `createdBy`, not `users` (confirmed via `prisma/schema.prisma`: `createdBy User? @relation("RegisterDocCreatedBy", fields: [createdById], ...)`). Also note register uses `docDate` (not `createdAt`) as its date field, matching its own `list()`.

- [ ] **Step 1: Extract `buildListWhere` and refactor `list()`**

In `src/modules/warehouse/register/register.service.ts`, replace the body of `list()` with:

```ts
  private buildListWhere(
    query: RegisterListFilterDto,
    user?: RequestUser,
  ): Prisma.RegisterDocWhereInput {
    const where: Prisma.RegisterDocWhereInput = {};
    if (query.companyId) where.companyId = query.companyId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.locationId) where.locationId = query.locationId;
    if (query.postedOnly === 'true') where.status = 'posted';
    else if (query.status && isValidDocStatus(query.status)) where.status = query.status;
    const searchTerm = query.docNumber ?? query.search?.trim();
    if (searchTerm) where.docNumber = { contains: searchTerm, mode: 'insensitive' };
    if (query.mine === 'true' && user?.id) where.registeredById = user.id;
    else if (query.registeredById) where.registeredById = query.registeredById;
    if (query.dateFrom || query.dateTo) {
      where.docDate = buildDateRangeWhere(query.dateFrom, query.dateTo);
    }

    return where;
  }

  async list(query: RegisterListFilterDto, user?: RequestUser): Promise<PaginatedResult<unknown>> {
    const { skip, take } = this.prisma.getPaginationArgs(query.page, query.limit);
    const where = this.buildListWhere(query, user);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.registerDoc.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: REGISTER_DOC_INCLUDE,
      }),
      this.prisma.registerDoc.count({ where }),
    ]);

    return { items, meta: buildMeta(total, query.page, query.limit) };
  }
```

- [ ] **Step 2: Run existing tests to confirm the refactor is behavior-preserving**

Run: `npx jest src/modules/warehouse/register/register.service.spec.ts`
Expected: PASS (all pre-existing tests).

- [ ] **Step 3: Write the failing test for `getSummary()`**

Add to `src/modules/warehouse/register/register.service.spec.ts` (add `groupBy: jest.fn(), findFirst: jest.fn()` to the `registerDoc` mock object in the `prisma` variable's type and its `beforeEach` initialization, alongside its existing `findMany`/`count`):

```ts
  describe('getSummary()', () => {
    it('computes totals, status-breakdown percentages, most recent doc, and needs-attention counts', async () => {
      prisma.registerDoc.count = jest
        .fn()
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);
      prisma.registerDoc.groupBy = jest.fn().mockResolvedValue([
        { status: 'posted', _count: { _all: 1 } },
        { status: 'draft', _count: { _all: 2 } },
      ]);
      prisma.registerDoc.findFirst = jest.fn().mockResolvedValue({
        docNumber: 'REG-010',
        docDate: new Date('2026-08-01T00:00:00.000Z'),
        createdBy: { fullName: 'Jane Doe' },
      });

      const result = await service.getSummary({ page: 1, limit: 20 } as never);

      expect(result.totalCount).toBe(3);
      expect(result.statusBreakdown).toEqual([
        { status: 'posted', count: 1, percentage: 33.3 },
        { status: 'draft', count: 2, percentage: 66.7 },
      ]);
      expect(result.mostRecent).toEqual({
        docNo: 'REG-010',
        createdByName: 'Jane Doe',
        createdAt: '2026-08-01T00:00:00.000Z',
      });
      expect(result.needsAttention).toEqual({
        count: 2,
        canceledCount: 1,
        staleDraftCount: 1,
      });
    });

    it('returns a null mostRecent and an empty breakdown when there are no matching documents', async () => {
      prisma.registerDoc.count = jest
        .fn()
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.registerDoc.groupBy = jest.fn().mockResolvedValue([]);
      prisma.registerDoc.findFirst = jest.fn().mockResolvedValue(null);

      const result = await service.getSummary({ page: 1, limit: 20 } as never);

      expect(result.totalCount).toBe(0);
      expect(result.statusBreakdown).toEqual([]);
      expect(result.mostRecent).toBeNull();
      expect(result.needsAttention).toEqual({
        count: 0,
        canceledCount: 0,
        staleDraftCount: 0,
      });
    });
  });
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx jest src/modules/warehouse/register/register.service.spec.ts -t "getSummary"`
Expected: FAIL — `service.getSummary is not a function`.

- [ ] **Step 5: Implement `getSummary()`**

Add to `src/modules/warehouse/register/register.service.ts`, directly after `list()`:

```ts
  async getSummary(query: RegisterListFilterDto, user?: RequestUser) {
    const where = this.buildListWhere(query, user);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const [totalCount, statusGroups, mostRecentDoc, canceledCount, staleDraftCount] =
      await this.prisma.$transaction([
        this.prisma.registerDoc.count({ where }),
        this.prisma.registerDoc.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
        }),
        this.prisma.registerDoc.findFirst({
          where,
          orderBy: { docDate: 'desc' },
          select: {
            docNumber: true,
            docDate: true,
            createdBy: { select: { fullName: true } },
          },
        }),
        this.prisma.registerDoc.count({ where: { ...where, status: 'canceled' } }),
        this.prisma.registerDoc.count({
          where: { AND: [where, { status: 'draft', docDate: { lt: threeDaysAgo } }] },
        }),
      ]);

    const statusBreakdown = statusGroups.map((group) => ({
      status: group.status,
      count: group._count._all,
      percentage: totalCount > 0 ? Math.round((group._count._all / totalCount) * 1000) / 10 : 0,
    }));

    return {
      totalCount,
      statusBreakdown,
      mostRecent: mostRecentDoc
        ? {
            docNo: mostRecentDoc.docNumber,
            createdByName: mostRecentDoc.createdBy?.fullName ?? null,
            createdAt: mostRecentDoc.docDate.toISOString(),
          }
        : null,
      needsAttention: {
        count: canceledCount + staleDraftCount,
        canceledCount,
        staleDraftCount,
      },
    };
  }
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx jest src/modules/warehouse/register/register.service.spec.ts`
Expected: PASS.

- [ ] **Step 7: Add the controller route**

In `src/modules/warehouse/register/register.controller.ts`, add directly BEFORE the existing `@Get(':id')` method:

```ts
  @Get('summary')
  @ApiBearerAuthProtected()
  @ApiOperation({
    summary: 'Get register summary',
    description:
      'Aggregate totals, status breakdown, most recent document, and needs-attention counts across the full filtered result set (not paginated). Accepts the same filters as GET /register.',
  })
  @ApiStandardOkResponse('Register summary')
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async getSummary(
    @Query() query: RegisterListFilterDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ApiResponse<unknown>> {
    const summary = await this.registerService.getSummary(query, user);
    return successResponse(summary, 'Register summary');
  }

```

- [ ] **Step 8: Type-check and run the full register test suite**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new type errors.

Run: `npx jest src/modules/warehouse/register`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/modules/warehouse/register/register.service.ts src/modules/warehouse/register/register.controller.ts src/modules/warehouse/register/register.service.spec.ts
git commit -m "feat(register): add GET /register/summary aggregate endpoint"
```

---

### Task 8 (Warehouse): Add `TransactionSummaryResponse` types

**Files:**

- Modify: `src/views/transactions/types.ts`

**Interfaces:**

- Produces: `TransactionSummaryStatusCount`, `TransactionSummaryMostRecent`, `TransactionSummaryNeedsAttention`, `TransactionSummaryResponse` — consumed by Tasks 9–11.

- [ ] **Step 1: Add the types**

The current full content of `src/views/transactions/types.ts` is:

```ts
export interface TransactionRecord {
    id?: string;
    docNo?: string;
    status?: string;
    companyId?: string;
    warehouseId?: string;
    [key: string]: string | number | boolean | null | undefined;
}
```

Replace it with:

```ts
export interface TransactionRecord {
    id?: string;
    docNo?: string;
    status?: string;
    companyId?: string;
    warehouseId?: string;
    [key: string]: string | number | boolean | null | undefined;
}

export interface TransactionSummaryStatusCount {
    status: string;
    count: number;
    percentage: number;
}

export interface TransactionSummaryMostRecent {
    docNo: string;
    createdByName: string | null;
    createdAt: string;
}

export interface TransactionSummaryNeedsAttention {
    count: number;
    canceledCount: number;
    staleDraftCount: number;
}

export interface TransactionSummaryResponse {
    totalCount: number;
    statusBreakdown: TransactionSummaryStatusCount[];
    mostRecent: TransactionSummaryMostRecent | null;
    needsAttention: TransactionSummaryNeedsAttention;
}
```

- [ ] **Step 2: Type-check**

Run: `npx vue-tsc --noEmit`
Expected: no new type errors (this file has no runtime behavior to test — it's type-only).

- [ ] **Step 3: Commit**

```bash
git add src/views/transactions/types.ts
git commit -m "feat: add TransactionSummaryResponse types for backend-backed summary"
```

---

### Task 9 (Warehouse): `transactions.api.ts` + `transactions.service.ts` — add `summary()`

**Files:**

- Modify: `src/api/feature/transactions.api.ts`
- Modify: `src/services/transactions.service.ts`
- Test: `src/services/transactions.service.test.ts`

**Interfaces:**

- Consumes: `TransactionSummaryResponse` from Task 8.
- Produces: `transactionsApi.summary(key, params)`, `transactionService.summary(key, params): Promise<TransactionSummaryResponse>` — consumed by Task 10.

- [ ] **Step 1: Add `summary()` to `transactions.api.ts`**

The current full content of `src/api/feature/transactions.api.ts` is:

```ts
import { apiRequest } from "@/lib/api/client";
import type { ReportParams } from "./dto/report.dto";
import type { TransactionRecord } from "@/views/transactions/types";
import type { TransactionKey } from "@/services/transactions.service";
import { transactionPaths } from "@/services/transactions.service";

// Note: the backend exposes PATCH {path}/:id for inbound/outbound/relocation/
// transfer/returns/putaway (register has no PATCH at all), but there is
// intentionally no `update`/`patch` method here — draft-stage documents are
// corrected by cancel-and-recreate, not in-place editing. This module only
// implements list/get/create/post/cancel/complete.
export const transactionsApi = {
    list(key: TransactionKey, params: ReportParams = {}) {
        const path = transactionPaths[key];
        return apiRequest<{ items?: TransactionRecord[] }>({
            url: path,
            method: "get",
            params: {
                page: params.page ?? 1,
                limit: params.limit ?? 20,
                ...params,
            },
        });
    },

    get(key: TransactionKey, id: string) {
        const path = transactionPaths[key];
        return apiRequest<TransactionRecord>({
            url: `${path}/${id}`,
            method: "get",
        });
    },

    create(key: TransactionKey, payload: Record<string, unknown>) {
        const path = transactionPaths[key];
        return apiRequest<TransactionRecord>({
            url: path,
            method: "post",
            data: payload,
        });
    },

    post(key: TransactionKey, id: string, payload?: Record<string, unknown>) {
        const path = transactionPaths[key];
        return apiRequest({
            url: `${path}/${id}/post`,
            method: "post",
            data: payload,
        });
    },

    cancel(key: TransactionKey, id: string) {
        const path = transactionPaths[key];
        return apiRequest({
            url: `${path}/${id}/cancel`,
            method: "post",
        });
    },

    complete(key: TransactionKey, id: string) {
        const path = transactionPaths[key];
        return apiRequest({
            url: `${path}/${id}/complete`,
            method: "post",
        });
    },
};
```

Add a `summary` method to the `transactionsApi` object, directly after `list()`:

```ts
    summary(key: TransactionKey, params: ReportParams = {}) {
        const path = transactionPaths[key];
        return apiRequest<import("@/views/transactions/types").TransactionSummaryResponse>({
            url: `${path}/summary`,
            method: "get",
            params,
        });
    },
```

- [ ] **Step 2: Add `summary()` to `transactions.service.ts`**

In `src/services/transactions.service.ts`, add `TransactionSummaryResponse` to the existing type-only import from `@/views/transactions/types` (currently `import type { TransactionRecord } from "@/views/transactions/types";` — change to `import type { TransactionRecord, TransactionSummaryResponse } from "@/views/transactions/types";`), then add a `summary` method to the `transactionService` object, directly after `list()`:

```ts
    async summary(
        key: TransactionKey,
        params: ReportParams = {},
    ): Promise<TransactionSummaryResponse> {
        const response = await transactionsApi.summary(key, params);
        return response.data as TransactionSummaryResponse;
    },
```

- [ ] **Step 3: Write the failing test**

The current full content of `src/services/transactions.service.test.ts` mocks `@/api/feature/transactions.api` via a `vi.mock` factory with `vi.hoisted` spies (NOT `vi.spyOn` on the real module — the module is fully replaced):

```ts
import { describe, expect, it, vi } from "vitest";

const getSpy = vi.hoisted(() => vi.fn());
const postSpy = vi.hoisted(() => vi.fn());

vi.mock("@/api/feature/transactions.api", () => ({
    transactionsApi: {
        list: vi.fn(),
        get: getSpy,
        create: vi.fn(),
        post: postSpy,
        cancel: vi.fn(),
    },
}));

describe("transactions.service", () => {
    // ... existing tests using getSpy/postSpy
});
```

Add a `summarySpy` following this exact same pattern: add `const summarySpy = vi.hoisted(() => vi.fn());` alongside the existing `getSpy`/`postSpy` hoisted declarations, add `summary: summarySpy` to the `vi.mock` factory's `transactionsApi` object, then add this test inside the existing `describe("transactions.service", ...)` block:

```ts
    it("returns the summary response data unwrapped", async () => {
        const mockSummary = {
            totalCount: 5,
            statusBreakdown: [{ status: "posted", count: 5, percentage: 100 }],
            mostRecent: {
                docNo: "IN-001",
                createdByName: "Jane Doe",
                createdAt: "2026-08-01T00:00:00.000Z",
            },
            needsAttention: { count: 0, canceledCount: 0, staleDraftCount: 0 },
        };
        summarySpy.mockResolvedValue({
            success: true,
            message: "Inbound summary",
            data: mockSummary,
        });

        const { transactionService } = await import("./transactions.service");
        const result = await transactionService.summary("inbound", {
            page: 1,
            limit: 20,
        });

        expect(result).toEqual(mockSummary);
        expect(summarySpy).toHaveBeenCalledWith("inbound", { page: 1, limit: 20 });
    });
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run src/services/transactions.service.test.ts`
Expected: FAIL — `transactionService.summary is not a function`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/services/transactions.service.test.ts`
Expected: PASS (all tests in the file, including the pre-existing ones and the new one).

- [ ] **Step 6: Type-check**

Run: `npx vue-tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 7: Commit**

```bash
git add src/api/feature/transactions.api.ts src/services/transactions.service.ts src/services/transactions.service.test.ts
git commit -m "feat: add transactionService.summary for the backend-backed summary endpoint"
```

---

### Task 10 (Warehouse): Wire summary fetch into `useTransactionList.ts`; delete old `useTransactionSummary.ts`

**Files:**

- Modify: `src/views/transactions/composables/useTransactionList.ts`
- Delete: `src/views/transactions/composables/useTransactionSummary.ts`
- Delete: `src/views/transactions/composables/useTransactionSummary.test.ts`
- Modify: `src/views/transactions/composables/useTransactionList.test.ts`

**Interfaces:**

- Consumes: `transactionService.summary` from Task 9, `TransactionSummaryResponse` from Task 8.
- Produces: `useTransactionList(...)` return object gains `summary: Ref<TransactionSummaryResponse | null>`, `summaryLoading: Ref<boolean>`, `summaryError: Ref<string | null>` — consumed by Task 12. The `rows` return value (added in the v1 plan) stays, since `tableRows`/`displayRows` still derive from it — only the summary derivation is removed, not `rows` itself.

- [ ] **Step 1: Delete the old composable and its test**

```bash
rm src/views/transactions/composables/useTransactionSummary.ts
rm src/views/transactions/composables/useTransactionSummary.test.ts
```

- [ ] **Step 2: Write the failing tests**

Add these tests to `src/views/transactions/composables/useTransactionList.test.ts`, inside the existing `describe("useTransactionList", ...)` block (this file already mocks `@/services/transactions.service` with a factory that spreads `actual` and overrides `transactionService.list` — extend that same mock factory to also provide a `summary` mock, e.g. `summary: vi.fn().mockResolvedValue({ totalCount: 0, statusBreakdown: [], mostRecent: null, needsAttention: { count: 0, canceledCount: 0, staleDraftCount: 0 } })`):

```ts
    it("fetches the summary alongside the table rows on mount", async () => {
        const { transactionService } = await import(
            "@/services/transactions.service"
        );
        const mockSummary = {
            totalCount: 2,
            statusBreakdown: [{ status: "posted", count: 2, percentage: 100 }],
            mostRecent: null,
            needsAttention: { count: 0, canceledCount: 0, staleDraftCount: 0 },
        };
        vi.mocked(transactionService.summary).mockResolvedValueOnce(mockSummary);

        const { useTransactionList } = await import("./useTransactionList");
        const list = useTransactionList({ transactionKey: "relocation" });

        const flushPromises = () =>
            new Promise((resolve) => setTimeout(resolve, 0));
        await flushPromises();

        expect(list.summary.value).toEqual(mockSummary);
        expect(transactionService.summary).toHaveBeenCalledWith(
            "relocation",
            expect.objectContaining({ page: 1, limit: 20 }),
        );
    });

    it("isolates a summary fetch failure from the table's own rows/error state", async () => {
        const { transactionService } = await import(
            "@/services/transactions.service"
        );
        vi.mocked(transactionService.summary).mockRejectedValueOnce(
            new Error("Summary down"),
        );
        vi.mocked(transactionService.list).mockResolvedValueOnce({
            items: [{ id: "1", status: "posted" }],
            meta: { page: 1, limit: 20, total: 1 },
        });

        const { useTransactionList } = await import("./useTransactionList");
        const list = useTransactionList({ transactionKey: "relocation" });

        const flushPromises = () =>
            new Promise((resolve) => setTimeout(resolve, 0));
        await flushPromises();

        expect(list.summaryError.value).toBe("Summary down");
        expect(list.error.value).toBeNull();
        expect(list.rows.value).toHaveLength(1);
    });

    it("does not refetch the summary on a page-only change", async () => {
        const { transactionService } = await import(
            "@/services/transactions.service"
        );

        const { useTransactionList } = await import("./useTransactionList");
        const list = useTransactionList({ transactionKey: "relocation" });

        const flushPromises = () =>
            new Promise((resolve) => setTimeout(resolve, 0));
        await flushPromises();
        vi.mocked(transactionService.summary).mockClear();

        list.pagination.page = 2;
        await flushPromises();

        expect(transactionService.summary).not.toHaveBeenCalled();
    });
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run src/views/transactions/composables/useTransactionList.test.ts`
Expected: FAIL — `transactionService.summary` mock is undefined / `list.summary` is undefined.

- [ ] **Step 4: Implement the wiring**

In `src/views/transactions/composables/useTransactionList.ts`:

Add `TransactionSummaryResponse` to the existing type-only import from `../types` (currently `import type { TransactionRecord } from "../types";` — change to `import type { TransactionRecord, TransactionSummaryResponse } from "../types";`).

Add these three refs directly after the existing `const rows = ref<TransactionRecord[]>([]);` (line 100):

```ts
    const summary = ref<TransactionSummaryResponse | null>(null);
    const summaryLoading = ref(false);
    const summaryError = ref<string | null>(null);
```

Add a `loadSummary` function directly after the existing `loadRows` function:

```ts
    const loadSummary = async () => {
        summaryLoading.value = true;
        summaryError.value = null;
        try {
            const params = buildParams();
            summary.value = await transactionService.summary(
                transactionKey.value,
                params,
            );
        } catch (err) {
            summary.value = null;
            summaryError.value =
                err instanceof Error
                    ? err.message
                    : "Failed to load transaction summary.";
        } finally {
            summaryLoading.value = false;
        }
    };
```

Update the `refresh` function to also call `loadSummary()`:

```ts
    const refresh = () => {
        pagination.page = 1;
        void loadRows();
        void loadSummary();
    };
```

Update the debounced filter watcher to also call `loadSummary()`:

```ts
    useDebouncedWatch(
        () => [
            keyword.value,
            startDate.value,
            endDate.value,
            selectedWarehouse.value,
            selectedPartner.value,
        ],
        () => {
            if (suppressFilterWatch.value) return;
            pagination.page = 1;
            void loadRows();
            void loadSummary();
        },
    );
```

Update the `transactionKey` immediate watcher to also call `loadSummary()` (add the call directly after the existing `void loadRows();` line):

```ts
    watch(
        () => props.transactionKey,
        () => {
            suppressFilterWatch.value = true;
            keyword.value = "";
            startDate.value = "";
            endDate.value = "";
            selectedWarehouse.value = "";
            selectedPartner.value = "";
            pagination.page = 1;
            pagination.limit = 20;
            pagination.total = 0;
            rows.value = [];
            partners.value = [];
            suppressFilterWatch.value = false;
            void loadPartnerOptions();
            void loadRows();
            void loadSummary();
        },
        { immediate: true },
    );
```

Add `summary`, `summaryLoading`, `summaryError` to the return object, directly after `rows`:

```ts
        rows,
        summary,
        summaryLoading,
        summaryError,
        displayRows,
```

Do NOT add any call to `loadSummary()` in the `[pagination.page, pagination.limit]` watcher — that watcher must remain unchanged, since paging alone must not refetch the summary.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/views/transactions/composables/useTransactionList.test.ts`
Expected: PASS (all pre-existing tests plus the 3 new ones).

- [ ] **Step 6: Type-check**

Run: `npx vue-tsc --noEmit`
Expected: no new type errors — this also confirms nothing else in the codebase still imports the deleted `useTransactionSummary.ts` (Task 12 will remove `TransactionListPage.vue`'s import of it; if type-check fails here pointing at `TransactionListPage.vue`, that's expected until Task 12 runs).

- [ ] **Step 7: Commit**

```bash
git add src/views/transactions/composables/useTransactionList.ts src/views/transactions/composables/useTransactionList.test.ts
git rm src/views/transactions/composables/useTransactionSummary.ts src/views/transactions/composables/useTransactionSummary.test.ts
git commit -m "feat: fetch full-filter summary in useTransactionList, remove client-side derivation"
```

---

### Task 11 (Warehouse): Rewrite `TransactionSummaryWidget.vue` as a 4-card grid

**Files:**

- Modify: `src/views/transactions/components/TransactionSummaryWidget.vue`
- Modify: `src/views/transactions/components/TransactionSummaryWidget.test.ts`

**Interfaces:**

- Consumes: `TransactionSummaryResponse`, `TransactionSummaryStatusCount`, `TransactionSummaryMostRecent`, `TransactionSummaryNeedsAttention` from Task 8.
- Produces: `TransactionSummaryWidget` component with props `{ loading: boolean; error: string | null; summary: TransactionSummaryResponse | null }` — consumed by Task 12.

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `src/views/transactions/components/TransactionSummaryWidget.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import TransactionSummaryWidget from "./TransactionSummaryWidget.vue";
import { formatDate } from "@/utils/date";

const emptySummary = {
    totalCount: 0,
    statusBreakdown: [],
    mostRecent: null,
    needsAttention: { count: 0, canceledCount: 0, staleDraftCount: 0 },
};

describe("TransactionSummaryWidget", () => {
    it("renders 4 skeleton blocks while loading", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: true,
            error: null,
            summary: null,
        });
        const html = await renderToString(app);
        expect(html.match(/animate-pulse/g) ?? []).toHaveLength(4);
    });

    it("renders an inline error message when the summary fetch failed", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: false,
            error: "Failed to load transaction summary.",
            summary: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("Failed to load transaction summary.");
    });

    it("renders an empty-state message when there are no matching transactions", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: false,
            error: null,
            summary: emptySummary,
        });
        const html = await renderToString(app);
        expect(html).toContain("No transactions match the current filters.");
    });

    it("renders total, percentage-annotated status breakdown, most recent, and a clear needs-attention state", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: false,
            error: null,
            summary: {
                totalCount: 57,
                statusBreakdown: [
                    { status: "posted", count: 40, percentage: 70.2 },
                    { status: "draft", count: 17, percentage: 29.8 },
                ],
                mostRecent: {
                    docNo: "IN-057",
                    createdByName: "Jane Doe",
                    createdAt: "2026-08-01T12:00:00.000Z",
                },
                needsAttention: { count: 0, canceledCount: 0, staleDraftCount: 0 },
            },
        });
        const html = await renderToString(app);

        expect(html).toContain("57");
        expect(html).toContain("posted 40 (70.2%)");
        expect(html).toContain("draft 17 (29.8%)");
        expect(html).toContain("IN-057");
        expect(html).toContain("Jane Doe");
        expect(html).toContain(formatDate("2026-08-01T12:00:00.000Z"));
        expect(html).toContain("All clear");
        expect(html).toContain("wdg_TransactionSummary");
    });

    it("highlights a non-zero needs-attention count with its breakdown", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: false,
            error: null,
            summary: {
                totalCount: 10,
                statusBreakdown: [{ status: "canceled", count: 3, percentage: 30 }],
                mostRecent: null,
                needsAttention: { count: 5, canceledCount: 3, staleDraftCount: 2 },
            },
        });
        const html = await renderToString(app);

        expect(html).toContain("No transactions yet.");
        expect(html).toContain("3 cancelled");
        expect(html).toContain("2 pending &gt;3 days");
        expect(html).toContain("text-danger-600");
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/views/transactions/components/TransactionSummaryWidget.test.ts`
Expected: FAIL — the component still expects the old `totalCount`/`statusBreakdown`/`dateRange` props, not `summary`/`error`.

- [ ] **Step 3: Rewrite the component**

Replace the full contents of `src/views/transactions/components/TransactionSummaryWidget.vue` with:

```vue
<template>
    <div class="grid gap-4 sm:grid-cols-2" object-id="wdg_TransactionSummary">
        <template v-if="loading">
            <div
                v-for="n in 4"
                :key="n"
                class="h-28 rounded-md bg-surface-secondary animate-pulse"
            ></div>
        </template>

        <Card v-else-if="error" class="sm:col-span-2">
            <p class="text-sm text-danger-600">{{ error }}</p>
        </Card>

        <Card v-else-if="summary?.totalCount === 0" class="sm:col-span-2">
            <p class="text-sm text-text-secondary">
                No transactions match the current filters.
            </p>
        </Card>

        <template v-else-if="summary">
            <Card>
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 ring-1 ring-primary-200"
                    >
                        <Icon :icon="FileText" :size="18" />
                    </div>
                    <div>
                        <p
                            class="text-xs font-semibold uppercase text-text-muted"
                        >
                            Total
                        </p>
                        <p class="text-3xl font-extrabold text-gray-900">
                            {{ summary.totalCount.toLocaleString() }}
                        </p>
                    </div>
                </div>
            </Card>

            <Card>
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-600 ring-1 ring-gray-200"
                    >
                        <Icon :icon="Tags" :size="18" />
                    </div>
                    <p class="text-xs font-semibold uppercase text-text-muted">
                        Status Breakdown
                    </p>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                    <Badge
                        v-for="item in summary.statusBreakdown"
                        :key="item.status"
                        :tone="statusTone(item.status)"
                    >
                        {{ item.status }} {{ item.count.toLocaleString() }} ({{
                            item.percentage.toFixed(1)
                        }}%)
                    </Badge>
                </div>
            </Card>

            <Card>
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-50 text-info-600 ring-1 ring-info-200"
                    >
                        <Icon :icon="Clock" :size="18" />
                    </div>
                    <p class="text-xs font-semibold uppercase text-text-muted">
                        Most Recent
                    </p>
                </div>
                <template v-if="summary.mostRecent">
                    <p class="text-sm font-medium text-gray-900 mt-3">
                        {{ summary.mostRecent.docNo }}
                    </p>
                    <p class="text-xs text-text-secondary mt-1">
                        {{ summary.mostRecent.createdByName ?? "Unknown" }} ·
                        {{ formatDate(summary.mostRecent.createdAt) }}
                    </p>
                </template>
                <p v-else class="text-sm text-text-secondary mt-3">
                    No transactions yet.
                </p>
            </Card>

            <Card>
                <div class="flex items-center gap-3">
                    <div
                        :class="[
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1',
                            summary.needsAttention.count > 0
                                ? 'bg-danger-50 text-danger-600 ring-danger-200'
                                : 'bg-success-50 text-success-600 ring-success-200',
                        ]"
                    >
                        <Icon
                            :icon="
                                summary.needsAttention.count > 0
                                    ? AlertTriangle
                                    : CheckCircle2
                            "
                            :size="18"
                        />
                    </div>
                    <p class="text-xs font-semibold uppercase text-text-muted">
                        Needs Attention
                    </p>
                </div>
                <template v-if="summary.needsAttention.count > 0">
                    <p class="text-3xl font-extrabold text-danger-600 mt-3">
                        {{ summary.needsAttention.count.toLocaleString() }}
                    </p>
                    <p class="text-xs text-text-secondary mt-1">
                        {{ summary.needsAttention.canceledCount }} cancelled,
                        {{ summary.needsAttention.staleDraftCount }} pending
                        &gt;3 days
                    </p>
                </template>
                <p v-else class="text-sm font-medium text-success-600 mt-3">
                    All clear
                </p>
            </Card>
        </template>
    </div>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import Badge from "@/components/atoms/Badge.vue";
import Icon from "@/components/atoms/Icon.vue";
import { AlertTriangle, CheckCircle2, Clock, FileText, Tags } from "lucide-vue-next";
import { formatDate } from "@/utils/date";
import type { TransactionSummaryResponse } from "../types";

defineProps<{
    loading: boolean;
    error: string | null;
    summary: TransactionSummaryResponse | null;
}>();

// Purely presentational grouping of raw status values into the Badge
// atom's existing tone vocabulary — not a business-meaning mapping, since
// the backend deliberately keeps status generic/unmapped per-transactionKey.
const SUCCESS_STATUSES = new Set([
    "posted",
    "done",
    "completed",
    "closed",
    "reconciled",
    "approved",
]);
const WARNING_STATUSES = new Set([
    "draft",
    "pending",
    "counting",
    "queued",
    "assigned",
    "in_progress",
    "processing",
]);
const ERROR_STATUSES = new Set([
    "cancelled",
    "canceled",
    "rejected",
    "failed",
    "void",
    "voided",
]);

const statusTone = (
    label: string,
): "success" | "warning" | "error" | "neutral" => {
    const normalized = label.toLowerCase();
    if (SUCCESS_STATUSES.has(normalized)) return "success";
    if (WARNING_STATUSES.has(normalized)) return "warning";
    if (ERROR_STATUSES.has(normalized)) return "error";
    return "neutral";
};
</script>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/views/transactions/components/TransactionSummaryWidget.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Type-check**

Run: `npx vue-tsc --noEmit`
Expected: no new type errors from this file (Task 12 still needs to update `TransactionListPage.vue`'s usage — that file will still show errors until Task 12 runs).

- [ ] **Step 6: Commit**

```bash
git add src/views/transactions/components/TransactionSummaryWidget.vue src/views/transactions/components/TransactionSummaryWidget.test.ts
git commit -m "feat: rewrite TransactionSummaryWidget as a 4-card grid (percentage, most recent, needs attention)"
```

---

### Task 12 (Warehouse): Wire the new widget props into `TransactionListPage.vue`

**Files:**

- Modify: `src/views/transactions/TransactionListPage.vue`

**Interfaces:**

- Consumes: `summary`, `summaryLoading`, `summaryError` from `useTransactionList` (Task 10); `TransactionSummaryWidget`'s new props (Task 11).
- Produces: no new exports — this is the final integration point for this plan.

There is no existing colocated test for `TransactionListPage.vue` (consistent with the v1 plan's same observation), so this task is verified by type-check plus the full transaction-view suite, not a page-level render test.

- [ ] **Step 1: Confirm current state before changing**

Run: `npx vitest run src/views/transactions`
Expected: PASS — all tests from Tasks 8–11 pass before this integration change (this file's own stale usage of the old `useTransactionSummary` import will not be exercised by any test, since none exists for this file).

- [ ] **Step 2: Replace the full contents of `TransactionListPage.vue`**

```vue
<template>
    <section class="space-y-6">
        <PageHeader
            :title="pageTitle"
            :description="pageDescription"
            :tagline="pageTagline"
        />

        <TransactionSummaryWidget
            :loading="summaryLoading"
            :error="summaryError"
            :summary="summary"
        />

        <Card no-padding object-id="wdg_TransactionList">
            <TransactionHeader
                :heading="sectionHeading"
                v-model:keyword="keyword"
                v-model:start-date="startDate"
                v-model:end-date="endDate"
                v-model:selected-warehouse="selectedWarehouse"
                v-model:selected-partner="selectedPartner"
                :show-warehouse-filter="showWarehouseFilter"
                :partner-filter-supported="partnerFilterSupported"
                :warehouse-select-options="warehouseSelectOptions"
                :partner-select-options="partnerSelectOptions"
                :partner-label="partnerLabel"
                :has-rows="displayRows.length > 0"
                :can-export="canExport"
                :can-create="canCreate"
                @refresh="refresh"
                @export="exportRows"
                @new="handleNew"
            />

            <div class="px-6">
                <p v-if="partnerError" class="text-xs text-rose-600 mb-4">
                    {{ partnerError }}
                </p>
                <p
                    v-if="error && !loading"
                    class="rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 mb-4"
                >
                    {{ error }}
                </p>
            </div>

            <TransactionTable
                v-model:page="pagination.page"
                v-model:limit="pagination.limit"
                :loading="loading"
                :rows="displayRows"
                :columns="columns"
                :empty-state-variant="emptyStateVariant"
                :total="pagination.total"
                :page-size-options="pageSizeOptions"
                @view="handleView"
            />
        </Card>
    </section>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import TransactionHeader from "./components/TransactionHeader.vue";
import TransactionTable from "./components/TransactionTable.vue";
import TransactionSummaryWidget from "./components/TransactionSummaryWidget.vue";
import type { TransactionKey } from "@/services/transactions.service";
import { useTransactionList } from "./composables/useTransactionList";
import { useRouter } from "vue-router";

const props = defineProps<{ transactionKey: TransactionKey }>();
const router = useRouter();

const handleNew = () => {
    router.push(`/transactions/${props.transactionKey}/new`);
};

const handleView = (id: string) => {
    router.push(`/transactions/${props.transactionKey}/${id}`);
};

const {
    pageTitle,
    pageTagline,
    sectionHeading,
    canCreate,
    canExport,
    pageDescription,
    keyword,
    startDate,
    endDate,
    selectedWarehouse,
    selectedPartner,
    showWarehouseFilter,
    partnerFilterSupported,
    warehouseSelectOptions,
    partnerSelectOptions,
    partnerLabel,
    partnerError,
    error,
    loading,
    pagination,
    pageSizeOptions,
    summary,
    summaryLoading,
    summaryError,
    displayRows,
    columns,
    emptyStateVariant,
    exportRows,
    refresh,
} = useTransactionList(props);
</script>
```

Note: this removes the `import { useTransactionSummary } from "./composables/useTransactionSummary";` line and the `rows`/`useTransactionSummary(...)` call entirely — `rows` is no longer destructured here since nothing in this file needs it directly anymore (the summary now comes straight from `useTransactionList`'s own `summary` ref).

- [ ] **Step 3: Manual smoke check**

Run: `npm run dev`, then visit `/transactions/inbound` (or any of the other 6 keys) in a browser.
Expected: the widget shows a 4-card loading skeleton briefly, then Total / Status Breakdown (with percentages) / Most Recent / Needs Attention. Change a filter (e.g. type in the search box) and confirm the widget refetches together with the table. Change the page number and confirm the widget does NOT refetch (its numbers stay the same while the table's rows change).

- [ ] **Step 4: Run the full transaction-view test suite**

Run: `npx vitest run src/views/transactions`
Expected: PASS — all tests across Tasks 8–11 plus pre-existing tests continue to pass.

- [ ] **Step 5: Type-check**

Run: `npx vue-tsc --noEmit`
Expected: no new type errors — this should now be fully clean, confirming no remaining reference to the deleted `useTransactionSummary.ts` anywhere in the codebase.

- [ ] **Step 6: Commit**

```bash
git add src/views/transactions/TransactionListPage.vue
git commit -m "feat: wire backend-backed summary into TransactionListPage"
```
