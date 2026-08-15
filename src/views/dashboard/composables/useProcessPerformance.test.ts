import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchProcessDetailMock = vi.hoisted(() => vi.fn());
const setWarehouseMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/dashboard.service", () => ({
    dashboardService: {
        fetchProcessDetail: fetchProcessDetailMock,
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

import { useProcessPerformance } from "./useProcessPerformance";
import { dashboardRequestCache } from "./dashboardRequestCache";

describe("useProcessPerformance", () => {
    beforeEach(() => {
        dashboardRequestCache.clear();
        fetchProcessDetailMock.mockReset();
        setWarehouseMock.mockReset();
    });

    it("exposes the warehouse filter and delegates selection to the warehouse store", () => {
        const composable = useProcessPerformance();

        expect(composable.warehouseOptions.value).toEqual([
            { label: "Main Warehouse", value: "wh-1" },
        ]);
        expect(composable.selectedWarehouseId.value).toBeNull();

        composable.setSelectedWarehouse("wh-1");
        expect(setWarehouseMock).toHaveBeenCalledWith("wh-1");
    });

    it("defaults to the receiving activity and week period, and fetches on creation", async () => {
        fetchProcessDetailMock.mockResolvedValue({
            activity: "receiving",
            label: "Receiving",
        });

        const composable = useProcessPerformance();
        await composable.refresh();

        expect(composable.activity.value).toBe("receiving");
        expect(composable.period.value).toBe("week");
        expect(fetchProcessDetailMock).toHaveBeenCalledWith(
            "receiving",
            "week",
            { warehouseId: null },
        );
        expect(composable.data.value?.label).toBe("Receiving");
    });

    it("re-fetches when the activity changes", async () => {
        fetchProcessDetailMock.mockResolvedValue({
            activity: "outbound",
            label: "Outbound",
        });

        const composable = useProcessPerformance();
        await composable.setActivity("outbound");

        expect(composable.activity.value).toBe("outbound");
        expect(fetchProcessDetailMock).toHaveBeenCalledWith(
            "outbound",
            "week",
            { warehouseId: null },
        );
    });

    it("re-fetches when the period changes", async () => {
        fetchProcessDetailMock.mockResolvedValue({
            activity: "receiving",
            label: "Receiving",
        });

        const composable = useProcessPerformance();
        await composable.setPeriod("month");

        expect(composable.period.value).toBe("month");
        expect(fetchProcessDetailMock).toHaveBeenCalledWith(
            "receiving",
            "month",
            { warehouseId: null },
        );
    });

    it("sets an error message and clears loading when the fetch rejects", async () => {
        fetchProcessDetailMock.mockRejectedValue(new Error("network down"));

        const composable = useProcessPerformance();
        await composable.refresh();

        expect(composable.error.value).toBe("network down");
        expect(composable.loading.value).toBe(false);
    });

    it("uses cached data for repeated same-activity and same-period refreshes", async () => {
        fetchProcessDetailMock.mockResolvedValue({
            activity: "receiving",
            label: "Receiving",
        });

        const composable = useProcessPerformance();
        await composable.refresh();
        await composable.refresh();

        expect(fetchProcessDetailMock).toHaveBeenCalledTimes(1);
        expect(composable.data.value?.label).toBe("Receiving");
    });

    it("does not let a slower previous refresh overwrite a newer process result", async () => {
        let resolveFirstFetch: (value: unknown) => void;
        fetchProcessDetailMock
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveFirstFetch = resolve;
                    }),
            )
            .mockResolvedValueOnce({
                activity: "receiving",
                label: "New Process",
            });

        const composable = useProcessPerformance();
        const firstRefresh = composable.refresh({ force: true });
        const secondRefresh = composable.refresh({ force: true });

        await secondRefresh;
        expect(composable.data.value?.label).toBe("New Process");

        resolveFirstFetch!({
            activity: "receiving",
            label: "Old Process",
        });
        await firstRefresh;

        expect(composable.data.value?.label).toBe("New Process");
    });
});
