-- Storage Bucket Setup for Logos (Simplified - Using Edge Function)
-- This script sets up the logos bucket with minimal RLS policies
-- Logo uploads are handled via Edge Function (upload_logo) which uses service role to bypass RLS
-- Date: 2024

-- Step 1: Ensure the 'logos' bucket exists (create if it doesn't)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true, -- Make bucket public so logos can be accessed
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE
SET public = true, -- Ensure bucket remains public
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- Step 2: Drop all existing policies on logos bucket (Edge Function handles uploads)
DROP POLICY IF EXISTS "Allow authenticated users to upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow super_admin and admin to upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow super_admin and admin to update logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow super_admin and admin to delete logos" ON storage.objects;

-- Step 3: Create simple policy for public read access only
-- Uploads are handled by Edge Function using service role (bypasses RLS)
CREATE POLICY "Allow public read access to logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logos');

-- Note: 
-- - Logo uploads are handled by the 'upload_logo' Edge Function
-- - The Edge Function uses service role to bypass RLS for uploads
-- - Only super_admin and admin users can upload logos (enforced in Edge Function)
-- - Public read access is allowed for all uploaded logos
-- 
-- To deploy the Edge Function:
-- 1. Deploy: supabase functions deploy upload_logo
-- 2. Test logo upload via the app
-- 3. Verify logos are accessible publicly

