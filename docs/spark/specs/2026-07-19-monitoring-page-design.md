# Monitoring Page Design

> Scope: sub-project 4 of 4 (final) in the "Operational Intelligence Platform" dashboard enhancement (sub-projects 1-3 — Executive Summary, Executive KPI, Process Performance — are done). Covers the new `/dashboard/monitoring` page only.

## Goal

Build the Monitoring page from the mockup's "Page 4: Monitoring" — a real-time-feeling command center showing per-domain health (Stock In / Stock Out / Inventory) and a live RFID event feed — backed by real data, following the app's existing Tailwind design system.

## Background

Data-availability investigation surfaced several gaps between the mockup and what the backend schema actually supports:

- **Zone/dock concept exists** via the `Location` model (hierarchical, per-warehouse `code`/`name`/`path`), already referenced by every doc line type. Usable for the mockup's "Zone"/"Dock" labels.
- **RFID event logging is fully functional**, contrary to appearances from the frontend's own uncommitted work: `EpcEvent` (table `epc_events`) is actively written by `rfid.service.ts`/`rfid-log.service.ts` on register/encode/assign/unassign/retire/status-change/move_in/move_out. The deleted `RfidAssignmentPage.vue`/`RfidEventPage.vue` files in the user's separate uncommitted work do not reflect a backend deprecation — the "Live Transactions" feed can be built from real `EpcEvent` data.
- **No "Priority" field exists anywhere.** Per the user's decision, priority (HIGH/MED/LOW) is derived from each event's age at fetch time: **<5 min = low, 5-15 min = med, >15 min = high** — an explicit, documented simplification (not real business-assigned priority).
- **SLA/deadline data exists only for `OutboundDoc.deadlineAt`** — no equivalent field on Inbound/Putaway/Transfer/Relocation/Opname. Per the user's decision, the SLA progress bar is shown **only for event rows tied to an Outbound doc with a `deadlineAt`**; all other rows render no SLA bar (not a fabricated one).
- **No dedicated "exception"/failed-transaction concept exists.** Per the user's decision, "Exceptions" is approximated as the count of documents with status `canceled` in the window — an explicit, documented simplification, same category as prior accepted constraints (Putaway/DocStatusHistory dependency, `createdById` operator attribution, etc.).
- **Most document types have only 3 statuses** (`draft` → `posted`/`canceled`) with no distinct "in progress" state separate from "queued" or "done" — only Putaway (`done`) and Opname (`counting`/`reconciled`/`closed`) have intermediate states. Per the user's decision, the mockup's 4-stat grid (Active Tasks / Current Queue / Completed Today / Pending) is reduced to **3 stats, consistently derivable across all three domains: Current Queue (`draft` count), Completed Today (terminal status, updated today), and Exceptions (`canceled` count)**. "Active Tasks" and "Pending" are dropped rather than shown as always-zero for domains lacking an intermediate state.
- **No polling/WebSocket infrastructure exists anywhere in the frontend.** Per the user's decision, the "LIVE" feel is approximated with a **20-second `setInterval` poll** while the page is mounted (cleared on unmount) — the first such infrastructure in this app, built at the composable level with no new dependency.
- The mockup's in-progress task list (e.g. "Receiving PO-4471" at "Dock 02") is repurposed to show the most recent **queued (`draft`) documents** per domain, since there's no separate "active" state to distinguish from "queued" for most doc types.

## Backend Design

### `GET /dashboard/monitoring`

New endpoint, new `DashboardMonitoringService` (separate file, following the same "new service per page" convention established by `DashboardKpiDetailService`/`DashboardProcessDetailService`). Unlike the two prior drill-down pages, this endpoint takes no `domain`/`activity` parameter — it returns all three domains plus the live feed in one response, since the page shows everything at once:

```
{
  domains: {
    stockIn: DomainHealth,
    stockOut: DomainHealth,
    inventory: DomainHealth,
  },
  liveTransactions: LiveTransactionRow[],
}

DomainHealth = {
  label: string,                // "Stock In"
  health: 'nominal' | 'warning' | 'critical',
  queueCount: number,            // status 'draft', across the domain's doc type(s)
  completedTodayCount: number,   // terminal status (posted/done/closed), updatedAt = today
  exceptionsCount: number,       // status 'canceled', updatedAt = today
  queueTasks: { docCode: string; locationLabel: string | null }[],  // top 5 most recent 'draft' docs
}

LiveTransactionRow = {
  warehouseName: string,
  zoneLabel: string | null,      // from the associated Location, if any
  operatorName: string,          // from createdById -> User.fullName, same accepted simplification as prior sub-projects
  eventLabel: string,            // EpcEvent.eventType mapped to a human label (e.g. 'move_in' -> 'Putaway Confirmed')
  timestamp: string,             // ISO, EpcEvent.createdAt
  durationMinutes: number,       // (now - EpcEvent.createdAt) in minutes, computed at request time
  priority: 'low' | 'med' | 'high',  // derived from durationMinutes: <5 low, 5-15 med, >15 high
  slaPct: number | null,         // only populated for events tied to an OutboundDoc with deadlineAt; null otherwise
}
```

