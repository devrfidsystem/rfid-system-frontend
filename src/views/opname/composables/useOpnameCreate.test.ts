import { beforeEach, describe, expect, it, vi } from "vitest";
import pageSource from "../OpnameCreatePage.vue?raw";

const mocks = vi.hoisted(() => ({
    routeQuery: {} as Record<string, string>,
    pushSpy: vi.fn(),
    createSpy: vi.fn(),
    createChildSpy: vi.fn(),
    getTreeSpy: vi.fn(),
    notifyErrorSpy: vi.fn(),
    notifySuccessSpy: vi.fn(),
}));

vi.mock("vue-router", () => ({
    useRoute: () => ({ query: mocks.routeQuery }),
    useRouter: () => ({ push: mocks.pushSpy }),
}));

vi.mock("@/store/auth.store", () => ({
    useAuthStore: () => ({ currentCompanyId: "company-1" }),
}));

vi.mock("@/composable/useWarehouseOptions", () => ({
    useWarehouseOptions: () => ({
        options: {
            value: [{ id: "wh-1", code: "WH1", name: "Main Warehouse" }],
        },
    }),
}));

vi.mock("@/composable/useNotifier", () => ({
    useNotifier: () => ({
        notifyError: mocks.notifyErrorSpy,
        notifySuccess: mocks.notifySuccessSpy,
    }),
}));

vi.mock("@/services/opname.service", () => ({
    opnameService: {
        getTree: mocks.getTreeSpy,
        create: mocks.createSpy,
        createChild: mocks.createChildSpy,
    },
}));

describe("useOpnameCreate", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.routeQuery = {};
        mocks.getTreeSpy.mockResolvedValue([
            {
                id: "group-1",
                title: "Quarterly Group",
                nodeType: "group",
                parentId: null,
                children: [
                    {
                        id: "profile-1",
                        title: "January Profile",
                        nodeType: "profile",
                        parentId: "group-1",
                        children: [],
                    },
                ],
            },
        ]);
    });

    it("renders a parent selector on the create page", () => {
        expect(pageSource).toContain("cmb_OpnameCreateParent");
    });

    it("offers group and profile parents for task creation and saves under the selected parent", async () => {
        mocks.routeQuery = { mode: "task", warehouseId: "wh-1" };
        const { useOpnameCreate } = await import("./useOpnameCreate");
        const create = useOpnameCreate();

        await create.loadContext();

        expect(create.parentOptions.value).toEqual([
            { label: "Quarterly Group", value: "group-1" },
            { label: "January Profile", value: "profile-1" },
        ]);

        create.selectedParentId.value = "profile-1";
        create.formState.docNumber = "OPN-TASK-001";
        create.formState.title = "Rack Count";

        await create.saveNode();

        expect(mocks.createChildSpy).toHaveBeenCalledWith(
            "profile-1",
            expect.objectContaining({
                companyId: "company-1",
                warehouseId: "wh-1",
                docNumber: "OPN-TASK-001",
                title: "Rack Count",
                parentId: "profile-1",
                nodeType: "task",
            }),
        );
    });
});
