import { describe, expect, it, beforeEach, vi } from "vitest";
// @ts-expect-error Vite raw imports are resolved at test runtime.
import pageSource from "../TransactionCreatePage.vue?raw";

const mocks = vi.hoisted(() => ({
    createSpy: vi.fn(),
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
        list: vi.fn().mockResolvedValue({ items: [], meta: null }),
    },
}));

describe("useTransactionCreate", () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
        });

        await create.handleSubmit();

        expect(mocks.createSpy).not.toHaveBeenCalled();
        expect(mocks.notifyErrorSpy).toHaveBeenCalledWith(
            "Please select an assigned user and deadline.",
        );
    });

    it("blocks register submit when a line is missing product or valid quantity", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("register");

        create.form.value.registeredById = "user-7";
        create.form.value.warehouseId = "warehouse-1";
        create.form.value.locationId = "location-1";
        create.form.value.lines.push({
            productId: "",
            qty: "0",
            locationId: "",
            fromLocationId: "",
            toLocationId: "",
        });

        await create.handleSubmit();

        expect(mocks.createSpy).not.toHaveBeenCalled();
        expect(mocks.notifyErrorSpy).toHaveBeenCalledWith(
            "Please complete product, location, and quantity for every line item.",
        );
    });

    it("does not expose the generic single warehouse field for register tasks", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("register");

        expect(create.showSingleWarehouse.value).toBe(false);
        expect(pageSource).toContain("cmb_TransactionCreateRegisterWarehouse");
        expect(pageSource).toContain("cmb_TransactionCreateRegisterLocation");
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

    it("redirects inbound create pages back to the list view", () => {
        expect(pageSource).toContain("if (isInbound) {");
        expect(pageSource).toContain("handleBack();");
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
});
