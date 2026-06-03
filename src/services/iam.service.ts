import { apiRequest } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/response";

export const iamService = {
    // --- Roles ---
    async getRoles(): Promise<any[]> {
        const response = await apiRequest<any[]>({
            url: "/iam/roles",
            method: "get",
        });
        const res = response as any;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (res.data && Array.isArray(res.data)) return res.data;
        if (Array.isArray(response)) return response;
        return [];
    },

    async getRole(id: string): Promise<any> {
        const response = await apiRequest<any>({
            url: `/iam/roles/${id}`,
            method: "get",
        });
        return response.data || response;
    },

    async createRole(payload: {
        name: string;
        description?: string;
    }): Promise<any> {
        const response = await apiRequest<any>({
            url: "/iam/roles",
            method: "post",
            data: payload,
        });
        return response.data;
    },

    async updateRole(
        id: string,
        payload: { name?: string; description?: string },
    ): Promise<any> {
        const response = await apiRequest<any>({
            url: `/iam/roles/${id}`,
            method: "patch",
            data: payload,
        });
        return response.data;
    },

    async assignMenuToRole(roleId: string, menuId: string): Promise<any> {
        const response = await apiRequest<any>({
            url: `/iam/roles/${roleId}/menus`,
            method: "post",
            data: { menuId },
        });
        return response.data;
    },

    async removeMenuFromRole(roleId: string, menuId: string): Promise<any> {
        const response = await apiRequest<any>({
            url: `/iam/roles/${roleId}/menus/${menuId}`,
            method: "delete",
        });
        return response.data;
    },

    // --- Users ---
    async getUsers(): Promise<any[]> {
        const response = await apiRequest<any[]>({
            url: "/users",
            method: "get",
            params: { limit: 100 },
        });
        const res = response as any;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (res.data && Array.isArray(res.data)) return res.data;
        if (Array.isArray(response)) return response;
        return [];
    },

    async getUser(id: string): Promise<any> {
        const response = await apiRequest<any>({
            url: `/users/${id}`,
            method: "get",
        });
        return response.data || response;
    },

    // --- User Roles ---
    async assignUserRole(
        userId: string,
        roleId: string,
        companyId?: string,
    ): Promise<any> {
        const response = await apiRequest<any>({
            url: "/iam/users/roles",
            method: "post",
            data: { userId, roleId, companyId },
        });
        return response.data;
    },

    async removeUserRole(
        userId: string,
        roleId: string,
        companyId?: string,
    ): Promise<any> {
        const response = await apiRequest<any>({
            url: `/iam/users/${userId}/roles/${roleId}`,
            method: "delete",
            params: companyId ? { companyId } : undefined,
        });
        return response.data;
    },

    // --- User Warehouses ---
    async assignUserWarehouse(
        userId: string,
        warehouseId: string,
    ): Promise<any> {
        const response = await apiRequest<any>({
            url: "/iam/users/warehouses",
            method: "post",
            data: { userId, warehouseId },
        });
        return response.data;
    },

    async removeUserWarehouse(
        userId: string,
        warehouseId: string,
    ): Promise<any> {
        const response = await apiRequest<any>({
            url: `/iam/users/${userId}/warehouses/${warehouseId}`,
            method: "delete",
        });
        return response.data;
    },

    // --- User Companies ---
    async assignUserCompany(
        userId: string,
        companyId: string,
        isPrimary?: boolean,
    ): Promise<any> {
        const response = await apiRequest<any>({
            url: "/iam/users/companies",
            method: "post",
            data: { userId, companyId, isPrimary },
        });
        return response.data;
    },
};
