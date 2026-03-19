import { create } from 'zustand';
import { User } from '@/domain/models/User';
import { supabase } from '@/lib/supabase';
import {
  generateKeyPair,
  storePrivateKey,
  toBase64,
  checkPasswordStrength,
} from '@/services/CryptoService';
import { KeyManager } from '@/services/KeyManager';

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'email-unconfirmed';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  // Keep legacy `loading` boolean for ProtectedRoute compatibility
  loading: boolean;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setStatus: (status: AuthStatus) => void;
}

function userFromData(data: {
  id: string;
  username: string;
  public_key: string | null;
  created_at: string;
  updated_at: string;
}): User {
  return new User({
    id: data.id,
    username: data.username,
    publicKey: data.public_key ?? undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'loading',
  loading: true,

  setUser: (user) => set({ user }),
  setStatus: (status) =>
    set({ status, loading: status === 'loading' }),

  signIn: async (email, password) => {
    set({ status: 'loading', loading: true });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (!data.session) {
      // Email not confirmed yet
      set({ status: 'email-unconfirmed', loading: false });
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) throw userError ?? new Error('User profile not found');

    // Initialize key manager with user's stored private key
    const km = KeyManager.getInstance();
    const keyLoaded = await km.initialize(data.user.id, password);
    if (!keyLoaded) {
      console.warn(
        '[Auth] Private key not found in localStorage. ' +
        'This can happen if the user logged in on a new device. ' +
        'Key exchange will be unavailable until the private key is recovered.'
      );
    }

    set({
      user: userFromData(userData),
      status: 'authenticated',
      loading: false,
    });
  },

  signUp: async (email, password, username) => {
    // Password strength check
    const strength = checkPasswordStrength(password);
    if (!strength.isValid) {
      throw new Error(`Password too weak: ${strength.feedback.join(', ')}`);
    }

    set({ status: 'loading', loading: true });

    // 1. Generate X25519 keypair
    const { publicKey, privateKey } = generateKeyPair();
    const publicKeyB64 = toBase64(publicKey);

    // 2. Create Supabase auth user
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('Signup failed: no user returned');

    // 3. Create user profile with public key
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      username,
      public_key: publicKeyB64,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (profileError) throw profileError;

    // 4. Store private key encrypted in localStorage
    await storePrivateKey(data.user.id, privateKey, password);

    // 5. Check if session exists (email confirmation may be required)
    if (!data.session) {
      set({ status: 'email-unconfirmed', loading: false });
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userData) {
      const km = KeyManager.getInstance();
      await km.initialize(data.user.id, password);

      set({
        user: userFromData(userData),
        status: 'authenticated',
        loading: false,
      });
    } else {
      set({ status: 'email-unconfirmed', loading: false });
    }
  },

  signOut: async () => {
    KeyManager.getInstance().clear();
    await supabase.auth.signOut();
    set({ user: null, status: 'unauthenticated', loading: false });
  },
}));
