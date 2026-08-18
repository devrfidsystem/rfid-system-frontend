import type { RfidTag, RfidTagStatus } from "@/api/feature/dto/rfid.dto";
import type { ColumnDef } from "@/components/organisms/DataTable/types";

export type RfidBadgeTone =
    | "neutral"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "purple"
    | "teal";

export type RfidTagTableRow = Record<string, unknown> & {
    id: string;
    epcCode: string;
    product: string;
    location: string;
    status: RfidTagStatus;
    registeredBy: string;
};

export const rfidTagColumns: ColumnDef<Record<string, unknown>>[] = [
    { key: "epcCode", header: "EPC" },
    { key: "product", header: "Product" },
    { key: "location", header: "Location" },
    { key: "status", header: "Status" },
    { key: "registeredBy", header: "Registered By" },
];

export const formatRfidProduct = (tag: RfidTag) => {
    if (tag.productCode && tag.productName) {
        return `${tag.productCode} - ${tag.productName}`;
    }
    return tag.productName || tag.productId || "-";
};

export const formatRfidLocation = (tag: RfidTag) => {
    if (tag.locationCode && tag.locationName) {
        return `${tag.locationCode} - ${tag.locationName}`;
    }
    return tag.locationName || tag.locationCode || tag.locationId || "-";
};

export const formatRfidStatus = (status?: string | null) => {
    if (!status) return "-";
    return status
        .split(/[_-]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
};

export const getRfidStatusTone = (
    status?: RfidTagStatus | string | null,
): RfidBadgeTone => {
    switch (status) {
        case "available":
            return "success";
        case "encoded":
            return "info";
        case "assigned":
        case "in_use":
            return "teal";
        case "in_stock":
        case "returned":
            return "success";
        case "out_stock":
            return "info";
        case "damaged":
            return "error";
        case "quarantined":
            return "warning";
        case "retired":
            return "neutral";
        default:
            return "neutral";
    }
};

export const toRfidTagRows = (tags: RfidTag[]): RfidTagTableRow[] =>
    tags.map((tag) => ({
        id: tag.id,
        epcCode: tag.epcCode,
        product: formatRfidProduct(tag),
        location: formatRfidLocation(tag),
        status: tag.status,
        registeredBy: tag.userName || "-",
    }));
