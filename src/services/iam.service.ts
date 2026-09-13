import { iamApi, type IamRecord } from "@/api/feature/iam.api";

interface PaginatedResponse {
    items?: IamRecord[];
    data?: IamRecord[];
}

export const iamService = {
    // --- Roles ---
    async getRoles(): Promise<IamRecord[]> {
        const response = await iamApi.getRoles();
        const res = response as unknown as PaginatedResponse;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (res.data && Array.isArray(res.data)) return res.data;
        if (Array.isArray(response)) return response;
        return [];
    },

    async getRole(id: string): Promise<IamRecord> {
        const response = await iamApi.getRole(id);
        const res = response as unknown as { data?: IamRecord };
        return res.data || (response as unknown as IamRecord);
    },

    async createRole(payload: {
        companyId: string;
        code: string;
        name: string;
    }): Promise<IamRecord> {
        const response = await iamApi.createRole(payload);
        const res = response as unknown as { data?: IamRecord };
        return res.data || (response as unknown as IamRecord);
    },

    async updateRole(
        id: string,
        payload: { name?: string },
    ): Promise<IamRecord> {
        const response = await iamApi.updateRole(id, payload);
        const res = response as unknown as { data?: IamRecord };
        return res.data || (response as unknown as IamRecord);
    },

    async assignMenuToRole(
        roleId: string,
        menuId: string,
        permissions?: {
            canCreate?: boolean;
            canUpdate?: boolean;
            canDelete?: boolean;
        },
    ): Promise<IamRecord> {
        const response = await iamApi.assignMenuToRole(
            roleId,
            menuId,
            permissions,
        );
        const res = response as unknown as { data?: IamRecord };
        return res.data || (response as unknown as IamRecord);
    },

    async removeMenuFromRole(
        roleId: string,
        menuId: string,
    ): Promise<IamRecord> {
        const response = await iamApi.removeMenuFromRole(roleId, menuId);
        const res = response as unknown as { data?: IamRecord };
        return res.data || (response as unknown as IamRecord);
    },

    async getRoleMenus(roleId: string): Promise<IamRecord[]> {
        const response = await iamApi.getRoleMenus(roleId);
        const res = response as unknown as PaginatedResponse;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (res.data && Array.isArray(res.data)) return res.data;
        if (Array.isArray(response)) return response;
        return [];
    },

    // --- Users ---
    async getUsers(): Promise<IamRecord[]> {
        const response = await iamApi.getUsers();
        const res = response as unknown as PaginatedResponse;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (res.data && Array.isArray(res.data)) return res.data;
        if (Array.isArray(response)) return response;
        return [];
    },

    async getUser(id: string): Promise<IamRecord> {
        const response = await iamApi.getUser(id);
        const res = response as unknown as { data?: IamRecord };
        return res.data || (response as unknown as IamRecord);
    },

    // --- User Roles ---
    async assignUserRole(
        userId: string,
        roleId: string,
        companyId?: string,
    ): Promise<IamRecord> {
        const response = await iamApi.assignUserRole(userId, roleId, companyId);
        const res = response as unknown as { data?: IamRecord };
        return res.data || (response as unknown as IamRecord);
    },

    async removeUserRole(
        userId: string,
        roleId: string,
        companyId?: string,
    ): Promise<IamRecord> {
        const response = await iamApi.removeUserRole(userId, roleId, companyId);
        const res = response as unknown as { data?: IamRecord };
        return res.data || (response as unknown as IamRecord);
    },

    // --- User Warehouses ---
    async assignUserWarehouse(
        userId: string,
        warehouseId: string,
    ): Promise<IamRecord> {
        const response = await iamApi.assignUserWarehouse(userId, warehouseId);
        const res = response as unknown as { data?: IamRecord };
        return res.data || (response as unknown as IamRecord);
    },

    async removeUserWarehouse(
        userId: string,
        warehouseId: string,
    ): Promise<IamRecord> {
        const response = await iamApi.removeUserWarehouse(userId, warehouseId);
        const res = response as unknown as { data?: IamRecord };
        return res.data || (response as unknown as IamRecord);
    },

    // --- User Companies ---
    async assignUserCompany(
        userId: string,
        companyId: string,
        isPrimary?: boolean,
    ): Promise<IamRecord> {
        const response = await iamApi.assignUserCompany(
            userId,
            companyId,
            isPrimary,
        );
        const res = response as unknown as { data?: IamRecord };
        return res.data || (response as unknown as IamRecord);
    },
};
