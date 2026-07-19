import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import DashboardKpiSnapshot from "./DashboardKpiSnapshot.vue";

describe("DashboardKpiSnapshot", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(DashboardKpiSnapshot, {
            loading: true,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders score cards with sub-metrics and a disabled view-performance link", async () => {
        const app = createSSRApp(DashboardKpiSnapshot, {
            loading: false,
            data: {
                cards: [
                    {
                        key: "stockIn",
                        label: "Stock In Performance",
                        score: 83,
                        trendVsPrevious: 0.8,
                        subMetrics: [
                            {
                                label: "Productivity Improvement",
                                value: "+1.1%",
                            },
                            { label: "Cycle Time Improvement", value: "+1.6%" },
                        ],
                        sparkline: [80, 81, 82, 81, 82, 83],
                    },
                ],
            },
        });
        const html = await renderToString(app);
        expect(html).toContain("Stock In Performance");
        expect(html).toContain("83");
        expect(html).toContain("Productivity Improvement");
        expect(html).toContain("View Performance");
        expect(html).toContain("disabled");
    });
});
