import type { ColumnDef } from "@/components/organisms/DataTable/types";
import type { StockLedgerItem } from "@/api/feature/dto/stock.dto";
import { formatDate } from "@/utils/date";

export type TrackingTableRow = Record<string, unknown> & {
    id: string;
    epc: string;
    timestamp: string;
    warehouse: string;
    location: string;
    event: string;
    document: string;
};

export const trackingColumns: ColumnDef<Record<string, unknown>>[] = [
    { key: "epc", header: "EPC" },
    { key: "timestamp", header: "Timestamp" },
    { key: "warehouse", header: "Warehouse" },
    { key: "location", header: "Location" },
    { key: "event", header: "Event" },
    { key: "document", header: "Document" },
];

const formatFallback = (value: unknown, fallback = "-") => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }
    return String(value);
};

export const toTrackingRows = (
    events: StockLedgerItem[],
    warehouseName: (id?: string) => string,
): TrackingTableRow[] =>
    events.map((event, index) => ({
        id: String(event.id ?? `${event.epc ?? event.productId ?? "event"}-${index}`),
        epc: formatFallback(event.epc ?? event.productId),
        timestamp: event.timestamp ? formatDate(event.timestamp) : "-",
        warehouse: formatFallback(warehouseName(event.warehouseId)),
        location: formatFallback(event.locationId),
        event: formatFallback(event.movementType, "Movement"),
        document: formatFallback(event.documentRef ?? event.docNumber),
    }));
