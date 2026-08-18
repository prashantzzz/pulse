-- ============================================================
-- Migration 005: body_measurements
-- User-logged physical measurements over time.
-- Extensible with additional nullable columns as needed.
-- ============================================================

CREATE TABLE public.body_measurements (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  measured_at   TIMESTAMPTZ NOT NULL,
  weight_kg     NUMERIC,
  body_fat_pct  NUMERIC,
  chest_cm      NUMERIC,
  waist_cm      NUMERIC,
  biceps_cm     NUMERIC,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Query pattern: "all measurements for a user, ordered by date"
CREATE INDEX idx_measurements_user_date
  ON public.body_measurements (user_id, measured_at DESC);
