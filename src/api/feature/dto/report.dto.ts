import type { ApiPaginatedResult } from "@/lib/api/response";

export type ReportKey =
    | "inbound"
    | "putaway"
    | "outbound"
    | "stock-opname"
    | "relocation"
    | "transfer"
    | "return"
    | "register"
    | "current-stock"
    | "stock-period";

export interface ReportColumnDef {
    key: string;
    label: string;
}

export interface ReportRow {
    id?: string;
    docNo?: string;
    [key: string]: string | number | boolean | null | undefined;
}

export interface ReportParams {
    page?: number;
    limit?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    warehouseId?: string;
    [key: string]: string | number | undefined;
}

export type ReportListResult = ApiPaginatedResult<ReportRow>;

export const reportPaths: Record<ReportKey, string> = {
    register: "/register",
    inbound: "/reports/inbound",
    putaway: "/putaway",
    outbound: "/reports/outbound",
    "stock-opname": "/opname",
    relocation: "/relocation",
    transfer: "/transfer",
    return: "/returns",
    "current-stock": "/reports/stock-balance",
    "stock-period": "/reports/stock-movement",
};
