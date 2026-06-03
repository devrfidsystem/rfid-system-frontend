import { apiRequest } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/response";
import { normalizePaginationItems } from "@/lib/api/normalizers";
import type { ReportKey } from "@/views/report/reportConfig";
import type {
    ReportListResult,
    ReportParams,
    ReportRow,
} from "@/api/feature/dto/report.dto";
import { reportPaths } from "@/api/feature/dto/report.dto";

export const reportService = {
    async fetchReport(
        reportKey: ReportKey,
        params: ReportParams,
    ): Promise<ReportListResult> {
        const path = reportPaths[reportKey];
        if (!path) {
            throw new Error(
                `Report "${reportKey}" is not supported by the backend.`,
            );
        }
        const response = await apiRequest<{ items?: ReportRow[] }>({
            url: path,
            method: "get",
            params: {
                page: params.page ?? 1,
                limit: params.limit ?? 20,
                ...params,
            },
        });
        const items = normalizePaginationItems<ReportRow>(
            response as ApiResponse<{ items?: ReportRow[] }>,
        );
        return {
            items,
            meta: response.meta,
        };
    },
};
