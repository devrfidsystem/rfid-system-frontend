# Transaction Summary Widget v2 Design (Backend-Backed Full-Filter Summary)

> Scope: follow-up to `2026-08-05-transaction-summary-widget-design.md` (the client-side-only v1, already shipped). v1 derived its numbers only from the currently-loaded page of rows because no backend aggregation existed. This v2 replaces that client-side derivation with a real backend endpoint so the widget reflects the FULL filtered result set, and adds percentage-per-status, a "most recent transaction" card, and a "needs attention" indicator.

## Goal

Make the Transaction Summary Widget informative across the whole filtered result set (not just one page), and answer three new questions at a glance: what fraction of documents are in each status, what's the latest document, and how many documents need attention right now.

## Background

- v1's own design spec explicitly deferred this ("Cross-page aggregation... would require a new backend endpoint, explicitly deferred") — this spec is that follow-up.
- Backend (`Warehouse-be`, NestJS + Prisma) has 7 doc-type modules — inbound, outbound, relocation, transfer, returns, putaway, register — each with its own controller/service/DTOs following an identical REST pattern (`POST /`, `GET /`, `GET :id`, `PATCH :id`, `POST :id/post`, `POST :id/cancel`; putaway additionally has `POST :id/complete`).
- None of the 7 services has a shared/reusable where-clause builder — each `list()` method inlines its own `Prisma.<Model>WhereInput` construction. Confirmed by direct inspection of `inbound.service.ts`, `outbound.service.ts`, `relocation.service.ts`, `transfer.service.ts`, `returns.service.ts`, `putaway.service.ts`, `register.service.ts`.
- Status vocabulary differs slightly: inbound/outbound/relocation/transfer/returns/register use 3 statuses (`draft`/`posted`/`canceled`); putaway alone has a 4th (`done`, reached via `POST :id/complete`).
- The date field used for each module's own date-range filter also differs: `createdAt` for inbound/outbound/relocation/transfer/returns; `docDate` for putaway and register. This spec reuses whichever field each module already treats as "the" date for filtering — there is no new date semantic introduced.
- Each list filter DTO (`InboundListFilterDto`, etc.) extends the shared `DateRangeFilterDto` (itself extending `PaginationDto`), carrying `dateFrom`/`dateTo`/`companyId`/`warehouseId`/`locationId`/`productId`/`mine`/`postedOnly` plus each module's own `status`/`docNumber`/`search` fields.
- Creator relation: each doc model's Prisma relation to `User` is unnamed and defaults to the relation field name `users` (confirmed on `InboundDoc`; the same default-naming behavior applies to the sibling models since none of them declare an explicit relation name either). `select: { fullName: true }` on that relation gives the creator's display name.
- Response envelope convention (`successResponse`/`paginatedResponse`, `{ success, message, data, meta? }`) and Swagger decorator style (`@ApiBearerAuthProtected()`, `@ApiStandardOkResponse(desc)`, no typed response DTO classes for list/summary/detail endpoints in this codebase) are unchanged from the rest of the backend.

## Backend Design

### `GET /{path}/summary` — added to all 7 controllers

Same base path as each module's existing routes (`/inbound`, `/outbound`, `/relocation`, `/transfer`, `/returns`, `/putaway`, `/register`). Accepts the SAME filter DTO as that module's `GET /` list endpoint (e.g. `InboundListFilterDto`) — `page`/`limit` are present on the DTO (inherited from `PaginationDto`) but simply unused by the summary service method; no new DTO class is created.

**Route ordering constraint:** `@Get('summary')` must be declared before `@Get(':id')` in each controller. NestJS matches routes in declaration order; if `:id` came first, a request to `/inbound/summary` would be captured by the `:id` route and fail `ParseUUIDPipe` with a 400 instead of reaching the summary handler.

Response shape (via `successResponse(summary, '<Type> summary')`):

```ts
{
  totalCount: number;
  statusBreakdown: Array<{
    status: string;       // raw value, e.g. "draft" | "posted" | "canceled" | "done"
    count: number;
    percentage: number;   // count / totalCount * 100, rounded to 1 decimal; 0 when totalCount is 0
  }>;
  mostRecent: {
    docNo: string;               // module's doc-number field (inbound_no, outbound_no, ..., docNumber for putaway/register)
    createdByName: string | null; // from the `users` relation's fullName; null if no creator recorded
    createdAt: string;            // ISO timestamp from whichever date field this module uses (createdAt or docDate)
  } | null;                       // null when totalCount is 0
  needsAttention: {
    count: number;          // canceledCount + staleDraftCount
    canceledCount: number;  // status = 'canceled' within the SAME filtered where clause
    staleDraftCount: number; // status = 'draft' AND date field older than 3 days, within the SAME filtered where clause
  };
}
```

