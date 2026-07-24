import { ref } from "vue";
import { useWarehouseStore } from "@/store/warehouse.store";
import { dashboardService } from "@/services/dashboard.service";
import type { MonitoringResponse } from "@/model/dashboard";

const POLL_INTERVAL_MS = 20000;

export function useMonitoring() {
    const warehouseStore = useWarehouseStore();

    const data = ref<MonitoringResponse | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const fetchMonitoring = async (showLoading: boolean): Promise<void> => {
        if (showLoading) loading.value = true;
        error.value = null;
        try {
            data.value = await dashboardService.fetchMonitoring({
                warehouseId: warehouseStore.selectedWarehouseId,
            });
        } catch (err) {
            error.value = err instanceof Error ? err.message : String(err);
        } finally {
            if (showLoading) loading.value = false;
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

    return { data, loading, error, refresh, start, stop };
}
