import { create } from 'zustand';
import { User } from '@/domain/models/User';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // @ts-expect-error - Supabase type inference issue, Database type is correct
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userData && !userError) {
        set({
          user: new User({
            id: userData.id,
            username: userData.username,
            publicKey: userData.public_key || undefined,
            createdAt: new Date(userData.created_at),
            updatedAt: new Date(userData.updated_at),
          }),
          session: data.session,
        });
      }
    }
  },

  signUp: async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Create user profile
      // @ts-expect-error - Supabase type inference issue, Database type is correct
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // @ts-expect-error - Supabase type inference issue, Database type is correct
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userData && !userError) {
        set({
          user: new User({
            id: userData.id,
            username: userData.username,
            publicKey: userData.public_key || undefined,
            createdAt: new Date(userData.created_at),
            updatedAt: new Date(userData.updated_at),
          }),
          session: data.session,
        });
      }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  setUser: (user: User | null) => set({ user }),
  setSession: (session: any | null) => set({ session }),
}));
