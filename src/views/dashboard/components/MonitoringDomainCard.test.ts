import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import MonitoringDomainCard from "./MonitoringDomainCard.vue";

describe("MonitoringDomainCard", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(MonitoringDomainCard, {
            loading: true,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders an empty message when there is no domain data", async () => {
        const app = createSSRApp(MonitoringDomainCard, {
            loading: false,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("No domain data available");
    });

    it("renders the health chip, stat grid, and queue task list for a nominal domain", async () => {
        const app = createSSRApp(MonitoringDomainCard, {
            loading: false,
            data: {
                label: "Stock In",
                health: "nominal",
                queueCount: 12,
                completedTodayCount: 48,
                exceptionsCount: 0,
                queueTasks: [
                    { docCode: "IN-2026-0042", locationLabel: "Dock 02" },
                    { docCode: "IN-2026-0043", locationLabel: null },
                ],
            },
        });
        const html = await renderToString(app);

        expect(html).toContain("Stock In");
        expect(html).toContain("bg-success-50");
        expect(html).toContain("text-success-600");
        expect(html).toContain("12");
        expect(html).toContain("48");
        expect(html).toContain("Exceptions");
        expect(html).toContain("IN-2026-0042");
        expect(html).toContain("Dock 02");
        expect(html).toContain("IN-2026-0043");
    });

    it("renders the warning and critical health chip colors", async () => {
        const warningApp = createSSRApp(MonitoringDomainCard, {
            loading: false,
            data: {
                label: "Stock Out",
                health: "warning",
                queueCount: 3,
                completedTodayCount: 10,
                exceptionsCount: 2,
                queueTasks: [],
            },
        });
        const warningHtml = await renderToString(warningApp);
        expect(warningHtml).toContain("bg-warning-50");
        expect(warningHtml).toContain("text-warning-600");

        const criticalApp = createSSRApp(MonitoringDomainCard, {
            loading: false,
            data: {
                label: "Inventory",
                health: "critical",
                queueCount: 5,
                completedTodayCount: 2,
                exceptionsCount: 7,
                queueTasks: [],
            },
        });
        const criticalHtml = await renderToString(criticalApp);
        expect(criticalHtml).toContain("bg-danger-50");
        expect(criticalHtml).toContain("text-danger-600");
    });
});
