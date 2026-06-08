import { apiRequest } from "@/lib/api/client";

export type IamRecord = Record<string, unknown>;

export const iamApi = {
    // --- Roles ---
    getRoles() {
        return apiRequest<IamRecord[]>({
            url: "/iam/roles",
            method: "get",
        });
    },

    getRole(id: string) {
        return apiRequest<IamRecord>({
            url: `/iam/roles/${id}`,
            method: "get",
        });
    },

    createRole(payload: { name: string; description?: string }) {
        return apiRequest<IamRecord>({
            url: "/iam/roles",
            method: "post",
            data: payload,
        });
    },

    updateRole(id: string, payload: { name?: string; description?: string }) {
        return apiRequest<IamRecord>({
            url: `/iam/roles/${id}`,
            method: "patch",
            data: payload,
        });
    },

    assignMenuToRole(roleId: string, menuId: string) {
        return apiRequest<IamRecord>({
            url: `/iam/roles/${roleId}/menus`,
            method: "post",
            data: { menuId },
        });
    },

    removeMenuFromRole(roleId: string, menuId: string) {
        return apiRequest<IamRecord>({
            url: `/iam/roles/${roleId}/menus/${menuId}`,
            method: "delete",
        });
    },

    // --- Users ---
    getUsers() {
        return apiRequest<IamRecord[]>({
            url: "/users",
            method: "get",
            params: { limit: 100 },
        });
    },

    getUser(id: string) {
        return apiRequest<IamRecord>({
            url: `/users/${id}`,
            method: "get",
        });
    },

    // --- User Roles ---
    assignUserRole(userId: string, roleId: string, companyId?: string) {
        return apiRequest<IamRecord>({
            url: "/iam/users/roles",
            method: "post",
            data: { userId, roleId, companyId },
        });
    },

    removeUserRole(userId: string, roleId: string, companyId?: string) {
        return apiRequest<IamRecord>({
            url: `/iam/users/${userId}/roles/${roleId}`,
            method: "delete",
            params: companyId ? { companyId } : undefined,
        });
    },

    // --- User Warehouses ---
    assignUserWarehouse(userId: string, warehouseId: string) {
        return apiRequest<IamRecord>({
            url: "/iam/users/warehouses",
            method: "post",
            data: { userId, warehouseId },
        });
    },

    removeUserWarehouse(userId: string, warehouseId: string) {
        return apiRequest<IamRecord>({
            url: `/iam/users/${userId}/warehouses/${warehouseId}`,
            method: "delete",
        });
    },

    // --- User Companies ---
    assignUserCompany(userId: string, companyId: string, isPrimary?: boolean) {
        return apiRequest<IamRecord>({
            url: "/iam/users/companies",
            method: "post",
            data: { userId, companyId, isPrimary },
        });
    },
};
