-- ============================================================
-- Migration 008: user_goals
-- Simple, unified goal model for personalization.
-- Different goal types use the same table — no per-type tables.
-- ============================================================

CREATE TYPE public.goal_type AS ENUM (
  'weight_target',    -- e.g. bench press 80 kg
  'reps_target',      -- e.g. 12 pull-ups
  'workout_count',    -- e.g. 20 workouts this month
  'streak_target',    -- e.g. 30-day streak
  'body_metric',      -- e.g. body fat < 15%
  'custom'            -- catch-all
);

CREATE TYPE public.goal_status AS ENUM (
  'active', 'completed', 'abandoned'
);

CREATE TABLE public.user_goals (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          public.goal_type NOT NULL,
  title         TEXT NOT NULL,                  -- user-friendly label
  target_value  NUMERIC,                        -- numeric target (nullable)
  unit          TEXT,                           -- 'kg', 'reps', 'workouts', 'days', '%'
  exercise_id   TEXT REFERENCES public.exercises(id) ON DELETE SET NULL,
  start_date    TIMESTAMPTZ DEFAULT now() NOT NULL,
  target_date   TIMESTAMPTZ,
  status        public.goal_status DEFAULT 'active' NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Query patterns
CREATE INDEX idx_goals_user_status
  ON public.user_goals (user_id, status);

-- Trigger: auto-touch updated_at
CREATE TRIGGER set_user_goals_updated_at
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
