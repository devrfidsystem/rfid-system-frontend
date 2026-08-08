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

    it("renders two small-multiple charts (cycle time and productivity) for an 8-point trend", async () => {
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
        // Each mini chart gets its own gradient-filled smoothed line (<path>
        // + <linearGradient>) rather than the old flat <polyline>.
        const gradientCount = html.split("<linearGradient").length - 1;
        expect(gradientCount).toBe(2);
        // Last value of each series is direct-labeled in the header.
        expect(html).toContain("33");
        expect(html).toContain("107");
        // Trend delta badges: cycle time dropped (good, lower is better),
        // productivity rose (good, higher is better) — both render as %.
        expect(html).toContain("%");
    });

    it("does not render the table view or toggle button when there is no data", async () => {
        const app = createSSRApp(ProcessTrendChart, {
            loading: false,
            data: [],
        });
        const html = await renderToString(app);
        expect(html).not.toContain("View as table");
    });

    it("shows a table-view toggle for accessibility when data is present", async () => {
        const app = createSSRApp(ProcessTrendChart, {
            loading: false,
            data: [
                {
                    period: "Week 1",
                    cycleTimeMinutes: 36,
                    productivityUnitsPerHour: 120,
                },
            ],
        });
        const html = await renderToString(app);
        expect(html).toContain("View as table");
    });
});
