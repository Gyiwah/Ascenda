import { supabase } from './client';
import { Assessment } from '@/types/database';

export const assessmentService = {
  async getByStudent(studentId: string, academicYear: string, term: number) {
    const { data, error } = await supabase
      .from('assessments')
      .select('*, subjects(name, code)')
      .eq('student_id', studentId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .order('subjects(name)');
    return { data: data as any[] | null, error };
  },

  async getByClass(classId: string, subjectId: string, academicYear: string, term: number) {
    const { data, error } = await supabase
      .from('assessments')
      .select('*, students(first_name, last_name, admission_number)')
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .order('students(last_name)');
    return { data: data as any[] | null, error };
  },

  async create(assessment: Omit<Assessment, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('assessments')
      .insert(assessment)
      .select()
      .single();
    return { data: data as Assessment | null, error };
  },

  async update(id: string, updates: Partial<Assessment>) {
    const { data, error } = await supabase
      .from('assessments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data: data as Assessment | null, error };
  },

  async lockAssessments(classId: string, academicYear: string, term: number) {
    const { data, error } = await supabase
      .from('assessments')
      .update({ is_locked: true })
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .select();
    return { data, error };
  },

  async approveAssessments(classId: string, academicYear: string, term: number, approvedBy: string) {
    const { data, error } = await supabase
      .from('assessments')
      .update({
        approved_at: new Date().toISOString(),
        approved_by: approvedBy
      })
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .select();
    return { data, error };
  },

  async getTeacherAssignments(teacherId: string, academicYear: string) {
    const { data, error } = await supabase
      .from('teacher_assignments')
      .select('*, classes(name, level), subjects(name, code)')
      .eq('teacher_id', teacherId)
      .eq('academic_year', academicYear)
      .eq('is_active', true);
    return { data: data as any[] | null, error };
  },

  async getPendingApprovals(schoolId: string, academicYear: string, term: number) {
    const { data, error } = await supabase
      .from('assessments')
      .select(`
        *,
        students(first_name, last_name, admission_number),
        subjects(name, code),
        classes(name, level),
        teacher:users!assessments_teacher_id_fkey(full_name)
      `)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .eq('is_locked', false)
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false });
    return { data: data as any[] | null, error };
  },

  async getByClassAndTerm(classId: string, academicYear: string, term: number) {
    const { data, error } = await supabase
      .from('assessments')
      .select(`
        *,
        students(first_name, last_name, admission_number),
        subjects(name, code)
      `)
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .order('students(last_name)');
    return { data: data as any[] | null, error };
  },
};
