import type { AuthProfile } from "./auth.service";
import { sessionApi } from "@/api/feature/session.api";

export interface SignInPayload {
    email: string;
    password: string;
}

export interface AuthLoginResponseDto {
    accessToken: string;
    refreshToken: string;
    profile: AuthProfile;
}

export const sessionService = {
    async signInWithPassword(
        payload: SignInPayload,
    ): Promise<AuthLoginResponseDto> {
        const resp = await sessionApi.login(payload);

        if (!resp.data) {
            throw new Error("No data in login response");
        }

        localStorage.setItem("access_token", resp.data.accessToken);
        localStorage.setItem("refresh_token", resp.data.refreshToken);
        return resp.data;
    },

    async signOut(): Promise<void> {
        try {
            await sessionApi.logout();
        } finally {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
        }
    },

    async refreshSession(): Promise<AuthLoginResponseDto | null> {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) return null;

        try {
            const resp = await sessionApi.refresh(refreshToken);

            if (resp.data) {
                localStorage.setItem("access_token", resp.data.accessToken);
                localStorage.setItem("refresh_token", resp.data.refreshToken);
                return resp.data;
            }
            return null;
        } catch {
            return null;
        }
    },

    async getSession(): Promise<string | null> {
        return localStorage.getItem("access_token");
    },
};
