import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    fetchOptions: vi.fn(),
}));

vi.mock("@/api/feature/warehouse.api", () => ({
    warehouseApi: {
        fetchOptions: mocks.fetchOptions,
    },
}));

describe("warehouse.service", () => {
    beforeEach(() => {
        mocks.fetchOptions.mockReset().mockResolvedValue({
            data: {
                items: [
                    {
                        id: "warehouse-1",
                        code: "WH-A",
                        name: "Warehouse A",
                    },
                ],
            },
        });
    });

    it("passes company scope when loading warehouse options", async () => {
        const { warehouseService } = await import("./warehouse.service");

        const result = await warehouseService.fetchOptions("company-1");

        expect(mocks.fetchOptions).toHaveBeenCalledWith({
            companyId: "company-1",
        });
        expect(result).toEqual([
            {
                id: "warehouse-1",
                code: "WH-A",
                name: "Warehouse A",
            },
        ]);
    });
});
