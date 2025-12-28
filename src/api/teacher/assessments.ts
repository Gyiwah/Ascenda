import { supabase } from '@/database/client';
import { Assessment } from '@/types/database';

export interface AssessmentDraft {
  student_id: string;
  subject_id: string;
  class_id: string;
  academic_year: string;
  term: number;
  ca_score: number;
  exam_score: number;
  total_score: number;
  grade: string;
  teacher_id: string;
  is_locked?: boolean;
  submitted_at?: string;
}

/**
 * Save assessment as draft (not submitted)
 */
export async function saveAssessmentDraft(assessments: AssessmentDraft[]) {
  try {
    // Prepare data for upsert
    // Note: total_score is a GENERATED column (computed from ca_score + exam_score)
    // Include grade as it's computed using configurable grade bands
    const dataToUpsert = assessments.map((assessment) => ({
      student_id: assessment.student_id,
      subject_id: assessment.subject_id,
      class_id: assessment.class_id,
      academic_year: assessment.academic_year,
      term: assessment.term,
      ca_score: assessment.ca_score,
      exam_score: assessment.exam_score,
      grade: assessment.grade, // Include grade (computed using configurable grade bands)
      teacher_id: assessment.teacher_id,
      is_locked: false,
      submitted_at: null,
    }));

    // Use upsert to handle both insert and update
    const { data, error } = await supabase
      .from('assessments')
      .upsert(dataToUpsert, {
        onConflict: 'student_id,subject_id,academic_year,term',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Submit final assessments (lock for teacher editing)
 */
export async function submitAssessment(assessments: AssessmentDraft[]) {
  try {
    // Prepare data for upsert
    // Note: total_score is a GENERATED column (computed from ca_score + exam_score)
    // Include grade as it's computed using configurable grade bands
    const dataToUpsert = assessments.map((assessment) => ({
      student_id: assessment.student_id,
      subject_id: assessment.subject_id,
      class_id: assessment.class_id,
      academic_year: assessment.academic_year,
      term: assessment.term,
      ca_score: assessment.ca_score,
      exam_score: assessment.exam_score,
      grade: assessment.grade, // Include grade (computed using configurable grade bands)
      teacher_id: assessment.teacher_id,
      is_locked: false, // Can be edited by headmaster until locked
      submitted_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('assessments')
      .upsert(dataToUpsert, {
        onConflict: 'student_id,subject_id,academic_year,term',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Get existing assessments for a class/subject/term
 */
export async function getAssessmentsForClass(
  classId: string,
  subjectId: string,
  academicYear: string,
  term: number
) {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .eq('academic_year', academicYear)
      .eq('term', term);

    if (error) {
      return { data: null, error };
    }

    return { data: data as Assessment[], error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

