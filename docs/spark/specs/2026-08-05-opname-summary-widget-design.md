# Opname Summary Widget Design

> Scope: extends the Transaction Summary Widget work (v1 client-side derivation, v2 backend-backed) to the Opname feature, which was explicitly out of scope in both prior specs. Opname's structure — a hierarchical tree with its own lifecycle vocabulary — is different enough that this is a new design, not a copy of the other 7 modules' widget.

## Goal

Give `OpnameTreePage.vue` a summary widget answering: how many count tasks exist and in what status, how many have a counting discrepancy, how many need attention (cancelled or stuck mid-count), and what's the most recent task.

## Background

- Opname is a hierarchical tree (`group` → `profile` → `task` `OpnameNodeType`), not a flat paginated list like the other 7 transaction types. Only `task` nodes are countable units — `group`/`profile` are organizational structure.
- Opname's lifecycle is `draft → counting → reconciled → closed`, with `canceled` reachable from `draft` or `counting` (`OpnameStatus` in `src/modules/warehouse/opname/constants/opname.constants.ts`) — distinct from the other 7 modules' `draft/posted/canceled` (or `draft/posted/done/canceled` for putaway).
- The frontend already loads the ENTIRE tree in one unpaginated call (`GET /opname/tree`, filtered only by `companyId`/`warehouseId`) and does all further filtering (keyword, date range, status, location) client-side in `useOpnameTree.ts`. Despite this meaning a client-side derivation would already be numerically accurate (unlike the other 7 modules, where only one page was ever loaded), the user chose to still build a backend endpoint for consistency with the established pattern.
- No aggregation/summary logic exists anywhere in the backend Opname module today — `opname-query.service.ts`'s `getTree()` does a flat `findMany` + a pure-function tree-build (`opname-tree.helpers.ts`), with no grouping/counting.
- `OpnameLine` (the count-detail table under each task `OpnameDoc`) has `system_qty`, `counted_qty`, `variance_qty` (all `Decimal`) — a discrepancy signal that doesn't exist in any of the other 7 modules and is genuinely central to what Opname is for.
- `OpnameDoc.createdAt` is nullable (`DateTime?`, confirmed in `prisma/schema.prisma`), same as the 5 other modules that just had a production incident from this exact fact (`GET /inbound/summary` crashed on a null `createdAt` in the "most recent" lookup). This design must apply the same fix from the start: exclude `createdAt: null` rows in the "most recent" query itself.
- `OpnameDoc` has no `docNo`-style field; its display identifier is `title` (a free-text field set at creation).

## Backend Design

### `GET /opname/summary`

Added to `opname.controller.ts`, delegating to a new `getSummary()` method on the query-side service (`opname-query.service.ts`, mirroring the facade split `OpnameService` already uses between `opname-mutation.service.ts` and `opname-query.service.ts`).

Accepts the same filter shape as `getTree()` — `companyId`/`warehouseId` only (no new DTO; reuses whatever param object `getTree()` already accepts, e.g. `OpnameTreeFilterDto`/inline type). Does NOT accept `status`/`dateFrom`/`dateTo`/`location`, since those are the toolbar's client-only filters, not something `getTree()` itself supports server-side — the widget therefore represents "the whole tree for this warehouse," not "what's currently visible after client-side filtering."

Response shape:

```ts
{
  totalCount: number;                 // count of OpnameDoc rows where nodeType = 'task', within companyId/warehouseId
  statusBreakdown: Array<{
    status: string;                   // 'draft' | 'counting' | 'reconciled' | 'closed' | 'canceled'
    count: number;
    percentage: number;               // count / totalCount * 100, rounded to 1 decimal; 0 when totalCount is 0
  }>;
  varianceTaskCount: number;          // count of task-node OpnameDocs having >=1 OpnameLine with variance_qty != 0
  needsAttention: {
    count: number;                    // canceledCount + stuckCountingCount
    canceledCount: number;            // status = 'canceled'
    stuckCountingCount: number;       // status = 'counting' AND createdAt older than 3 days
  };
  mostRecent: {
    title: string;
    createdByName: string | null;
    createdAt: string;
  } | null;                           // null when totalCount is 0
}
```

