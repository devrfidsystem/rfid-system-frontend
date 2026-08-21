import { describe, expect, it } from "vitest";
import profilePageSource from "./ProfilePage.vue?raw";
import useProfileSource from "./composables/useProfile.ts?raw";

describe("ProfilePage language switcher", () => {
    it("renders a SegmentedControl bound to the locale store options", () => {
        expect(profilePageSource).toContain("SegmentedControl");
        expect(profilePageSource).toContain("currentLocale");
        expect(profilePageSource).toContain("localeOptions");
        expect(profilePageSource).toContain("common.language.label");
    });

    it("exposes locale state and a setter from useProfile via the locale store", () => {
        expect(useProfileSource).toContain(
            'import { useLocaleStore } from "@/store/locale.store"',
        );
        expect(useProfileSource).toContain("currentLocale");
        expect(useProfileSource).toContain("localeOptions");
        expect(useProfileSource).toContain("setLocale");
    });
});
