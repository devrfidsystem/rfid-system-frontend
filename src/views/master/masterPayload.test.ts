import { describe, expect, it } from "vitest";
import {
    buildMasterCreatePayload,
    buildMasterUpdatePayload,
} from "./masterPayload";

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

    it("generates codes for customer and supplier create payloads", () => {
        expect(
            buildMasterCreatePayload("customers", {
                name: "Retail Partner",
            }),
        ).toEqual({
            name: "Retail Partner",
            code: "CUST-RETAIL-PARTNER",
        });

        expect(
            buildMasterCreatePayload("suppliers", {
                name: "Source Partner",
            }),
        ).toEqual({
            name: "Source Partner",
            code: "SUP-SOURCE-PARTNER",
        });
    });

    it("keeps the submitted product code in create payloads", () => {
        const payload = buildMasterCreatePayload("products", {
            code: "SKU-001",
            name: "RFID Scanner",
            uomId: "uom-1",
        });

        expect(payload).toEqual({
            code: "SKU-001",
            name: "RFID Scanner",
            uomId: "uom-1",
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

    it("converts isActive to a boolean", () => {
        expect(
            buildMasterCreatePayload("warehouses", {
                name: "Main Warehouse",
                isActive: "false",
            }),
        ).toEqual({
            name: "Main Warehouse",
            isActive: false,
            code: "WH-MAIN-WAREHOUSE",
        });
    });
});

describe("buildMasterUpdatePayload", () => {
    it("never regenerates or forwards a code for customers on update", () => {
        // Regression test: update used to alias buildMasterCreatePayload,
        // which invents a fresh `code` from `name` whenever `code` is empty —
        // and customers/suppliers never have a `code` form field, so every
        // edit silently overwrote the customer's real business code.
        const payload = buildMasterUpdatePayload("customers", {
            name: "Retail Partner Renamed",
            phone: "08123456789",
        });

        expect(payload).toEqual({
            name: "Retail Partner Renamed",
            phone: "08123456789",
        });
        expect(payload.code).toBeUndefined();
    });

    it("never regenerates or forwards a code for suppliers on update", () => {
        const payload = buildMasterUpdatePayload("suppliers", {
            name: "Source Partner Renamed",
        });

        expect(payload).toEqual({ name: "Source Partner Renamed" });
        expect(payload.code).toBeUndefined();
    });

    it("never forwards code for warehouses/locations on update either", () => {
        expect(
            buildMasterUpdatePayload("warehouses", {
                name: "Main Warehouse Renamed",
                code: "WH-SHOULD-NOT-BE-SENT",
            }),
        ).toEqual({ name: "Main Warehouse Renamed" });

        expect(
            buildMasterUpdatePayload("locations", {
                name: "Rack A Renamed",
                code: "LOC-SHOULD-NOT-BE-SENT",
            }),
        ).toEqual({ name: "Rack A Renamed" });
    });

    it("converts isActive to a boolean on update", () => {
        expect(
            buildMasterUpdatePayload("customers", {
                name: "Retail Partner",
                isActive: "false",
            }),
        ).toEqual({ name: "Retail Partner", isActive: false });
    });
});
