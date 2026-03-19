import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/domain/models/User';
import { KeyManager } from '@/services/KeyManager';

/**
 * Initializes auth state from the existing Supabase session.
 * Called once at the app root. Does NOT create a new Supabase client.
 */
export function useSupabase() {
  const { setUser, setStatus } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!mounted) return;

          if (userData) {
            setUser(
              new User({
                id: userData.id,
                username: userData.username,
                publicKey: userData.public_key ?? undefined,
                createdAt: new Date(userData.created_at),
                updatedAt: new Date(userData.updated_at),
              })
            );
            setStatus('authenticated');
            // Note: we can't re-init KeyManager here without the password.
            // The user will need to re-login on a new session for key ops.
            // Future ZIP: implement key recovery flow.
          } else {
            setStatus('unauthenticated');
          }
        } else {
          setStatus('unauthenticated');
        }
      } catch (err) {
        if (mounted) setStatus('unauthenticated');
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        KeyManager.getInstance().clear();
        setUser(null);
        setStatus('unauthenticated');
        return;
      }

      if (event === 'TOKEN_REFRESHED' && session) {
        // Session refreshed — no action needed, Supabase client handles it
        return;
      }

      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (mounted && userData) {
          setUser(
            new User({
              id: userData.id,
              username: userData.username,
              publicKey: userData.public_key ?? undefined,
              createdAt: new Date(userData.created_at),
              updatedAt: new Date(userData.updated_at),
            })
          );
          setStatus('authenticated');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setStatus]);
}
