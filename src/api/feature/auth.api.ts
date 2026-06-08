import { apiRequest, type ApiRequestConfig } from "@/lib/api/client";
import type { AuthProfile, RegisterPayload } from "@/services/auth.service";

export const authApi = {
    getMe(config?: Partial<ApiRequestConfig>) {
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

        return apiRequest<AuthProfile>(requestConfig);
    },

    syncAuthContext(config?: Partial<ApiRequestConfig>) {
        const requestConfig: ApiRequestConfig = {
            url: "/auth/sync",
            method: "post",
        };

        if (config) {
            Object.assign(requestConfig, config);
        }

        return apiRequest<AuthProfile>(requestConfig);
    },

    register(payload: RegisterPayload) {
        return apiRequest({
            url: "/auth/register",
            method: "post",
            data: payload,
        });
    },
};
