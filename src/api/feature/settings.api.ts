import { apiRequest } from "@/lib/api/client";

export type SettingsKey = "companies" | "apps" | "menus";
export type SettingsRecord = Record<string, unknown>;

export const settingsApi = {
    fetchList(key: SettingsKey, params?: Record<string, unknown>) {
        return apiRequest({
            url: `/settings/${key}`,
            method: "get",
            params: {
                page: 1,
                limit: 50,
                ...params,
            },
        });
    },

    getAppMenus(appId: string) {
        return apiRequest<SettingsRecord>({
            url: `/settings/menus/app/${appId}`,
            method: "get",
        });
    },

    get(key: SettingsKey, id: string) {
        return apiRequest<SettingsRecord>({
            url: `/settings/${key}/${id}`,
            method: "get",
        });
    },

    create(key: SettingsKey, payload: Record<string, unknown>) {
        return apiRequest<SettingsRecord>({
            url: `/settings/${key}`,
            method: "post",
            data: payload,
        });
    },

    update(key: SettingsKey, id: string, payload: Record<string, unknown>) {
        return apiRequest<SettingsRecord>({
            url: `/settings/${key}/${id}`,
            method: "patch",
            data: payload,
        });
    },

    getAppMenuTree(appId: string) {
        return apiRequest<SettingsRecord[]>({
            url: `/settings/menus/app/${appId}/tree`,
            method: "get",
        });
    },
};
