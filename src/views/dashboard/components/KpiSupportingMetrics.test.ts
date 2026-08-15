import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import KpiSupportingMetrics from "./KpiSupportingMetrics.vue";

describe("KpiSupportingMetrics", () => {
    it("renders one card per metric with its label and value", async () => {
        const app = createSSRApp(KpiSupportingMetrics, {
            loading: false,
            data: [
                { label: "Receiving — Avg Cycle Time", value: "0.6h" },
                { label: "Putaway — Avg Cycle Time", value: "0.4h" },
            ],
        });
        const html = await renderToString(app);

        expect(html).toContain("Supporting Signals");
        expect(html).toContain("Receiving — Avg Cycle Time");
        expect(html).toContain("0.6h");
        expect(html).toContain("Putaway — Avg Cycle Time");
        expect(html).toContain("0.4h");
    });
});
