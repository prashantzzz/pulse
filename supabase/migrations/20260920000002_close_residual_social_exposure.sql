-- ============================================================
-- Migration: Close residual social-data exposure
--
-- Follow-up to 20260920000001, which replaced the world-readable
-- "profiles_select_all" policy with a "self or accepted friend"
-- policy. That friend branch is still abusable: friendships can be
-- created unilaterally at status='accepted' (friendships_insert_own
-- only checks auth.uid() = requester_id), so anyone who knows a
-- user's UUID could self-friend them and then read that profile.
--
-- Fixes:
--   1. profiles — reads are restricted to the caller's OWN row.
--      (workouts/measurements already never consult friendships, so
--      a forged friendship now grants no data at all.) Friend-based
--      visibility should only return together with a consent-based
--      friendship flow, built alongside the social feature.
--   2. challenges / challenge_participants — SELECT scoped to
--      authenticated users instead of world-readable USING (true).
--
-- Additive & idempotent: DROP POLICY IF EXISTS + CREATE POLICY.
-- ============================================================

-- ─── 1. PROFILES — self-only read ───────────────────────────
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_self_or_friend" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ─── 2. CHALLENGES — authenticated-only read ────────────────
DROP POLICY IF EXISTS "challenges_select_all" ON public.challenges;
DROP POLICY IF EXISTS "challenges_select_authenticated" ON public.challenges;

CREATE POLICY "challenges_select_authenticated"
  ON public.challenges FOR SELECT
  TO authenticated
  USING (true);

-- ─── 3. CHALLENGE_PARTICIPANTS — authenticated-only read ────
DROP POLICY IF EXISTS "challenge_participants_select_all" ON public.challenge_participants;
DROP POLICY IF EXISTS "challenge_participants_select_authenticated" ON public.challenge_participants;

CREATE POLICY "challenge_participants_select_authenticated"
  ON public.challenge_participants FOR SELECT
  TO authenticated
  USING (true);
