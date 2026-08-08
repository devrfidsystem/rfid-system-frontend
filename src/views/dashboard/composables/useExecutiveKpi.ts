import { ref } from "vue";
import { useDebouncedWatch } from "@/composable/useDebouncedWatch";
import { useDashboardWarehouseFilter } from "./useDashboardWarehouseFilter";
import { dashboardService } from "@/services/dashboard.service";
import { dashboardRequestCache } from "./dashboardRequestCache";
import type {
    DashboardKpiDetailResponse,
    DashboardKpiDomain,
} from "@/model/dashboard";

type RefreshOptions = {
    force?: boolean;
};

export function useExecutiveKpi() {
    const {
        warehouseOptions,
        warehousesLoading,
        warehouseError,
        selectedWarehouseId,
        setSelectedWarehouse,
    } = useDashboardWarehouseFilter();

    const domain = ref<DashboardKpiDomain>("stockIn");
    const data = ref<DashboardKpiDetailResponse | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const createCacheKey = () =>
        [
            "kpi-detail",
            domain.value,
            selectedWarehouseId.value ?? "all-warehouses",
        ].join(":");

    const refresh = async (options: RefreshOptions = {}) => {
        const sequence = dashboardRequestCache.nextSequence("kpi-detail");
        loading.value = true;
        error.value = null;
        try {
            const result = await dashboardRequestCache.load(
                createCacheKey(),
                () =>
                    dashboardService.fetchKpiDetail(domain.value, {
                        warehouseId: selectedWarehouseId.value,
                    }),
                options,
            );
            if (dashboardRequestCache.isLatest("kpi-detail", sequence)) {
                data.value = result.data;
            }
        } catch (err) {
            if (dashboardRequestCache.isLatest("kpi-detail", sequence)) {
                error.value = err instanceof Error ? err.message : String(err);
            }
        } finally {
            if (dashboardRequestCache.isLatest("kpi-detail", sequence)) {
                loading.value = false;
            }
        }
    };

    const setDomain = async (next: DashboardKpiDomain) => {
        domain.value = next;
        await refresh();
    };

    useDebouncedWatch(selectedWarehouseId, () => {
        void refresh();
    });

    return {
        domain,
        setDomain,
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
