import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import AppLoadingScreen from "./AppLoadingScreen.vue";

const renderLoadingScreen = async () => {
    const app = createSSRApp({
        render: () => h(AppLoadingScreen),
    });

    return renderToString(app);
};

describe("AppLoadingScreen", () => {
    it("renders the full-screen overlay with the brand mark", async () => {
        const html = await renderLoadingScreen();

        expect(html).toContain("app-loading-screen");
        expect(html).toContain("app-loading-screen__mark");
        expect(html).toContain("<svg");
    });
});
