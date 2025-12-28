import { supabase } from './client';
import { User } from '@/types/database';

export const userService = {
  async getAll(schoolId?: string) {
    let query = supabase
      .from('users')
      .select('*')
      .eq('is_active', true);

    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }

    const { data, error } = await query.order('full_name');
    return { data: data as User[] | null, error };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return { data: data as User | null, error };
  },

  async getByRole(role: string, schoolId?: string) {
    let query = supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .eq('is_active', true);

    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }

    const { data, error } = await query.order('full_name');
    return { data: data as User[] | null, error };
  },

  async getCurrentUser() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return { data: null, error: null };

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();
    return { data: data as User | null, error };
  },

  async update(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data: data as User | null, error };
  },

  async deactivate(id: string) {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },
};
