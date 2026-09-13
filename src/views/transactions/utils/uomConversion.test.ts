import { describe, expect, it } from "vitest";
import { convertUomQty } from "./uomConversion";

describe("convertUomQty", () => {
    it("converts a breakdown-unit qty into base UOM qty", () => {
        expect(convertUomQty(2, "breakdown", 12)).toBe(24);
    });

    it("converts a base UOM qty into breakdown-unit qty", () => {
        expect(convertUomQty(24, "base", 12)).toBe(2);
    });

    it("handles fractional base-to-breakdown conversions", () => {
        expect(convertUomQty(18, "base", 12)).toBe(1.5);
    });

    it("returns 0 when conversionFactor is zero", () => {
        expect(convertUomQty(24, "base", 0)).toBe(0);
    });

    it("returns 0 when conversionFactor is negative", () => {
        expect(convertUomQty(24, "base", -12)).toBe(0);
    });

    it("returns 0 when qty is not a finite number", () => {
        expect(convertUomQty(Number.NaN, "base", 12)).toBe(0);
    });

    it("returns 0 when conversionFactor is not a finite number", () => {
        expect(convertUomQty(24, "base", Number.NaN)).toBe(0);
    });
});
