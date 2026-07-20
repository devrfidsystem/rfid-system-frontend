import { dashboardApi } from "@/api/feature/dashboard.api";
import type { ApiResponse } from "@/lib/api/response";
import { locationService } from "@/services/location.service";
import { stockService } from "@/services/stock.service";
import type { LocationRecord, StockBalanceRecord } from "@/model/entities";
import type {
    DashboardLowStockResponse,
    DashboardDocCountsEntry,
    DashboardDocCountsResponse,
    DashboardEpcStatusResponse,
    DashboardRecentActivityResponse,
    DashboardStockSummaryResponse,
    DashboardAlertsResponse,
    DashboardWorkflowOverviewResponse,
    DashboardKpiSnapshotResponse,
    DashboardKpiDomain,
    DashboardKpiDetailResponse,
    ProcessActivity,
    ProcessPeriod,
    ProcessDetailResponse,
    MonitoringResponse,
} from "@/api/feature/dto/dashboard.dto";
import type {
    DashboardFilterState,
    DashboardHeatmapResponse,
    DashboardLowStockSummary,
    DashboardChartBar,
    DashboardLowStockSeverity,
} from "@/model/dashboard";
import type { LocationListResponse } from "@/api/feature/dto/location.dto";
import { useAuthStore } from "@/store/auth.store";

type DashboardQueryParameters = Record<string, string | number>;

const toParams = (filter: DashboardFilterState): DashboardQueryParameters => {
    const params: DashboardQueryParameters = {};
    const authStore = useAuthStore();
    const companyId =
        ((filter as unknown as Record<string, unknown>)?.companyId as
            | string
            | undefined) ??
        authStore.currentCompanyId ??
        undefined;
    if (companyId) params.companyId = companyId;
    if (filter.warehouseId) params.warehouseId = filter.warehouseId;
    return params;
};

const buildHeatmap = (
    stocks: StockBalanceRecord[],
    locations: LocationRecord[],
): DashboardHeatmapResponse => {
    if (!stocks.length || !locations.length) {
        return { rows: [], maxQuantity: 0 };
    }
    const quantities = new Map<string, number>();
    stocks.forEach((stock) => {
        const current = quantities.get(stock.locationId) ?? 0;
        quantities.set(stock.locationId, current + (stock.quantity ?? 0));
    });

    const rowMap = new Map<
        number,
        DashboardHeatmapResponse["rows"][number]["cells"]
    >();
    locations.forEach((location) => {
        const cell = {
            id: location.id,
            label: location.path,
            quantity: quantities.get(location.id) ?? 0,
        };
        const rowNo = location.rowNo ?? 0;
        const cells = rowMap.get(rowNo) ?? [];
        cells.push(cell);
        rowMap.set(rowNo, cells);
    });

    const rows = [...rowMap.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([row, cells]) => ({ row, cells }));

    const maxQuantity = Math.max(
        1,
        ...rows.flatMap((row) => row.cells.map((cell) => cell.quantity)),
    );

    return {
        rows,
        maxQuantity,
    };
};

const formatDocCountLabel = (key: string): string =>
    key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/^./, (char) => char.toUpperCase());

const buildChartBars = (
    entries: DashboardDocCountsEntry[],
): DashboardChartBar[] => {
    if (!entries.length) {
        return [];
    }
    const maxValue = Math.max(...entries.map((entry) => entry.value));
    return entries.map((entry) => ({
        id: entry.key,
        label: entry.label,
        value: entry.value,
        pct: maxValue ? Math.round((entry.value / maxValue) * 100) : 0,
        inboundTotal: entry.value,
        outboundTotal: 0,
    }));
};

const createDocCountEntries = (
    payload: DashboardDocCountsResponse,
): DashboardDocCountsEntry[] =>
    Object.entries(payload)
        .filter(([, value]) => typeof value === "number")
        .map(([key, value]) => ({
            key,
            label: formatDocCountLabel(key),
            value,
        }));

type DashboardLowStockRawResponse =
    | DashboardLowStockResponse
    | { data: DashboardLowStockResponse };

const resolveLowStockData = (
    payload: DashboardLowStockRawResponse,
): DashboardLowStockResponse => ("data" in payload ? payload.data : payload);

const toLowStockSummary = (
    payload: Record<string, unknown>,
): DashboardLowStockSummary => {
    const totalLowStock =
        typeof payload?.totalLowStock === "number"
            ? payload.totalLowStock
            : typeof payload?.count === "number"
              ? payload.count
              : 0;
    const rawItems = Array.isArray(payload.items) ? payload.items : [];

    const items = rawItems.map((rawItem) => {
        const item = rawItem as Record<string, unknown>;
        const productId = String(item.productId ?? item.itemId ?? "");
        const productCode = String(item.productCode ?? item.itemCode ?? "");
        const productName = String(item.productName ?? item.itemName ?? "");
        const warehouseCode = String(
            item.warehouseCode ?? item.warehouseName ?? "",
        );
        const warehouseName = String(
            item.warehouseName ?? item.warehouseCode ?? "",
        );
        const minStock =
            typeof item.minStock === "number"
                ? item.minStock
                : typeof item.minimumQty === "number"
                  ? item.minimumQty
                  : 0;
        const currentQty =
            typeof item.currentQty === "number"
                ? item.currentQty
                : typeof item.currentStock === "number"
                  ? item.currentStock
                  : 0;
        const shortageQty =
            typeof item.shortageQty === "number"
                ? item.shortageQty
                : Math.max(0, minStock - currentQty);
        const severity = String(
            item.severity ?? (currentQty === 0 ? "critical" : "warning"),
        ) as DashboardLowStockSeverity;

        return {
            productId,
            itemId: productId,
            productCode,
            itemCode: productCode,
            productName,
            itemName: productName,
            warehouseCode,
            warehouseName,
            warehouseId: String(item.warehouseId ?? ""),
            locationId: String(item.locationId ?? ""),
            locationCode: String(item.locationCode ?? ""),
            minStock,
            minimumQty: minStock,
            currentQty,
            currentStock: currentQty,
            shortageQty,
            severity,
        };
    });

    return {
        totalLowStock,
        items,
    };
};

