import { supabase } from '@/database/client';
import { Assessment } from '@/types/database';
import { computeGrade, DEFAULT_GRADE_BANDS, GradeBandConfig } from '@/utils/computeGrade';

export interface AssessmentSubmission {
  id: string;
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  teacher_id: string;
  teacher_name: string;
  academic_year: string;
  term: number;
  student_count: number;
  submitted_at: string;
  approved_at?: string;
  is_locked: boolean;
}

export interface AssessmentWithDetails extends Assessment {
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  class?: {
    id: string;
    name: string;
  };
  teacher?: {
    id: string;
    full_name: string;
  };
}

/**
 * List pending assessment submissions for headmaster review
 */
export async function listPendingSubmissions(schoolId: string, academicYear?: string, term?: number) {
  try {
    let query = supabase
      .from('assessments')
      .select(`
        *,
        student:students(id, first_name, last_name, admission_number),
        subject:subjects(id, name, code),
        class:classes(id, name),
        teacher:users!assessments_teacher_id_fkey(id, full_name)
      `)
      .not('submitted_at', 'is', null)
      .is('approved_at', null) // Only show unapproved assessments
      .eq('is_locked', false) // Only show non-locked assessments as pending
      .order('submitted_at', { ascending: false });

    // Filter by school through classes
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id')
      .eq('school_id', schoolId)
      .eq('is_active', true);

    if (classesError) {
      return { data: null, error: classesError };
    }

    const classIds = classes?.map(c => c.id) || [];
    if (classIds.length === 0) {
      return { data: [], error: null };
    }

    query = query.in('class_id', classIds);

    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }

    if (term) {
      query = query.eq('term', term);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    // Group by class/subject/term to create submissions
    const submissionsMap = new Map<string, AssessmentSubmission>();
    
    (data || []).forEach((assessment: any) => {
      // Double-check: skip if this assessment is already approved
      if (assessment.approved_at) {
        return;
      }
      
      const key = `${assessment.class_id}-${assessment.subject_id}-${assessment.academic_year}-${assessment.term}`;
      
      if (!submissionsMap.has(key)) {
        submissionsMap.set(key, {
          id: key,
          class_id: assessment.class_id,
          class_name: assessment.class?.name || 'Unknown Class',
          subject_id: assessment.subject_id,
          subject_name: assessment.subject?.name || 'Unknown Subject',
          subject_code: assessment.subject?.code || '',
          teacher_id: assessment.teacher_id,
          teacher_name: assessment.teacher?.full_name || 'Unknown Teacher',
          academic_year: assessment.academic_year,
          term: assessment.term,
          student_count: 0,
          submitted_at: assessment.submitted_at || '',
          approved_at: undefined, // Always undefined for pending submissions
          is_locked: assessment.is_locked || false,
        });
      }
      
      const submission = submissionsMap.get(key)!;
      submission.student_count += 1;
    });

    // Filter out any submissions that might have been approved (safety check)
    // The query already filters by .is('approved_at', null), so all returned assessments should be unapproved
    // But we add an extra safety check here
    const pendingSubmissions = Array.from(submissionsMap.values()).filter(
      (submission) => {
        // Double-check: ensure submission doesn't have approved_at set
        if (submission.approved_at) {
          return false;
        }
        
        // Verify that all assessments in this group are actually unapproved
        // This is a safety check in case of any edge cases
        const relatedAssessments = (data || []).filter(
          (a: any) =>
            a.class_id === submission.class_id &&
            a.subject_id === submission.subject_id &&
            a.academic_year === submission.academic_year &&
            a.term === submission.term
        );
        
        // If ALL assessments in this group are unapproved, include this submission
        // Since the query already filters by .is('approved_at', null), all should be unapproved
        const allUnapproved = relatedAssessments.every((a: any) => !a.approved_at);
        return allUnapproved;
      }
    );

    return { data: pendingSubmissions, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Get assessments for a specific class/subject/term for review
 */
export async function getAssessmentsForReview(
  classId: string,
  subjectId: string,
  academicYear: string,
  term: number
) {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select(`
        *,
        student:students(id, first_name, last_name, admission_number),
        subject:subjects(id, name, code),
        class:classes(id, name),
        teacher:users!assessments_teacher_id_fkey(id, full_name)
      `)
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .eq('academic_year', academicYear)
      .eq('term', term);

    if (error) {
      return { data: null, error };
    }

    // Sort by admission number manually
    const sorted = (data || []).sort((a: any, b: any) => {
      const aNum = a.student?.admission_number || '';
      const bNum = b.student?.admission_number || '';
      return aNum.localeCompare(bNum);
    });

    return { data: sorted as AssessmentWithDetails[], error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Update an assessment (headmaster can edit before approval)
 */
export async function updateAssessment(
  assessmentId: string,
  updates: {
    ca_score?: number;
    exam_score?: number;
  },
  headmasterId: string
) {
  try {
    // Get current assessment
    const { data: current, error: fetchError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (fetchError || !current) {
      return { data: null, error: fetchError || new Error('Assessment not found') };
    }

    // Check if locked
    if (current.is_locked) {
      return { data: null, error: new Error('Assessment is locked and cannot be edited') };
    }

    // Calculate grade (total_score is a generated column, so we don't update it)
    const caScore = updates.ca_score !== undefined ? updates.ca_score : current.ca_score || 0;
    const examScore = updates.exam_score !== undefined ? updates.exam_score : current.exam_score || 0;
    const totalScore = caScore + examScore;
    
    // Load school's grade configuration to compute grade correctly
    let gradeBands: GradeBandConfig[] | null = null;
    try {
      // Get the school_id from the assessment's class
      const { data: classData } = await supabase
        .from('classes')
        .select('school_id')
        .eq('id', current.class_id)
        .single();
      
      if (classData?.school_id) {
        const { data: schoolData } = await supabase
          .from('schools')
          .select('assessment_grade_config')
          .eq('id', classData.school_id)
          .single();
        
        if (schoolData?.assessment_grade_config && Array.isArray(schoolData.assessment_grade_config)) {
          gradeBands = schoolData.assessment_grade_config.map((band: any) => ({
            min: Number(band.min) || 0,
            max: Number(band.max) || 0,
            label: String(band.label ?? ''),
          }));
        }
      }
    } catch (err) {
      console.warn('[updateAssessment] Failed to load grade config, using defaults', err);
    }
    
    const grade = computeGrade(totalScore, gradeBands);
    
    // Update assessment
    // Note: total_score is a GENERATED column, so we cannot update it directly
    // It will be automatically calculated by the database
    const { data, error } = await supabase
      .from('assessments')
      .update({
        ...updates,
        grade: grade, // Only update grade, total_score is auto-calculated
      })
      .eq('id', assessmentId)
      .select();

    if (error) {
      return { data: null, error };
    }

    // Check if update was successful
    if (!data || data.length === 0) {
      return { data: null, error: new Error('Assessment update failed - no rows updated') };
    }

    // Return the first (and should be only) updated assessment
    const updatedAssessment = data[0];

    // Log to audit_logs
    await supabase.from('audit_logs').insert({
      user_id: headmasterId,
      action: 'UPDATE',
      table_name: 'assessments',
      record_id: assessmentId,
      old_data: current,
      new_data: updatedAssessment,
    });

    return { data: updatedAssessment, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Approve assessments for a class/subject/term
 */
export async function approveAssessment(
  classId: string,
  subjectId: string,
  academicYear: string,
  term: number,
  headmasterId: string
) {
  try {
    // Get all assessments for this class/subject/term
    const { data: assessments, error: fetchError } = await supabase
      .from('assessments')
      .select('id, class_id, subject_id, academic_year, term, approved_at, is_locked')
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .eq('academic_year', academicYear)
      .eq('term', term);

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    if (!assessments || assessments.length === 0) {
      return { data: null, error: new Error('No assessments found') };
    }
    
    console.debug('[approveAssessment] Fetched assessments', {
      count: assessments.length,
      approved: assessments.filter(a => a.approved_at).length,
      unapproved: assessments.filter(a => !a.approved_at).length,
      locked: assessments.filter(a => a.is_locked).length,
    });

    // Filter out already approved assessments and locked assessments
    const unapprovedAssessments = assessments?.filter(a => !a.approved_at && !a.is_locked) || [];
    
    if (unapprovedAssessments.length === 0) {
      // Check if all are approved or locked
      const allApproved = assessments?.every(a => a.approved_at) || false;
      const allLocked = assessments?.every(a => a.is_locked) || false;
      
      if (allApproved) {
        return { data: assessments, error: null };
      }
      if (allLocked) {
        return { data: null, error: new Error('Cannot approve locked assessments') };
      }
      // Mixed state - some approved, some locked
      return { data: null, error: new Error('Some assessments are locked and cannot be approved') };
    }

    // Update all unapproved assessments by their IDs (more reliable than filtering)
    const unapprovedIds = unapprovedAssessments.map(a => a.id);
    const approvalTime = new Date().toISOString();
    
    console.debug('[approveAssessment] Attempting to update assessments', {
      unapprovedIds,
      unapprovedCount: unapprovedIds.length,
      approvalTime,
      headmasterId,
    });
    
    // Update by IDs - we've already filtered to unapproved, so no need for .is() check
    const { data, error } = await supabase
      .from('assessments')
      .update({
        approved_at: approvalTime,
        approved_by: headmasterId,
      })
      .in('id', unapprovedIds)
      .select();

    if (error) {
      console.error('[approveAssessment] Update error:', error);
      return { data: null, error };
    }

    // Verify that assessments were updated
    if (!data || data.length === 0) {
      // Try to understand why - check if assessments still exist and are unapproved
      const { data: checkData, error: checkError } = await supabase
        .from('assessments')
        .select('id, approved_at')
        .in('id', unapprovedIds);
      
      console.error('[approveAssessment] No assessments updated despite having unapproved assessments', {
        classId,
        subjectId,
        academicYear,
        term,
        unapprovedCount: unapprovedAssessments.length,
        totalCount: assessments?.length || 0,
        unapprovedIds,
        checkData: checkData?.map(a => ({ id: a.id, approved_at: a.approved_at })),
        checkError,
      });
      
      // If check shows they're still unapproved, there might be an RLS issue
      if (checkData && checkData.length > 0) {
        const stillUnapproved = checkData.filter(a => !a.approved_at);
        if (stillUnapproved.length > 0) {
          return { 
            data: null, 
            error: new Error('Failed to update assessments. This may be due to database permissions. Please contact support.') 
          };
        }
      }
      
      return { data: null, error: new Error('Failed to update assessments. Please try again.') };
    }
    
    console.debug('[approveAssessment] Successfully updated assessments', {
      updatedCount: data.length,
      updatedIds: data.map(a => a.id),
    });

    // Merge updated assessments with any that were already approved
    const updatedIds = new Set(data.map(a => a.id));
    const allAssessments = assessments?.map(a => 
      updatedIds.has(a.id) ? data.find(d => d.id === a.id)! : a
    ) || data;

    // Log to audit_logs
    await supabase.from('audit_logs').insert({
      user_id: headmasterId,
      action: 'APPROVE',
      table_name: 'assessments',
      record_id: null,
      old_data: { assessments: unapprovedAssessments },
      new_data: { 
        approved_at: new Date().toISOString(), 
        approved_by: headmasterId,
        updated_count: data.length 
      },
    });

    return { data: allAssessments, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Lock term results (prevents further editing)
 */
export async function lockTermResults(
  classId: string,
  academicYear: string,
  term: number,
  headmasterId: string,
  subjectId?: string // Optional: if provided, only lock assessments for this subject
) {
  try {
    // Build query for assessments
    let query = supabase
      .from('assessments')
      .select('*')
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('term', term);

    // If subjectId is provided, only get assessments for that subject
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    const { data: assessments, error: fetchError } = await query;

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    if (!assessments || assessments.length === 0) {
      return { data: null, error: new Error('No assessments found') };
    }

    // Check if all are approved
    const unapproved = assessments.filter(a => !a.approved_at);
    if (unapproved.length > 0) {
      return { data: null, error: new Error('Cannot lock: Some assessments are not approved') };
    }

    // Build update query
    let updateQuery = supabase
      .from('assessments')
      .update({
        is_locked: true,
      })
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('term', term);

    // If subjectId is provided, only lock assessments for that subject
    if (subjectId) {
      updateQuery = updateQuery.eq('subject_id', subjectId);
    }

    const { data, error } = await updateQuery.select();

    if (error) {
      return { data: null, error };
    }

    // Log to audit_logs
    await supabase.from('audit_logs').insert({
      user_id: headmasterId,
      action: 'LOCK',
      table_name: 'assessments',
      record_id: null,
      old_data: { assessments, subjectId: subjectId || 'all' },
      new_data: { is_locked: true, subjectId: subjectId || 'all' },
    });

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Get approved submissions
 */
export async function listApprovedSubmissions(schoolId: string, academicYear?: string, term?: number) {
  try {
    // Similar to listPendingSubmissions but filter by approved_at IS NOT NULL
    let query = supabase
      .from('assessments')
      .select(`
        *,
        student:students(id, first_name, last_name, admission_number),
        subject:subjects(id, name, code),
        class:classes(id, name),
        teacher:users!assessments_teacher_id_fkey(id, full_name)
      `)
      .not('approved_at', 'is', null)
      .order('approved_at', { ascending: false });

    // Filter by school through classes
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id')
      .eq('school_id', schoolId)
      .eq('is_active', true);

    if (classesError) {
      return { data: null, error: classesError };
    }

    const classIds = classes?.map(c => c.id) || [];
    if (classIds.length === 0) {
      return { data: [], error: null };
    }

    query = query.in('class_id', classIds);

    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }

    if (term) {
      query = query.eq('term', term);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    // Group by class/subject/term
    const submissionsMap = new Map<string, AssessmentSubmission>();
    
    (data || []).forEach((assessment: any) => {
      const key = `${assessment.class_id}-${assessment.subject_id}-${assessment.academic_year}-${assessment.term}`;
      
      if (!submissionsMap.has(key)) {
        submissionsMap.set(key, {
          id: key,
          class_id: assessment.class_id,
          class_name: assessment.class?.name || 'Unknown Class',
          subject_id: assessment.subject_id,
          subject_name: assessment.subject?.name || 'Unknown Subject',
          subject_code: assessment.subject?.code || '',
          teacher_id: assessment.teacher_id,
          teacher_name: assessment.teacher?.full_name || 'Unknown Teacher',
          academic_year: assessment.academic_year,
          term: assessment.term,
          student_count: 0,
          submitted_at: assessment.submitted_at || '',
          approved_at: assessment.approved_at,
          is_locked: assessment.is_locked || false,
        });
      }
      
      const submission = submissionsMap.get(key)!;
      submission.student_count += 1;
    });

    return { data: Array.from(submissionsMap.values()), error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Get locked submissions
 */
export async function listLockedSubmissions(schoolId: string, academicYear?: string, term?: number) {
  try {
    let query = supabase
      .from('assessments')
      .select(`
        *,
        student:students(id, first_name, last_name, admission_number),
        subject:subjects(id, name, code),
        class:classes(id, name),
        teacher:users!assessments_teacher_id_fkey(id, full_name)
      `)
      .eq('is_locked', true)
      .order('approved_at', { ascending: false });

    // Filter by school through classes
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id')
      .eq('school_id', schoolId)
      .eq('is_active', true);

    if (classesError) {
      return { data: null, error: classesError };
    }

    const classIds = classes?.map(c => c.id) || [];
    if (classIds.length === 0) {
      return { data: [], error: null };
    }

    query = query.in('class_id', classIds);

    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }

    if (term) {
      query = query.eq('term', term);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    // Group by class/subject/term
    const submissionsMap = new Map<string, AssessmentSubmission>();
    
    (data || []).forEach((assessment: any) => {
      const key = `${assessment.class_id}-${assessment.subject_id}-${assessment.academic_year}-${assessment.term}`;
      
      if (!submissionsMap.has(key)) {
        submissionsMap.set(key, {
          id: key,
          class_id: assessment.class_id,
          class_name: assessment.class?.name || 'Unknown Class',
          subject_id: assessment.subject_id,
          subject_name: assessment.subject?.name || 'Unknown Subject',
          subject_code: assessment.subject?.code || '',
          teacher_id: assessment.teacher_id,
          teacher_name: assessment.teacher?.full_name || 'Unknown Teacher',
          academic_year: assessment.academic_year,
          term: assessment.term,
          student_count: 0,
          submitted_at: assessment.submitted_at || '',
          approved_at: assessment.approved_at,
          is_locked: assessment.is_locked || false,
        });
      }
      
      const submission = submissionsMap.get(key)!;
      submission.student_count += 1;
    });

    return { data: Array.from(submissionsMap.values()), error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

