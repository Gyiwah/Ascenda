import { supabase } from '../database/client';

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  academic_year: string;
  is_active: boolean;
  created_at: string;
}

export interface TeacherAssignmentWithDetails extends TeacherAssignment {
  teacher?: {
    id: string;
    full_name: string;
    email: string;
  };
  class?: {
    id: string;
    name: string;
    level: number;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };
}

export const teacherAssignmentService = {
  /**
   * Get all teacher assignments for a school
   * Optionally filter by class, subject, teacher, or academic year
   */
  async getAll(schoolId: string, filters?: {
    classId?: string;
    subjectId?: string;
    teacherId?: string;
    academicYear?: string;
  }) {
    try {
      console.log('[teacherAssignmentService.getAll] Starting query', { schoolId, filters });
      
      // First, get all classes for this school to filter assignments
      const { data: schoolClasses, error: classesError } = await supabase
        .from('classes')
        .select('id')
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (classesError) {
        console.error('[teacherAssignmentService.getAll] Error fetching classes:', classesError);
        return { data: null, error: classesError };
      }

      const classIds = schoolClasses?.map((c) => c.id) || [];
      console.log('[teacherAssignmentService.getAll] Found classes:', classIds.length, classIds);

      if (classIds.length === 0) {
        console.log('[teacherAssignmentService.getAll] No classes found for school:', schoolId);
        return { data: [], error: null };
      }

      let query = supabase
        .from('teacher_assignments')
        .select(`
          *,
          teacher:users(id, full_name, email),
          class:classes(id, name, level),
          subject:subjects(id, name, code)
        `)
        .eq('is_active', true)
        .in('class_id', classIds);

      if (filters?.classId) {
        query = query.eq('class_id', filters.classId);
      }

      if (filters?.subjectId) {
        query = query.eq('subject_id', filters.subjectId);
      }

      if (filters?.teacherId) {
        query = query.eq('teacher_id', filters.teacherId);
        console.log('[teacherAssignmentService.getAll] Filtering by teacher_id:', filters.teacherId);
      }

      if (filters?.academicYear) {
        query = query.eq('academic_year', filters.academicYear);
        console.log('[teacherAssignmentService.getAll] Filtering by academic_year:', filters.academicYear);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('[teacherAssignmentService.getAll] Query error:', error);
        return { data: null, error };
      }

      console.log('[teacherAssignmentService.getAll] Found assignments:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('[teacherAssignmentService.getAll] Sample assignment:', {
          id: data[0].id,
          teacher_id: data[0].teacher_id,
          hasClass: !!data[0].class,
          hasSubject: !!data[0].subject,
        });
      }

      return { data: data as TeacherAssignmentWithDetails[] | null, error };
    } catch (err: any) {
      console.error('[teacherAssignmentService.getAll] Exception:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Get assignment by ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('teacher_assignments')
      .select(`
        *,
        teacher:users(id, full_name, email),
        class:classes(id, name, level),
        subject:subjects(id, name, code)
      `)
      .eq('id', id)
      .single();

    return { data: data as TeacherAssignmentWithDetails | null, error };
  },

  /**
   * Create a new teacher assignment
   */
  async create(assignmentData: {
    teacher_id: string;
    class_id: string;
    subject_id: string;
    academic_year: string;
  }) {
    const { data, error } = await supabase
      .from('teacher_assignments')
      .insert(assignmentData)
      .select(`
        *,
        teacher:users(id, full_name, email),
        class:classes(id, name, level),
        subject:subjects(id, name, code)
      `)
      .single();

    return { data: data as TeacherAssignmentWithDetails | null, error };
  },

  /**
   * Update an assignment
   */
  async update(id: string, updates: Partial<TeacherAssignment>) {
    const { data, error } = await supabase
      .from('teacher_assignments')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        teacher:users(id, full_name, email),
        class:classes(id, name, level),
        subject:subjects(id, name, code)
      `)
      .single();

    return { data: data as TeacherAssignmentWithDetails | null, error };
  },

  /**
   * Delete an assignment (soft delete)
   */
  async delete(id: string) {
    const { data, error } = await supabase
      .from('teacher_assignments')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },
};

