import type { WarehouseRecord } from "@/model/entities";

export type WarehouseOption = Pick<WarehouseRecord, "id" | "name" | "code">;

export interface DashboardFilterState {
    warehouseId: string | null;
    companyId?: string;
}

export type {
    DashboardAlertSeverity,
    DashboardAlert,
    DashboardAlertsResponse,
    DashboardWorkflowStage,
    DashboardWorkflowPanel,
    DashboardWorkflowOverviewResponse,
    DashboardKpiSubMetric,
    DashboardKpiCard,
    DashboardKpiSnapshotResponse,
    DashboardKpiDomain,
    DashboardKpiTimelinePoint,
    DashboardKpiWarehouseRankEntry,
    DashboardKpiContributor,
    DashboardKpiDetailSupportingMetric,
    DashboardKpiDetailResponse,
    ProcessActivity,
    ProcessDomain,
    ProcessPeriod,
    ProcessCycleTimeMetric,
    ProcessProductivityMetric,
    ProcessSupportingMetrics,
    ProcessTrendPoint,
    ProcessHourlyBucket,
    ProcessWarehouseRankEntry,
    ProcessOperatorRankEntry,
    ProcessDetailResponse,
    MonitoringDomainKey,
    MonitoringHealth,
    MonitoringPriority,
    LiveTransactionStatus,
    MonitoringQueueTask,
    DomainHealth,
    LiveTransactionRow,
    MonitoringResponse,
} from "@/api/feature/dto/dashboard.dto";
