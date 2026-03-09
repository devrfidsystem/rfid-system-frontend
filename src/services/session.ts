import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export interface SignInPayload {
  email: string;
  password: string;
}

export const sessionService = {
  async signInWithPassword(payload: SignInPayload): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password
    });

    if (error) {
      throw error;
    }

    if (!data.session) {
      throw new Error('Unable to establish Supabase session');
    }

    return data.session;
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }
};
