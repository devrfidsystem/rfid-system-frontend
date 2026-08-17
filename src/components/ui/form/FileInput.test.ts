import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import FileInput from "./FileInput.vue";

describe("FileInput", () => {
    it("renders a file control with design-system styling and selected file text", async () => {
        const file = new File(["sku,name"], "products.xlsx", {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const app = createSSRApp(FileInput, {
            label: "Excel File",
            objectId: "file_MasterHeaderImport",
            accept: ".xlsx,.xls",
            selectedFile: file,
        });

        const html = await renderToString(app);

        expect(html).toContain('type="file"');
        expect(html).toContain("file_MasterHeaderImport");
        expect(html).toContain("Excel File");
        expect(html).toContain(".xlsx,.xls");
        expect(html).toContain("Selected: products.xlsx");
        expect(html).toContain("file:bg-primary-50");
    });

    it("supports disabled and error states from forms", async () => {
        const app = createSSRApp(FileInput, {
            label: "Product Image",
            objectId: "file_MasterForm_FieldimageFile",
            disabled: true,
            error: "Image is required",
        });

        const html = await renderToString(app);

        expect(html).toContain("disabled");
        expect(html).toContain("Image is required");
        expect(html).toContain("text-signal-red");
        expect(FileInput.emits).toContain("change");
    });
});
