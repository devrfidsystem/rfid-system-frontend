import type { ApiResponse } from "@/lib/api/response";
import { normalizePaginationItems } from "@/lib/api/normalizers";
import type { ReportKey } from "@/views/report/reportConfig";
import type {
    ReportListResult,
    ReportParams,
    ReportRow,
} from "@/api/feature/dto/report.dto";
import { reportApi } from "@/api/feature/report.api";

export const reportService = {
    async fetchReport(
        reportKey: ReportKey,
        params: ReportParams,
    ): Promise<ReportListResult> {
        const response = await reportApi.fetchReport(reportKey, params);
        const items = normalizePaginationItems<ReportRow>(
            response as ApiResponse<{ items?: ReportRow[] }>,
        );
        return {
            items,
            meta: response.meta,
        };
    },
};
