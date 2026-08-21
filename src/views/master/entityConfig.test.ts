import { describe, expect, it } from "vitest";
import {
    masterEntities,
    supportedMasterEntities,
} from "@/domain/master/entityConfig";

describe("master entity wiring", () => {
    it("enables attributes as a supported master entity", () => {
        expect(supportedMasterEntities.has("attributes")).toBe(true);
        expect(masterEntities.attributes?.supported).toBe(true);
    });

    it("shows the backend-aligned attribute fields", () => {
        expect(
            masterEntities.attributes?.formFields.map((field) => field.key),
        ).toEqual(["name", "type", "items"]);
    });

    it("keeps the requested master data fields on the key entities", () => {
        expect(
            masterEntities.warehouses?.formFields.some(
                (field) => field.key === "description",
            ),
        ).toBe(true);
        expect(
            masterEntities.warehouses?.formFields.some(
                (field) => field.key === "code",
            ),
        ).toBe(false);
        expect(
            masterEntities.locations?.formFields.map((field) => field.key),
        ).toEqual(["warehouseId", "name", "parentId"]);
        expect(
            masterEntities.customers?.formFields.some(
                (field) => field.key === "description",
            ),
        ).toBe(true);
        expect(
            masterEntities.suppliers?.formFields.some(
                (field) => field.key === "description",
            ),
        ).toBe(true);
        expect(
            masterEntities.products?.formFields.map((field) => field.key),
        ).toContain("imageFile");
    });

    it("does not fall back to raw ids for relation labels", () => {
        const productUomLabel = masterEntities.products?.columns
            .find((column) => column.key === "uom")
            ?.accessor?.({ uomId: "uom-123" } as never);
        const locationWarehouseLabel = masterEntities.locations?.columns
            .find((column) => column.key === "warehouseId")
            ?.accessor?.({ warehouseId: "wh-123" } as never);

        expect(productUomLabel).toBe("");
        expect(locationWarehouseLabel).toBe("");
    });

    it("renders product UOM breakdown as UOM and never exposes ids", () => {
        const productColumns = masterEntities.products?.columns ?? [];
        const uomBreakdownColumn = productColumns.find(
            (column) => column.key === "uomBreakdown",
        );

        expect(uomBreakdownColumn?.label).toBe("UOM");
        expect(
            uomBreakdownColumn?.accessor?.({
                uomId: "uom-123",
                unitType: "",
                unitName: "",
                conversionFactor: undefined,
            } as never),
        ).toBe("");
    });
});
