-- ============================================================
-- Migration: Input Constraints & Business Logic Limits
--
-- PURPOSE:
--   Add database-level guards against business-logic abuse:
--   fabricated weights, impossibly large rep counts, negative
--   values, oversized text fields, and invalid challenge dates.
--
--   These checks run server-side regardless of client behaviour,
--   making them immune to bypass via direct API calls.
-- ============================================================

-- ─── workout_sets — numeric sanity bounds ──────────────────
ALTER TABLE public.workout_sets
  ADD CONSTRAINT chk_weight_kg_range
    CHECK (weight_kg IS NULL OR (weight_kg >= 0 AND weight_kg <= 1500)),
  ADD CONSTRAINT chk_reps_range
    CHECK (reps IS NULL OR (reps >= 0 AND reps <= 9999)),
  ADD CONSTRAINT chk_rpe_range
    CHECK (rpe IS NULL OR (rpe >= 0 AND rpe <= 10)),
  ADD CONSTRAINT chk_distance_range
    CHECK (distance_km IS NULL OR (distance_km >= 0 AND distance_km <= 100000)),
  ADD CONSTRAINT chk_duration_range
    CHECK (duration_seconds IS NULL OR (duration_seconds >= 0 AND duration_seconds <= 86400)),
  ADD CONSTRAINT chk_set_index_positive
    CHECK (set_index > 0);

-- ─── workouts — text length limits ─────────────────────────
ALTER TABLE public.workouts
  ADD CONSTRAINT chk_workout_title_length
    CHECK (char_length(title) <= 200),
  ADD CONSTRAINT chk_workout_notes_length
    CHECK (notes IS NULL OR char_length(notes) <= 2000),
  ADD CONSTRAINT chk_workout_description_length
    CHECK (description IS NULL OR char_length(description) <= 1000);

-- ─── workout_exercises — notes length ──────────────────────
ALTER TABLE public.workout_exercises
  ADD CONSTRAINT chk_exercise_notes_length
    CHECK (notes IS NULL OR char_length(notes) <= 1000);

-- ─── body_measurements — numeric sanity bounds ─────────────
ALTER TABLE public.body_measurements
  ADD CONSTRAINT chk_body_weight_range
    CHECK (weight_kg IS NULL OR (weight_kg > 0 AND weight_kg <= 500)),
  ADD CONSTRAINT chk_body_fat_range
    CHECK (body_fat_pct IS NULL OR (body_fat_pct >= 2 AND body_fat_pct <= 70)),
  ADD CONSTRAINT chk_chest_range
    CHECK (chest_cm IS NULL OR (chest_cm > 0 AND chest_cm <= 300)),
  ADD CONSTRAINT chk_waist_range
    CHECK (waist_cm IS NULL OR (waist_cm > 0 AND waist_cm <= 300)),
  ADD CONSTRAINT chk_biceps_range
    CHECK (biceps_cm IS NULL OR (biceps_cm > 0 AND biceps_cm <= 100));

-- ─── challenges — date and text validation ──────────────────
ALTER TABLE public.challenges
  ADD CONSTRAINT chk_challenge_dates
    CHECK (ends_at > starts_at),
  ADD CONSTRAINT chk_challenge_title_length
    CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  ADD CONSTRAINT chk_challenge_duration
    CHECK ((ends_at - starts_at) <= INTERVAL '365 days');

-- ─── manual_prs — sanity bounds ────────────────────────────
ALTER TABLE public.manual_prs
  ADD CONSTRAINT chk_pr_weight_range
    CHECK (weight_kg >= 0 AND weight_kg <= 1500),
  ADD CONSTRAINT chk_pr_reps_range
    CHECK (reps >= 1 AND reps <= 9999);

-- ─── profiles — text length limits ─────────────────────────
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_display_name_length
    CHECK (display_name IS NULL OR (char_length(display_name) >= 1 AND char_length(display_name) <= 50)),
  ADD CONSTRAINT chk_training_frequency_range
    CHECK (training_frequency IS NULL OR (training_frequency >= 0 AND training_frequency <= 14)),
  ADD CONSTRAINT chk_training_age_range
    CHECK (training_age_months IS NULL OR (training_age_months >= 0 AND training_age_months <= 600));
