import { ref } from "vue";
import { useWarehouseStore } from "@/store/warehouse.store";
import { dashboardService } from "@/services/dashboard.service";
import type {
    ProcessActivity,
    ProcessDetailResponse,
    ProcessPeriod,
} from "@/model/dashboard";

export function useProcessPerformance() {
    const warehouseStore = useWarehouseStore();

    const activity = ref<ProcessActivity>("receiving");
    const period = ref<ProcessPeriod>("week");
    const data = ref<ProcessDetailResponse | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const refresh = async () => {
        loading.value = true;
        error.value = null;
        try {
            data.value = await dashboardService.fetchProcessDetail(
                activity.value,
                period.value,
                { warehouseId: warehouseStore.selectedWarehouseId },
            );
        } catch (err) {
            error.value = err instanceof Error ? err.message : String(err);
        } finally {
            loading.value = false;
        }
    };

    const setActivity = async (next: ProcessActivity) => {
        activity.value = next;
        await refresh();
    };

    const setPeriod = async (next: ProcessPeriod) => {
        period.value = next;
        await refresh();
    };

    return {
        activity,
        period,
        setActivity,
        setPeriod,
        data,
        loading,
        error,
        refresh,
    };
}
