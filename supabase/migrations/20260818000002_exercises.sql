-- ============================================================
-- Migration 002: exercises
-- Global exercise knowledge base. Not user-owned.
-- Provides stable canonical IDs for workout references.
-- ============================================================

-- Enum types for the exercise catalog
CREATE TYPE public.muscle_group AS ENUM (
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quads', 'Hamstrings', 'Glutes', 'Calves',
  'Core', 'Forearms', 'Cardio'
);

CREATE TYPE public.equipment_type AS ENUM (
  'Barbell', 'Dumbbell', 'Machine', 'Cable',
  'Bodyweight', 'Kettlebell', 'Band', 'Cardio'
);

CREATE TYPE public.difficulty_level AS ENUM (
  'Beginner', 'Intermediate', 'Advanced'
);

CREATE TYPE public.exercise_category AS ENUM (
  'Compound', 'Isolation'
);

CREATE TYPE public.movement_pattern AS ENUM (
  'Push', 'Pull', 'Legs', 'Core', 'Cardio'
);

CREATE TYPE public.body_region AS ENUM (
  'Upper', 'Lower', 'Core', 'Full Body'
);

CREATE TYPE public.animation_key AS ENUM (
  'bench', 'press', 'raise', 'fly', 'row', 'pulldown',
  'curl', 'pushdown', 'squat', 'deadlift', 'lunge',
  'calf', 'crunch', 'plank', 'run'
);

-- Exercises: the global knowledge base
CREATE TABLE public.exercises (
  id               TEXT PRIMARY KEY,               -- slug, e.g. 'bench-press'
  canonical_name   TEXT NOT NULL,
  description      TEXT,
  exercise_type    public.exercise_category NOT NULL,
  difficulty       public.difficulty_level NOT NULL,
  movement_pattern public.movement_pattern NOT NULL,
  body_region      public.body_region NOT NULL,
  primary_muscle   public.muscle_group NOT NULL,
  secondary_muscles public.muscle_group[] DEFAULT '{}',
  equipment        public.equipment_type NOT NULL,
  location         TEXT CHECK (location IN ('Gym', 'Home', 'Both')),
  beginner_friendly BOOLEAN DEFAULT false,
  animation_key    public.animation_key NOT NULL,
  about            TEXT,
  steps            JSONB DEFAULT '[]',
  common_mistakes  TEXT[] DEFAULT '{}',
  breathing        TEXT,
  rep_range        TEXT,
  beginner_tips    TEXT[] DEFAULT '{}',
  progression_tips TEXT[] DEFAULT '{}',
  safety_tips      TEXT[] DEFAULT '{}',
  alternatives     TEXT[] DEFAULT '{}',            -- exercise IDs
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Aliases for CSV import fuzzy matching
CREATE TABLE public.exercise_aliases (
  exercise_id TEXT NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  alias       TEXT NOT NULL,
  PRIMARY KEY (exercise_id, alias)
);

-- Index for alias lookups (CSV import resolution)
CREATE INDEX idx_exercise_aliases_alias ON public.exercise_aliases (alias);

-- Trigger: auto-touch updated_at
CREATE TRIGGER set_exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
