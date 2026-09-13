import { describe, expect, it } from "vitest";
import { formatProductAttributeSummary } from "./productAttributes";

describe("formatProductAttributeSummary", () => {
    it("returns an empty string when there are no attribute values", () => {
        expect(formatProductAttributeSummary(undefined)).toBe("");
        expect(formatProductAttributeSummary([])).toBe("");
    });

    it("formats a text attribute as 'Name: Value'", () => {
        const summary = formatProductAttributeSummary([
            {
                attributeId: "attr-1",
                valueText: "Red",
                attribute: { id: "attr-1", name: "Color", type: "text" },
            },
        ]);
        expect(summary).toBe("Color: Red");
    });

    it("formats a number attribute using valueNumber", () => {
        const summary = formatProductAttributeSummary([
            {
                attributeId: "attr-1",
                valueNumber: 42,
                attribute: { id: "attr-1", name: "Weight", type: "number" },
            },
        ]);
        expect(summary).toBe("Weight: 42");
    });

    it("formats a date attribute using valueDate", () => {
        const summary = formatProductAttributeSummary([
            {
                attributeId: "attr-1",
                valueDate: "2026-01-15",
                attribute: { id: "attr-1", name: "Expiry", type: "date" },
            },
        ]);
        expect(summary).toBe("Expiry: 2026-01-15");
    });

    it("formats a list attribute using the resolved attribute_items label", () => {
        const summary = formatProductAttributeSummary([
            {
                attributeId: "attr-1",
                attributeItemId: "item-1",
                attribute: { id: "attr-1", name: "Size", type: "list" },
                attribute_items: { id: "item-1", value: "xl", label: "XL" },
            },
        ]);
        expect(summary).toBe("Size: XL");
    });

    it("joins multiple attribute values with a comma", () => {
        const summary = formatProductAttributeSummary([
            {
                attributeId: "attr-1",
                valueText: "Red",
                attribute: { id: "attr-1", name: "Color", type: "text" },
            },
            {
                attributeId: "attr-2",
                attributeItemId: "item-1",
                attribute: { id: "attr-2", name: "Size", type: "list" },
                attribute_items: { id: "item-1", value: "xl", label: "XL" },
            },
        ]);
        expect(summary).toBe("Color: Red, Size: XL");
    });

    it("skips entries missing a resolvable value", () => {
        const summary = formatProductAttributeSummary([
            {
                attributeId: "attr-1",
                attribute: { id: "attr-1", name: "Color", type: "text" },
            },
            {
                attributeId: "attr-2",
                valueText: "Steel",
                attribute: { id: "attr-2", name: "Material", type: "text" },
            },
        ]);
        expect(summary).toBe("Material: Steel");
    });
});
