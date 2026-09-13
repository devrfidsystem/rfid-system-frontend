# Dashboard Performance Flow Design

- Last Updated: 2026-08-07
- Scope: legacy/current dashboard pages under `src/views/dashboard`

## Goal

Improve dashboard perceived and actual load time to an enterprise standard without requiring backend API contract changes.

## Current Context

The active dashboard overview fetches alerts, workflow overview, and KPI snapshot as independent widget payloads through `useDashboard` -> `dashboardService` -> `dashboardApi`. KPI, process, and monitoring pages fetch their own detail payloads and share warehouse filter state through `useDashboardWarehouseFilter`. Monitoring already avoids overlapping poll requests; the other dashboard composables do not yet share a request cache, dedupe in-flight requests, or reject stale responses after fast filter/tab changes.

## Design

Add a small dashboard request orchestrator owned by `src/views/dashboard/composables/`. It will:

- cache successful responses per dashboard widget and filter key for a short TTL;
- dedupe in-flight requests with the same key;
- allow manual refresh to bypass cache;
- expose a monotonically increasing request sequence guard so stale responses cannot overwrite newer page state.

`useDashboard` will load its overview widgets through the orchestrator while preserving separate loading, error, and data refs. KPI and process pages will use the same orchestrator for repeated tab/filter requests. Monitoring keeps its polling guard and can use the same orchestrator only for manual/initial fetch if it does not interfere with silent polling behavior.

## Enterprise Standards

- Partial failure must remain isolated per widget.
- Repeated navigation or rapid filter changes must not duplicate identical network calls.
- Cached data may render immediately while the next forced/manual refresh can still update the widget.
- Stale responses from older filters must not overwrite the latest selected filter result.
- Implementation must be test-first with Vitest coverage for cache hit, in-flight dedupe, forced refresh, and stale response behavior.

## Files

- Create `src/views/dashboard/composables/dashboardRequestCache.ts`
- Test `src/views/dashboard/composables/dashboardRequestCache.test.ts`
- Modify `src/views/dashboard/composables/useDashboard.ts`
- Modify `src/views/dashboard/composables/useDashboard.test.ts`
- Optionally modify `useExecutiveKpi.ts`, `useProcessPerformance.ts`, and their tests if the same request orchestration can be integrated without broad UI changes.

## Out Of Scope

- Backend aggregation endpoint changes.
- Visual redesign.
- Restoring deleted legacy dashboard components.
- Global application-wide HTTP caching outside the dashboard domain.
