import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import StockTableToolbar from "./StockTableToolbar.vue";

describe("StockTableToolbar", () => {
    it("renders the stock table controls through a shared toolbar contract", async () => {
        const app = createSSRApp(StockTableToolbar, {
            heading: "Stock Balance",
            keyword: "epc",
            selectedWarehouse: "wh-1",
            warehouseOptions: [{ label: "Main Warehouse", value: "wh-1" }],
            searchPlaceholder: "Search stock",
            objectIdPrefix: "StockBalance",
            exportDisabled: true,
        });

        const html = await renderToString(app);

        expect(html).toContain("Stock Balance List");
        expect(html).toContain("Search stock");
        expect(html).toContain("btn_StockBalanceFilter");
        expect(html).toContain("btn_StockBalanceRefresh");
        expect(html).toContain("btn_StockBalanceExport");
        expect(html).toContain("data-toolbar-title");
        expect(html).toContain("disabled");
    });
});
