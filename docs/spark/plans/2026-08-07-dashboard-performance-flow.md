# Dashboard Performance Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dashboard-scoped request caching, in-flight dedupe, and stale-response protection so all legacy/current dashboard pages load faster and do not overwrite fresh state with old responses.

**Architecture:** Keep API boundaries unchanged. Add a dashboard-owned request orchestrator under `src/views/dashboard/composables/`, then use it from dashboard composables without moving business payload normalization out of `dashboard.service.ts`.

**Tech Stack:** Vue 3 Composition API, TypeScript, Vitest, existing dashboard service/composable pattern.

## Global Constraints

- Do not change backend endpoint URLs or payload contracts.
- Preserve per-widget loading/error/data state on dashboard overview.
- Do not revert existing dirty dashboard work.
- Write failing Vitest coverage before production code.

---

### Task 1: Dashboard Request Cache

**Files:**

- Create: `src/views/dashboard/composables/dashboardRequestCache.ts`
- Create: `src/views/dashboard/composables/dashboardRequestCache.test.ts`

**Interfaces:**

- Produces: `createDashboardRequestCache(options?: { ttlMs?: number; now?: () => number })`
- Produces method: `load<T>(key: string, fetcher: () => Promise<T>, options?: { force?: boolean }): Promise<{ data: T; fromCache: boolean }>`
- Produces method: `clear(): void`
- Produces method: `nextSequence(scope: string): number`
- Produces method: `isLatest(scope: string, sequence: number): boolean`

- [ ] **Step 1: Write failing cache/dedupe tests**

```ts
import { describe, expect, it, vi } from "vitest";
import { createDashboardRequestCache } from "./dashboardRequestCache";

describe("createDashboardRequestCache", () => {
    it("dedupes identical in-flight requests", async () => {
        const cache = createDashboardRequestCache({ ttlMs: 1000 });
        const fetcher = vi.fn().mockResolvedValue({ value: 1 });

        const [first, second] = await Promise.all([
            cache.load("alerts:wh-1", fetcher),
            cache.load("alerts:wh-1", fetcher),
        ]);

        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(first.data).toEqual({ value: 1 });
        expect(second.data).toEqual({ value: 1 });
        expect(first.fromCache).toBe(false);
        expect(second.fromCache).toBe(false);
    });

    it("returns fresh cached data inside the ttl and bypasses cache when forced", async () => {
        let now = 1000;
        const cache = createDashboardRequestCache({
            ttlMs: 500,
            now: () => now,
        });
        const fetcher = vi
            .fn()
            .mockResolvedValueOnce({ value: 1 })
            .mockResolvedValueOnce({ value: 2 });

        const first = await cache.load("kpi:all", fetcher);
        now = 1200;
        const cached = await cache.load("kpi:all", fetcher);
        const forced = await cache.load("kpi:all", fetcher, { force: true });

        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(first).toEqual({ data: { value: 1 }, fromCache: false });
        expect(cached).toEqual({ data: { value: 1 }, fromCache: true });
        expect(forced).toEqual({ data: { value: 2 }, fromCache: false });
    });

    it("tracks latest request sequence per scope", () => {
        const cache = createDashboardRequestCache();

        const first = cache.nextSequence("overview");
        const second = cache.nextSequence("overview");

        expect(cache.isLatest("overview", first)).toBe(false);
        expect(cache.isLatest("overview", second)).toBe(true);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/composables/dashboardRequestCache.test.ts`
Expected: FAIL because `dashboardRequestCache.ts` does not exist.

- [ ] **Step 3: Implement request cache**

Create `dashboardRequestCache.ts` with TTL cache, in-flight map, `force` bypass, and sequence helpers.

- [ ] **Step 4: Run cache test**

Run: `npx vitest run src/views/dashboard/composables/dashboardRequestCache.test.ts`
Expected: PASS.

### Task 2: Integrate Overview Loading

**Files:**

- Modify: `src/views/dashboard/composables/useDashboard.ts`
- Modify: `src/views/dashboard/composables/useDashboard.test.ts`

**Interfaces:**

- Consumes: `dashboardRequestCache.load`
- Preserves: `refreshDashboard(): Promise<void>`

- [ ] **Step 1: Write failing tests**

Add tests proving two rapid `refreshDashboard()` calls dedupe overview endpoint calls and stale responses do not overwrite the latest refresh result.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/composables/useDashboard.test.ts`
Expected: FAIL because current `useDashboard` does not dedupe all refresh calls or guard stale response order.

- [ ] **Step 3: Implement overview integration**

Use request keys based on selected warehouse and widget name. Keep per-widget errors. Use `force: true` for manual refresh and non-forced cache for reactive refresh where appropriate.

- [ ] **Step 4: Run dashboard tests**

Run: `npx vitest run src/views/dashboard/composables/useDashboard.test.ts src/views/dashboard/composables/dashboardRequestCache.test.ts`
Expected: PASS.

### Task 3: Extend To KPI And Process Detail

**Files:**

- Modify: `src/views/dashboard/composables/useExecutiveKpi.ts`
- Modify: `src/views/dashboard/composables/useExecutiveKpi.test.ts`
- Modify: `src/views/dashboard/composables/useProcessPerformance.ts`
- Modify: `src/views/dashboard/composables/useProcessPerformance.test.ts`

**Interfaces:**

- Consumes: `dashboardRequestCache.load`
- Preserves: `refresh()`, `setDomain()`, `setActivity()`, `setPeriod()`

- [ ] **Step 1: Write failing tests**

Add tests proving repeated same-domain/same-filter refreshes use cache and forced tab changes fetch the new key without stale overwrite.

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run src/views/dashboard/composables/useExecutiveKpi.test.ts src/views/dashboard/composables/useProcessPerformance.test.ts`
Expected: FAIL until cache integration exists.

- [ ] **Step 3: Implement KPI/process integration**

Use request keys containing warehouse id plus domain/activity/period.

- [ ] **Step 4: Run all dashboard composable tests**

Run: `npx vitest run src/views/dashboard/composables/dashboardRequestCache.test.ts src/views/dashboard/composables/useDashboard.test.ts src/views/dashboard/composables/useExecutiveKpi.test.ts src/views/dashboard/composables/useProcessPerformance.test.ts src/views/dashboard/composables/useMonitoring.test.ts`
Expected: PASS.

### Task 4: Verification

**Files:**

- No production file changes beyond Tasks 1-3.

- [ ] **Step 1: Run focused service/composable verification**

Run: `npx vitest run src/services/dashboard.service.test.ts src/views/dashboard/composables/dashboardRequestCache.test.ts src/views/dashboard/composables/useDashboard.test.ts src/views/dashboard/composables/useExecutiveKpi.test.ts src/views/dashboard/composables/useProcessPerformance.test.ts src/views/dashboard/composables/useMonitoring.test.ts`
Expected: PASS.

- [ ] **Step 2: Run type-check if feasible**

Run: `npm run type-check`
Expected: PASS or report existing unrelated failures with evidence.
