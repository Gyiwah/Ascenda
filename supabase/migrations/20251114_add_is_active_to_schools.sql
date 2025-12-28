-- Add is_active column to schools table for soft deletion/deactivation
ALTER TABLE schools
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Create index on is_active for faster queries
CREATE INDEX idx_schools_is_active ON schools(is_active);
