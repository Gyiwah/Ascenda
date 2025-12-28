import { supabase } from '../database/client';
import { Class } from '@/types/database';

export const classService = {
  /**
   * Get all active classes for a school
   * Optionally filtered by academic year
   */
  async getAll(schoolId: string, academicYear?: string) {
    let query = supabase
      .from('classes')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true);

    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }

    const { data, error } = await query.order('level', {
      ascending: true,
    });

    return { data, error };
  },

  /**
   * Get total class count
   * Used ONLY where RPC is unavailable or for academic-year stats
   */
  async getCount(schoolId: string, academicYear?: string) {
    let query = supabase
      .from('classes')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('school_id', schoolId);

    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }

    const { count, error } = await query;

    return {
      count: count ?? 0,
      error,
    };
  },

  /**
   * Get a single class by ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  /**
   * Create a new class
   */
  async create(classData: Partial<Class>) {
    const { data, error } = await supabase
      .from('classes')
      .insert(classData)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Update class details
   */
  async update(id: string, updates: Partial<Class>) {
    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Soft delete class
   * IMPORTANT: never hard-delete classes
   */
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
