import { describe, expect, test } from "vitest";
import commonId from "./id/common.json";
import commonEn from "./en/common.json";

describe("common locale namespace", () => {
    test("id namespace defines password and language copy", () => {
        expect(commonId.password.show).toBe("Tampilkan password");
        expect(commonId.password.hide).toBe("Sembunyikan password");
        expect(commonId.language.label).toBe("Bahasa");
        expect(commonId.language.indonesian).toBe("Indonesia");
        expect(commonId.language.english).toBe("Inggris");
    });

    test("en namespace defines password and language copy", () => {
        expect(commonEn.password.show).toBe("Show password");
        expect(commonEn.password.hide).toBe("Hide password");
        expect(commonEn.language.label).toBe("Language");
        expect(commonEn.language.indonesian).toBe("Indonesian");
        expect(commonEn.language.english).toBe("English");
    });
});
