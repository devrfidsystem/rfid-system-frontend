import { apiRequest } from "@/lib/api/client";
import type {
    StockBalanceQueryParams,
    StockBalanceResponse,
    StockLedgerQueryParams,
    StockLedgerResponse,
} from "./dto/stock.dto";

export const stockApi = {
    fetchBalance(params?: StockBalanceQueryParams) {
        return apiRequest<StockBalanceResponse>({
            url: "/stock/balance",
            method: "get",
            params,
        });
    },

    fetchLedger(params?: StockLedgerQueryParams) {
        return apiRequest<StockLedgerResponse>({
            url: "/stock/ledger",
            method: "get",
            params,
        });
    },
};
