import { apiRequest } from "@/lib/api/client";
import type {
    SignInPayload,
    AuthLoginResponseDto,
} from "@/services/session.service";

export const sessionApi = {
    login(payload: SignInPayload) {
        return apiRequest<AuthLoginResponseDto>({
            url: "/auth/login",
            method: "POST",
            data: payload,
        });
    },

    logout() {
        return apiRequest({
            url: "/auth/logout",
            method: "POST",
        });
    },

    refresh(refreshToken: string) {
        return apiRequest<AuthLoginResponseDto>({
            url: "/auth/refresh",
            method: "POST",
            data: { refreshToken },
            skipAuthErrorHandling: true,
        });
    },
};
