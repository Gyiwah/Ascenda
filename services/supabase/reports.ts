import { supabase } from './client';

export const reportService = {
  async generateReport(studentId: string, academicYear: string, term: number, format: 'json' | 'pdf' = 'json') {
    const { data, error } = await supabase.functions.invoke('generate_report', {
      body: {
        studentId,
        academicYear,
        term,
        format,
      },
    });
    return { data, error };
  },

  async exportCSV(classId: string, academicYear: string, term: number) {
    const { data, error } = await supabase.functions.invoke('export_csv', {
      body: {
        classId,
        academicYear,
        term,
      },
    });
    return { data, error };
  },
};

