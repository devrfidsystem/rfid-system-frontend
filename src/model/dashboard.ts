import type { WarehouseRecord } from "@/model/entities";
import type {
    DashboardDocCountsEntry,
    DashboardEpcStatusItem,
    DashboardRecentActivityItem,
} from "@/api/feature/dto/dashboard.dto";

export type WarehouseOption = Pick<WarehouseRecord, "id" | "name" | "code">;

export interface DashboardFilterState {
    warehouseId: string | null;
}

export interface DashboardSummaryResponse {
    totalStock: number;
    epcActive: number;
    latestInboundDate: string | null;
    inboundToday: number;
    latestOutboundDate: string | null;
    outboundToday: number;
    opnamePending: number;
}

export interface DashboardHeatmapCell {
    id: string;
    label: string;
    quantity: number;
}

export interface DashboardHeatmapRow {
    row: number;
    cells: DashboardHeatmapCell[];
}

export interface DashboardHeatmapResponse {
    rows: DashboardHeatmapRow[];
    maxQuantity: number;
}

export interface DashboardChartBar {
    id: string;
    label: string;
    value: number;
    pct: number;
    inboundTotal: number;
    outboundTotal: number;
}

export type DashboardLowStockSeverity = "warning" | "critical";

export interface DashboardLowStockAlert {
    itemId: string;
    itemCode: string;
    itemName: string;
    warehouseId: string;
    warehouseName: string;
    currentStock: number;
    minimumQty: number;
    shortageQty: number;
    severity: DashboardLowStockSeverity;

    // Optional fields mapped from the backend response
    productId?: string;
    productCode?: string;
    productName?: string;
    warehouseCode?: string;
    locationId?: string;
    locationCode?: string;
    minStock?: number;
    currentQty?: number;
}

export interface DashboardLowStockSummary {
    totalLowStock: number;
    items: DashboardLowStockAlert[];
}

export interface DashboardSnapshot {
    summary: DashboardSummaryResponse;
    heatmap: DashboardHeatmapResponse;
    chart: DashboardChartBar[];
    lowStock: DashboardLowStockSummary;
    docCounts?: DashboardDocCountsEntry[];
    epcStatus?: DashboardEpcStatusItem[];
    recentActivity?: DashboardRecentActivityItem[];
}