### Implementation

All queries scoped to `nodeType: 'task'` plus `companyId`/`warehouseId` (call this `where` — the task-node equivalent of the other modules' `buildListWhere()`, but simpler since there's no status/date/search filter to support server-side). One `$transaction` array with 6 queries, all reading a consistent snapshot:

1. `count({ where })` → `totalCount`.
2. `groupBy({ by: ['status'], where, _count: { _all: true } })` → `statusBreakdown` source (assigned to a local `const` before the transaction array, per the established no-cast pattern — never `as any`/`as never` on the `_count` access).
3. A count of task-node docs with at least one line whose `variance_qty != 0`: `count({ where: { ...where, lines: { some: { variance_qty: { not: 0 } } } } })` → `varianceTaskCount`. (Prisma's relation filter `some` on `lines` is the natural fit here — no need for a separate line-level query or join, since the requirement is doc-level: "does this task have at least one discrepant line," not a sum across lines.)
4. `count({ where: { ...where, status: 'canceled' } })` → `canceledCount`.
5. `count({ where: { AND: [where, { status: 'counting', createdAt: { lt: threeDaysAgo } }] } })` → `stuckCountingCount`. Combined via `AND`, never object-spread — spread would silently drop nothing here since `where` has no `createdAt` filter today, but `AND` is used anyway for consistency with the other 7 modules' established pattern and to stay correct if a date filter is ever added to this endpoint later.
6. `findFirst({ where: { AND: [where, { createdAt: { not: null } } ] }, orderBy: { createdAt: 'desc' }, select: { title: true, createdAt: true, users: { select: { fullName: true } } } })` → `mostRecentDoc`. The `createdAt: { not: null }` exclusion is mandatory from the start — this is the exact bug class that just caused a production crash across the other 5 modules using `createdAt`, discovered only after shipping. `OpnameDoc`'s creator relation is named `users` (confirmed same default-relation-naming as inbound/outbound/relocation/transfer/returns/putaway — register is the only module with an explicit `createdBy` name).

`percentage` computed identically to the other 7 modules: `totalCount > 0 ? Math.round((count / totalCount) * 1000) / 10 : 0`.

`mostRecent.createdAt` is `mostRecentDoc.createdAt!.toISOString()` — the assertion is safe (query already excludes nulls) and only satisfies TypeScript, exactly as corrected across the other 5 modules.

### Testing

Unit tests for `getSummary()` (mocked Prisma `$transaction`) covering: percentage rounding with a non-trivial fraction (not just 50/50), empty-result nulls (`totalCount: 0` → `mostRecent: null`, empty `statusBreakdown`), the `AND`-combination for `stuckCountingCount`, and — the one new case specific to this module — the `varianceTaskCount` relation-filter query being constructed with `lines: { some: { variance_qty: { not: 0 } } }` and the `findFirst` call excluding `createdAt: null` from the start (a regression test proving this from day one, not discovered after an incident).

## Frontend Design

### Types

New `OpnameSummaryResponse` (and nested `OpnameSummaryStatusCount`/`OpnameSummaryMostRecent`/`OpnameSummaryNeedsAttention`) types, colocated with the existing `OpnameTreeNode` types in `src/views/opname/opnameTree.ts` (or a new `src/views/opname/opnameSummary.ts` if that file is a cleaner home — implementation plan decides). NOT a reuse of `TransactionSummaryResponse` — the shapes genuinely differ (`varianceTaskCount`, `stuckCountingCount`, `title` instead of `docNo`), and forcing a shared type would either bloat it with fields half the callers don't use or require lossy mapping for no benefit.

### API/service layer

- `src/api/feature/opname.api.ts`: add `summary(params: OpnameTreeFilterParams = {})` → `GET /opname/summary`, reusing the existing `OpnameTreeFilterParams` type (`{ companyId?, warehouseId? }`) since the summary endpoint takes the same filter shape as `getTree()`.
- `src/services/opname.service.ts`: add `summary(params)` unwrapping `.data`, typed as `OpnameSummaryResponse`.

### `useOpnameTree.ts` changes

- Gains `summary = ref<OpnameSummaryResponse | null>(null)`, `summaryLoading = ref(false)`, `summaryError = ref<string | null>(null)`, and a `loadSummary()` function mirroring `loadTree()`'s try/catch/finally shape but fully independent state (a summary fetch failure must never clear `tree`/`error`, and vice versa — same isolation contract as the transaction widget).
- `loadSummary()` is called alongside `loadTree()` in exactly two places: inside `refresh()`, and inside the existing `watch([companyId, selectedWarehouseId], ...)` (both its "cleared" early-return branch, where `summary.value` should also reset to `null`, and its normal branch, where it calls `loadTree()` today). `loadSummary()` is NOT triggered by `keyword`/`startDate`/`endDate`/`statusFilter`/`locationFilter` changes — those remain purely client-side filters over the already-loaded tree, per the earlier scope decision.
- New return values: `summary`, `summaryLoading`, `summaryError`.

### `OpnameSummaryWidget.vue` (new component)

Props: `{ loading: boolean; error: string | null; summary: OpnameSummaryResponse | null }` — same shape convention as `TransactionSummaryWidget.vue` (loading/error/data, not derived values), but a distinct component/file since the data shape and card set differ.

5-card grid, `sm:grid-cols-3` (3 cards in the first row, 2 in the second — same responsive breakpoint convention as `TransactionSummaryWidget`'s `sm:grid-cols-2`, just one column wider to fit 5 cards without an awkward lone card on its own row):

1. **Total** — task count, same visual treatment (icon circle + large number) as the transaction widget's Total card.
2. **Status Breakdown** — badge per status + count + percentage. Status-to-tone mapping is Opname-specific (not reusing the other widget's `SUCCESS_STATUSES`/`WARNING_STATUSES`/`ERROR_STATUSES` sets as-is, though the same generic Badge tones are reused): `closed`/`reconciled` → success, `counting`/`draft` → warning, `canceled` → error, unmapped → neutral.
3. **Variance** — `varianceTaskCount`, labeled clearly as "tasks with a discrepancy" so it isn't misread as a monetary or quantity total (it's a count of tasks, per the user's chosen definition — not a sum of variance quantities).
4. **Needs Attention** — same red-when-`count > 0` / green-"All clear"-when-0 pattern as the transaction widget, with breakdown text "N cancelled, M stuck counting >3 days".
5. **Most Recent** — `title`, `createdByName ?? "Unknown"`, formatted `createdAt`; "No tasks yet." when `mostRecent` is `null`.

States: loading (5 skeleton blocks), error (inline message, distinct from the empty state), empty (`summary?.totalCount === 0`, single message "No opname tasks match this warehouse."), populated (the 5-card grid).

### `OpnameTreePage.vue` changes

Renders `<OpnameSummaryWidget :loading="summaryLoading" :error="summaryError" :summary="summary" />` between the existing `<PageHeader>` and the `<Card no-padding object-id="wdg_OpnameTree">`, mirroring exactly where `TransactionSummaryWidget` sits on `TransactionListPage.vue`.

### Testing

- `useOpnameTree.test.ts`: extend with coverage that `loadSummary()` fires alongside `loadTree()` on mount/warehouse-change, that a summary failure doesn't touch `tree`/`error` (and vice versa), and that keyword/date/status/location changes do NOT refetch the summary.
- `OpnameSummaryWidget.test.ts` (new): loading/error/empty/populated states, including both Needs-Attention branches and the Variance card's count display.

## Out of Scope

- Any change to `getTree()`'s own filter capability (still `companyId`/`warehouseId` only) — the summary endpoint deliberately matches this rather than expanding either endpoint to support date/status/location filtering server-side.
- A sum of variance quantities (only a task-level discrepancy count, per the user's explicit choice) — a "total variance value" metric is a plausible future addition but not built here.
- Any change to `OpnameTreeTable.vue`'s existing (incomplete) status-label mapping bug (`reconciled`/`canceled` currently fall through to "Draft" in `statusLabel()`) — noted as a pre-existing gap, out of scope for this widget.
- Group/profile-level rollups (e.g., "3 of 5 tasks in this profile are closed") — the widget summarizes the whole warehouse-scoped tree, not per-node rollups within the tree UI itself.
