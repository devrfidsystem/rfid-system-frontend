import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";
import { masterApi } from "./master.api";

vi.mock("@/lib/api/client", () => ({
    apiRequest: vi.fn(),
}));

describe("masterApi.remove", () => {
    beforeEach(() => {
        vi.mocked(apiRequest).mockReset();
        vi.mocked(apiRequest).mockResolvedValue({} as never);
    });

    it("deactivates products instead of hard deleting them", async () => {
        await masterApi.remove("products", "product-1");

        expect(apiRequest).toHaveBeenCalledWith({
            url: "/products/product-1/deactivate",
            method: "delete",
        });
    });

    it("deactivates warehouses instead of hard deleting them", async () => {
        await masterApi.remove("warehouses", "warehouse-1");

        expect(apiRequest).toHaveBeenCalledWith({
            url: "/warehouses/warehouse-1/deactivate",
            method: "delete",
        });
    });

    it("keeps hard delete for master entities that only expose delete", async () => {
        await masterApi.remove("locations", "location-1");

        expect(apiRequest).toHaveBeenCalledWith({
            url: "/locations/location-1",
            method: "delete",
        });
    });
});
