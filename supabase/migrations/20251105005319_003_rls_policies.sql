/*
  # Row Level Security Policies
  
  1. Policy Overview
    - Super Admin: Full access to all schools and data
    - School Admin: Full access to their school's data
    - Headmaster: Read all school data, approve/lock assessments, promote students
    - Teacher: Read/write assessments for assigned classes, add remarks
    - Student: View only their own data (future implementation)
  
  2. Security Model
    - All policies check authentication status
    - Role-based access using users.role column
    - School-scoped access using school_id
    - Teacher assignment checks for class/subject access
  
  3. Important Notes
    - Policies are restrictive by default
    - Each role has minimum necessary permissions
    - Cross-school access prevented except for super_admin
*/

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get current user's school_id
CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS uuid AS $$
  SELECT school_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- SCHOOLS POLICIES

CREATE POLICY "Super admins can view all schools"
  ON schools FOR SELECT
  TO authenticated
  USING (get_user_role() = 'super_admin');

CREATE POLICY "School admins can view their school"
  ON schools FOR SELECT
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'headmaster', 'teacher') 
    AND id = get_user_school_id()
  );

CREATE POLICY "Super admins can insert schools"
  ON schools FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY "Super admins can update schools"
  ON schools FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

-- USERS POLICIES (reinforce app semantics; Edge Functions use service role and bypass RLS)

-- Super admins: full access to users
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Super admins can manage all users'
  ) THEN
    CREATE POLICY "Super admins can manage all users"
      ON users FOR ALL
      TO authenticated
      USING (get_user_role() = 'super_admin')
      WITH CHECK (get_user_role() = 'super_admin');
  END IF;
END $$;

-- School admins: manage users within own school
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'School admins manage users in school'
  ) THEN
    CREATE POLICY "School admins manage users in school"
      ON users FOR SELECT
      TO authenticated
      USING (
        get_user_role() = 'admin' AND school_id = get_user_school_id()
      );

    CREATE POLICY "School admins update users in school"
      ON users FOR UPDATE
      TO authenticated
      USING (
        get_user_role() = 'admin' AND school_id = get_user_school_id()
      )
      WITH CHECK (
        get_user_role() = 'admin' AND school_id = get_user_school_id()
      );
  END IF;
END $$;

CREATE POLICY "Super admins can delete schools"
  ON schools FOR DELETE
  TO authenticated
  USING (get_user_role() = 'super_admin');

-- USERS POLICIES

CREATE POLICY "Super admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (get_user_role() = 'super_admin');

CREATE POLICY "School admins can view users in their school"
  ON users FOR SELECT
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'headmaster', 'teacher')
    AND school_id = get_user_school_id()
  );

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Super admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY "School admins can insert users in their school"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() = 'admin'
    AND school_id = get_user_school_id()
  );

CREATE POLICY "Super admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY "School admins can update users in their school"
  ON users FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'admin'
    AND school_id = get_user_school_id()
  )
  WITH CHECK (
    get_user_role() = 'admin'
    AND school_id = get_user_school_id()
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- CLASSES POLICIES

CREATE POLICY "School staff can view classes in their school"
  ON classes FOR SELECT
  TO authenticated
  USING (
    school_id = get_user_school_id()
    OR get_user_role() = 'super_admin'
  );

CREATE POLICY "School admins can insert classes"
  ON classes FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() = 'admin'
    AND school_id = get_user_school_id()
  );

CREATE POLICY "School admins can update classes"
  ON classes FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'admin'
    AND school_id = get_user_school_id()
  )
  WITH CHECK (
    get_user_role() = 'admin'
    AND school_id = get_user_school_id()
  );

CREATE POLICY "School admins can delete classes"
  ON classes FOR DELETE
  TO authenticated
  USING (
    get_user_role() = 'admin'
    AND school_id = get_user_school_id()
  );

-- SUBJECTS POLICIES

CREATE POLICY "School staff can view subjects in their school"
  ON subjects FOR SELECT
  TO authenticated
  USING (
    school_id = get_user_school_id()
    OR get_user_role() = 'super_admin'
  );

CREATE POLICY "School admins can insert subjects"
  ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() = 'admin'
    AND school_id = get_user_school_id()
  );

CREATE POLICY "School admins can update subjects"
  ON subjects FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'admin'
    AND school_id = get_user_school_id()
  )
  WITH CHECK (
    get_user_role() = 'admin'
    AND school_id = get_user_school_id()
  );

CREATE POLICY "School admins can delete subjects"
  ON subjects FOR DELETE
  TO authenticated
  USING (
    get_user_role() = 'admin'
    AND school_id = get_user_school_id()
  );

-- STUDENTS POLICIES

