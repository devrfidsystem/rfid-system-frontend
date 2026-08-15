# Opname Summary Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `GET /opname/summary` backend endpoint and a matching frontend widget to `OpnameTreePage.vue`, scoped to Opname's own data model (task-node counts, its own status vocabulary, and a variance/discrepancy signal that doesn't exist in the other 7 transaction modules).

**Architecture:** `OpnameQueryService` (the query half of the existing `OpnameService` facade) gains a `getSummary()` method computing over `OpnameDoc` rows where `nodeType = 'task'`, scoped by `companyId`/`warehouseId` — the same filter shape `getTree()` already uses. The frontend fetches this alongside the tree in `useOpnameTree.ts` and renders it via a new `OpnameSummaryWidget.vue`.

**Tech Stack:** Backend: NestJS 10, Prisma 5.x, Jest. Frontend: Vue 3 (`<script setup>`, Composition API), TypeScript, Vitest.

## Global Constraints

- No new DTO — reuses the existing `OpnameTreeFilterDto` (`{ companyId?, warehouseId? }`), matching `getTree()`'s filter shape exactly. No date/status/location filter support — those are the toolbar's client-only filters over the already-loaded tree, not something this endpoint accepts.
- Only `OpnameDoc` rows with `nodeType: 'task'` are counted — `group`/`profile` nodes are organizational structure, not countable units.
- Percentage = `count / totalCount * 100`, rounded to 1 decimal via `Math.round((count / totalCount) * 1000) / 10`; `0` when `totalCount` is `0`.
- `varianceTaskCount` = count of task-node docs having ≥1 `OpnameLine` with `variance_qty != 0`, via Prisma's relation filter `lines: { some: { variance_qty: { not: 0 } } }` — not a separate line-level query, not a sum of variance quantities.
- "Needs attention" = `canceled` count + `counting`-status docs older than 3 days (`stuckCountingCount`), the latter's date cutoff combined with the base `where` via Prisma's `AND` array (not object-spread override), matching the pattern already established for the other 7 modules.
- `OpnameDoc.createdAt` is `DateTime?` (nullable, confirmed in `prisma/schema.prisma`) — apply the fix already needed in production for the other 5 nullable-`createdAt` modules FROM THE START here: the `mostRecent` `findFirst` query must exclude `createdAt: null` rows via `AND: [where, { createdAt: { not: null } }]`, never rely on a bare non-null assertion without that exclusion.
- `OpnameDoc`'s creator relation is named `users` (confirmed in `prisma/schema.prisma` — same default-relation-naming as inbound/outbound/relocation/transfer/returns/putaway; only `register`, from the sibling transaction-summary-widget work, uses an explicit `createdBy` name — not relevant here).
- `OpnameDoc` has no `docNo`-style field — its display identifier is `title`.
- No `as any`/`as never` casts anywhere in production code — if a TypeScript overload issue appears on the `groupBy` call, extract it to a local `const` (a `PrismaPromise`) and pass that into the `$transaction([...])` array, exactly as done for the other 7 modules.
- All 6 aggregate queries (`count`, `groupBy`, the variance `count`, `findFirst`, the canceled `count`, the stuck-counting `count`) must run inside ONE `$transaction([...])` array for a consistent snapshot.
- Frontend: `loadSummary()` fires alongside `loadTree()` in exactly two places in `useOpnameTree.ts` — inside `refresh()`, and inside the existing `watch([companyId, selectedWarehouseId], ...)` (both its early-return-and-clear branch and its normal branch). It is NOT triggered by `keyword`/`startDate`/`endDate`/`statusFilter`/`locationFilter` changes — those stay purely client-side filters over the already-loaded tree.
- Frontend: a summary fetch failure must never clear `tree` or set the tree's `error`, and a tree fetch failure must never clear `summary` or set `summaryError` — fully isolated try/catch state, matching the established pattern from the transaction summary widget.
- Backend commands run from `/Users/syillaeltaniadaffa/Documents/Warehouse-be` (Jest: `npx jest <path>`, type-check: `npx tsc --noEmit -p tsconfig.json`). Frontend commands run from `/Users/syillaeltaniadaffa/Documents/Warehouse` (Vitest: `npx vitest run <path>`, type-check: `npx vue-tsc --noEmit`; there is no `npm test` script).

---

### Task 1 (Warehouse-be): `OpnameQueryService.getSummary()` + `GET /opname/summary`

**Files:**

