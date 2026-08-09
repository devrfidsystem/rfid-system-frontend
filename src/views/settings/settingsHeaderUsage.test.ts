import { describe, expect, it } from "vitest";
import appsPageSource from "./AppsPage.vue?raw";
import companiesPageSource from "./CompaniesPage.vue?raw";
import menusPageSource from "./MenusPage.vue?raw";

const settingsPages = [appsPageSource, companiesPageSource, menusPageSource];

describe("settings section headers", () => {
    it("uses the shared SectionHeader molecule as the single source of truth", () => {
        for (const source of settingsPages) {
            expect(source).toContain("<SectionHeader");
            expect(source).toContain(
                'import SectionHeader from "@/components/molecules/SectionHeader.vue";',
            );
            expect(source).not.toContain("SettingsSectionHeader");
        }
    });
});
