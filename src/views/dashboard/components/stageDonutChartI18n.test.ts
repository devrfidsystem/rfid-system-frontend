import { describe, expect, it } from "vitest";
import stageDonutChartSource from "./StageDonutChart.vue?raw";

describe("StageDonutChart i18n usage", () => {
    it("resolves the aria-label prefix, center label, and 'Other' grouping label through vue-i18n", () => {
        expect(stageDonutChartSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(stageDonutChartSource).toContain(
            "dashboard.overview.stageDonutChart.ariaLabelPrefix",
        );
        expect(stageDonutChartSource).toContain(
            "dashboard.overview.stageDonutChart.openLabel",
        );
        expect(stageDonutChartSource).toContain(
            "dashboard.overview.stageDonutChart.otherLabel",
        );
        expect(stageDonutChartSource).not.toContain("Stage distribution:");
        expect(stageDonutChartSource).not.toContain('name: "Other"');
    });
});
