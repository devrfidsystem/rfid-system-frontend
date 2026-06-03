import type { StockBalanceRecord } from "@/model/entities";

export interface StockBalanceQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    companyId?: string;
    warehouseId?: string;
    locationId?: string;
    productId?: string;
    docReference?: string;
}

export interface StockBalanceResponse {
    items: StockBalanceRecord[];
}

export interface StockLedgerItem {
    id: string;
    epc?: string;
    productId?: string;
    quantity?: number;
    movementType?: string;
    documentRef?: string;
    warehouseId?: string;
    locationId?: string;
    timestamp?: string;
    status?: string;
    docNumber?: string;
}

export interface StockLedgerQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    companyId?: string;
    warehouseId?: string;
    locationId?: string;
    productId?: string;
    docReference?: string;
    movementType?: string;
}

export interface StockLedgerResponse {
    items: StockLedgerItem[];
}
