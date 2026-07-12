import { normalizePaginationItems } from "@/lib/api/normalizers";
import type { ApiPaginatedResult, ApiResponse } from "@/lib/api/response";
import type { ReportParams } from "@/api/feature/dto/report.dto";
import type { TransactionRecord } from "@/views/transactions/types";
import { transactionsApi } from "@/api/feature/transactions.api";

export type TransactionKey =
    | "register"
    | "inbound"
    | "outbound"
    | "relocation"
    | "transfer"
    | "return"
    | "returns"
    | "opname";

export const transactionPaths: Record<TransactionKey, string> = {
    register: "/register",
    inbound: "/inbound",
    outbound: "/outbound",
    relocation: "/relocation",
    transfer: "/transfer",
    return: "/returns",
    returns: "/returns",
    opname: "/opname",
};

export const normalizeTransactionRecord = (
    row: Record<string, unknown> | null | undefined,
): TransactionRecord => {
    if (!row) return row as unknown as TransactionRecord;

    const mapped: Record<string, unknown> = { ...row };

    mapped.docNo =
        row.docNo ??
        row.inbound_no ??
        row.outbound_no ??
        row.transfer_no ??
        row.relocation_no ??
        row.return_no ??
        row.profile_id;
    mapped.date =
        row.date ??
        row.inbound_date ??
        row.outbound_date ??
        row.transfer_date ??
        row.relocation_date ??
        row.return_date;
    mapped.scheduledAt = row.scheduledAt ?? row.createdAt;

    mapped.partnerId =
        (row.supplier as Record<string, unknown>)?.name ??
        (row.customer as Record<string, unknown>)?.name ??
        row.supplier_id ??
        row.customerId ??
        row.partnerId;
    mapped.customerId =
        (row.customer as Record<string, unknown>)?.name ?? row.customerId;

    mapped.warehouseId =
        (row.warehouse as Record<string, unknown>)?.name ??
        row.warehouse_id ??
        row.warehouseId;

    mapped.sourceWarehouseId =
        (row.origin_warehouse as Record<string, unknown>)?.name ??
        row.origin_warehouse_id ??
        row.sourceWarehouseId;
    mapped.destinationWarehouseId =
        (row.destination_warehouse as Record<string, unknown>)?.name ??
        row.destination_warehouse_id ??
        row.destinationWarehouseId;

    mapped.sourceLocationId =
        (row.origin_location as Record<string, unknown>)?.name ??
        row.origin_location_id ??
        row.sourceLocationId;
    mapped.destinationLocationId =
        (row.destination_location as Record<string, unknown>)?.name ??
        row.destination_location_id ??
        row.destinationLocationId;

    return mapped as unknown as TransactionRecord;
};

export const transactionService = {
    async list(
        key: TransactionKey,
        params: ReportParams = {},
    ): Promise<ApiPaginatedResult<TransactionRecord>> {
        const response = await transactionsApi.list(key, params);
        const items = normalizePaginationItems(
            response as ApiResponse<{ items?: TransactionRecord[] }>,
        );
        return {
            items: (items as unknown as Record<string, unknown>[]).map(
                normalizeTransactionRecord,
            ),
            meta: response.meta,
        };
    },
    async get(key: TransactionKey, id: string): Promise<TransactionRecord> {
        const response = await transactionsApi.get(key, id);
        return normalizeTransactionRecord(response.data);
    },
    async create(
        key: TransactionKey,
        payload: Record<string, unknown>,
    ): Promise<TransactionRecord> {
        const response = await transactionsApi.create(key, payload);
        return normalizeTransactionRecord(response.data);
    },
    async post(key: TransactionKey, id: string): Promise<void> {
        await transactionsApi.post(key, id);
    },
    async cancel(key: TransactionKey, id: string): Promise<void> {
        await transactionsApi.cancel(key, id);
    },
};
