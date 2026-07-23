import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import MasterImportDialog from "./MasterImportDialog.vue";

describe("MasterImportDialog", () => {
    it("renders Excel template export and import controls", async () => {
        const app = createSSRApp(MasterImportDialog, {
            isOpen: true,
            title: "Customers",
            isImporting: false,
        });
        const context: { teleports?: Record<string, string> } = {};

        await renderToString(app, context);
        const html = context.teleports?.body ?? "";

        expect(html).toContain("dlg_MasterHeaderImport");
        expect(html).toContain("btn_MasterHeaderExportTemplate");
        expect(html).toContain("Export Template");
        expect(html).toContain("file_MasterHeaderImport");
        expect(html).toContain(".xlsx,.xls");
        expect(html).toContain("btn_MasterHeaderImportSubmit");
    });
});
