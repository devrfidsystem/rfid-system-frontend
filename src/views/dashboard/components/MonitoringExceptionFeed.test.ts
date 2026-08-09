import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import MonitoringExceptionFeed from "./MonitoringExceptionFeed.vue";

describe("MonitoringExceptionFeed", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(MonitoringExceptionFeed, {
            loading: true,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders an empty state when there are no exception rows", async () => {
        const app = createSSRApp(MonitoringExceptionFeed, {
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
                    status: "ok",
                },
            ],
        });
        const html = await renderToString(app);
        expect(html).toContain("No exceptions currently open");
        expect(html).toContain("px-4 py-5");
    });

    it("renders only rows with status 'exception', filtering out 'ok' rows", async () => {
        const app = createSSRApp(MonitoringExceptionFeed, {
            loading: false,
            data: [
                {
                    warehouseName: "Jakarta DC",
                    zoneLabel: "Zone A",
                    operatorName: "Budi Santoso",
                    eventLabel: "Damaged",
                    timestamp: "2026-07-18T09:00:00.000Z",
                    durationMinutes: 12,
                    priority: "high",
                    slaPct: null,
                    status: "exception",
                },
                {
                    warehouseName: "Surabaya DC",
                    zoneLabel: null,
                    operatorName: "Siti Aminah",
                    eventLabel: "Picked / Moved Out",
                    timestamp: "2026-07-18T08:40:00.000Z",
                    durationMinutes: 22,
                    priority: "low",
                    slaPct: 68,
                    status: "ok",
                },
            ],
        });
        const html = await renderToString(app);

        expect(html).toContain("Damaged exception");
        expect(html).toContain("Jakarta DC");
        expect(html).toContain("Budi Santoso");
        expect(html).not.toContain("Surabaya DC");
        expect(html).not.toContain("Siti Aminah");
    });
});
