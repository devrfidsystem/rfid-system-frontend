import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/store/auth.store";
import { masterEntities, supportedMasterEntities } from "../entityConfig";
import type { MasterEntityConfig } from "../entityConfig";
import type { EntityKey } from "@/model/entities";
import type { MasterEntityKey } from "@/api/feature/dto/master.dto";
import { warehouseService } from "@/services/warehouse.service";
import { useNotifier } from "@/composable/useNotifier";

export function useMasterContext() {
    const route = useRoute();
    const authStore = useAuthStore();
    const { notifyError } = useNotifier();

    const entityKey = computed(() => route.meta.entity as EntityKey);
    const config = computed<MasterEntityConfig>(() => {
        const c = masterEntities[entityKey.value];
        if (!c)
            throw new Error(
                `Entity "${String(entityKey.value)}" not configured`,
            );
        return c;
    });

    const isMasterApiEntity = (key: EntityKey): key is MasterEntityKey =>
        supportedMasterEntities.has(key as MasterEntityKey);

    const isMasterApiEntitySelected = computed(() =>
        isMasterApiEntity(entityKey.value),
    );

    const unsupportedFeatureMessage = computed(
        () =>
            config.value.unsupportedMessage ??
            `Fitur ${config.value.title} belum tersedia karena endpoint /${config.value.entity} belum disediakan.`,
    );

    const locationWarehouseId = ref<string | null>(null);

    const normalizeError = (error: unknown): string => {
        if (error instanceof Error) return error.message;
        if (typeof error === "string") return error;
        return "Gagal menghubungi server.";
    };

    const ensureLocationWarehouseContext = async (): Promise<string | null> => {
        if (locationWarehouseId.value) return locationWarehouseId.value;
        try {
            const warehouses = await warehouseService.fetchMyWarehouses();
            locationWarehouseId.value = warehouses.at(0)?.id ?? null;
            if (!locationWarehouseId.value) {
                notifyError(
                    "Tidak ada gudang yang dapat diakses untuk menampilkan lokasi.",
                );
                return null;
            }
            return locationWarehouseId.value;
        } catch (error) {
            notifyError(normalizeError(error));
            return null;
        }
    };

    const companyAwareEntities: MasterEntityKey[] = [
        "customers",
        "suppliers",
        "products",
        "uoms",
        "product-categories",
        "warehouses",
        "locations",
    ];

    return {
        route,
        authStore,
        entityKey,
        config,
        isMasterApiEntitySelected,
        isMasterApiEntity,
        unsupportedFeatureMessage,
        locationWarehouseId,
        ensureLocationWarehouseContext,
        companyAwareEntities,
        normalizeError,
    };
}
