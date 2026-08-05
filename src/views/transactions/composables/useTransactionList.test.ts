import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("@/composable/useDebouncedWatch", () => ({
    useDebouncedWatch: vi.fn(),
}));

vi.mock("@/composable/useWarehouseOptions", () => ({
    useWarehouseOptions: () => ({
        options: ref([]),
        loading: ref(false),
        error: ref(null),
        refresh: vi.fn(),
    }),
}));

vi.mock("@/api/feature/transactions.api", () => ({
    transactionsApi: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        post: vi.fn(),
        cancel: vi.fn(),
    },
}));

vi.mock("@/services/master.service", () => ({
    masterService: {
        fetchList: vi.fn().mockResolvedValue({ items: [], meta: null }),
    },
}));

vi.mock("@/services/transactions.service", async (importOriginal) => {
    const actual =
        await importOriginal<
            typeof import("@/services/transactions.service")
        >();

    return {
        ...actual,
        transactionPaths: {
            register: "/register",
            inbound: "/inbound",
            putaway: "/putaway",
            outbound: "/outbound",
            relocation: "/relocation",
            transfer: "/transfer",
            return: "/returns",
            returns: "/returns",
            opname: "/opname",
        },
        transactionService: {
            list: vi.fn().mockResolvedValue({ items: [], meta: null }),
            get: vi.fn(),
            create: vi.fn(),
            post: vi.fn(),
            cancel: vi.fn(),
        },
    };
});

vi.mock("@/services/report.service", () => ({
    reportService: {
        exportReport: vi.fn(),
    },
}));

vi.mock("@/views/report/reportConfig", () => ({
    reportConfigs: {
        inbound: {
            title: "Inbound Documents",
            description:
                "Inbound documents recorded via /inbound for receipt detail review.",
            columns: [],
        },
        relocation: {
            title: "Relocation Transactions",
            description:
                "See inventory movements between locations (/relocation).",
            columns: [],
        },
    },
    hasPartnerDatasetSupport: () => false,
}));

