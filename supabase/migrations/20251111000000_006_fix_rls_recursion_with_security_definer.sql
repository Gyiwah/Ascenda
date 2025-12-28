-- Migration: Fix RLS infinite recursion by using SECURITY DEFINER helper functions
-- Date: 2025-11-11
-- Purpose: Replace recursive SELECT statements in RLS policies with SECURITY DEFINER functions
--          that bypass RLS and avoid infinite recursion while maintaining security.

-- ============================================
-- SECURITY DEFINER HELPER FUNCTIONS
-- ============================================

-- Helper: Check if a user ID belongs to a super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(p_uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM users
    WHERE id = p_uid AND role = 'super_admin'
  );
$$;

-- Helper: Check if a user ID is a teacher
CREATE OR REPLACE FUNCTION public.is_teacher(p_uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM users
    WHERE id = p_uid AND role = 'teacher'
  );
$$;

-- Helper: Check if a user ID is a headmaster
CREATE OR REPLACE FUNCTION public.is_headmaster(p_uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM users
    WHERE id = p_uid AND role = 'headmaster'
  );
$$;

-- Helper: Check if a user ID is an admin
CREATE OR REPLACE FUNCTION public.is_admin(p_uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM users
    WHERE id = p_uid AND role = 'admin'
  );
$$;

-- Helper: Check if a user is admin or headmaster
CREATE OR REPLACE FUNCTION public.is_admin_or_headmaster(p_uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM users
    WHERE id = p_uid AND role IN ('admin', 'headmaster')
  );
$$;

