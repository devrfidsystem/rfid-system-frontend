import { apiRequest } from "@/lib/api/client";
import type { ReportParams } from "./dto/report.dto";
import {
    transactionPaths,
    type TransactionKey,
    type TransactionRecord,
    type TransactionSummaryResponse,
} from "@/api/feature/dto/transactions.dto";

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

    summary(key: TransactionKey, params: ReportParams = {}) {
        const path = transactionPaths[key];
        return apiRequest<TransactionSummaryResponse>({
            url: `${path}/summary`,
            method: "get",
            params,
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

    update(key: TransactionKey, id: string, payload: Record<string, unknown>) {
        const path = transactionPaths[key];
        return apiRequest<TransactionRecord>({
            url: `${path}/${id}`,
            method: "patch",
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

    complete(key: TransactionKey, id: string) {
        const path = transactionPaths[key];
        return apiRequest({
            url: `${path}/${id}/complete`,
            method: "post",
        });
    },
};
