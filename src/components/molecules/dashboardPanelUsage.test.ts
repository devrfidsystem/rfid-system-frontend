import { describe, expect, it } from "vitest";
import alertCenterSource from "@/views/dashboard/components/DashboardAlertCenter.vue?raw";
import kpiSnapshotSource from "@/views/dashboard/components/DashboardKpiSnapshot.vue?raw";
import workflowSource from "@/views/dashboard/components/DashboardWorkflowOverview.vue?raw";
import contributorsSource from "@/views/dashboard/components/KpiContributors.vue?raw";
import warehouseComparisonSource from "@/views/dashboard/components/KpiWarehouseComparison.vue?raw";
import supportingMetricsSource from "@/views/dashboard/components/KpiSupportingMetrics.vue?raw";
import processTrendSource from "@/views/dashboard/components/ProcessTrendChart.vue?raw";
import heatmapSource from "@/views/dashboard/components/ProcessHourlyHeatmap.vue?raw";
import rankingSource from "@/views/dashboard/components/ProcessOperatorRanking.vue?raw";
import liveFeedSource from "@/views/dashboard/components/MonitoringLiveFeed.vue?raw";
import exceptionFeedSource from "@/views/dashboard/components/MonitoringExceptionFeed.vue?raw";
import monitoringDomainSource from "@/views/dashboard/components/MonitoringDomainCard.vue?raw";

const dashboardPanelSources = [
    alertCenterSource,
    kpiSnapshotSource,
    workflowSource,
    contributorsSource,
    warehouseComparisonSource,
    supportingMetricsSource,
    processTrendSource,
    heatmapSource,
    rankingSource,
    liveFeedSource,
    exceptionFeedSource,
    monitoringDomainSource,
];

describe("dashboard panel title usage", () => {
    it("uses PanelHeader for dashboard panel headings", () => {
        for (const source of dashboardPanelSources) {
            expect(source).toContain("<PanelHeader");
            expect(source).toContain(
                'import PanelHeader from "@/components/molecules/PanelHeader.vue";',
            );
        }
    });
});
