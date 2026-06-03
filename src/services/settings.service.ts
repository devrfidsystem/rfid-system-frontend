import { apiRequest } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/response";
import { normalizePaginationItems } from "@/lib/api/normalizers";
import type { ApiPaginatedResult } from "@/lib/api/response";

export type SettingsKey = "companies" | "apps" | "menus";

export const settingsService = {
    async fetchList(
        key: SettingsKey,
        params?: Record<string, any>,
    ): Promise<ApiPaginatedResult<any>> {
        const response = await apiRequest({
            url: `/settings/${key}`,
            method: "get",
            params: {
                page: 1,
                limit: 50,
                ...params,
            },
        });
        const items = normalizePaginationItems<any>(
            response as ApiResponse<{ items?: any[] }>,
        );
        return { items, meta: response.meta };
    },

    async getAppMenus(appId: string): Promise<any[]> {
        const response = await apiRequest<any>({
            url: `/settings/menus/app/${appId}`,
            method: "get",
        });
        if (response.data && Array.isArray(response.data)) return response.data;
        const res = response as any;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (Array.isArray(response)) return response;
        return [];
    },

    async get(key: SettingsKey, id: string): Promise<any> {
        const response = await apiRequest<any>({
            url: `/settings/${key}/${id}`,
            method: "get",
        });
        return response.data;
    },

    async create(key: SettingsKey, payload: any): Promise<any> {
        const response = await apiRequest<any>({
            url: `/settings/${key}`,
            method: "post",
            data: payload,
        });
        return response.data;
    },

    async update(key: SettingsKey, id: string, payload: any): Promise<any> {
        const response = await apiRequest<any>({
            url: `/settings/${key}/${id}`,
            method: "patch",
            data: payload,
        });
        return response.data;
    },

    async getAppMenuTree(appId: string): Promise<any[]> {
        const response = await apiRequest<any[]>({
            url: `/settings/menus/app/${appId}/tree`,
            method: "get",
        });
        // Sometimes backend wraps array in { data: [...] }
        if (response.data && Array.isArray(response.data)) {
            return response.data;
        }
        if (Array.isArray(response)) {
            return response;
        }
        return [];
    },
};
