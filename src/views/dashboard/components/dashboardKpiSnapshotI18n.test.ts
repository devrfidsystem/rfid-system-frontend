import { describe, expect, it } from "vitest";
import kpiSnapshotSource from "./DashboardKpiSnapshot.vue?raw";

describe("DashboardKpiSnapshot i18n usage", () => {
    it("resolves panel copy, empty-state text, and the detail link through vue-i18n", () => {
        expect(kpiSnapshotSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(kpiSnapshotSource).toContain(
            "dashboard.overview.kpiSnapshot.panelTitle",
        );
        expect(kpiSnapshotSource).toContain(
            "dashboard.overview.kpiSnapshot.unavailable.title",
        );
        expect(kpiSnapshotSource).toContain(
            "dashboard.overview.kpiSnapshot.empty",
        );
        expect(kpiSnapshotSource).toContain(
            "dashboard.overview.kpiSnapshot.openDetail",
        );
        expect(kpiSnapshotSource).not.toContain("KPI Control Snapshot");
        expect(kpiSnapshotSource).not.toContain("Open KPI Detail");
    });
});