### Domain → doc type mapping

| Domain | Doc types |
|---|---|
| Stock In | `InboundDoc`, `PutawayDoc` |
| Stock Out | `OutboundDoc` |
| Inventory | `TransferDoc`, `RelocationDoc`, `OpnameDoc` |

`queueCount`/`completedTodayCount`/`exceptionsCount` sum across all doc types in the domain. "Terminal status" per doc type: `posted` for Inbound/Outbound/Transfer/Relocation, `done` for Putaway, `closed` for Opname.

### Health chip thresholds

`health = 'critical'` if `exceptionsCount >= 5`; `'warning'` if `1 <= exceptionsCount <= 4`; `'nominal'` if `exceptionsCount === 0`. An explicit, simple, documented rule — not derived from any existing business threshold, since none exists in the schema.

### Live transactions feed

Queries the most recent N (20) `EpcEvent` rows, joined against `Warehouse`, `Location` (if the event has an associated location), and `User` (via whatever actor field `EpcEvent` carries) for display names. `slaPct` is populated only when the event can be traced to an `OutboundDoc` with a non-null `deadlineAt` (computed as elapsed-time / total-allowed-time, clamped 0-100); otherwise `null`.

### Conventions

Same as prior dashboard endpoints: `successResponse(data)`, `@ApiBearerAuthProtected()` + `@ApiStandardOkResponse(...)`, manual `companyId`/`warehouseId` scoping, computed synchronously per request (the 20-second refresh is a frontend polling concern, not a backend cron).

## Frontend Design

### Route & page

`/dashboard/monitoring` (route already exists, currently pointing at the `PageShell` placeholder — this sub-project replaces that with the real page, the last of the four placeholder routes). New `src/views/dashboard/MonitoringPage.vue` + `src/views/dashboard/composables/useMonitoring.ts`.

### Composable

`useMonitoring.ts`: `data`/`loading`/`error` refs, fetches on mount via a new `dashboardService.fetchMonitoring(filter)` method mirroring the existing service/api layering. Starts a `setInterval` (20000ms) on mount that re-fetches silently (does not toggle `loading` back to `true` on refetch, to avoid a flashing UI every 20 seconds — only the initial fetch shows the loading state); the interval is cleared in `onUnmounted`.

### Components

- `MonitoringDomainCard.vue` — one card per domain: health chip (`nominal`/`warning`/`critical` mapped to `success`/`warning`/`danger` tokens), the 3-stat grid (Queue/Completed Today/Exceptions), and the queued-task list (doc code + location). Rendered 3 times with different props (Stock In / Stock Out / Inventory), each taking `{ loading: boolean; data: DomainHealth | null }`.
- `MonitoringLiveFeed.vue` — the Live Transactions table: Status (static "OK" badge — only successfully-recorded events reach this feed), Warehouse, Zone, Operator, Event, Timestamp, Duration, Priority (color-coded badge from `durationMinutes`), SLA bar (rendered only when `slaPct !== null`, omitted/dashed otherwise). Takes `{ loading: boolean; data: LiveTransactionRow[] | null }`.

Color tokens must be verified against `tailwind.config.ts` (and cross-checked against actual compiled CSS, per the recurring dead-class lesson from prior sub-projects) before use — confirmed-dead tokens: `bg-workspace-bg`, `border-border-default`, `text-action-orange`, `text-signal-red`, `text-text-tertiary`, `bg-primary-light`, bare `text-secondary`, bare `text-muted`. The real forms are `text-text-secondary`/`text-text-muted`.

### Testing

Backend: unit tests for the new service (mocked Prisma) covering all three domains' stat derivation, the health-threshold rule, the priority-derivation rule, and the SLA-only-for-outbound-events rule. Frontend: SSR render tests per component (loading/empty/populated states) plus a composable test for the polling behavior (mount triggers fetch, a simulated interval tick triggers a re-fetch, unmount clears the interval), following the exact patterns established in prior sub-projects.

## Out of Scope

- "Active Tasks" and "Pending" as separate stats (status model isn't consistent enough across doc types to support them honestly — dropped in favor of 3 consistently-derivable stats).
- Zone/dock as an interactive filter (Location is used for display labels only, consistent with the two prior sub-projects dropping additional filters).
- True WebSocket/SSE push updates (a 20-second poll approximates "live" without new infrastructure).
- The mockup's client-side search box on the Live Transactions table.
- Warehouse-level filtering on this page (consistent with prior sub-projects' page-level-filter decisions).
