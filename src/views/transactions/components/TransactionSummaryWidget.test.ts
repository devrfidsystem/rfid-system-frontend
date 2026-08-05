import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import TransactionSummaryWidget from "./TransactionSummaryWidget.vue";
import { formatDate } from "@/utils/date";

describe("TransactionSummaryWidget", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: true,
            totalCount: 0,
            statusBreakdown: [],
            dateRange: { earliest: null, latest: null },
        });
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders an empty-state message when there are no matching transactions", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: false,
            totalCount: 0,
            statusBreakdown: [],
            dateRange: { earliest: null, latest: null },
        });
        const html = await renderToString(app);
        expect(html).toContain("No transactions match the current filters.");
    });

    it("renders total, status breakdown, and date range when populated", async () => {
        const earliest = "2026-07-05T12:00:00.000Z";
        const latest = "2026-07-20T12:00:00.000Z";
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: false,
            totalCount: 57,
            statusBreakdown: [
                { label: "posted", count: 40 },
                { label: "draft", count: 17 },
            ],
            dateRange: { earliest, latest },
        });
        const html = await renderToString(app);

        expect(html).toContain("57");
        expect(html).toContain("posted (40)");
        expect(html).toContain("draft (17)");
        expect(html).toContain(formatDate(earliest));
        expect(html).toContain(formatDate(latest));
        expect(html).toContain("wdg_TransactionSummary");
    });

    it("colors each status badge by its semantic meaning", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: false,
            totalCount: 3,
            statusBreakdown: [
                { label: "posted", count: 1 },
                { label: "draft", count: 1 },
                { label: "cancelled", count: 1 },
                { label: "some-unmapped-status", count: 1 },
            ],
            dateRange: { earliest: null, latest: null },
        });
        const html = await renderToString(app);

        // Badge tones resolve to these real Tailwind color classes (Badge.vue's toneMap).
        expect(html).toContain("text-success-600"); // posted
        expect(html).toContain("text-warning-600"); // draft
        expect(html).toContain("text-danger-600"); // cancelled
        expect(html).toContain("text-text-secondary"); // unmapped -> neutral
    });

    it("gives each card a distinct colored icon accent", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: false,
            totalCount: 1,
            statusBreakdown: [{ label: "posted", count: 1 }],
            dateRange: { earliest: null, latest: null },
        });
        const html = await renderToString(app);

        expect(html).toContain("text-primary-600"); // Total icon accent
        expect(html).toContain("text-info-600"); // Date Range icon accent
        expect(html.match(/<svg/g) ?? []).toHaveLength(3); // one icon per card
    });
});
