-- ============================================================
-- Migration 011: Seed test user data for Prashant (boizphotos13@gmail.com)
-- User ID: 9d85a18d-4dcc-442a-aea8-2e9e5516c301
-- ============================================================

-- 1. Ensure Profile exists & updated
INSERT INTO public.profiles (
  id, display_name, avatar_url, gender,
  goal, experience_level, training_frequency, equipment, onboarded,
  created_at, updated_at
) VALUES (
  '9d85a18d-4dcc-442a-aea8-2e9e5516c301',
  'Prashant',
  'https://lh3.googleusercontent.com/a/ACg8ocJNIp2g2xsLxBshaMw45Sm7jn-2dBNYP82IrzXxFGSFXiNQXT1-=s96-c',
  'male',
  ARRAY['Build Muscle', 'Gain Strength']::TEXT[],
  'Intermediate',
  4,
  ARRAY['Barbell', 'Dumbbell', 'Machine', 'Cable']::TEXT[],
  true,
  '2026-08-18 20:35:30+00',
  now()
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  gender = EXCLUDED.gender,
  goal = EXCLUDED.goal,
  experience_level = EXCLUDED.experience_level,
  training_frequency = EXCLUDED.training_frequency,
  equipment = EXCLUDED.equipment,
  onboarded = EXCLUDED.onboarded,
  updated_at = now();

-- 2. Body Measurements (61kg 3 months ago -> 66kg now)
DELETE FROM public.body_measurements WHERE user_id = '9d85a18d-4dcc-442a-aea8-2e9e5516c301';

INSERT INTO public.body_measurements (user_id, measured_at, weight_kg, notes) VALUES
  ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', '2026-05-18 08:00:00+00', 61.0, 'Starting weight (3 months back)'),
  ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', '2026-06-03 08:00:00+00', 61.8, 'Consistent training week 2'),
  ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', '2026-06-18 08:00:00+00', 62.6, 'Month 1 check-in'),
  ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', '2026-07-03 08:00:00+00', 63.5, 'Strength improving'),
  ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', '2026-07-18 08:00:00+00', 64.4, 'Month 2 check-in'),
  ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', '2026-08-04 08:00:00+00', 65.3, 'Hitting new PRs'),
  ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', '2026-08-18 08:00:00+00', 66.0, 'Current weight (+5 kg total gain)');

-- 3. Clear existing workouts for clean insert
DELETE FROM public.workouts WHERE user_id = '9d85a18d-4dcc-442a-aea8-2e9e5516c301';
DELETE FROM public.workout_plans WHERE user_id = '9d85a18d-4dcc-442a-aea8-2e9e5516c301';

-- 4. Workout Plans (Starter Templates)

DO $$
DECLARE
  v_plan_id UUID;
BEGIN
  INSERT INTO public.workout_plans (user_id, name, description, emoji, muscles)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Push Day', 'Push Day template', '🔥', ARRAY['Chest', 'Shoulders', 'Triceps']::TEXT[])
  RETURNING id INTO v_plan_id;

  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'bench-press', 0, 4, '6-8', 90);
  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'incline-bench-press', 1, 3, '8-10', 90);
  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'shoulder-press', 2, 3, '8-10', 90);
  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'lateral-raise', 3, 3, '12-15', 90);
  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'triceps-pushdown', 4, 3, '10-15', 90);
END $$;

DO $$
DECLARE
  v_plan_id UUID;
BEGIN
  INSERT INTO public.workout_plans (user_id, name, description, emoji, muscles)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Pull Day', 'Pull Day template', '🏹', ARRAY['Back', 'Biceps']::TEXT[])
  RETURNING id INTO v_plan_id;

  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'deadlift', 0, 3, '5-6', 90);
  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'lat-pulldown', 1, 3, '8-12', 90);
  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'seated-cable-row', 2, 3, '8-12', 90);
  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'bicep-curl', 3, 3, '8-12', 90);
  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'hammer-curl', 4, 2, '10-12', 90);
END $$;

DO $$
DECLARE
  v_plan_id UUID;
BEGIN
  INSERT INTO public.workout_plans (user_id, name, description, emoji, muscles)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Leg Day', 'Leg Day template', '🦵', ARRAY['Quads', 'Hamstrings', 'Calves']::TEXT[])
  RETURNING id INTO v_plan_id;

  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'squat', 0, 4, '6-8', 90);
  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'romanian-deadlift', 1, 3, '8-10', 90);
  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'leg-press', 2, 3, '10-12', 90);
  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'calf-raise', 3, 3, '12-15', 90);
