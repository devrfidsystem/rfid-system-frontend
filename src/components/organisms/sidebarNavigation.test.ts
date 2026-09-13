import { describe, expect, it } from "vitest";
import type { MenuTreeNode } from "@/services/auth.service";
import { buildSidebarNavItems } from "./sidebarNavigation";

const node = (overrides: Partial<MenuTreeNode> = {}): MenuTreeNode => ({
    id: "menu-id",
    code: "MENU",
    name: "Menu",
    path: "/menu",
    parentId: null,
    icon: null,
    permissions: {
        canView: true,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
    },
    children: [],
    ...overrides,
});

describe("sidebar navigation", () => {
    it("hides Transfer while keeping Relocation in the transactions menu", () => {
        const transactions = node({
            id: "transactions",
            code: "TRANSACTIONS",
            name: "Transactions",
            path: null,
            children: [
                node({
                    id: "transfer",
                    code: "TRANSACTION_TRANSFER",
                    name: "Transfer",
                    path: "/transactions/transfer",
                }),
                node({
                    id: "relocation",
                    code: "TRANSACTION_RELOCATION",
                    name: "Relocation",
                    path: "/transactions/relocation",
                }),
            ],
        });

        const transactionMenu = buildSidebarNavItems(
            [transactions],
            "transactions",
        );

        expect(transactionMenu[0]?.children.map((item) => item.code)).toEqual([
            "TRANSACTION_RELOCATION",
        ]);
    });
});
