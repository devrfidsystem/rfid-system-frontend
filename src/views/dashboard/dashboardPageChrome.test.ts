import { describe, expect, it } from "vitest";
import executiveSource from "./ExecutiveKpiPage.vue?raw";
import processSource from "./ProcessPerformancePage.vue?raw";
import monitoringSource from "./MonitoringPage.vue?raw";
import overviewSource from "./DashboardPage.vue?raw";

const dashboardSubPageSources = [executiveSource, processSource, monitoringSource];

describe("dashboard page chrome", () => {
    it("uses shared PageHeader and InlineAlert for dashboard sub-pages", () => {
        for (const source of dashboardSubPageSources) {
            expect(source).toContain("<PageHeader");
            expect(source).toContain(
                'import PageHeader from "@/components/molecules/PageHeader.vue";',
            );
            expect(source).toContain("<InlineAlert");
            expect(source).toContain(
                'import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";',
            );
            expect(source).not.toContain("<h1");
            expect(source).not.toContain("bg-danger-50 px-4 py-3");
        }
    });

    it("uses InlineAlert for dashboard overview error messaging", () => {
        expect(overviewSource).toContain("<InlineAlert");
        expect(overviewSource).toContain(
            'import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";',
        );
        expect(overviewSource).not.toContain("bg-danger-50 px-4 py-3");
    });
});
