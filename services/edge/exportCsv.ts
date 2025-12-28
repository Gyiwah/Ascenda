import { supabase } from '@/services/supabase/client';

export async function callExportCsv(payload: { classId: string; academicYear: string; term: number }) {
	return supabase.functions.invoke('export_csv', { body: payload });
}
