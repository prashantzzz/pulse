-- ============================================================
-- Migration: Add height_cm, weight_kg, weight_unit to profiles table
-- Enables persistent user biometric state across cloud sessions.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS height_cm INT,
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC,
  ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs'));
