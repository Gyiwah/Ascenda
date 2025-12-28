/*
  # Enable Row Level Security
  
  1. Security Setup
    - Enable RLS on all tables
    - By default, all tables are now locked down
    - No access until policies are added in next migration
  
  2. Tables Protected
    - schools
    - users
    - classes
    - subjects
    - students
    - teacher_assignments
    - assessments
    - student_remarks
    - promotion_history
    - audit_logs
*/

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
