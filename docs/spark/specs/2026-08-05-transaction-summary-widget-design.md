# Transaction Summary Widget Design

## Goal

Add an informative summary widget to each generic Transaction list page (register, inbound, putaway, outbound, relocation, transfer, return/returns), giving an at-a-glance view of the transactions on that page without any new backend call.

## Background

- The Transaction group's list pages all share `TransactionListPage.vue`, parameterized by `transactionKey`, backed by `useTransactionList.ts` (`src/views/transactions/composables/useTransactionList.ts`).
- No backend endpoint returns aggregated stats scoped to a single transaction type. The only aggregation endpoints that exist (`/dashboard/doc-counts`, `/dashboard/stock-summary`, `/dashboard/workflow-overview`) are dashboard-wide, not filterable to one `transactionKey`/page's current filters — using them here would show numbers inconsistent with what the user is actually looking at on the list page.
- The only data honestly available client-side is: `pagination.total` (the filtered count returned by the backend for the current query) and the rows currently loaded on the page (bounded by `pagination.limit`, so at most one page's worth of rows).
- Every transaction type's `reportConfig.ts` column set includes a `status` column, confirmed by inspection — so a generic group-by-status works uniformly across all 7 transaction keys with no per-type label mapping.
- Opname has its own tree-based pages (`OpnameTreePage.vue`, etc.) and its own API/service layer; it is explicitly out of scope for this enhancement. `TransactionDetailPage.vue` is also out of scope — this widget is list-page only.

## Frontend Design

### New composable: `useTransactionSummary.ts`

Location: `src/views/transactions/composables/useTransactionSummary.ts`.

Kept separate from `useTransactionList.ts` (already ~450 lines) to stay isolated and independently testable. Takes the already-loaded state as input rather than fetching anything itself:

```ts
function useTransactionSummary(
    rows: Ref<TransactionRecord[]>,
    pagination: { total: number },
);
```

Returns three `computed()` values, re-derived whenever `rows`/`pagination.total` change:

- `totalCount: ComputedRef<number>` — `pagination.total`.
- `statusBreakdown: ComputedRef<{ label: string; count: number }[]>` — groups the currently-loaded `rows` by their raw `status` value (rows missing a `status` are excluded, not bucketed as "unknown"). No per-`transactionKey` label mapping; the raw value is shown as-is.
- `dateRange: ComputedRef<{ earliest: string | null; latest: string | null }>` — min/max of `date` (falling back to `createdAt`) among currently-loaded rows with a parseable date; `null`/`null` if none.

This composable has no loading/error state of its own — it is a pure derivation over `useTransactionList`'s existing state.

### New component: `TransactionSummaryWidget.vue`

Location: `src/views/transactions/components/TransactionSummaryWidget.vue`.

Follows the existing dashboard stat-card convention (`ProcessMetricCards.vue`): a `grid` of `Card`s with a loading skeleton and an empty state, using the same Tailwind tokens already in use elsewhere in this view (`text-text-muted`, `text-text-secondary`, etc.).

Props:

```ts
{
    loading: boolean;
    totalCount: number;
    statusBreakdown: {
        label: string;
        count: number;
    }
    [];
    dateRange: {
        earliest: string | null;
        latest: string | null;
    }
}
```

Layout — three cards:

1. **Total** — `totalCount`, formatted with the existing `formatDate`-style number formatting already used elsewhere (plain `toLocaleString()`, no new dependency).
2. **Status Breakdown (this page)** — small list/badge per status label + count, reusing the existing `Badge` atom (`src/components/atoms/Badge.vue`) for each status pill. Labeled "(this page)" for the same reason as the Date Range card below: `totalCount` reflects the full filtered/paginated result set, but the breakdown only covers the currently-loaded rows, so the two numbers won't sum together on any result set larger than one page — the label prevents that from reading as a bug.
3. **Date Range (this page)** — `earliest`–`latest`, formatted via the existing `formatDate` util (`src/utils/date.ts`); explicitly labeled as covering only the currently-loaded rows, not the full filtered result set, so it isn't mistaken for a global range.

States:

- **Loading** — three pulsing skeleton blocks, same visual treatment as `ProcessMetricCards.vue`'s loading branch.
- **Empty** (`totalCount === 0`) — single-message card: "No transactions match the current filters." (no stat cards rendered).
- **Error** — the widget is not rendered at all when `useTransactionList`'s `error` is set; `TransactionListPage.vue` already renders its own error banner, and showing stat cards derived from stale/cleared `rows` alongside an error would be misleading.

`object-id="wdg_TransactionSummary"` on the root element, per this codebase's existing `object-id` convention (see `wdg_TransactionList`, `wdg_TransactionDetailInfo`, etc.).

### Wiring into `TransactionListPage.vue`

- `useTransactionList` does not currently expose the raw `rows` ref, only `displayRows` (post-formatted table rows) and `pagination`. `useTransactionList.ts` will export `rows` (already an internal `ref`) alongside its existing return values, since the summary composable needs the raw `TransactionRecord[]` (with a real `status`/`date`/`createdAt`), not the stringified `displayRows` table cells.
- `TransactionListPage.vue` calls `useTransactionSummary(rows, pagination)` and renders `<TransactionSummaryWidget>` between the existing `PageHeader` and the `Card` that wraps `TransactionHeader`/`TransactionTable`, gated on `!error`.

### Testing

Following this codebase's colocated-`.test.ts` convention (see `useTransactionList.test.ts`, `ProcessMetricCards.test.ts`):

- `useTransactionSummary.test.ts` — covers status grouping (including rows missing `status`), date range derivation (including empty/unparseable dates), and total passthrough.
- `TransactionSummaryWidget.test.ts` — loading, empty, and populated render states.
- `TransactionListPage.vue` itself has no existing colocated test; this enhancement does not add one, consistent with the current absence of page-level tests for it (only its composables and sub-components are tested).

## Out of Scope

- `TransactionDetailPage.vue` and the Opname pages — not touched by this enhancement (per explicit scope decision).
- Any new backend endpoint or per-transaction-type aggregation — the widget only reflects the currently-loaded page of rows and the existing paginated total.
- Per-`transactionKey` status label mapping/vocabulary — status is shown generically, as its raw value.
- Cross-page aggregation (e.g., status breakdown across all filtered results, not just the current page) — would require a new backend endpoint, explicitly deferred.
