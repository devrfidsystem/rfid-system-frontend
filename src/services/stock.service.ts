import { apiRequest } from "@/lib/api/client";
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

export const stockService = {
    async fetchBalance(
        params?: StockBalanceQueryParams,
    ): Promise<ApiPaginatedResult<StockBalanceRecord>> {
        const response = await apiRequest<StockBalanceResponse>({
            url: "/stock/balance",
            method: "get",
            params,
        });
        const items = normalizePaginationItems(
            response as ApiResponse<{ items?: StockBalanceResponse["items"] }>,
        );
        return {
            items,
            meta: response.meta,
        };
    },

    async fetchLedger(
        params?: StockLedgerQueryParams,
    ): Promise<ApiPaginatedResult<StockLedgerItem>> {
        const response = await apiRequest<StockLedgerResponse>({
            url: "/stock/ledger",
            method: "get",
            params,
        });
        const items = normalizePaginationItems(
            response as ApiResponse<{ items?: StockLedgerResponse["items"] }>,
        );
        return {
            items,
            meta: response.meta,
        };
    },
};
