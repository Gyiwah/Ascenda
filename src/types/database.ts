export type UserRole = 'super_admin' | 'admin' | 'headmaster' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  school_id?: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Student user type for authentication
 * Students don't exist in auth.users, so we use this type for student sessions
 */
export interface StudentUser {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  school_id: string;
  class_id: string;
  admission_number: string;
  role: 'student';
}

export interface School {
  id: string;
  name: string;
  code?: string;
  address?: string;
  postal_address?: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface Class {
  id: string;
  school_id: string;
  name: string;
  level: number;
  academic_year: string;
  is_active: boolean;
  created_at: string;
}

export interface Subject {
  id: string;
  school_id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Student {
  id: string;
  school_id: string;
  class_id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  date_of_birth?: string;
  gender?: string;
  is_active: boolean;
  created_at: string;
}

export interface Assessment {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  teacher_id: string;
  academic_year: string;
  term: number;
  ca_score: number;
  exam_score: number;
  total_score: number;
  grade: string;
  is_locked?: boolean;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface StudentRemark {
  id: string;
  student_id: string;
  class_id: string;
  teacher_id: string;
  academic_year: string;
  term: number;
  remark_text: string;
  created_at: string;
  updated_at?: string;
}

export interface PromotionHistory {
  id: string;
  student_id: string;
  from_class_id: string;
  to_class_id?: string;
  academic_year: string;
  status: 'promoted' | 'repeated' | 'graduated';
  promoted_by: string;
  notes?: string;
  created_at: string;
}

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
