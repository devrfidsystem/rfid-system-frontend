import { apiRequest } from "@/lib/api/client";
import { normalizePaginationItems } from "@/lib/api/normalizers";
import type { ApiPaginatedResult, ApiResponse } from "@/lib/api/response";
import type { ReportParams } from "@/api/feature/dto/report.dto";
import type { TransactionRecord } from "@/views/transactions/types";

export type TransactionKey =
    | "inbound"
    | "outbound"
    | "relocation"
    | "transfer"
    | "return"
    | "opname";

export const transactionPaths: Record<TransactionKey, string> = {
    inbound: "/inbound",
    outbound: "/outbound",
    relocation: "/relocation",
    transfer: "/transfer",
    return: "/returns",
    opname: "/opname",
};

export const transactionService = {
    async list(
        key: TransactionKey,
        params: ReportParams = {},
    ): Promise<ApiPaginatedResult<TransactionRecord>> {
        const path = transactionPaths[key];
        const response = await apiRequest<{
            items?: TransactionRecord[];
        }>({
            url: path,
            method: "get",
            params: {
                page: params.page ?? 1,
                limit: params.limit ?? 20,
                ...params,
            },
        });
        const items = normalizePaginationItems(
            response as ApiResponse<{ items?: TransactionRecord[] }>,
        );
        return {
            items: items as TransactionRecord[],
            meta: response.meta,
        };
    },
    async get(key: TransactionKey, id: string): Promise<TransactionRecord> {
        const path = transactionPaths[key];
        const response = await apiRequest<TransactionRecord>({
            url: `${path}/${id}`,
            method: "get",
        });
        return response.data;
    },
    async create(
        key: TransactionKey,
        payload: Record<string, unknown>,
    ): Promise<TransactionRecord> {
        const path = transactionPaths[key];
        const response = await apiRequest<TransactionRecord>({
            url: path,
            method: "post",
            data: payload,
        });
        return response.data;
    },
    async post(key: TransactionKey, id: string): Promise<void> {
        const path = transactionPaths[key];
        await apiRequest({
            url: `${path}/${id}/post`,
            method: "post",
        });
    },
    async cancel(key: TransactionKey, id: string): Promise<void> {
        const path = transactionPaths[key];
        await apiRequest({
            url: `${path}/${id}/cancel`,
            method: "post",
        });
    },
};
