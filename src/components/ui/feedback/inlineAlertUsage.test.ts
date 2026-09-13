import { describe, expect, it } from "vitest";
import dataTableSource from "@/components/organisms/DataTable/DataTable.vue?raw";
import profileSource from "@/views/profile/ProfilePage.vue?raw";
import loginSource from "@/views/auth/LoginPage.vue?raw";
import transactionListSource from "@/views/transactions/TransactionListPage.vue?raw";
import transactionDetailSource from "@/views/transactions/TransactionDetailPage.vue?raw";
import opnameCreateSource from "@/views/opname/OpnameCreatePage.vue?raw";
import opnameDetailSource from "@/views/opname/OpnameDetailPage.vue?raw";
import opnameTreeSource from "@/views/opname/OpnameTreePage.vue?raw";

const alertSources = [
    dataTableSource,
    profileSource,
    loginSource,
    transactionListSource,
    transactionDetailSource,
    opnameCreateSource,
    opnameDetailSource,
    opnameTreeSource,
];

describe("InlineAlert usage", () => {
    it("uses InlineAlert for inline error messaging", () => {
        for (const source of alertSources) {
            expect(source).toContain("<InlineAlert");
            expect(source).toContain(
                'import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";',
            );
            expect(source).not.toContain("bg-danger-50 px-4 py-3");
            expect(source).not.toContain("bg-danger-50 p-3");
        }
    });

    it("uses InlineAlert for DataTable unsupported feature warnings", () => {
        expect(dataTableSource).toContain('variant="warning"');
        expect(dataTableSource).not.toContain("bg-warning-50 px-4 py-3");
    });
});
