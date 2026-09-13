import { describe, expect, it } from "vitest";
import transactionCreateSource from "@/views/transactions/TransactionCreatePage.vue?raw";
import transactionDetailSource from "@/views/transactions/TransactionDetailPage.vue?raw";
import transactionLineItemsSource from "@/views/transactions/components/TransactionLineItems.vue?raw";
import outboundDetailLinesSource from "@/views/transactions/components/OutboundDetailLines.vue?raw";
import opnameCreateSource from "@/views/opname/OpnameCreatePage.vue?raw";
import opnameDetailSource from "@/views/opname/OpnameDetailPage.vue?raw";

const sectionSources = [
    transactionCreateSource,
    transactionDetailSource,
    transactionLineItemsSource,
    outboundDetailLinesSource,
    opnameCreateSource,
    opnameDetailSource,
];

describe("section title usage", () => {
    it("uses ToolbarTitle for transaction and opname section headings", () => {
        for (const source of sectionSources) {
            expect(source).toContain("<ToolbarTitle");
            expect(source).toContain(
                'import ToolbarTitle from "@/components/molecules/ToolbarTitle.vue";',
            );
        }
    });
});
