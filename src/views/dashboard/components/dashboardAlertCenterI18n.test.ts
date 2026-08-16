import { describe, expect, it } from "vitest";
import alertCenterSource from "./DashboardAlertCenter.vue?raw";

describe("DashboardAlertCenter i18n usage", () => {
    it("resolves panel copy, badges, filters, and status-panel text through vue-i18n", () => {
        expect(alertCenterSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(alertCenterSource).toContain(
            "dashboard.overview.alertCenter.panelTitle",
        );
        expect(alertCenterSource).toContain(
            "dashboard.overview.alertCenter.badges.critical",
        );
        expect(alertCenterSource).toContain(
            "dashboard.overview.alertCenter.filters.all",
        );
        expect(alertCenterSource).toContain(
            "dashboard.overview.alertCenter.emptyFiltered",
        );
        expect(alertCenterSource).not.toContain("Operational Exceptions");
        expect(alertCenterSource).not.toContain("No open exceptions");
    });
});
