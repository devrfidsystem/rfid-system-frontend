import { type ApiRequestConfig } from "@/lib/api/client";
import { sessionService } from "@/services/session.service";
import { authApi } from "@/api/feature/auth.api";

export interface AuthUser {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    phone: string | null;
}

export interface Company {
    companyId: string;
    companyName: string;
    isPrimary: boolean;
}

export interface Role {
    id: string;
    code: string;
    name: string;
}

export interface Warehouse {
    id: string;
    code: string;
    name: string;
}

export interface MenuActionPermissions {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}

export interface Permission {
    menuId: string;
    menuCode: string;
    menuName: string;
    actions: MenuActionPermissions;
}

export interface MenuTreeNode {
    id: string;
    code: string;
    name: string;
    path: string | null;
    parentId: string | null;
    sortOrder?: number;
    sort_order?: number;
    icon: string | null;
    permissions: MenuActionPermissions;
    children: MenuTreeNode[];
}

export interface AuthProfile {
    user: AuthUser;
    isActive: boolean;
    currentCompanyId: string | null;
    companies: Company[];
    roles: Role[];
    warehouses: Warehouse[];
    permissions: Permission[];
    menuTree: MenuTreeNode[];
}

export interface RegisterPayload {
    fullName: string;
    companyName: string;
    email: string;
    password: string;
}

export const authService = {
    async getAuthMe(config?: Partial<ApiRequestConfig>): Promise<AuthProfile> {
        await sessionService.getSession();
        const response = await authApi.getMe(config);
        return response.data;
    },

    async syncAuthContext(
        config?: Partial<ApiRequestConfig>,
    ): Promise<AuthProfile> {
        const response = await authApi.syncAuthContext(config);
        return response.data;
    },

    async register(payload: RegisterPayload): Promise<void> {
        await authApi.register(payload);
    },

    async forgotPassword(email: string): Promise<void> {
        await authApi.forgotPassword(email);
    },

    async resetPassword(accessToken: string, password: string): Promise<void> {
        await authApi.resetPassword(accessToken, password);
    },
};
