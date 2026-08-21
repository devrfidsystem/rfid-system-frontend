import { describe, expect, it } from "vitest";
import sidebarSource from "./Sidebar.vue?raw";

describe("Sidebar design-system usage", () => {
    it("uses the Input atom for menu search", () => {
        expect(sidebarSource).toContain("<Input");
        expect(sidebarSource).toContain(
            'import Input from "@/components/atoms/Input.vue";',
        );
        expect(sidebarSource).not.toContain("<input");
        expect(sidebarSource).not.toContain("focus:border-primary-500");
    });
});
