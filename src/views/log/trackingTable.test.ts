import { describe, expect, it } from "vitest";
import { trackingColumns, toTrackingRows } from "./trackingTable";
import type { StockLedgerItem } from "@/api/feature/dto/stock.dto";

describe("trackingTable", () => {
    it("maps ledger events into table rows with stable fallbacks", () => {
        const rows = toTrackingRows(
            [
                {
                    id: "evt-1",
                    epc: "EPC-001",
                    timestamp: "2026-08-09T03:15:00.000Z",
                    warehouseId: "wh-1",
                    locationId: "loc-1",
                    docNumber: "DOC-1",
                } as StockLedgerItem,
                {
                    id: "evt-2",
                    productId: "prod-2",
                    warehouseId: "wh-2",
                    movementType: "Transfer",
                    documentRef: "REF-2",
                } as StockLedgerItem,
            ],
            (warehouseId?: string) =>
                warehouseId === "wh-1" ? "Main Warehouse" : (warehouseId ?? ""),
        );

        expect(trackingColumns.map((column) => column.key)).toEqual([
            "epc",
            "timestamp",
            "warehouse",
            "location",
            "event",
            "document",
        ]);
        expect(rows[0]).toMatchObject({
            id: "evt-1",
            epc: "EPC-001",
            warehouse: "Main Warehouse",
            location: "loc-1",
            event: "Movement",
            document: "DOC-1",
        });
        expect(rows[0].timestamp).toContain("2026");
        expect(rows[1]).toMatchObject({
            id: "evt-2",
            epc: "prod-2",
            warehouse: "wh-2",
            location: "-",
            event: "Transfer",
            document: "REF-2",
        });
    });
});
