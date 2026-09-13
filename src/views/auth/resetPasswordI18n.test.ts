import { describe, expect, it } from "vitest";
import resetPasswordSource from "./ResetPasswordPage.vue?raw";
import useResetPasswordSource from "./composables/useResetPassword.ts?raw";

describe("ResetPasswordPage i18n usage", () => {
    it("resolves copy through vue-i18n instead of hardcoded Indonesian text", () => {
        expect(resetPasswordSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(resetPasswordSource).toContain("auth.resetPassword.submit");
        expect(resetPasswordSource).not.toContain("Atur ulang password");
    });

    it("resolves validation and toast copy in the composable through t()", () => {
        expect(useResetPasswordSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(useResetPasswordSource).toContain(
            "auth.resetPassword.errors.invalidLink",
        );
        expect(useResetPasswordSource).not.toContain(
            "Tautan reset password tidak valid atau sudah kedaluwarsa.",
        );
    });
});
