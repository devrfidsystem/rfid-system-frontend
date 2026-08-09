import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import InlineAlert from "./InlineAlert.vue";

const renderAlert = async (
    variant: "info" | "success" | "warning" | "error",
) => {
    const app = createSSRApp({
        render: () =>
            h(InlineAlert, {
                variant,
                title: `${variant} title`,
                description: `${variant} description`,
            }),
    });

    return renderToString(app);
};

describe("InlineAlert", () => {
    it("uses the semantic status palette for every variant", async () => {
        await expect(renderAlert("info")).resolves.toContain("bg-info-50");
        await expect(renderAlert("success")).resolves.toContain("bg-success-50");
        await expect(renderAlert("warning")).resolves.toContain("bg-warning-50");

        const error = await renderAlert("error");
        expect(error).toContain("bg-danger-50");
        expect(error).toContain("border-danger-500/20");
        expect(error).not.toContain("bg-error-50");
        expect(error).not.toContain("border-error-200");
    });
});
