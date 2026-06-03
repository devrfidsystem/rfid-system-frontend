import type {
    DashboardLowStockAlert,
    DashboardSummaryResponse,
} from "@/model/dashboard";

export type DashboardStockSummaryResponse = DashboardSummaryResponse;

export interface DashboardLowStockResponse {
    totalLowStock: number;
    items: DashboardLowStockAlert[];
}

export interface DashboardDocCountsResponse {
    inboundPosted: number;
    outboundPosted: number;
    opnameClosed: number;
    [key: string]: number;
}

export interface DashboardDocCountsEntry {
    key: string;
    label: string;
    value: number;
}

export interface DashboardEpcStatusItem {
    status: string;
    count: number;
}

export interface DashboardEpcStatusResponse {
    total: number;
    byStatus: DashboardEpcStatusItem[];
}

export interface DashboardRecentActivityItem {
    id: string;
    timestamp?: string;
    productId?: string;
    quantity?: number;
    movementType: string;
    warehouseId?: string;
    locationId?: string;
    documentRef?: string;
    status?: string;

    // Backend payload fields
    qty: number;
    docReference: string;
    productCode: string;
    productName: string;
    warehouseCode: string;
    locationCode: string;
    createdAt: string;
}

export type DashboardRecentActivityResponse = DashboardRecentActivityItem[];
