import { computed, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { masterEntities, supportedMasterEntities } from "../entityConfig";
import type { MasterEntityConfig } from "../entityConfig";
import type { MasterRecord } from "../types";
import { masterService } from "@/services/master.service";
import { warehouseService } from "@/services/warehouse.service";
import { useNotifier } from "@/composable/useNotifier";
import { useAuthStore } from "@/store/auth.store";
import type { ApiMeta } from "@/lib/api/response";
import type { EntityKey } from "@/model/entities";
import type {
    MasterEntityKey,
    MasterListParams,
} from "@/api/feature/dto/master.dto";
import { useDebouncedWatch } from "@/composable/useDebouncedWatch";

export function useMasterEntity() {
    const route = useRoute();
    const { notifyError, withToast } = useNotifier();
    const authStore = useAuthStore();

    const entityKey = computed(() => route.meta.entity as EntityKey);
    const config = computed<MasterEntityConfig>(() => {
        const c = masterEntities[entityKey.value];
        if (!c)
            throw new Error(
                `Entity "${String(entityKey.value)}" not configured`,
            );
        return c;
    });

    const keyword = ref("");
    const rows = ref<MasterRecord[]>([]);
    const loading = ref(true);
    const loadError = ref<string | null>(null);
    const showAddModal = ref(false);
    const showEditModal = ref(false);
    const showDeleteModal = ref(false);
    const selectedRow = ref<MasterRecord | null>(null);
    const formState = reactive<Record<string, string>>({});
    const uomSelectOptions = ref<{ label: string; value: string }[]>([]);
    const categorySelectOptions = ref<{ label: string; value: string }[]>([]);
    const isSubmitting = ref(false);
    const isDeleting = ref(false);
    const locationWarehouseId = ref<string | null>(null);

    const unsupportedFeature = ref(false);
    const unsupportedFeatureMessage = computed(
        () =>
            config.value.unsupportedMessage ??
            `Fitur ${config.value.title} belum tersedia karena endpoint /${config.value.entity} belum disediakan.`,
    );

    const pagination = reactive({ page: 1, limit: 20, total: 0 });
    const companyAwareEntities: MasterEntityKey[] = [
        "customers",
        "suppliers",
        "products",
        "uoms",
        "product-categories",
        "warehouses",
        "locations",
    ];

    const columnDefs = computed(() =>
        config.value.columns.map((column) => ({
            ...column,
            accessor:
                column.accessor ?? ((row: MasterRecord) => row[column.key]),
        })),
    );

    const isMasterApiEntity = (key: EntityKey): key is MasterEntityKey =>
        supportedMasterEntities.has(key as MasterEntityKey);
    const isMasterApiEntitySelected = computed(() =>
        isMasterApiEntity(entityKey.value),
    );

    const showDeleteButton = computed(
        () =>
            isMasterApiEntity(entityKey.value) &&
            masterService.isRemovable(entityKey.value),
    );

    const resetForm = () => {
        config.value.formFields.forEach((field) => {
            formState[field.key] = "";
        });
    };

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

    const applyLocationWarehouseContext = async (
        payload: MasterRecord,
        row?: MasterRecord,
    ): Promise<void> => {
        if (entityKey.value !== "locations") return;
        const rowWarehouseId = row?.warehouseId;
        const contextWarehouseId = rowWarehouseId ?? locationWarehouseId.value;
        const warehouseId =
            contextWarehouseId ?? (await ensureLocationWarehouseContext());
        if (!warehouseId)
            throw new Error("Lokasi membutuhkan gudang yang valid.");
        payload.warehouseId = warehouseId;
    };

    const updatePaginationMeta = (meta: ApiMeta | null) => {
        if (!meta) {
            pagination.total = rows.value.length;
            return;
        }
        if (meta.page) pagination.page = meta.page;
        if (meta.limit) pagination.limit = meta.limit;
        if (typeof meta.total === "number") pagination.total = meta.total;
        else if (rows.value.length) pagination.total = rows.value.length;
    };

    const buildMasterListParams =
        async (): Promise<MasterListParams | null> => {
            const params: MasterListParams = {
                page: pagination.page,
                limit: pagination.limit,
                search: keyword.value || undefined,
            };
            const selectedEntity = entityKey.value as MasterEntityKey;
            if (entityKey.value === "locations") {
                const warehouseId = await ensureLocationWarehouseContext();
                if (!warehouseId) {
                    rows.value = [];
                    pagination.total = 0;
                    loadError.value =
                        "Lokasi hanya tersedia ketika Anda memiliki akses gudang.";
                    return null;
                }
                params.warehouseId = warehouseId;
            }
            if (
                companyAwareEntities.includes(selectedEntity) &&
                authStore.currentCompanyId
            ) {
                params.companyId = authStore.currentCompanyId;
            }
            return params;
        };

    const loadProductReferenceData = async () => {
        if (entityKey.value !== "products") {
            uomSelectOptions.value = [];
            categorySelectOptions.value = [];
            return;
        }
        try {
            const params = authStore.currentCompanyId
                ? { companyId: authStore.currentCompanyId }
                : undefined;
            const [uomRecords, categoryRecords] = await Promise.all([
                masterService.fetchOptions("uoms", params),
                masterService.fetchOptions("product-categories", params),
            ]);
            uomSelectOptions.value = uomRecords.map((uom) => ({
                value: uom.id,
                label:
                    [uom.symbol, uom.name].filter(Boolean).join(" · ") ||
                    uom.symbol ||
                    uom.name,
            }));
            categorySelectOptions.value = categoryRecords.map((category) => ({
                value: category.id,
                label: category.name,
            }));
        } catch {
            notifyError("Gagal memuat referensi produk.");
        }
    };

    const loadRows = async () => {
        loading.value = true;
        loadError.value = null;
        unsupportedFeature.value = false;
        try {
            const key = entityKey.value;
            if (!isMasterApiEntity(key)) {
                rows.value = [];
                pagination.page = 1;
                pagination.limit = 20;
                pagination.total = 0;
                unsupportedFeature.value = true;
                return;
            }
            const params = await buildMasterListParams();
            if (!params) return;
            const response = await masterService.fetchList(key, params);
            rows.value = response.items as MasterRecord[];
            updatePaginationMeta(response.meta);
        } catch (error) {
            rows.value = [];
            pagination.total = 0;
            loadError.value = normalizeError(error);
        } finally {
            loading.value = false;
        }
    };

    const refresh = () => {
        pagination.page = 1;
        void loadRows();
    };

    useDebouncedWatch(keyword, () => {
        pagination.page = 1;
        void loadRows();
    });

    const submitPayload = () => {
        const payload: MasterRecord = {};
        config.value.formFields.forEach((field) => {
            const value = formState[field.key]?.trim();
            if (!value) return;
            payload[field.key] = ["rowNo", "colNo"].includes(field.key)
                ? Number(value)
                : value;
        });
        return payload;
    };

    const attachCompanyContext = (
        payload: MasterRecord,
        row?: MasterRecord,
    ) => {
        const requiresCompany = companyAwareEntities.includes(
            entityKey.value as MasterEntityKey,
        );
        if (!requiresCompany) return;
        const companyId = row?.companyId ?? authStore.currentCompanyId;
        if (!companyId)
            throw new Error(
                "Tidak ada perusahaan aktif untuk menyimpan data master ini.",
            );
        payload.companyId = companyId;
    };

    const openAdd = () => {
        resetForm();
        if (!isMasterApiEntity(entityKey.value)) {
            loadError.value = "API endpoint not available for this entity.";
            return;
        }
        showAddModal.value = true;
    };

    const closeAdd = () => {
        showAddModal.value = false;
    };

    const openEdit = (row: MasterRecord) => {
        selectedRow.value = row;
        config.value.formFields.forEach((field) => {
            formState[field.key] =
                row[field.key] != null ? String(row[field.key]) : "";
        });
        showEditModal.value = true;
    };

    const closeEdit = () => {
        selectedRow.value = null;
        showEditModal.value = false;
    };

    const confirmDelete = (row: MasterRecord) => {
        selectedRow.value = row;
        showDeleteModal.value = true;
    };

    const closeDelete = () => {
        selectedRow.value = null;
        showDeleteModal.value = false;
    };

    const handleCreate = async () => {
        const payload = submitPayload();
        if (!Object.keys(payload).length) return;
        const key = entityKey.value;
        if (!isMasterApiEntity(key)) {
            loadError.value = "API endpoint not available for this entity.";
            return;
        }
        isSubmitting.value = true;
        try {
            await withToast(
                async () => {
                    await applyLocationWarehouseContext(payload);
                    attachCompanyContext(payload);
                    await masterService.create(key, payload as never);
                },
                {
                    successMessage: `Created ${config.value.title}`,
                    errorMessage: `Failed to create ${config.value.title}`,
                },
            );
            closeAdd();
            await loadRows();
        } finally {
            isSubmitting.value = false;
        }
    };

    const handleUpdate = async () => {
        const row = selectedRow.value;
        if (!row?.id) return;
        const payload = submitPayload();
        const key = entityKey.value;
        isSubmitting.value = true;
        try {
            await withToast(
                async () => {
                    if (!isMasterApiEntity(key)) {
                        throw new Error(
                            "API endpoint not available for this entity.",
                        );
                    }
                    await applyLocationWarehouseContext(payload, row);
                    attachCompanyContext(payload, row);
                    await masterService.update(
                        key,
                        String(row.id),
                        payload as never,
                    );
                },
                {
                    successMessage: `Updated ${config.value.title}`,
                    errorMessage: `Failed to update ${config.value.title}`,
                },
            );
            closeEdit();
            await loadRows();
        } finally {
            isSubmitting.value = false;
        }
    };

    const handleDelete = async () => {
        const row = selectedRow.value;
        if (!row?.id) return;
        const key = entityKey.value;
        isDeleting.value = true;
        try {
            await withToast(
                async () => {
                    if (
                        !isMasterApiEntity(key) ||
                        !masterService.isRemovable(key)
                    ) {
                        throw new Error(
                            "API endpoint not removable or not available.",
                        );
                    }
                    await masterService.remove(key, String(row.id));
                },
                {
                    successMessage: `Deleted ${config.value.title}`,
                    errorMessage: `Failed to delete ${config.value.title}`,
                },
            );
            closeDelete();
            await loadRows();
        } finally {
            isDeleting.value = false;
        }
    };

    const resetStateForEntity = () => {
        keyword.value = "";
        resetForm();
        selectedRow.value = null;
        closeAdd();
        closeEdit();
        closeDelete();
        pagination.page = 1;
        pagination.limit = 20;
        pagination.total = 0;
        unsupportedFeature.value = false;
    };

    watch(
        entityKey,
        () => {
            resetStateForEntity();
            void loadProductReferenceData();
            void loadRows();
        },
        { immediate: true },
    );

    watch(
        () => authStore.currentCompanyId,
        () => {
            if (entityKey.value === "products") void loadProductReferenceData();
        },
    );

    watch(
        () => [pagination.page, pagination.limit],
        ([page, limit], [oldPage, oldLimit]) => {
            if (!isMasterApiEntitySelected.value) return;
            if (limit !== oldLimit && page !== 1) {
                pagination.page = 1;
                return;
            }
            if (page !== oldPage || limit !== oldLimit) {
                void loadRows();
            }
        },
    );

    watch(
        () => route.fullPath,
        () => {
            closeAdd();
            closeEdit();
            closeDelete();
        },
    );

    return {
        config,
        keyword,
        rows,
        loading,
        loadError,
        showAddModal,
        showEditModal,
        showDeleteModal,
        formState,
        uomSelectOptions,
        categorySelectOptions,
        isSubmitting,
        isDeleting,
        unsupportedFeature,
        unsupportedFeatureMessage,
        pagination,
        columnDefs,
        isMasterApiEntitySelected,
        showDeleteButton,
        openAdd,
        closeAdd,
        openEdit,
        closeEdit,
        confirmDelete,
        closeDelete,
        handleCreate,
        handleUpdate,
        handleDelete,
        refresh,
    };
}
