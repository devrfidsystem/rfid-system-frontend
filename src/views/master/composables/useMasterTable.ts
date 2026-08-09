import { ref, reactive, watch, computed } from "vue";
import { masterService } from "@/services/master.service";
import type { MasterRecord } from "@/domain/master/types";
import type { ApiMeta } from "@/lib/api/response";
import type {
    MasterEntityKey,
    MasterListParams,
} from "@/api/feature/dto/master.dto";
import { useDebouncedWatch } from "@/composable/useDebouncedWatch";
import type { useMasterContext } from "./useMasterContext";

export function useMasterTable(context: ReturnType<typeof useMasterContext>) {
    const {
        entityKey,
        isMasterApiEntity,
        isMasterApiEntitySelected,
        authStore,
        companyAwareEntities,
        ensureLocationWarehouseContext,
        normalizeError,
    } = context;

    const keyword = ref("");
    const rows = ref<MasterRecord[]>([]);
    const sortOrder = ref<"desc" | "asc">("desc");
    const loading = ref(true);
    const loadError = ref<string | null>(null);
    const unsupportedFeature = ref(false);
    const pagination = reactive({ page: 1, limit: 20, total: 0 });
    const filters = reactive({
        categoryId: "",
        uomId: "",
        type: "",
        warehouseId: "",
    });

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
                const warehouseId =
                    filters.warehouseId ||
                    (await ensureLocationWarehouseContext());
                if (!warehouseId) {
                    rows.value = [];
                    pagination.total = 0;
                    loadError.value =
                        "Lokasi hanya tersedia ketika Anda memiliki akses gudang.";
                    return null;
                }
                params.warehouseId = warehouseId;
            }
            if (entityKey.value === "products") {
                if (filters.categoryId) params.categoryId = filters.categoryId;
                if (filters.uomId) params.uomId = filters.uomId;
            }
            if (entityKey.value === "attributes" && filters.type) {
                params.type = filters.type;
            }
            if (
                companyAwareEntities.includes(selectedEntity) &&
                authStore.currentCompanyId
            ) {
                params.companyId = authStore.currentCompanyId;
            }
            return params;
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

    const resetFilters = () => {
        filters.categoryId = "";
        filters.uomId = "";
        filters.type = "";
        filters.warehouseId = "";
    };

    useDebouncedWatch(keyword, () => {
        pagination.page = 1;
        void loadRows();
    });

    useDebouncedWatch(
        () => [
            filters.categoryId,
            filters.uomId,
            filters.type,
            filters.warehouseId,
        ],
        () => {
            pagination.page = 1;
            void loadRows();
        },
    );

    const resetTableState = () => {
        keyword.value = "";
        resetFilters();
        pagination.page = 1;
        pagination.limit = 20;
        pagination.total = 0;
        unsupportedFeature.value = false;
    };

    watch(
        entityKey,
        () => {
            resetTableState();
            void loadRows();
        },
        { immediate: true },
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

    const toggleSort = () => {
        sortOrder.value = sortOrder.value === "desc" ? "asc" : "desc";
    };

    const displayRows = computed(() => {
        return [...rows.value].sort((a, b) => {
            const dateA = new Date(
                (a.createdAt ?? a.updatedAt ?? 0) as string | number,
            ).getTime();
            const dateB = new Date(
                (b.createdAt ?? b.updatedAt ?? 0) as string | number,
            ).getTime();
            return sortOrder.value === "desc" ? dateB - dateA : dateA - dateB;
        });
    });

    return {
        keyword,
        rows: displayRows,
        sortOrder,
        toggleSort,
        loading,
        loadError,
        unsupportedFeature,
        pagination,
        filters,
        resetFilters,
        loadRows,
        refresh,
    };
}
