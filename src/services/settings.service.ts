import type { ApiResponse } from "@/lib/api/response";
import { normalizePaginationItems } from "@/lib/api/normalizers";
import type { ApiPaginatedResult } from "@/lib/api/response";
import {
    settingsApi,
    type SettingsKey,
    type SettingsRecord,
} from "@/api/feature/settings.api";

export type { SettingsKey };

interface PaginatedResponse {
    items?: SettingsRecord[];
    data?: SettingsRecord[];
}

export const settingsService = {
    async fetchList(
        key: SettingsKey,
        params?: Record<string, unknown>,
    ): Promise<ApiPaginatedResult<SettingsRecord>> {
        const response = await settingsApi.fetchList(key, params);
        const items = normalizePaginationItems<SettingsRecord>(
            response as ApiResponse<{ items?: SettingsRecord[] }>,
        );
        return {
            items,
            meta: response.meta as unknown as ApiPaginatedResult<SettingsRecord>["meta"],
        };
    },

    async getAppMenus(appId: string): Promise<SettingsRecord[]> {
        const response = await settingsApi.getAppMenus(appId);
        const resData = (response as unknown as { data?: SettingsRecord[] })
            .data;
        if (resData && Array.isArray(resData)) return resData;
        const res = response as unknown as PaginatedResponse;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (Array.isArray(response)) return response;
        return [];
    },

    async get(key: SettingsKey, id: string): Promise<SettingsRecord> {
        const response = await settingsApi.get(key, id);
        return (
            (response as unknown as { data: SettingsRecord }).data ||
            (response as unknown as SettingsRecord)
        );
    },

    async create(
        key: SettingsKey,
        payload: Record<string, unknown>,
    ): Promise<SettingsRecord> {
        const response = await settingsApi.create(key, payload);
        return (
            (response as unknown as { data: SettingsRecord }).data ||
            (response as unknown as SettingsRecord)
        );
    },

    async update(
        key: SettingsKey,
        id: string,
        payload: Record<string, unknown>,
    ): Promise<SettingsRecord> {
        const response = await settingsApi.update(key, id, payload);
        return (
            (response as unknown as { data: SettingsRecord }).data ||
            (response as unknown as SettingsRecord)
        );
    },

    async getAppMenuTree(appId: string): Promise<SettingsRecord[]> {
        const response = await settingsApi.getAppMenuTree(appId);
        // Sometimes backend wraps array in { data: [...] }
        const resData = (response as unknown as { data?: SettingsRecord[] })
            .data;
        if (resData && Array.isArray(resData)) {
            return resData;
        }
        if (Array.isArray(response)) {
            return response;
        }
        return [];
    },
};
