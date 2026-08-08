import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const fetchMonitoringMock = vi.hoisted(() => vi.fn());
const setWarehouseMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/dashboard.service", () => ({
    dashboardService: {
        fetchMonitoring: fetchMonitoringMock,
    },
}));

vi.mock("@/store/warehouse.store", () => ({
    useWarehouseStore: () => ({
        selectedWarehouseId: null,
        setWarehouse: setWarehouseMock,
        syncWarehouseSelection: vi.fn(),
    }),
}));

vi.mock("@/composable/useWarehouseOptions", async () => {
    const { ref } = await import("vue");
    return {
        useWarehouseOptions: () => ({
            options: ref([{ id: "wh-1", name: "Main Warehouse", code: "WH1" }]),
            loading: ref(false),
            error: ref(null),
        }),
    };
});

vi.mock("@/store/auth.store", () => ({
    useAuthStore: () => ({ profile: { warehouses: [] } }),
}));

vi.mock("@/composable/useDebouncedWatch", () => ({
    useDebouncedWatch: vi.fn(),
}));

import { useMonitoring } from "./useMonitoring";

const emptyResponse = {
    domains: {
        stockIn: {
            label: "Stock In",
            health: "nominal",
            queueCount: 0,
            completedTodayCount: 0,
            exceptionsCount: 0,
            queueTasks: [],
        },
        stockOut: {
            label: "Stock Out",
            health: "nominal",
            queueCount: 0,
            completedTodayCount: 0,
            exceptionsCount: 0,
            queueTasks: [],
        },
        inventory: {
            label: "Inventory",
            health: "nominal",
            queueCount: 0,
            completedTodayCount: 0,
            exceptionsCount: 0,
            queueTasks: [],
        },
    },
    liveTransactions: [],
};

describe("useMonitoring", () => {
    beforeEach(() => {
        fetchMonitoringMock.mockReset();
        fetchMonitoringMock.mockResolvedValue(emptyResponse);
        setWarehouseMock.mockReset();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("exposes the warehouse filter and delegates selection to the warehouse store", () => {
        const composable = useMonitoring();

        expect(composable.warehouseOptions.value).toEqual([
            { label: "Main Warehouse", value: "wh-1" },
        ]);
        expect(composable.selectedWarehouseId.value).toBeNull();

        composable.setSelectedWarehouse("wh-1");
        expect(setWarehouseMock).toHaveBeenCalledWith("wh-1");
    });

    it("skips a poll tick if the previous fetch is still in flight", async () => {
        let resolveFirstFetch: (value: typeof emptyResponse) => void;
        fetchMonitoringMock.mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    resolveFirstFetch = resolve;
                }),
        );

        const composable = useMonitoring();
        composable.start();
        await vi.advanceTimersByTimeAsync(0);
        expect(fetchMonitoringMock).toHaveBeenCalledTimes(1);

        // The 20s tick fires while the first fetch is still pending — it
        // must be skipped rather than firing a second overlapping request.
        await vi.advanceTimersByTimeAsync(20000);
        expect(fetchMonitoringMock).toHaveBeenCalledTimes(1);

        resolveFirstFetch!(emptyResponse);
        await vi.advanceTimersByTimeAsync(0);

        // Once the in-flight fetch settles, the next tick fetches normally.
        await vi.advanceTimersByTimeAsync(20000);
        expect(fetchMonitoringMock).toHaveBeenCalledTimes(2);

        composable.stop();
    });

    it("fetches immediately on start() and shows a loading state during the initial fetch", async () => {
        const composable = useMonitoring();

        composable.start();
        expect(composable.loading.value).toBe(true);

        await vi.advanceTimersByTimeAsync(0);
        expect(composable.loading.value).toBe(false);
        expect(composable.data.value).toEqual(emptyResponse);
        expect(fetchMonitoringMock).toHaveBeenCalledTimes(1);

        composable.stop();
    });

    it("polls every 20 seconds after start() without toggling loading back to true", async () => {
        const composable = useMonitoring();

        composable.start();
        await vi.advanceTimersByTimeAsync(0);
        expect(fetchMonitoringMock).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(20000);
        expect(fetchMonitoringMock).toHaveBeenCalledTimes(2);
        expect(composable.loading.value).toBe(false);

        await vi.advanceTimersByTimeAsync(20000);
        expect(fetchMonitoringMock).toHaveBeenCalledTimes(3);
        expect(composable.loading.value).toBe(false);

        composable.stop();
    });

    it("stop() clears the interval so no further polling occurs", async () => {
        const composable = useMonitoring();

        composable.start();
        await vi.advanceTimersByTimeAsync(0);
        expect(fetchMonitoringMock).toHaveBeenCalledTimes(1);

        composable.stop();
        await vi.advanceTimersByTimeAsync(60000);
        expect(fetchMonitoringMock).toHaveBeenCalledTimes(1);
    });

    it("sets an error message and clears loading when the initial fetch rejects", async () => {
        fetchMonitoringMock.mockRejectedValue(new Error("network down"));
        const composable = useMonitoring();

        composable.start();
        await vi.advanceTimersByTimeAsync(0);

        expect(composable.error.value).toBe("network down");
        expect(composable.loading.value).toBe(false);

        composable.stop();
    });
});
