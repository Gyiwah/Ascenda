import { supabase } from '@/database/client';
import { StudentRemark } from '@/types/database';

export interface RemarkData {
  student_id: string;
  class_id: string;
  academic_year: string;
  term: number;
  behavior_remark?: string;
  performance_remark?: string;
  attendance_remark?: string;
  teacher_id: string;
}

/**
 * Save remarks for students
 * Note: The schema has one remark per student/term, so we combine all remarks into one text
 */
export async function saveRemarks(remarks: RemarkData[]) {
  try {
    const dataToUpsert = remarks.map((remark) => {
      // Combine all remarks into one text field
      const remarkParts = [];
      if (remark.behavior_remark) {
        remarkParts.push(`Behavior: ${remark.behavior_remark}`);
      }
      if (remark.performance_remark) {
        remarkParts.push(`Performance: ${remark.performance_remark}`);
      }
      if (remark.attendance_remark) {
        remarkParts.push(`Attendance: ${remark.attendance_remark}`);
      }
      
      const remarkText = remarkParts.join('\n\n') || 'No remarks';

      return {
        student_id: remark.student_id,
        class_id: remark.class_id,
        academic_year: remark.academic_year,
        term: remark.term,
        remark_text: remarkText,
        teacher_id: remark.teacher_id,
      };
    });

    if (dataToUpsert.length === 0) {
      return { data: [], error: null };
    }

    // Upsert remarks (update if exists, insert if not)
    const { data, error } = await supabase
      .from('student_remarks')
      .upsert(dataToUpsert, {
        onConflict: 'student_id,academic_year,term',
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
 * Get remarks for students in a class/term
 */
export async function getRemarksForClass(
  classId: string,
  academicYear: string,
  term: number
) {
  try {
    const { data, error } = await supabase
      .from('student_remarks')
      .select('*')
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('term', term);

    if (error) {
      return { data: null, error };
    }

    return { data: data as StudentRemark[], error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

