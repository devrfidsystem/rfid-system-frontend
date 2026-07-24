# Dashboard Sidebar Sub-Pages Design

> Scope: routing + sidebar navigation foundation for the 3 remaining "Operational Intelligence Platform" sub-projects (Executive KPI, Process Performance, Monitoring). Content for those 3 pages is out of scope here — each gets its own brainstorm/spec/plan later. This only wires up navigation and placeholder pages so the sidebar structure is correct.

## Goal

Replace the current single "Executive Summary" entry under Dashboard with 4 sub-items matching the mockup's sidebar (Executive Summary, Executive KPI, Process Performance, Monitoring), and remove the 3 legacy sub-items (Low Stock, Recent Activity, EPC Status) from the sidebar.

## Frontend

- New routes in `src/router/index.ts`: `dashboard/kpi`, `dashboard/process`, `dashboard/monitoring`, each rendering the existing (currently unused) `src/views/shared/PageShell.vue` placeholder component with route-level `props` for `title`/`description`. `dashboard/overview` (Executive Summary) is unchanged.
- Existing `dashboard/low-stock`, `dashboard/recent-activity`, `dashboard/epc-status` routes are left in the router code untouched (no deep links break) — they simply won't appear in the sidebar once their DB menu rows are removed.
- New icons added to `sidebarIconMap` in `src/components/organisms/sidebarNavigation.ts`: `DASHBOARD_KPI` → `TrendingUp`, `DASHBOARD_PROCESS` → `Workflow`, `DASHBOARD_MONITORING` → `Radar` (all from `lucide-vue-next`, already a project dependency).

## Backend (DB mutation, not a migration)

Following the same pattern used for prior menu changes in this project (a direct data mutation, not a schema migration — the `Menu`/`RoleMenu` tables already exist):

1. Insert 3 new `Menu` rows under the existing `DASHBOARD` parent:
    - `DASHBOARD_KPI` — "Executive KPI" — `/dashboard/kpi` — sortOrder 1
    - `DASHBOARD_PROCESS` — "Process Performance" — `/dashboard/process` — sortOrder 2
    - `DASHBOARD_MONITORING` — "Monitoring" — `/dashboard/monitoring` — sortOrder 3
      (existing `DASHBOARD_OVERVIEW` keeps sortOrder 0)
2. Insert matching `RoleMenu` grants for each new menu, for every role currently granted `DASHBOARD_OVERVIEW` (mirror its role assignments exactly).
3. Delete the `RoleMenu` rows and `Menu` rows for `DASHBOARD_LOW_STOCK`, `DASHBOARD_RECENT_ACTIVITY`, `DASHBOARD_EPC_STATUS`.

Before/after values for all mutated rows are recorded in this repo's progress ledger for manual rollback if ever needed (no automated rollback script, consistent with prior menu mutations in this project's history).

## Out of Scope

- Real content for Executive KPI / Process Performance / Monitoring pages (separate future sub-projects; `PageShell` is an intentional temporary placeholder).
- Deleting the low-stock/recent-activity/epc-status route code or `DashboardPage.vue` section-switching logic that still serves those routes directly by URL.
