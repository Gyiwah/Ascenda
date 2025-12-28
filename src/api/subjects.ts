import { supabase } from '../database/client';
import { Subject } from '@/types/database';

export const subjectService = {
  async getAll(schoolId: string) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('school_id', schoolId)
      .order('name', { ascending: true });

    return { data, error };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  async create(subjectData: Partial<Subject>) {
    const { data, error } = await supabase
      .from('subjects')
      .insert(subjectData)
      .select()
      .single();

    return { data, error };
  },

  async update(id: string, updates: Partial<Subject>) {
    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  async delete(id: string) {
    const { data, error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },
};

