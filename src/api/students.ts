import { supabase } from '../database/client';
import { Student } from '@/types/database';

export const studentService = {
  /**
   * Get all active students for a school (optionally filtered by class)
   */
  async getAll(schoolId: string, classId?: string) {
    let query = supabase
      .from('students')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true);

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data, error } = await query.order('admission_number', {
      ascending: true,
    });

    return { data, error };
  },

  /**
   * Get total student count (includes inactive unless filtered)
   * Used ONLY where RPC is unavailable or for class-level stats
   */
  async getCount(schoolId: string, classId?: string) {
    let query = supabase
      .from('students')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('school_id', schoolId);

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { count, error } = await query;

    return {
      count: count ?? 0,
      error,
    };
  },

  /**
   * Get a single student by ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  /**
   * Create a new student
   */
  async create(studentData: Partial<Student>) {
    const { data, error } = await supabase
      .from('students')
      .insert(studentData)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Update student details
   */
  async update(id: string, updates: Partial<Student>) {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Soft delete student (keeps record for history & reports)
   */
  async delete(id: string) {
    const { data, error } = await supabase
      .from('students')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },
};
