import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import ProcessOperatorRanking from "./ProcessOperatorRanking.vue";

describe("ProcessOperatorRanking", () => {
    it("renders a ranked list of operators with their scores", async () => {
        const app = createSSRApp(ProcessOperatorRanking, {
            loading: false,
            data: [
                { userId: "u-1", userName: "Fast Operator", score: 96 },
                { userId: "u-2", userName: "Slow Operator", score: 61 },
            ],
        });
        const html = await renderToString(app);

        expect(html).toContain("Operator Ranking");
        expect(html).toContain("Fast Operator");
        expect(html).toContain("96");
        expect(html).toContain("Slow Operator");
        expect(html).toContain("61");
    });

    it("renders an empty message when there is no operator data", async () => {
        const app = createSSRApp(ProcessOperatorRanking, {
            loading: false,
            data: [],
        });
        const html = await renderToString(app);
        expect(html).toContain("No operator activity");
    });
});
