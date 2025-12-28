/*
  # Ascenda School Management System - Core Tables
  
  1. New Tables
    - `schools` - School information with code, name, address, logo
    - `users` - System users with roles (super_admin, admin, headmaster, teacher, student)
    - `classes` - Class definitions with level and academic year
    - `subjects` - Subject catalog per school
    - `students` - Student records linked to classes
    - `teacher_assignments` - Links teachers to classes and subjects
    - `assessments` - Student scores (CA + Exam), grades, with locking/approval workflow
    - `student_remarks` - Teacher remarks for students per term
    - `promotion_history` - Track student promotions between classes
    - `audit_logs` - System audit trail for all critical operations
  
  2. Key Features
    - UUID primary keys for all tables
    - Soft delete support with `is_active` flags
    - Timestamps for all records
    - Foreign key relationships with cascading
    - Indexes on frequently queried columns
    - Check constraints for data validation
  
  3. Security
    - RLS will be enabled in next migration
    - Password hashing handled by Supabase Auth
    - Role-based access control structure
*/

-- Schools table
CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  address text,
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'headmaster', 'teacher', 'student')),
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  level int NOT NULL CHECK (level >= 1 AND level <= 12),
  academic_year text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, name, academic_year)
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, code)
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  admission_number text NOT NULL,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, admission_number)
);

-- Teacher assignments table
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  academic_year text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, class_id, subject_id, academic_year)
);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  academic_year text NOT NULL,
  term int NOT NULL CHECK (term >= 1 AND term <= 3),
  ca_score numeric(5,2) NOT NULL CHECK (ca_score >= 0 AND ca_score <= 40),
  exam_score numeric(5,2) NOT NULL CHECK (exam_score >= 0 AND exam_score <= 60),
  total_score numeric(5,2) NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  grade text NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D', 'E', 'F')),
  is_locked boolean DEFAULT false,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id, academic_year, term)
);

-- Student remarks table
CREATE TABLE IF NOT EXISTS student_remarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  academic_year text NOT NULL,
  term int NOT NULL CHECK (term >= 1 AND term <= 3),
  remark_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, academic_year, term)
);

-- Promotion history table
CREATE TABLE IF NOT EXISTS promotion_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  from_class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  to_class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  academic_year text NOT NULL,
  status text NOT NULL CHECK (status IN ('promoted', 'repeated', 'graduated')),
  promoted_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  promoted_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year);
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_id ON teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessments_student_id ON assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessments_class_id ON assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessments_teacher_id ON assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessments_academic_year ON assessments(academic_year);
CREATE INDEX IF NOT EXISTS idx_student_remarks_student_id ON student_remarks(student_id);
CREATE INDEX IF NOT EXISTS idx_promotion_history_student_id ON promotion_history(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
