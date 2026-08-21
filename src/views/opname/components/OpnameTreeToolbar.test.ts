import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import OpnameTreeToolbar from "./OpnameTreeToolbar.vue";

describe("OpnameTreeToolbar", () => {
    it("renders opname tree controls through the shared toolbar title", async () => {
        const app = createSSRApp(OpnameTreeToolbar, {
            heading: "Stock Opname",
            selectedWarehouseId: "wh-1",
            warehouseOptions: [{ label: "Main Warehouse", value: "wh-1" }],
            keyword: "cycle",
            startDate: "",
            endDate: "",
            statusFilter: "",
            locationFilter: "",
        });

        const html = await renderToString(app);

        expect(html).toContain("Stock Opname List");
        expect(html).toContain("txt_OpnameTreeSearch");
        expect(html).toContain("btn_OpnameTreeFilter");
        expect(html).toContain("btn_OpnameTreeRefresh");
        expect(html).toContain("btn_OpnameTreeNew");
        expect(html).toContain("data-toolbar-title");
    });
});
