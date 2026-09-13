import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchKpiDetailMock = vi.hoisted(() => vi.fn());
const setWarehouseMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/dashboard.service", () => ({
    dashboardService: {
        fetchKpiDetail: fetchKpiDetailMock,
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

import { useExecutiveKpi } from "./useExecutiveKpi";
import { dashboardRequestCache } from "./dashboardRequestCache";

describe("useExecutiveKpi", () => {
    beforeEach(() => {
        dashboardRequestCache.clear();
        fetchKpiDetailMock.mockReset();
        setWarehouseMock.mockReset();
    });

    it("exposes the warehouse filter and delegates selection to the warehouse store", () => {
        const composable = useExecutiveKpi();

        expect(composable.warehouseOptions.value).toEqual([
            { label: "Main Warehouse", value: "wh-1" },
        ]);
        expect(composable.selectedWarehouseId.value).toBeNull();

        composable.setSelectedWarehouse("wh-1");
        expect(setWarehouseMock).toHaveBeenCalledWith("wh-1");
    });

    it("defaults to the stockIn domain and fetches on creation", async () => {
        fetchKpiDetailMock.mockResolvedValue({
            domain: "stockIn",
            label: "Stock In Performance",
        });

        const composable = useExecutiveKpi();
        await composable.refresh();

        expect(composable.domain.value).toBe("stockIn");
        expect(fetchKpiDetailMock).toHaveBeenCalledWith("stockIn", {
            warehouseId: null,
        });
        expect(composable.data.value?.label).toBe("Stock In Performance");
    });

    it("re-fetches when the domain changes", async () => {
        fetchKpiDetailMock.mockResolvedValue({
            domain: "inventory",
            label: "Inventory Performance",
        });

        const composable = useExecutiveKpi();
        await composable.setDomain("inventory");

        expect(composable.domain.value).toBe("inventory");
        expect(fetchKpiDetailMock).toHaveBeenCalledWith("inventory", {
            warehouseId: null,
        });
    });

    it("sets an error message and clears loading when the fetch rejects", async () => {
        fetchKpiDetailMock.mockRejectedValue(new Error("network down"));

        const composable = useExecutiveKpi();
        await composable.refresh();

        expect(composable.error.value).toBe("network down");
        expect(composable.loading.value).toBe(false);
    });

    it("uses cached data for repeated same-domain refreshes", async () => {
        fetchKpiDetailMock.mockResolvedValue({
            domain: "stockIn",
            label: "Stock In Performance",
        });

        const composable = useExecutiveKpi();
        await composable.refresh();
        await composable.refresh();

        expect(fetchKpiDetailMock).toHaveBeenCalledTimes(1);
        expect(composable.data.value?.label).toBe("Stock In Performance");
    });

    it("does not let a slower previous refresh overwrite a newer KPI result", async () => {
        let resolveFirstFetch: (value: unknown) => void;
        fetchKpiDetailMock
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveFirstFetch = resolve;
                    }),
            )
            .mockResolvedValueOnce({
                domain: "stockIn",
                label: "New KPI",
            });

        const composable = useExecutiveKpi();
        const firstRefresh = composable.refresh({ force: true });
        const secondRefresh = composable.refresh({ force: true });

        await secondRefresh;
        expect(composable.data.value?.label).toBe("New KPI");

        resolveFirstFetch!({
            domain: "stockIn",
            label: "Old KPI",
        });
        await firstRefresh;

        expect(composable.data.value?.label).toBe("New KPI");
    });
});
