import { supabase } from '@/services/supabase/client';

export function useSupabase() {
	return { supabase };
}
