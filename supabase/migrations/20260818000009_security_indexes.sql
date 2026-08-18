-- ============================================================
-- Migration 009: Row Level Security + Indexes
-- Every user-owned table gets RLS. Social tables expose only
-- what is intentional. Public data (exercises) is readable by all.
-- ============================================================

-- ─── Enable RLS on all tables ──────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorite_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_prs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- ─── PROFILES ──────────────────────────────────────────────
-- Users can read any profile (needed for social features / leaderboard).
-- Users can only update their own profile.
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─── EXERCISES (global, public read) ───────────────────────
CREATE POLICY "exercises_select_all"
  ON public.exercises FOR SELECT
  USING (true);

CREATE POLICY "exercise_aliases_select_all"
  ON public.exercise_aliases FOR SELECT
  USING (true);

-- ─── WORKOUT PLANS (private) ───────────────────────────────
CREATE POLICY "plans_select_own"
  ON public.workout_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "plans_insert_own"
  ON public.workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "plans_update_own"
  ON public.workout_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "plans_delete_own"
  ON public.workout_plans FOR DELETE
  USING (auth.uid() = user_id);

-- ─── WORKOUT PLAN EXERCISES (via parent plan) ──────────────
CREATE POLICY "plan_exercises_select_own"
  ON public.workout_plan_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE workout_plans.id = workout_plan_exercises.plan_id
        AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "plan_exercises_insert_own"
  ON public.workout_plan_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE workout_plans.id = workout_plan_exercises.plan_id
        AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "plan_exercises_delete_own"
  ON public.workout_plan_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE workout_plans.id = workout_plan_exercises.plan_id
        AND workout_plans.user_id = auth.uid()
    )
  );

-- ─── WORKOUTS (private, append-oriented) ───────────────────
CREATE POLICY "workouts_select_own"
  ON public.workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "workouts_insert_own"
  ON public.workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workouts_update_own"
  ON public.workouts FOR UPDATE
  USING (auth.uid() = user_id);

-- No DELETE policy: workout history should not be deletable via client.

-- ─── WORKOUT EXERCISES (via parent workout) ────────────────
CREATE POLICY "workout_exercises_select_own"
  ON public.workout_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE workouts.id = workout_exercises.workout_id
        AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_exercises_insert_own"
  ON public.workout_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE workouts.id = workout_exercises.workout_id
        AND workouts.user_id = auth.uid()
    )
  );

-- ─── WORKOUT SETS (via parent exercise → workout) ──────────
CREATE POLICY "workout_sets_select_own"
  ON public.workout_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises
      JOIN public.workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_exercises.id = workout_sets.workout_exercise_id
        AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_sets_insert_own"
  ON public.workout_sets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_exercises
      JOIN public.workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_exercises.id = workout_sets.workout_exercise_id
        AND workouts.user_id = auth.uid()
    )
  );

-- ─── BODY MEASUREMENTS (private) ───────────────────────────
CREATE POLICY "measurements_select_own"
  ON public.body_measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "measurements_insert_own"
  ON public.body_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "measurements_delete_own"
  ON public.body_measurements FOR DELETE
  USING (auth.uid() = user_id);

-- ─── FAVORITES (private) ───────────────────────────────────
CREATE POLICY "favorites_select_own"
  ON public.user_favorite_exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert_own"
  ON public.user_favorite_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete_own"
  ON public.user_favorite_exercises FOR DELETE
  USING (auth.uid() = user_id);

-- ─── MANUAL PRs (private) ──────────────────────────────────
CREATE POLICY "manual_prs_select_own"
  ON public.manual_prs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "manual_prs_insert_own"
  ON public.manual_prs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "manual_prs_delete_own"
  ON public.manual_prs FOR DELETE
  USING (auth.uid() = user_id);

-- ─── FRIENDSHIPS (social: visible to both parties) ─────────
-- Both users in a friendship can see it. Only the requester can
-- create/delete. Either party can update status.
CREATE POLICY "friendships_select_involved"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "friendships_insert_own"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "friendships_update_involved"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "friendships_delete_requester"
  ON public.friendships FOR DELETE
  USING (auth.uid() = requester_id);

-- ─── CHALLENGES (public read, creator-managed) ─────────────
-- Anyone can see active challenges (for discovery).
-- Only the creator can update/delete their own challenge.
CREATE POLICY "challenges_select_all"
  ON public.challenges FOR SELECT
  USING (true);

CREATE POLICY "challenges_insert_own"
  ON public.challenges FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "challenges_update_own"
  ON public.challenges FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "challenges_delete_own"
  ON public.challenges FOR DELETE
  USING (auth.uid() = creator_id);

-- ─── CHALLENGE PARTICIPANTS ────────────────────────────────
-- Anyone can see who joined a challenge (social visibility).
-- Users can join/leave themselves.
CREATE POLICY "challenge_participants_select_all"
  ON public.challenge_participants FOR SELECT
  USING (true);

CREATE POLICY "challenge_participants_insert_own"
  ON public.challenge_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "challenge_participants_delete_own"
  ON public.challenge_participants FOR DELETE
  USING (auth.uid() = user_id);

-- ─── USER GOALS (private) ──────────────────────────────────
CREATE POLICY "goals_select_own"
  ON public.user_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "goals_insert_own"
  ON public.user_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_update_own"
  ON public.user_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "goals_delete_own"
  ON public.user_goals FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Additional indexes for query patterns ──────────────────

-- "find my friends who have been active this week" pattern
-- (used by leaderboard, not stored as a metric)
CREATE INDEX idx_workouts_user_completed
  ON public.workouts (user_id, completed_at DESC)
  WHERE completed_at IS NOT NULL;

-- "find all challenges a user participates in"
CREATE INDEX idx_challenge_participants_user
  ON public.challenge_participants (user_id);

-- "friend lookup by addressee for request notifications"
CREATE INDEX idx_friendships_pending_addressee
  ON public.friendships (addressee_id)
  WHERE status = 'pending';
