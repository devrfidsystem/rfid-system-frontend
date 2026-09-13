import { describe, expect, it } from "vitest";
import stockToolbarSource from "@/views/stock/components/StockTableToolbar.vue?raw";
import usersToolbarSource from "@/views/users/components/UsersTableToolbar.vue?raw";
import masterHeaderSource from "@/views/master/components/MasterHeader.vue?raw";
import transactionHeaderSource from "@/views/transactions/components/TransactionHeader.vue?raw";

const toolbarSources = [
    stockToolbarSource,
    usersToolbarSource,
    masterHeaderSource,
    transactionHeaderSource,
];

describe("ToolbarTitle usage", () => {
    it("keeps table toolbar headings on the shared ToolbarTitle molecule", () => {
        for (const source of toolbarSources) {
            expect(source).toContain("<ToolbarTitle");
            expect(source).toContain(
                'import ToolbarTitle from "@/components/molecules/ToolbarTitle.vue";',
            );
        }
    });
});
