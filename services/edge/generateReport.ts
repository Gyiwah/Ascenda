import { supabase } from '@/services/supabase/client';

export async function callGenerateReport(payload: {
	studentId: string;
	academicYear: string;
	term: number;
	format?: 'json' | 'pdf';
}) {
	return supabase.functions.invoke('generate_report', { body: payload });
}
