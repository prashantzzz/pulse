-- ============================================================
-- Migration: workout plan ordering
-- My Plans supports drag-and-drop reordering, so each plan
-- keeps its position within the user's active routine.
-- ============================================================

ALTER TABLE public.workout_plans
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- Plans are always read per user and rendered in routine order.
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_sort
  ON public.workout_plans (user_id, sort_order);
