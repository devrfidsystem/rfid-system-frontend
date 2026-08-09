import { describe, expect, it } from "vitest";
import loginSource from "./LoginPage.vue?raw";
import registerSource from "./RegisterPage.vue?raw";

describe("auth form primitives", () => {
    it("uses CheckboxField for login remember-me state", () => {
        expect(loginSource).toContain("<CheckboxField");
        expect(loginSource).toContain(
            'import CheckboxField from "@/components/ui/form/CheckboxField.vue";',
        );
        expect(loginSource).not.toContain("text-brand-600 focus:ring-brand-500");
    });

    it("uses CheckboxField and InlineAlert for register inline states", () => {
        expect(registerSource).toContain("<CheckboxField");
        expect(registerSource).toContain("<InlineAlert");
        expect(registerSource).toContain(
            'import CheckboxField from "@/components/ui/form/CheckboxField.vue";',
        );
        expect(registerSource).toContain(
            'import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";',
        );
        expect(registerSource).not.toContain("text-brand-600 focus:ring-brand-500");
        expect(registerSource).not.toContain("hover:text-brand-600");
        expect(registerSource).not.toContain("bg-surface-secondary p-3");
    });
});
