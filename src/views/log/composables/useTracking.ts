import { computed, reactive, ref } from "vue";
import { stockService } from "@/services/stock.service";
import { warehouseService } from "@/services/warehouse.service";
import type { StockLedgerItem } from "@/api/feature/dto/stock.dto";
import type { WarehouseOption } from "@/model/dashboard";

export function useTracking() {
    const epc = ref("EPC-A001");
    const events = ref<StockLedgerItem[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const warehouses = ref<WarehouseOption[]>([]);

    const pagination = reactive({
        page: 1,
        limit: 20,
        total: 0,
    });
    const pageSizeOptions = [10, 20, 50];

    const totalPages = computed(() =>
        Math.max(1, Math.ceil((pagination.total || 0) / pagination.limit)),
    );
    const loadEvents = async () => {
        loading.value = true;
        error.value = null;
        try {
            const response = await stockService.fetchLedger({
                page: pagination.page,
                limit: pagination.limit,
                search: epc.value,
            });
            events.value = response.items;
            if (response.meta) {
                if (response.meta.page) pagination.page = response.meta.page;
                if (response.meta.limit) pagination.limit = response.meta.limit;
                if (typeof response.meta.total === "number")
                    pagination.total = response.meta.total;
            }
        } catch (err) {
            error.value =
                err instanceof Error
                    ? err.message
                    : "Tidak dapat memuat data aktivitas.";
            events.value = [];
            pagination.total = 0;
        } finally {
            loading.value = false;
        }
    };

    const setPage = (value: number) => {
        const target = Math.max(1, Math.min(totalPages.value, value));
        if (target === pagination.page) return;
        pagination.page = target;
        void loadEvents();
    };

    const setLimit = (value: number) => {
        pagination.limit = value;
        pagination.page = 1;
        void loadEvents();
    };

    const loadWarehouses = async () => {
        try {
            warehouses.value = await warehouseService.fetchOptions();
        } catch {
            warehouses.value = [];
        }
    };

    const warehouseName = (id?: string) =>
        warehouses.value.find((wh) => wh.id === id)?.name ?? id ?? "";

    const emptyStateVariant = computed<"default" | "search" | "filter">(() =>
        epc.value.trim().length ? "search" : "default",
    );

    const sortedEvents = computed(() =>
        [...events.value].sort((a, b) => {
            const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return bTime - aTime;
        }),
    );

    loadWarehouses();
    loadEvents();

    return {
        epc,
        events,
        loading,
        error,
        pagination,
        pageSizeOptions,
        sortedEvents,
        emptyStateVariant,
        warehouseName,
        loadEvents,
        setPage,
        setLimit,
    };
}
