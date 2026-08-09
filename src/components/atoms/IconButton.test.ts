import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import IconButton from "./IconButton.vue";

describe("IconButton", () => {
    it("uses semantic token classes for neutral and danger variants", async () => {
        const app = createSSRApp({
            render: () =>
                h("div", [
                    h(IconButton, { variant: "neutral" }, () => "N"),
                    h(IconButton, { variant: "danger" }, () => "D"),
                ]),
        });

        const html = await renderToString(app);

        expect(html).toContain("border-border");
        expect(html).toContain("bg-surface");
        expect(html).toContain("hover:bg-surface-secondary");
        expect(html).toContain("bg-danger-50");
        expect(html).toContain("text-danger-600");
        expect(html).not.toContain("border-gray-200");
        expect(html).not.toContain("bg-red-50");
    });
});
