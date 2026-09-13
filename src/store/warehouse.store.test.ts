import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { useWarehouseStore } from "./warehouse.store";

describe("useWarehouseStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("keeps a valid current selection when warehouses change", () => {
        const store = useWarehouseStore();
        store.setWarehouse("WH-1");

        store.syncWarehouseSelection(["WH-1", "WH-2"]);

        expect(store.selectedWarehouseId).toBe("WH-1");
    });

    it("auto-selects the only warehouse when exactly one is available", () => {
        const store = useWarehouseStore();

        store.syncWarehouseSelection(["WH-9"]);

        expect(store.selectedWarehouseId).toBe("WH-9");
    });

    it("clears selection when multiple warehouses are available and none is active", () => {
        const store = useWarehouseStore();

        store.syncWarehouseSelection(["WH-1", "WH-2"]);

        expect(store.selectedWarehouseId).toBeNull();
    });

    it("clears selection when no warehouses are available", () => {
        const store = useWarehouseStore();
        store.setWarehouse("WH-1");

        store.syncWarehouseSelection([]);

        expect(store.selectedWarehouseId).toBeNull();
    });
});
