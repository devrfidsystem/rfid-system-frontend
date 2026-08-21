import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import SectionHeader from "./SectionHeader.vue";

describe("SectionHeader", () => {
    it("renders a reusable section title, description, and actions", async () => {
        const app = createSSRApp({
            components: { SectionHeader },
            template: `
                <SectionHeader
                    title="Roles"
                    description="Define role labels used by access assignment."
                    object-id="hdr_Roles"
                >
                    <button type="button">Add Role</button>
                </SectionHeader>
            `,
        });

        const html = await renderToString(app);

        expect(html).toContain("Roles");
        expect(html).toContain("Define role labels used by access assignment.");
        expect(html).toContain("Add Role");
        expect(html).toContain("hdr_Roles");
        expect(html).toContain("sm:flex-row");
    });
});
