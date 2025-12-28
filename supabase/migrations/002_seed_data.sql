-- ============================================
-- SEED DATA FOR ASCENDA
-- Run this after creating the schema
-- ============================================

-- Insert a demo school
INSERT INTO schools (id, name, code, address)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo School',
  'DEMO001',
  '123 Education Street, City, Country'
) ON CONFLICT DO NOTHING;

-- Note: To create users:
-- 1. First create them through Supabase Auth (Authentication → Users → Add User)
-- 2. Then update their role and school_id in the users table:
--
-- UPDATE users 
-- SET 
--   role = 'super_admin',
--   full_name = 'Super Administrator',
--   school_id = NULL
-- WHERE email = 'admin@example.com';
--
-- UPDATE users 
-- SET 
--   role = 'admin',
--   full_name = 'School Administrator',
--   school_id = '00000000-0000-0000-0000-000000000001'
-- WHERE email = 'admin@demoschool.com';

