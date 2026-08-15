import type { ProductRecord } from "@/model/entities";

type ProductAttributeValue = NonNullable<
    ProductRecord["attributeValues"]
>[number];

const resolveDisplayValue = (
    attributeValue: ProductAttributeValue,
): string | null => {
    const type = attributeValue.attribute?.type;

    if (type === "number") {
        return attributeValue.valueNumber !== null &&
            attributeValue.valueNumber !== undefined
            ? String(attributeValue.valueNumber)
            : null;
    }

    if (type === "date") {
        return attributeValue.valueDate ?? null;
    }

    if (type === "list") {
        return attributeValue.attribute_items?.label ?? null;
    }

    return attributeValue.valueText ?? attributeValue.value ?? null;
};

/** Formats a product's attribute values as "Name: Value" pairs for inline display. */
export function formatProductAttributeSummary(
    attributeValues: ProductRecord["attributeValues"],
): string {
    if (!Array.isArray(attributeValues) || attributeValues.length === 0) {
        return "";
    }

    return attributeValues
        .map((attributeValue) => {
            const label = attributeValue.attribute?.name;
            const value = resolveDisplayValue(attributeValue);
            if (!label || !value) return null;
            return `${label}: ${value}`;
        })
        .filter((entry): entry is string => Boolean(entry))
        .join(", ");
}
