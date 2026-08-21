import { describe, expect, it } from "vitest";
import forgotPasswordSource from "./ForgotPasswordPage.vue?raw";
import useForgotPasswordSource from "./composables/useForgotPassword.ts?raw";

describe("ForgotPasswordPage i18n usage", () => {
    it("resolves copy through vue-i18n instead of hardcoded Indonesian text", () => {
        expect(forgotPasswordSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(forgotPasswordSource).toContain("auth.forgotPassword.submit");
        expect(forgotPasswordSource).not.toContain("Lupa password?");
    });

    it("resolves validation and toast copy in the composable through t()", () => {
        expect(useForgotPasswordSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(useForgotPasswordSource).toContain(
            "auth.forgotPassword.errors.emailInvalid",
        );
        expect(useForgotPasswordSource).not.toContain(
            "Gunakan email valid perusahaan.",
        );
    });
});
