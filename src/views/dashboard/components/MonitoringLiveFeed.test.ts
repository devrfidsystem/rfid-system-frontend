import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import MonitoringLiveFeed from "./MonitoringLiveFeed.vue";

describe("MonitoringLiveFeed", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(MonitoringLiveFeed, {
            loading: true,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders an empty message when there are no live transactions", async () => {
        const app = createSSRApp(MonitoringLiveFeed, {
            loading: false,
            data: [],
        });
        const html = await renderToString(app);
        expect(html).toContain("No live transactions");
    });

    it("renders rows with an OK status badge, priority color, and an SLA bar only when slaPct is present", async () => {
        const app = createSSRApp(MonitoringLiveFeed, {
            loading: false,
            data: [
                {
                    warehouseName: "Jakarta DC",
                    zoneLabel: "Dock 02",
                    operatorName: "Budi Santoso",
                    eventLabel: "Putaway Confirmed",
                    timestamp: "2026-07-18T09:00:00.000Z",
                    durationMinutes: 2,
                    priority: "low",
                    slaPct: null,
                },
                {
                    warehouseName: "Surabaya DC",
                    zoneLabel: null,
                    operatorName: "Siti Aminah",
                    eventLabel: "Picked / Moved Out",
                    timestamp: "2026-07-18T08:40:00.000Z",
                    durationMinutes: 22,
                    priority: "high",
                    slaPct: 68,
                },
            ],
        });
        const html = await renderToString(app);

        expect(html).toContain("OK");
        expect(html).toContain("Jakarta DC");
        expect(html).toContain("Dock 02");
        expect(html).toContain("Budi Santoso");
        expect(html).toContain("Putaway Confirmed");
        expect(html).toContain("text-success-600");
        expect(html).toContain("Surabaya DC");
        expect(html).toContain("text-danger-600");
        expect(html).toContain("68%");
        const slaBarCount = html.split('role="progressbar"').length - 1;
        expect(slaBarCount).toBe(1);
    });
});