END $$;

DO $$
DECLARE
  v_plan_id UUID;
BEGIN
  INSERT INTO public.workout_plans (user_id, name, description, emoji, muscles)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Upper Body', 'Upper Body template', '💪', ARRAY['Chest', 'Back', 'Shoulders']::TEXT[])
  RETURNING id INTO v_plan_id;

  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'incline-bench-press', 0, 3, '8-10', 90);
  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'barbell-row', 1, 3, '8-10', 90);
  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'lat-pulldown', 2, 3, '10-12', 90);
  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'seated-cable-row', 3, 2, '10-12', 90);
  INSERT INTO public.workout_plan_exercises (plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds)
  VALUES (v_plan_id, 'lateral-raise', 4, 2, '15-20', 90);
END $$;

-- 5. Workouts & Sets from workout_data_filled.csv (40 sessions)

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Legs', '', '2026-08-15T12:30:00.000Z', '2026-08-15T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'squat', 0, 'logged directly as 90kg total (not ''each'')')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 90, 5, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'leg-press', 1, 'logged directly as max +5kg = 62kg total')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 62, 10, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Pull', '', '2026-08-12T12:30:00.000Z', '2026-08-12T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bicep-curl', 0, 'new dumbbell variant, not in original plan')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 10, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 10, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 10, 10, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'deadlift', 1, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 85, 5, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 85, 5, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 85, 5, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'pull-up', 2, 'bodyweight; not in original plan')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 6, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'lat-pulldown', 3, '7th hole (pin position)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'seated-cable-row', 4, '8th hole (pin position)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Push', '', '2026-08-09T12:30:00.000Z', '2026-08-09T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'incline-bench-press', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 17.5, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 20, 10, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Legs', '', '2026-08-08T12:30:00.000Z', '2026-08-08T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'squat', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 75, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 75, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 75, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 75, 8, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Pull', '', '2026-08-05T12:30:00.000Z', '2026-08-05T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'barbell-row', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 45, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 45, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 45, 8, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'lat-pulldown', 1, '7th hole (pin position)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 5, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 6, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'deadlift', 2, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 85, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 85, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 85, 6, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'seated-cable-row', 3, '8th hole (pin position)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Push', '', '2026-08-02T12:30:00.000Z', '2026-08-02T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'incline-bench-press', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 20, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 17.5, 8, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'decline-bench-press', 1, 'new accessory exercise, not in original plan')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 15, 10, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bench-press', 2, 'logged as 20-22.5kg each, using average')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 62.5, 5, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 62.5, 5, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 62.5, 5, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'shoulder-press', 3, 'weight as logged (no ''each'' noted)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 15, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 15, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 15, 8, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'triceps-pushdown', 4, '4th hole (pin position)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'lateral-raise', 5, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 7.5, 13, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 7.5, 13, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 7.5, 13, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Push', '', '2026-07-30T12:30:00.000Z', '2026-07-30T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bench-press', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 65, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 65, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 65, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 65, 8, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'incline-bench-press', 1, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 17.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 17.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 17.5, 8, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Pull', '', '2026-07-30T12:30:00.000Z', '2026-07-30T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'deadlift', 0, 'logged as 27.5-30kg each, using average')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 77.5, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 77.5, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 77.5, 6, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'lat-pulldown', 1, '6.5th-7th hole (pin position)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'seated-cable-row', 2, '8th hole (pin position)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bicep-curl', 3, 'new dumbbell variant, not in original plan')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 7.5, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 7.5, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 7.5, 10, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Push', '', '2026-07-29T12:30:00.000Z', '2026-07-29T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bench-press', 0, 'logged as 20-22.5kg each, using average')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 62.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 62.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 62.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 62.5, 8, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'shoulder-press', 1, 'logged as 15-17.5kg, using average')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 16.25, 7, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 16.25, 7, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 16.25, 7, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Pull', '', '2026-07-29T12:30:00.000Z', '2026-07-29T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'seated-cable-row', 0, '7.5th-8th hole (pin position)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'hammer-curl', 1, 'logged as 12.5-15kg x6reps, using average')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 13.75, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 13.75, 6, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Pull', '', '2026-07-22T12:30:00.000Z', '2026-07-22T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'barbell-row', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 40, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 40, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 40, 8, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'lat-pulldown', 1, '7th hole (pin position)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'deadlift', 2, 'explicitly logged: 25-27.5kg each x5reps, using average')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 72.5, 5, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 72.5, 5, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 72.5, 5, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'triceps-pushdown', 3, '4th hole (pin position) -- logged alongside Pull session')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 13, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 13, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 13, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'hammer-curl', 4, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 12.5, 11, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 12.5, 11, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Legs', '', '2026-07-22T12:30:00.000Z', '2026-07-22T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'squat', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 70, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 70, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 70, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 70, 8, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'leg-press', 1, '-1 hole (pin position)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Push', '', '2026-07-15T12:30:00.000Z', '2026-07-15T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bench-press', 0, 'logged as 17.5-20kg each x4reps')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 57.5, 4, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 57.5, 4, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 57.5, 4, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 57.5, 4, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'shoulder-press', 1, 'weight as logged (no ''each'' noted)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 15, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 15, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 15, 6, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'incline-bench-press', 2, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 17.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 17.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 17.5, 8, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Legs', '', '2026-07-14T12:30:00.000Z', '2026-07-14T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'squat', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 65, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 65, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 65, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 65, 8, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Pull', '', '2026-07-09T12:30:00.000Z', '2026-07-09T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'barbell-row', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 40, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 40, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 40, 8, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bicep-curl', 1, 'logged as 7.5-10kg each, using average')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 37.5, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 37.5, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 37.5, 10, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'lat-pulldown', 2, '6.5th-7th hole (pin position)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'deadlift', 3, 'explicitly logged: 6 reps x 3 sets')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 70, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 70, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 70, 6, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'seated-cable-row', 4, '8th hole (pin position)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 7, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Push', '', '2026-07-05T12:30:00.000Z', '2026-07-05T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bench-press', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 55, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 55, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 55, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 55, 8, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'shoulder-press', 1, 'weight as logged (no ''each'' noted)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 15, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 12.5, 7, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Legs', '', '2026-07-02T12:30:00.000Z', '2026-07-02T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'squat', 0, 'interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 60, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 60, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 60, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 60, 8, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Pull', '', '2026-06-29T12:30:00.000Z', '2026-06-29T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bicep-curl', 0, 'interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 37.5, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 37.5, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 37.5, 10, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'deadlift', 1, 'interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 67.5, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 67.5, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 67.5, 6, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'seated-cable-row', 2, '8th hole (pin position) -- interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'lat-pulldown', 3, '6.5th-7th hole (pin position) -- interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Push', '', '2026-06-26T12:30:00.000Z', '2026-06-26T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bench-press', 0, 'interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 52.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 52.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 52.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 52.5, 8, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Legs', '', '2026-06-23T12:30:00.000Z', '2026-06-23T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'squat', 0, 'interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 57.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 57.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 57.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 57.5, 8, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'leg-press', 1, '-2 hole (pin position) -- interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Pull', '', '2026-06-20T12:30:00.000Z', '2026-06-20T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bicep-curl', 0, 'interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 35, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 35, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 35, 12, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'deadlift', 1, 'interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 65, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 65, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 65, 6, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'seated-cable-row', 2, '8 plates (stack setting) -- interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'lat-pulldown', 3, '6th-6.5th hole (pin position) -- interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'hammer-curl', 4, 'interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 12.5, 11, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 12.5, 11, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Push', '', '2026-06-17T12:30:00.000Z', '2026-06-17T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bench-press', 0, 'interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 52.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 52.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 52.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 52.5, 8, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'incline-bench-press', 1, 'interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 16.25, 9, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 16.25, 9, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 16.25, 9, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Legs', '', '2026-06-14T12:30:00.000Z', '2026-06-14T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'squat', 0, 'interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 55, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 55, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 55, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 55, 8, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Pull', '', '2026-06-11T12:30:00.000Z', '2026-06-11T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bicep-curl', 0, 'interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 32.5, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 32.5, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 32.5, 12, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'deadlift', 1, 'interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 60, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 60, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 60, 6, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'seated-cable-row', 2, '7-8 plates (stack setting) -- interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'lat-pulldown', 3, '6th hole (pin position) -- interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'hammer-curl', 4, 'interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 12.5, 11, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 12.5, 11, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Push', '', '2026-06-08T12:30:00.000Z', '2026-06-08T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bench-press', 0, 'interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 50, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 50, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 50, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 50, 8, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'incline-bench-press', 1, 'interpolated to fill a 30-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 15, 9, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 15, 9, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 15, 9, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Legs', '', '2026-06-05T12:30:00.000Z', '2026-06-05T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'squat', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 50, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 50, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 50, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 50, 8, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Pull', '', '2026-06-02T12:30:00.000Z', '2026-06-02T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bicep-curl', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 30, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 30, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 30, 12, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'seated-cable-row', 1, '7-8 plates (stack setting)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'lat-pulldown', 2, '5th-6th hole (pin position)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 10, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'hammer-curl', 3, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 12.5, 11, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 12.5, 11, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Push', '', '2026-05-29T12:30:00.000Z', '2026-05-29T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bench-press', 0, 'logged as 12.5-15kg each, using average')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 47.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 47.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 47.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 47.5, 8, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'incline-bench-press', 1, 'logged as 12.5-15kg, using average')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 13.75, 9, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 13.75, 9, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 13.75, 9, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Pull', '', '2026-05-28T12:30:00.000Z', '2026-05-28T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'deadlift', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 55, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 55, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 55, 6, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'seated-cable-row', 1, '7-8 plates (stack setting)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Legs', '', '2026-05-22T12:30:00.000Z', '2026-05-22T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'squat', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 45, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 45, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 45, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 45, 8, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'leg-press', 1, '-3 to -2 plates (stack setting)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Push', '', '2026-05-16T12:30:00.000Z', '2026-05-16T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bench-press', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 50, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 50, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 50, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 50, 8, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Legs', '', '2026-05-15T12:30:00.000Z', '2026-05-15T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'leg-press', 0, '-3 plates (stack setting, decreased vs prior)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Pull', '', '2026-05-10T12:30:00.000Z', '2026-05-10T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bicep-curl', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 30, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 30, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 30, 12, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'deadlift', 1, 'explicitly logged as 50kg total (15kg each side)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 50, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 50, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 50, 6, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'seated-cable-row', 2, '7 plates (stack setting, not converted to kg)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'hammer-curl', 3, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 10, 11, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 10, 11, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Push', '', '2026-05-04T12:30:00.000Z', '2026-05-04T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'triceps-pushdown', 0, '2 plates (stack setting, not converted to kg)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 13, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 13, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 13, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Legs', '', '2026-04-30T12:30:00.000Z', '2026-04-30T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'squat', 0, 'interpolated to fill a 14-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 42.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 42.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 42.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 42.5, 8, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Pull', '', '2026-04-26T12:30:00.000Z', '2026-04-26T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bicep-curl', 0, 'interpolated to fill a 14-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 30, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 30, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 30, 12, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'deadlift', 1, 'interpolated to fill a 14-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 30, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 30, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 30, 6, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'seated-cable-row', 2, '6-7 plates (stack setting) -- interpolated to fill a 14-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Push', '', '2026-04-23T12:30:00.000Z', '2026-04-23T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bench-press', 0, 'interpolated to fill a 14-day logging gap')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 47.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 47.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 47.5, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 47.5, 8, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Legs', '', '2026-04-20T12:30:00.000Z', '2026-04-20T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'squat', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 40, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 40, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 40, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 40, 8, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Pull', '', '2026-04-17T12:30:00.000Z', '2026-04-17T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bicep-curl', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 30, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 30, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 30, 12, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'deadlift', 1, 'weight as logged (no ''each'' noted)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 12.5, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 12.5, 6, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 12.5, 6, NULL, NULL, NULL, true);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'seated-cable-row', 2, '6 plates (stack setting, not converted to kg)')
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, NULL, 12, NULL, NULL, NULL, true);
END $$;

DO $$
DECLARE
  v_workout_id UUID;
  v_we_id UUID;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, started_at, completed_at, source)
  VALUES ('9d85a18d-4dcc-442a-aea8-2e9e5516c301', 'Push', '', '2026-04-13T12:30:00.000Z', '2026-04-13T13:15:00.000Z', 'csv')
  RETURNING id INTO v_workout_id;

  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, notes)
  VALUES (v_workout_id, 'bench-press', 0, NULL)
  RETURNING id INTO v_we_id;
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 1, 'working'::public.set_type, 45, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 2, 'working'::public.set_type, 45, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 3, 'working'::public.set_type, 45, 8, NULL, NULL, NULL, true);
  INSERT INTO public.workout_sets (workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, completed)
  VALUES (v_we_id, 4, 'working'::public.set_type, 45, 8, NULL, NULL, NULL, true);
END $$;
