import { describe, expect, it } from "vitest";
import toolbarSource from "./DashboardToolbar.vue?raw";

describe("DashboardToolbar i18n usage", () => {
    it("resolves the warehouse filter placeholder and refresh label through vue-i18n", () => {
        expect(toolbarSource).toContain('import { useI18n } from "vue-i18n"');
        expect(toolbarSource).toContain(
            "dashboard.common.warehouseFilterPlaceholder",
        );
        expect(toolbarSource).toContain("dashboard.common.refresh");
        expect(toolbarSource).not.toContain("Semua Gudang (Filter)");
        expect(toolbarSource).not.toContain(">Refresh<");
    });
});
