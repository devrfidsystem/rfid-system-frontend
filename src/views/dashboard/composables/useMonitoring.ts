import { ref } from "vue";
import { useDebouncedWatch } from "@/composable/useDebouncedWatch";
import { useDashboardWarehouseFilter } from "./useDashboardWarehouseFilter";
import { dashboardService } from "@/services/dashboard.service";
import type { MonitoringResponse } from "@/model/dashboard";

const POLL_INTERVAL_MS = 20000;

export function useMonitoring() {
    const {
        warehouseOptions,
        warehousesLoading,
        warehouseError,
        selectedWarehouseId,
        setSelectedWarehouse,
    } = useDashboardWarehouseFilter();

    const data = ref<MonitoringResponse | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    let intervalId: ReturnType<typeof setInterval> | null = null;
    // Guards against overlapping requests: if a fetch takes longer than the
    // 20s poll interval, the next tick skips rather than firing a second
    // in-flight request whose (possibly out-of-order) response could
    // overwrite newer data.
    let isFetching = false;

    const fetchMonitoring = async (showLoading: boolean): Promise<void> => {
        if (isFetching) return;
        isFetching = true;
        if (showLoading) loading.value = true;
        error.value = null;
        try {
            data.value = await dashboardService.fetchMonitoring({
                warehouseId: selectedWarehouseId.value,
            });
        } catch (err) {
            error.value = err instanceof Error ? err.message : String(err);
        } finally {
            if (showLoading) loading.value = false;
            isFetching = false;
        }
    };

    /** Manual refresh — always shows the loading state (used by a future retry button). */
    const refresh = (): Promise<void> => fetchMonitoring(true);

    /** Initial fetch (with loading state) + starts the 20-second silent poll. */
    const start = (): void => {
        void fetchMonitoring(true);
        intervalId = setInterval(() => {
            void fetchMonitoring(false);
        }, POLL_INTERVAL_MS);
    };

    /** Clears the poll interval. Safe to call more than once. */
    const stop = (): void => {
        if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    useDebouncedWatch(selectedWarehouseId, () => {
        void fetchMonitoring(true);
    });

    return {
        data,
        loading,
        error,
        refresh,
        start,
        stop,
        warehouseOptions,
        warehousesLoading,
        warehouseError,
        selectedWarehouseId,
        setSelectedWarehouse,
    };
}
