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

    forgotPassword(email: string) {
        return apiRequest({
            url: "/auth/forgot-password",
            method: "post",
            data: { email },
        });
    },

    resetPassword(accessToken: string, password: string) {
        return apiRequest({
            url: "/auth/reset-password",
            method: "post",
            data: { accessToken, password },
            // An invalid/expired recovery token 401s for reasons unrelated to
            // the current (guest) session, so this flow owns its own error
            // handling instead of the global interceptor's redirect-to-login.
            skipAuthErrorHandling: true,
        });
    },
};