const normalizeLocationItems = (
    response:
        | ApiResponse<LocationListResponse<LocationRecord>>
        | LocationListResponse<LocationRecord>,
): LocationRecord[] =>
    "data" in response ? response.data.items : response.items;

const normalizeStockItems = (
    response:
        | { items: StockBalanceRecord[] }
        | ApiResponse<{ items: StockBalanceRecord[] }>,
): StockBalanceRecord[] =>
    "data" in response ? response.data.items : response.items;

export const dashboardService = {
    async fetchSummary(
        filter: DashboardFilterState,
    ): Promise<DashboardStockSummaryResponse> {
        const response = await dashboardApi.fetchStockSummary(toParams(filter));
        return response.data;
    },

    async fetchChart(
        filter: DashboardFilterState,
    ): Promise<DashboardChartBar[]> {
        const response = await dashboardApi.fetchDocCounts(toParams(filter));
        return buildChartBars(createDocCountEntries(response.data));
    },

    async fetchLowStock(
        filter: DashboardFilterState,
    ): Promise<DashboardLowStockSummary> {
        const response = await dashboardApi.fetchLowStock(
            toParams(filter),
            6,
            1,
        );
        const payload = resolveLowStockData(
            response.data as DashboardLowStockRawResponse,
        );
        return toLowStockSummary(payload as unknown as Record<string, unknown>);
    },

    async fetchEpcStatus(
        filter: DashboardFilterState,
    ): Promise<DashboardEpcStatusResponse["byStatus"]> {
        const response = await dashboardApi.fetchEpcStatus(toParams(filter));
        return response.data.byStatus ?? [];
    },

    async fetchRecentActivity(
        filter: DashboardFilterState,
    ): Promise<DashboardRecentActivityResponse> {
        const response = await dashboardApi.fetchRecentActivity(
            toParams(filter),
        );
        return response.data ?? [];
    },

    async fetchHeatmap(
        filter: DashboardFilterState,
    ): Promise<DashboardHeatmapResponse> {
        const [balanceResponse, locationResponse] = await Promise.all([
            stockService.fetchBalance({
                warehouseId: filter.warehouseId ?? undefined,
                limit: 200,
            }),
            filter.warehouseId
                ? locationService.list({
                      warehouseId: filter.warehouseId,
                      limit: 200,
                  })
                : Promise.resolve({
                      success: true,
                      message: "OK",
                      data: { items: [] as LocationRecord[] },
                      error: null,
                      meta: null,
                  }),
        ]);

        return buildHeatmap(
            normalizeStockItems(balanceResponse),
            normalizeLocationItems(
                locationResponse as unknown as LocationListResponse<LocationRecord>,
            ), // Keep typing simple for internal conversion
        );
    },

    async fetchAlerts(
        filter: DashboardFilterState,
    ): Promise<DashboardAlertsResponse> {
        const response = await dashboardApi.fetchAlerts(toParams(filter));
        return response.data;
    },

    async fetchWorkflowOverview(
        filter: DashboardFilterState,
    ): Promise<DashboardWorkflowOverviewResponse> {
        const response = await dashboardApi.fetchWorkflowOverview(
            toParams(filter),
        );
        return response.data;
    },

    async fetchKpiSnapshot(
        filter: DashboardFilterState,
    ): Promise<DashboardKpiSnapshotResponse> {
        const response = await dashboardApi.fetchKpiSnapshot(toParams(filter));
        return response.data;
    },

    async fetchKpiDetail(
        domain: DashboardKpiDomain,
        filter: DashboardFilterState,
    ): Promise<DashboardKpiDetailResponse> {
        const response = await dashboardApi.fetchKpiDetail(
            domain,
            toParams(filter),
        );
        return response.data;
    },

    async fetchProcessDetail(
        activity: ProcessActivity,
        period: ProcessPeriod,
        filter: DashboardFilterState,
    ): Promise<ProcessDetailResponse> {
        const response = await dashboardApi.fetchProcessDetail(
            activity,
            period,
            toParams(filter),
        );
        return response.data;
    },

    async fetchMonitoring(
        filter: DashboardFilterState,
    ): Promise<MonitoringResponse> {
        const response = await dashboardApi.fetchMonitoring(toParams(filter));
        return response.data;
    },
};
