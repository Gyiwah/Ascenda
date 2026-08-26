import { useState, useEffect } from 'react';
import { authService } from '../api/auth';
import { userService } from '../api/users';
import { User, StudentUser } from '@/types/database';
import { clearSession, loadSession, saveSession } from '@/offline/cache';

interface GlobalAuthState {
  user: User | StudentUser | null;
  loading: boolean;
  error: string | null;
  isStudent: boolean;
}

let globalAuthState: GlobalAuthState = {
  user: null,
  loading: true,
  error: null,
  isStudent: false,
};

const authListeners = new Set<(state: GlobalAuthState) => void>();

function updateGlobalAuth(updates: Partial<GlobalAuthState>) {
  globalAuthState = { ...globalAuthState, ...updates };
  authListeners.forEach((listener) => listener(globalAuthState));
}

let isSessionInitialized = false;

async function fetchUserProfile(): Promise<User | null> {
  try {
    const { data, error } = await userService.getCurrentUser();
    if (__DEV__) {
      console.debug('[useAuth] fetchUserProfile - user row:', data, 'error:', error);
    }
    if (error) throw error;
    
    if (data && !data.is_active) {
      console.warn('[useAuth] User is inactive, signing out...');
      await authService.signOut();
      updateGlobalAuth({ user: null, error: 'ACCOUNT_DEACTIVATED', isStudent: false });
      return null;
    }
    
    updateGlobalAuth({ user: data, isStudent: false, error: null });
    return data;
  } catch (err: any) {
    updateGlobalAuth({ error: err.message, user: null });
    return null;
  }
}

async function initAuthSession() {
  if (isSessionInitialized) return;
  isSessionInitialized = true;

  try {
    const { data: session } = await authService.getSession();
    if (session?.session) {
      await fetchUserProfile();
    } else {
      // Offline: load cached session (could be staff or student)
      const cached = await loadSession();
      if (cached?.payload) {
        if (cached.payload.student) {
          updateGlobalAuth({
            user: cached.payload.student as StudentUser,
            isStudent: true,
            error: null,
          });
        } else if (cached.payload.user) {
          updateGlobalAuth({
            user: cached.payload.user as User,
            isStudent: false,
            error: null,
          });
        }
      }
    }
  } catch (err: any) {
    updateGlobalAuth({ error: err.message });
  } finally {
    updateGlobalAuth({ loading: false });
  }

  // Listen for Supabase auth state changes
  authService.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      await fetchUserProfile();
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
      updateGlobalAuth({ user: null, isStudent: false });
      try {
        await clearSession();
      } catch {}
    }
  });
}

export function useAuth() {
  const [state, setState] = useState<GlobalAuthState>(globalAuthState);

  useEffect(() => {
    authListeners.add(setState);
    initAuthSession();

    return () => {
      authListeners.delete(setState);
    };
  }, []);

  /**
   * Sign in staff users (super_admin, admin, headmaster, teacher) using email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      updateGlobalAuth({ error: null, loading: true, isStudent: false });
      const signInResponse = await authService.signIn(email, password);
      if (__DEV__) {
        console.debug('[useAuth] signIn response:', signInResponse);
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
      updateGlobalAuth({ loading: false });
      return { success: true, user: userData };
    } catch (err: any) {
      updateGlobalAuth({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  };

  /**
   * Sign in students using admission number and date of birth
   */
  const signInStudent = async (admissionNumber: string, dateOfBirth: string) => {
    try {
      updateGlobalAuth({ error: null, loading: true, isStudent: true });
      
      const { data, error } = await authService.signInStudent(admissionNumber, dateOfBirth);
      
      if (error) throw error;
      if (!data?.student) {
        throw new Error('Invalid student credentials');
      }

      const studentUser: StudentUser = data.student;
      
      // Update global user immediately
      updateGlobalAuth({
        user: studentUser,
        isStudent: true,
        loading: false,
        error: null,
      });
      
      // Save student session info to persistent SQLite cache
      try {
        await saveSession({
          user_id: studentUser.id,
          access_token: null,
          refresh_token: null,
          expires_at: null,
          payload: { student: studentUser },
        });
      } catch (cacheErr) {
        console.warn('[useAuth] Could not cache student session:', cacheErr);
      }

      return { success: true, user: studentUser };
    } catch (err: any) {
      updateGlobalAuth({ error: err.message, loading: false, isStudent: false });
      return { success: false, error: err.message };
    }
  };

  const signOut = async () => {
    try {
      updateGlobalAuth({ error: null });
      if (!state.isStudent) {
        await authService.signOut();
      }
      updateGlobalAuth({ user: null, isStudent: false });
      try {
        await clearSession();
      } catch {}
      return { success: true };
    } catch (err: any) {
      updateGlobalAuth({ error: err.message });
      return { success: false, error: err.message };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      updateGlobalAuth({ error: null });
      const { error } = await authService.resetPassword(email);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      updateGlobalAuth({ error: err.message });
      return { success: false, error: err.message };
    }
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isStudent: state.isStudent,
    signIn,
    signInStudent,
    signOut,
    resetPassword,
    refreshUser: fetchUserProfile,
  };
}


