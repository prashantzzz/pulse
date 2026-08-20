-- ============================================================
-- Migration: storage_avatars
-- Sets up the 'avatars' public storage bucket with RLS policies.
-- ============================================================

-- Create public bucket 'avatars' if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow public read access on avatars bucket
CREATE POLICY "Public Read Access on Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload and update their avatar
CREATE POLICY "Authenticated Users Avatar Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated Users Avatar Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated Users Avatar Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
