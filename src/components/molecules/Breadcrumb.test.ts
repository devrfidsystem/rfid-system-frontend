import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import Breadcrumb from "./Breadcrumb.vue";

describe("Breadcrumb", () => {
    it("uses semantic text classes for active, inactive, and separator states", async () => {
        const app = createSSRApp(Breadcrumb, {
            items: [
                { label: "Dashboard" },
                { label: "Monitoring", active: true },
            ],
        });

        const html = await renderToString(app);

        expect(html).toContain("text-text font-semibold");
        expect(html).toContain("hover:text-text");
        expect(html).toContain("text-text-muted");
        expect(html).not.toContain("text-gray-900");
        expect(html).not.toContain("text-gray-300");
    });
});
