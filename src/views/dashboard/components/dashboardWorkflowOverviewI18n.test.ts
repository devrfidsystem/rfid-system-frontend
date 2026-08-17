import { describe, expect, it } from "vitest";
import workflowOverviewSource from "./DashboardWorkflowOverview.vue?raw";

describe("DashboardWorkflowOverview i18n usage", () => {
    it("resolves panel copy, metric labels, and status text through vue-i18n", () => {
        expect(workflowOverviewSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(workflowOverviewSource).toContain(
            "dashboard.overview.workflowOverview.panelTitle",
        );
        expect(workflowOverviewSource).toContain(
            "dashboard.overview.workflowOverview.metrics.open",
        );
        expect(workflowOverviewSource).toContain(
            "dashboard.overview.workflowOverview.insufficientData",
        );
        expect(workflowOverviewSource).toContain(
            "dashboard.overview.workflowOverview.avgWait",
        );
        expect(workflowOverviewSource).not.toContain("Workflow Position");
        expect(workflowOverviewSource).not.toContain("Insufficient data yet");
    });
});
