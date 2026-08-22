-- ============================================================
-- Migration: Add missing exercises from knowledge catalog
-- ============================================================

INSERT INTO public.exercises (
  id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives
) VALUES (
  'incline-dumbbell-bench-press',
  'Incline Dumbbell Bench Press',
  'Exercise from NextRep catalog',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'bench'::public.animation_key,
  '[]'::jsonb,
  ARRAY[]::TEXT[],
  'Breathe steadily',
  '8-12 reps',
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (
  id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives
) VALUES (
  'incline-dumbbell-fly',
  'Incline Dumbbell Fly',
  'Exercise from NextRep catalog',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'bench'::public.animation_key,
  '[]'::jsonb,
  ARRAY[]::TEXT[],
  'Breathe steadily',
  '8-12 reps',
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (
  id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives
) VALUES (
  'decline-push-up',
  'Decline Push Up',
  'Exercise from NextRep catalog',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'bench'::public.animation_key,
  '[]'::jsonb,
  ARRAY[]::TEXT[],
  'Breathe steadily',
  '8-12 reps',
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (
  id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives
) VALUES (
  'plate-front-raise',
  'Plate Front Raise',
  'Exercise from NextRep catalog',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'bench'::public.animation_key,
  '[]'::jsonb,
  ARRAY[]::TEXT[],
  'Breathe steadily',
  '8-12 reps',
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (
  id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives
) VALUES (
  'diamond-push-up',
  'Diamond Push Up',
  'Exercise from NextRep catalog',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'bench'::public.animation_key,
  '[]'::jsonb,
  ARRAY[]::TEXT[],
  'Breathe steadily',
  '8-12 reps',
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (
  id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives
) VALUES (
  'barbell-reverse-lunge',
  'Barbell Reverse Lunge',
  'Exercise from NextRep catalog',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'bench'::public.animation_key,
  '[]'::jsonb,
  ARRAY[]::TEXT[],
  'Breathe steadily',
  '8-12 reps',
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (
  id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives
) VALUES (
  'pistol-squat',
  'Pistol Squat',
  'Exercise from NextRep catalog',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'bench'::public.animation_key,
  '[]'::jsonb,
  ARRAY[]::TEXT[],
  'Breathe steadily',
  '8-12 reps',
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (
  id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives
) VALUES (
  'kettlebell-swing',
  'Kettlebell Swing',
  'Exercise from NextRep catalog',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'bench'::public.animation_key,
  '[]'::jsonb,
  ARRAY[]::TEXT[],
  'Breathe steadily',
  '8-12 reps',
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (
  id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives
) VALUES (
  'sit-ups',
  'Sit Ups',
  'Exercise from NextRep catalog',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'bench'::public.animation_key,
  '[]'::jsonb,
  ARRAY[]::TEXT[],
  'Breathe steadily',
  '8-12 reps',
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[]
) ON CONFLICT (id) DO NOTHING;

