import { supabase } from '@/database/client';
import { PromotionHistory, Student, Class } from '@/types/database';

export interface PromotionCandidate {
  student: Student;
  currentClass: Class;
  averageScore?: number;
  canPromote: boolean;
}

export interface BulkPromotionRequest {
  classId: string;
  academicYear: string;
  excludeStudentIds: string[];
  targetClassId?: string; // For promotion, null for repeat/graduation
}

/**
 * Check if term 3 is locked for a class
 */
export async function isTerm3Locked(classId: string, academicYear: string) {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('is_locked')
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('term', 3)
      .limit(1);

    if (error) {
      return { data: false, error };
    }

    // Check if any assessment is locked
    const isLocked = data && data.length > 0 && data[0].is_locked === true;
    return { data: isLocked, error: null };
  } catch (err: any) {
    return { data: false, error: err };
  }
}

/**
 * Get students eligible for promotion (Term 3 must be locked)
 */
export async function getPromotionCandidates(classId: string, academicYear: string) {
  try {
    // Check if Term 3 is locked
    const { data: isLocked, error: lockError } = await isTerm3Locked(classId, academicYear);
    if (lockError || !isLocked) {
      return { data: null, error: new Error('Term 3 results must be locked before promotion') };
    }

    // Get all students in the class
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .eq('is_active', true)
      .order('admission_number', { ascending: true });

    if (studentsError) {
      return { data: null, error: studentsError };
    }

    // Get class info
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return { data: null, error: classError || new Error('Class not found') };
    }

    // Get Term 3 assessments for all students
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select('*')
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('term', 3)
      .eq('is_locked', true);

    if (assessmentsError) {
      return { data: null, error: assessmentsError };
    }

    // Calculate average scores for each student
    const candidates: PromotionCandidate[] = (students || []).map((student) => {
      const studentAssessments = assessments?.filter(a => a.student_id === student.id) || [];
      const totalScore = studentAssessments.reduce((sum, a) => sum + (a.total_score || 0), 0);
      const averageScore = studentAssessments.length > 0 ? totalScore / studentAssessments.length : 0;
      
      // Determine if student can be promoted (e.g., average >= 50)
      const canPromote = averageScore >= 50;

      return {
        student,
        currentClass: classData,
        averageScore,
        canPromote,
      };
    });

    return { data: candidates, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Get available target classes for promotion
 */
export async function getTargetClasses(schoolId: string, currentLevel: number) {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .gt('level', currentLevel)
      .order('level', { ascending: true });

    if (error) {
      return { data: null, error };
    }

    return { data: data as Class[], error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Bulk promote students
 */
export async function bulkPromote(request: BulkPromotionRequest, headmasterId: string) {
  try {
    // Call Edge Function for bulk promotion
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const response = await supabase.functions.invoke('bulk_promote', {
      body: {
        class_id: request.classId,
        academic_year: request.academicYear,
        exclude_student_ids: request.excludeStudentIds || [],
        target_class_id: request.targetClassId || undefined,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.error) {
      let errorMessage = response.error.message || 'Failed to promote students';
      if (response.data && typeof response.data === 'object' && 'error' in response.data) {
        errorMessage = (response.data as any).error || errorMessage;
      }
      return { data: null, error: new Error(errorMessage) };
    }

    // Check for error in response data
    if (response.data && typeof response.data === 'object' && 'error' in response.data) {
      return { data: null, error: new Error((response.data as any).error) };
    }

    return { data: response.data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Individual promotion (promote, repeat, or graduate)
 */
export async function individualPromote(
  studentId: string,
  fromClassId: string,
  toClassId: string | null,
  academicYear: string,
  status: 'promoted' | 'repeated' | 'graduated',
  headmasterId: string,
  notes?: string
) {
  try {
    // Update student's class if promoting
    if (status === 'promoted' && toClassId) {
      const { error: updateError } = await supabase
        .from('students')
        .update({ class_id: toClassId })
        .eq('id', studentId);

      if (updateError) {
        return { data: null, error: updateError };
      }
    }

    // Create promotion history record
    const { data, error } = await supabase
      .from('promotion_history')
      .insert({
        student_id: studentId,
        from_class_id: fromClassId,
        to_class_id: toClassId || null,
        academic_year: academicYear,
        status,
        promoted_by: headmasterId,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    // Log to audit_logs
    await supabase.from('audit_logs').insert({
      user_id: headmasterId,
      action: 'PROMOTE',
      table_name: 'promotion_history',
      record_id: data.id,
      old_data: { student_id: studentId, class_id: fromClassId },
      new_data: { student_id: studentId, class_id: toClassId, status },
    });

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Get promotion history for a student
 */
export async function getPromotionHistory(studentId: string) {
  try {
    const { data, error } = await supabase
      .from('promotion_history')
      .select(`
        *,
        from_class:classes!promotion_history_from_class_id_fkey(id, name, level),
        to_class:classes!promotion_history_to_class_id_fkey(id, name, level)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    return { data: data as PromotionHistory[], error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

