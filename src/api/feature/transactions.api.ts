import { apiRequest } from "@/lib/api/client";
import type { ReportParams } from "./dto/report.dto";
import type { TransactionRecord } from "@/views/transactions/types";
import type { TransactionKey } from "@/services/transactions.service";
import { transactionPaths } from "@/services/transactions.service";

// Note: the backend exposes PATCH {path}/:id for inbound/outbound/relocation/
// transfer/returns/putaway (register has no PATCH at all), but there is
// intentionally no `update`/`patch` method here — draft-stage documents are
// corrected by cancel-and-recreate, not in-place editing. This module only
// implements list/get/create/post/cancel/complete.
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
        return apiRequest<import("@/views/transactions/types").TransactionSummaryResponse>({
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
