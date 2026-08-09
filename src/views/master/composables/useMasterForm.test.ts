import { computed, ref } from "vue";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { masterEntities } from "@/domain/master/entityConfig";
import { useMasterForm } from "./useMasterForm";

const mocks = vi.hoisted(() => ({
    fetchOptions: vi.fn(),
    fetchList: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    parseMasterExcelFile: vi.fn(),
    notifyError: vi.fn(),
    notifySuccess: vi.fn(),
}));

vi.mock("@/services/master.service", () => ({
    masterService: {
        fetchOptions: mocks.fetchOptions,
        fetchList: mocks.fetchList,
        create: mocks.create,
        update: mocks.update,
    },
}));

vi.mock("../masterExcel", () => ({
    parseMasterExcelFile: mocks.parseMasterExcelFile,
}));

vi.mock("@/services/location.service", () => ({
    locationService: {
        move: vi.fn(),
    },
}));

vi.mock("@/services/products.service", () => ({
    productsService: {
        uploadProductImage: vi.fn(),
    },
}));

vi.mock("@/composable/useNotifier", () => ({
    useNotifier: () => ({
        withToast: async (operation: () => Promise<void>) => operation(),
        notifyError: mocks.notifyError,
        notifySuccess: mocks.notifySuccess,
    }),
}));

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("useMasterForm", () => {
    beforeEach(() => {
        mocks.fetchOptions.mockReset().mockResolvedValue([]);
        mocks.fetchList.mockReset().mockResolvedValue({ items: [] });
        mocks.create
            .mockReset()
            .mockResolvedValue({ data: { id: "created-1" } });
        mocks.update.mockReset().mockResolvedValue({ data: { id: "cust-1" } });
        mocks.parseMasterExcelFile.mockReset().mockResolvedValue([]);
        mocks.notifyError.mockReset();
        mocks.notifySuccess.mockReset();
    });

    const buildCustomersContext = () => {
        const entityKey = ref("customers");
        const context = {
            entityKey,
            config: computed(() => masterEntities.customers),
            isMasterApiEntity: () => true,
            authStore: { currentCompanyId: "company-1" },
            companyAwareEntities: [
                "attributes",
                "customers",
                "suppliers",
                "products",
                "uoms",
                "product-categories",
                "warehouses",
                "locations",
            ],
            ensureLocationWarehouseContext: vi.fn(),
            locationWarehouseId: ref(null),
            route: { fullPath: "/master-data/customers" },
        };
        const table = {
            loadRows: vi.fn(),
            loadError: ref(null),
        };
        return { context, table };
    };

    it("loads product attribute definitions with an explicit reference limit", async () => {
        const entityKey = ref("products");
        const context = {
            entityKey,
            config: computed(() => masterEntities.products),
            isMasterApiEntity: () => true,
            authStore: { currentCompanyId: "company-1" },
            companyAwareEntities: [
                "attributes",
                "customers",
                "suppliers",
                "products",
                "uoms",
                "product-categories",
                "warehouses",
                "locations",
            ],
            ensureLocationWarehouseContext: vi.fn(),
            locationWarehouseId: ref(null),
            route: { fullPath: "/master-data/products" },
        };
        const table = {
            loadRows: vi.fn(),
            loadError: ref(null),
        };

        useMasterForm(context as never, table as never);
        await flushPromises();

        expect(mocks.fetchList).toHaveBeenCalledWith("attributes", {
            companyId: "company-1",
            limit: 200,
        });
    });

    it("imports Excel rows through the master create payload flow", async () => {
        mocks.parseMasterExcelFile.mockResolvedValue([
            {
                Name: "Retail Partner",
                Phone: "08123456789",
            },
        ]);
        const entityKey = ref("customers");
        const context = {
            entityKey,
            config: computed(() => masterEntities.customers),
            isMasterApiEntity: () => true,
            authStore: { currentCompanyId: "company-1" },
            companyAwareEntities: [
                "attributes",
                "customers",
                "suppliers",
                "products",
                "uoms",
                "product-categories",
                "warehouses",
                "locations",
            ],
            ensureLocationWarehouseContext: vi.fn(),
            locationWarehouseId: ref(null),
            route: { fullPath: "/master-data/customers" },
        };
        const table = {
            loadRows: vi.fn(),
            loadError: ref(null),
        };
        const form = useMasterForm(context as never, table as never);
        const file = new File(["placeholder"], "customers.xlsx", {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        await form.handleImport(file);

        expect(mocks.create).toHaveBeenCalledWith("customers", {
            name: "Retail Partner",
            phone: "08123456789",
            code: "CUST-RETAIL-PARTNER",
            companyId: "company-1",
        });
        expect(table.loadRows).toHaveBeenCalled();
    });

    it("continues importing remaining rows after one row fails, and reports a per-row summary", async () => {
        mocks.parseMasterExcelFile.mockResolvedValue([
            { Name: "Retail Partner A" },
            { Name: "Retail Partner B" },
            { Name: "Retail Partner C" },
        ]);
        mocks.create
            .mockResolvedValueOnce({ data: { id: "created-1" } })
            .mockRejectedValueOnce(new Error("Duplicate code"))
            .mockResolvedValueOnce({ data: { id: "created-3" } });

        const { context, table } = buildCustomersContext();
        const form = useMasterForm(context as never, table as never);
        const file = new File(["placeholder"], "customers.xlsx", {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        await form.handleImport(file);

        // All 3 rows were attempted — row 2 failing did not stop rows 1 and 3.
        expect(mocks.create).toHaveBeenCalledTimes(3);
        expect(table.loadRows).toHaveBeenCalled();

        const [message] = mocks.notifyError.mock.calls[0];
        expect(message).toContain("2 imported");
        expect(message).toContain("1 failed");
        expect(message).toContain("Duplicate code");
        expect(mocks.notifySuccess).not.toHaveBeenCalled();
    });

    it("reports success when every row imports cleanly", async () => {
        mocks.parseMasterExcelFile.mockResolvedValue([
            { Name: "Retail Partner A" },
        ]);

        const { context, table } = buildCustomersContext();
        const form = useMasterForm(context as never, table as never);
        const file = new File(["placeholder"], "customers.xlsx", {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        await form.handleImport(file);

        expect(mocks.notifySuccess).toHaveBeenCalledTimes(1);
        expect(mocks.notifySuccess.mock.calls[0][0]).toContain("1 imported");
        expect(mocks.notifyError).not.toHaveBeenCalled();
        expect(table.loadRows).toHaveBeenCalled();
    });

    it("does not send a regenerated code when updating a customer", async () => {
        const { context, table } = buildCustomersContext();
        const form = useMasterForm(context as never, table as never);
        await flushPromises();

        await form.openEdit({
            id: "cust-1",
            name: "Retail Partner",
            code: "CUST-ORIGINAL",
        });

        await form.handleUpdate({
            name: "Retail Partner Renamed",
        });

        expect(mocks.update).toHaveBeenCalledWith("customers", "cust-1", {
            name: "Retail Partner Renamed",
        });
    });
});
