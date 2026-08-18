-- ============================================================
-- Migration 003: workout_plans
-- Reusable workout templates. Separated from actual performed
-- workouts so plans can be started/repeated without polluting history.
-- ============================================================

-- Workout plans: reusable templates
CREATE TABLE public.workout_plans (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  emoji       TEXT,
  muscles     TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Exercises within a plan (ordered template slots)
CREATE TABLE public.workout_plan_exercises (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id       UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  exercise_id   TEXT NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  order_index   INT NOT NULL,
  target_sets   INT NOT NULL DEFAULT 3,
  target_reps   TEXT,                           -- e.g. '8-12'
  target_weight NUMERIC,                        -- optional target in kg
  rest_seconds  INT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- One plan per user, ordered within a plan
CREATE UNIQUE INDEX idx_plan_exercises_order
  ON public.workout_plan_exercises (plan_id, order_index);

-- Trigger: auto-touch updated_at on plans
CREATE TRIGGER set_workout_plans_updated_at
  BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
