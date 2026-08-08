import { normalizePaginationItems } from "@/lib/api/normalizers";
import type { ApiPaginatedResult, ApiResponse } from "@/lib/api/response";
import type { ReportParams } from "@/api/feature/dto/report.dto";
import type {
    TransactionRecord,
    TransactionSummaryResponse,
} from "@/views/transactions/types";
import { transactionsApi } from "@/api/feature/transactions.api";

// "opname" is intentionally part of this union/the maps below for
// title/report-key lookups elsewhere, but it must NEVER be routed through the
// generic list/get/create/post/cancel flow in this file — the real Opname
// feature uses its own tree/lifecycle API (opname.api.ts, opname.service.ts)
// with an incompatible response shape. See router/index.ts's
// `genericTransactionKeys`, which deliberately excludes "opname" for this
// reason — keep that exclusion in sync with this comment.
export type TransactionKey =
    | "register"
    | "inbound"
    | "putaway"
    | "outbound"
    | "relocation"
    | "transfer"
    | "return"
    | "returns"
    | "opname";

const formatRegisterLine = (line: Record<string, unknown>): string => {
    const product = line.product as Record<string, unknown> | undefined;
    const code = product?.code ?? line.productCode;
    const name = product?.name ?? line.productName ?? line.productId;
    const qty = line.qtyExpected ?? line.expectedQty ?? line.qty;
    const productLabel = code && name ? `${code} - ${name}` : (name ?? code);
    if (!productLabel) return qty === undefined ? "-" : `Qty ${qty}`;
    return qty === undefined
        ? String(productLabel)
        : `${productLabel} (${qty})`;
};

const summarizeRegisterLines = (lines: unknown): string | undefined => {
    if (!Array.isArray(lines) || lines.length === 0) return undefined;
    return lines
        .map((line) => formatRegisterLine(line as Record<string, unknown>))
        .join(", ");
};

export const transactionPaths: Record<TransactionKey, string> = {
    register: "/register",
    inbound: "/inbound",
    putaway: "/putaway",
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
        row.docNumber ??
        row.inbound_no ??
        row.putaway_no ??
        row.outbound_no ??
        row.transfer_no ??
        row.relocation_no ??
        row.return_no ??
        row.profile_id;
    mapped.date =
        row.date ??
        row.docDate ??
        row.inbound_date ??
        row.putaway_date ??
        row.outbound_date ??
        row.transfer_date ??
        row.relocation_date ??
        row.return_date;
    mapped.scheduledAt = row.scheduledAt ?? row.createdAt;
    if (row.assignedBy && typeof row.assignedBy === "object") {
        mapped.assignedBy = row.assignedBy;
    } else {
        const assignedByFullName =
            (row.assigned_by as string | number | null | undefined) ??
            (row.assignedByName as string | number | null | undefined) ??
            (row.assignedById as string | number | null | undefined) ??
            (row.assignedBy as string | number | null | undefined);
        if (assignedByFullName !== undefined) {
            mapped.assignedBy = { fullName: assignedByFullName };
        }
    }
    mapped.deadlineAt =
        row.deadlineAt ?? row.deadline_at ?? row.deadline ?? row.dueDate;
    mapped.type =
        row.type ?? row.docType ?? row.transactionType ?? row.transaction_type;

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
    mapped.locationName =
        (row.location as Record<string, unknown>)?.name ??
        (row.location as Record<string, unknown>)?.code ??
        row.locationName ??
        row.locationId;
    mapped.productSummary =
        row.productSummary ?? summarizeRegisterLines(row.lines);

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
    async summary(
        key: TransactionKey,
        params: ReportParams = {},
    ): Promise<TransactionSummaryResponse> {
        const response = await transactionsApi.summary(key, params);
        return response.data as TransactionSummaryResponse;
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
    async post(
        key: TransactionKey,
        id: string,
        payload?: Record<string, unknown>,
    ): Promise<void> {
        await transactionsApi.post(key, id, payload);
    },
    async cancel(key: TransactionKey, id: string): Promise<void> {
        await transactionsApi.cancel(key, id);
    },
    async complete(key: TransactionKey, id: string): Promise<void> {
        await transactionsApi.complete(key, id);
    },
};
