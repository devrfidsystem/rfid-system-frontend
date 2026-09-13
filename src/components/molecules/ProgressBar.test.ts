import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import ProgressBar from "./ProgressBar.vue";

describe("ProgressBar", () => {
    it("renders a bounded progress value with semantic tone", async () => {
        const app = createSSRApp(ProgressBar, {
            value: 120,
            tone: "error",
        });

        const html = await renderToString(app);

        expect(html).toContain('role="progressbar"');
        expect(html).toContain('aria-valuenow="100"');
        expect(html).toContain("width:100%");
        expect(html).toContain("bg-danger-600");
        expect(html).toContain("100%");
    });
});
