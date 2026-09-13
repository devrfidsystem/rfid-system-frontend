import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import UsersTableToolbar from "./UsersTableToolbar.vue";

describe("UsersTableToolbar", () => {
    it("renders search and refresh controls without an inactive filter action", async () => {
        const app = createSSRApp(UsersTableToolbar, {
            keyword: "admin",
        });

        const html = await renderToString(app);

        expect(html).toContain("Users List");
        expect(html).toContain("Search email or name");
        expect(html).toContain("txt_UsersSearch");
        expect(html).toContain("btn_UsersRefresh");
        expect(html).toContain("data-toolbar-title");
        expect(html).not.toContain("btn_UsersFilter");
    });
});
