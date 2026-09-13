import { defineStore } from "pinia";
import type { AxiosError } from "axios";
import { authService, type AuthProfile } from "@/services/auth.service";
import { sessionService } from "@/services/session.service";

interface AuthState {
    profile: AuthProfile | null;
    session: string | null;
    loading: boolean;
    initialized: boolean;
}

interface LoadProfileOptions {
    skipLoadingIndicator?: boolean;
}

let initializationPromise: Promise<void> | null = null;

export const useAuthStore = defineStore("auth", {
    state: (): AuthState => ({
        profile: null,
        session: null,
        loading: false,
        initialized: false,
    }),
    getters: {
        isAuthenticated: (state) => Boolean(state.session && state.profile),
        user: (state) => state.profile?.user ?? null,
        menuTree: (state) => state.profile?.menuTree ?? [],
        permissions: (state) => state.profile?.permissions ?? [],
        currentCompanyId: (state) => state.profile?.currentCompanyId ?? null,
    },
    actions: {
        setSession(session: string | null) {
            this.session = session;
        },

        setProfile(profile: AuthProfile | null) {
            this.profile = profile;
        },

        async loadProfile(
            options?: LoadProfileOptions,
        ): Promise<AuthProfile | null> {
            if (!options?.skipLoadingIndicator) {
                this.loading = true;
            }
            try {
                const profile = await authService.getAuthMe({
                    skipAuthErrorHandling: true,
                });
                this.profile = profile;
                return this.profile;
            } catch (error) {
                if (
                    isUnauthorizedError(error) &&
                    (await this.attemptTokenRefresh())
                ) {
                    return this.loadProfile(options);
                }
                if (isNotModifiedResponse(error)) {
                    return this.profile;
                }
                this.profile = null;
                return null;
            } finally {
                if (!options?.skipLoadingIndicator) {
                    this.loading = false;
                }
                this.initialized = true;
            }
        },

        async syncProfile(
            options?: LoadProfileOptions,
        ): Promise<AuthProfile | null> {
            if (!options?.skipLoadingIndicator) {
                this.loading = true;
            }
            try {
                const profile = await authService.syncAuthContext({
                    skipAuthErrorHandling: true,
                });
                this.profile = profile;
                return this.profile;
            } catch (error) {
                if (
                    isUnauthorizedError(error) &&
                    (await this.attemptTokenRefresh())
                ) {
                    return this.syncProfile(options);
                }
                this.clearProfile();
                throw error;
            } finally {
                if (!options?.skipLoadingIndicator) {
                    this.loading = false;
                }
                this.initialized = true;
            }
        },

        async initializeAuth(): Promise<void> {
            if (this.initialized && !initializationPromise) {
                return;
            }
            if (initializationPromise) {
                return initializationPromise;
            }

            initializationPromise = (async () => {
                try {
                    const session = await sessionService.getSession();
                    this.setSession(session);
                    if (session) {
                        await this.loadProfile({ skipLoadingIndicator: true });
                    } else {
                        this.clearProfile();
                    }
                } catch (error) {
                    this.clearProfile();
                    throw error;
                } finally {
                    this.initialized = true;
                    initializationPromise = null;
                }
            })();

            return initializationPromise;
        },

        async logout(): Promise<void> {
            this.loading = true;
            try {
                await sessionService.signOut();
                this.clearProfile();
            } finally {
                this.loading = false;
            }
        },

        async attemptTokenRefresh(): Promise<boolean> {
            if (!this.session) {
                return false;
            }

            try {
                const refreshed = await sessionService.refreshSession();
                if (refreshed) {
                    this.setSession(refreshed.accessToken);
                    return true;
                }
            } catch {
                await sessionService.signOut();
                this.clearProfile();
            }

            return false;
        },

        setCurrentCompany(companyId: string) {
            if (!this.profile) {
                return;
            }
            this.profile = {
                ...this.profile,
                currentCompanyId: companyId,
            };
        },

        clearProfile() {
            this.session = null;
            this.profile = null;
            this.loading = false;
            this.initialized = true;
        },
    },
});

const isUnauthorizedError = (error: unknown): boolean => {
    if (!error || typeof error !== "object") {
        return false;
    }
    const axiosError = error as AxiosError;
    return axiosError.response?.status === 401;
};

const isNotModifiedResponse = (error: unknown): boolean => {
    if (!error || typeof error !== "object") {
        return false;
    }
    const axiosError = error as AxiosError;
    return axiosError.response?.status === 304;
};
