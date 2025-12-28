import { supabase } from '@/database/client';
import { studentService } from '@/api/students';
import { Student } from '@/types/database';

/**
 * Get all students for a specific class
 */
export async function getStudentsForClass(classId: string, schoolId: string) {
  try {
    const { data, error } = await studentService.getAll(schoolId, classId);
    
    if (error) {
      return { data: null, error };
    }

    // Sort by admission number
    const sorted = (data || []).sort((a, b) => 
      a.admission_number.localeCompare(b.admission_number)
    );

    return { data: sorted, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

