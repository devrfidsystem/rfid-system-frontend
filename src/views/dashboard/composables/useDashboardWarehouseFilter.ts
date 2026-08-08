import { computed, watch } from "vue";
import { useWarehouseOptions } from "@/composable/useWarehouseOptions";
import { useAuthStore } from "@/store/auth.store";
import { useWarehouseStore } from "@/store/warehouse.store";

/**
 * Shared warehouse-filter wiring for every warehouse-scoped dashboard page
 * (Overview, KPI, Process Performance, Monitoring) — restricts the option
 * list to the user's assigned warehouses and exposes the selected id/setter
 * backed by the global warehouse store, so the filter stays in sync across
 * pages.
 */
export function useDashboardWarehouseFilter() {
    const authStore = useAuthStore();
    const warehouseStore = useWarehouseStore();

    const {
        options: warehouseOptionsRaw,
        loading: warehousesLoading,
        error: warehouseError,
    } = useWarehouseOptions();

    const selectableWarehouses = computed(() => {
        const userWarehouses = authStore.profile?.warehouses ?? [];
        const allowed = new Set(
            userWarehouses.map((warehouse) => warehouse.id),
        );
        if (!allowed.size) {
            return warehouseOptionsRaw.value;
        }
        return warehouseOptionsRaw.value.filter((option) =>
            allowed.has(option.id),
        );
    });

    const warehouseOptions = computed(() =>
        selectableWarehouses.value.map((wh) => ({
            label: wh.name,
            value: wh.id,
        })),
    );

    watch(
        selectableWarehouses,
        (options) => {
            warehouseStore.syncWarehouseSelection(
                options.map((warehouse) => warehouse.id),
            );
        },
        { immediate: true },
    );

    return {
        warehouseOptions,
        warehousesLoading,
        warehouseError,
        selectableWarehouses,
        selectedWarehouseId: computed(() => warehouseStore.selectedWarehouseId),
        setSelectedWarehouse: (warehouseId: string | null) =>
            warehouseStore.setWarehouse(warehouseId),
    };
}
