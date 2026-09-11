import { describe, expect, it } from "vitest";
import routerSource from "./index.ts?raw";
import appLayoutSource from "@/components/templates/AppLayout.vue?raw";
import transactionCreateSource from "@/views/transactions/TransactionCreatePage.vue?raw";
import transactionLineItemsSource from "@/views/transactions/components/TransactionLineItems.vue?raw";
import transactionHeaderSource from "@/views/transactions/components/TransactionHeader.vue?raw";
import stockBalanceSource from "@/views/stock/StockBalancePage.vue?raw";
import stockLedgerSource from "@/views/stock/StockLedgerPage.vue?raw";
import { masterEntities } from "@/domain/master/entityConfig";
import { reportConfigs } from "@/domain/report/reportConfig";
import { reportPaths } from "@/api/feature/dto/report.dto";

const requiredStaticRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "dashboard/overview",
    "dashboard/kpi",
    "dashboard/process",
    "dashboard/monitoring",
    "iam",
    "roles",
    "users",
    "roles/menus",
    "master-data",
    "stock/balance",
    "stock/ledger",
    "transactions/opname",
    "transactions/opname/new",
    "transactions/opname/:id",
    "settings",
    "companies",
    "apps",
    "menus",
    "profile",
    "log/tracking",
    "rfid/tags",
];

const requiredGenericTransactionKeys = [
    "register",
    "inbound",
    "putaway",
    "outbound",
    "relocation",
    "return",
    "returns",
];

const requiredTransactionFormMarkers: Record<string, string[]> = {
    register: [
        "cmb_TransactionCreateRegisteredBy",
        "cmb_TransactionCreateRegisterWarehouse",
        "TransactionLineItems",
    ],
    inbound: [
        "Create a new inbound receipt document",
        "cmb_TransactionCreatePartner",
        "TransactionLineItems",
    ],
    putaway: [
        "cmb_TransactionCreateWarehouse",
        "cmb_TransactionLineItemsFromLocation_Row",
        "cmb_TransactionLineItemsToLocation_Row",
    ],
    outbound: [
        "cmb_TransactionCreateAssignedBy",
        "dtp_TransactionCreateDeadline",
        "cmb_TransactionCreatePartner",
    ],
    relocation: [
        "cmb_TransactionLineItemsRelocationFromWarehouse",
        "cmb_TransactionLineItemsRelocationFromLocation",
        "cmb_TransactionLineItemsRelocationToWarehouse",
        "cmb_TransactionLineItemsRelocationToLocation",
    ],
    returns: ["cmb_TransactionCreatePartner", "TransactionLineItems"],
};

describe("page regression inventory", () => {
    it("keeps every first-class FE page registered in the router", () => {
        for (const path of requiredStaticRoutes) {
            expect(routerSource).toContain(`path: "${path}"`);
        }

        expect(routerSource).toContain(
            "path: `transactions/:transactionKey(${transactionPattern})`",
        );
        expect(routerSource).toContain(
            "path: `transactions/:transactionKey(${transactionPattern})/new`",
        );
        expect(routerSource).toContain(
            "path: `transactions/:transactionKey(${transactionPattern})/:id/edit`",
        );
        expect(routerSource).toContain(
            "path: `transactions/:transactionKey(${transactionPattern})/:id`",
        );
    });

    it("keeps all generic transaction modules wired while preserving dedicated opname routes", () => {
        for (const key of requiredGenericTransactionKeys) {
            expect(routerSource).toContain(`"${key}"`);
        }

        expect(routerSource).toContain('path: "transactions/opname"');
        expect(routerSource).not.toContain(
            '"opname",\n] as const;\nconst transactionPattern',
        );
    });

    it("keeps all supported master entities reachable through master-data", () => {
        expect(routerSource).toContain("...createMasterRoutes()");

        for (const [entity, config] of Object.entries(masterEntities)) {
            expect(config?.supported).toBe(true);
            expect(config?.formFields.length).toBeGreaterThan(0);
            expect(config?.columns.length).toBeGreaterThan(0);
            expect(routerSource).toContain(`path: entity`);
            expect(entity).toMatch(/^[a-z-]+$/);
        }
    });

    it("keeps top-level app navigation aligned with routed sections", () => {
        const expectedRailTargets = [
            "/dashboard/overview",
            "/master-data/warehouses",
            "/iam/roles",
            "/stock/balance",
            "/transactions/inbound",
            "/settings/companies",
        ];

        for (const target of expectedRailTargets) {
            expect(appLayoutSource).toContain(`to: "${target}"`);
        }
    });

    it("keeps transaction create forms wired to required controls per module", () => {
        for (const markers of Object.values(requiredTransactionFormMarkers)) {
            for (const marker of markers) {
                expect(
                    `${transactionCreateSource}\n${transactionLineItemsSource}`,
                ).toContain(marker);
            }
        }

        expect(transactionCreateSource).not.toContain(
            "cmb_TransactionCreateRegisterLocation",
        );
    });

    it("keeps report/export surfaces on real routed pages only", () => {
        expect(routerSource).not.toContain('path: "reports"');
        expect(routerSource).not.toContain('path: "reports/');

        expect(transactionHeaderSource).toContain(
            'object-id="btn_TransactionHeaderExport"',
        );
        expect(stockBalanceSource).toContain('object-id-prefix="StockBalance"');
        expect(stockLedgerSource).toContain('object-id-prefix="StockLedger"');

        for (const [reportKey, config] of Object.entries(reportConfigs)) {
            expect(reportPaths[reportKey as keyof typeof reportPaths]).toEqual(
                expect.any(String),
            );
            expect(config.columns.length).toBeGreaterThan(0);
        }
    });
});
