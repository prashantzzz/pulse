-- ============================================================
-- Migration 006: user_favorite_exercises + manual_prs
-- User-specific data that is not derived from workout history.
-- ============================================================

-- Favorite exercises (simple join table)
CREATE TABLE public.user_favorite_exercises (
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, exercise_id)
);

-- Manual personal records: explicitly logged by the user, often
-- representing records from before they started using the app.
-- NOT derived from workout history — authoritative user-created data.
CREATE TABLE public.manual_prs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  weight_kg   NUMERIC NOT NULL,
  reps        INT NOT NULL,
  date        TIMESTAMPTZ NOT NULL,             -- when the PR was achieved
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Query patterns
CREATE INDEX idx_manual_prs_user_exercise
  ON public.manual_prs (user_id, exercise_id, date DESC);

CREATE INDEX idx_favorites_user
  ON public.user_favorite_exercises (user_id);
