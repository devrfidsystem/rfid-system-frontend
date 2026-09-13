import { describe, expect, it } from "vitest";
import dashboardPageSource from "./DashboardPage.vue?raw";

describe("DashboardPage i18n usage", () => {
    it("resolves the warehouse-selector alert title through vue-i18n", () => {
        expect(dashboardPageSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(dashboardPageSource).toContain(
            "dashboard.overview.warehouseAlert.title",
        );
        expect(dashboardPageSource).not.toContain(
            "Warehouse selector unavailable",
        );
    });
});
