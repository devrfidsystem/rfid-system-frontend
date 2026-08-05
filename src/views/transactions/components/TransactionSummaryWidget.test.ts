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
});
