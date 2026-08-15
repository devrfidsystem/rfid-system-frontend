import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import Badge from "./Badge.vue";

type BadgeTone =
    | "neutral"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "purple"
    | "teal";

const renderBadge = async (tone: BadgeTone) => {
    const app = createSSRApp({
        render: () =>
            h(
                Badge,
                { tone },
                {
                    default: () => `${tone} status`,
                },
            ),
    });

    return renderToString(app);
};

describe("Badge", () => {
    it("renders teal and purple as distinct semantic tone groups", async () => {
        const success = await renderBadge("success");
        const teal = await renderBadge("teal");
        const info = await renderBadge("info");
        const purple = await renderBadge("purple");

        expect(teal).toContain("bg-teal-50");
        expect(teal).toContain("text-teal-700");
        expect(teal).not.toContain("bg-success-50");
        expect(teal).not.toContain("text-success-600");

        expect(purple).toContain("bg-purple-50");
        expect(purple).toContain("text-purple-700");
        expect(purple).not.toContain("bg-info-50");
        expect(purple).not.toContain("text-info-600");

        expect(teal).not.toBe(success);
        expect(purple).not.toBe(info);
    });
});
