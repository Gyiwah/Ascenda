-- Migration: Fix student creation RLS recursion
-- Date: 2025-11-16
-- Purpose: Ensure student policies use SECURITY DEFINER functions correctly
--          and add explicit INSERT policy for students

-- Drop existing student policies that might cause recursion
DROP POLICY IF EXISTS "Users can view school students" ON students;
DROP POLICY IF EXISTS "Admins can fully manage students" ON students;
DROP POLICY IF EXISTS "Admins can manage school students" ON students;

-- Create non-recursive policies using SECURITY DEFINER functions
-- View policy: Users can view students in their school
CREATE POLICY "Users can view school students"
  ON students FOR SELECT
  USING (
    school_id = public.get_user_school_id(auth.uid())
  );

-- Insert policy: Admins can create students in their school
CREATE POLICY "Admins can insert students"
  ON students FOR INSERT
  WITH CHECK (
    public.is_admin(auth.uid())
    AND school_id = public.get_user_school_id(auth.uid())
  );

-- Update policy: Admins can update students in their school
CREATE POLICY "Admins can update students"
  ON students FOR UPDATE
  USING (
    public.is_admin(auth.uid())
    AND school_id = public.get_user_school_id(auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    AND school_id = public.get_user_school_id(auth.uid())
  );

-- Delete policy: Admins can soft-delete students in their school
CREATE POLICY "Admins can delete students"
  ON students FOR DELETE
  USING (
    public.is_admin(auth.uid())
    AND school_id = public.get_user_school_id(auth.uid())
  );