describe("useTransactionList", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("renders relocation list metadata and create entrypoint", async () => {
        const { useTransactionList } = await import("./useTransactionList");
        const list = useTransactionList({ transactionKey: "relocation" });

        expect(list.pageTitle.value).toBe("Relocation Transactions");
        expect(list.pageTagline.value).toBe("Transactions");
        expect(list.sectionHeading.value).toBe("Relocation Transactions");
        expect(list.canCreate.value).toBe(true);
        expect(list.pageDescription.value).toBe(
            "See inventory movements between locations (/relocation). · powered by /relocation",
        );
    });

    it("disables create entrypoint for inbound", async () => {
        const { useTransactionList } = await import("./useTransactionList");
        const list = useTransactionList({ transactionKey: "inbound" });

        expect(list.pageTitle.value).toBe("Inbound Documents");
        expect(list.sectionHeading.value).toBe("Inbound Documents");
        expect(list.canCreate.value).toBe(false);
    });

    it("renders outbound list metadata and wireframe columns", async () => {
        vi.resetModules();
        vi.unmock("@/views/report/reportConfig");

        const { useTransactionList } = await import("./useTransactionList");
        const list = useTransactionList({ transactionKey: "outbound" });

        expect(list.pageTitle.value).toBe("Outbound Assignment");
        expect(list.pageTagline.value).toBe("Tasks");
        expect(list.sectionHeading.value).toBe("Outbound Assignment");
        expect(list.canCreate.value).toBe(true);
        expect(list.pageDescription.value).toBe(
            "Manage outbound tasks and execution progress from /outbound. · powered by /outbound",
        );
        expect(
            list.columns.value.map(({ key, label }) => ({ key, label })),
        ).toEqual([
            { key: "docNo", label: "ID Number" },
            { key: "type", label: "Type" },
            { key: "assignedBy.fullName", label: "Assigned User" },
            { key: "deadlineAt", label: "Deadline" },
            { key: "status", label: "Status" },
            { key: "actions", label: "" },
        ]);
    });

    it("normalizes outbound assignment metadata for list rows", async () => {
        const { normalizeTransactionRecord } =
            await import("@/services/transactions.service");

        const normalized = normalizeTransactionRecord({
            id: "out-1",
            outbound_no: "OUT-001",
            outbound_date: "2026-07-18T00:00:00.000Z",
            assigned_by: "Jane Doe",
            deadline_at: "2026-07-25T00:00:00.000Z",
            transaction_type: "Outbound",
        });

        expect(normalized.docNo).toBe("OUT-001");
        expect(normalized.date).toBe("2026-07-18T00:00:00.000Z");
        expect(normalized.assignedBy).toMatchObject({
            fullName: "Jane Doe",
        });
        expect(normalized.deadlineAt).toBe("2026-07-25T00:00:00.000Z");
        expect(normalized.type).toBe("Outbound");
    });

    it("only allows export for inbound/outbound — the only two backend-supported export routes", async () => {
        vi.resetModules();
        vi.unmock("@/views/report/reportConfig");

        const { useTransactionList } = await import("./useTransactionList");

        expect(
            useTransactionList({ transactionKey: "inbound" }).canExport.value,
        ).toBe(true);
        expect(
            useTransactionList({ transactionKey: "outbound" }).canExport.value,
        ).toBe(true);
        expect(
            useTransactionList({ transactionKey: "register" }).canExport.value,
        ).toBe(false);
        expect(
            useTransactionList({ transactionKey: "putaway" }).canExport.value,
        ).toBe(false);
        expect(
            useTransactionList({ transactionKey: "relocation" }).canExport
                .value,
        ).toBe(false);
        expect(
            useTransactionList({ transactionKey: "transfer" }).canExport.value,
        ).toBe(false);
        expect(
            useTransactionList({ transactionKey: "returns" }).canExport.value,
        ).toBe(false);
    });

    it("configures register list with warehouse filter and register-specific columns", async () => {
        vi.resetModules();
        vi.unmock("@/views/report/reportConfig");

        const { useTransactionList } = await import("./useTransactionList");
        const list = useTransactionList({ transactionKey: "register" });

        expect(list.showWarehouseFilter.value).toBe(true);
        expect(
            list.columns.value.map(({ key, label }) => ({ key, label })),
        ).toEqual([
            { key: "docNumber", label: "Doc No" },
            { key: "docDate", label: "Date Issue" },
            { key: "warehouseId", label: "Warehouse" },
            { key: "locationName", label: "Location" },
            { key: "productSummary", label: "Products" },
            { key: "registeredBy.fullName", label: "User" },
            { key: "status", label: "Status" },
            { key: "actions", label: "" },
        ]);
    });

    it("normalizes register warehouse, location, and product summary for list rows", async () => {
        const { normalizeTransactionRecord } =
            await import("@/services/transactions.service");

        const normalized = normalizeTransactionRecord({
            id: "reg-1",
            docNumber: "REG-001",
            warehouse: { name: "Main WH" },
            location: { name: "Rack A" },
            lines: [
                {
                    qty: 2,
                    product: { code: "SKU-1", name: "Product One" },
                },
                {
                    qty: 3,
                    product: { name: "Product Two" },
                },
            ],
        });

        expect(normalized.warehouseId).toBe("Main WH");
        expect(normalized.locationName).toBe("Rack A");
        expect(normalized.productSummary).toBe(
            "SKU-1 - Product One (2), Product Two (3)",
        );
    });

    it("exposes the raw loaded rows for downstream summary derivation", async () => {
        vi.resetModules();
        vi.unmock("@/views/report/reportConfig");

        const { transactionService } =
            await import("@/services/transactions.service");
        vi.mocked(transactionService.list).mockResolvedValueOnce({
            items: [
                { id: "1", status: "posted" },
                { id: "2", status: "draft" },
            ],
            meta: { page: 1, limit: 20, total: 2 },
        });

        const { useTransactionList } = await import("./useTransactionList");
        const list = useTransactionList({ transactionKey: "relocation" });

        const flushPromises = () =>
            new Promise((resolve) => setTimeout(resolve, 0));
        await flushPromises();

        expect(list.rows.value.map((row) => row.status)).toEqual([
            "posted",
            "draft",
        ]);
    });
});
