import type { MasterEntityKey } from "@/api/feature/dto/master.dto";

type MasterPayloadInputValue = string | File | null;
type AttributeListItem = { value: string; label: string };
export type MasterPayloadValue =
    string | number | boolean | AttributeListItem[];
export type MasterPayload = Record<string, MasterPayloadValue>;

const numericKeys = new Set([
    "rowNo",
    "colNo",
    "qtyMin",
    "qtyMax",
    "conversionFactor",
]);

const booleanKeys = new Set(["isActive"]);

const buildCodeFromName = (prefix: string, name?: string) => {
    const slug = (name ?? "")
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 32);
    const suffix = slug || "AUTO";
    return `${prefix}-${suffix}`;
};

const parseAttributeItems = (raw?: string): AttributeListItem[] | undefined => {
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

/**
 * Shared field extraction for both create and update payloads. `code` is
 * deliberately excluded here — it is either generated once at creation time
 * (see buildMasterCreatePayload) or assigned by the backend, and the form
 * always disables the `code` input while editing, so it must never be
 * re-derived or forwarded on update.
 */
const extractMasterFields = (
    entity: MasterEntityKey,
    submittedData: Record<string, MasterPayloadInputValue>,
    options: { includeCode?: boolean } = {},
): MasterPayload => {
    const payload: MasterPayload = {};

    Object.entries(submittedData).forEach(([key, value]) => {
        if (isFileValue(value) || value === null || typeof value !== "string")
            return;
        const trimmed = value.trim();
        if (!trimmed) return;

        if (key.startsWith("attribute:")) return;
        if (key === "imageFile") return;
        if (key === "code" && !options.includeCode) return;

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

        if (booleanKeys.has(key)) {
            payload[key] = trimmed === "true";
            return;
        }

        if (numericKeys.has(key)) {
            payload[key] = Number(trimmed);
            return;
        }

        payload[key] = trimmed;
    });

    return payload;
};

export const buildMasterCreatePayload = (
    entity: MasterEntityKey,
    submittedData: Record<string, MasterPayloadInputValue>,
): MasterPayload => {
    const payload = extractMasterFields(entity, submittedData, {
        includeCode: entity === "products",
    });

    if (entity === "warehouses" && typeof payload.name === "string") {
        payload.code = buildCodeFromName("WH", payload.name);
    }

    if (entity === "locations" && typeof payload.name === "string") {
        payload.code = buildCodeFromName("LOC", payload.name);
    }

    if (entity === "customers" && typeof payload.name === "string") {
        payload.code = buildCodeFromName("CUST", payload.name);
    }

    if (entity === "suppliers" && typeof payload.name === "string") {
        payload.code = buildCodeFromName("SUP", payload.name);
    }

    return payload;
};

export const buildMasterUpdatePayload = (
    entity: MasterEntityKey,
    submittedData: Record<string, MasterPayloadInputValue>,
): MasterPayload => extractMasterFields(entity, submittedData);
