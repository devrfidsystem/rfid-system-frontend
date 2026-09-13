import { describe, expect, it } from "vitest";
import transactionSummarySource from "@/views/transactions/components/TransactionSummaryWidget.vue?raw";
import opnameSummarySource from "@/views/opname/components/OpnameSummaryWidget.vue?raw";
import opnameTreeTableSource from "@/views/opname/components/OpnameTreeTable.vue?raw";
import dashboardWorkflowSource from "@/views/dashboard/components/DashboardWorkflowOverview.vue?raw";
import dashboardAlertCenterSource from "@/views/dashboard/components/DashboardAlertCenter.vue?raw";
import dashboardKpiSnapshotSource from "@/views/dashboard/components/DashboardKpiSnapshot.vue?raw";
import monitoringDomainCardSource from "@/views/dashboard/components/MonitoringDomainCard.vue?raw";
import monitoringLiveFeedSource from "@/views/dashboard/components/MonitoringLiveFeed.vue?raw";
import monitoringExceptionFeedSource from "@/views/dashboard/components/MonitoringExceptionFeed.vue?raw";
import processMetricCardsSource from "@/views/dashboard/components/ProcessMetricCards.vue?raw";

const skeletonSources = [
    transactionSummarySource,
    opnameSummarySource,
    opnameTreeTableSource,
    dashboardWorkflowSource,
    dashboardAlertCenterSource,
    dashboardKpiSnapshotSource,
    monitoringDomainCardSource,
    monitoringLiveFeedSource,
    monitoringExceptionFeedSource,
    processMetricCardsSource,
];

describe("SkeletonBlock usage", () => {
    it("uses SkeletonBlock instead of manual animate-pulse divs in widgets", () => {
        for (const source of skeletonSources) {
            expect(source).toContain("<SkeletonBlock");
            expect(source).toContain(
                'import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";',
            );
            expect(source).not.toContain("animate-pulse");
        }
    });
});
