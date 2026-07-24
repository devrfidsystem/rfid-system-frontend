import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchProcessDetailMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/dashboard.service", () => ({
    dashboardService: {
        fetchProcessDetail: fetchProcessDetailMock,
    },
}));

vi.mock("@/store/warehouse.store", () => ({
    useWarehouseStore: () => ({ selectedWarehouseId: null }),
}));

import { useProcessPerformance } from "./useProcessPerformance";

describe("useProcessPerformance", () => {
    beforeEach(() => {
        fetchProcessDetailMock.mockReset();
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
});
