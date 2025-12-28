-- Relax grade constraint on assessments to allow custom labels like A1, B2, etc.

-- Drop any existing CHECK constraint on grade (name may differ across environments)
ALTER TABLE assessments
DROP CONSTRAINT IF EXISTS assessments_grade_check;

-- Ensure grade column can hold longer custom labels
ALTER TABLE assessments
ALTER COLUMN grade TYPE TEXT;


