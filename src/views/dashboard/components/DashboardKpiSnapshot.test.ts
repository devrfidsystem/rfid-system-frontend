import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { createMemoryHistory, createRouter } from "vue-router";
import { i18n } from "@/locales";
import DashboardKpiSnapshot from "./DashboardKpiSnapshot.vue";

// RouterLink requires an injected router, so tests install a minimal
// memory-history router rather than mounting the component standalone.
const createTestRouter = () =>
    createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/", component: { template: "<div />" } },
            { path: "/dashboard/kpi", component: { template: "<div />" } },
        ],
    });

const renderWithRouter = async (props: Record<string, unknown>) => {
    const app = createSSRApp(DashboardKpiSnapshot, props);
    const router = createTestRouter();
    app.use(router);
    app.use(i18n);
    // Memory history never auto-navigates, so isReady() would hang forever
    // without an explicit initial push.
    await router.push("/");
    await router.isReady();
    return renderToString(app);
};

describe("DashboardKpiSnapshot", () => {
    it("renders a skeleton while loading", async () => {
        const html = await renderWithRouter({ loading: true, data: null });
        expect(html).toContain("animate-pulse");
    });

    it("renders score cards with sub-metrics and a view-performance link to the KPI page", async () => {
        const html = await renderWithRouter({
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
        expect(html).toContain("Cuplikan Kontrol KPI");
        expect(html).toContain("Stock In Performance");
        expect(html).toContain("83");
        expect(html).toContain("Productivity Improvement");
        expect(html).toContain("Buka Detail KPI");
        expect(html).toContain('href="/dashboard/kpi?domain=stockIn"');
    });
});
