import { describe, expect, it } from "vitest";
import {
    validateMasterField,
    validateMasterForm,
} from "./masterFormValidation";
import type { MasterFormField } from "@/domain/master/entityConfig";

describe("validateMasterField", () => {
    it("flags a required text field left empty", () => {
        const field: MasterFormField = {
            key: "name",
            label: "Name",
            required: true,
        };
        expect(validateMasterField(field, "")).toBe("Name is required.");
        expect(validateMasterField(field, "   ")).toBe("Name is required.");
        expect(validateMasterField(field, "Main Warehouse")).toBeUndefined();
    });

    it("does not require an optional field", () => {
        const field: MasterFormField = { key: "address", label: "Address" };
        expect(validateMasterField(field, "")).toBeUndefined();
    });

    it("rejects a non-numeric value for a number field", () => {
        const field: MasterFormField = {
            key: "qtyMin",
            label: "Safety Stock",
            type: "number",
        };
        expect(validateMasterField(field, "abc")).toBe(
            "Safety Stock must be a number.",
        );
    });

    it("rejects a negative value for a number field", () => {
        const field: MasterFormField = {
            key: "conversionFactor",
            label: "Conversion Factor",
            type: "number",
        };
        expect(validateMasterField(field, "-5")).toBe(
            "Conversion Factor cannot be negative.",
        );
    });

    it("accepts a valid non-negative number", () => {
        const field: MasterFormField = {
            key: "qtyMax",
            label: "Maximum Stock",
            type: "number",
        };
        expect(validateMasterField(field, "100")).toBeUndefined();
    });

    it("requires a file for a required file field", () => {
        const field: MasterFormField = {
            key: "imageFile",
            label: "Product Image",
            type: "file",
            required: true,
        };
        expect(validateMasterField(field, null)).toBe(
            "Product Image is required.",
        );
        const file = new File(["data"], "image.png", { type: "image/png" });
        expect(validateMasterField(field, file)).toBeUndefined();
    });
});

describe("validateMasterForm", () => {
    it("collects errors keyed by field, skipping disabled fields", () => {
        const fields: MasterFormField[] = [
            { key: "code", label: "Code", required: true },
            { key: "name", label: "Name", required: true },
        ];
        const errors = validateMasterForm(
            fields,
            { code: "", name: "" },
            (field) => field.key === "code",
        );

        expect(errors).toEqual({ name: "Name is required." });
    });

    it("returns no errors when every required field is filled", () => {
        const fields: MasterFormField[] = [
            { key: "name", label: "Name", required: true },
        ];
        const errors = validateMasterForm(
            fields,
            { name: "Main Warehouse" },
            () => false,
        );

        expect(errors).toEqual({});
    });
});
