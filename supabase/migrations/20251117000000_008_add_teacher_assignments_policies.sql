-- Migration: Add RLS policies for teacher_assignments table
-- Date: 2025-11-17
-- Purpose: Allow school admins to manage teacher assignments using SECURITY DEFINER functions

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view school teacher assignments" ON teacher_assignments;
DROP POLICY IF EXISTS "Admins can insert teacher assignments" ON teacher_assignments;
DROP POLICY IF EXISTS "Admins can update teacher assignments" ON teacher_assignments;
DROP POLICY IF EXISTS "Admins can delete teacher assignments" ON teacher_assignments;
DROP POLICY IF EXISTS "School staff can view teacher assignments" ON teacher_assignments;
DROP POLICY IF EXISTS "School admins can insert teacher assignments" ON teacher_assignments;
DROP POLICY IF EXISTS "School admins can update teacher assignments" ON teacher_assignments;
DROP POLICY IF EXISTS "School admins can delete teacher assignments" ON teacher_assignments;
DROP POLICY IF EXISTS "Teachers can view their assignments" ON teacher_assignments;

-- View policy: Users can view teacher assignments in their school
CREATE POLICY "Users can view school teacher assignments"
  ON teacher_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = teacher_assignments.class_id
      AND c.school_id = public.get_user_school_id(auth.uid())
    )
  );

-- Insert policy: Admins can create teacher assignments
CREATE POLICY "Admins can insert teacher assignments"
  ON teacher_assignments FOR INSERT
  WITH CHECK (
    public.is_admin(auth.uid())
    AND EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_id
      AND c.school_id = public.get_user_school_id(auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = teacher_id
      AND u.role = 'teacher'
      AND u.school_id = public.get_user_school_id(auth.uid())
    )
  );

-- Update policy: Admins can update teacher assignments
CREATE POLICY "Admins can update teacher assignments"
  ON teacher_assignments FOR UPDATE
  USING (
    public.is_admin(auth.uid())
    AND EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = teacher_assignments.class_id
      AND c.school_id = public.get_user_school_id(auth.uid())
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    AND EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_id
      AND c.school_id = public.get_user_school_id(auth.uid())
    )
  );

-- Delete policy: Admins can delete teacher assignments
CREATE POLICY "Admins can delete teacher assignments"
  ON teacher_assignments FOR DELETE
  USING (
    public.is_admin(auth.uid())
    AND EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = teacher_assignments.class_id
      AND c.school_id = public.get_user_school_id(auth.uid())
    )
  );

