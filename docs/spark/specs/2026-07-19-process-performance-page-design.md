# Process Performance Page Design

> Scope: sub-project 3 of 4 in the "Operational Intelligence Platform" dashboard enhancement (sub-projects 1-2, Executive Summary and Executive KPI, are done). Covers the new `/dashboard/process` page only. Monitoring remains a separate future sub-project.

## Goal

Build the Process Performance page from the mockup's "Page 3: Process Performance" — an activity-level drill-down (Receiving, Putaway, Outbound, Transfer, Relocation, Stock Opname) showing cycle time, productivity, supporting metrics, trend over time, hourly transaction distribution, warehouse comparison, and operator ranking — backed by real data, following the app's existing Tailwind design system.

## Background

Executive KPI (already shipped) provides domain-level drill-down (Stock In / Inventory / Stock Out) with warehouse comparison and contributor breakdown. This page goes one level deeper: per-activity detail within each domain.

Data-availability investigation surfaced several gaps between the mockup and what the backend schema actually supports:

- **Picking and Packing have no backing model or status stage.** `OutboundDoc` is a single flat status progression (draft → posted → canceled) with no distinct Picking/Packing sub-stages. Per the user's decision, the stockOut domain is represented as a single **"Outbound"** activity instead of the mockup's three (Picking, Packing, Shipping) — 6 activities total instead of 8.
- **No "Shift" concept exists anywhere in the schema** (no model, no field on any doc or on `User`). Per the user's decision, the mockup's "Shift Comparison" panel is dropped entirely — no pseudo-shift derivation.
- **Operator Ranking has no "who completed this" data** — only `createdById` exists on transaction docs (who created it, not necessarily who performed/finished the work). Per the user's decision, this accepted limitation is used anyway and documented as an explicit simplification (same category of accepted constraint as the Putaway/DocStatusHistory dependency in prior sub-projects).
- **`DocStatusHistory` (real transition-time tracking) is wired only for inbound/outbound/putaway/opname**, not Transfer or Relocation. Per the user's decision, Transfer and Relocation's "queue time" uses a plain `updatedAt - createdAt` proxy instead of extending `DocStatusHistory` wiring to two more services.
- Per the user's decision, the mockup's Zone, Product Category, and Shift filters are dropped (no backing data, or explicitly out of scope); a **Date Range filter is kept**, implemented as a fixed **Week / Month preset** toggle (not a custom date picker).

## Backend Design

### `GET /dashboard/process-detail?activity=receiving|putaway|outbound|transfer|relocation|opname&period=week|month`

New endpoint, new `DashboardProcessDetailService` (separate file, following the same "new service per drill-down page" convention established by `DashboardKpiDetailService`). Response:

```
{
  activity: 'receiving' | 'putaway' | 'outbound' | 'transfer' | 'relocation' | 'opname',
  domain: 'stockIn' | 'stockOut' | 'inventory',
  label: string,                       // "Receiving"
  cycleTime: { minutes: number; previousMinutes: number; trendPct: number },
  productivity: { unitsPerHour: number; previousUnitsPerHour: number; trendPct: number },
  supportingMetrics: {
    completedTransactions: number;
    avgDailyVolumeUnits: number;
    avgQueueTimeMinutes: number;       // real DocStatusHistory-based for receiving/putaway/outbound/opname; updatedAt-createdAt proxy for transfer/relocation
  },
  trend: { period: string; cycleTimeMinutes: number; productivityUnitsPerHour: number }[],  // 8 points; weekly windows if period=week, monthly windows if period=month
  hourlyDistribution: { hour: number; count: number }[],  // 24 entries, 0-23, derived from createdAt hour-of-day across the window
  warehouseComparison: {
    top: { warehouseId: string; warehouseName: string; score: number }[];    // top 3
    bottom: { warehouseId: string; warehouseName: string; score: number }[]; // bottom 3
  },
  operatorRanking: { userId: string; userName: string; score: number }[],   // top 5, see scoring formula below
}
```

### Activity → domain mapping and backing model

| Activity | Domain | Model | Notes |
|---|---|---|---|
| Receiving | stockIn | `InboundDoc` | |
| Putaway | stockIn | `PutawayDoc` | Known accepted dependency on the user's uncommitted Putaway WIP, same as Executive Summary/KPI |
| Outbound | stockOut | `OutboundDoc` | Replaces mockup's Picking/Packing/Shipping — one activity, one real model |
| Transfer | inventory | `TransferDoc` | Queue time uses `updatedAt - createdAt` proxy |
| Relocation | inventory | `RelocationDoc` | Queue time uses `updatedAt - createdAt` proxy |
| Stock Opname | inventory | `OpnameDoc`/`OpnameLine` | |

### Cycle time & productivity

Reuses the existing `cycleStats`-style computation (`updatedAt - createdAt` averaged per doc, cross-checked against `StockLedger` quantity for units/hour) already established in `DashboardKpiDetailService`, extended to cover all 6 activities (only Receiving/Putaway/Stock Out/Stock Opname are covered today). `trendPct` is computed the same way as Executive KPI's `trendVsPrevious`, via the existing percentage-change helper in `dashboard-kpi.util.ts`.

