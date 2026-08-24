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
    it("renders the full-screen overlay with the ALIR logo", async () => {
        const html = await renderLoadingScreen();

        expect(html).toContain("app-loading-screen");
        expect(html).toContain("app-loading-screen__logo");
        expect(html).toContain("ALIR Smart System");
    });

    it("renders a wave of five staggered dots", async () => {
        const html = await renderLoadingScreen();

        expect(html).toContain("app-loading-screen__wave");
        expect(html).toContain("app-loading-screen__dot--1");
        expect(html).toContain("app-loading-screen__dot--2");
        expect(html).toContain("app-loading-screen__dot--3");
        expect(html).toContain("app-loading-screen__dot--4");
        expect(html).toContain("app-loading-screen__dot--5");
    });
});
