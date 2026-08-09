import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import Textarea from "./Textarea.vue";

describe("Textarea", () => {
    it("uses semantic text and danger classes", async () => {
        const app = createSSRApp(Textarea, {
            label: "Notes",
            modelValue: "Damaged pallet",
            error: "Required",
        });

        const html = await renderToString(app);

        expect(html).toContain("text-text");
        expect(html).toContain("border-danger-500");
        expect(html).toContain("bg-danger-50");
        expect(html).toContain("text-danger-600");
        expect(html).not.toContain("text-gray-700");
        expect(html).not.toContain("bg-red-50");
    });
});