### Supporting metrics

- `completedTransactions`: count of completed docs for the activity in the window.
- `avgDailyVolumeUnits`: total ledger/line quantity in the window divided by days in the window.
- `avgQueueTimeMinutes`: for receiving/putaway/outbound/opname, computed from `DocStatusHistory` transition timestamps (time between the first and last recorded status change), consistent with the existing pattern; for transfer/relocation, the `updatedAt - createdAt` proxy documented above.

### Trend & hourly distribution

`trend` extends the existing 8-point windowing pattern from Executive KPI (`windowBounds`), parameterized on granularity (`week` → 8 weekly windows, `month` → 8 monthly windows) instead of hardcoded to weekly. `hourlyDistribution` is net-new: groups all in-window docs by `createdAt` hour-of-day (0-23, local server time) and counts them.

### Warehouse comparison

Reuses `DashboardKpiDetailService`'s existing idle-exclusion ranking logic unchanged (warehouses with zero activity in the window are excluded from ranking entirely, not scored as 0), applied to whichever model backs the selected activity.

### Operator ranking (net-new)

Groups the activity's docs by `createdById` within the window. For each operator:
- `throughputScore = (operator.completedCount / maxCompletedCountAmongPeers) × 100`
- `speedScore = (fastestAvgCycleTimeAmongPeers / operator.avgCycleTime) × 100`, capped at 100
- `score = round((throughputScore + speedScore) / 2)`

Both sub-scores are relative to peers performing the same activity in the same window (not an absolute scale). Top 5 operators by `score`, joined against `User` for display name. Documented explicitly as approximating "who created the most documents, fastest" rather than verified task completion — the same category of accepted simplification as the Executive KPI's Stock In contributor split.

### Conventions

Same as prior dashboard endpoints: `successResponse(data)`, `@ApiBearerAuthProtected()` + `@ApiStandardOkResponse(...)`, manual `companyId`/`warehouseId` scoping, computed synchronously per request (no cron).

## Frontend Design

### Route & page

`/dashboard/process` (route already exists, currently pointing at the `PageShell` placeholder — this sub-project replaces that with the real page). New `src/views/dashboard/ProcessPerformancePage.vue` + `src/views/dashboard/composables/useProcessPerformance.ts`.

### Composable

`useProcessPerformance.ts`: `activity` ref (`'receiving' | 'putaway' | 'outbound' | 'transfer' | 'relocation' | 'opname'`, default `'receiving'`), `period` ref (`'week' | 'month'`, default `'week'`), `data`/`loading`/`error` refs, `setActivity()`/`setPeriod()` methods that both re-fetch via a new `dashboardService.fetchProcessDetail(activity, period, filter)` method mirroring the existing `fetchKpiDetail` layering.

### Components

- `ProcessActivityPicker.vue` — new, 6-item picker grouped by domain, same interaction pattern as `KpiDomainTabs.vue`.
- `ProcessMetricCards.vue` — new, 2 big metric cards (Cycle Time, Productivity) with trend arrows, same visual language as `KpiDomainHero.vue`'s score card.
- `KpiSupportingMetrics.vue` — **reused as-is** (already accepts a generic `{label, value}[]` shape); `supportingMetrics` is mapped into that shape.
- `ProcessTrendChart.vue` — new, inline SVG dual-line (cycle time + productivity) over 8 points, same no-charting-library technique as the KPI page's timeline.
- `ProcessHourlyHeatmap.vue` — new, 24-cell grid, intensity via Tailwind opacity utility classes on a verified-real color token (no inline hex/rgba styles).
- `KpiWarehouseComparison.vue` — **reused as-is** (prop shape `{top, bottom}` of `{warehouseId, warehouseName, score}` is identical).
- `ProcessOperatorRanking.vue` — new (different entity — operators, not warehouses — so not forced into the warehouse component), same rank-list visual pattern.

All new components take `{ loading: boolean; data: ... | null }` props, following the established convention. Color tokens must be verified against `tailwind.config.ts` (and, given the `KpiDomainHero` incident, cross-checked against actual compiled CSS) before use — confirmed-dead tokens: `bg-workspace-bg`, `border-border-default`, `text-action-orange`, `text-signal-red`, `text-text-tertiary`, `bg-primary-light`, bare `text-secondary`, bare `text-muted`. The real forms are `text-text-secondary`/`text-text-muted`.

### Testing

Backend: unit tests for the new service (mocked Prisma) covering all 6 activities, the idle-exclusion warehouse ranking rule (reused, spot-checked for this endpoint), the operator-ranking score formula, and the week/month period parameterization. Frontend: SSR render tests per new component (loading/empty/populated states) plus a composable test for activity-switch and period-switch re-fetching, following the exact patterns established in Executive KPI.

## Out of Scope

- Zone, Product Category, and Shift filters (no backing data, or explicitly dropped per user decision).
- Picking/Packing as distinct activities (merged into a single "Outbound" activity — no backing model exists).
- A custom date-range picker (fixed Week/Month presets only).
- Extending `DocStatusHistory` wiring to Transfer/Relocation (proxy queue time used instead).
- Real-time updates (page fetches once per activity/period switch, no polling).
