import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import CheckboxField from "./CheckboxField.vue";

describe("CheckboxField", () => {
    it("renders an accessible checkbox with design-system focus classes", async () => {
        const app = createSSRApp(CheckboxField, {
            modelValue: true,
            label: "Active",
            objectId: "chk_SettingsActive",
        });

        const html = await renderToString(app);

        expect(html).toContain('type="checkbox"');
        expect(html).toContain("checked");
        expect(html).toContain("Active");
        expect(html).toContain("chk_SettingsActive");
        expect(html).toContain("text-primary-600");
        expect(html).toContain("focus:ring-primary-500");
    });

    it("exposes blur as a component event for touched-state forms", async () => {
        const app = createSSRApp(CheckboxField, {
            modelValue: false,
            label: "Terms accepted",
            objectId: "chk_RegisterTerms",
            error: "Terms must be accepted",
            align: "start",
            onBlur: () => undefined,
        });

        const html = await renderToString(app);

        expect(html).toContain('type="checkbox"');
        expect(html).toContain("chk_RegisterTerms");
        expect(html).toContain("items-start");
        expect(html).toContain("Terms must be accepted");
        expect(html).toContain("text-danger-600");
        expect(CheckboxField.emits).toContain("blur");
    });
});
