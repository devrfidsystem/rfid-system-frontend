import { computed, reactive, ref, watch } from "vue";
import { useWarehouseOptions } from "@/composable/useWarehouseOptions";
import { masterService } from "@/services/master.service";
import {
    transactionService,
    type TransactionKey,
} from "@/services/transactions.service";
import { transactionPaths } from "@/api/feature/dto/transactions.dto";
import { reportService } from "@/services/report.service";
import {
    reportConfigs,
    hasPartnerDatasetSupport,
    type ReportKey,
} from "@/domain/report/reportConfig";
import type { ApiMeta } from "@/lib/api/response";
import type { ReportParams } from "@/api/feature/dto/report.dto";
import type { TransactionRecord, TransactionSummaryResponse } from "../types";
import { useDebouncedWatch } from "@/composable/useDebouncedWatch";
import { formatDate } from "@/utils/date";
import { getNestedValue } from "../utils/getNestedValue";
import { useWarehouseStore } from "@/store/warehouse.store";

type TransactionRow = TransactionRecord & Record<string, unknown>;
type TransactionSortableRecord = TransactionRecord & {
    createdAt?: string | number | Date | null;
};

const transactionTitles: Record<
    TransactionKey,
    { title: string; description: string }
> = {
    register: {
        title: "Register Tasks",
        description: "Admin task documents recorded via /register.",
    },
    inbound: {
        title: "Inbound Documents",
        description:
            "Inbound documents recorded via /inbound for receipt detail review.",
    },
    putaway: {
        title: "Putaway Tasks",
        description: "Storage placement tasks generated through /putaway.",
    },
    outbound: {
        title: "Outbound Assignment",
        description:
            "Manage outbound tasks and execution progress from /outbound.",
    },
    relocation: {
        title: "Relocation Transactions",
        description: "See inventory movements between locations (/relocation).",
    },
    transfer: {
        title: "Transfer Transactions",
        description: "Supervise inter-warehouse transfers driven by /transfer.",
    },
    return: {
        title: "Return Transactions",
        description: "Reverse logistics flows coming from /returns.",
    },
    opname: {
        title: "Opname Transactions",
        description: "Stock opname schedules maintained by /opname.",
    },
    returns: {
        title: "Return Transactions",
        description: "Reverse logistics flows coming from /returns.",
    },
};

// The backend only implements Excel export for `/reports/inbound/export` and
// `/reports/outbound/export` (see reports.controller.ts's exportReport
// switch: stock-balance/stock-movement/inbound/outbound/opname-variance).
// Every other transaction type's reportPaths entry points at its own entity
// route (e.g. /putaway, /relocation), which has no `/export` sibling on the
// backend at all — exporting those 404s regardless of any UI gating.
const exportableTransactionKeys = new Set<TransactionKey>([
    "inbound",
    "outbound",
]);

const transactionToReportKey: Record<TransactionKey, ReportKey> = {
    register: "register",
    inbound: "inbound",
    putaway: "putaway",
    outbound: "outbound",
    relocation: "relocation",
    transfer: "transfer",
    return: "return",
    returns: "return",
    opname: "stock-opname",
};

