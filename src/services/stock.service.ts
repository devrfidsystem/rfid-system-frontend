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

type ApiStockRecord = Record<string, unknown>;

const asRecord = (value: unknown): ApiStockRecord =>
    value && typeof value === "object" ? (value as ApiStockRecord) : {};

const nestedValue = (row: ApiStockRecord, key: string, field: string) =>
    asRecord(row[key])[field];

export const normalizeStockBalanceRecord = (
    row: unknown,
): StockBalanceRecord => {
    const source = asRecord(row);
    const mapped: ApiStockRecord = { ...source };
    mapped.productId =
        nestedValue(source, "product", "name") ?? source.productId;
    mapped.warehouseId =
        nestedValue(source, "warehouse", "name") ?? source.warehouseId;
    mapped.locationPath =
        nestedValue(source, "location", "name") ??
        source.locationPath ??
        source.locationId;
    mapped.quantity = source.qty ?? source.qty_on_hand ?? source.quantity;
    return mapped as unknown as StockBalanceRecord;
};

export const normalizeStockLedgerRecord = (row: unknown): StockLedgerItem => {
    const source = asRecord(row);
    const mapped: ApiStockRecord = { ...source };
    mapped.timestamp = source.createdAt ?? source.timestamp;
    mapped.docNumber =
        source.doc_type ?? source.documentRef ?? source.docNumber;
    mapped.epc =
        source.epc ??
        nestedValue(source, "product", "code") ??
        source.productId;
    mapped.productId =
        nestedValue(source, "product", "name") ?? source.productId;
    mapped.locationId =
        nestedValue(source, "location", "name") ?? source.locationId;
    mapped.quantity = source.qty ?? source.quantity;
    return mapped as unknown as StockLedgerItem;
};

export const stockService = {
    async fetchBalance(
        params?: StockBalanceQueryParams,
    ): Promise<ApiPaginatedResult<StockBalanceRecord>> {
        const response = await stockApi.fetchBalance(params);
        const items = normalizePaginationItems<unknown>(
            response as ApiResponse<{ items?: StockBalanceResponse["items"] }>,
        );
        return {
            items: items.map(normalizeStockBalanceRecord),
            meta: response.meta,
        };
    },

    async fetchLedger(
        params?: StockLedgerQueryParams,
    ): Promise<ApiPaginatedResult<StockLedgerItem>> {
        const response = await stockApi.fetchLedger(params);
        const items = normalizePaginationItems<unknown>(
            response as ApiResponse<{ items?: StockLedgerResponse["items"] }>,
        );
        return {
            items: items.map(normalizeStockLedgerRecord),
            meta: response.meta,
        };
    },
};
