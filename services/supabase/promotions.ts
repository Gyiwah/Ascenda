import { supabase } from './client';
import { PromotionHistory } from '@/types/database';

export const promotionService = {
  async getByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('promotion_history')
      .select(`
        *,
        from_class:classes!promotion_history_from_class_id_fkey(name, level),
        to_class:classes!promotion_history_to_class_id_fkey(name, level),
        promoted_by_user:users(full_name)
      `)
      .eq('student_id', studentId)
      .order('promoted_at', { ascending: false });
    return { data: data as any[] | null, error };
  },

  async getByAcademicYear(schoolId: string, academicYear: string) {
    const { data, error } = await supabase
      .from('promotion_history')
      .select(`
        *,
        students(first_name, last_name, admission_number, school_id),
        from_class:classes!promotion_history_from_class_id_fkey(name, level),
        to_class:classes!promotion_history_to_class_id_fkey(name, level)
      `)
      .eq('students.school_id', schoolId)
      .eq('academic_year', academicYear)
      .order('promoted_at', { ascending: false });
    return { data: data as any[] | null, error };
  },

  async create(promotion: Omit<PromotionHistory, 'id' | 'created_at' | 'promoted_at'>) {
    const { data, error } = await supabase
      .from('promotion_history')
      .insert(promotion)
      .select()
      .single();
    return { data: data as PromotionHistory | null, error };
  },

  async bulkPromote(promotions: Omit<PromotionHistory, 'id' | 'created_at' | 'promoted_at'>[]) {
    const { data, error } = await supabase
      .from('promotion_history')
      .insert(promotions)
      .select();
    return { data: data as PromotionHistory[] | null, error };
  },
};
