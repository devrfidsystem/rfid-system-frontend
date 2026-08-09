import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import TransactionSummaryWidget from "./TransactionSummaryWidget.vue";
import { formatDate } from "@/utils/date";

const emptySummary = {
    totalCount: 0,
    statusBreakdown: [],
    mostRecent: null,
    needsAttention: { count: 0, canceledCount: 0, staleDraftCount: 0 },
};

describe("TransactionSummaryWidget", () => {
    it("uses a single-row four-column layout on large screens", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: false,
            error: "Failed to load transaction summary.",
            summary: null,
        });
        const html = await renderToString(app);

        expect(html).toContain("sm:grid-cols-2 lg:grid-cols-4");
        expect(html).toContain("sm:col-span-2 lg:col-span-4");
    });

    it("renders 4 skeleton blocks while loading", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: true,
            error: null,
            summary: null,
        });
        const html = await renderToString(app);
        expect(html.match(/animate-pulse/g) ?? []).toHaveLength(4);
    });

    it("renders an inline error message when the summary fetch failed", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: false,
            error: "Failed to load transaction summary.",
            summary: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("Failed to load transaction summary.");
    });

    it("renders an empty-state message when there are no matching transactions", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: false,
            error: null,
            summary: emptySummary,
        });
        const html = await renderToString(app);
        expect(html).toContain("No transactions match the current filters.");
    });

    it("renders total, percentage-annotated status breakdown, most recent, and a clear needs-attention state", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: false,
            error: null,
            summary: {
                totalCount: 57,
                statusBreakdown: [
                    { status: "posted", count: 40, percentage: 70.2 },
                    { status: "draft", count: 17, percentage: 29.8 },
                ],
                mostRecent: {
                    docNo: "IN-057",
                    createdByName: "Jane Doe",
                    createdAt: "2026-08-01T12:00:00.000Z",
                },
                needsAttention: {
                    count: 0,
                    canceledCount: 0,
                    staleDraftCount: 0,
                },
            },
        });
        const html = await renderToString(app);

        expect(html).toContain("57");
        expect(html).toContain("posted 40 (70.2%)");
        expect(html).toContain("draft 17 (29.8%)");
        expect(html).toContain("IN-057");
        expect(html).toContain("Jane Doe");
        expect(html).toContain(formatDate("2026-08-01T12:00:00.000Z"));
        expect(html).toContain("All clear");
        expect(html).toContain("wdg_TransactionSummary");
    });

    it("highlights a non-zero needs-attention count with its breakdown", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: false,
            error: null,
            summary: {
                totalCount: 10,
                statusBreakdown: [
                    { status: "canceled", count: 3, percentage: 30 },
                ],
                mostRecent: null,
                needsAttention: {
                    count: 5,
                    canceledCount: 3,
                    staleDraftCount: 2,
                },
            },
        });
        const html = await renderToString(app);

        expect(html).toContain("No transactions yet.");
        expect(html).toContain("3 cancelled");
        expect(html).toContain("2 pending &gt;3 days");
        expect(html).toContain("text-danger-600");
    });

    it("uses the shared transaction status colors for status breakdown labels", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: false,
            error: null,
            summary: {
                totalCount: 3,
                statusBreakdown: [
                    { status: "posted", count: 1, percentage: 33.3 },
                    { status: "done", count: 1, percentage: 33.3 },
                    { status: "partial", count: 1, percentage: 33.3 },
                ],
                mostRecent: null,
                needsAttention: {
                    count: 0,
                    canceledCount: 0,
                    staleDraftCount: 0,
                },
            },
        });
        const html = await renderToString(app);

        expect(html).toContain("posted 1 (33.3%)");
        expect(html).toContain("done 1 (33.3%)");
        expect(html).toContain("partial 1 (33.3%)");
        expect(html).toContain("text-info-600");
        expect(html).toContain("text-success-600");
    });
});
