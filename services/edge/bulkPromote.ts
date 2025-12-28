import { supabase } from '@/services/supabase/client';

export async function callBulkPromote(payload: {
	promotions: Array<{ studentId: string; fromClassId: string; toClassId: string | null; status: 'promoted' | 'repeated' | 'graduated'; notes?: string }>;
	academicYear: string;
	promotedBy: string;
}) {
	return supabase.functions.invoke('bulk_promote', { body: payload });
}