### Service implementation (per module)

1. **Extract** the existing inline `where` construction out of `list()` into a new private method, e.g. `private buildListWhere(query: InboundListFilterDto, user?: RequestUser): Prisma.InboundDocWhereInput`. `list()` calls this method instead of inlining the logic; behavior is unchanged (this is a pure refactor, not a behavior change).
2. **Add** `async getSummary(query: InboundListFilterDto, user?: RequestUser)`:
   - `where = this.buildListWhere(query, user)`
   - Single `this.prisma.$transaction([...])` running: `count({ where })`, `groupBy({ by: ['status'], where, _count: { _all: true } })`, `findFirst({ where, orderBy: { [dateField]: 'desc' }, select: { [docNoField]: true, [dateField]: true, users: { select: { fullName: true } } } })`, `count({ where: { ...where, status: 'canceled' } })`, `count({ where: { ...where, status: 'draft', [dateField]: { lt: threeDaysAgoDate } } })`.
   - `threeDaysAgoDate` is computed once per request as `new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)` — a fixed, documented threshold, not configurable per company/warehouse in this iteration.
   - Assembles the response shape above; `percentage` computed per status bucket as `totalCount > 0 ? Math.round((count / totalCount) * 1000) / 10 : 0`. The `findFirst` result's raw doc-number field (e.g. `inbound_no`, or `docNumber` for putaway/register — see table below) is explicitly renamed to the response's `docNo` key when assembling `mostRecent` — the Prisma field name is never passed through as-is, since it differs per module and the response contract must not.
3. **Controller** adds `@Get('summary')` (before `@Get(':id')`) with `@ApiBearerAuthProtected()`, `@ApiOperation({ summary: 'Get <type> summary' })`, `@ApiStandardOkResponse('<Type> summary')`, `@ApiUnauthorizedResponse()`, `@ApiForbiddenResponse()` — matching the existing decorator style on `list()`. Calls `<type>Service.getSummary(query, user)`, returns `successResponse(summary, '<Type> summary')`.

This is the same shape repeated 7 times with module-specific field names (doc-number field, date field, model name). The doc-number and date-field mapping per module:

| Module | Model | Doc-no field | Date field |
|---|---|---|---|
| inbound | `InboundDoc` | `inbound_no` | `createdAt` |
| outbound | `OutboundDoc` | `outbound_no` | `createdAt` |
| relocation | `RelocationDoc` | `relocation_no` | `createdAt` |
| transfer | `TransferDoc` | `transfer_no` | `createdAt` |
| returns | `ReturnDoc` | `return_no` | `createdAt` |
| putaway | `PutawayDoc` | `docNumber` | `docDate` |
| register | `RegisterDoc` | `docNumber` | `docDate` |

### Testing (backend)

Per module: a unit test for `getSummary()` (mocked Prisma `$transaction`) covering — percentage rounding (including the 0-total case, and a case that doesn't divide evenly, e.g. 1/3), `mostRecent` returning `null` on an empty result set, `needsAttention` correctly summing canceled + stale-draft counts, and confirming the `where` passed to all 5 transaction queries matches what `buildListWhere` produced (proving `list()` and `getSummary()` stay consistent). A unit test for `buildListWhere()` itself (extracted from each module's existing `list()` test coverage — those existing filter-behavior assertions move to target the extracted method directly instead of only exercising it indirectly through `list()`).

## Frontend Design

### API/service layer

