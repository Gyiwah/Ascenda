import { supabase } from './client';
import { Student } from '@/types/database';

export const studentService = {
  async getAll(schoolId: string, classId?: string) {
    let query = supabase
      .from('students')
      .select('*, classes(name)')
      .eq('school_id', schoolId)
      .eq('is_active', true);

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data, error } = await query
      .order('last_name')
      .order('first_name');
    return { data: data as any[] | null, error };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*, classes(name, level)')
      .eq('id', id)
      .maybeSingle();
    return { data: data as any | null, error };
  },

  async create(student: Omit<Student, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('students')
      .insert(student)
      .select()
      .single();
    return { data: data as Student | null, error };
  },

  async update(id: string, updates: Partial<Student>) {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data: data as Student | null, error };
  },

  async delete(id: string) {
    const { data, error } = await supabase
      .from('students')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async getByClass(classId: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .eq('is_active', true)
      .order('last_name')
      .order('first_name');
    return { data: data as Student[] | null, error };
  },
};
