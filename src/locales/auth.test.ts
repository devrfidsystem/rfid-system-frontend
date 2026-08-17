import { describe, expect, test } from "vitest";
import authId from "./id/auth.json";
import authEn from "./en/auth.json";

describe("auth locale namespace", () => {
    test("id namespace defines login copy", () => {
        expect(authId.login.submit).toBe("Masuk");
        expect(authId.login.errors.emailInvalid).toBe(
            "Gunakan email valid perusahaan.",
        );
    });

    test("en namespace defines login copy", () => {
        expect(authEn.login.submit).toBe("Sign in");
        expect(authEn.login.errors.emailInvalid).toBe(
            "Use a valid company email.",
        );
    });

    test("id and en namespaces expose the same top-level sections", () => {
        expect(Object.keys(authEn).sort()).toEqual(Object.keys(authId).sort());
    });
});
