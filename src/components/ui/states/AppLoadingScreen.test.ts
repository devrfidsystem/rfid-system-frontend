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

    it("renders a badge that cycles through four distinct icons", async () => {
        const html = await renderLoadingScreen();

        expect(html).toContain("app-loading-screen__badge");
        expect(html).toContain("app-loading-screen__icon--1");
        expect(html).toContain("app-loading-screen__icon--2");
        expect(html).toContain("app-loading-screen__icon--3");
        expect(html).toContain("app-loading-screen__icon--4");

        const svgCount = (html.match(/<svg/g) ?? []).length;
        expect(svgCount).toBe(4);
    });
});
