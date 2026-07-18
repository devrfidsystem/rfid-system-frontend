# Dashboard Executive Summary Enhancement Design

> Scope: sub-project 1 of 4 in the "Operational Intelligence Platform" dashboard enhancement, based on the attached `Alir Smart System — Operational Intelligence Platform.html` mockup. Covers only the existing `/dashboard/overview` page. The mockup's other three pages (Executive KPI, Process Performance, Monitoring) are separate follow-up sub-projects.

## Goal

Fill in the three dashboard sections already stubbed in `useDashboard.ts` (`alerts`, `workflow`, `kpi`) with real, backend-driven content, following the visual language and information structure of the mockup's "Page 1: Executive Summary", adapted to the app's existing Tailwind-based design system rather than the mockup's standalone CSS.

## Background

`DashboardPage.vue` currently renders only section headings with no body content — the previous implementation was stripped in commit `ce3a712`. The mockup defines three sections for this page:

1. **Operations Alert Center** — severity-tagged alerts (critical/warning/info) with business impact and recommended action text.
2. **Business Workflow Overview** — per-document-type pipeline showing stage counts, wait time, trend, and bottleneck.
3. **Executive KPI Snapshot** — composite 0–100 scores per operational domain with sub-metrics and trend sparklines.

None of these three are backed by existing backend data. Backend exploration of `Warehouse-be` found:

- No `PurchaseOrder`/`SalesOrder` models — `InboundDoc` (draft→posted→canceled) and `PutawayDoc` (draft→posted→done/canceled) stand in for the inbound/PO side; `OutboundDoc` (draft→posted→canceled) stands in for the outbound/SO side. There is no separate "picking" stage as a status value.
- No status-history table — every doc has a single mutable `status` column, so stage wait-time and trend-vs-previous-period cannot be reconstructed for existing data.
- `StockLedger` already has full timestamped movement history, usable for real KPI trend calculations today.
- No RFID reader/device concept exists in the schema — the mockup's "RFID Reader Offline" alert has no real data source and is dropped, with no substitute.
- No cron/scheduling infrastructure exists; all dashboard aggregation is computed on request, and the new endpoints follow the same synchronous pattern.
- `opname` module already tracks `system_qty`/`counted_qty`/`variance_qty` on `OpnameLine`, usable for inventory accuracy alerts and KPI scoring.

## Backend Design

### New table: `DocStatusHistory`

```
DocStatusHistory {
  id          String   @id @default(uuid())
  docType     String   // 'inbound' | 'outbound' | 'putaway' | 'opname'
  docId       String
  companyId   String
  warehouseId String
  fromStatus  String
  toStatus    String
  changedAt   DateTime @default(now())
}
```

Populated by adding a write alongside each existing `status:` update in `inbound.service.ts`, `outbound.service.ts`, `putaway.service.ts`, and `opname-mutation.service.ts` (the transitions already identified: `draft→posted`, `draft→posted→canceled`, `draft→posted→done/canceled`, `draft→counting→reconciled→closed/canceled`). No backfill of historical status changes — trend and wait-time figures that depend on this table report an explicit "insufficient data" state until at least 7 days of history accumulate for a given warehouse/doc type.

### `GET /dashboard/alerts`

Computed on-demand, scoped by `companyId`/`warehouseId` like the existing dashboard endpoints. Alert types, all backed by real, currently-queryable data:

- **Critical** — stock items below minimum (reuses existing `lowStock` severity `critical` logic).
- **Warning** — Inbound docs `posted` awaiting Putaway completion, count elevated vs the trailing-7-day average (falls back to a plain current count, without a trend claim, when `DocStatusHistory` has insufficient data).
- **Warning** — Outbound docs sitting in `draft`/`posted` longer than a configurable age threshold (default 24h).
- **Warning** — Opname accuracy: `variance_qty`/`system_qty` ratio trending up across recent `OpnameDoc` closures vs the prior period.
- **Info** — a general status entry when no higher-severity alert triggers, so the section is never empty.

Response shape: `{ severity, title, tag (warehouse name), category (doc type), summary, businessImpact, recommendedAction, docRef, occurredAt }[]`, plus `counts: { critical, warning, info }` for the header chips.

