import { describe, expect, it } from "vitest";
import authShellSource from "./AuthShell.vue?raw";

describe("AuthShell i18n usage", () => {
    it("resolves the footer copyright text through vue-i18n", () => {
        expect(authShellSource).toContain('import { useI18n } from "vue-i18n"');
        expect(authShellSource).toContain("auth.shell.footer");
        expect(authShellSource).not.toContain("All rights reserved");
    });
});

describe("AuthShell form alignment", () => {
    it("keeps form fields start-aligned inside the centered auth shell", () => {
        expect(authShellSource).toContain(".auth-card__body");
        expect(authShellSource).toContain("text-align: start");
    });
});
