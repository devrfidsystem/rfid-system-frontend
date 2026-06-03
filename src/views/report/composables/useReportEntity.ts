import { computed, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
    reportConfigs,
    hasPartnerDatasetSupport,
    type ReportKey,
} from "../reportConfig";
import { reportService } from "@/services/report.service";
import { masterService } from "@/services/master.service";
import type { MasterEntityKey } from "@/api/feature/dto/master.dto";
import type { ReportRow, ReportParams } from "@/api/feature/dto/report.dto";
import { exportCsv } from "@/utils/exportCsv";
import { useWarehouseOptions } from "@/composable/useWarehouseOptions";
import type { ApiMeta } from "@/lib/api/response";
import { useDebouncedWatch } from "@/composable/useDebouncedWatch";

export function useReportEntity() {
    const route = useRoute();
    const reportKey = computed(() => route.meta.report as ReportKey);
    const config = computed(() => reportConfigs[reportKey.value]);

    const columns = computed(() => [
        ...config.value.columns,
        { key: "actions", label: "Actions" },
    ]);

    const rows = ref<ReportRow[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const keyword = ref("");
    const startDate = ref("");
    const endDate = ref("");
    const selectedWarehouse = ref("");
    const selectedPartner = ref("");
    const selectedRow = ref<Record<string, unknown> | null>(null);
    const partners = ref<Array<{ id: string; name: string }>>([]);
    const partnerError = ref<string | null>(null);

    const pagination = reactive({
        page: 1,
        limit: 20,
        total: 0,
    });
    const pageSizeOptions = [10, 20, 50];

    const {
        options: warehouseOptions,
        loading: warehousesLoading,
        error: warehouseError,
    } = useWarehouseOptions();

    const warehouseSelectOptions = computed(() =>
        warehouseOptions.value.map((warehouse) => ({
            label: `${warehouse.code} · ${warehouse.name}`,
            value: warehouse.id,
        })),
    );

    const partnerSelectOptions = computed(() =>
        partners.value.map((partner) => ({
            label: partner.name,
            value: partner.id,
        })),
    );

    const partnerFilterSupported = computed(() =>
        hasPartnerDatasetSupport(config.value.partnerDataset),
    );

    const unsupportedPartnerNotice = computed(() => {
        if (partnerFilterSupported.value || !config.value.partnerDataset) {
            return null;
        }
        return `Filter ${config.value.partnerLabel ?? "partner"} memerlukan endpoint "/${config.value.partnerDataset}" yang belum tersedia.`;
    });

    const hasSearchKeyword = computed(() => keyword.value.trim().length > 0);
    const hasActiveFilters = computed(() =>
        Boolean(
            startDate.value ||
            endDate.value ||
            selectedWarehouse.value ||
            selectedPartner.value,
        ),
    );

    const emptyStateVariant = computed<"default" | "search" | "filter">(() => {
        if (hasSearchKeyword.value) return "search";
        if (hasActiveFilters.value) return "filter";
        return "default";
    });

    const formatCellValue = (value: unknown) => {
        if (value === undefined || value === null || value === "") {
            return "-";
        }
        if (value instanceof Date) {
            return value.toLocaleString("id-ID");
        }
        if (typeof value === "object") {
            return JSON.stringify(value);
        }
        return String(value);
    };

    const tableRows = computed<Record<string, string | number>[]>(() =>
        rows.value.map((row, index) => {
            const tableRow: Record<string, string | number> = {
                id: String(row.id ?? row.docNo ?? `report-${index}`),
            };
            columns.value.forEach((column) => {
                tableRow[column.key] =
                    column.key === "actions"
                        ? ""
                        : formatCellValue(row[column.key]);
            });
            return tableRow;
        }),
    );

    const normalizeDate = (
        value: string,
        isEnd = false,
    ): string | undefined => {
        if (!value) return undefined;
        const time = isEnd ? "T23:59:59.999Z" : "T00:00:00.000Z";
        return `${value}${time}`;
    };

    let suppressFilterWatch = false;

    const buildParams = (): ReportParams => {
        const base: ReportParams = {
            page: pagination.page,
            limit: pagination.limit,
            search: keyword.value || undefined,
            dateFrom: normalizeDate(startDate.value),
            dateTo: normalizeDate(endDate.value, true),
            warehouseId: selectedWarehouse.value || undefined,
        };
        if (config.value.partnerKey && selectedPartner.value) {
            base[config.value.partnerKey] = selectedPartner.value;
        }
        return base;
    };

    const updatePaginationMeta = (meta: ApiMeta | null) => {
        if (!meta) {
            pagination.total = rows.value.length;
            return;
        }
        if (meta.page) pagination.page = meta.page;
        if (meta.limit) pagination.limit = meta.limit;
        if (typeof meta.total === "number") pagination.total = meta.total;
    };

    const loadPartnerOptions = async () => {
        partners.value = [];
        partnerError.value = null;
        if (!config.value.partnerDataset) {
            return;
        }
        try {
            const dataset = config.value.partnerDataset as MasterEntityKey;
            const response = await masterService.fetchList(dataset, {
                page: 1,
                limit: 200,
            });
            partners.value = response.items.map((record) => ({
                id: String(record.id ?? ""),
                name: String(
                    (record as unknown as Record<string, unknown>).name ??
                        (record as unknown as Record<string, unknown>).code ??
                        "Unknown",
                ),
            }));
        } catch (loadError) {
            partners.value = [];
            partnerError.value =
                loadError instanceof Error
                    ? loadError.message
                    : "Tidak dapat memuat partner.";
        }
    };

    const loadRows = async () => {
        loading.value = true;
        error.value = null;
        try {
            const params = buildParams();
            const response = await reportService.fetchReport(
                reportKey.value,
                params,
            );
            rows.value = response.items ?? [];
            updatePaginationMeta(response.meta);
        } catch (loadError) {
            rows.value = [];
            pagination.total = 0;
            error.value =
                loadError instanceof Error
                    ? loadError.message
                    : "Tidak dapat memuat laporan.";
        } finally {
            loading.value = false;
        }
    };

    const openDetail = (row: Record<string, unknown>) => {
        const originalRow = rows.value.find(
            (r) => String(r.id ?? r.docNo) === String(row.id),
        );
        selectedRow.value = originalRow ?? row;
    };

    const exportRows = () => {
        exportCsv(rows.value, `${config.value.title}.csv`);
    };

    const refreshRows = () => {
        pagination.page = 1;
        void loadRows();
    };

    const resetFilters = () => {
        suppressFilterWatch = true;
        keyword.value = "";
        startDate.value = "";
        endDate.value = "";
        selectedWarehouse.value = "";
        selectedPartner.value = "";
        pagination.page = 1;
        suppressFilterWatch = false;
        void loadRows();
    };

    watch(
        () => [pagination.page, pagination.limit],
        ([page, limit], [oldPage, oldLimit]) => {
            if (suppressFilterWatch) return;
            if (limit !== oldLimit && page !== 1) {
                pagination.page = 1;
                return;
            }
            if (page !== oldPage || limit !== oldLimit) {
                void loadRows();
            }
        },
    );

    useDebouncedWatch(
        () => [
            keyword.value,
            startDate.value,
            endDate.value,
            selectedWarehouse.value,
            selectedPartner.value,
        ],
        () => {
            if (suppressFilterWatch) return;
            pagination.page = 1;
            void loadRows();
        },
    );

    watch(
        reportKey,
        () => {
            suppressFilterWatch = true;
            keyword.value = "";
            startDate.value = "";
            endDate.value = "";
            selectedWarehouse.value = "";
            selectedPartner.value = "";
            pagination.page = 1;
            pagination.limit = 20;
            pagination.total = 0;
            selectedRow.value = null;
            suppressFilterWatch = false;
            void loadPartnerOptions();
            void loadRows();
        },
        { immediate: true },
    );

    return {
        config,
        columns,
        rows,
        loading,
        error,
        keyword,
        startDate,
        endDate,
        selectedWarehouse,
        selectedPartner,
        selectedRow,
        partnerError,
        pagination,
        pageSizeOptions,
        warehousesLoading,
        warehouseError,
        warehouseSelectOptions,
        partnerSelectOptions,
        partnerFilterSupported,
        unsupportedPartnerNotice,
        emptyStateVariant,
        tableRows,
        openDetail,
        exportRows,
        refreshRows,
        resetFilters,
    };
}
