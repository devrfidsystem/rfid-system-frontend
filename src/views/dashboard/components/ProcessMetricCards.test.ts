import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import ProcessMetricCards from "./ProcessMetricCards.vue";

describe("ProcessMetricCards", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(ProcessMetricCards, {
            loading: true,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders cycle time and productivity cards with trend direction", async () => {
        const app = createSSRApp(ProcessMetricCards, {
            loading: false,
            data: {
                activity: "receiving",
                domain: "stockIn",
                label: "Receiving",
                cycleTime: { minutes: 36, previousMinutes: 40, trendPct: -10 },
                productivity: {
                    unitsPerHour: 120,
                    previousUnitsPerHour: 110,
                    trendPct: 9.1,
                },
                supportingMetrics: {
                    completedTransactions: 42,
                    avgDailyVolumeUnits: 500,
                    avgQueueTimeMinutes: 12,
                },
                trend: [],
                hourlyDistribution: [],
                warehouseComparison: { top: [], bottom: [] },
                operatorRanking: [],
            },
        });
        const html = await renderToString(app);

        expect(html).toContain("Cycle Time");
        expect(html).toContain("36");
        expect(html).toContain("Productivity");
        expect(html).toContain("120");
        expect(html).toContain("text-danger-600");
        expect(html).toContain("text-success-600");
    });
});
