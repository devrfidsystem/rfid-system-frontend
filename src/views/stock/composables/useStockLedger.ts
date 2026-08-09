import { computed, reactive, ref, watch, onMounted } from "vue";
import { stockService } from "@/services/stock.service";
import { useWarehouseOptions } from "@/composable/useWarehouseOptions";
import { useDebouncedWatch } from "@/composable/useDebouncedWatch";
import type { StockLedgerItem } from "@/api/feature/dto/stock.dto";
import type { ApiMeta } from "@/lib/api/response";
import { formatDate } from "@/utils/date";
import { reportService } from "@/services/report.service";
import { reportConfigs } from "@/domain/report/reportConfig";
import { useWarehouseStore } from "@/store/warehouse.store";

const columns = [
    { key: "timestamp", label: "Timestamp" },
    { key: "docNumber", label: "Document" },
    { key: "epc", label: "EPC" },
    { key: "productId", label: "Product" },
    { key: "movementType", label: "Movement" },
    { key: "locationId", label: "Location" },
    { key: "quantity", label: "Qty" },
];

export function useStockLedger() {
    const keyword = ref("");
    const rows = ref<StockLedgerItem[]>([]);
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
        if (
            typeof value === "string" &&
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
        ) {
            return formatDate(value);
        }
        return String(value);
    };

    const toggleSort = () => {
        sortOrder.value = sortOrder.value === "desc" ? "asc" : "desc";
    };

    const displayRows = computed(() => {
        const sorted = [...rows.value].sort((a, b) => {
            const dateA = new Date(a.timestamp ?? 0).getTime();
            const dateB = new Date(b.timestamp ?? 0).getTime();
            return sortOrder.value === "desc" ? dateB - dateA : dateA - dateB;
        });

        return sorted.map((row) => ({
            id: row.id,
            timestamp: formatValue(row.timestamp),
            docNumber: formatValue(row.docNumber ?? row.documentRef),
            epc: formatValue(row.epc ?? row.productId),
            productId: formatValue(row.productId),
            movementType: formatValue(row.movementType),
            locationId: formatValue(row.locationId),
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
            const response = await stockService.fetchLedger({
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
                    : "Unable to load stock ledger.";
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
                "stock-period",
                {
                    page: pagination.page,
                    limit: pagination.limit,
                    search: keyword.value || undefined,
                    warehouseId: selectedWarehouse.value || undefined,
                },
                reportConfigs["stock-period"].columns,
            );
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.setAttribute(
                "download",
                `${reportConfigs["stock-period"].title}.xlsx`,
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            error.value =
                err instanceof Error
                    ? err.message
                    : "Failed to export stock ledger.";
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