export function useTransactionList(props: { transactionKey: TransactionKey }) {
    const keyword = ref("");
    const startDate = ref("");
    const endDate = ref("");
    const selectedPartner = ref("");
    const rows = ref<TransactionRecord[]>([]);
    const summary = ref<TransactionSummaryResponse | null>(null);
    const summaryLoading = ref(false);
    const summaryError = ref<string | null>(null);
    const sortOrder = ref<"desc" | "asc">("desc");
    const loading = ref(false);
    const error = ref<string | null>(null);
    const pagination = reactive({
        page: 1,
        limit: 20,
        total: 0,
    });
    const pageSizeOptions = [10, 20, 50];
    const partners = ref<{ id: string; name: string }[]>([]);
    const partnerError = ref<string | null>(null);
    const warehouseOptions = useWarehouseOptions();
    const suppressFilterWatch = ref(false);
    const warehouseStore = useWarehouseStore();

    const transactionKey = computed(() => props.transactionKey);
    const config = computed(
        () => reportConfigs[transactionToReportKey[transactionKey.value]],
    );
    const partnerLabel = computed(() => config.value.partnerLabel ?? "Partner");
    const showWarehouseFilter = computed(() =>
        Boolean(config.value.warehouseKey),
    );
    const partnerFilterSupported = computed(() =>
        hasPartnerDatasetSupport(config.value.partnerDataset),
    );
    const selectedWarehouse = computed({
        get: () => warehouseStore.selectedWarehouseId ?? "",
        set: (value: string) => warehouseStore.setWarehouse(value || null),
    });

    const pageTitle = computed(
        () =>
            transactionTitles[transactionKey.value]?.title ??
            config.value.title,
    );
    const pageTagline = computed(() => {
        if (transactionKey.value === "register") return "Tasks";
        if (transactionKey.value === "putaway") return "Tasks";
        if (transactionKey.value === "outbound") return "Tasks";
        if (transactionKey.value === "inbound") return "Documents";
        return "Transactions";
    });
    const sectionHeading = computed(() => pageTitle.value);
    const canCreate = computed(() => transactionKey.value !== "inbound");
    const canExport = computed(() =>
        exportableTransactionKeys.has(transactionKey.value),
    );
    const pageDescription = computed(() => {
        const base =
            transactionTitles[transactionKey.value]?.description ??
            config.value.description;
        return `${base} · powered by ${transactionPaths[transactionKey.value]}`;
    });

    const columns = computed(() => [
        ...config.value.columns,
        { key: "actions", label: "" },
    ]);

    const formatValue = (value: unknown) => {
        if (value === undefined || value === null) return "-";
        if (
            typeof value === "string" &&
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
        ) {
            return formatDate(value);
        }
        if (typeof value === "object") {
            if (Array.isArray(value)) return value.join(", ");
            return JSON.stringify(value);
        }
        return String(value);
    };

    const toggleSort = () => {
        sortOrder.value = sortOrder.value === "desc" ? "asc" : "desc";
    };

    const tableRows = computed(() => {
        const sorted = [...rows.value].sort((a, b) => {
            const dateA = new Date(
                (a as TransactionSortableRecord).createdAt ?? 0,
            ).getTime();
            const dateB = new Date(
                (b as TransactionSortableRecord).createdAt ?? 0,
            ).getTime();
            return sortOrder.value === "desc" ? dateB - dateA : dateA - dateB;
        });

        return sorted.map((row, index) => {
            const record: Record<string, string | number> = {
                id: String(row.id ?? row.docNo ?? `row-${index}`),
            };
            columns.value.forEach((column) => {
                let value = getNestedValue(row as TransactionRow, column.key);

                // Map warehouseId to human-readable label if possible
                if (column.key === "warehouseId") {
                    const foundWarehouse = warehouseSelectOptions.value.find(
                        (w) => w.value === value,
                    );
                    if (foundWarehouse) {
                        value = foundWarehouse.label;
                    }
                }

                record[column.key] = formatValue(value);
            });
            return record;
        });
    });

    const displayRows = tableRows;

    const warehouseSelectOptions = computed(() =>
        warehouseOptions.options.value.map((warehouse) => ({
            value: warehouse.id,
            label: `${warehouse.code} · ${warehouse.name}`,
        })),
    );

    const partnerSelectOptions = computed(() =>
        partners.value.map((partner) => ({
            label: partner.name,
            value: partner.id,
        })),
    );

    const emptyStateVariant = computed<"default" | "search">(() =>
        keyword.value.trim() ? "search" : "default",
    );

    const normalizeDate = (value: string, end = false): string | undefined => {
        if (!value) return undefined;
        const time = end ? "T23:59:59.999Z" : "T00:00:00.000Z";
        return `${value}${time}`;
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

    const buildParams = (): ReportParams => {
        const base: ReportParams = {
            page: pagination.page,
            limit: pagination.limit,
            search: keyword.value || undefined,
            dateFrom: normalizeDate(startDate.value),
            dateTo: normalizeDate(endDate.value, true),
        };
        const warehouseKey = config.value.warehouseKey ?? "warehouseId";
        if (selectedWarehouse.value) {
            base[warehouseKey] = selectedWarehouse.value;
        }
        if (config.value.partnerKey && selectedPartner.value) {
            base[config.value.partnerKey] = selectedPartner.value;
        }
        return base;
    };

    const loadPartnerOptions = async () => {
        partners.value = [];
        partnerError.value = null;
        if (!config.value.partnerDataset) return;
        try {
            const dataset = config.value
                .partnerDataset as import("@/api/feature/dto/master.dto").MasterEntityKey;
            const response = await masterService.fetchList(dataset, {
                page: 1,
                limit: 200,
            });
            partners.value = response.items.map((record) => {
                const item = record as unknown as {
                    id?: string | number;
                    name?: string;
                    code?: string;
                };
                return {
                    id: String(item.id ?? ""),
                    name: String(item.name ?? item.code ?? "Unknown"),
                };
            });
        } catch (err) {
            partnerError.value =
                err instanceof Error
                    ? err.message
                    : "Unable to load partner list.";
        }
    };

    const loadRows = async () => {
        loading.value = true;
        error.value = null;
        try {
            const params = buildParams();
            const response = await transactionService.list(
                transactionKey.value,
                params,
            );
            rows.value = response.items;
            updatePaginationMeta(response.meta);
        } catch (err) {
            rows.value = [];
            pagination.total = 0;
            error.value =
                err instanceof Error
                    ? err.message
                    : "Failed to load transactions.";
        } finally {
            loading.value = false;
        }
    };

    const loadSummary = async () => {
        summaryLoading.value = true;
        summaryError.value = null;
        try {
            const params = buildParams();
            summary.value = await transactionService.summary(
                transactionKey.value,
                params,
            );
        } catch (err) {
            summary.value = null;
            summaryError.value =
                err instanceof Error
                    ? err.message
                    : "Failed to load transaction summary.";
        } finally {
            summaryLoading.value = false;
        }
    };

    const exportRows = async () => {
        try {
            const params = buildParams();
            const exportColumns = config.value.columns.filter(
                (column) => column.key !== "actions" && column.key !== "id",
            );
            const blob = await reportService.exportReport(
                transactionToReportKey[transactionKey.value],
                params,
                exportColumns,
            );

            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.setAttribute("download", `${config.value.title}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            error.value =
                err instanceof Error
                    ? err.message
                    : "Failed to export transactions.";
        }
    };

    const refresh = () => {
        pagination.page = 1;
        void loadRows();
        void loadSummary();
    };

    useDebouncedWatch(
        () => [
            keyword.value,
            startDate.value,
            endDate.value,
            selectedWarehouse.value,
            selectedPartner.value,
        ],
        () => {
            if (suppressFilterWatch.value) return;
            pagination.page = 1;
            void loadRows();
            void loadSummary();
        },
    );

    watch(
        () => [pagination.page, pagination.limit],
        ([page, limit], [oldPage, oldLimit]) => {
            if (suppressFilterWatch.value) return;
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
        () => props.transactionKey,
        () => {
            suppressFilterWatch.value = true;
            keyword.value = "";
            startDate.value = "";
            endDate.value = "";
            selectedWarehouse.value = "";
            selectedPartner.value = "";
            pagination.page = 1;
            pagination.limit = 20;
            pagination.total = 0;
            rows.value = [];
            partners.value = [];
            suppressFilterWatch.value = false;
            void loadPartnerOptions();
            void loadRows();
            void loadSummary();
        },
        { immediate: true },
    );

    watch(
        () => config.value.partnerDataset,
        () => {
            if (config.value.partnerDataset) {
                void loadPartnerOptions();
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
        pageTitle,
        pageTagline,
        sectionHeading,
        canCreate,
        canExport,
        pageDescription,
        keyword,
        startDate,
        endDate,
        selectedWarehouse,
        selectedPartner,
        showWarehouseFilter,
        partnerFilterSupported,
        warehouseSelectOptions,
        partnerSelectOptions,
        partnerLabel,
        partnerError,
        error,
        loading,
        pagination,
        pageSizeOptions,
        rows,
        summary,
        summaryLoading,
        summaryError,
        displayRows,
        columns,
        emptyStateVariant,
        sortOrder,
        toggleSort,
        exportRows,
        refresh,
    };
}
