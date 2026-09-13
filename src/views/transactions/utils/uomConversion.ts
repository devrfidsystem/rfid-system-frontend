export type UomQtyTier = "base" | "breakdown";

/**
 * Converts a quantity between a product's base UOM and its breakdown unit.
 *
 * Conversion semantics: 1 breakdown unit = `conversionFactor` base UOM units
 * (e.g. unitName="Box", conversionFactor=12 -> 1 Box = 12 Pcs).
 *
 * @param qty The quantity expressed in `fromTier`.
 * @param fromTier Which tier `qty` is expressed in ("base" or "breakdown").
 * @param conversionFactor The product's `conversionFactor` (1 breakdown unit
 * = conversionFactor base units). Must be a positive finite number or the
 * result is 0.
 * @returns The equivalent quantity in the other tier, or 0 if `qty` or
 * `conversionFactor` is not a positive/finite usable number.
 */
export function convertUomQty(
    qty: number,
    fromTier: UomQtyTier,
    conversionFactor: number,
): number {
    if (
        !Number.isFinite(qty) ||
        !Number.isFinite(conversionFactor) ||
        conversionFactor <= 0
    ) {
        return 0;
    }

    if (fromTier === "breakdown") {
        return qty * conversionFactor;
    }

    return qty / conversionFactor;
}
