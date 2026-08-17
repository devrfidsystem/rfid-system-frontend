import type { AttributeType } from "@/api/feature/dto/master.dto";
import type { MasterFormField } from "@/domain/master/entityConfig";
import type { MasterRecord } from "@/domain/master/types";
import type { MasterSubmittedData } from "./masterFormTypes";

export type ProductAttributeDefinition = {
    id: string;
    name: string;
    type: AttributeType;
    items?: Array<{ id: string; value: string; label: string }>;
};

export type ProductAttributePayloadValue = {
    attributeId: string;
    attributeItemId?: string;
    valueText?: string;
    valueNumber?: number;
    valueDate?: string;
};

export const makeProductAttributeFields = (
    attributes: ProductAttributeDefinition[],
): MasterFormField[] =>
    attributes.map((attribute) => ({
        key: `attribute:${attribute.id}`,
        label: attribute.name,
        type:
            attribute.type === "number"
                ? "number"
                : attribute.type === "date"
                  ? "date"
                  : attribute.type === "list"
                    ? "select"
                    : "text",
        options:
            attribute.type === "list"
                ? (attribute.items ?? []).map((item) => ({
                      label: item.label || item.value,
                      value: item.id,
                  }))
                : undefined,
        placeholder:
            attribute.type === "list"
                ? `Select ${attribute.name}`
                : `Enter ${attribute.name}`,
    }));

export const buildProductAttributeValues = (
    definitions: ProductAttributeDefinition[],
    submittedData: MasterSubmittedData,
): ProductAttributePayloadValue[] => {
    const values: ProductAttributePayloadValue[] = [];

    definitions.forEach((attribute) => {
        const rawValue = submittedData[`attribute:${attribute.id}`];
        if (typeof rawValue !== "string") return;
        const trimmed = rawValue.trim();
        if (!trimmed) return;

        if (attribute.type === "number") {
            const numericValue = Number(trimmed);
            if (Number.isNaN(numericValue)) return;
            values.push({
                attributeId: attribute.id,
                valueNumber: numericValue,
            });
            return;
        }

        if (attribute.type === "date") {
            values.push({
                attributeId: attribute.id,
                valueDate: trimmed,
            });
            return;
        }

        if (attribute.type === "list") {
            values.push({
                attributeId: attribute.id,
                attributeItemId: trimmed,
            });
            return;
        }

        values.push({
            attributeId: attribute.id,
            valueText: trimmed,
        });
    });

    return values;
};

export const syncProductAttributeValues = (
    row: MasterRecord,
    formState: Record<string, string | File | null>,
) => {
    (row.attributeValues ?? []).forEach((attributeValue) => {
        const key = `attribute:${attributeValue.attributeId}`;
        if (attributeValue.attribute?.type === "number") {
            formState[key] =
                attributeValue.valueNumber !== undefined &&
                attributeValue.valueNumber !== null
                    ? String(attributeValue.valueNumber)
                    : "";
            return;
        }
        if (attributeValue.attribute?.type === "date") {
            formState[key] = attributeValue.valueDate ?? "";
            return;
        }
        if (attributeValue.attribute?.type === "list") {
            formState[key] = attributeValue.attributeItemId ?? "";
            return;
        }
        formState[key] = attributeValue.valueText ?? attributeValue.value ?? "";
    });
};
