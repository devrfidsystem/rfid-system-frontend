import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import ProcessTrendChart from "./ProcessTrendChart.vue";

describe("ProcessTrendChart", () => {
    it("renders an empty message when there is no trend data", async () => {
        const app = createSSRApp(ProcessTrendChart, {
            loading: false,
            data: [],
        });
        const html = await renderToString(app);
        expect(html).toContain("No trend data available");
    });

    it("renders two polylines (cycle time and productivity) for an 8-point trend", async () => {
        const app = createSSRApp(ProcessTrendChart, {
            loading: false,
            data: Array.from({ length: 8 }, (_, i) => ({
                period: `${i}`,
                cycleTimeMinutes: 40 - i,
                productivityUnitsPerHour: 100 + i,
            })),
        });
        const html = await renderToString(app);

        expect(html).toContain("Cycle Time");
        expect(html).toContain("Productivity");
        const polylineCount = html.split("<polyline").length - 1;
        expect(polylineCount).toBe(2);
    });
});
