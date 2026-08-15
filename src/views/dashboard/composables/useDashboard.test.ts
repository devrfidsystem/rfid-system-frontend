import { describe, expect, it, vi, beforeEach } from "vitest";

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
        useRoute: () => ({ query: {} }),
        useRouter: () => ({ replace: vi.fn() }),
    };
});

import { useDashboard } from "./useDashboard";
import { dashboardRequestCache } from "./dashboardRequestCache";

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("useDashboard alerts/workflow/kpi state", () => {
    beforeEach(() => {
        dashboardRequestCache.clear();
        fetchAlertsMock.mockClear();
        fetchWorkflowOverviewMock.mockClear();
        fetchKpiSnapshotMock.mockClear();
    });

    it("loads alerts, workflow overview, and kpi snapshot when refreshed", async () => {
        const composable = useDashboard();

        await composable.refreshDashboard();

        expect(fetchAlertsMock).toHaveBeenCalled();
        expect(fetchWorkflowOverviewMock).toHaveBeenCalled();
        expect(fetchKpiSnapshotMock).toHaveBeenCalled();
        expect(composable.alertsData.value?.counts.critical).toBe(1);
        expect(composable.workflowData.value?.panels).toEqual([]);
        expect(composable.kpiSnapshotData.value?.cards).toEqual([]);
    });

    it("isolates errors per widget instead of sharing one error ref", async () => {
        fetchAlertsMock.mockRejectedValueOnce(new Error("Alerts down"));

        const composable = useDashboard();
        await composable.refreshDashboard();
        await flushPromises();

        expect(composable.alertsError.value).toBe("Alerts down");
        expect(composable.workflowError.value).toBeNull();
        expect(composable.kpiSnapshotError.value).toBeNull();
        // Workflow/KPI still loaded successfully despite the alerts failure.
        expect(composable.workflowData.value?.panels).toEqual([]);
        expect(composable.kpiSnapshotData.value?.cards).toEqual([]);
    });

    it("dedupes rapid refreshes for the same overview filter", async () => {
        const composable = useDashboard();

        await Promise.all([
            composable.refreshDashboard(),
            composable.refreshDashboard(),
        ]);
        await flushPromises();

        expect(fetchAlertsMock).toHaveBeenCalledTimes(1);
        expect(fetchWorkflowOverviewMock).toHaveBeenCalledTimes(1);
        expect(fetchKpiSnapshotMock).toHaveBeenCalledTimes(1);
    });

    it("does not let a slower previous refresh overwrite a newer overview result", async () => {
        let resolveFirstAlerts: (
            value: Awaited<ReturnType<typeof fetchAlertsMock>>,
        ) => void;
        fetchAlertsMock
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveFirstAlerts = resolve;
                    }),
            )
            .mockResolvedValueOnce({
                counts: { critical: 2, warning: 0, info: 0 },
                alerts: [{ severity: "critical", title: "New alert" }],
            });

        const composable = useDashboard();
        const firstRefresh = composable.refreshDashboard({ force: true });
        const secondRefresh = composable.refreshDashboard({ force: true });

        await secondRefresh;
        expect(composable.alertsData.value?.counts.critical).toBe(2);

        resolveFirstAlerts!({
            counts: { critical: 1, warning: 0, info: 0 },
            alerts: [{ severity: "critical", title: "Old alert" }],
        });
        await firstRefresh;
        await flushPromises();

        expect(composable.alertsData.value?.counts.critical).toBe(2);
    });
});
