-- ============================================================
-- Migration 004: workouts
-- The authoritative historical record of performed workouts.
-- Append-oriented: finished workouts are immutable in practice.
-- ============================================================

-- Set type enum
CREATE TYPE public.set_type AS ENUM (
  'warmup', 'working', 'failure', 'drop', 'cooldown', 'cardio'
);

-- Workout sessions
CREATE TABLE public.workouts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id      UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  started_at   TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  notes        TEXT,
  source       TEXT DEFAULT 'user' CHECK (source IN ('seed', 'user', 'csv')),
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Exercises within a workout session
CREATE TABLE public.workout_exercises (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id  UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  order_index INT NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Individual sets (the most granular logged data)
CREATE TABLE public.workout_sets (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_exercise_id  UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_index            INT NOT NULL,           -- 1-based position within exercise
  set_type             public.set_type DEFAULT 'working',
  weight_kg            NUMERIC,                -- null for bodyweight/cardio
  reps                 INT,                    -- null for duration-based
  distance_km          NUMERIC,                -- for cardio
  duration_seconds     INT,                    -- for cardio
  rpe                  NUMERIC,                -- rate of perceived exertion
  completed            BOOLEAN DEFAULT false,
  completed_at         TIMESTAMPTZ,
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Query patterns:
-- "all workouts for a user, ordered by date"
CREATE INDEX idx_workouts_user_started
  ON public.workouts (user_id, started_at DESC);

-- "all exercises in a workout"
CREATE INDEX idx_workout_exercises_workout
  ON public.workout_exercises (workout_id, order_index);

-- "all sets for an exercise within a workout"
CREATE INDEX idx_workout_sets_exercise
  ON public.workout_sets (workout_exercise_id, set_index);

-- "find workouts that include a specific exercise" (for PR detection)
CREATE INDEX idx_workout_exercises_exercise
  ON public.workout_exercises (exercise_id);

-- Unique constraint: one set index per exercise within a workout
CREATE UNIQUE INDEX idx_workout_sets_unique_position
  ON public.workout_sets (workout_exercise_id, set_index);

-- Trigger: auto-touch updated_at
CREATE TRIGGER set_workouts_updated_at
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
