import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import MasterHeader from "./MasterHeader.vue";

describe("MasterHeader", () => {
    it("renders Excel import and export controls for supported master entities", async () => {
        const app = createSSRApp(MasterHeader, {
            title: "Product Master",
            keyword: "",
            canAdd: true,
            entityKey: "products",
            isImporting: false,
        });

        const html = await renderToString(app);

        expect(html).toContain("btn_MasterHeaderImport");
        expect(html).toContain("btn_MasterHeaderExport");
    });
});
