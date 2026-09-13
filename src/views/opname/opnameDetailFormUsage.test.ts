import { describe, expect, it } from "vitest";
import opnameDetailSource from "./OpnameDetailPage.vue?raw";

describe("OpnameDetailPage form primitives", () => {
    it("uses Textarea atom for item action notes", () => {
        expect(opnameDetailSource).toContain("<Textarea");
        expect(opnameDetailSource).toContain(
            'import Textarea from "@/components/atoms/Textarea.vue";',
        );
        expect(opnameDetailSource).not.toContain("<textarea");
        expect(opnameDetailSource).not.toContain(
            "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
        );
    });
});
