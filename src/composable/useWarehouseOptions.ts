import { ref } from "vue";
import { warehouseService } from "@/services/warehouse.service";
import type { WarehouseOption } from "@/model/dashboard";

export function useWarehouseOptions() {
    const options = ref<WarehouseOption[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const load = async () => {
        loading.value = true;
        error.value = null;
        try {
            options.value = await warehouseService.fetchOptions();
        } catch (err) {
            error.value =
                err instanceof Error
                    ? err.message
                    : "Tidak dapat memuat daftar gudang.";
        } finally {
            loading.value = false;
        }
    };

    void load();

    return {
        options,
        loading,
        error,
        refresh: load,
    } as const;
}
