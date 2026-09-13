# Executive KPI Page Design

> Scope: sub-project 2 of 4 in the "Operational Intelligence Platform" dashboard enhancement (sub-project 1, Executive Summary, is done). Covers the new `/dashboard/kpi` page only. Process Performance and Monitoring remain separate future sub-projects.

## Goal

Build the Executive KPI page from the mockup's "Page 2: Executive KPI" — a domain drill-down (Stock In / Inventory / Stock Out) explaining _why_ a KPI score changed: hero score + timeline, per-warehouse ranking, sub-process contribution breakdown, and supporting metrics — backed by real data, following the app's existing Tailwind design system.

## Background

Task 9 (already shipped) built `GET /dashboard/kpi-snapshot` for the Executive Summary's compact 3-card view: one current score + one 6-week qty sparkline per domain, no per-warehouse breakdown, no sub-process contribution, no true historical score timeline. This page needs richer, domain-scoped detail, so it gets its own endpoint rather than reusing `kpi-snapshot`.

As with Executive Summary, "Main Contributors" for the Stock In domain (Receiving vs Putaway) depends on the `PutawayDoc` model and `DocStatusHistory` wiring, both of which exist only in the user's own uncommitted Putaway work-in-progress. Per the user's explicit decision, this is accepted as the same known dependency-ordering constraint already documented for Executive Summary — this sub-project is built against the current working tree as-is.

## Backend Design

### `GET /dashboard/kpi-detail?domain=stockIn|inventory|stockOut`

New endpoint, new `DashboardKpiDetailService` (separate file from `DashboardKpiService`, which stays as-is for `kpi-snapshot`). Response:

```
{
  domain: 'stockIn' | 'inventory' | 'stockOut',
  label: string,                       // "Stock In Performance"
  derivedFrom: string,                 // "Receiving and Putaway"
  score: number,                       // current period, 0-100
  previousScore: number,
  trendVsPrevious: number,             // pt change, current - previous
  timeline: { period: string, score: number }[],  // last 8 weekly periods, oldest first
  warehouseComparison: {
    top: { warehouseId: string; warehouseName: string; score: number }[];   // top 3
    bottom: { warehouseId: string; warehouseName: string; score: number }[]; // bottom 3
  },
  contributors: { label: string; pct: number }[],  // sums to ~100
  supportingMetrics: { label: string; value: string }[],
}
```

### Score & timeline

Reuses the pure scoring functions from `dashboard-kpi.util.ts` (`computeThroughputScore` for Stock In/Stock Out, `computeInventoryScore` for Inventory) unchanged. `timeline` is produced by evaluating the same score formula over 8 consecutive weekly windows (extending the existing `windowBounds`/sparkline-window pattern from `dashboard-kpi.service.ts` from 6 to 8 points) — each point is a real computed score for that week, not a raw quantity like the existing `kpi-snapshot` sparkline.

### Per-warehouse ranking

New helper: for each `Warehouse` row scoped to the request's `companyId`, compute the same domain score using that warehouse's `warehouseId` as an additional filter on the existing throughput/inventory queries (the queries already accept an optional `warehouseId`). Sort descending, take top 3 and bottom 3 (fewer than 6 warehouses: bottom list excludes any warehouse already in top). Warehouses with no activity in the current window are excluded from ranking (not scored as 0, to avoid misleadingly ranking an idle warehouse as "worst").

### Contributors & supporting metrics (per domain)

- **Stock In**: contributors = `[{label: 'Receiving', pct}, {label: 'Putaway', pct}]`, split by relative `StockLedger` throughput (`movementType: 'inbound'`) vs `PutawayDoc` completed-in-window count, normalized to sum to 100. Supporting metrics: avg cycle time (hours) and productivity (units/hour) for each of Receiving and Putaway, using the same `createdAt`/`updatedAt` and `StockLedger` qty approach as Task 9's `avgCycleTimeHours`.
- **Stock Out**: contributors = `[{label: 'Outbound', pct: 100}]` (schema has no further sub-stage). Supporting metrics: avg cycle time and productivity for Outbound only.
- **Inventory**: contributors = `[{label: 'Accuracy', pct}, {label: 'Turnover', pct}]`, weighted 50/50 (no natural throughput split exists between these two conceptually different metrics — an even split is an explicit, documented simplification). Supporting metrics: accuracy % (from `OpnameLine` variance ratio) and turnover rate (from `StockLedger` outbound qty / avg `StockBalance`), reusing Task 9's existing calculations.

### Conventions

Same as prior dashboard endpoints: `successResponse(data)`, `@ApiBearerAuthProtected()` + `@ApiStandardOkResponse(...)`, manual `companyId`/`warehouseId` scoping, computed synchronously per request (no cron).

## Frontend Design

### Route & page

`/dashboard/kpi` (route already exists from the sidebar sub-project, currently pointing at the `PageShell` placeholder — this sub-project replaces that with the real page). New `src/views/dashboard/ExecutiveKpiPage.vue` + `src/views/dashboard/composables/useExecutiveKpi.ts` (separate composable from `useDashboard.ts`, since this page has its own domain-tab state and doesn't share the Executive Summary's warehouse-filter toolbar model at this stage — the page's own warehouse filter, if any, is out of scope for this iteration and can reuse the existing `WarehouseFilterSelect.vue` later).

### Components

- `KpiDomainTabs.vue` — the 3-tab selector (Stock In / Inventory / Stock Out), plain local state, no routing per tab (single page, tab switches which `domain` query param is fetched).
- `KpiDomainHero.vue` — score/100, trend, current vs previous period numbers, "Derived from X and Y" text, and the 8-point timeline as an inline SVG polyline (same technique as `DashboardKpiSnapshot.vue`'s sparkline — no charting library).
- `KpiWarehouseComparison.vue` — two ranked lists (Top Performing / Needs Attention), each row: rank badge, warehouse name, score.
- `KpiContributors.vue` — horizontal bar per contributor with label + pct, matching the mockup's `contrib-bar` visual intent using existing Tailwind tokens.
- `KpiSupportingMetrics.vue` — a small grid of label/value metric cards, reusing the existing `Card` pattern.

All five components take `{ loading: boolean; data: ... | null }` props, following the established convention. Color tokens must be verified against `tailwind.config.ts` before use (per the recurring dead-class issue found in sub-project 1) — no `bg-workspace-bg`/`border-border-default`/`text-action-orange`/`text-signal-red`/`text-text-tertiary`/`bg-primary-light`.

### Composable

`useExecutiveKpi.ts`: `domain` ref (`'stockIn' | 'inventory' | 'stockOut'`, default `'stockIn'`), `data`/`loading`/`error` refs, `fetchKpiDetail()` re-fetches on domain change (watch), using a new `dashboardService.fetchKpiDetail(domain, filter)` method and matching `dashboardApi.fetchKpiDetail` endpoint call, mirroring the existing service/api layering.

### Testing

Backend: unit tests for the new service (mocked Prisma) covering all three domains, plus a focused test for the warehouse-ranking exclusion-of-idle-warehouses rule and the Stock Out single-contributor (100%) case. Frontend: SSR render tests per component (loading/empty/populated states) plus a composable test for domain-switch re-fetching, following the exact patterns established in sub-project 1.

## Out of Scope

- A page-level warehouse filter (the mockup's top filterbar) — deferred; the endpoint accepts `warehouseId` but the page doesn't expose a selector yet.
- "View Activity Detail" button's target page (not part of this mockup page, no destination exists yet) — rendered as a disabled/inert button, same treatment as Executive Summary's KPI Snapshot "View Performance" link.
- Real-time updates (page fetches once per domain switch, no polling).
