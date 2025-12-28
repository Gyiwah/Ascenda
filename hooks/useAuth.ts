import { useState, useEffect } from 'react';
import { authService } from '@/services/supabase/auth';
import { userService } from '@/services/supabase/users';
import { User } from '@/types/database';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUser();

    const { subscription } = authService.onAuthStateChange(
      async (event: string, session: any) => {
        if (event === 'SIGNED_IN' && session) {
          await fetchUserProfile();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: session } = await authService.getSession();
      if (session?.session) {
        await fetchUserProfile();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await userService.getCurrentUser();
      if (error) throw error;
      setUser(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const { error } = await authService.signIn(email, password);
      if (error) throw error;
      await fetchUserProfile();
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await authService.signOut();
      setUser(null);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error } = await authService.resetPassword(email);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    resetPassword,
    refreshUser: fetchUserProfile,
  };
}
