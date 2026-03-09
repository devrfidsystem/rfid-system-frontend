import { defineStore } from 'pinia';
import type { Session } from '@supabase/supabase-js';
import { authService, type AuthProfile } from '@/services/auth';
import { sessionService } from '@/services/session';

interface AuthState {
  profile: AuthProfile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

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

    async loadProfile(): Promise<AuthProfile | null> {
      this.loading = true;
      try {
        const response = await authService.getAuthMe();
        this.profile = response.data;
        return this.profile;
      } catch {
        this.profile = null;
        return null;
      } finally {
        this.loading = false;
        this.initialized = true;
      }
    },

    async initializeFromSession(session: Session | null): Promise<AuthProfile | null> {
      this.setSession(session);
      if (session) {
        return await this.loadProfile();
      }
      this.clearProfile();
      return null;
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

    clearProfile() {
      this.session = null;
      this.profile = null;
      this.loading = false;
      this.initialized = true;
    }
  }
});
