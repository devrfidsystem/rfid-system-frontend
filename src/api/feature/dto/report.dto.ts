import type { ApiPaginatedResult } from "@/lib/api/response";
import type { ReportKey } from "@/views/report/reportConfig";

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
    inbound: "/reports/inbound",
    outbound: "/reports/outbound",
    "stock-opname": "/opname",
    relocation: "/relocation",
    transfer: "/transfer",
    return: "/returns",
    "current-stock": "/reports/stock-balance",
    "stock-period": "/reports/stock-movement",
    "opname-variance": "/reports/opname-variance",
};
