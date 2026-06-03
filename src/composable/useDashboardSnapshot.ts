import { ref, watch } from "vue";
import { dashboardService } from "@/services/dashboard.service";
import type {
    DashboardFilterState,
    DashboardSnapshot,
} from "@/model/dashboard";

export function useDashboardSnapshot(getFilter: () => DashboardFilterState) {
    const snapshot = ref<DashboardSnapshot | null>(null);
    const loading = ref(true);
    const error = ref<string | null>(null);

    const refresh = async () => {
        loading.value = true;
        error.value = null;
        try {
            snapshot.value = await dashboardService.fetchSnapshot(getFilter());
        } catch (err) {
            snapshot.value = null;
            error.value =
                err instanceof Error
                    ? err.message
                    : "Tidak dapat memuat data dashboard.";
        } finally {
            loading.value = false;
        }
    };

    watch(
        () => getFilter().warehouseId,
        () => {
            void refresh();
        },
        { immediate: true },
    );

    return { snapshot, loading, error, refresh } as const;
}
