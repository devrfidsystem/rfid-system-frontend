import { describe, expect, it } from "vitest";
import {
    formatRfidLocation,
    formatRfidStatus,
    getRfidStatusTone,
    rfidTagColumns,
    toRfidTagRows,
} from "./rfidTagTable";
import type { RfidTag } from "@/api/feature/dto/rfid.dto";

describe("rfidTagTable", () => {
    it("maps RFID tags into table rows with product and status fallbacks", () => {
        const rows = toRfidTagRows([
            {
                id: "tag-1",
                epcCode: "EPC-001",
                status: "available",
                productId: "prod-1",
                productCode: "SKU-1",
                productName: "Product One",
                locationId: "Rack A",
                companyId: "company-1",
                createdAt: "2026-08-09T00:00:00.000Z",
                updatedAt: "2026-08-09T00:00:00.000Z",
                userName: "Adit",
            },
            {
                id: "tag-2",
                epcCode: "EPC-002",
                status: "in_use",
                productId: "prod-2",
                companyId: "company-1",
                createdAt: "2026-08-09T00:00:00.000Z",
                updatedAt: "2026-08-09T00:00:00.000Z",
            },
        ] as RfidTag[]);

        expect(rfidTagColumns.map((column) => column.key)).toEqual([
            "epcCode",
            "product",
            "location",
            "status",
            "registeredBy",
        ]);
        expect(rows[0]).toMatchObject({
            id: "tag-1",
            epcCode: "EPC-001",
            product: "SKU-1 - Product One",
            location: "Rack A",
            status: "available",
            registeredBy: "Adit",
        });
        expect(rows[1]).toMatchObject({
            product: "prod-2",
            location: "-",
            registeredBy: "-",
        });
    });

    it("formats RFID statuses and returns enterprise badge tones", () => {
        expect(formatRfidStatus("in_use")).toBe("In Use");
        expect(formatRfidStatus("quarantined")).toBe("Quarantined");
        expect(getRfidStatusTone("available")).toBe("success");
        expect(getRfidStatusTone("encoded")).toBe("info");
        expect(getRfidStatusTone("assigned")).toBe("teal");
        expect(formatRfidStatus("out_stock")).toBe("Out Stock");
        expect(getRfidStatusTone("in_stock")).toBe("success");
        expect(getRfidStatusTone("out_stock")).toBe("info");
        expect(getRfidStatusTone("damaged")).toBe("error");
        expect(getRfidStatusTone("quarantined")).toBe("warning");
        expect(getRfidStatusTone("retired")).toBe("neutral");
    });

    it("prefers readable location labels over raw location ids", () => {
        expect(
            formatRfidLocation({
                id: "tag-1",
                epcCode: "EPC-001",
                status: "assigned",
                productId: "prod-1",
                companyId: "company-1",
                locationId: "loc-uuid",
                locationCode: "R-A",
                locationName: "Rack A",
                createdAt: "2026-08-09T00:00:00.000Z",
                updatedAt: "2026-08-09T00:00:00.000Z",
            }),
        ).toBe("R-A - Rack A");
    });
});
