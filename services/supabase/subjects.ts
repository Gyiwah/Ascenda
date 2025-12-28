import { supabase } from './client';
import { Subject } from '@/types/database';

export const subjectService = {
  async getAll(schoolId: string) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('name');
    return { data: data as Subject[] | null, error };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return { data: data as Subject | null, error };
  },

  async create(subject: Omit<Subject, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('subjects')
      .insert(subject)
      .select()
      .single();
    return { data: data as Subject | null, error };
  },

  async update(id: string, updates: Partial<Subject>) {
    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data: data as Subject | null, error };
  },

  async delete(id: string) {
    const { data, error } = await supabase
      .from('subjects')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },
};
