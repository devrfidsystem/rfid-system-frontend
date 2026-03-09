import { defineStore } from 'pinia';
import type { AxiosError } from 'axios';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { authService, type AuthProfile } from '@/services/auth';
import { sessionService } from '@/services/session';

interface AuthState {
  profile: AuthProfile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

interface LoadProfileOptions {
  skipLoadingIndicator?: boolean;
}

let initializationPromise: Promise<void> | null = null;
let authStateChangeUnsubscribe: (() => void) | null = null;

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    profile: null,
    session: null,
    loading: false,
    initialized: false
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.session && state.profile)
  },
  actions: {
    setSession(session: Session | null) {
      this.session = session;
    },

    async loadProfile(options?: LoadProfileOptions): Promise<AuthProfile | null> {
      if (!options?.skipLoadingIndicator) {
        this.loading = true;
      }
      try {
        const response = await authService.getAuthMe({ skipAuthErrorHandling: true });
        this.profile = response.data;
        return this.profile;
      } catch (error) {
        if (isUnauthorizedError(error) && (await this.attemptTokenRefresh())) {
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

    async initializeAuth(): Promise<void> {
      if (this.initialized && !initializationPromise) {
        return;
      }
      if (initializationPromise) {
        return initializationPromise;
      }

      initializationPromise = (async () => {
        try {
          ensureAuthStateListener(this);
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
          this.setSession(refreshed);
          return true;
        }
      } catch {
        await sessionService.signOut();
        this.clearProfile();
      }

      return false;
    },

    clearProfile() {
      this.session = null;
      this.profile = null;
      this.loading = false;
      this.initialized = true;
    }
  }
});

const isUnauthorizedError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const axiosError = error as AxiosError;
  return axiosError.response?.status === 401;
};

const isNotModifiedResponse = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const axiosError = error as AxiosError;
  return axiosError.response?.status === 304;
};

type AuthStore = ReturnType<typeof useAuthStore>;

function ensureAuthStateListener(store: AuthStore) {
  if (authStateChangeUnsubscribe) {
    return;
  }

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
      store.setSession(null);
      store.clearProfile();
      return;
    }

    if (!session) {
      return;
    }

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'PASSWORD_RECOVERY') {
      store.setSession(session);
      void store.loadProfile({ skipLoadingIndicator: true });
    }
  });

  if (!data?.subscription) {
    return;
  }

  authStateChangeUnsubscribe = () => {
    data.subscription.unsubscribe();
    authStateChangeUnsubscribe = null;
  };
}
