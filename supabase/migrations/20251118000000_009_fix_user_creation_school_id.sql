-- Migration: Fix user creation to preserve school_id
-- Date: 2025-11-18
-- Purpose: Update handle_new_user trigger to include school_id from user metadata and use upsert

-- Update the handle_new_user function to include school_id and use upsert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, school_id, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'school_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'school_id')::uuid 
      ELSE NULL 
    END,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    school_id = COALESCE(EXCLUDED.school_id, users.school_id),
    is_active = EXCLUDED.is_active;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