CREATE POLICY "School staff can view students in their school"
  ON students FOR SELECT
  TO authenticated
  USING (
    school_id = get_user_school_id()
    OR get_user_role() = 'super_admin'
  );

CREATE POLICY "School admins can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() = 'admin'
    AND school_id = get_user_school_id()
  );

CREATE POLICY "School admins can update students"
  ON students FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'admin'
    AND school_id = get_user_school_id()
  )
  WITH CHECK (
    get_user_role() = 'admin'
    AND school_id = get_user_school_id()
  );

CREATE POLICY "School admins can delete students"
  ON students FOR DELETE
  TO authenticated
  USING (
    get_user_role() = 'admin'
    AND school_id = get_user_school_id()
  );

-- TEACHER ASSIGNMENTS POLICIES

CREATE POLICY "School staff can view teacher assignments"
  ON teacher_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = teacher_assignments.class_id
      AND (c.school_id = get_user_school_id() OR get_user_role() = 'super_admin')
    )
  );

CREATE POLICY "School admins can insert teacher assignments"
  ON teacher_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_id
      AND c.school_id = get_user_school_id()
    )
  );

CREATE POLICY "School admins can update teacher assignments"
  ON teacher_assignments FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_id
      AND c.school_id = get_user_school_id()
    )
  )
  WITH CHECK (
    get_user_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_id
      AND c.school_id = get_user_school_id()
    )
  );

CREATE POLICY "School admins can delete teacher assignments"
  ON teacher_assignments FOR DELETE
  TO authenticated
  USING (
    get_user_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_id
      AND c.school_id = get_user_school_id()
    )
  );

-- ASSESSMENTS POLICIES

CREATE POLICY "School staff can view assessments in their school"
  ON assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = assessments.student_id
      AND (s.school_id = get_user_school_id() OR get_user_role() = 'super_admin')
    )
  );

CREATE POLICY "Teachers can insert assessments for assigned classes"
  ON assessments FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() IN ('teacher', 'admin')
    AND teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM teacher_assignments ta
      JOIN classes c ON c.id = ta.class_id
      WHERE ta.teacher_id = auth.uid()
      AND ta.class_id = class_id
      AND ta.subject_id = subject_id
      AND c.school_id = get_user_school_id()
    )
  );

CREATE POLICY "Teachers can update unlocked assessments"
  ON assessments FOR UPDATE
  TO authenticated
  USING (
    get_user_role() IN ('teacher', 'admin')
    AND teacher_id = auth.uid()
    AND is_locked = false
    AND EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_id
      AND s.school_id = get_user_school_id()
    )
  )
  WITH CHECK (
    get_user_role() IN ('teacher', 'admin')
    AND teacher_id = auth.uid()
    AND is_locked = false
    AND EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_id
      AND s.school_id = get_user_school_id()
    )
  );

CREATE POLICY "Headmasters can lock and approve assessments"
  ON assessments FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'headmaster'
    AND EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_id
      AND s.school_id = get_user_school_id()
    )
  )
  WITH CHECK (
    get_user_role() = 'headmaster'
    AND EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_id
      AND s.school_id = get_user_school_id()
    )
  );

-- STUDENT REMARKS POLICIES

CREATE POLICY "School staff can view remarks"
  ON student_remarks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_remarks.student_id
      AND (s.school_id = get_user_school_id() OR get_user_role() = 'super_admin')
    )
  );

CREATE POLICY "Teachers can insert remarks for their students"
  ON student_remarks FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() IN ('teacher', 'admin', 'headmaster')
    AND teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_id
      AND s.school_id = get_user_school_id()
    )
  );

CREATE POLICY "Teachers can update their remarks"
  ON student_remarks FOR UPDATE
  TO authenticated
  USING (
    get_user_role() IN ('teacher', 'admin', 'headmaster')
    AND teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_id
      AND s.school_id = get_user_school_id()
    )
  )
  WITH CHECK (
    get_user_role() IN ('teacher', 'admin', 'headmaster')
    AND teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_id
      AND s.school_id = get_user_school_id()
    )
  );

-- PROMOTION HISTORY POLICIES

CREATE POLICY "School staff can view promotion history"
  ON promotion_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = promotion_history.student_id
      AND (s.school_id = get_user_school_id() OR get_user_role() = 'super_admin')
    )
  );

CREATE POLICY "Headmasters can insert promotion records"
  ON promotion_history FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() = 'headmaster'
    AND promoted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_id
      AND s.school_id = get_user_school_id()
    )
  );

-- AUDIT LOGS POLICIES

CREATE POLICY "Super admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (get_user_role() = 'super_admin');

CREATE POLICY "School admins can view their school's audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'headmaster')
    AND user_id IN (
      SELECT id FROM users WHERE school_id = get_user_school_id()
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
