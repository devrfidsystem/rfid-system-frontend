import { apiRequest } from "@/lib/api/client";
import type {
    DashboardStockSummaryResponse,
    DashboardLowStockResponse,
    DashboardDocCountsResponse,
    DashboardEpcStatusResponse,
    DashboardRecentActivityResponse,
    DashboardAlertsResponse,
    DashboardWorkflowOverviewResponse,
    DashboardKpiSnapshotResponse,
    DashboardKpiDomain,
    DashboardKpiDetailResponse,
    ProcessActivity,
    ProcessPeriod,
    ProcessDetailResponse,
    MonitoringResponse,
} from "./dto/dashboard.dto";

type DashboardQueryParameters = Record<string, string | number>;

export const dashboardApi = {
    fetchStockSummary(params: DashboardQueryParameters) {
        return apiRequest<DashboardStockSummaryResponse>({
            url: "/dashboard/stock-summary",
            method: "get",
            params,
        });
    },

    fetchDocCounts(params: DashboardQueryParameters) {
        return apiRequest<DashboardDocCountsResponse>({
            url: "/dashboard/doc-counts",
            method: "get",
            params,
        });
    },

    fetchLowStock(
        params: DashboardQueryParameters,
        limit: number,
        page: number,
    ) {
        return apiRequest<DashboardLowStockResponse>({
            url: "/dashboard/low-stock",
            method: "get",
            params: { ...params, limit, page },
        });
    },

    fetchEpcStatus(params: DashboardQueryParameters) {
        return apiRequest<DashboardEpcStatusResponse>({
            url: "/dashboard/epc-status",
            method: "get",
            params,
        });
    },

    fetchRecentActivity(params: DashboardQueryParameters) {
        return apiRequest<DashboardRecentActivityResponse>({
            url: "/dashboard/recent-activity",
            method: "get",
            params,
        });
    },

    fetchAlerts(params: DashboardQueryParameters) {
        return apiRequest<DashboardAlertsResponse>({
            url: "/dashboard/alerts",
            method: "get",
            params,
        });
    },

    fetchWorkflowOverview(params: DashboardQueryParameters) {
        return apiRequest<DashboardWorkflowOverviewResponse>({
            url: "/dashboard/workflow-overview",
            method: "get",
            params,
        });
    },

    fetchKpiSnapshot(params: DashboardQueryParameters) {
        return apiRequest<DashboardKpiSnapshotResponse>({
            url: "/dashboard/kpi-snapshot",
            method: "get",
            params,
        });
    },

    fetchKpiDetail(
        domain: DashboardKpiDomain,
        params: DashboardQueryParameters,
    ) {
        return apiRequest<DashboardKpiDetailResponse>({
            url: "/dashboard/kpi-detail",
            method: "get",
            params: { ...params, domain },
        });
    },

    fetchProcessDetail(
        activity: ProcessActivity,
        period: ProcessPeriod,
        params: DashboardQueryParameters,
    ) {
        return apiRequest<ProcessDetailResponse>({
            url: "/dashboard/process-detail",
            method: "get",
            params: { ...params, activity, period },
        });
    },

    fetchMonitoring(params: DashboardQueryParameters) {
        return apiRequest<MonitoringResponse>({
            url: "/dashboard/monitoring",
            method: "get",
            params,
        });
    },
};
