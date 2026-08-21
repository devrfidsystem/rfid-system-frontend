import { describe, expect, test } from "vitest";
import { i18n } from "./index";

describe("i18n instance", () => {
    test("defaults to Indonesian locale", () => {
        expect(i18n.global.locale.value).toBe("id");
    });

    test("resolves a nested auth key in the default locale", () => {
        expect(i18n.global.t("auth.login.submit")).toBe("Masuk");
    });

    test("resolves the same key in English after switching locale", () => {
        i18n.global.locale.value = "en";
        expect(i18n.global.t("auth.login.submit")).toBe("Sign in");
        i18n.global.locale.value = "id";
    });

    test("resolves a common namespace key", () => {
        expect(i18n.global.t("common.language.label")).toBe("Bahasa");
    });
});
