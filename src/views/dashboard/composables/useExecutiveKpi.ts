import { ref } from "vue";
import { useWarehouseStore } from "@/store/warehouse.store";
import { dashboardService } from "@/services/dashboard.service";
import type {
    DashboardKpiDetailResponse,
    DashboardKpiDomain,
} from "@/model/dashboard";

export function useExecutiveKpi() {
    const warehouseStore = useWarehouseStore();

    const domain = ref<DashboardKpiDomain>("stockIn");
    const data = ref<DashboardKpiDetailResponse | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const refresh = async () => {
        loading.value = true;
        error.value = null;
        try {
            data.value = await dashboardService.fetchKpiDetail(domain.value, {
                warehouseId: warehouseStore.selectedWarehouseId,
            });
        } catch (err) {
            error.value = err instanceof Error ? err.message : String(err);
        } finally {
            loading.value = false;
        }
    };

    const setDomain = async (next: DashboardKpiDomain) => {
        domain.value = next;
        await refresh();
    };

    return {
        domain,
        setDomain,
        data,
        loading,
        error,
        refresh,
    };
}
