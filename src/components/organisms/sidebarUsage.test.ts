import { describe, expect, it } from "vitest";
import sidebarSource from "./Sidebar.vue?raw";

describe("Sidebar menu icon usage", () => {
    it("renders an icon for each nested menu item", () => {
        expect(sidebarSource).toContain(':icon="child.icon"');
    });
});
