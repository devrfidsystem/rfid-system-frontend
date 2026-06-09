import { apiRequest } from "@/lib/api/client";
import type { ReportKey } from "@/views/report/reportConfig";
import type { ReportParams, ReportRow } from "./dto/report.dto";
import { reportPaths } from "./dto/report.dto";

export const reportApi = {
    fetchReport(reportKey: ReportKey, params: ReportParams) {
        const path = reportPaths[reportKey];
        if (!path) {
            throw new Error(
                `Report "${reportKey}" is not supported by the backend.`,
            );
        }
        return apiRequest<{ items?: ReportRow[] }>({
            url: path,
            method: "get",
            params: {
                page: params.page ?? 1,
                limit: params.limit ?? 20,
                ...params,
            },
        });
    },
    async exportReport(
        reportKey: ReportKey,
        params: ReportParams,
        columns: { key: string; label: string }[],
    ): Promise<Blob> {
        const path = reportPaths[reportKey];
        if (!path) {
            throw new Error(`Report "${reportKey}" is not supported.`);
        }

        // Use the raw apiClient to bypass ApiResponse wrapping for Blobs
        const { apiClient } = await import("@/lib/api/client");
        const response = await apiClient.post<Blob>(
            `${path}/export`,
            {
                filters: params,
                columns,
            },
            {
                responseType: "blob",
            },
        );
        return response.data;
    },
};
