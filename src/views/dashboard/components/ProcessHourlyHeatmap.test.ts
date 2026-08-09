import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import ProcessHourlyHeatmap from "./ProcessHourlyHeatmap.vue";

describe("ProcessHourlyHeatmap", () => {
    it("renders 24 hour cells with intensity classes driven by count", async () => {
        const data = Array.from({ length: 24 }, (_, hour) => ({
            hour,
            count: hour === 10 ? 50 : 0,
        }));
        const app = createSSRApp(ProcessHourlyHeatmap, {
            loading: false,
            data,
        });
        const html = await renderToString(app);

        expect(html).toContain("bg-primary-700");
        expect(html).toContain("bg-surface-secondary");
        expect(html).toContain("Hourly Workload Distribution");
        expect(html).toContain("10:00");
    });

    it("renders an empty message when there is no distribution data", async () => {
        const app = createSSRApp(ProcessHourlyHeatmap, {
            loading: false,
            data: [],
        });
        const html = await renderToString(app);
        expect(html).toContain("No hourly workload");
    });
});
