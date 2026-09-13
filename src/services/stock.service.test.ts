import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/feature/stock.api", () => ({
    stockApi: {
        fetchBalance: vi.fn(),
        fetchLedger: vi.fn(),
    },
}));

import { normalizeStockBalanceRecord } from "./stock.service";

describe("normalizeStockBalanceRecord", () => {
    it("preserves location-specific balance identity from composite stock fields", () => {
        const row = normalizeStockBalanceRecord({
            companyId: "company-1",
            warehouseId: "wh-1",
            locationId: "loc-a",
            productId: "prod-1",
            warehouse: { name: "Main Warehouse" },
            location: { name: "Rack A" },
            product: { name: "SKU A" },
            qty: 7,
        });

        expect(row.id).toBe("wh-1:loc-a:prod-1");
        expect(row.warehouseId).toBe("wh-1");
        expect(row.locationId).toBe("loc-a");
        expect(row.productId).toBe("prod-1");
        expect(row.warehouseName).toBe("Main Warehouse");
        expect(row.locationPath).toBe("Rack A");
        expect(row.productName).toBe("SKU A");
        expect(row.quantity).toBe(7);
    });
});
