import { supabase } from './client';
import { StudentRemark } from '@/types/database';

export const remarkService = {
  async getByStudent(studentId: string, academicYear: string, term: number) {
    const { data, error } = await supabase
      .from('student_remarks')
      .select('*, users(full_name)')
      .eq('student_id', studentId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .maybeSingle();
    return { data: data as any | null, error };
  },

  async getByClass(classId: string, academicYear: string, term: number) {
    const { data, error } = await supabase
      .from('student_remarks')
      .select('*, students(first_name, last_name, admission_number)')
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .order('students(last_name)');
    return { data: data as any[] | null, error };
  },

  async create(remark: Omit<StudentRemark, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('student_remarks')
      .insert(remark)
      .select()
      .single();
    return { data: data as StudentRemark | null, error };
  },

  async update(id: string, updates: Partial<StudentRemark>) {
    const { data, error } = await supabase
      .from('student_remarks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data: data as StudentRemark | null, error };
  },

  async upsert(remark: Omit<StudentRemark, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('student_remarks')
      .upsert(remark, {
        onConflict: 'student_id,academic_year,term'
      })
      .select()
      .single();
    return { data: data as StudentRemark | null, error };
  },
};
