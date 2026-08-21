import { ref, toValue, watch, type MaybeRefOrGetter } from "vue";
import { warehouseService } from "@/services/warehouse.service";
import type { WarehouseOption } from "@/model/dashboard";

export function useWarehouseOptions(companyId?: MaybeRefOrGetter<string>) {
    const options = ref<WarehouseOption[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const load = async () => {
        const scopedCompanyId = toValue(companyId);
        loading.value = true;
        error.value = null;
        try {
            options.value =
                await warehouseService.fetchOptions(scopedCompanyId);
        } catch (err) {
            error.value =
                err instanceof Error
                    ? err.message
                    : "Tidak dapat memuat daftar gudang.";
        } finally {
            loading.value = false;
        }
    };

    watch(
        () => toValue(companyId),
        () => {
            void load();
        },
        { immediate: true },
    );

    return {
        options,
        loading,
        error,
        refresh: load,
    } as const;
}
