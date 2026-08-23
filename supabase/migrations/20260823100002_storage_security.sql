-- ============================================================
-- Migration: Storage Security — Avatar IDOR Fix
--
-- VULNERABILITY FIXED:
--   The previous policies allowed ANY authenticated user to
--   upload/update/delete any file in the avatars bucket.
--   An attacker could overwrite another user's avatar by
--   simply uploading to "{victim-uuid}.jpg".
--
-- FIX:
--   Enforce that the storage object name matches the uploading
--   user's own UUID. Since avatars are stored as "{user_id}.jpg",
--   this strictly ties upload/update/delete to the owner.
-- ============================================================

-- Drop the previous permissive policies
DROP POLICY IF EXISTS "Authenticated Users Avatar Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Avatar Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Avatar Delete" ON storage.objects;

-- Re-create with ownership enforcement
-- Users may only upload/modify their own avatar: {auth.uid()}.jpg
CREATE POLICY "Avatar Upload Own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND name = (auth.uid()::text || '.jpg')
  );

CREATE POLICY "Avatar Update Own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name = (auth.uid()::text || '.jpg')
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND name = (auth.uid()::text || '.jpg')
  );

CREATE POLICY "Avatar Delete Own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name = (auth.uid()::text || '.jpg')
  );

-- Public read remains (avatars are intentionally publicly viewable)
-- The existing "Public Read Access on Avatars" policy stays.
