import { ref, type ComputedRef, type Ref } from "vue";
import type { EntityKey, LocationRecord } from "@/model/entities";
import type { MasterRecord } from "@/domain/master/types";
import { masterService } from "@/services/master.service";
import type { MasterFormValue } from "./masterFormTypes";

type SelectOption = { label: string; value: string };

interface UseMasterLocationReferencesOptions {
    entityKey: ComputedRef<EntityKey>;
    formState: Record<string, MasterFormValue>;
    authStore: { currentCompanyId?: string | null };
    locationWarehouseId: Ref<string | null>;
    ensureLocationWarehouseContext: () => Promise<string | null>;
    notifyError: (message: string) => void;
}

const isLocationsEntity = (entityKey: EntityKey) => entityKey === "locations";

const buildIndentedLocationLabel = (location: LocationRecord) => {
    const depth = Number(location.depth ?? 0);
    const prefix = depth > 0 ? `${"|-- ".repeat(depth)}` : "";
    return `${prefix}${location.name ?? location.path ?? location.code ?? location.id ?? ""}`;
};

export function useMasterLocationReferences({
    entityKey,
    formState,
    authStore,
    locationWarehouseId,
    ensureLocationWarehouseContext,
    notifyError,
}: UseMasterLocationReferencesOptions) {
    const warehouseSelectOptions = ref<SelectOption[]>([]);
    const locationSelectOptions = ref<SelectOption[]>([]);

    const loadLocationOptions = async (
        warehouseId: string,
        excludeId?: string,
    ) => {
        if (!isLocationsEntity(entityKey.value)) return;
        if (!warehouseId) {
            locationSelectOptions.value = [];
            return;
        }

        try {
            const params = authStore.currentCompanyId
                ? {
                      warehouseId,
                      limit: 200,
                      companyId: authStore.currentCompanyId,
                  }
                : { warehouseId, limit: 200 };
            const locations = await masterService.fetchList(
                "locations",
                params,
            );
            locationSelectOptions.value = locations.items
                .filter(
                    (location) =>
                        String(location.id) !== String(excludeId ?? ""),
                )
                .map((location) => ({
                    value: String(location.id),
                    label: buildIndentedLocationLabel(location),
                }));
        } catch {
            locationSelectOptions.value = [];
            notifyError("Gagal memuat parent location.");
        }
    };

    const loadLocationReferenceData = async () => {
        if (!isLocationsEntity(entityKey.value)) {
            warehouseSelectOptions.value = [];
            locationSelectOptions.value = [];
            return;
        }

        try {
            const params = authStore.currentCompanyId
                ? { companyId: authStore.currentCompanyId }
                : undefined;
            const warehouses = await masterService.fetchList("warehouses", {
                limit: 200,
                ...(params ?? {}),
            });
            warehouseSelectOptions.value = warehouses.items.map(
                (warehouse) => ({
                    value: String(warehouse.id),
                    label: warehouse.name,
                }),
            );

            const currentWarehouseId =
                formState.warehouseId?.toString() ||
                locationWarehouseId.value ||
                (await ensureLocationWarehouseContext()) ||
                "";
            if (currentWarehouseId) {
                formState.warehouseId = currentWarehouseId;
                await loadLocationOptions(currentWarehouseId);
            }
        } catch {
            notifyError("Gagal memuat referensi lokasi.");
        }
    };

    const applyLocationWarehouseContext = async (
        payload: Record<string, unknown>,
        row?: MasterRecord,
    ): Promise<void> => {
        if (!isLocationsEntity(entityKey.value)) return;
        const rowWarehouseId = row?.warehouseId;
        const selectedWarehouseId =
            typeof payload.warehouseId === "string" && payload.warehouseId
                ? payload.warehouseId
                : undefined;
        const contextWarehouseId =
            selectedWarehouseId ?? rowWarehouseId ?? locationWarehouseId.value;
        const warehouseId =
            contextWarehouseId ?? (await ensureLocationWarehouseContext());
        if (!warehouseId) {
            throw new Error("Lokasi membutuhkan gudang yang valid.");
        }
        payload.warehouseId = warehouseId;
    };

    const prepareLocationAdd = async () => {
        if (!isLocationsEntity(entityKey.value)) return;
        const warehouseId =
            locationWarehouseId.value ??
            (await ensureLocationWarehouseContext());
        if (warehouseId) {
            formState.warehouseId = warehouseId;
            await loadLocationOptions(warehouseId);
        }
    };

    const syncLocationRow = async (row: MasterRecord) => {
        if (!isLocationsEntity(entityKey.value)) return;
        const warehouseId = String(row.warehouseId ?? "");
        if (warehouseId) {
            formState.warehouseId = warehouseId;
            await loadLocationOptions(warehouseId, row.id);
        }
    };

    return {
        warehouseSelectOptions,
        locationSelectOptions,
        loadLocationReferenceData,
        loadLocationOptions,
        applyLocationWarehouseContext,
        prepareLocationAdd,
        syncLocationRow,
    };
}
