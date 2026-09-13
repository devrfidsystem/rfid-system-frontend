import { describe, expect, it } from "vitest";
import pageSource from "./UserAccessPage.vue?raw";

describe("UserAccessPage structure", () => {
    it("uses the shared SectionHeader molecule for the page header", () => {
        expect(pageSource).toContain("<SectionHeader");
        expect(pageSource).toContain(
            'import SectionHeader from "@/components/molecules/SectionHeader.vue";',
        );
        expect(pageSource).not.toContain("<h3");
    });
});
