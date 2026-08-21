import { describe, expect, it } from "vitest";
import loginSource from "./LoginPage.vue?raw";
import registerSource from "./RegisterPage.vue?raw";
import useLoginSource from "./composables/useLogin.ts?raw";
import useRegisterSource from "./composables/useRegister.ts?raw";

describe("auth form primitives", () => {
    it("uses CheckboxField for login remember-me state", () => {
        expect(loginSource).toContain("<CheckboxField");
        expect(loginSource).toContain(
            'import CheckboxField from "@/components/ui/form/CheckboxField.vue";',
        );
        expect(loginSource).not.toContain(
            "text-brand-600 focus:ring-brand-500",
        );
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
        expect(registerSource).not.toContain(
            "text-brand-600 focus:ring-brand-500",
        );
        expect(registerSource).not.toContain("hover:text-brand-600");
        expect(registerSource).not.toContain("bg-surface-secondary p-3");
    });
});

describe("LoginPage i18n usage", () => {
    it("resolves login copy through vue-i18n instead of hardcoded Indonesian text", () => {
        expect(loginSource).toContain('import { useI18n } from "vue-i18n"');
        expect(loginSource).toContain("auth.login.submit");
        expect(loginSource).toContain("auth.login.emailLabel");
        expect(loginSource).toContain("common.password.show");
        expect(loginSource).not.toContain("Belum punya akun?");
        expect(loginSource).not.toContain('"Masuk"');
    });
});

describe("RegisterPage i18n usage", () => {
    it("resolves register copy through vue-i18n instead of hardcoded Indonesian text", () => {
        expect(registerSource).toContain('import { useI18n } from "vue-i18n"');
        expect(registerSource).toContain("auth.register.submit");
        expect(registerSource).toContain("auth.register.emailLabel");
        expect(registerSource).not.toContain("Buat akun enterprise");
        expect(registerSource).not.toContain('"Daftar"');
    });
});

describe("useLogin i18n usage", () => {
    it("resolves validation and toast copy in the composable through t()", () => {
        expect(useLoginSource).toContain('import { useI18n } from "vue-i18n"');
        expect(useLoginSource).toContain("auth.login.errors.emailInvalid");
        expect(useLoginSource).toContain("auth.login.toastSuccess");
        expect(useLoginSource).not.toContain("Gunakan email valid perusahaan.");
    });
});

describe("useRegister i18n usage", () => {
    it("resolves validation and toast copy in the composable through t()", () => {
        expect(useRegisterSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(useRegisterSource).toContain(
            "auth.register.errors.fullNameRequired",
        );
        expect(useRegisterSource).toContain("auth.register.toastSuccess");
        expect(useRegisterSource).not.toContain("Nama tidak boleh kosong.");
    });
});
