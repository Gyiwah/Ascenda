import { supabase } from '@/database/client';

function getFileExt(uri: string) {
	const match = /\.(\w+)$/.exec(uri);
	return match ? match[1] : 'jpg';
}

export const storageService = {
	async uploadPublic(fileUri: string, bucket: string, prefix: string) {
		try {
			const response = await fetch(fileUri);
			const blob = await response.blob();

			const ext = getFileExt(fileUri);
			const filePath = `${prefix}/${Date.now()}.${ext}`;

			const { data, error } = await supabase.storage.from(bucket).upload(filePath, blob, {
				upsert: false,
				contentType: blob.type || undefined,
			});
			if (error) throw error;

			const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(data.path);
			return { url: publicUrl.publicUrl, path: data.path };
		} catch (e: any) {
			return { error: e?.message || 'Upload failed' };
		}
	},
};


