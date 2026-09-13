import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { FileText } from "lucide-vue-next";
import MetricSummaryCard from "./MetricSummaryCard.vue";

describe("MetricSummaryCard", () => {
    it("renders a consistent metric heading, value, tone, and content slot", async () => {
        const app = createSSRApp({
            render: () =>
                h(
                    MetricSummaryCard,
                    {
                        label: "Total",
                        value: "128",
                        icon: FileText,
                        tone: "primary",
                        objectId: "wdg_TestMetric",
                    },
                    {
                        default: () => h("p", "slot detail"),
                    },
                ),
        });

        const html = await renderToString(app);

        expect(html).toContain("Total");
        expect(html).toContain("128");
        expect(html).toContain("slot detail");
        expect(html).toContain('object-id="wdg_TestMetric"');
        expect(html).toContain("bg-primary-50");
        expect(html).toContain("ring-primary-200");
    });
});
