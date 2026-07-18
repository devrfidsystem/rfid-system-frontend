import { defineStore } from "pinia";

const STORAGE_KEY = "rfid-active-warehouse";

const readStoredWarehouse = (): string | null => {
    if (typeof window === "undefined") {
        return null;
    }
    return window.localStorage.getItem(STORAGE_KEY);
};

export const useWarehouseStore = defineStore("warehouse", {
    state: () => ({
        selectedWarehouseId: readStoredWarehouse(),
    }),
    getters: {
        hasWarehouseSelection: (state) => Boolean(state.selectedWarehouseId),
    },
    actions: {
        setWarehouse(warehouseId: string | null) {
            this.selectedWarehouseId = warehouseId ?? null;
            if (typeof window === "undefined") {
                return;
            }
            if (warehouseId) {
                window.localStorage.setItem(STORAGE_KEY, warehouseId);
            } else {
                window.localStorage.removeItem(STORAGE_KEY);
            }
        },
        syncWarehouseSelection(warehouseIds: string[]) {
            if (!warehouseIds.length) {
                this.setWarehouse(null);
                return;
            }
            const currentSelection = this.selectedWarehouseId;
            const hasCurrentSelection =
                currentSelection && warehouseIds.includes(currentSelection);

            if (hasCurrentSelection) {
                return;
            }

            if (warehouseIds.length === 1) {
                this.setWarehouse(warehouseIds[0]);
                return;
            }

            this.setWarehouse(null);
        },
        clearWarehouse() {
            this.setWarehouse(null);
        },
    },
});
