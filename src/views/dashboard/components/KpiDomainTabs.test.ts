import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import KpiDomainTabs from "./KpiDomainTabs.vue";

describe("KpiDomainTabs", () => {
    it("renders all three tab labels and marks the active one", async () => {
        const app = createSSRApp(KpiDomainTabs, { modelValue: "inventory" });
        const html = await renderToString(app);

        expect(html).toContain("Stock In");
        expect(html).toContain("Inventory");
        expect(html).toContain("Stock Out");
        expect(html).toContain("text-primary-600");
    });
});
