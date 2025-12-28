import { supabase } from '@/database/client';
import { teacherAssignmentService, TeacherAssignmentWithDetails } from '@/api/teacherAssignments';

/**
 * Get all assignments for the current teacher
 * Groups by class and subject
 */
export async function getMyAssignments(teacherId: string, schoolId: string, academicYear?: string) {
  try {
    console.log('[getMyAssignments] Fetching assignments for teacher:', teacherId, 'school:', schoolId);
    
    const filters: any = {
      teacherId,
    };
    
    if (academicYear) {
      filters.academicYear = academicYear;
    }

    const { data, error } = await teacherAssignmentService.getAll(schoolId, filters);
    
    if (error) {
      console.error('[getMyAssignments] Error from teacherAssignmentService.getAll:', error);
      return { data: null, error };
    }

    console.log('[getMyAssignments] Raw assignments data:', data?.length || 0, 'assignments');

    // Group assignments by class and subject
    const grouped: Record<string, {
      class: { id: string; name: string; level: number };
      subjects: Array<{
        subject: { id: string; name: string; code: string };
        assignment: TeacherAssignmentWithDetails;
      }>;
    }> = {};

    (data || []).forEach((assignment) => {
      console.log('[getMyAssignments] Processing assignment:', {
        id: assignment.id,
        hasClass: !!assignment.class,
        hasSubject: !!assignment.subject,
        class: assignment.class,
        subject: assignment.subject,
      });
      
      if (!assignment.class || !assignment.subject) {
        console.warn('[getMyAssignments] Skipping assignment - missing class or subject:', assignment.id);
        return;
      }
      
      const classKey = assignment.class.id;
      
      if (!grouped[classKey]) {
        grouped[classKey] = {
          class: {
            id: assignment.class.id,
            name: assignment.class.name,
            level: assignment.class.level,
          },
          subjects: [],
        };
      }

      grouped[classKey].subjects.push({
        subject: {
          id: assignment.subject.id,
          name: assignment.subject.name,
          code: assignment.subject.code,
        },
        assignment,
      });
    });

    console.log('[getMyAssignments] Grouped assignments:', Object.keys(grouped).length, 'classes');
    return { data: Object.values(grouped), error: null };
  } catch (err: any) {
    console.error('[getMyAssignments] Exception:', err);
    return { data: null, error: err };
  }
}

