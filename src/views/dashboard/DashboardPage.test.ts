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
            warehouseOptions: [],
            warehousesLoading: false,
            warehouseError: null,
            dashboardLoading: false,
            refreshDashboard: vi.fn(),
            selectedWarehouseId: null,
            setSelectedWarehouse: vi.fn(),
            alertsData: null,
            alertsLoading: false,
            alertsError: null,
            workflowData: null,
            workflowLoading: false,
            workflowError: null,
            kpiSnapshotData: null,
            kpiSnapshotLoading: false,
            kpiSnapshotError: null,
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

    it("does not render a page-level error banner — each widget owns its own error state", async () => {
        useDashboardMock.mockReturnValue({
            warehouseOptions: [],
            warehousesLoading: false,
            warehouseError: null,
            dashboardLoading: false,
            refreshDashboard: vi.fn(),
            selectedWarehouseId: null,
            setSelectedWarehouse: vi.fn(),
            alertsData: null,
            alertsLoading: false,
            alertsError: "Alerts failed to load",
            workflowData: null,
            workflowLoading: false,
            workflowError: null,
            kpiSnapshotData: null,
            kpiSnapshotLoading: false,
            kpiSnapshotError: null,
        });

        const app = createSSRApp(DashboardPage);
        const html = await renderToString(app);

        // The stub echoes `error` as a plain HTML attribute
        // (`error="Alerts failed to load"`), which is expected — it proves
        // the prop reaches the widget. What must NOT happen is the page
        // rendering that same text as its own visible content (a page-level
        // banner), which would show up as `>Alerts failed to load<`.
        expect(html).not.toContain(">Alerts failed to load<");
    });
});
