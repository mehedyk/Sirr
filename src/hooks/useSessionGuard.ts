/**
 * useSessionGuard — watches for session expiry and notifies the user.
 * Supabase's autoRefreshToken handles silent refresh, but if it fails
 * (offline, token revoked) we catch TOKEN_REFRESHED failures and sign out cleanly.
 */
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';

export function useSessionGuard() {
  const { signOut, status } = useAuthStore();

  useEffect(() => {
    if (status !== 'authenticated') return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') {
        // Silent success — no UI
        return;
      }
      if (event === 'SIGNED_OUT') {
        toast.warning('Your session ended. Please sign in again.');
      }
    });

    // Ping session every 10 min — if getSession fails, sign out
    const interval = setInterval(async () => {
      const { error } = await supabase.auth.getSession();
      if (error) {
        await signOut();
        toast.error('Session expired. Please sign in again.');
      }
    }, 10 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [status, signOut]);
}
