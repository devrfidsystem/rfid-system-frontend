import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchSummaryMock = vi.hoisted(() =>
    vi.fn().mockResolvedValue({
        totalStock: 0,
        epcActive: 0,
        latestInboundDate: null,
        inboundToday: 0,
        latestOutboundDate: null,
        outboundToday: 0,
        opnamePending: 0,
    }),
);
const fetchAlertsMock = vi.hoisted(() =>
    vi.fn().mockResolvedValue({
        counts: { critical: 1, warning: 0, info: 0 },
        alerts: [{ severity: "critical", title: "Test alert" }],
    }),
);
const fetchWorkflowOverviewMock = vi.hoisted(() =>
    vi.fn().mockResolvedValue({ panels: [] }),
);
const fetchKpiSnapshotMock = vi.hoisted(() =>
    vi.fn().mockResolvedValue({ cards: [] }),
);

vi.mock("@/services/dashboard.service", () => ({
    dashboardService: {
        fetchSummary: fetchSummaryMock,
        fetchHeatmap: vi.fn().mockResolvedValue({ rows: [], maxQuantity: 0 }),
        fetchChart: vi.fn().mockResolvedValue([]),
        fetchLowStock: vi
            .fn()
            .mockResolvedValue({ totalLowStock: 0, items: [] }),
        fetchAlerts: fetchAlertsMock,
        fetchWorkflowOverview: fetchWorkflowOverviewMock,
        fetchKpiSnapshot: fetchKpiSnapshotMock,
    },
}));

vi.mock("@/composable/useDebouncedWatch", () => ({
    useDebouncedWatch: vi.fn(),
}));

vi.mock("@/composable/useWarehouseOptions", async () => {
    const { ref } = await import("vue");
    return {
        useWarehouseOptions: () => ({
            options: ref([]),
            loading: ref(false),
            error: ref(null),
        }),
    };
});

vi.mock("@/store/auth.store", () => ({
    useAuthStore: () => ({ profile: { warehouses: [] } }),
}));

vi.mock("@/store/warehouse.store", () => ({
    useWarehouseStore: () => ({
        selectedWarehouseId: null,
        setWarehouse: vi.fn(),
        syncWarehouseSelection: vi.fn(),
    }),
}));

vi.mock("vue-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("vue-router")>();
    return {
        ...actual,
        useRoute: () => ({ query: {}, meta: { section: "overview" } }),
        useRouter: () => ({ replace: vi.fn() }),
        onBeforeRouteUpdate: vi.fn(),
    };
});

import { useDashboard } from "./useDashboard";

describe("useDashboard alerts/workflow/kpi state", () => {
    beforeEach(() => {
        fetchAlertsMock.mockClear();
        fetchWorkflowOverviewMock.mockClear();
        fetchKpiSnapshotMock.mockClear();
    });

    it("loads alerts, workflow overview, and kpi snapshot when refreshed for the overview section", async () => {
        const composable = useDashboard();

        await composable.refreshDashboard();

        expect(fetchAlertsMock).toHaveBeenCalled();
        expect(fetchWorkflowOverviewMock).toHaveBeenCalled();
        expect(fetchKpiSnapshotMock).toHaveBeenCalled();
        expect(composable.alertsData.value?.counts.critical).toBe(1);
        expect(composable.workflowData.value?.panels).toEqual([]);
        expect(composable.kpiSnapshotData.value?.cards).toEqual([]);
    });
});
