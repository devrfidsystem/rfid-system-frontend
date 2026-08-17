import { describe, expect, it } from "vitest";
import pageSource from "./TagRegistrationPage.vue?raw";

describe("TagRegistrationPage confirmation", () => {
    it("uses the shared ConfirmDialog for EPC deletion", () => {
        expect(pageSource).toContain("<ConfirmDialog");
        expect(pageSource).toContain(
            'import ConfirmDialog from "@/components/organisms/ConfirmDialog.vue";',
        );
        expect(pageSource).toContain("openDeleteConfirm");
        expect(pageSource).toContain("confirmDelete");
        expect(pageSource).toContain("<ToolbarTitle");
        expect(pageSource).toContain(
            'import ToolbarTitle from "@/components/molecules/ToolbarTitle.vue";',
        );
        expect(pageSource).not.toContain("window.confirm");
    });
});
