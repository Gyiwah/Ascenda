import { supabase } from '@/services/supabase/client';

export function getPublicUrl(bucket: string, path: string) {
	const { data } = supabase.storage.from(bucket).getPublicUrl(path);
	return data.publicUrl;
}
