import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import StageDonutChart from "./StageDonutChart.vue";

describe("StageDonutChart", () => {
    it("renders the total count in the center and a legend row per stage", async () => {
        const app = createSSRApp(StageDonutChart, {
            stages: [
                { name: "Waiting Putaway", count: 120 },
                { name: "QC Hold", count: 40 },
            ],
        });
        const html = await renderToString(app);

        expect(html).toContain("160");
        expect(html).toContain("Waiting Putaway");
        expect(html).toContain("75%");
        expect(html).toContain("QC Hold");
        expect(html).toContain("25%");
    });

    it("folds stages beyond the fixed palette size into an 'Other' segment", async () => {
        const app = createSSRApp(StageDonutChart, {
            stages: [
                { name: "A", count: 50 },
                { name: "B", count: 40 },
                { name: "C", count: 30 },
                { name: "D", count: 20 },
                { name: "E", count: 10 },
                { name: "F", count: 5 },
            ],
        });
        const html = await renderToString(app);

        expect(html).toContain("Other");
    });

    it("renders 0% and no NaN when total count is zero", async () => {
        const app = createSSRApp(StageDonutChart, {
            stages: [{ name: "Empty Stage", count: 0 }],
        });
        const html = await renderToString(app);

        expect(html).not.toContain("NaN");
        expect(html).toContain("0%");
    });
});
