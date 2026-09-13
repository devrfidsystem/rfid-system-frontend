import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import TransactionTable from "./TransactionTable.vue";

describe("TransactionTable", () => {
    it("renders direct view detail buttons instead of row action popovers", async () => {
        const app = createSSRApp(TransactionTable, {
            loading: false,
            rows: [{ id: "tx-1", docNo: "TRX-001", status: "draft" }],
            columns: [
                { key: "docNo", label: "Document No" },
                { key: "status", label: "Status" },
                { key: "actions", label: "" },
            ],
            emptyStateVariant: "default",
            page: 1,
            limit: 10,
            total: 1,
            pageSizeOptions: [10, 20, 50],
        });

        const html = await renderToString(app);

        expect(html).toContain("btn_TransactionTableViewDetails");
        expect(html).toContain("View Details");
        expect(html).not.toContain('data-testid="row-actions-btn"');
        expect(html).not.toContain('aria-haspopup="menu"');
    });

    it("renders distinct status tones from the shared transaction status mapping", async () => {
        const app = createSSRApp(TransactionTable, {
            loading: false,
            rows: [
                { id: "tx-1", docNo: "TRX-001", status: "posted" },
                { id: "tx-2", docNo: "TRX-002", status: "done" },
                { id: "tx-3", docNo: "TRX-003", status: "partial" },
            ],
            columns: [
                { key: "docNo", label: "Document No" },
                { key: "status", label: "Status" },
                { key: "actions", label: "" },
            ],
            emptyStateVariant: "default",
            page: 1,
            limit: 10,
            total: 3,
            pageSizeOptions: [10, 20, 50],
        });

        const html = await renderToString(app);

        expect(html).toContain("Posted");
        expect(html).toContain("Done");
        expect(html).toContain("Partial");
        expect(html).toContain("text-info-600");
        expect(html).toContain("text-success-600");
    });
});
