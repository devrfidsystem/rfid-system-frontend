import { describe, expect, it } from "vitest";
import formActionsSource from "./FormActions.vue?raw";

describe("FormActions", () => {
    it("spaces footer actions between the left and right edges", () => {
        expect(formActionsSource).toContain("justify-between");
        expect(formActionsSource).not.toContain("flex justify-end gap-3");
    });
});
