import { describe, expect, it } from "vitest";
import useDashboardSource from "./useDashboard.ts?raw";

describe("useDashboard i18n usage", () => {
    it("resolves the generic load-failure fallback through the global i18n instance", () => {
        expect(useDashboardSource).toContain(
            'import { i18n } from "@/locales"',
        );
        expect(useDashboardSource).toContain(
            "dashboard.overview.errors.loadFailed",
        );
        expect(useDashboardSource).not.toContain(
            "Failed to load dashboard data.",
        );
    });
});
