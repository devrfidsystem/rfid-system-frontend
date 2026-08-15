import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import KpiDomainHero from "./KpiDomainHero.vue";

describe("KpiDomainHero", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(KpiDomainHero, { loading: true, data: null });
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders score, trend, derivedFrom, and an 8-point timeline", async () => {
        const app = createSSRApp(KpiDomainHero, {
            loading: false,
            data: {
                domain: "stockIn",
                label: "Stock In Performance",
                derivedFrom: "Receiving and Putaway",
                score: 83,
                previousScore: 82,
                trendVsPrevious: 1,
                timeline: Array.from({ length: 8 }, (_, i) => ({
                    period: `${i}`,
                    score: 80 + i,
                })),
                warehouseComparison: { top: [], bottom: [] },
                contributors: [],
                supportingMetrics: [],
            },
        });
        const html = await renderToString(app);

        expect(html).toContain("Stock In Performance");
        expect(html).toContain("Source workflow: Receiving and Putaway");
        expect(html).toContain("83");
        // Timeline is rendered via the shared TrendMiniChart (smoothed <path> +
        // gradient fill), replacing the old plain <polyline>.
        expect(html).toContain("Score Timeline");
        expect(html).toContain("<path");
        expect(html).toContain("stroke-primary-600");
    });
});
