import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchKpiDetailMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/dashboard.service", () => ({
    dashboardService: {
        fetchKpiDetail: fetchKpiDetailMock,
    },
}));

vi.mock("@/store/warehouse.store", () => ({
    useWarehouseStore: () => ({ selectedWarehouseId: null }),
}));

import { useExecutiveKpi } from "./useExecutiveKpi";

describe("useExecutiveKpi", () => {
    beforeEach(() => {
        fetchKpiDetailMock.mockReset();
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
});
