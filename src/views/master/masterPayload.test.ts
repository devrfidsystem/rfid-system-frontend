import { describe, expect, it } from "vitest";
import { buildMasterCreatePayload } from "./masterPayload";

describe("buildMasterCreatePayload", () => {
    it("parses attribute list items into backend payload objects", () => {
        const payload = buildMasterCreatePayload("attributes", {
            name: "Color",
            type: "list",
            items: "Black\nWhite, Gray",
        });

        expect(payload).toEqual({
            name: "Color",
            type: "list",
            items: [
                { value: "Black", label: "Black" },
                { value: "White", label: "White" },
                { value: "Gray", label: "Gray" },
            ],
        });
    });

    it("keeps warehouse descriptions in the payload", () => {
        const payload = buildMasterCreatePayload("warehouses", {
            name: "Main Warehouse",
            description: "Primary site",
        });

        expect(payload).toEqual({
            name: "Main Warehouse",
            description: "Primary site",
            code: "WH-MAIN-WAREHOUSE",
        });
    });

    it("ignores file fields and generates location codes", () => {
        const payload = buildMasterCreatePayload("locations", {
            warehouseId: "wh-1",
            name: "Rack A",
            parentId: "loc-1",
            imageFile: null,
        });

        expect(payload).toEqual({
            warehouseId: "wh-1",
            name: "Rack A",
            parentId: "loc-1",
            code: "LOC-RACK-A",
        });
    });
});
