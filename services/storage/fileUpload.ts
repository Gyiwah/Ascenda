import { supabase } from '@/services/supabase/client';

export async function uploadPublicFile(bucket: string, path: string, file: File | Blob) {
	const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
		cacheControl: '3600',
		upsert: true,
	});
	return { data, error };
}
