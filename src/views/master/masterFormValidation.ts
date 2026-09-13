import type { MasterFormField } from "@/domain/master/entityConfig";

type FormValue = string | File | null;

const isFileValue = (value: unknown) =>
    typeof File !== "undefined" && value instanceof File;

export const validateMasterField = (
    field: MasterFormField,
    rawValue: FormValue,
): string | undefined => {
    if (field.type === "file") {
        if (field.required && !isFileValue(rawValue)) {
            return `${field.label} is required.`;
        }
        return undefined;
    }

    const value = typeof rawValue === "string" ? rawValue.trim() : "";

    if (field.required && !value) {
        return `${field.label} is required.`;
    }

    if (field.type === "number" && value) {
        const numericValue = Number(value);
        if (Number.isNaN(numericValue)) {
            return `${field.label} must be a number.`;
        }
        if (numericValue < 0) {
            return `${field.label} cannot be negative.`;
        }
    }

    return undefined;
};

export const validateMasterForm = (
    fields: MasterFormField[],
    values: Record<string, FormValue>,
    isFieldDisabled: (field: MasterFormField) => boolean,
): Record<string, string> => {
    const errors: Record<string, string> = {};
    fields.forEach((field) => {
        if (isFieldDisabled(field)) return;
        const message = validateMasterField(field, values[field.key] ?? "");
        if (message) errors[field.key] = message;
    });
    return errors;
};
