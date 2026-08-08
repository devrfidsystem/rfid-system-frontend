import { ref } from "vue";
import { useDebouncedWatch } from "@/composable/useDebouncedWatch";
import { useDashboardWarehouseFilter } from "./useDashboardWarehouseFilter";
import { dashboardService } from "@/services/dashboard.service";
import { dashboardRequestCache } from "./dashboardRequestCache";
import type {
    ProcessActivity,
    ProcessDetailResponse,
    ProcessPeriod,
} from "@/model/dashboard";

type RefreshOptions = {
    force?: boolean;
};

export function useProcessPerformance() {
    const {
        warehouseOptions,
        warehousesLoading,
        warehouseError,
        selectedWarehouseId,
        setSelectedWarehouse,
    } = useDashboardWarehouseFilter();

    const activity = ref<ProcessActivity>("receiving");
    const period = ref<ProcessPeriod>("week");
    const data = ref<ProcessDetailResponse | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const createCacheKey = () =>
        [
            "process-detail",
            activity.value,
            period.value,
            selectedWarehouseId.value ?? "all-warehouses",
        ].join(":");

    const refresh = async (options: RefreshOptions = {}) => {
        const sequence = dashboardRequestCache.nextSequence("process-detail");
        loading.value = true;
        error.value = null;
        try {
            const result = await dashboardRequestCache.load(
                createCacheKey(),
                () =>
                    dashboardService.fetchProcessDetail(
                        activity.value,
                        period.value,
                        { warehouseId: selectedWarehouseId.value },
                    ),
                options,
            );
            if (dashboardRequestCache.isLatest("process-detail", sequence)) {
                data.value = result.data;
            }
        } catch (err) {
            if (dashboardRequestCache.isLatest("process-detail", sequence)) {
                error.value = err instanceof Error ? err.message : String(err);
            }
        } finally {
            if (dashboardRequestCache.isLatest("process-detail", sequence)) {
                loading.value = false;
            }
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

    useDebouncedWatch(selectedWarehouseId, () => {
        void refresh();
    });

    return {
        activity,
        period,
        setActivity,
        setPeriod,
        data,
        loading,
        error,
        refresh,
        warehouseOptions,
        warehousesLoading,
        warehouseError,
        selectedWarehouseId,
        setSelectedWarehouse,
    };
}
