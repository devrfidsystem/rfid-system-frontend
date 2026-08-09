import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import RankBadge from "./RankBadge.vue";

describe("RankBadge", () => {
    it("renders a compact rank marker with semantic tone", async () => {
        const app = createSSRApp(RankBadge, {
            label: 1,
            tone: "success",
        });

        const html = await renderToString(app);

        expect(html).toContain("1");
        expect(html).toContain("bg-success-50");
        expect(html).toContain("font-semibold");
    });
});
