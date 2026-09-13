import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import ProcessActivityPicker from "./ProcessActivityPicker.vue";

describe("ProcessActivityPicker", () => {
    it("renders all 6 activity labels grouped by domain and marks the active one", async () => {
        const app = createSSRApp(ProcessActivityPicker, {
            modelValue: "outbound",
        });
        const html = await renderToString(app);

        expect(html).toContain("Receiving");
        expect(html).toContain("Putaway");
        expect(html).toContain("Outbound");
        expect(html).toContain("Transfer");
        expect(html).toContain("Relocation");
        expect(html).toContain("Stock Opname");
        expect(html).toContain("Stock In");
        expect(html).toContain("Stock Out");
        expect(html).toContain("Inventory");
        expect(html).toContain("text-primary-600");
    });
});
