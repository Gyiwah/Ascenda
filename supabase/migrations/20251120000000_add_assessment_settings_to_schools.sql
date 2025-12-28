-- Add assessment score settings columns to schools table
-- These columns allow schools to configure maximum CA and Exam scores

ALTER TABLE schools
ADD COLUMN IF NOT EXISTS assessment_ca_max INTEGER DEFAULT 40 CHECK (assessment_ca_max >= 0 AND assessment_ca_max <= 1000),
ADD COLUMN IF NOT EXISTS assessment_exam_max INTEGER DEFAULT 60 CHECK (assessment_exam_max >= 0 AND assessment_exam_max <= 1000);

-- Add comment to document the columns
COMMENT ON COLUMN schools.assessment_ca_max IS 'Maximum score allowed for Continuous Assessment (CA) across all assessments in the school';
COMMENT ON COLUMN schools.assessment_exam_max IS 'Maximum score allowed for Examination across all assessments in the school';

-- Update existing schools to have default values if they are NULL
UPDATE schools
SET 
  assessment_ca_max = 40,
  assessment_exam_max = 60
WHERE assessment_ca_max IS NULL OR assessment_exam_max IS NULL;

