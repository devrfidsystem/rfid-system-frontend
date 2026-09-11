import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import pageSource from "../TransactionCreatePage.vue?raw";

const mocks = vi.hoisted(() => ({
    createSpy: vi.fn(),
    getSpy: vi.fn(),
    updateSpy: vi.fn(),
    locationListSpy: vi.fn().mockResolvedValue({ items: [], meta: null }),
    stockBalanceSpy: vi.fn().mockResolvedValue({ items: [], meta: null }),
    pushSpy: vi.fn(),
    notifyErrorSpy: vi.fn(),
    notifySuccessSpy: vi.fn(),
}));

vi.mock("vue-router", () => ({
    useRouter: () => ({
        push: mocks.pushSpy,
    }),
}));

vi.mock("@/composable/useNotifier", () => ({
    useNotifier: () => ({
        notifyError: mocks.notifyErrorSpy,
        notifySuccess: mocks.notifySuccessSpy,
    }),
}));

vi.mock("@/store/auth.store", () => ({
    useAuthStore: () => ({
        currentCompanyId: "company-1",
    }),
}));

vi.mock("@/services/transactions.service", () => ({
    transactionService: {
        create: mocks.createSpy,
        get: mocks.getSpy,
        update: mocks.updateSpy,
    },
}));

vi.mock("@/services/master.service", () => ({
    masterService: {
        fetchList: vi.fn().mockResolvedValue({ items: [], meta: null }),
    },
}));

vi.mock("@/services/users.service", () => ({
    usersService: {
        list: vi.fn().mockResolvedValue({ items: [], meta: null }),
    },
}));

vi.mock("@/services/location.service", () => ({
    locationService: {
        list: mocks.locationListSpy,
    },
}));

vi.mock("@/services/stock.service", () => ({
    stockService: {
        fetchBalance: mocks.stockBalanceSpy,
    },
}));

