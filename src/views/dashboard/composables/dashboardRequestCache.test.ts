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
