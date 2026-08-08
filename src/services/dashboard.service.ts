import { dashboardApi } from "@/api/feature/dashboard.api";
import type {
    DashboardAlertsResponse,
    DashboardWorkflowOverviewResponse,
    DashboardKpiSnapshotResponse,
    DashboardKpiDomain,
    DashboardKpiDetailResponse,
    ProcessActivity,
    ProcessPeriod,
    ProcessDetailResponse,
    MonitoringResponse,
} from "@/api/feature/dto/dashboard.dto";
import type { DashboardFilterState } from "@/model/dashboard";
import { useAuthStore } from "@/store/auth.store";

type DashboardQueryParameters = Record<string, string | number>;

const toParams = (filter: DashboardFilterState): DashboardQueryParameters => {
    const params: DashboardQueryParameters = {};
    const authStore = useAuthStore();
    const companyId =
        filter.companyId ?? authStore.currentCompanyId ?? undefined;
    if (companyId) params.companyId = companyId;
    if (filter.warehouseId) params.warehouseId = filter.warehouseId;
    return params;
};

export const dashboardService = {
    async fetchAlerts(
        filter: DashboardFilterState,
    ): Promise<DashboardAlertsResponse> {
        const response = await dashboardApi.fetchAlerts(toParams(filter));
        return response.data;
    },

    async fetchWorkflowOverview(
        filter: DashboardFilterState,
    ): Promise<DashboardWorkflowOverviewResponse> {
        const response = await dashboardApi.fetchWorkflowOverview(
            toParams(filter),
        );
        return response.data;
    },

    async fetchKpiSnapshot(
        filter: DashboardFilterState,
    ): Promise<DashboardKpiSnapshotResponse> {
        const response = await dashboardApi.fetchKpiSnapshot(toParams(filter));
        return response.data;
    },

    async fetchKpiDetail(
        domain: DashboardKpiDomain,
        filter: DashboardFilterState,
    ): Promise<DashboardKpiDetailResponse> {
        const response = await dashboardApi.fetchKpiDetail(
            domain,
            toParams(filter),
        );
        return response.data;
    },

    async fetchProcessDetail(
        activity: ProcessActivity,
        period: ProcessPeriod,
        filter: DashboardFilterState,
    ): Promise<ProcessDetailResponse> {
        const response = await dashboardApi.fetchProcessDetail(
            activity,
            period,
            toParams(filter),
        );
        return response.data;
    },

    async fetchMonitoring(
        filter: DashboardFilterState,
    ): Promise<MonitoringResponse> {
        const response = await dashboardApi.fetchMonitoring(toParams(filter));
        return response.data;
    },
};
