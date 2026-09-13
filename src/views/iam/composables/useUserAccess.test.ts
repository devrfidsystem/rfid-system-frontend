import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
    getRolesSpy: vi.fn(),
    getUsersSpy: vi.fn(),
    getUserSpy: vi.fn(),
    removeUserRoleSpy: vi.fn(),
    removeUserWarehouseSpy: vi.fn(),
    assignUserRoleSpy: vi.fn(),
    assignUserWarehouseSpy: vi.fn(),
    assignUserCompanySpy: vi.fn(),
    fetchListSpy: vi.fn(),
    notifyErrorSpy: vi.fn(),
    withToastSpy: vi.fn(async (action: () => Promise<void>) => action()),
}));

vi.mock("@/services/iam.service", () => ({
    iamService: {
        getRoles: mocks.getRolesSpy,
        getUsers: mocks.getUsersSpy,
        getUser: mocks.getUserSpy,
        removeUserRole: mocks.removeUserRoleSpy,
        removeUserWarehouse: mocks.removeUserWarehouseSpy,
        assignUserRole: mocks.assignUserRoleSpy,
        assignUserWarehouse: mocks.assignUserWarehouseSpy,
        assignUserCompany: mocks.assignUserCompanySpy,
    },
}));

vi.mock("@/services/master.service", () => ({
    masterService: {
        fetchList: mocks.fetchListSpy,
    },
}));

vi.mock("@/services/settings.service", () => ({
    settingsService: {
        fetchList: vi.fn(),
    },
}));

vi.mock("@/composable/useNotifier", () => ({
    useNotifier: () => ({
        withToast: mocks.withToastSpy,
        notifyError: mocks.notifyErrorSpy,
    }),
}));

vi.mock("@/store/auth.store", () => ({
    useAuthStore: () => ({ currentCompanyId: "company-1" }),
}));

describe("useUserAccess", () => {
    beforeEach(() => {
        mocks.getRolesSpy.mockResolvedValue([]);
        mocks.getUsersSpy.mockResolvedValue([]);
        mocks.getUserSpy.mockResolvedValue({
            roles: [{ id: "role-1", name: "Picker" }],
            warehouses: [{ id: "wh-1", warehouseId: "wh-1", name: "Main" }],
            companies: [],
        });
        mocks.fetchListSpy.mockResolvedValue({ items: [] });
        mocks.removeUserRoleSpy.mockResolvedValue(undefined);
        mocks.removeUserWarehouseSpy.mockResolvedValue(undefined);
        mocks.assignUserRoleSpy.mockResolvedValue(undefined);
        mocks.assignUserWarehouseSpy.mockResolvedValue(undefined);
        mocks.assignUserCompanySpy.mockResolvedValue(undefined);
        mocks.notifyErrorSpy.mockReset();
        mocks.withToastSpy.mockImplementation(
            async (action: () => Promise<void>) => action(),
        );
    });

    it("opens a confirmation dialog before removing a role", async () => {
        const { useUserAccess } = await import("./useUserAccess");
        const access = useUserAccess();

        access.selectedUserId.value = "user-1";
        access.openRemoveRoleConfirm("role-1", "Picker");

        expect(access.confirmation.value).toMatchObject({
            action: "remove-role",
            title: "Remove Role",
            confirmText: "Remove",
            cancelText: "Back",
            variant: "danger",
            subjectId: "role-1",
        });

        await access.confirmRemoval();

        expect(mocks.removeUserRoleSpy).toHaveBeenCalledWith(
            "user-1",
            "role-1",
        );
        expect(access.confirmation.value).toBeNull();
    });

    it("opens a confirmation dialog before removing warehouse access", async () => {
        const { useUserAccess } = await import("./useUserAccess");
        const access = useUserAccess();

        access.selectedUserId.value = "user-1";
        access.openRemoveWarehouseConfirm("wh-1", "Main");

        expect(access.confirmation.value).toMatchObject({
            action: "remove-warehouse",
            title: "Remove Warehouse Access",
            confirmText: "Remove",
            cancelText: "Back",
            variant: "danger",
            subjectId: "wh-1",
        });

        await access.confirmRemoval();

        expect(mocks.removeUserWarehouseSpy).toHaveBeenCalledWith(
            "user-1",
            "wh-1",
        );
        expect(access.confirmation.value).toBeNull();
    });

    it("assigns a role with the current company id", async () => {
        const { useUserAccess } = await import("./useUserAccess");
        const access = useUserAccess();

        access.selectedUserId.value = "user-1";
        access.selectedRole.value = "role-1";

        await access.addRole();

        expect(mocks.assignUserRoleSpy).toHaveBeenCalledWith(
            "user-1",
            "role-1",
            "company-1",
        );
    });
});
