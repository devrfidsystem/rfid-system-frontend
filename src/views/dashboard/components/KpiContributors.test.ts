import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import KpiContributors from "./KpiContributors.vue";

describe("KpiContributors", () => {
    it("renders a labeled bar per contributor with its percentage", async () => {
        const app = createSSRApp(KpiContributors, {
            loading: false,
            data: [
                { label: "Receiving", pct: 66 },
                { label: "Putaway", pct: 34 },
            ],
        });
        const html = await renderToString(app);

        expect(html).toContain("Receiving");
        expect(html).toContain("66%");
        expect(html).toContain("Putaway");
        expect(html).toContain("34%");
        expect(html).toContain("width:66%");
    });
});
