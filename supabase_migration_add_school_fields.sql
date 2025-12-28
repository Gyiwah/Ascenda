-- Migration: Add postal_address field and make code optional in schools table
-- Date: 2024
-- Description: 
--   1. Add postal_address column to schools table (optional)
--   2. Make code column nullable (optional)
--   3. Ensure contact_phone and contact_email columns exist (they should already exist)

-- Step 1: Make code column nullable (if it's currently NOT NULL)
ALTER TABLE schools 
ALTER COLUMN code DROP NOT NULL;

-- Step 2: Add postal_address column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'schools' 
    AND column_name = 'postal_address'
  ) THEN
    ALTER TABLE schools 
    ADD COLUMN postal_address TEXT;
  END IF;
END $$;

-- Step 3: Ensure contact_phone column exists (should already exist, but safe to check)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'schools' 
    AND column_name = 'contact_phone'
  ) THEN
    ALTER TABLE schools 
    ADD COLUMN contact_phone TEXT;
  END IF;
END $$;

-- Step 4: Ensure contact_email column exists (should already exist, but safe to check)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'schools' 
    AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE schools 
    ADD COLUMN contact_email TEXT;
  END IF;
END $$;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN schools.postal_address IS 'Postal address of the school (optional)';
COMMENT ON COLUMN schools.code IS 'School code (now optional)';
COMMENT ON COLUMN schools.contact_phone IS 'Contact telephone number (optional)';
COMMENT ON COLUMN schools.contact_email IS 'Contact email address (optional)';

