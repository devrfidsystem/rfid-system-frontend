import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import OpnameSummaryWidget from "./OpnameSummaryWidget.vue";
import { formatDate } from "@/utils/date";

const emptySummary = {
    totalCount: 0,
    statusBreakdown: [],
    varianceTaskCount: 0,
    needsAttention: { count: 0, canceledCount: 0, stuckCountingCount: 0 },
    mostRecent: null,
};

describe("OpnameSummaryWidget", () => {
    it("renders 5 skeleton blocks while loading", async () => {
        const app = createSSRApp(OpnameSummaryWidget, {
            loading: true,
            error: null,
            summary: null,
        });
        const html = await renderToString(app);
        expect(html.match(/animate-pulse/g) ?? []).toHaveLength(5);
    });

    it("renders an inline error message when the summary fetch failed", async () => {
        const app = createSSRApp(OpnameSummaryWidget, {
            loading: false,
            error: "Failed to load opname summary.",
            summary: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("Failed to load opname summary.");
    });

    it("renders an empty-state message when there are no matching task nodes", async () => {
        const app = createSSRApp(OpnameSummaryWidget, {
            loading: false,
            error: null,
            summary: emptySummary,
        });
        const html = await renderToString(app);
        expect(html).toContain("No opname tasks match this warehouse.");
    });

    it("renders total, status breakdown, variance, most recent, and a clear needs-attention state", async () => {
        const app = createSSRApp(OpnameSummaryWidget, {
            loading: false,
            error: null,
            summary: {
                totalCount: 6,
                statusBreakdown: [
                    { status: "counting", count: 2, percentage: 33.3 },
                    { status: "closed", count: 4, percentage: 66.7 },
                ],
                varianceTaskCount: 2,
                needsAttention: {
                    count: 0,
                    canceledCount: 0,
                    stuckCountingCount: 0,
                },
                mostRecent: {
                    title: "Stock Opname Q3 - Task 4",
                    createdByName: "Jane Doe",
                    createdAt: "2026-08-01T12:00:00.000Z",
                },
            },
        });
        const html = await renderToString(app);

        expect(html).toContain("6");
        expect(html).toContain("counting 2 (33.3%)");
        expect(html).toContain("closed 4 (66.7%)");
        expect(html).toContain("2");
        expect(html).toContain("Stock Opname Q3 - Task 4");
        expect(html).toContain("Jane Doe");
        expect(html).toContain(formatDate("2026-08-01T12:00:00.000Z"));
        expect(html).toContain("All clear");
        expect(html).toContain("wdg_OpnameSummary");
    });

    it("highlights a non-zero needs-attention count with its breakdown", async () => {
        const app = createSSRApp(OpnameSummaryWidget, {
            loading: false,
            error: null,
            summary: {
                totalCount: 4,
                statusBreakdown: [
                    { status: "canceled", count: 1, percentage: 25 },
                ],
                varianceTaskCount: 0,
                needsAttention: {
                    count: 3,
                    canceledCount: 1,
                    stuckCountingCount: 2,
                },
                mostRecent: null,
            },
        });
        const html = await renderToString(app);

        expect(html).toContain("No tasks yet.");
        expect(html).toContain("1 cancelled");
        expect(html).toContain("2 stuck counting &gt;3 days");
        expect(html).toContain("text-danger-600");
    });
});
