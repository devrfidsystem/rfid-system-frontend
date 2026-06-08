/* eslint-disable @typescript-eslint/no-explicit-any */
import { normalizePaginationItems } from "@/lib/api/normalizers";
import type { ApiResponse, ApiPaginatedResult } from "@/lib/api/response";
import type { StockBalanceRecord } from "@/model/entities";
import type {
    StockBalanceQueryParams,
    StockBalanceResponse,
    StockLedgerQueryParams,
    StockLedgerResponse,
    StockLedgerItem,
} from "@/api/feature/dto/stock.dto";
import { stockApi } from "@/api/feature/stock.api";

export const normalizeStockBalanceRecord = (row: any): StockBalanceRecord => {
    if (!row) return row;
    const mapped: any = { ...row };
    mapped.productId = row.product?.name ?? row.productId;
    mapped.warehouseId = row.warehouse?.name ?? row.warehouseId;
    mapped.locationPath =
        row.location?.name ?? row.locationPath ?? row.locationId;
    mapped.quantity = row.qty ?? row.qty_on_hand ?? row.quantity;
    return mapped as StockBalanceRecord;
};

export const normalizeStockLedgerRecord = (row: any): StockLedgerItem => {
    if (!row) return row;
    const mapped: any = { ...row };
    mapped.timestamp = row.createdAt ?? row.timestamp;
    mapped.docNumber = row.doc_type ?? row.documentRef ?? row.docNumber;
    mapped.epc = row.epc ?? row.product?.code ?? row.productId;
    mapped.productId = row.product?.name ?? row.productId;
    mapped.locationId = row.location?.name ?? row.locationId;
    mapped.quantity = row.qty ?? row.quantity;
    return mapped as StockLedgerItem;
};

export const stockService = {
    async fetchBalance(
        params?: StockBalanceQueryParams,
    ): Promise<ApiPaginatedResult<StockBalanceRecord>> {
        const response = await stockApi.fetchBalance(params);
        const items = normalizePaginationItems(
            response as ApiResponse<{ items?: StockBalanceResponse["items"] }>,
        );
        return {
            items: (items as any[]).map(normalizeStockBalanceRecord),
            meta: response.meta,
        };
    },

    async fetchLedger(
        params?: StockLedgerQueryParams,
    ): Promise<ApiPaginatedResult<StockLedgerItem>> {
        const response = await stockApi.fetchLedger(params);
        const items = normalizePaginationItems(
            response as ApiResponse<{ items?: StockLedgerResponse["items"] }>,
        );
        return {
            items: (items as any[]).map(normalizeStockLedgerRecord),
            meta: response.meta,
        };
    },
};
