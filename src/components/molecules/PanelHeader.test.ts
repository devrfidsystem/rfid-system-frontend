import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import PanelHeader from "./PanelHeader.vue";

describe("PanelHeader", () => {
    it("renders a compact panel heading with optional actions", async () => {
        const app = createSSRApp({
            components: { PanelHeader },
            template: `
                <PanelHeader
                    title="Operational Exceptions"
                    description="Open warehouse risks that need operator action"
                >
                    <button type="button">Action</button>
                </PanelHeader>
            `,
        });

        const html = await renderToString(app);

        expect(html).toContain("Operational Exceptions");
        expect(html).toContain("Open warehouse risks that need operator action");
        expect(html).toContain("Action");
        expect(html).toContain("data-panel-header");
    });
});
