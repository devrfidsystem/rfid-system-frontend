import { describe, expect, it, vi } from "vitest";

const getSpy = vi.hoisted(() => vi.fn());
const postSpy = vi.hoisted(() => vi.fn());

vi.mock("@/api/feature/transactions.api", () => ({
    transactionsApi: {
        list: vi.fn(),
        get: getSpy,
        create: vi.fn(),
        post: postSpy,
        cancel: vi.fn(),
    },
}));

describe("transactions.service", () => {
    it("normalizes relocation detail data from the api", async () => {
        getSpy.mockResolvedValue({
            data: {
                id: "rel-1",
                relocation_no: "REL-001",
                relocation_date: "2026-07-18T00:00:00.000Z",
                status: "draft",
                origin_location_id: "loc-a",
                destination_location_id: "loc-b",
                lines: [
                    {
                        id: "line-1",
                        productId: "prod-1",
                        qty: 5,
                        fromLocationId: "loc-a",
                        toLocationId: "loc-b",
                    },
                ],
            },
        });

        const { transactionService, normalizeTransactionRecord } =
            await import("./transactions.service");

        const normalized = normalizeTransactionRecord({
            id: "rel-1",
            relocation_no: "REL-001",
            relocation_date: "2026-07-18T00:00:00.000Z",
            origin_location_id: "loc-a",
            destination_location_id: "loc-b",
        });

        expect(normalized.docNo).toBe("REL-001");
        expect(normalized.date).toBe("2026-07-18T00:00:00.000Z");
        expect(normalized.sourceLocationId).toBe("loc-a");
        expect(normalized.destinationLocationId).toBe("loc-b");

        const detail = await transactionService.get("relocation", "rel-1");

        expect(getSpy).toHaveBeenCalledWith("relocation", "rel-1");
        expect(detail.docNo).toBe("REL-001");
        expect(detail.date).toBe("2026-07-18T00:00:00.000Z");
        expect(detail.sourceLocationId).toBe("loc-a");
        expect(detail.destinationLocationId).toBe("loc-b");
        expect(Array.isArray(detail.lines)).toBe(true);
        expect(
            (detail.lines as unknown as Array<Record<string, unknown>>)[0],
        ).toMatchObject({
            fromLocationId: "loc-a",
            toLocationId: "loc-b",
        });
    });

    it("passes optional EPC scan payloads through post calls", async () => {
        const { transactionService } = await import("./transactions.service");
        const payload = {
            lines: [{ lineNo: 1, epcCodes: ["A001", "A002"] }],
        };

        await transactionService.post("outbound", "doc-1", payload);

        expect(postSpy).toHaveBeenCalledWith("outbound", "doc-1", payload);
    });
});
