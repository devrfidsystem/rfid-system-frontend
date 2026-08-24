import { beforeEach, describe, expect, it, vi } from "vitest";
import pageSource from "../OpnameCreatePage.vue?raw";

const mocks = vi.hoisted(() => ({
    routeQuery: {} as Record<string, string>,
    pushSpy: vi.fn(),
    createSpy: vi.fn(),
    createChildSpy: vi.fn(),
    updateSpy: vi.fn(),
    getDetailSpy: vi.fn(),
    getTreeSpy: vi.fn(),
    listLocationsSpy: vi.fn(),
    listUsersSpy: vi.fn(),
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
        update: mocks.updateSpy,
        getDetail: mocks.getDetailSpy,
    },
}));

vi.mock("@/services/location.service", () => ({
    locationService: {
        list: mocks.listLocationsSpy,
    },
}));

vi.mock("@/services/users.service", () => ({
    usersService: {
        list: mocks.listUsersSpy,
    },
}));

describe("useOpnameCreate", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.routeQuery = {};
        mocks.listLocationsSpy.mockResolvedValue({
            data: {
                items: [
                    {
                        id: "rack-a",
                        parentId: "floor-a",
                        code: "RA",
                        name: "Rack A",
                        epc: "EPC-A",
                    },
                ],
            },
        });
        mocks.listUsersSpy.mockResolvedValue({
            items: [{ id: "user-7", fullName: "Wilson" }],
        });
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
        create.formState.title = "Rack Count";
        create.formState.assignedToId = "user-7";
        create.formState.assignedAt = "2026-06-20";
        create.formState.deadlineAt = "2026-06-30";
        create.locationIds.value = ["rack-a"];

        await create.saveNode();

        expect(mocks.createChildSpy).toHaveBeenCalledWith(
            "profile-1",
            expect.objectContaining({
                companyId: "company-1",
                warehouseId: "wh-1",
                title: "Rack Count",
                parentId: "profile-1",
                nodeType: "task",
                locationIds: ["rack-a"],
                assignedToId: "user-7",
                assignedAt: "2026-06-20",
                deadlineAt: "2026-06-30",
            }),
        );
        expect(mocks.createChildSpy.mock.calls[0]?.[1]).not.toHaveProperty(
            "docNumber",
        );
    });
});
