import { supabase } from '../database/client';
import { Assessment } from '@/types/database';

export const assessmentService = {
  async getByStudent(studentId: string, academicYear: string, term: number) {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('student_id', studentId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  async getByClass(classId: string, academicYear: string, term: number) {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('term', term);

    return { data, error };
  },

  async create(assessmentData: Partial<Assessment>) {
    const { data, error } = await supabase
      .from('assessments')
      .insert(assessmentData)
      .select()
      .single();

    return { data, error };
  },

  async update(id: string, updates: Partial<Assessment>) {
    const { data, error } = await supabase
      .from('assessments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },
};

