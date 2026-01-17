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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          useAuthStore.setState({ loading: false });
          return;
        }
        
        setSession(session);
        
        if (session?.user) {
          // Fetch user data
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userData && !userError) {
            setUser(new User({
              id: userData.id,
              username: userData.username,
              publicKey: userData.public_key || undefined,
              createdAt: new Date(userData.created_at),
              updatedAt: new Date(userData.updated_at),
            }));
          } else if (userError) {
            console.error('Error fetching user:', userError);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        // Always set loading to false after initialization
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
          // Fetch user data
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userData && !userError) {
            setUser(new User({
              id: userData.id,
              username: userData.username,
              publicKey: userData.public_key || undefined,
              createdAt: new Date(userData.created_at),
              updatedAt: new Date(userData.updated_at),
            }));
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user on auth change:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      useAuthStore.setState({ loading: false });
    });

    return () => subscription.unsubscribe();
  }, [setSession, setUser]);

  return {};
}
