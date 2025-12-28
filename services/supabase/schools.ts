import { supabase } from './client';
import { School } from '@/types/database';

export const schoolService = {
  async getAll() {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('is_active', true)
      .order('name');
    return { data: data as School[] | null, error };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return { data: data as School | null, error };
  },

  async create(school: Omit<School, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('schools')
      .insert(school)
      .select()
      .single();
    return { data: data as School | null, error };
  },

  async update(id: string, updates: Partial<School>) {
    const { data, error } = await supabase
      .from('schools')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data: data as School | null, error };
  },

  async delete(id: string) {
    const { data, error } = await supabase
      .from('schools')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },
};