describe("useTransactionCreate", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("defaults outbound document number to OUT-YYMMDD-001", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2025-08-26T03:00:00.000Z"));

        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("outbound");

        expect(create.form.value.docNumber).toBe("OUT-250826-001");
    });

    it("builds a relocation payload with from and to location lines", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("relocation");

        create.form.value.docNumber = "REL-001";
        create.form.value.transactionDate = "2026-07-18";
        create.form.value.notes = "Relocation task";
        create.form.value.lines.push({
            productId: "prod-1",
            qty: "3",
            locationId: "",
            fromLocationId: "loc-a",
            toLocationId: "loc-b",
            enteredUomId: "",
            enteredQty: "",
        });

        await create.handleSubmit();

        expect(mocks.createSpy).toHaveBeenCalledWith("relocation", {
            companyId: "company-1",
            docNumber: "REL-001",
            docDate: expect.any(String),
            notes: "Relocation task",
            lines: [
                {
                    productId: "prod-1",
                    fromLocationId: "loc-a",
                    toLocationId: "loc-b",
                    qty: 3,
                },
            ],
        });
        expect(mocks.notifySuccessSpy).toHaveBeenCalledWith(
            "Transaction created successfully",
        );
        expect(mocks.pushSpy).toHaveBeenCalledWith("/transactions/relocation");
    });

    it("builds an outbound payload with assignee and deadline", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("outbound");

        create.form.value.docNumber = "OUT-001";
        create.form.value.transactionDate = "2026-07-18";
        create.form.value.notes = "Outbound assignment";
        create.form.value.partnerId = "cust-1";
        create.form.value.assignedById = "user-7";
        create.form.value.deadlineAt = "2026-07-25";
        create.form.value.lines.push({
            productId: "prod-1",
            qty: "4",
            locationId: "loc-a",
            fromLocationId: "",
            toLocationId: "",
            enteredUomId: "",
            enteredQty: "",
        });

        await create.handleSubmit();

        expect(mocks.createSpy).toHaveBeenCalledWith("outbound", {
            companyId: "company-1",
            docNumber: "OUT-001",
            docDate: expect.any(String),
            notes: "Outbound assignment",
            customerId: "cust-1",
            assignedById: "user-7",
            deadlineAt: expect.any(String),
            lines: [
                {
                    productId: "prod-1",
                    locationId: "loc-a",
                    qtyExpected: 4,
                },
            ],
        });
        expect(mocks.notifySuccessSpy).toHaveBeenCalledWith(
            "Transaction created successfully",
        );
        expect(mocks.pushSpy).toHaveBeenCalledWith("/transactions/outbound");
    });

    it("blocks outbound submit when deadline is missing", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("outbound");

        create.form.value.assignedById = "user-7";
        create.form.value.lines.push({
            productId: "prod-1",
            qty: "1",
            locationId: "loc-a",
            fromLocationId: "",
            toLocationId: "",
            enteredUomId: "",
            enteredQty: "",
        });

        await create.handleSubmit();

        expect(mocks.createSpy).not.toHaveBeenCalled();
        expect(mocks.notifyErrorSpy).toHaveBeenCalledWith(
            "Please select an assigned user and deadline.",
        );
    });

    it("blocks any non-opname transaction submit when there are no line items", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("inbound");

        await create.handleSubmit();

        expect(mocks.createSpy).not.toHaveBeenCalled();
        expect(mocks.notifyErrorSpy).toHaveBeenCalledWith(
            "Please add at least one line item.",
        );
    });

    it("blocks transfer submit when source or destination warehouse is missing", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("transfer");

        create.form.value.fromWarehouseId = "warehouse-a";
        create.form.value.toWarehouseId = "";
        create.form.value.lines.push({
            productId: "prod-1",
            qty: "1",
            locationId: "",
            fromLocationId: "loc-a",
            toLocationId: "loc-b",
            enteredUomId: "",
            enteredQty: "",
        });

        await create.handleSubmit();

        expect(mocks.createSpy).not.toHaveBeenCalled();
        expect(mocks.notifyErrorSpy).toHaveBeenCalledWith(
            "Please select source and destination warehouses.",
        );
    });

    it("blocks register submit when a line is missing product or valid quantity", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("register");

        create.form.value.registeredById = "user-7";
        create.form.value.warehouseId = "warehouse-1";
        create.form.value.locationId = "";
        create.form.value.lines.push({
            productId: "",
            qty: "0",
            locationId: "",
            fromLocationId: "",
            toLocationId: "",
            enteredUomId: "",
            enteredQty: "",
        });

        await create.handleSubmit();

        expect(mocks.createSpy).not.toHaveBeenCalled();
        expect(mocks.notifyErrorSpy).toHaveBeenCalledWith(
            "Please complete product, location, and quantity for every line item.",
        );
    });

    it("allows register submit without header or line location", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("register");

        create.form.value.docNumber = "REG-NO-LOC";
        create.form.value.transactionDate = "2026-07-18";
        create.form.value.registeredById = "user-7";
        create.form.value.warehouseId = "warehouse-1";
        create.form.value.locationId = "";
        create.form.value.lines.push({
            productId: "prod-1",
            qty: "2",
            locationId: "",
            fromLocationId: "",
            toLocationId: "",
            enteredUomId: "",
            enteredQty: "",
        });

        await create.handleSubmit();

        expect(mocks.notifyErrorSpy).not.toHaveBeenCalled();
        const payload = mocks.createSpy.mock.calls[0][1] as {
            locationId?: string;
            lines: Record<string, unknown>[];
        };
        expect(payload).not.toHaveProperty("locationId");
        expect(payload.lines[0]).not.toHaveProperty("locationId");
    });

    it("blocks inbound submit when a line is missing its location", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("inbound");

        create.form.value.partnerId = "supplier-1";
        create.form.value.warehouseId = "warehouse-1";
        create.form.value.lines.push({
            productId: "prod-1",
            qty: "1",
            locationId: "",
            fromLocationId: "",
            toLocationId: "",
            enteredUomId: "",
            enteredQty: "",
        });

        await create.handleSubmit();

        expect(mocks.createSpy).not.toHaveBeenCalled();
        expect(mocks.notifyErrorSpy).toHaveBeenCalledWith(
            "Please complete product, location, and quantity for every line item.",
        );
    });

    it("requires putaway target location but keeps source location optional", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("putaway");

        create.form.value.warehouseId = "warehouse-1";
        create.form.value.lines.push({
            productId: "prod-1",
            qty: "1",
            locationId: "",
            fromLocationId: "",
            toLocationId: "",
            enteredUomId: "",
            enteredQty: "",
        });

        await create.handleSubmit();

        expect(mocks.createSpy).not.toHaveBeenCalled();
        expect(mocks.notifyErrorSpy).toHaveBeenCalledWith(
            "Please complete product, location, and quantity for every line item.",
        );

        mocks.notifyErrorSpy.mockClear();
        create.form.value.lines[0].toLocationId = "loc-target";

        await create.handleSubmit();

        expect(mocks.notifyErrorSpy).not.toHaveBeenCalled();
        const payload = mocks.createSpy.mock.calls[0][1] as {
            lines: Record<string, unknown>[];
        };
        expect(payload.lines[0]).toMatchObject({
            targetLocationId: "loc-target",
        });
        expect(payload.lines[0]).not.toHaveProperty("sourceLocationId");
    });

    it("loads putaway products from the selected source location stock balance", async () => {
        mocks.stockBalanceSpy.mockResolvedValueOnce({
            items: [
                {
                    id: "bal-1",
                    productId: "prod-1",
                    productCode: "SKU-1",
                    productName: "Widget",
                    warehouseId: "warehouse-1",
                    locationId: "loc-source",
                    quantity: 12,
                },
            ],
            meta: null,
        });

        const { nextTick } = await import("vue");
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("putaway");

        create.form.value.warehouseId = "warehouse-1";
        create.addLine();
        create.form.value.lines[0].fromLocationId = "loc-source";
        await nextTick();
        await Promise.resolve();

        expect(mocks.stockBalanceSpy).toHaveBeenCalledWith({
            warehouseId: "warehouse-1",
            locationId: "loc-source",
            limit: 200,
        });
        expect(create.productOptions.value).toEqual([
            { label: "SKU-1 - Widget (Qty 12)", value: "prod-1" },
        ]);
    });

    it("does not load global master products for putaway before a source location is selected", async () => {
        const { masterService } = await import("@/services/master.service");
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("putaway");

        await create.loadOptions();

        expect(masterService.fetchList).toHaveBeenCalledWith("warehouses", {
            limit: 100,
        });
        expect(masterService.fetchList).not.toHaveBeenCalledWith("products", {
            limit: 200,
            search: undefined,
        });
        expect(create.productOptions.value).toEqual([]);
    });

    it("does not expose location fields for register tasks", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("register");

        expect(create.showSingleWarehouse.value).toBe(false);
        expect(pageSource).toContain("cmb_TransactionCreateRegisterWarehouse");
        expect(pageSource).not.toContain(
            "cmb_TransactionCreateRegisterLocation",
        );
    });

    it("renders outbound create fields in the page template", () => {
        expect(pageSource).toContain("isOutbound");
        expect(pageSource).toContain(
            "Create a new outbound assignment with an assigned user and deadline",
        );
        expect(pageSource).toContain('label="Assigned User"');
        expect(pageSource).toContain('label="Deadline"');
        expect(pageSource).toContain("cmb_TransactionCreateAssignedBy");
        expect(pageSource).toContain("dtp_TransactionCreateDeadline");
    });

    it("renders inbound create fields instead of a read-only blocker", () => {
        expect(pageSource).not.toContain("Inbound is read-only");
        expect(pageSource).not.toContain("wdg_TransactionCreateInboundBlocked");
        expect(pageSource).toContain("Create a new inbound receipt document");
        expect(pageSource).toContain("TransactionLineItems");
    });

    it("builds an inbound payload from web admin", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("inbound");

        create.form.value.docNumber = "INB-001";
        create.form.value.transactionDate = "2026-07-18";
        create.form.value.notes = "Inbound receipt";
        create.form.value.partnerId = "supplier-1";
        create.form.value.lines.push({
            productId: "prod-1",
            qty: "5",
            locationId: "loc-a",
            fromLocationId: "",
            toLocationId: "",
            enteredUomId: "",
            enteredQty: "",
        });

        await create.handleSubmit();

        expect(mocks.createSpy).toHaveBeenCalledWith("inbound", {
            companyId: "company-1",
            docNumber: "INB-001",
            docDate: expect.any(String),
            notes: "Inbound receipt",
            supplierId: "supplier-1",
            lines: [
                {
                    productId: "prod-1",
                    locationId: "loc-a",
                    qtyExpected: 5,
                },
            ],
        });
        expect(mocks.pushSpy).toHaveBeenCalledWith("/transactions/inbound");
    });

    it("loads transaction task locations without product-type locations", async () => {
        const { nextTick } = await import("vue");
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("outbound");

        create.form.value.warehouseId = "warehouse-1";
        await nextTick();
        await Promise.resolve();

        expect(mocks.locationListSpy).toHaveBeenCalledWith({
            warehouseId: "warehouse-1",
            limit: 200,
            excludeTypes: ["product"],
        });
    });

    it("wires product attribute summaries into the line items component", () => {
        expect(pageSource).toContain(
            ':product-attribute-summaries="productAttributeSummaries"',
        );
    });

    it("builds a product-id-keyed attribute summary map after loading options", async () => {
        const { masterService } = await import("@/services/master.service");
        vi.mocked(masterService.fetchList).mockImplementation(
            (entity: string) => {
                if (entity === "products") {
                    return Promise.resolve({
                        items: [
                            {
                                id: "prod-1",
                                code: "P1",
                                name: "Widget",
                                createdAt: "2026-01-01",
                                attributeValues: [
                                    {
                                        attributeId: "attr-1",
                                        valueText: "Red",
                                        attribute: {
                                            id: "attr-1",
                                            name: "Color",
                                            type: "text",
                                        },
                                    },
                                ],
                            },
                            {
                                id: "prod-2",
                                code: "P2",
                                name: "Gadget",
                                createdAt: "2026-01-01",
                                attributeValues: [],
                            },
                        ],
                        meta: null,
                    });
                }
                return Promise.resolve({ items: [], meta: null });
            },
        );

        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("inbound");
        await create.loadOptions();

        expect(create.productAttributeSummaries.value).toEqual({
            "prod-1": "Color: Red",
        });
    });

    it("searches products from the backend for transaction line pickers", async () => {
        const { masterService } = await import("@/services/master.service");
        vi.mocked(masterService.fetchList).mockImplementation(
            (entity: string) => {
                if (entity === "products") {
                    return Promise.resolve({
                        items: [
                            {
                                id: "prod-9",
                                code: "SCN-9",
                                name: "RFID Scanner",
                                createdAt: "2026-01-01",
                            },
                        ],
                        meta: null,
                    });
                }
                return Promise.resolve({ items: [], meta: null });
            },
        );

        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("register");
        await create.searchProducts("scanner");

        expect(masterService.fetchList).toHaveBeenCalledWith("products", {
            limit: 200,
            search: "scanner",
        });
        expect(create.productOptions.value).toEqual([
            { label: "SCN-9 - RFID Scanner", value: "prod-9" },
        ]);
    });

    it("adds a new line with empty enteredUomId and enteredQty defaults", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("register");

        create.addLine();

        expect(create.form.value.lines[0]).toMatchObject({
            enteredUomId: "",
            enteredQty: "",
        });
    });

    it("builds a register payload including entered UOM tier and quantity", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("register");

        create.form.value.docNumber = "REG-001";
        create.form.value.transactionDate = "2026-07-18";
        create.form.value.registeredById = "user-7";
        create.form.value.warehouseId = "warehouse-1";
        create.form.value.lines.push({
            productId: "prod-1",
            qty: "24",
            locationId: "",
            fromLocationId: "",
            toLocationId: "",
            enteredUomId: "carton",
            enteredQty: "2",
        });

        await create.handleSubmit();

        expect(mocks.createSpy).toHaveBeenCalledWith("register", {
            companyId: "company-1",
            docNumber: "REG-001",
            docDate: expect.any(String),
            registeredById: "user-7",
            warehouseId: "warehouse-1",
            lines: [
                {
                    productId: "prod-1",
                    qtyExpected: 24,
                    enteredUomId: "carton",
                    enteredQty: 2,
                },
            ],
        });
        expect(mocks.notifySuccessSpy).toHaveBeenCalledWith(
            "Transaction created successfully",
        );
        expect(mocks.pushSpy).toHaveBeenCalledWith("/transactions/register");
    });

    it("updates an existing draft register task with the same register payload shape", async () => {
        mocks.getSpy.mockResolvedValueOnce({
            id: "reg-1",
            docNumber: "REG-001",
            docDate: "2026-07-18T00:00:00.000Z",
            registeredById: "user-7",
            warehouseId: "warehouse-1",
            status: "draft",
            notes: "before",
            lines: [
                {
                    productId: "prod-1",
                    qty: 3,
                    enteredUomId: "uom-pcs",
                    enteredQty: 3,
                },
            ],
        });

        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("register", "reg-1");
        await create.loadExistingTransaction();

        create.form.value.notes = "after";
        create.form.value.lines[0].qty = "4";

        await create.handleSubmit();

        expect(mocks.updateSpy).toHaveBeenCalledWith("register", "reg-1", {
            companyId: "company-1",
            docNumber: "REG-001",
            docDate: expect.any(String),
            notes: "after",
            registeredById: "user-7",
            warehouseId: "warehouse-1",
            lines: [
                {
                    productId: "prod-1",
                    qtyExpected: 4,
                    enteredUomId: "uom-pcs",
                    enteredQty: 3,
                },
            ],
        });
        expect(mocks.createSpy).not.toHaveBeenCalled();
        expect(mocks.pushSpy).toHaveBeenCalledWith(
            "/transactions/register/reg-1",
        );
    });

    it("loads and updates an existing draft inbound document with the backend update payload shape", async () => {
        mocks.getSpy.mockResolvedValueOnce({
            id: "inb-1",
            docNumber: "INB-001",
            docDate: "2026-07-18T00:00:00.000Z",
            warehouseId: "warehouse-1",
            status: "draft",
            notes: "before",
            lines: [
                {
                    productId: "prod-1",
                    locationId: "loc-a",
                    qtyExpected: 3,
                },
            ],
        });

        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("inbound", "inb-1");
        await create.loadExistingTransaction();

        expect(create.form.value.lines[0]).toMatchObject({
            productId: "prod-1",
            locationId: "loc-a",
            qty: "3",
        });

        create.form.value.notes = "after";
        create.form.value.lines[0].qty = "4";

        await create.handleSubmit();

        expect(mocks.updateSpy).toHaveBeenCalledWith("inbound", "inb-1", {
            docDate: expect.any(String),
            notes: "after",
            supplierId: undefined,
            lines: [
                {
                    productId: "prod-1",
                    locationId: "loc-a",
                    qtyExpected: 4,
                },
            ],
        });
        expect(mocks.createSpy).not.toHaveBeenCalled();
        expect(mocks.pushSpy).toHaveBeenCalledWith(
            "/transactions/inbound/inb-1",
        );
    });

    it("omits enteredUomId/enteredQty from an untouched register line's payload", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("register");

        create.form.value.docNumber = "REG-002";
        create.form.value.transactionDate = "2026-07-18";
        create.form.value.registeredById = "user-7";
        create.form.value.warehouseId = "warehouse-1";
        create.form.value.lines.push({
            productId: "prod-1",
            qty: "1",
            locationId: "",
            fromLocationId: "",
            toLocationId: "",
            enteredUomId: "",
            enteredQty: "",
        });

        await create.handleSubmit();

        expect(mocks.createSpy).toHaveBeenCalledWith("register", {
            companyId: "company-1",
            docNumber: "REG-002",
            docDate: expect.any(String),
            registeredById: "user-7",
            warehouseId: "warehouse-1",
            lines: [
                {
                    productId: "prod-1",
                    qtyExpected: 1,
                },
            ],
        });
        const payload = mocks.createSpy.mock.calls[0][1] as {
            lines: Record<string, unknown>[];
        };
        expect(payload.lines[0]).not.toHaveProperty("enteredUomId");
        expect(payload.lines[0]).not.toHaveProperty("enteredQty");
    });

    it("builds a putaway payload with source and target locations", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("putaway");

        create.form.value.docNumber = "PUT-001";
        create.form.value.transactionDate = "2026-07-18";
        create.form.value.warehouseId = "warehouse-1";
        create.form.value.referenceType = "inbound";
        create.form.value.referenceId = "INB-001";
        create.form.value.lines.push({
            productId: "prod-1",
            qty: "10",
            locationId: "",
            fromLocationId: "loc-existing",
            toLocationId: "loc-target",
            enteredUomId: "",
            enteredQty: "",
        });

        await create.handleSubmit();

        expect(mocks.createSpy).toHaveBeenCalledWith("putaway", {
            companyId: "company-1",
            docNumber: "PUT-001",
            docDate: expect.any(String),
            notes: undefined,
            warehouseId: "warehouse-1",
            referenceType: "inbound",
            referenceId: "INB-001",
            lines: [
                {
                    lineNo: 1,
                    productId: "prod-1",
                    qty: 10,
                    sourceLocationId: "loc-existing",
                    targetLocationId: "loc-target",
                },
            ],
        });
    });

    it("builds a product-id-keyed UOM info map after loading options", async () => {
        const { masterService } = await import("@/services/master.service");
        vi.mocked(masterService.fetchList).mockImplementation(
            (entity: string) => {
                if (entity === "products") {
                    return Promise.resolve({
                        items: [
                            {
                                id: "prod-1",
                                code: "P1",
                                name: "Widget",
                                createdAt: "2026-01-01",
                                uom: {
                                    id: "uom-pcs",
                                    name: "Pieces",
                                    symbol: "Pcs",
                                },
                                unitType: "carton",
                                unitName: "Box",
                                conversionFactor: 12,
                            },
                            {
                                id: "prod-2",
                                code: "P2",
                                name: "Gadget",
                                createdAt: "2026-01-01",
                                uom: {
                                    id: "uom-pcs",
                                    name: "Pieces",
                                    symbol: "Pcs",
                                },
                            },
                        ],
                        meta: null,
                    });
                }
                return Promise.resolve({ items: [], meta: null });
            },
        );

        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("register");
        await create.loadOptions();

        expect(create.productUomInfo.value).toEqual({
            "prod-1": {
                baseUomId: "uom-pcs",
                baseLabel: "Pcs",
                unitName: "Box",
                conversionFactor: 12,
                breakdownUomId: "carton",
            },
            "prod-2": {
                baseUomId: "uom-pcs",
                baseLabel: "Pcs",
                unitName: null,
                conversionFactor: null,
                breakdownUomId: null,
            },
        });
    });

    it("wires isRegister and product UOM info into the line items component", () => {
        expect(pageSource).toContain(':is-register="isRegister"');
        expect(pageSource).toContain(':product-uom-info="productUomInfo"');
        expect(pageSource).toContain('@search-products="searchProducts"');
    });
});
