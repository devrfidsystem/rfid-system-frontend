export interface DashboardStockSummaryResponse {
    totalStock: number;
    epcActive: number;
    latestInboundDate: string | null;
    inboundToday: number;
    latestOutboundDate: string | null;
    outboundToday: number;
    opnamePending: number;
}

export type DashboardLowStockSeverity = "warning" | "critical";

export interface DashboardLowStockAlert {
    itemId: string;
    itemCode: string;
    itemName: string;
    warehouseId: string;
    warehouseName: string;
    currentStock: number;
    minimumQty: number;
    shortageQty: number;
    severity: DashboardLowStockSeverity;

    // Optional fields mapped from the backend response
    productId?: string;
    productCode?: string;
    productName?: string;
    warehouseCode?: string;
    locationId?: string;
    locationCode?: string;
    minStock?: number;
    currentQty?: number;
}

export interface DashboardLowStockResponse {
    totalLowStock: number;
    items: DashboardLowStockAlert[];
}

export interface DashboardDocCountsResponse {
    inboundPosted: number;
    outboundPosted: number;
    opnameClosed: number;
    [key: string]: number;
}

export interface DashboardDocCountsEntry {
    key: string;
    label: string;
    value: number;
}

export interface DashboardEpcStatusItem {
    status: string;
    count: number;
}

export interface DashboardEpcStatusResponse {
    total: number;
    byStatus: DashboardEpcStatusItem[];
}

export interface DashboardRecentActivityItem {
    id: string;
    timestamp?: string;
    productId?: string;
    quantity?: number;
    movementType: string;
    warehouseId?: string;
    locationId?: string;
    documentRef?: string;
    status?: string;

    // Backend payload fields
    qty: number;
    docReference: string;
    productCode: string;
    productName: string;
    warehouseCode: string;
    locationCode: string;
    createdAt: string;
}

export type DashboardRecentActivityResponse = DashboardRecentActivityItem[];

export type DashboardAlertSeverity = "critical" | "warning" | "info";

export interface DashboardAlert {
    severity: DashboardAlertSeverity;
    title: string;
    tag: string;
    category: string;
    summary: string;
    businessImpact: string;
    recommendedAction: string;
    docRef: string | null;
    occurredAt: string;
}

export interface DashboardAlertsResponse {
    counts: { critical: number; warning: number; info: number };
    alerts: DashboardAlert[];
}

export interface DashboardWorkflowStage {
    name: string;
    count: number;
    pctOfOpen: number | null;
    avgWaitHours: number | null;
    trendPct: number | null;
}

export interface DashboardWorkflowPanel {
    key: "inboundPutaway" | "outbound";
    title: string;
    openCount: number;
    avgCycleTimeHours: number | null;
    completionRate: number;
    bottleneckStage: string;
    stages: DashboardWorkflowStage[];
}

export interface DashboardWorkflowOverviewResponse {
    panels: DashboardWorkflowPanel[];
}

export interface DashboardKpiSubMetric {
    label: string;
    value: string;
}

export interface DashboardKpiCard {
    key: "stockIn" | "inventory" | "stockOut";
    label: string;
    score: number;
    trendVsPrevious: number;
    subMetrics: DashboardKpiSubMetric[];
    sparkline: number[];
}

export interface DashboardKpiSnapshotResponse {
    cards: DashboardKpiCard[];
}

export type DashboardKpiDomain = "stockIn" | "inventory" | "stockOut";

export interface DashboardKpiTimelinePoint {
    period: string;
    score: number;
}

export interface DashboardKpiWarehouseRankEntry {
    warehouseId: string;
    warehouseName: string;
    score: number;
}

export interface DashboardKpiContributor {
    label: string;
    pct: number;
}

export interface DashboardKpiDetailSupportingMetric {
    label: string;
    value: string;
}

export interface DashboardKpiDetailResponse {
    domain: DashboardKpiDomain;
    label: string;
    derivedFrom: string;
    score: number;
    previousScore: number;
    trendVsPrevious: number;
    timeline: DashboardKpiTimelinePoint[];
    warehouseComparison: {
        top: DashboardKpiWarehouseRankEntry[];
        bottom: DashboardKpiWarehouseRankEntry[];
    };
    contributors: DashboardKpiContributor[];
    supportingMetrics: DashboardKpiDetailSupportingMetric[];
}

export type ProcessActivity =
    "receiving" | "putaway" | "outbound" | "transfer" | "relocation" | "opname";

export type ProcessDomain = "stockIn" | "inventory" | "stockOut";

export type ProcessPeriod = "week" | "month";

export interface ProcessCycleTimeMetric {
    minutes: number;
    previousMinutes: number;
    trendPct: number;
}

export interface ProcessProductivityMetric {
    unitsPerHour: number;
    previousUnitsPerHour: number;
    trendPct: number;
}

export interface ProcessSupportingMetrics {
    completedTransactions: number;
    avgDailyVolumeUnits: number;
    avgQueueTimeMinutes: number;
}

export interface ProcessTrendPoint {
    period: string;
    cycleTimeMinutes: number;
    productivityUnitsPerHour: number;
}

export interface ProcessHourlyBucket {
    hour: number;
    count: number;
}

export interface ProcessWarehouseRankEntry {
    warehouseId: string;
    warehouseName: string;
    score: number;
}

export interface ProcessOperatorRankEntry {
    userId: string;
    userName: string;
    score: number;
}

export interface ProcessDetailResponse {
    activity: ProcessActivity;
    domain: ProcessDomain;
    label: string;
    cycleTime: ProcessCycleTimeMetric;
    productivity: ProcessProductivityMetric;
    supportingMetrics: ProcessSupportingMetrics;
    trend: ProcessTrendPoint[];
    hourlyDistribution: ProcessHourlyBucket[];
    warehouseComparison: {
        top: ProcessWarehouseRankEntry[];
        bottom: ProcessWarehouseRankEntry[];
    };
    operatorRanking: ProcessOperatorRankEntry[];
}

export type MonitoringDomainKey = "stockIn" | "stockOut" | "inventory";

export type MonitoringHealth = "nominal" | "warning" | "critical";

export type MonitoringPriority = "low" | "med" | "high";

export type LiveTransactionStatus = "ok" | "exception";

export interface MonitoringQueueTask {
    docCode: string;
    locationLabel: string | null;
}

export interface DomainHealth {
    label: string;
    health: MonitoringHealth;
    queueCount: number;
    completedTodayCount: number;
    exceptionsCount: number;
    queueTasks: MonitoringQueueTask[];
}

export interface LiveTransactionRow {
    warehouseName: string;
    zoneLabel: string | null;
    operatorName: string;
    eventLabel: string;
    timestamp: string;
    durationMinutes: number;
    priority: MonitoringPriority;
    slaPct: number | null;
    status: LiveTransactionStatus;
}

export interface MonitoringResponse {
    domains: {
        stockIn: DomainHealth;
        stockOut: DomainHealth;
        inventory: DomainHealth;
    };
    liveTransactions: LiveTransactionRow[];
}
