-- ============================================================
-- Migration: save_workout RPC & Index Optimizations
-- 1. Creates an atomic save_workout(payload jsonb) stored procedure
--    for single-request, transactional workout session saving.
-- 2. Drops redundant duplicate index on workout_sets.
-- 3. Adds index on workout_plans(user_id) for fast sync and RLS.
-- ============================================================

-- 1. Index Optimizations
-- Drop duplicate index: idx_workout_sets_unique_position already indexes (workout_exercise_id, set_index)
DROP INDEX IF EXISTS public.idx_workout_sets_exercise;

-- Add index on workout_plans for user_id to optimize user routine queries and RLS
CREATE INDEX IF NOT EXISTS idx_workout_plans_user
  ON public.workout_plans (user_id);

-- 2. Atomic save_workout stored procedure
CREATE OR REPLACE FUNCTION public.save_workout(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_workout_id UUID;
  v_input_workout_id UUID;
  v_ex_row RECORD;
  v_exercise_id UUID;
  v_set_type_str TEXT;
  v_set_type_val public.set_type;
BEGIN
  -- Determine user_id: prefer authenticated context, fallback to payload user_id
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    IF payload ? 'user_id' THEN
      v_user_id := (payload->>'user_id')::UUID;
    ELSE
      RAISE EXCEPTION 'User ID not provided or authenticated';
    END IF;
  END IF;

  -- Determine workout UUID
  IF payload ? 'id' AND (payload->>'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_input_workout_id := (payload->>'id')::UUID;
  ELSE
    v_input_workout_id := gen_random_uuid();
  END IF;

  -- 1. Upsert Workout Session
  INSERT INTO public.workouts (
    id,
    user_id,
    title,
    description,
    started_at,
    completed_at,
    notes,
    source,
    created_at,
    updated_at
  ) VALUES (
    v_input_workout_id,
    v_user_id,
    COALESCE(payload->>'title', 'Workout'),
    payload->>'description',
    COALESCE((payload->>'started_at')::TIMESTAMPTZ, (payload->>'startTime')::TIMESTAMPTZ, now()),
    COALESCE((payload->>'completed_at')::TIMESTAMPTZ, (payload->>'endTime')::TIMESTAMPTZ, now()),
    payload->>'notes',
    COALESCE(payload->>'source', 'user'),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    started_at = EXCLUDED.started_at,
    completed_at = EXCLUDED.completed_at,
    notes = EXCLUDED.notes,
    source = EXCLUDED.source,
    updated_at = now()
  RETURNING id INTO v_workout_id;

  -- 2. Clear existing exercises (cascade deletes sets) to ensure idempotent save
  DELETE FROM public.workout_exercises WHERE workout_id = v_workout_id;

  -- 3. Insert Exercises & Sets
  IF payload ? 'exercises' AND jsonb_typeof(payload->'exercises') = 'array' THEN
    FOR v_ex_row IN
      SELECT
        COALESCE(e->>'exercise_id', e->>'exerciseId') AS exercise_id,
        (ordinality - 1)::INT AS order_index,
        e->>'notes' AS notes,
        e->'sets' AS sets
      FROM jsonb_array_elements(payload->'exercises') WITH ORDINALITY AS e
    LOOP
      IF v_ex_row.exercise_id IS NOT NULL THEN
        -- Insert workout_exercise
        INSERT INTO public.workout_exercises (
          id,
          workout_id,
          exercise_id,
          order_index,
          notes,
          created_at
        ) VALUES (
          gen_random_uuid(),
          v_workout_id,
          v_ex_row.exercise_id,
          v_ex_row.order_index,
          v_ex_row.notes,
          now()
        )
        RETURNING id INTO v_exercise_id;

        -- Insert sets for this exercise
        IF v_ex_row.sets IS NOT NULL AND jsonb_typeof(v_ex_row.sets) = 'array' THEN
          INSERT INTO public.workout_sets (
            id,
            workout_exercise_id,
            set_index,
            set_type,
            weight_kg,
            reps,
            distance_km,
            duration_seconds,
            rpe,
            completed,
            completed_at,
            notes,
            created_at
          )
          SELECT
            gen_random_uuid(),
            v_exercise_id,
            COALESCE((s->>'set_index')::INT, (s->>'setIndex')::INT, ordinality::INT),
            CASE
              WHEN LOWER(COALESCE(s->>'set_type', s->>'setType', '')) IN ('warmup', 'working', 'failure', 'drop', 'cooldown', 'cardio')
                THEN LOWER(COALESCE(s->>'set_type', s->>'setType'))::public.set_type
              ELSE 'working'::public.set_type
            END,
            (COALESCE(s->>'weight_kg', s->>'weightKg'))::NUMERIC,
            (s->>'reps')::INT,
            (COALESCE(s->>'distance_km', s->>'distanceKm'))::NUMERIC,
            (COALESCE(s->>'duration_seconds', s->>'durationSec'))::INT,
            (s->>'rpe')::NUMERIC,
            COALESCE((s->>'completed')::BOOLEAN, true),
            (COALESCE(s->>'completed_at', s->>'completedAt'))::TIMESTAMPTZ,
            s->>'notes',
            now()
          FROM jsonb_array_elements(v_ex_row.sets) WITH ORDINALITY AS s;
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'workout_id', v_workout_id);
END;
$$;

-- Grant execution permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.save_workout(JSONB) TO authenticated, service_role;
