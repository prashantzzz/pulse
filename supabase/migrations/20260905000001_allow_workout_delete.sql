-- ============================================================
-- Migration: Allow Authenticated Users to Delete Their Own Workouts
--
-- Security:
--   - Uses USING (auth.uid() = user_id) so users can NEVER delete
--     another user's workout data.
--   - Child records in workout_exercises and workout_sets cascade
--     automatically via existing ON DELETE CASCADE constraints.
-- ============================================================

DROP POLICY IF EXISTS "workouts_delete_own" ON public.workouts;
CREATE POLICY "workouts_delete_own"
  ON public.workouts FOR DELETE
  USING (auth.uid() = user_id);
