-- Add configurable assessment grade configuration to schools table
-- This will store an array of grade bands, e.g.
-- [
--   { "min": 80, "max": 100, "label": "A1" },
--   { "min": 75, "max": 79, "label": "B2" }
-- ]

ALTER TABLE schools
ADD COLUMN IF NOT EXISTS assessment_grade_config JSONB;

COMMENT ON COLUMN schools.assessment_grade_config IS
  'JSON array of grade bands for assessments (min, max, label) configured per school';


