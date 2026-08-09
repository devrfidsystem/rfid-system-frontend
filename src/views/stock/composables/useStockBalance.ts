import { computed, reactive, ref, watch, onMounted } from "vue";
import { stockService } from "@/services/stock.service";
import { useWarehouseOptions } from "@/composable/useWarehouseOptions";
import { useDebouncedWatch } from "@/composable/useDebouncedWatch";
import type { StockBalanceRecord } from "@/model/entities";
import type { ApiMeta } from "@/lib/api/response";
import { reportService } from "@/services/report.service";
import { reportConfigs } from "@/domain/report/reportConfig";
import { useWarehouseStore } from "@/store/warehouse.store";

const columns = [
    { key: "productId", label: "Product" },
    { key: "warehouseId", label: "Warehouse" },
    { key: "locationPath", label: "Location" },
    { key: "quantity", label: "Quantity" },
];

type StockBalanceSortableRecord = StockBalanceRecord & {
    updatedAt?: string | number | Date | null;
};

export function useStockBalance() {
    const keyword = ref("");
    const rows = ref<StockBalanceRecord[]>([]);
    const sortOrder = ref<"desc" | "asc">("desc");
    const loading = ref(false);
    const error = ref<string | null>(null);
    const warehouseStore = useWarehouseStore();

    onMounted(() => {
        void loadRows();
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
    const selectedWarehouse = computed({
        get: () => warehouseStore.selectedWarehouseId ?? "",
        set: (value: string) => warehouseStore.setWarehouse(value || null),
    });

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
            const dateA = new Date(
                (a as StockBalanceSortableRecord).updatedAt ?? 0,
            ).getTime();
            const dateB = new Date(
                (b as StockBalanceSortableRecord).updatedAt ?? 0,
            ).getTime();
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

    const exportRows = async () => {
        try {
            const blob = await reportService.exportReport(
                "current-stock",
                {
                    page: pagination.page,
                    limit: pagination.limit,
                    search: keyword.value || undefined,
                    warehouseId: selectedWarehouse.value || undefined,
                },
                reportConfigs["current-stock"].columns,
            );
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.setAttribute(
                "download",
                `${reportConfigs["current-stock"].title}.xlsx`,
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            error.value =
                err instanceof Error
                    ? err.message
                    : "Failed to export stock balance.";
        }
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
            warehouseStore.syncWarehouseSelection(
                options.map((warehouse) => warehouse.id),
            );
        },
        { immediate: true },
    );

    return {
        columns,
        keyword,
        selectedWarehouse,
        warehouseSelectOptions,
        loading,
        error,
        displayRows,
        sortOrder,
        toggleSort,
        pagination,
        pageSizeOptions,
        refresh,
        exportRows,
    };
}
