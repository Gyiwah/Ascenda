import { supabase } from './client';

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export const auditService = {
  async getAll(limit: number = 100, offset: number = 0) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        user:users!audit_logs_user_id_fkey(id, full_name, email, role)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return { data: data as any[] | null, error };
  },

  async getByUser(userId: string, limit: number = 100) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        user:users!audit_logs_user_id_fkey(id, full_name, email, role)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data: data as any[] | null, error };
  },

  async getByAction(action: string, limit: number = 100) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        user:users!audit_logs_user_id_fkey(id, full_name, email, role)
      `)
      .eq('action', action)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data: data as any[] | null, error };
  },

  async getByDateRange(startDate: string, endDate: string, limit: number = 100) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        user:users!audit_logs_user_id_fkey(id, full_name, email, role)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data: data as any[] | null, error };
  },
};

