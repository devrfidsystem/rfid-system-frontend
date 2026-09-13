import { describe, expect, it } from "vitest";
import { buildDefaultDocumentNumber } from "./documentNumber";

describe("buildDefaultDocumentNumber", () => {
    it("formats outbound document numbers as OUT-YYMMDD-001", () => {
        expect(
            buildDefaultDocumentNumber(
                "outbound",
                new Date("2025-08-26T00:00:00.000Z"),
            ),
        ).toBe("OUT-250826-001");
    });

    it("uses the transaction-specific prefix for supported transaction keys", () => {
        const date = new Date("2026-07-18T00:00:00.000Z");

        expect(buildDefaultDocumentNumber("register", date)).toBe(
            "REG-260718-001",
        );
        expect(buildDefaultDocumentNumber("inbound", date)).toBe(
            "INB-260718-001",
        );
        expect(buildDefaultDocumentNumber("putaway", date)).toBe(
            "PUT-260718-001",
        );
        expect(buildDefaultDocumentNumber("relocation", date)).toBe(
            "REL-260718-001",
        );
    });
});
