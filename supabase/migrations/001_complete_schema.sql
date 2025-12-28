-- ============================================
-- ASCENDA COMPLETE DATABASE SCHEMA
-- Run this migration in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Schools table
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'headmaster', 'teacher', 'student')),
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(school_id, name, academic_year)
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(school_id, code)
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  admission_number VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(school_id, admission_number)
);

-- Teacher Assignments table (links teachers to classes and subjects)
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  academic_year VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, class_id, subject_id, academic_year)
);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  academic_year VARCHAR(20) NOT NULL,
  term INTEGER NOT NULL CHECK (term IN (1, 2, 3)),
  ca_score DECIMAL(5,2) DEFAULT 0 CHECK (ca_score >= 0 AND ca_score <= 40),
  exam_score DECIMAL(5,2) DEFAULT 0 CHECK (exam_score >= 0 AND exam_score <= 60),
  total_score DECIMAL(5,2) GENERATED ALWAYS AS (ca_score + exam_score) STORED,
  grade VARCHAR(10),
  is_locked BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, subject_id, academic_year, term)
);

-- Student Remarks table
CREATE TABLE IF NOT EXISTS student_remarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  academic_year VARCHAR(20) NOT NULL,
  term INTEGER NOT NULL CHECK (term IN (1, 2, 3)),
  remark_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, academic_year, term)
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(255) NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(255),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Promotion History table
CREATE TABLE IF NOT EXISTS promotion_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  from_class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  to_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  academic_year VARCHAR(20) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('promoted', 'repeated', 'graduated')),
  notes TEXT,
  promoted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year);
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_assessments_student_id ON assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessments_class_id ON assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessments_academic_year ON assessments(academic_year);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_id ON teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessments_teacher_id ON assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_remarks_student_id ON student_remarks(student_id);
CREATE INDEX IF NOT EXISTS idx_promotion_history_student_id ON promotion_history(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Schools Policies
CREATE POLICY "Super admins can manage all schools"
  ON schools FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Admins can view their school"
  ON schools FOR SELECT
  USING (
    id IN (
      SELECT school_id FROM users
      WHERE users.id = auth.uid()
    )
  );

-- Users Policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Super admins can manage all users"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Admins can view school users"
  ON users FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'headmaster')
    )
  );

CREATE POLICY "Admins can create school users"
  ON users FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'headmaster')
    )
  );

-- Classes Policies
CREATE POLICY "Users can view school classes"
  ON classes FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users
      WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage school classes"
  ON classes FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'headmaster')
    )
  );

-- Subjects Policies
CREATE POLICY "Users can view school subjects"
  ON subjects FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users
      WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage school subjects"
  ON subjects FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'headmaster')
    )
  );

-- Students Policies
CREATE POLICY "Users can view school students"
  ON students FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users
      WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage school students"
  ON students FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'headmaster')
    )
  );

-- Assessments Policies
CREATE POLICY "Teachers can view school assessments"
  ON assessments FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM classes
      WHERE school_id IN (
        SELECT school_id FROM users
        WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "Teachers can manage assessments"
  ON assessments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'teacher'
      AND users.school_id IN (
        SELECT school_id FROM classes WHERE id = assessments.class_id
      )
    )
  );

-- Student Remarks Policies
CREATE POLICY "Teachers can manage remarks"
  ON student_remarks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'teacher'
    )
  );

-- Teacher Assignments Policies
CREATE POLICY "Teachers can view their assignments"
  ON teacher_assignments FOR SELECT
  USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'headmaster')
      AND users.school_id IN (
        SELECT school_id FROM classes WHERE id = teacher_assignments.class_id
      )
    )
  );

-- Promotion History Policies
CREATE POLICY "Headmasters can manage promotions"
  ON promotion_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'headmaster'
    )
  );

-- Audit Logs Policies
CREATE POLICY "Users can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'headmaster')
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically create user profile after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate grade from total score
CREATE OR REPLACE FUNCTION calculate_grade(score DECIMAL)
RETURNS VARCHAR(10) AS $$
BEGIN
  RETURN CASE
    WHEN score >= 80 THEN 'A'
    WHEN score >= 70 THEN 'B'
    WHEN score >= 60 THEN 'C'
    WHEN score >= 50 THEN 'D'
    WHEN score >= 40 THEN 'E'
    ELSE 'F'
  END;
END;
$$ LANGUAGE plpgsql;

-- Update assessments to auto-calculate grade
CREATE OR REPLACE FUNCTION update_assessment_grade()
RETURNS TRIGGER AS $$
BEGIN
  NEW.grade := calculate_grade(NEW.total_score);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_assessment_grade ON assessments;
CREATE TRIGGER trigger_update_assessment_grade
  BEFORE INSERT OR UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_grade();

