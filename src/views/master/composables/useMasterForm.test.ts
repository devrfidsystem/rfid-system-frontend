import { computed, ref } from "vue";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { masterEntities } from "../entityConfig";
import { useMasterForm } from "./useMasterForm";

const mocks = vi.hoisted(() => ({
    fetchOptions: vi.fn(),
    fetchList: vi.fn(),
    create: vi.fn(),
    parseMasterExcelFile: vi.fn(),
}));

vi.mock("@/services/master.service", () => ({
    masterService: {
        fetchOptions: mocks.fetchOptions,
        fetchList: mocks.fetchList,
        create: mocks.create,
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
        notifyError: vi.fn(),
    }),
}));

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("useMasterForm", () => {
    beforeEach(() => {
        mocks.fetchOptions.mockResolvedValue([]);
        mocks.fetchList.mockResolvedValue({ items: [] });
        mocks.create.mockResolvedValue({ data: { id: "created-1" } });
        mocks.parseMasterExcelFile.mockResolvedValue([]);
    });

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
});