- `src/api/feature/transactions.api.ts`: add `summary(key: TransactionKey, params: ReportParams)` → `GET {transactionPaths[key]}/summary`.
- `src/services/transactions.service.ts`: add `transactionService.summary(key, params): Promise<TransactionSummaryResponse>` — the backend response fields (`totalCount`, `statusBreakdown`, `mostRecent`, `needsAttention`) are already camelCase and match the type directly; no normalization step is needed (unlike `normalizeTransactionRecord`, which exists because list/detail rows have inconsistent per-module raw field names — the summary endpoint's response is uniform by construction).
- New type `TransactionSummaryResponse` in `src/views/transactions/types.ts`:
  ```ts
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

### `useTransactionList.ts` changes

- Delete the old client-side-only `useTransactionSummary.ts` composable and its test — v1's derivation (grouping already-loaded `rows` by status, computing a page-scoped date range) is superseded entirely by the backend response; there is nothing left for it to derive once the real aggregate exists.
- `useTransactionList.ts` gains `summary = ref<TransactionSummaryResponse | null>(null)`, `summaryLoading = ref(false)`, `summaryError = ref<string | null>(null)`, and a `loadSummary()` function that calls `transactionService.summary(transactionKey.value, buildParams())` — reusing the exact same `buildParams()` the list already uses, so the summary always reflects identical filters to the table.
- `loadSummary()` is called alongside `loadRows()` in both the `{ immediate: true }` `transactionKey` watcher and the debounced filter watcher (`keyword`/`startDate`/`endDate`/`selectedWarehouse`/`selectedPartner`) and in `refresh()` — same trigger points, run as two independent, non-blocking async calls (not sequential/awaited on each other), each with its own try/catch so a summary failure never blocks or clears the table's rows, and a table failure never blocks or clears the summary.
- Pagination (`page`/`limit` changes) does NOT trigger `loadSummary()` — the summary reflects the full filtered set regardless of which page the table is showing, so paging alone has no effect on it.
- New return values: `summary`, `summaryLoading`, `summaryError`.

### `TransactionSummaryWidget.vue` changes

Props change from the v1 derived-values shape to the fetched-response shape plus its own loading/error:

```ts
defineProps<{
  loading: boolean;   // summaryLoading
  error: string | null; // summaryError
  summary: TransactionSummaryResponse | null;
}>();
```

Layout becomes a 2×2 grid (`sm:grid-cols-2`) of 4 cards:

1. **Total** — unchanged from v1 (icon + `totalCount.toLocaleString()`).
2. **Status Breakdown** — same semantic-tone badge mapping as v1, now reading `percentage` from the response instead of computing a page-scoped one: `{{ item.status }} {{ item.count.toLocaleString() }} ({{ item.percentage.toFixed(1) }}%)`. No "(this page)" qualifier anymore — this genuinely is the full filtered set now, so the label reverts to plain "Status Breakdown".
3. **Most Recent** — new card. Shows `mostRecent.docNo`, `mostRecent.createdByName ?? 'Unknown'`, and `formatDate(mostRecent.createdAt)`. When `mostRecent` is `null` (empty result set), shows "No transactions yet."
4. **Needs Attention** — new card, the one place color carries meaning beyond decoration: `needsAttention.count` rendered large; when `count > 0` the card uses warning/danger tones (red icon circle, red count) and a one-line breakdown ("`{{ canceledCount }}` cancelled, `{{ staleDraftCount }}` pending >3 days"); when `count === 0` it renders a calm "All clear" state in success tones (green check icon, no breakdown line).

States:
- **Loading** (`loading === true`): 4 pulsing skeleton blocks (was 3 in v1), same `animate-pulse` treatment.
- **Error** (`error` set, `loading === false`): a single inline error message card spanning the grid width — this widget can now fail independently of the table (network/backend error on `/summary`), so it needs its own error state distinct from `TransactionListPage.vue`'s existing table-error banner. It does NOT hide the table — only this widget's own area shows the error.
- **Empty** (`summary?.totalCount === 0`, no error): single "No transactions match the current filters." message, same as v1 — `mostRecent`/`needsAttention` are moot at zero rows so they're not rendered separately in this state.
- **Populated**: the 4-card grid described above.

### `TransactionListPage.vue` changes

Passes `summaryLoading`, `summaryError`, and `summary` from `useTransactionList` into `<TransactionSummaryWidget>` instead of the v1 derived `totalCount`/`statusBreakdown`/`dateRange`. The existing `v-if="!error"` gate (hiding the widget when the table's own list-fetch fails) is replaced by rendering the widget unconditionally — it now manages its own error state independently, per the point above, so it no longer needs to hide itself in step with the table's error.

### Testing (frontend)

- `useTransactionList.test.ts`: add coverage that `loadSummary()` fires alongside `loadRows()` on mount and on filter change (not on page/limit change), and that a `transactionService.summary` rejection populates `summaryError` without touching `rows`/`error` (and vice versa for a `transactionService.list` rejection not touching `summary`/`summaryError`).
- `TransactionSummaryWidget.test.ts`: rewritten for the new props — loading (4 skeletons), error, empty, and populated states; populated-state assertions cover percentage formatting, the Most-Recent card's three fields, and both Needs-Attention branches (count > 0 red state, count === 0 green "All clear" state).
- Delete `useTransactionSummary.test.ts` (composable being deleted).

## Out of Scope

- Configurable staleness threshold (the 3-day constant is fixed code, not a per-company/warehouse setting).
- Opname and `TransactionDetailPage.vue` — unchanged, consistent with v1's scope decision.
- Any change to the `list()`/`GET /:id`/`post`/`cancel` endpoints' existing behavior beyond the internal `buildListWhere` extraction (which is behavior-preserving).
- A shared cross-module summary endpoint or module — each of the 7 modules gets its own `getSummary()`, consistent with the backend's existing per-module REST convention (no shared where-builder existed before this either).
- Real-time/polling refresh of the summary (it refetches on filter change and explicit Refresh, same cadence as the table — no interval polling).
