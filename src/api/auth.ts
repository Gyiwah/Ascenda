import { supabase } from '../database/client';

export const authService = {
  /**
   * Sign in staff users (super_admin, admin, headmaster, teacher) using email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  /**
   * Sign in students using admission number and date of birth
   * Students don't use Supabase Auth, so this calls an Edge Function
   */
  async signInStudent(admissionNumber: string, dateOfBirth: string) {
    try {
      // Students don't have auth sessions, so we don't need an access token
      // The edge function uses service role key internally
      const response = await supabase.functions.invoke('student_login', {
        body: {
          admission_number: admissionNumber,
          date_of_birth: dateOfBirth, // Format: YYYY-MM-DD
        },
      });

      // Check for error in response
      if (response.error) {
        // Try to extract error message from response data
        let errorMessage = response.error.message || 'Failed to login student';
        if (response.data && typeof response.data === 'object' && 'error' in response.data) {
          errorMessage = (response.data as any).error || errorMessage;
        }
        return { data: null, error: new Error(errorMessage) };
      }

      // Check if response.data contains an error
      if (response.data && typeof response.data === 'object' && 'error' in response.data) {
        return { data: null, error: new Error((response.data as any).error) };
      }

      // Check if response.data contains success and student
      if (response.data && typeof response.data === 'object' && 'success' in response.data && response.data.success) {
        return { data: response.data, error: null };
      }

      // If we have data but no success flag, assume it's valid
      if (response.data) {
        return { data: response.data, error: null };
      }

      return { data: null, error: new Error('Invalid response from server') };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return data;
  },
};

