-- ============================================================
-- Migration: RLS Policy Hardening
--
-- SECURITY FIXES:
--   1. Add WITH CHECK to all UPDATE policies that were missing it.
--      Without WITH CHECK an attacker can reassign user_id/id fields
--      on records they own, effectively moving data between accounts
--      (mass assignment / horizontal privilege escalation).
--
--   2. Fix SECURITY DEFINER functions to use SET search_path.
--      Without this, a malicious schema on the search path could
--      shadow standard functions (e.g. now(), COALESCE) and execute
--      attacker-controlled code with elevated privileges.
--
-- All changes are additive / idempotent replacements using
-- DROP POLICY IF EXISTS + CREATE POLICY and CREATE OR REPLACE FUNCTION.
-- ============================================================

-- ─── 1. PROFILES — prevent id reassignment ──────────────────
-- Previously: no WITH CHECK on UPDATE, attacker could change id to victim's UUID.
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─── 2. WORKOUTS — prevent user_id reassignment ─────────────
-- Previously: no WITH CHECK, attacker could set user_id to victim's UUID.
DROP POLICY IF EXISTS "workouts_update_own" ON public.workouts;
CREATE POLICY "workouts_update_own"
  ON public.workouts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 3. WORKOUT_PLANS — add WITH CHECK ──────────────────────
DROP POLICY IF EXISTS "plans_update_own" ON public.workout_plans;
CREATE POLICY "plans_update_own"
  ON public.workout_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 4. WORKOUT_PLAN_EXERCISES — add UPDATE policy with WITH CHECK ──
-- (No update policy existed; add one for completeness)
DROP POLICY IF EXISTS "plan_exercises_update_own" ON public.workout_plan_exercises;
CREATE POLICY "plan_exercises_update_own"
  ON public.workout_plan_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE workout_plans.id = workout_plan_exercises.plan_id
        AND workout_plans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE workout_plans.id = workout_plan_exercises.plan_id
        AND workout_plans.user_id = auth.uid()
    )
  );

-- ─── 5. BODY_MEASUREMENTS — add UPDATE policy with WITH CHECK ───
DROP POLICY IF EXISTS "measurements_update_own" ON public.body_measurements;
CREATE POLICY "measurements_update_own"
  ON public.body_measurements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 6. MANUAL_PRs — add UPDATE policy with WITH CHECK ──────
DROP POLICY IF EXISTS "manual_prs_update_own" ON public.manual_prs;
CREATE POLICY "manual_prs_update_own"
  ON public.manual_prs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 7. USER_FAVORITE_EXERCISES — add UPDATE policy ─────────
DROP POLICY IF EXISTS "favorites_update_own" ON public.user_favorite_exercises;
CREATE POLICY "favorites_update_own"
  ON public.user_favorite_exercises FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 8. FRIENDSHIPS — add WITH CHECK to prevent reassignment ─
-- Previously: no WITH CHECK. Either party could change requester_id
-- or addressee_id to arbitrary UUIDs.
DROP POLICY IF EXISTS "friendships_update_involved" ON public.friendships;
CREATE POLICY "friendships_update_involved"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ─── 9. CHALLENGES — add WITH CHECK to prevent creator_id reassignment ──
DROP POLICY IF EXISTS "challenges_update_own" ON public.challenges;
CREATE POLICY "challenges_update_own"
  ON public.challenges FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- ─── 10. USER_GOALS — add WITH CHECK ────────────────────────
DROP POLICY IF EXISTS "goals_update_own" ON public.user_goals;
CREATE POLICY "goals_update_own"
  ON public.user_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 11. WORKOUT_EXERCISES — add UPDATE + DELETE policies ────
-- Previously missing; add for completeness so exercises can be
-- modified/deleted only by the owning user.
DROP POLICY IF EXISTS "workout_exercises_update_own" ON public.workout_exercises;
CREATE POLICY "workout_exercises_update_own"
  ON public.workout_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE workouts.id = workout_exercises.workout_id
        AND workouts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE workouts.id = workout_exercises.workout_id
        AND workouts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workout_exercises_delete_own" ON public.workout_exercises;
CREATE POLICY "workout_exercises_delete_own"
  ON public.workout_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE workouts.id = workout_exercises.workout_id
        AND workouts.user_id = auth.uid()
    )
  );

-- ─── 12. WORKOUT_SETS — add UPDATE + DELETE policies ─────────
DROP POLICY IF EXISTS "workout_sets_update_own" ON public.workout_sets;
CREATE POLICY "workout_sets_update_own"
  ON public.workout_sets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises
      JOIN public.workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_exercises.id = workout_sets.workout_exercise_id
        AND workouts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_exercises
      JOIN public.workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_exercises.id = workout_sets.workout_exercise_id
        AND workouts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workout_sets_delete_own" ON public.workout_sets;
CREATE POLICY "workout_sets_delete_own"
  ON public.workout_sets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises
      JOIN public.workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_exercises.id = workout_sets.workout_exercise_id
        AND workouts.user_id = auth.uid()
    )
  );

-- ─── 13. Fix SECURITY DEFINER functions — add SET search_path ──
-- Without this, an attacker who can create schemas may shadow
-- built-in functions (now(), COALESCE) and have them execute
-- under the function's elevated privileges.

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name'
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
