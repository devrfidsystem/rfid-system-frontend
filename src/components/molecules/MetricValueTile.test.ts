import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import MetricValueTile from "./MetricValueTile.vue";

describe("MetricValueTile", () => {
    it("renders a compact label-value metric tile", async () => {
        const app = createSSRApp({
            render: () =>
                h(MetricValueTile, {
                    label: "Receiving Avg Cycle Time",
                    value: "0.6h",
                }),
        });

        const html = await renderToString(app);

        expect(html).toContain("Receiving Avg Cycle Time");
        expect(html).toContain("0.6h");
        expect(html).toContain("rounded-md border border-border p-3");
        expect(html).toContain("text-base font-semibold text-text");
    });
});
