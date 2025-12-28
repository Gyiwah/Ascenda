-- Fix RLS policy to allow headmasters to approve assessments
-- The previous migration dropped headmaster approval permissions
-- This migration restores them

-- Drop the restrictive teacher-only assessment policies
DROP POLICY IF EXISTS "Teachers can view school assessments" ON assessments;
DROP POLICY IF EXISTS "Teachers can manage assessments" ON assessments;

-- Create new assessment policies that allow both teachers and headmasters

-- SELECT policy: Teachers and headmasters in the school can view assessments
CREATE POLICY "School staff can view assessments"
  ON assessments FOR SELECT
  TO authenticated
  USING (
    class_id IN (
      SELECT id FROM classes
      WHERE school_id = public.get_user_school_id(auth.uid())
    )
  );

-- INSERT policy: Teachers can create assessments
CREATE POLICY "Teachers can create assessments"
  ON assessments FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_teacher(auth.uid())
    AND class_id IN (
      SELECT id FROM classes
      WHERE school_id = public.get_user_school_id(auth.uid())
    )
  );

-- UPDATE policy for teachers: Can update their own unlocked assessments
CREATE POLICY "Teachers can update their assessments"
  ON assessments FOR UPDATE
  TO authenticated
  USING (
    public.is_teacher(auth.uid())
    AND teacher_id = auth.uid()
    AND is_locked = false
    AND class_id IN (
      SELECT id FROM classes
      WHERE school_id = public.get_user_school_id(auth.uid())
    )
  )
  WITH CHECK (
    public.is_teacher(auth.uid())
    AND teacher_id = auth.uid()
    AND is_locked = false
    AND class_id IN (
      SELECT id FROM classes
      WHERE school_id = public.get_user_school_id(auth.uid())
    )
  );

-- UPDATE policy for headmasters: Can approve, lock, and manage assessments in their school
CREATE POLICY "Headmasters can manage school assessments"
  ON assessments FOR UPDATE
  TO authenticated
  USING (
    public.is_headmaster(auth.uid())
    AND class_id IN (
      SELECT id FROM classes
      WHERE school_id = public.get_user_school_id(auth.uid())
    )
  )
  WITH CHECK (
    public.is_headmaster(auth.uid())
    AND class_id IN (
      SELECT id FROM classes
      WHERE school_id = public.get_user_school_id(auth.uid())
    )
  );

-- DELETE policy: Admins and super admins only
CREATE POLICY "Admins can delete assessments"
  ON assessments FOR DELETE
  TO authenticated
  USING (
    public.is_admin_or_headmaster(auth.uid())
    AND class_id IN (
      SELECT id FROM classes
      WHERE school_id = public.get_user_school_id(auth.uid())
    )
  );
