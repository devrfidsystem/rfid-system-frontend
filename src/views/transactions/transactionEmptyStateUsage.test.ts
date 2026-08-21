import { describe, expect, it } from "vitest";
import detailSource from "./TransactionDetailPage.vue?raw";
import outboundSource from "./components/OutboundDetailLines.vue?raw";

describe("transaction empty state usage", () => {
    it("uses StatusPanel instead of manual table empty copy", () => {
        for (const source of [detailSource, outboundSource]) {
            expect(source).toContain("<StatusPanel");
            expect(source).toContain(
                'import StatusPanel from "@/components/molecules/StatusPanel.vue";',
            );
            expect(source).not.toContain("No line items found.");
        }
    });
});
