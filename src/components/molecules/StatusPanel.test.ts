import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { CheckCircle2 } from "lucide-vue-next";
import StatusPanel from "./StatusPanel.vue";

describe("StatusPanel", () => {
    it("renders a centered status panel with semantic tone", async () => {
        const app = createSSRApp(StatusPanel, {
            title: "No open exceptions",
            description: "Selected warehouse has no active operational risk.",
            icon: CheckCircle2,
            tone: "success",
            objectId: "pnl_Status",
        });

        const html = await renderToString(app);

        expect(html).toContain("No open exceptions");
        expect(html).toContain(
            "Selected warehouse has no active operational risk.",
        );
        expect(html).toContain('object-id="pnl_Status"');
        expect(html).toContain("text-success-600");
    });
});
