import { reactive, ref } from "vue";
import { describe, expect, it } from "vitest";
import { useTransactionSummary } from "./useTransactionSummary";
import type { TransactionRecord } from "../types";

describe("useTransactionSummary", () => {
    it("passes through the paginated total as totalCount", () => {
        const rows = ref<TransactionRecord[]>([]);
        const pagination = reactive({ total: 42 });

        const { totalCount } = useTransactionSummary(rows, pagination);

        expect(totalCount.value).toBe(42);
    });

    it("groups currently-loaded rows by status, excluding rows without a status", () => {
        const rows = ref<TransactionRecord[]>([
            { id: "1", status: "posted" },
            { id: "2", status: "posted" },
            { id: "3", status: "draft" },
            { id: "4" },
        ]);
        const pagination = reactive({ total: 4 });

        const { statusBreakdown } = useTransactionSummary(rows, pagination);

        expect(statusBreakdown.value).toEqual([
            { label: "posted", count: 2 },
            { label: "draft", count: 1 },
        ]);
    });

    it("derives the earliest and latest date among currently-loaded rows", () => {
        const rows = ref<TransactionRecord[]>([
            { id: "1", date: "2026-07-10T00:00:00.000Z" },
            { id: "2", date: "2026-07-20T00:00:00.000Z" },
            { id: "3", date: "2026-07-05T00:00:00.000Z" },
        ]);
        const pagination = reactive({ total: 3 });

        const { dateRange } = useTransactionSummary(rows, pagination);

        expect(dateRange.value.earliest).toBe("2026-07-05T00:00:00.000Z");
        expect(dateRange.value.latest).toBe("2026-07-20T00:00:00.000Z");
    });

    it("falls back to createdAt when date is missing, and ignores unparseable values", () => {
        const rows = ref<TransactionRecord[]>([
            { id: "1", createdAt: "2026-07-15T00:00:00.000Z" },
            { id: "2", date: "not-a-date" },
        ]);
        const pagination = reactive({ total: 2 });

        const { dateRange } = useTransactionSummary(rows, pagination);

        expect(dateRange.value.earliest).toBe("2026-07-15T00:00:00.000Z");
        expect(dateRange.value.latest).toBe("2026-07-15T00:00:00.000Z");
    });

    it("returns a null date range when no row has a parseable date", () => {
        const rows = ref<TransactionRecord[]>([{ id: "1" }]);
        const pagination = reactive({ total: 1 });

        const { dateRange } = useTransactionSummary(rows, pagination);

        expect(dateRange.value).toEqual({ earliest: null, latest: null });
    });

    it("recomputes when rows change", () => {
        const rows = ref<TransactionRecord[]>([{ id: "1", status: "draft" }]);
        const pagination = reactive({ total: 1 });

        const { statusBreakdown } = useTransactionSummary(rows, pagination);
        expect(statusBreakdown.value).toEqual([{ label: "draft", count: 1 }]);

        rows.value = [
            { id: "1", status: "draft" },
            { id: "2", status: "posted" },
        ];

        expect(statusBreakdown.value).toEqual([
            { label: "draft", count: 1 },
            { label: "posted", count: 1 },
        ]);
    });
});