-- Helper: Get the school_id for a given user ID
CREATE OR REPLACE FUNCTION public.get_user_school_id(p_uid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM users WHERE id = p_uid LIMIT 1;
$$;

-- Helper: Check if a user's school matches a given school_id
CREATE OR REPLACE FUNCTION public.user_in_school(p_uid uuid, p_school_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM users
    WHERE id = p_uid AND school_id = p_school_id
  );
$$;

-- Helper: Check if a user is admin or headmaster in a given school
CREATE OR REPLACE FUNCTION public.is_admin_or_headmaster_in_school(p_uid uuid, p_school_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM users
    WHERE id = p_uid
    AND role IN ('admin', 'headmaster')
    AND school_id = p_school_id
  );
$$;

-- ============================================
-- DROP OLD RECURSIVE POLICIES
-- ============================================

-- Schools table policies
DROP POLICY IF EXISTS "Super admins can manage all schools" ON schools;
DROP POLICY IF EXISTS "Admins can view their school" ON schools;

-- Users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can view school users" ON users;
DROP POLICY IF EXISTS "Admins can create school users" ON users;

-- Classes table policies
DROP POLICY IF EXISTS "Users can view school classes" ON classes;
DROP POLICY IF EXISTS "Admins can manage school classes" ON classes;

-- Subjects table policies
DROP POLICY IF EXISTS "Users can view school subjects" ON subjects;
DROP POLICY IF EXISTS "Admins can manage school subjects" ON subjects;

-- Students table policies
DROP POLICY IF EXISTS "Users can view school students" ON students;
DROP POLICY IF EXISTS "Admins can manage school students" ON students;

-- Assessments table policies
DROP POLICY IF EXISTS "Teachers can view school assessments" ON assessments;
DROP POLICY IF EXISTS "Teachers can manage assessments" ON assessments;

-- Student remarks table policies
DROP POLICY IF EXISTS "Teachers can manage remarks" ON student_remarks;

-- Teacher assignments table policies
DROP POLICY IF EXISTS "Teachers can view their assignments" ON teacher_assignments;

-- Promotion history table policies
DROP POLICY IF EXISTS "Headmasters can manage promotions" ON promotion_history;

-- Audit logs table policies
DROP POLICY IF EXISTS "Users can view audit logs" ON audit_logs;

-- ============================================
-- CREATE NEW NON-RECURSIVE POLICIES
-- ============================================

-- Schools Policies
CREATE POLICY "Super admins can manage all schools"
  ON schools FOR ALL
  USING ( public.is_super_admin(auth.uid()) );

CREATE POLICY "Admins can view their school"
  ON schools FOR SELECT
  USING ( id = public.get_user_school_id(auth.uid()) );

-- Users Policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING ( auth.uid() = id );

CREATE POLICY "Super admins can manage all users"
  ON users FOR ALL
  USING ( public.is_super_admin(auth.uid()) );

CREATE POLICY "Admins can view school users"
  ON users FOR SELECT
  USING (
    public.is_admin_or_headmaster_in_school(auth.uid(), school_id)
  );

CREATE POLICY "Admins can create school users"
  ON users FOR INSERT
  WITH CHECK (
    public.is_admin_or_headmaster_in_school(auth.uid(), school_id)
  );

-- Classes Policies
CREATE POLICY "Users can view school classes"
  ON classes FOR SELECT
  USING (
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "Admins can manage school classes"
  ON classes FOR ALL
  USING (
    public.is_admin_or_headmaster_in_school(auth.uid(), school_id)
  );

-- Subjects Policies
CREATE POLICY "Users can view school subjects"
  ON subjects FOR SELECT
  USING (
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "Admins can manage school subjects"
  ON subjects FOR ALL
  USING (
    public.is_admin_or_headmaster_in_school(auth.uid(), school_id)
  );

-- Students Policies
CREATE POLICY "Users can view school students"
  ON students FOR SELECT
  USING (
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "Admins can manage school students"
  ON students FOR ALL
  USING (
    public.is_admin_or_headmaster_in_school(auth.uid(), school_id)
  );

-- Assessments Policies
CREATE POLICY "Teachers can view school assessments"
  ON assessments FOR SELECT
  USING (
    public.is_teacher(auth.uid())
    AND class_id IN (
      SELECT id FROM classes
      WHERE school_id = public.get_user_school_id(auth.uid())
    )
  );

CREATE POLICY "Teachers can manage assessments"
  ON assessments FOR ALL
  USING (
    public.is_teacher(auth.uid())
    AND class_id IN (
      SELECT id FROM classes
      WHERE school_id = public.get_user_school_id(auth.uid())
    )
  );

-- Student Remarks Policies
CREATE POLICY "Teachers can manage remarks"
  ON student_remarks FOR ALL
  USING ( public.is_teacher(auth.uid()) );

-- Teacher Assignments Policies
CREATE POLICY "Teachers can view their assignments"
  ON teacher_assignments FOR SELECT
  USING (
    teacher_id = auth.uid()
    OR (
      public.is_admin_or_headmaster(auth.uid())
      AND class_id IN (
        SELECT id FROM classes
        WHERE school_id = public.get_user_school_id(auth.uid())
      )
    )
  );

-- Promotion History Policies
CREATE POLICY "Headmasters can manage promotions"
  ON promotion_history FOR ALL
  USING ( public.is_headmaster(auth.uid()) );

-- Audit Logs Policies
CREATE POLICY "Users can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    public.is_super_admin(auth.uid())
    OR public.is_admin(auth.uid())
    OR public.is_headmaster(auth.uid())
  );

-- ============================================
-- MIGRATION NOTES
-- ============================================
-- This migration resolves "infinite recursion detected in policy" errors by:
-- 
-- 1. Creating SECURITY DEFINER functions that can safely query the users table
--    without triggering RLS policies recursively.
-- 2. Replacing all recursive SELECT statements in RLS policies with calls to
--    these helper functions.
-- 3. Maintaining the same security semantics while avoiding infinite loops.
--
-- The SECURITY DEFINER functions execute with the privileges of the role that
-- owns the function (typically the database owner), which has unrestricted access
-- to read the users table. This is safe because:
-- - The functions are owned by a trusted role (db owner)
-- - The functions are small and auditable
-- - RLS is not re-triggered when a SECURITY DEFINER function reads tables
-- - Row-level security is still enforced for regular queries that call these functions
