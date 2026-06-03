import { apiRequest, type ApiRequestConfig } from "@/lib/api/client";
import { sessionService } from "@/services/session.service";

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

export const authService = {
    async getAuthMe(config?: Partial<ApiRequestConfig>): Promise<AuthProfile> {
        await sessionService.getSession();

        const cacheHeaders = {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
        };

        const requestConfig: ApiRequestConfig = {
            url: "/auth/me",
            method: "get",
            headers: { ...cacheHeaders },
        };

        if (config) {
            Object.assign(requestConfig, config);
            requestConfig.headers = {
                ...cacheHeaders,
                ...requestConfig.headers,
            };
        }

        const response = await apiRequest<AuthProfile>(requestConfig);
        return response.data;
    },

    async syncAuthContext(
        config?: Partial<ApiRequestConfig>,
    ): Promise<AuthProfile> {
        const requestConfig: ApiRequestConfig = {
            url: "/auth/sync",
            method: "post",
        };

        if (config) {
            Object.assign(requestConfig, config);
        }

        const response = await apiRequest<AuthProfile>(requestConfig);
        return response.data;
    },
};
