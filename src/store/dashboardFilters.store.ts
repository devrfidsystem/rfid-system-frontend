import { defineStore } from "pinia";
import type { DashboardFilterState } from "@/model/dashboard";

const defaultFilterState = (): DashboardFilterState => ({
    warehouseId: null,
});

export const useDashboardFilters = defineStore("dashboardFilters", {
    state: (): { filter: DashboardFilterState } => ({
        filter: defaultFilterState(),
    }),
    getters: {
        warehouseId: (state) => state.filter.warehouseId,
    },
    actions: {
        setWarehouse(warehouseId: string | null) {
            this.filter.warehouseId = warehouseId ?? null;
        },
        setFilters(newState: DashboardFilterState) {
            this.filter = { ...newState };
        },
        resetFilters() {
            this.filter = defaultFilterState();
        },
    },
});
