import { describe, expect, it } from "vitest";
import routerSource from "./index.ts?raw";

describe("production routes", () => {
    it("does not expose the local todo sample route", () => {
        expect(routerSource).not.toContain('path: "todo"');
        expect(routerSource).not.toContain("TodoListPage");
    });

    it("keeps retired Transfer outside the generic transaction route pattern", () => {
        expect(routerSource).not.toContain("transactions/transfer");
        expect(routerSource).not.toContain('"transfer"');
    });
});
