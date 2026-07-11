import type { MasterEntityKey } from "@/api/feature/dto/master.dto";

const numericKeys = new Set([
    "rowNo",
    "colNo",
    "qtyMin",
    "qtyMax",
    "conversionFactor",
]);

const buildCodeFromName = (prefix: string, name?: string) => {
    const slug = (name ?? "")
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 32);
    const suffix = slug || "AUTO";
    return `${prefix}-${suffix}`;
};

const parseAttributeItems = (raw?: string) => {
    if (!raw) return undefined;

    const items = raw
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);

    if (!items.length) return undefined;

    return items.map((value) => ({ value, label: value }));
};

const isFileValue = (value: unknown) =>
    typeof File !== "undefined" && value instanceof File;

export const buildMasterCreatePayload = (
    entity: MasterEntityKey,
    submittedData: Record<string, string | File | null>,
): Record<string, any> => {
    const payload: Record<string, any> = {};

    Object.entries(submittedData).forEach(([key, value]) => {
        if (isFileValue(value) || value === null || typeof value !== "string")
            return;
        const trimmed = value.trim();
        if (!trimmed) return;

        if (key.startsWith("attribute:")) return;
        if (key === "imageFile") return;

        if (
            entity === "attributes" &&
            key === "items" &&
            submittedData.type === "list"
        ) {
            const items = parseAttributeItems(trimmed);
            if (items) {
                payload.items = items;
            }
            return;
        }

        if (numericKeys.has(key)) {
            payload[key] = Number(trimmed);
            return;
        }

        payload[key] = trimmed;
    });

    if (entity === "warehouses" && !payload.code && payload.name) {
        payload.code = buildCodeFromName("WH", payload.name);
    }

    if (entity === "locations" && !payload.code && payload.name) {
        payload.code = buildCodeFromName("LOC", payload.name);
    }

    return payload;
};

export const buildMasterUpdatePayload = buildMasterCreatePayload;
