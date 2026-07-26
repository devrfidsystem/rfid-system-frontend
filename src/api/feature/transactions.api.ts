import { apiRequest } from "@/lib/api/client";
import type { ReportParams } from "./dto/report.dto";
import type { TransactionRecord } from "@/views/transactions/types";
import type { TransactionKey } from "@/services/transactions.service";
import { transactionPaths } from "@/services/transactions.service";

export const transactionsApi = {
    list(key: TransactionKey, params: ReportParams = {}) {
        const path = transactionPaths[key];
        return apiRequest<{ items?: TransactionRecord[] }>({
            url: path,
            method: "get",
            params: {
                page: params.page ?? 1,
                limit: params.limit ?? 20,
                ...params,
            },
        });
    },

    get(key: TransactionKey, id: string) {
        const path = transactionPaths[key];
        return apiRequest<TransactionRecord>({
            url: `${path}/${id}`,
            method: "get",
        });
    },

    create(key: TransactionKey, payload: Record<string, unknown>) {
        const path = transactionPaths[key];
        return apiRequest<TransactionRecord>({
            url: path,
            method: "post",
            data: payload,
        });
    },

    post(key: TransactionKey, id: string, payload?: Record<string, unknown>) {
        const path = transactionPaths[key];
        return apiRequest({
            url: `${path}/${id}/post`,
            method: "post",
            data: payload,
        });
    },

    cancel(key: TransactionKey, id: string) {
        const path = transactionPaths[key];
        return apiRequest({
            url: `${path}/${id}/cancel`,
            method: "post",
        });
    },
};
