import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useDashboardMock = vi.hoisted(() => vi.fn());

vi.mock("./composables/useDashboard", () => ({
    useDashboard: useDashboardMock,
}));

vi.mock("./components/DashboardToolbar.vue", () => ({
    default: defineComponent({
        name: "DashboardToolbarStub",
        setup: () => () => null,
    }),
}));

vi.mock("./components/DashboardAlertCenter.vue", () => ({
    default: defineComponent({
        name: "DashboardAlertCenterStub",
        setup: () => () => h("div", {}, "DashboardAlertCenterStub"),
    }),
}));

vi.mock("./components/DashboardWorkflowOverview.vue", () => ({
    default: defineComponent({
        name: "DashboardWorkflowOverviewStub",
        setup: () => () => h("div", {}, "DashboardWorkflowOverviewStub"),
    }),
}));

vi.mock("./components/DashboardKpiSnapshot.vue", () => ({
    default: defineComponent({
        name: "DashboardKpiSnapshotStub",
        setup: () => () => h("div", {}, "DashboardKpiSnapshotStub"),
    }),
}));

import DashboardPage from "./DashboardPage.vue";

describe("DashboardPage", () => {
    beforeEach(() => {
        useDashboardMock.mockReset();
        useDashboardMock.mockReturnValue({
            dashboardSections: [
                { key: "alerts", heading: "Operations Alert Center" },
                { key: "workflow", heading: "Business Workflow Overview" },
                { key: "kpi", heading: "Executive KPI Snapshot" },
            ],
            warehouseOptions: [],
            warehousesLoading: false,
            warehouseError: null,
            dashboardLoading: false,
            dashboardError: null,
            refreshDashboard: vi.fn(),
            selectedWarehouseId: null,
            setSelectedWarehouse: vi.fn(),
            alertsData: null,
            alertsLoading: false,
            workflowData: null,
            workflowLoading: false,
            kpiSnapshotData: null,
            kpiSnapshotLoading: false,
        });
    });

    it("renders each dashboard section component exactly once, with no duplicated heading wrapper", async () => {
        const app = createSSRApp(DashboardPage);
        const html = await renderToString(app);

        // Each section component (which owns its own heading) should render
        // exactly once. The page must not wrap them in an extra heading of
        // its own, since that would duplicate the heading these components
        // already render internally.
        expect(html).toContain("DashboardAlertCenterStub");
        expect(html).toContain("DashboardWorkflowOverviewStub");
        expect(html).toContain("DashboardKpiSnapshotStub");

        expect(html.match(/DashboardAlertCenterStub/g)).toHaveLength(1);
        expect(html.match(/DashboardWorkflowOverviewStub/g)).toHaveLength(1);
        expect(html.match(/DashboardKpiSnapshotStub/g)).toHaveLength(1);

        // Guard against the page reintroducing its own outer <h2> headings
        // for these sections, since each component is the single source of
        // its own heading text now.
        expect(html).not.toContain("<h2");
    });
});
