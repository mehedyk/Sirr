import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/domain/models/User';

export function useSupabase() {
  const { setSession, setUser } = useAuthStore();

  useEffect(() => {
    // Get initial session and user
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        setSession(session);
        
        if (session?.user) {
          // Fetch user data
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userData) {
            setUser(new User({
              id: userData.id,
              username: userData.username,
              publicKey: userData.public_key || undefined,
              createdAt: new Date(userData.created_at),
              updatedAt: new Date(userData.updated_at),
            }));
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        // Always set loading to false
        useAuthStore.setState({ loading: false });
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session?.user) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userData) {
            setUser(new User({
              id: userData.id,
              username: userData.username,
              publicKey: userData.public_key || undefined,
              createdAt: new Date(userData.created_at),
              updatedAt: new Date(userData.updated_at),
            }));
          }
        } catch (error) {
          console.error('Error fetching user on auth change:', error);
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setUser]);

  return {};
}