import { describe, expect, it } from "vitest";
import listItemSource from "./DashboardAlertListItem.vue?raw";
import detailDrawerSource from "./DashboardAlertDetailDrawer.vue?raw";

describe("DashboardAlertListItem and DashboardAlertDetailDrawer i18n usage", () => {
    it("resolves the shared Business Impact / Recommended Action labels through vue-i18n in the list item", () => {
        expect(listItemSource).toContain('import { useI18n } from "vue-i18n"');
        expect(listItemSource).toContain(
            "dashboard.overview.alertCenter.businessImpact",
        );
        expect(listItemSource).toContain(
            "dashboard.overview.alertCenter.recommendedAction",
        );
        expect(listItemSource).not.toContain("Business Impact");
        expect(listItemSource).not.toContain("Recommended Action");
    });

    it("resolves the shared labels plus Occurred / Document Reference through vue-i18n in the detail drawer", () => {
        expect(detailDrawerSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(detailDrawerSource).toContain(
            "dashboard.overview.alertCenter.businessImpact",
        );
        expect(detailDrawerSource).toContain(
            "dashboard.overview.alertCenter.recommendedAction",
        );
        expect(detailDrawerSource).toContain(
            "dashboard.overview.alertCenter.occurred",
        );
        expect(detailDrawerSource).toContain(
            "dashboard.overview.alertCenter.documentReference",
        );
        expect(detailDrawerSource).not.toContain("Business Impact");
        expect(detailDrawerSource).not.toContain("Recommended Action");
        expect(detailDrawerSource).not.toContain(">Occurred<");
        expect(detailDrawerSource).not.toContain("Document Reference");
    });
});
