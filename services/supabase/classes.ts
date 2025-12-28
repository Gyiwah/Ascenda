import { supabase } from './client';
import { Class } from '@/types/database';

export const classService = {
  async getAll(schoolId: string, academicYear?: string) {
    let query = supabase
      .from('classes')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true);

    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }

    const { data, error } = await query.order('level').order('name');
    return { data: data as Class[] | null, error };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return { data: data as Class | null, error };
  },

  async create(classData: Omit<Class, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('classes')
      .insert(classData)
      .select()
      .single();
    return { data: data as Class | null, error };
  },

  async update(id: string, updates: Partial<Class>) {
    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data: data as Class | null, error };
  },

  async delete(id: string) {
    const { data, error } = await supabase
      .from('classes')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },
};
