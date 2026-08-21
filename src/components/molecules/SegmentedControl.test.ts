import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import SegmentedControl from "./SegmentedControl.vue";

describe("SegmentedControl", () => {
    it("renders options with selected and object-id states", async () => {
        const app = createSSRApp(SegmentedControl, {
            modelValue: "critical",
            options: [
                { label: "All", value: "all" },
                { label: "Critical", value: "critical" },
            ],
            objectId: "seg_Test",
            objectIdPrefix: "btn_Test",
        });

        const html = await renderToString(app);

        expect(html).toContain('object-id="seg_Test"');
        expect(html).toContain('object-id="btn_Test_all"');
        expect(html).toContain('object-id="btn_Test_critical"');
        expect(html).toContain("Critical");
        expect(html).toContain("bg-primary-50 text-primary-600");
    });
});
