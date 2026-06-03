import { apiRequest } from "@/lib/api/client";

export interface SignInPayload {
    email: string;
    password: string;
}

export interface AuthLoginResponseDto {
    accessToken: string;
    refreshToken: string;
    profile: unknown;
}

export const sessionService = {
    async signInWithPassword(
        payload: SignInPayload,
    ): Promise<AuthLoginResponseDto> {
        const resp = await apiRequest<AuthLoginResponseDto>({
            url: "/auth/login",
            method: "POST",
            data: payload,
        });

        if (!resp.data) {
            throw new Error("No data in login response");
        }

        localStorage.setItem("access_token", resp.data.accessToken);
        return resp.data;
    },

    async signOut(): Promise<void> {
        try {
            await apiRequest({
                url: "/auth/logout",
                method: "POST",
            });
        } finally {
            localStorage.removeItem("access_token");
        }
    },

    async refreshSession(): Promise<AuthLoginResponseDto | null> {
        // Backend doesn't have a refresh endpoint yet.
        // For now, return null to force re-login if token is expired.
        return null;
    },

    async getSession(): Promise<string | null> {
        return localStorage.getItem("access_token");
    },
};