### `GET /dashboard/workflow-overview`

Two panels reflecting the real document lifecycle (not a generic "PO/SO" pipeline):

- **Inbound & Putaway Workflow** — stage breakdown across Inbound (`draft`, `posted`) and Putaway (`draft`, `posted`, `done`); `completionRate = done / total`; `bottleneck` = the stage with the highest count or longest average dwell time.
- **Outbound Workflow** — stage breakdown across Outbound (`draft`, `posted`, `canceled`); same completion-rate and bottleneck logic.

Per stage: `{ name, count, pctOfOpen, avgWait (nullable until history sufficient), trend (nullable until history sufficient) }`. Panel-level KPIs: open count, average cycle time (from `DocStatusHistory` once available, else null), completion rate, bottleneck stage name.

### `GET /dashboard/kpi-snapshot`

Three domain score cards — Stock In Performance, Inventory Performance, Stock Out Performance — each `{ score (0-100), trendVsPrevious, subMetrics: [{label, value}], sparkline: number[] }`. Scores are a weighted average of sub-metrics computable today:

- **Stock In**: inbound throughput and cycle-time-improvement from `StockLedger`.
- **Inventory**: accuracy from `OpnameLine` variance ratio, plus stock turnover from `StockLedger`.
- **Stock Out**: outbound throughput and cycle-time-improvement from `StockLedger`.

Trend-vs-previous-period is real (not "insufficient data") because `StockLedger` already carries full history.

### Conventions

New endpoints follow existing patterns: `PaginationDto`-derived query DTOs, `successResponse`/`paginatedResponse` envelope, `SupabaseAuthGuard` (no `@Public()`), manual `companyId`/`warehouseId` where-clause scoping, `PrismaService` injection with typed `Prisma.*WhereInput`.

## Frontend Design

### Visual approach

Match the app's existing Tailwind design system (`Card`, `Icon`, existing color tokens like `primary-600`/`workspace-bg`) as used in `DashboardOverview.vue` and `DashboardSummaryCards.vue`, not the mockup's standalone CSS (dark sidebar, custom `--critical`/`--warning` variables). The mockup is followed for information structure and interaction (severity badges, business-impact/recommended-action fields, stage pipeline, KPI score card with sparkline), not for raw styling.

### New components

- `DashboardAlertCenter.vue` — severity filter chips (All/Critical/Warning/Info) + alert cards (severity icon, title, warehouse/category tags, summary, business impact, recommended action, "View Detail" link to the source document), following the pattern already used in `DashboardLowStockSection.vue`.
- `DashboardWorkflowOverview.vue` — two panels (Inbound & Putaway, Outbound), each with a KPI row (Open, Avg Cycle Time, Completion Rate, Bottleneck) and a horizontal stage pipeline (count, % of open, wait, trend per stage), rendering an explicit "Insufficient data yet" state for wait/trend fields when the backend returns null.
- `DashboardKpiSnapshot.vue` — 3-column grid of score cards (score/100, trend badge, 2 sub-metrics, small inline SVG sparkline — no Chart.js dependency needed). "View Performance" links to the Executive KPI detail page from sub-project 2; until that page exists, the link is disabled/inert.

### Composable

Extend `useDashboard.ts` with `alertsData`, `workflowData`, `kpiSnapshotData` refs and matching loading/error state, wired to three new `dashboard.service.ts` methods, following the exact pattern already used for `lowStockData`/`epcStatusData`.

### Testing

Unit tests for the composable (mocked service responses covering populated/empty/error states) and component tests per new component covering loading/empty/populated/"insufficient data" states, following the existing pattern in `DashboardPage.test.ts`.

## Out of Scope

- The mockup's Executive KPI, Process Performance, and Monitoring pages (separate sub-projects).
- The pre-existing `fetchHeatmap` frontend call with no backend endpoint (unrelated gap, noted but not fixed here).
- Backfilling historical `DocStatusHistory` data for documents created before this change ships.
- Any RFID reader/device monitoring (no data source exists).
