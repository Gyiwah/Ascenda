-- Migration: Allow super_admin to view all students and classes
-- Date: 2025-12-02
-- Purpose: Add RLS policies to allow super_admin users to view students and classes
--          from all schools, not just their own (since super_admin has school_id = null)

-- ============================================
-- ADD SUPER ADMIN POLICIES FOR STUDENTS
-- ============================================

-- Allow super_admin to view all students
CREATE POLICY "Super admins can view all students"
  ON students FOR SELECT
  USING ( public.is_super_admin(auth.uid()) );

-- ============================================
-- ADD SUPER ADMIN POLICIES FOR CLASSES
-- ============================================

-- Allow super_admin to view all classes
CREATE POLICY "Super admins can view all classes"
  ON classes FOR SELECT
  USING ( public.is_super_admin(auth.uid()) );
