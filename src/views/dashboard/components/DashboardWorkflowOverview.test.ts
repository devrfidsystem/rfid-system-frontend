import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import DashboardWorkflowOverview from "./DashboardWorkflowOverview.vue";

describe("DashboardWorkflowOverview", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(DashboardWorkflowOverview, {
            loading: true,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders panel titles, kpi row, and insufficient-data state for trend", async () => {
        const app = createSSRApp(DashboardWorkflowOverview, {
            loading: false,
            data: {
                panels: [
                    {
                        key: "inboundPutaway",
                        title: "Inbound & Putaway Workflow",
                        openCount: 428,
                        avgCycleTimeHours: null,
                        completionRate: 0.88,
                        bottleneckStage: "Waiting Putaway",
                        stages: [
                            {
                                name: "Waiting Putaway",
                                count: 120,
                                pctOfOpen: 28,
                                avgWaitHours: null,
                                trendPct: null,
                            },
                        ],
                    },
                ],
            },
        });
        const html = await renderToString(app);
        expect(html).toContain("Workflow Position");
        expect(html).toContain(
            "Document stages and bottlenecks across active warehouse flows",
        );
        expect(html).toContain("Inbound &amp; Putaway Workflow");
        expect(html).toContain("Waiting Putaway");
        expect(html).toContain("Insufficient data yet");
    });

    it("renders avg wait hours when present, and omits it when null", async () => {
        const app = createSSRApp(DashboardWorkflowOverview, {
            loading: false,
            data: {
                panels: [
                    {
                        key: "inboundPutaway",
                        title: "Inbound & Putaway Workflow",
                        openCount: 428,
                        avgCycleTimeHours: null,
                        completionRate: 0.88,
                        bottleneckStage: "Waiting Putaway",
                        stages: [
                            {
                                name: "Waiting Putaway",
                                count: 120,
                                pctOfOpen: 28,
                                avgWaitHours: 2.4,
                                trendPct: null,
                            },
                            {
                                name: "QC Hold",
                                count: 40,
                                pctOfOpen: 10,
                                avgWaitHours: null,
                                trendPct: null,
                            },
                        ],
                    },
                ],
            },
        });
        const html = await renderToString(app);
        expect(html).toContain("2.4h");
        expect(html).toContain("QC Hold");

        // "QC Hold" now also appears in the donut chart legend above the
        // detailed stage list, so scope to the LAST occurrence (the list row).
        const qcHoldSection = html.slice(html.lastIndexOf("QC Hold"));
        expect(qcHoldSection).not.toContain("Avg wait");
    });

    it("renders a trend percentage when present", async () => {
        const app = createSSRApp(DashboardWorkflowOverview, {
            loading: false,
            data: {
                panels: [
                    {
                        key: "outbound",
                        title: "Outbound Workflow",
                        openCount: 50,
                        avgCycleTimeHours: null,
                        completionRate: 0.6,
                        bottleneckStage: "Open",
                        stages: [
                            {
                                name: "Posted",
                                count: 30,
                                pctOfOpen: 60,
                                avgWaitHours: null,
                                trendPct: 12.5,
                            },
                        ],
                    },
                ],
            },
        });
        const html = await renderToString(app);
        expect(html).toContain("text-success-600");
        expect(html).toContain("+12.5%");
    });
});
