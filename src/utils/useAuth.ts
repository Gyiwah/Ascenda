import { useState, useEffect, useRef } from 'react';
import { authService } from '../api/auth';
import { userService } from '../api/users';
import { User, StudentUser } from '@/types/database';
import { clearSession, loadSession, saveSession } from '@/offline/cache';

export function useAuth() {
  const [user, setUser] = useState<User | StudentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  const [isStudent, setIsStudent] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await userService.getCurrentUser();
      // Log returned user row for debugging (contains role if present)
      if (__DEV__) {
        console.debug('[useAuth] fetchUserProfile - user row:', data, 'error:', error);
      }
      if (error) throw error;
      
      // Check if user is active
      if (data && !data.is_active) {
        console.warn('[useAuth] User is inactive, signing out...');
        await authService.signOut();
        setUser(null);
        setError('ACCOUNT_DEACTIVATED');
        return null;
      }
      
      setUser(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: session } = await authService.getSession();
        if (!isMounted) return;
        if (session?.session) {
          await fetchUserProfile();
        } else {
          // Offline: load cached session (could be staff or student)
          const cached = await loadSession();
          if (isMounted && cached?.payload) {
            if (cached.payload.student) {
              // Student session
              setUser(cached.payload.student as StudentUser);
              setIsStudent(true);
            } else if (cached.payload.user) {
              // Staff session
              setUser(cached.payload.user as User);
              setIsStudent(false);
            }
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Only run initial check once
    if (!fetchedRef.current) {
      checkSession();
      fetchedRef.current = true;
    }

    // Listen for auth state changes
    const { subscription } = authService.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_IN' && session) {
          await fetchUserProfile();
          // cache session
          try {
            await saveSession({
              user_id: session.user?.id ?? null,
              access_token: session.session?.access_token ?? null,
              refresh_token: session.session?.refresh_token ?? null,
              expires_at: session.session?.expires_at ?? null,
              payload: session,
            });
          } catch {}
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) setUser(null);
          try {
            await clearSession();
          } catch {}
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Sign in staff users (super_admin, admin, headmaster, teacher) using email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      setIsStudent(false);
      const signInResponse = await authService.signIn(email, password);
      // Log the raw auth sign-in response to see session/user/metadata
      if (__DEV__) {
        console.debug('[useAuth] signIn - authService.signIn response:', signInResponse);
      }

      const { error } = signInResponse;
      if (error) throw error;
      const userData = await fetchUserProfile();
      try {
        const { data: s } = await authService.getSession();
        if (s?.session) {
          await saveSession({
            user_id: s.session.user?.id ?? null,
            access_token: s.session.access_token ?? null,
            refresh_token: s.session.refresh_token ?? null,
            expires_at: s.session.expires_at ?? null,
            payload: s,
          });
        }
      } catch {}
      setLoading(false);
      return { success: true, user: userData };
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  /**
   * Sign in students using admission number and date of birth
   * Students don't use Supabase Auth, so this is handled differently
   */
  const signInStudent = async (admissionNumber: string, dateOfBirth: string) => {
    try {
      setError(null);
      setLoading(true);
      setIsStudent(true);
      
      const { data, error } = await authService.signInStudent(admissionNumber, dateOfBirth);
      
      if (error) throw error;
      if (!data?.student) {
        throw new Error('Invalid student credentials');
      }

      // Set student user (no auth session for students)
      const studentUser: StudentUser = data.student;
      setUser(studentUser);
      
      // Save student session info to cache (different format than staff)
      try {
        await saveSession({
          user_id: studentUser.id,
          access_token: null, // Students don't have auth tokens
          refresh_token: null,
          expires_at: null,
          payload: { student: studentUser },
        });
      } catch {}

      setLoading(false);
      return { success: true, user: studentUser };
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      setIsStudent(false);
      return { success: false, error: err.message };
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      // Only call Supabase signOut if not a student (students don't have auth sessions)
      if (!isStudent) {
        await authService.signOut();
      }
      setUser(null);
      setIsStudent(false);
      try {
        await clearSession();
      } catch {}
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
    isStudent,
    signIn,
    signInStudent,
    signOut,
    resetPassword,
    refreshUser: fetchUserProfile,
  };
}

