import { supabase } from '../database/client';
import { cacheUsers, getCachedUsers } from '@/offline/cache';
import { User } from '@/types/database';

export const userService = {
  /**
   * Get currently authenticated user
   * Falls back to auth payload if RLS blocks users table
   */
  async getCurrentUser(): Promise<{ data: User | null; error: any }> {
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        return { data: null, error: authError };
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) throw error;

        return { data: data as User, error: null };
      } catch {
        // RLS-safe fallback
        const fallback: User = {
          id: authUser.id,
          email: authUser.email ?? '',
          full_name:
            (authUser.user_metadata as any)?.full_name ??
            authUser.email ??
            '',
          role:
            (authUser.user_metadata as any)?.role ??
            'student',
          is_active: true,
          created_at:
            authUser.created_at ??
            new Date().toISOString(),
        };

        return { data: fallback, error: null };
      }
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Get all users (optionally scoped to school)
   */
  async getAll(schoolId?: string) {
    try {
      let query = supabase.from('users').select('*');

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (!error && data) {
        cacheUsers(data as User[]).catch(() => {});
      }

      return { data, error };
    } catch (error: any) {
      const cached = await getCachedUsers({ schoolId });
      return { data: cached, error };
    }
  },

  /**
   * Get users by role (optionally scoped to school)
   */
  async getByRole(role: string, schoolId?: string) {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .eq('role', role);

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (!error && data) {
        cacheUsers(data as User[]).catch(() => {});
      }

      return { data, error };
    } catch (error: any) {
      const cached = await getCachedUsers({ role, schoolId });
      return { data: cached, error };
    }
  },

  /**
   * Get single user by ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  /**
   * Create user record (DB only, not auth)
   */
  async create(userData: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Update user
   */
  async update(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Permanently delete user (admin only)
   */
  async remove(id: string) {
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  async removeMany(ids: string[]) {
    if (!ids.length) {
      return { data: null, error: null };
    }

    const { data, error } = await supabase
      .from('users')
      .delete()
      .in('id', ids)
      .select();

    return { data, error };
  },

  /**
   * Invite user (super admin only)
   * Uses invite_user Edge Function
   */
  async inviteUser(
    email: string,
    fullName: string,
    role: string,
    schoolId?: string,
    temporaryPassword?: string
  ) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const { data, error } = await supabase.functions.invoke(
        'invite_user',
        {
          body: {
            email,
            full_name: fullName,
            role,
            school_id: schoolId,
            temporary_password: temporaryPassword,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (error) {
        const message =
          (data as any)?.error ??
          error.message ??
          'Failed to invite user';
        return { data: null, error: new Error(message) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Create school user (school admin)
   * Uses create_school_user Edge Function
   */
  async createSchoolUser(
    name: string,
    email: string,
    password: string,
    role: 'teacher' | 'headmaster'
  ) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const { data, error } = await supabase.functions.invoke(
        'create_school_user',
        {
          body: { name, email, password, role },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (error) {
        const message =
          (data as any)?.error ??
          error.message ??
          'Failed to create user';
        return { data: null, error: new Error(message) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};
