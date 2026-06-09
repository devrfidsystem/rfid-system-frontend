import { computed, reactive, ref, watch, onMounted, onUnmounted } from "vue";
import { stockService } from "@/services/stock.service";
import { useWarehouseOptions } from "@/composable/useWarehouseOptions";
import { useDebouncedWatch } from "@/composable/useDebouncedWatch";
import type { StockBalanceRecord } from "@/model/entities";
import type { ApiMeta } from "@/lib/api/response";

const columns = [
    { key: "productId", label: "Product" },
    { key: "warehouseId", label: "Warehouse" },
    { key: "locationPath", label: "Location" },
    { key: "quantity", label: "Quantity" },
];

export function useStockBalance() {
    const keyword = ref("");
    const selectedWarehouse = ref("");
    const rows = ref<StockBalanceRecord[]>([]);
    const sortOrder = ref<"desc" | "asc">("desc");
    const loading = ref(false);
    const error = ref<string | null>(null);

    const isFilterOpen = ref(false);
    const filterPopoverRef = ref<HTMLElement | null>(null);

    const toggleFilter = () => {
        isFilterOpen.value = !isFilterOpen.value;
    };

    const closeFilter = (e: Event) => {
        if (
            filterPopoverRef.value &&
            !filterPopoverRef.value.contains(e.target as Node)
        ) {
            isFilterOpen.value = false;
        }
    };

    onMounted(() => {
        document.addEventListener("click", closeFilter);
        void loadRows();
    });

    onUnmounted(() => {
        document.removeEventListener("click", closeFilter);
    });

    const pagination = reactive({
        page: 1,
        limit: 20,
        total: 0,
    });
    const pageSizeOptions = [10, 20, 50];
    const warehouseOptions = useWarehouseOptions();

    const warehouseSelectOptions = computed(() =>
        warehouseOptions.options.value.map((warehouse) => ({
            value: warehouse.id,
            label: `${warehouse.code} · ${warehouse.name}`,
        })),
    );

    const formatValue = (value: unknown) => {
        if (value === undefined || value === null) {
            return "-";
        }
        return String(value);
    };

    const toggleSort = () => {
        sortOrder.value = sortOrder.value === "desc" ? "asc" : "desc";
    };

    const displayRows = computed(() => {
        const sorted = [...rows.value].sort((a, b) => {
            const dateA = new Date((a as any).updatedAt ?? 0).getTime();
            const dateB = new Date((b as any).updatedAt ?? 0).getTime();
            return sortOrder.value === "desc" ? dateB - dateA : dateA - dateB;
        });

        return sorted.map((row) => ({
            id: row.id,
            productId: formatValue(row.productId),
            warehouseId: formatValue(row.warehouseId),
            locationPath: formatValue(row.locationPath),
            quantity: formatValue(row.quantity),
        }));
    });

    const updatePaginationMeta = (meta: ApiMeta | null) => {
        if (meta === null) {
            pagination.total = rows.value.length;
            return;
        }
        if (meta.page) pagination.page = meta.page;
        if (meta.limit) pagination.limit = meta.limit;
        if (typeof meta.total === "number") {
            pagination.total = meta.total;
        } else if (rows.value.length) {
            pagination.total = rows.value.length;
        }
    };

    const loadRows = async () => {
        loading.value = true;
        error.value = null;
        try {
            const response = await stockService.fetchBalance({
                page: pagination.page,
                limit: pagination.limit,
                search: keyword.value || undefined,
                warehouseId: selectedWarehouse.value || undefined,
            });
            rows.value = response.items;
            updatePaginationMeta(response.meta);
        } catch (err) {
            rows.value = [];
            pagination.total = 0;
            error.value =
                err instanceof Error
                    ? err.message
                    : "Unable to load stock balances.";
        } finally {
            loading.value = false;
        }
    };

    const refresh = () => {
        pagination.page = 1;
        void loadRows();
    };

    useDebouncedWatch([keyword, selectedWarehouse], () => {
        pagination.page = 1;
        void loadRows();
    });

    watch(
        () => [pagination.page, pagination.limit],
        ([page, limit], [oldPage, oldLimit]) => {
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
        () => warehouseOptions.options.value,
        (options) => {
            if (options.length === 1 && selectedWarehouse.value === "") {
                selectedWarehouse.value = options[0].id;
            }
        },
    );

    return {
        columns,
        keyword,
        selectedWarehouse,
        warehouseSelectOptions,
        isFilterOpen,
        filterPopoverRef,
        toggleFilter,
        loading,
        error,
        displayRows,
        sortOrder,
        toggleSort,
        pagination,
        pageSizeOptions,
        refresh,
    };
}
