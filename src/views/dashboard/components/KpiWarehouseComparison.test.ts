import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import KpiWarehouseComparison from "./KpiWarehouseComparison.vue";

describe("KpiWarehouseComparison", () => {
    it("renders top and bottom performing warehouses", async () => {
        const app = createSSRApp(KpiWarehouseComparison, {
            loading: false,
            data: {
                top: [
                    {
                        warehouseId: "wh-1",
                        warehouseName: "Batam Gateway",
                        score: 93,
                    },
                ],
                bottom: [
                    {
                        warehouseId: "wh-2",
                        warehouseName: "Jakarta Hub",
                        score: 58,
                    },
                ],
            },
        });
        const html = await renderToString(app);

        expect(html).toContain("Top Performing");
        expect(html).toContain("Batam Gateway");
        expect(html).toContain("93");
        expect(html).toContain("Needs Attention");
        expect(html).toContain("Jakarta Hub");
        expect(html).toContain("58");
    });

    it("renders an empty message when there is no ranked warehouse", async () => {
        const app = createSSRApp(KpiWarehouseComparison, {
            loading: false,
            data: { top: [], bottom: [] },
        });
        const html = await renderToString(app);
        expect(html).toContain("No warehouse activity");
    });
});
