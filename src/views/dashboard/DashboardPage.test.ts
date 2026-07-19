import { createSSRApp, defineComponent } from "vue";
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
        setup: () => () => null,
    }),
}));

vi.mock("./components/DashboardWorkflowOverview.vue", () => ({
    default: defineComponent({
        name: "DashboardWorkflowOverviewStub",
        setup: () => () => null,
    }),
}));

vi.mock("./components/DashboardKpiSnapshot.vue", () => ({
    default: defineComponent({
        name: "DashboardKpiSnapshotStub",
        setup: () => () => null,
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

    it("renders the operational intelligence section headings", async () => {
        const app = createSSRApp(DashboardPage);
        const html = await renderToString(app);

        expect(html).toContain("Operations Alert Center");
        expect(html).toContain("Business Workflow Overview");
        expect(html).toContain("Executive KPI Snapshot");
    });
});
