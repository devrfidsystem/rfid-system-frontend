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
    it("renders the full-screen overlay with a stage that cycles the ALIR logo and three warehouse icons", async () => {
        const html = await renderLoadingScreen();

        expect(html).toContain("app-loading-screen");
        expect(html).toContain("app-loading-screen__stage");
        expect(html).toContain("app-loading-screen__frame--1");
        expect(html).toContain("app-loading-screen__frame--2");
        expect(html).toContain("app-loading-screen__frame--3");
        expect(html).toContain("app-loading-screen__frame--4");
        expect(html).toContain("ALIR Smart System");

        const imgCount = (html.match(/<img/g) ?? []).length;
        expect(imgCount).toBe(4); // ALIR logo + 3 cycling icons, all in the same stage
    });
});