- Modify: `src/modules/warehouse/opname/opname-query.service.ts`
- Modify: `src/modules/warehouse/opname/opname.service.ts`
- Modify: `src/modules/warehouse/opname/opname.controller.ts`
- Modify: `src/modules/warehouse/opname/opname-query.service.spec.ts`

**Interfaces:**

- Produces: `OpnameQueryService.getSummary(query: { companyId?: string; warehouseId?: string })` returning `{ totalCount: number; statusBreakdown: { status: string; count: number; percentage: number }[]; varianceTaskCount: number; needsAttention: { count: number; canceledCount: number; stuckCountingCount: number }; mostRecent: { title: string; createdByName: string | null; createdAt: string } | null }`. `OpnameService.getSummary(query)` delegates to it (facade pattern, same as `listTree`). `OpnameController`'s `GET /opname/summary` returns `successResponse(summary, 'Opname summary')`. This exact response shape is what Task 4 (frontend types) mirrors.

- [ ] **Step 1: Write the failing tests**

Add `import type { Prisma } from '@prisma/client';` to the top of `src/modules/warehouse/opname/opname-query.service.ts`'s import list (needed for the `where` type below).

Add `groupBy: jest.fn(), findFirst: jest.fn()` to the `opnameDoc` mock object in `src/modules/warehouse/opname/opname-query.service.spec.ts` (currently `{ findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() }` — add the two new methods alongside them; this must be done in the base mock object literal, not inside a test body, since later steps reassign these with `.mockResolvedValueOnce`/`.mockResolvedValue` chains that require the properties to already exist on the mock's inferred type).

Then add this `describe` block to the end of the file, before the final closing `});`:

```ts
describe("getSummary()", () => {
    it("computes totals, status-breakdown percentages, variance task count, most recent doc, and needs-attention counts", async () => {
        mockPrismaService.opnameDoc.count = jest
            .fn()
            .mockResolvedValueOnce(3) // totalCount
            .mockResolvedValueOnce(1) // varianceTaskCount
            .mockResolvedValueOnce(1) // canceledCount
            .mockResolvedValueOnce(1); // stuckCountingCount
        mockPrismaService.opnameDoc.groupBy = jest.fn().mockResolvedValue([
            { status: "counting", _count: { _all: 1 } },
            { status: "closed", _count: { _all: 2 } },
        ]);
        mockPrismaService.opnameDoc.findFirst = jest.fn().mockResolvedValue({
            title: "Stock Opname Q3 - Task 4",
            createdAt: new Date("2026-08-01T00:00:00.000Z"),
            users: { fullName: "Jane Doe" },
        });

        const result = await service.getSummary({
            companyId: "company-1",
            warehouseId: "wh-1",
        });

        expect(result.totalCount).toBe(3);
        expect(result.statusBreakdown).toEqual([
            { status: "counting", count: 1, percentage: 33.3 },
            { status: "closed", count: 2, percentage: 66.7 },
        ]);
        expect(result.varianceTaskCount).toBe(1);
        expect(result.mostRecent).toEqual({
            title: "Stock Opname Q3 - Task 4",
            createdByName: "Jane Doe",
            createdAt: "2026-08-01T00:00:00.000Z",
        });
        expect(result.needsAttention).toEqual({
            count: 2,
            canceledCount: 1,
            stuckCountingCount: 1,
        });
    });

    it("returns a null mostRecent and an empty breakdown when there are no matching task nodes", async () => {
        mockPrismaService.opnameDoc.count = jest
            .fn()
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);
        mockPrismaService.opnameDoc.groupBy = jest.fn().mockResolvedValue([]);
        mockPrismaService.opnameDoc.findFirst = jest
            .fn()
            .mockResolvedValue(null);

        const result = await service.getSummary({
            companyId: "company-1",
            warehouseId: "wh-1",
        });

        expect(result.totalCount).toBe(0);
        expect(result.statusBreakdown).toEqual([]);
        expect(result.varianceTaskCount).toBe(0);
        expect(result.mostRecent).toBeNull();
        expect(result.needsAttention).toEqual({
            count: 0,
            canceledCount: 0,
            stuckCountingCount: 0,
        });
    });

    it("scopes every query to task nodes and excludes null-createdAt rows from the most-recent lookup", async () => {
        mockPrismaService.opnameDoc.count = jest
            .fn()
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);
        mockPrismaService.opnameDoc.groupBy = jest.fn().mockResolvedValue([]);
        mockPrismaService.opnameDoc.findFirst = jest
            .fn()
            .mockResolvedValue(null);

        await service.getSummary({
            companyId: "company-1",
            warehouseId: "wh-1",
        });

        const totalCountCall =
            mockPrismaService.opnameDoc.count.mock.calls[0][0];
        expect(totalCountCall.where).toEqual(
            expect.objectContaining({
                nodeType: "task",
                companyId: "company-1",
                warehouse_id: "wh-1",
            }),
        );

        const varianceCall = mockPrismaService.opnameDoc.count.mock.calls[1][0];
        expect(varianceCall.where).toEqual(
            expect.objectContaining({
                nodeType: "task",
                lines: { some: { variance_qty: { not: 0 } } },
            }),
        );

        const findFirstCall =
            mockPrismaService.opnameDoc.findFirst.mock.calls[0][0];
        expect(findFirstCall.where.AND).toEqual([
            expect.objectContaining({ nodeType: "task" }),
            { createdAt: { not: null } },
        ]);
    });

    it("combines the 3-day stuck-counting cutoff via AND, not override", async () => {
        mockPrismaService.opnameDoc.count = jest
            .fn()
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);
        mockPrismaService.opnameDoc.groupBy = jest.fn().mockResolvedValue([]);
        mockPrismaService.opnameDoc.findFirst = jest
            .fn()
            .mockResolvedValue(null);

        await service.getSummary({
            companyId: "company-1",
            warehouseId: "wh-1",
        });

        const stuckCountingCall =
            mockPrismaService.opnameDoc.count.mock.calls[3][0];
        expect(stuckCountingCall.where.AND).toEqual([
            expect.objectContaining({ nodeType: "task" }),
            expect.objectContaining({ status: "counting" }),
        ]);
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/modules/warehouse/opname/opname-query.service.spec.ts -t "getSummary"`
Expected: FAIL — `service.getSummary is not a function`.

- [ ] **Step 3: Implement `getSummary()`**

Add this method to `src/modules/warehouse/opname/opname-query.service.ts`, directly after `getTree()`:

```ts
  async getSummary(query: { companyId?: string; warehouseId?: string }) {
    const where: Prisma.OpnameDocWhereInput = { nodeType: 'task' };
    if (query.companyId) where.companyId = query.companyId;
    if (query.warehouseId) where.warehouse_id = query.warehouseId;

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const statusGroupByQuery = this.prisma.opnameDoc.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    });

    const [totalCount, statusGroups, varianceTaskCount, mostRecentDoc, canceledCount, stuckCountingCount] =
      await this.prisma.$transaction([
        this.prisma.opnameDoc.count({ where }),
        statusGroupByQuery,
        this.prisma.opnameDoc.count({
          where: { ...where, lines: { some: { variance_qty: { not: 0 } } } },
        }),
        this.prisma.opnameDoc.findFirst({
          where: { AND: [where, { createdAt: { not: null } }] },
          orderBy: { createdAt: 'desc' },
          select: { title: true, createdAt: true, users: { select: { fullName: true } } },
        }),
        this.prisma.opnameDoc.count({ where: { ...where, status: 'canceled' } }),
        this.prisma.opnameDoc.count({
          where: { AND: [where, { status: 'counting', createdAt: { lt: threeDaysAgo } }] },
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
      varianceTaskCount,
      needsAttention: {
        count: canceledCount + stuckCountingCount,
        canceledCount,
        stuckCountingCount,
      },
      mostRecent: mostRecentDoc
        ? {
            title: mostRecentDoc.title,
            createdByName: mostRecentDoc.users?.fullName ?? null,
            // createdAt is nullable in the schema, and rows with a null createdAt do
            // exist in practice (the same issue that caused a production incident in
            // the sibling transaction-summary endpoints); the findFirst query above
            // excludes them via `createdAt: { not: null }`, so this assertion only
            // satisfies TypeScript.
            createdAt: mostRecentDoc.createdAt!.toISOString(),
          }
        : null,
    };
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/modules/warehouse/opname/opname-query.service.spec.ts`
Expected: PASS (2 pre-existing tests + 4 new `getSummary()` tests).

- [ ] **Step 5: Add the facade delegate**

In `src/modules/warehouse/opname/opname.service.ts`, add this method directly after `listTree()`:

```ts
  async getSummary(query: { companyId?: string; warehouseId?: string }) {
    return this.queryService.getSummary(query);
  }
```

- [ ] **Step 6: Add the controller route**

In `src/modules/warehouse/opname/opname.controller.ts`, add this method directly after `listTree()` (i.e. between the `@Get('tree')` method and `@Get(':id')` — route ordering doesn't matter here since `'summary'` and `'tree'` are both literal segments, neither conflicts with `:id`, but keeping it next to `tree` groups the two read-only aggregate-ish endpoints together):

```ts
  @Get('summary')
  @ApiBearerAuthProtected()
  @ApiOperation({
    summary: 'Get opname summary',
    description:
      'Aggregate totals, status breakdown, variance task count, most recent task, and needs-attention counts across task-node documents for a company/warehouse scope. Accepts the same filters as GET /opname/tree.',
  })
  @ApiStandardOkResponse('Opname summary')
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async getSummary(@Query() query: OpnameTreeFilterDto): Promise<ApiResponse<unknown>> {
    const summary = await this.opnameService.getSummary(query);
    return successResponse(summary, 'Opname summary');
  }
```

- [ ] **Step 7: Type-check and run the full opname test suite**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new type errors.

Run: `npx jest src/modules/warehouse/opname`
Expected: PASS (all tests, including `opname-tree.helpers.spec.ts`, `opname-mutation.service.spec.ts`, and the DTO specs, unaffected by this change).

- [ ] **Step 8: Commit**

```bash
git add src/modules/warehouse/opname/opname-query.service.ts src/modules/warehouse/opname/opname.service.ts src/modules/warehouse/opname/opname.controller.ts src/modules/warehouse/opname/opname-query.service.spec.ts
git commit -m "feat(opname): add GET /opname/summary aggregate endpoint"
```

---

### Task 2 (Warehouse): Add `OpnameSummaryResponse` types

**Files:**

- Create: `src/views/opname/opnameSummary.ts`

**Interfaces:**

- Produces: `OpnameSummaryStatusCount`, `OpnameSummaryMostRecent`, `OpnameSummaryNeedsAttention`, `OpnameSummaryResponse` — consumed by Tasks 3–5. NOT a reuse of `TransactionSummaryResponse` (the shapes differ: `varianceTaskCount`, `stuckCountingCount`, `title` instead of `docNo`).

- [ ] **Step 1: Create the file**

```ts
export interface OpnameSummaryStatusCount {
    status: string;
    count: number;
    percentage: number;
}

export interface OpnameSummaryMostRecent {
    title: string;
    createdByName: string | null;
    createdAt: string;
}

export interface OpnameSummaryNeedsAttention {
    count: number;
    canceledCount: number;
    stuckCountingCount: number;
}

export interface OpnameSummaryResponse {
    totalCount: number;
    statusBreakdown: OpnameSummaryStatusCount[];
    varianceTaskCount: number;
    needsAttention: OpnameSummaryNeedsAttention;
    mostRecent: OpnameSummaryMostRecent | null;
}
```

- [ ] **Step 2: Type-check**

Run: `npx vue-tsc --noEmit`
Expected: no new type errors (this file has no runtime behavior — it's type-only).

- [ ] **Step 3: Commit**

```bash
git add src/views/opname/opnameSummary.ts
git commit -m "feat: add OpnameSummaryResponse types"
```

---

### Task 3 (Warehouse): `opname.api.ts` + `opname.service.ts` — add `summary()`

**Files:**

- Modify: `src/api/feature/opname.api.ts`
- Modify: `src/services/opname.service.ts`

**Interfaces:**

- Consumes: `OpnameSummaryResponse` from Task 2.
- Produces: `opnameApi.summary(params)`, `opnameService.summary(params): Promise<OpnameSummaryResponse>` — consumed by Task 4.

- [ ] **Step 1: Add `summary()` to `opname.api.ts`**

In `src/api/feature/opname.api.ts`, add `import type { OpnameSummaryResponse } from "@/views/opname/opnameSummary";` to the imports, then add this method to the `opnameApi` object, directly after `getTree()`:

```ts
    summary(params: OpnameTreeFilterParams = {}) {
        return apiRequest<OpnameSummaryResponse>({
            url: "/opname/summary",
            method: "get",
            params,
        });
    },
```

- [ ] **Step 2: Add `summary()` to `opname.service.ts`**

In `src/services/opname.service.ts`, add `OpnameSummaryResponse` to the existing type-only import from `@/api/feature/opname.api` (currently importing `OpnameNodePayload`/`OpnameLineDetail`/`UpdateOpnameLineCountPayload`/`OpnameTreeFilterParams` — add `OpnameSummaryResponse` alongside them), then add this method to the `opnameService` object, directly after `getTree()`:

```ts
    async summary(
        params: OpnameTreeFilterParams = {},
    ): Promise<OpnameSummaryResponse> {
        const response = await opnameApi.summary(params);
        return response.data as OpnameSummaryResponse;
    },
```

Also add `export type { OpnameSummaryResponse } from "@/views/opname/opnameSummary";` to the file's existing re-export block at the bottom.

- [ ] **Step 3: Type-check**

Run: `npx vue-tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 4: Commit**

```bash
git add src/api/feature/opname.api.ts src/services/opname.service.ts
git commit -m "feat: add opnameService.summary for the backend-backed opname summary endpoint"
```

---

### Task 4 (Warehouse): Wire summary fetch into `useOpnameTree.ts`

**Files:**

- Modify: `src/views/opname/composables/useOpnameTree.ts`
- Modify: `src/views/opname/composables/useOpnameTree.test.ts`

**Interfaces:**

- Consumes: `opnameService.summary` from Task 3, `OpnameSummaryResponse` from Task 2.
- Produces: `useOpnameTree()`'s return object gains `summary: Ref<OpnameSummaryResponse | null>`, `summaryLoading: Ref<boolean>`, `summaryError: Ref<string | null>` — consumed by Task 6.

- [ ] **Step 1: Write the failing tests**

Add `const getSummaryMock = vi.hoisted(() => vi.fn());` to `src/views/opname/composables/useOpnameTree.test.ts`, alongside the existing `getTreeMock`, and add `summary: getSummaryMock` to the `vi.mock("@/services/opname.service", ...)` factory's returned `opnameService` object.

Then add `getSummaryMock.mockReset(); getSummaryMock.mockResolvedValue({ totalCount: 0, statusBreakdown: [], varianceTaskCount: 0, needsAttention: { count: 0, canceledCount: 0, stuckCountingCount: 0 }, mostRecent: null });` to the existing `beforeEach` block, alongside the `getTreeMock` resets.

Then add these tests inside the existing `describe("useOpnameTree", ...)` block:

```ts
it("fetches the summary alongside the tree once company and warehouse are available", async () => {
    const composable = useOpnameTree();
    await nextTick();

    authStoreState.setProfile({ currentCompanyId: "company-1" });
    await nextTick();
    await Promise.resolve();

    expect(getSummaryMock).toHaveBeenCalledTimes(1);
    expect(getSummaryMock).toHaveBeenCalledWith({
        companyId: "company-1",
        warehouseId: "wh-1",
    });
    expect(composable.summary.value).toEqual({
        totalCount: 0,
        statusBreakdown: [],
        varianceTaskCount: 0,
        needsAttention: { count: 0, canceledCount: 0, stuckCountingCount: 0 },
        mostRecent: null,
    });
});

it("isolates a summary fetch failure from the tree's own rows/error state", async () => {
    getSummaryMock.mockRejectedValueOnce(new Error("Summary down"));
    getTreeMock.mockResolvedValueOnce([
        {
            id: "task-1",
            parentId: null,
            companyId: "company-1",
            warehouse_id: "wh-1",
            profile_id: "OP-1",
            title: "Task 1",
            description: null,
            task_group: null,
            task_period: null,
            status: "draft",
            nodeType: "task",
        },
    ]);

    const composable = useOpnameTree();
    await nextTick();

    authStoreState.setProfile({ currentCompanyId: "company-1" });
    await nextTick();
    await Promise.resolve();

    expect(composable.summaryError.value).toBe("Summary down");
    expect(composable.error.value).toBeNull();
    expect(composable.rows.value).toHaveLength(1);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/views/opname/composables/useOpnameTree.test.ts`
Expected: FAIL — `composable.summary`/`composable.summaryError` are `undefined`.

- [ ] **Step 3: Implement the wiring**

In `src/views/opname/composables/useOpnameTree.ts`, add `OpnameSummaryResponse` to the existing import from `@/services/opname.service` (currently `import { opnameService, type OpnameTreeFilterParams } from "@/services/opname.service";` — change to also import `type OpnameSummaryResponse`).

Add these three refs directly after the existing `const selectedNode = ref<OpnameTreeNode | null>(null);` (line 32):

```ts
const summary = ref<OpnameSummaryResponse | null>(null);
const summaryLoading = ref(false);
const summaryError = ref<string | null>(null);
```

Add a `loadSummary` function directly after the existing `loadTree` function:

```ts
const loadSummary = async () => {
    if (!companyId.value || !selectedWarehouseId.value) {
        summary.value = null;
        return;
    }

    summaryLoading.value = true;
    summaryError.value = null;
    try {
        summary.value = await opnameService.summary({
            companyId: companyId.value,
            warehouseId: selectedWarehouseId.value,
        });
    } catch (err) {
        summary.value = null;
        summaryError.value =
            err instanceof Error
                ? err.message
                : "Failed to load opname summary.";
    } finally {
        summaryLoading.value = false;
    }
};
```

Update `refresh()` to also call `loadSummary()`:

```ts
const refresh = async () => {
    await loadTree();
    await loadSummary();
};
```

Update the `watch([companyId, selectedWarehouseId], ...)` callback to also clear/call `loadSummary()`:

```ts
watch(
    [companyId, selectedWarehouseId],
    ([nextCompanyId, nextWarehouseId]) => {
        if (!nextCompanyId || !nextWarehouseId) {
            tree.value = [];
            expandedIds.value = new Set();
            summary.value = null;
            return;
        }
        void loadTree();
        void loadSummary();
    },
    { immediate: true },
);
```

Add `summary`, `summaryLoading`, `summaryError` to the return object, directly after `error`:

```ts
        loading,
        error,
        summary,
        summaryLoading,
        summaryError,
        keyword,
```

Do NOT add `loadSummary()` to the `filteredTree`/`visibleRows` computed properties or to any keyword/date/status/location-driven logic — those remain purely client-side filters over the already-loaded tree.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/views/opname/composables/useOpnameTree.test.ts`
Expected: PASS (1 pre-existing test + 2 new tests).

- [ ] **Step 5: Type-check**

Run: `npx vue-tsc --noEmit`
Expected: no new type errors from this file (`OpnameTreePage.vue` doesn't reference `summary` yet — that's Task 6 — so no transient failure is expected here, unlike the sibling transaction-widget plan, since this task doesn't delete anything a page depends on).

- [ ] **Step 6: Commit**

```bash
git add src/views/opname/composables/useOpnameTree.ts src/views/opname/composables/useOpnameTree.test.ts
git commit -m "feat: fetch opname summary alongside the tree in useOpnameTree"
```

---

### Task 5 (Warehouse): Create `OpnameSummaryWidget.vue`

**Files:**

- Create: `src/views/opname/components/OpnameSummaryWidget.vue`
- Create: `src/views/opname/components/OpnameSummaryWidget.test.ts`

**Interfaces:**

- Consumes: `OpnameSummaryResponse` and its nested types from Task 2.
- Produces: `OpnameSummaryWidget` component with props `{ loading: boolean; error: string | null; summary: OpnameSummaryResponse | null }` — consumed by Task 6.

- [ ] **Step 1: Write the failing tests**

Create `src/views/opname/components/OpnameSummaryWidget.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import OpnameSummaryWidget from "./OpnameSummaryWidget.vue";
import { formatDate } from "@/utils/date";

const emptySummary = {
    totalCount: 0,
    statusBreakdown: [],
    varianceTaskCount: 0,
    needsAttention: { count: 0, canceledCount: 0, stuckCountingCount: 0 },
    mostRecent: null,
};

describe("OpnameSummaryWidget", () => {
    it("renders 5 skeleton blocks while loading", async () => {
        const app = createSSRApp(OpnameSummaryWidget, {
            loading: true,
            error: null,
            summary: null,
        });
        const html = await renderToString(app);
        expect(html.match(/animate-pulse/g) ?? []).toHaveLength(5);
    });

    it("renders an inline error message when the summary fetch failed", async () => {
        const app = createSSRApp(OpnameSummaryWidget, {
            loading: false,
            error: "Failed to load opname summary.",
            summary: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("Failed to load opname summary.");
    });

    it("renders an empty-state message when there are no matching task nodes", async () => {
        const app = createSSRApp(OpnameSummaryWidget, {
            loading: false,
            error: null,
            summary: emptySummary,
        });
        const html = await renderToString(app);
        expect(html).toContain("No opname tasks match this warehouse.");
    });

    it("renders total, status breakdown, variance, most recent, and a clear needs-attention state", async () => {
        const app = createSSRApp(OpnameSummaryWidget, {
            loading: false,
            error: null,
            summary: {
                totalCount: 6,
                statusBreakdown: [
                    { status: "counting", count: 2, percentage: 33.3 },
                    { status: "closed", count: 4, percentage: 66.7 },
                ],
                varianceTaskCount: 2,
                needsAttention: {
                    count: 0,
                    canceledCount: 0,
                    stuckCountingCount: 0,
                },
                mostRecent: {
                    title: "Stock Opname Q3 - Task 4",
                    createdByName: "Jane Doe",
                    createdAt: "2026-08-01T12:00:00.000Z",
                },
            },
        });
        const html = await renderToString(app);

        expect(html).toContain("6");
        expect(html).toContain("counting 2 (33.3%)");
        expect(html).toContain("closed 4 (66.7%)");
        expect(html).toContain("2");
        expect(html).toContain("Stock Opname Q3 - Task 4");
        expect(html).toContain("Jane Doe");
        expect(html).toContain(formatDate("2026-08-01T12:00:00.000Z"));
        expect(html).toContain("All clear");
        expect(html).toContain("wdg_OpnameSummary");
    });

    it("highlights a non-zero needs-attention count with its breakdown", async () => {
        const app = createSSRApp(OpnameSummaryWidget, {
            loading: false,
            error: null,
            summary: {
                totalCount: 4,
                statusBreakdown: [
                    { status: "canceled", count: 1, percentage: 25 },
                ],
                varianceTaskCount: 0,
                needsAttention: {
                    count: 3,
                    canceledCount: 1,
                    stuckCountingCount: 2,
                },
                mostRecent: null,
            },
        });
        const html = await renderToString(app);

        expect(html).toContain("No tasks yet.");
        expect(html).toContain("1 cancelled");
        expect(html).toContain("2 stuck counting &gt;3 days");
        expect(html).toContain("text-danger-600");
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/views/opname/components/OpnameSummaryWidget.test.ts`
Expected: FAIL — cannot find module `./OpnameSummaryWidget.vue`.

- [ ] **Step 3: Create the component**

Create `src/views/opname/components/OpnameSummaryWidget.vue`:

```vue
<template>
    <div class="grid gap-4 sm:grid-cols-3" object-id="wdg_OpnameSummary">
        <template v-if="loading">
            <div
                v-for="n in 5"
                :key="n"
                class="h-28 rounded-md bg-surface-secondary animate-pulse"
            ></div>
        </template>

        <Card v-else-if="error" class="sm:col-span-3">
            <p class="text-sm text-danger-600">{{ error }}</p>
        </Card>

        <Card v-else-if="summary?.totalCount === 0" class="sm:col-span-3">
            <p class="text-sm text-text-secondary">
                No opname tasks match this warehouse.
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
                            Total Tasks
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
                        <Icon :icon="Scale" :size="18" />
                    </div>
                    <p class="text-xs font-semibold uppercase text-text-muted">
                        Variance
                    </p>
                </div>
                <p class="text-3xl font-extrabold text-gray-900 mt-3">
                    {{ summary.varianceTaskCount.toLocaleString() }}
                </p>
                <p class="text-xs text-text-secondary mt-1">
                    task(s) with a counting discrepancy
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
                        {{ summary.needsAttention.stuckCountingCount }} stuck
                        counting &gt;3 days
                    </p>
                </template>
                <p v-else class="text-sm font-medium text-success-600 mt-3">
                    All clear
                </p>
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
                        {{ summary.mostRecent.title }}
                    </p>
                    <p class="text-xs text-text-secondary mt-1">
                        {{ summary.mostRecent.createdByName ?? "Unknown" }} ·
                        {{ formatDate(summary.mostRecent.createdAt) }}
                    </p>
                </template>
                <p v-else class="text-sm text-text-secondary mt-3">
                    No tasks yet.
                </p>
            </Card>
        </template>
    </div>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import Badge from "@/components/atoms/Badge.vue";
import Icon from "@/components/atoms/Icon.vue";
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    FileText,
    Scale,
    Tags,
} from "lucide-vue-next";
import { formatDate } from "@/utils/date";
import type { OpnameSummaryResponse } from "../opnameSummary";

defineProps<{
    loading: boolean;
    error: string | null;
    summary: OpnameSummaryResponse | null;
}>();

// Purely presentational grouping of Opname's own status vocabulary into the
// Badge atom's existing tone set — draft/counting/reconciled/closed/canceled
// is a different vocabulary from the other 7 transaction modules'
// draft/posted/canceled, so this mapping is NOT shared with
// TransactionSummaryWidget.vue's statusTone().
const SUCCESS_STATUSES = new Set(["closed", "reconciled"]);
const WARNING_STATUSES = new Set(["counting", "draft"]);
const ERROR_STATUSES = new Set(["canceled", "cancelled"]);

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

Run: `npx vitest run src/views/opname/components/OpnameSummaryWidget.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Type-check**

Run: `npx vue-tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 6: Commit**

```bash
git add src/views/opname/components/OpnameSummaryWidget.vue src/views/opname/components/OpnameSummaryWidget.test.ts
git commit -m "feat: add OpnameSummaryWidget component"
```

---

### Task 6 (Warehouse): Wire the widget into `OpnameTreePage.vue`

**Files:**

- Modify: `src/views/opname/OpnameTreePage.vue`

**Interfaces:**

- Consumes: `summary`, `summaryLoading`, `summaryError` from `useOpnameTree` (Task 4); `OpnameSummaryWidget`'s props (Task 5).
- Produces: no new exports — final integration point for this plan.

There is no existing colocated test for `OpnameTreePage.vue`, consistent with the sibling `TransactionListPage.vue` (only its composables/sub-components are tested) — verified by `find src/views/opname -name "OpnameTreePage.test.ts"` returning nothing. This task is verified by type-check plus the full opname-view test suite.

- [ ] **Step 1: Confirm current state before changing**

Run: `npx vitest run src/views/opname`
Expected: PASS — all tests from Tasks 4–5 pass before this integration change.

- [ ] **Step 2: Replace the full contents of `OpnameTreePage.vue`**

```vue
<template>
    <section class="space-y-6">
        <PageHeader
            title="Stock Opname Group"
            description="Manage stock opname groups, profiles, and task lines."
            tagline="Transactions"
        />

        <OpnameSummaryWidget
            :loading="summaryLoading"
            :error="summaryError"
            :summary="summary"
        />

        <Card no-padding object-id="wdg_OpnameTree">
            <OpnameTreeToolbar
                :heading="sectionHeading"
                v-model:selected-warehouse-id="selectedWarehouseId"
                v-model:keyword="keyword"
                v-model:start-date="startDate"
                v-model:end-date="endDate"
                v-model:status-filter="statusFilter"
                v-model:location-filter="locationFilter"
                :warehouse-options="warehouseOptions"
                @refresh="refresh"
                @new="openCreateRoot"
            />

            <div v-if="error" class="px-6 pt-4">
                <p
                    class="rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                    {{ error }}
                </p>
            </div>

            <OpnameTreeTable
                :rows="rows"
                :loading="loading"
                :empty-state-variant="emptyStateVariant"
                @toggle-expand="toggleExpand"
                @new-profile="(row) => openCreateChild(row, 'profile')"
                @new-task="(row) => openCreateChild(row, 'task')"
                @view-node="openDetail"
            />
        </Card>
    </section>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import Card from "@/components/molecules/Card.vue";
import { useOpnameTree } from "./composables/useOpnameTree";
import OpnameTreeToolbar from "./components/OpnameTreeToolbar.vue";
import OpnameTreeTable from "./components/OpnameTreeTable.vue";
import OpnameSummaryWidget from "./components/OpnameSummaryWidget.vue";

const {
    loading,
    error,
    summary,
    summaryLoading,
    summaryError,
    keyword,
    startDate,
    endDate,
    statusFilter,
    locationFilter,
    selectedWarehouseId,
    warehouseOptions,
    rows,
    emptyStateVariant,
    sectionHeading,
    refresh,
    openCreateRoot,
    openCreateChild,
    openDetail,
    toggleExpand,
} = useOpnameTree();

onMounted(() => {
    void refresh();
});
</script>
```

- [ ] **Step 3: Manual smoke check**

Run: `npm run dev`, then visit `/transactions/opname` in a browser.
Expected: the 5-card widget shows a loading skeleton briefly, then Total Tasks / Status Breakdown / Variance / Needs Attention / Most Recent. Change the selected warehouse and confirm the widget refetches together with the tree. Type a keyword in the toolbar's search box and confirm the widget's numbers do NOT change (only the tree table filters).

- [ ] **Step 4: Run the full opname-view test suite**

Run: `npx vitest run src/views/opname`
Expected: PASS — all tests across Tasks 2–5 plus pre-existing tests continue to pass.

- [ ] **Step 5: Type-check**

Run: `npx vue-tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 6: Commit**

```bash
git add src/views/opname/OpnameTreePage.vue
git commit -m "feat: wire OpnameSummaryWidget into OpnameTreePage"
```
