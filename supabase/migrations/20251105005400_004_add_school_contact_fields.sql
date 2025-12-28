-- Add contact fields to schools table
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text;

-- Create index for contact_email lookups
CREATE INDEX IF NOT EXISTS idx_schools_contact_email ON schools(contact_email);

