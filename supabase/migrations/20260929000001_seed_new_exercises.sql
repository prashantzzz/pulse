-- ============================================================
-- Migration: seed exercises introduced after 20260823000001
--
-- The app catalog (src/data/exercises.ts) gained 7 exercises on
-- 2026-09-05, but no seed migration was added for them. Because
-- public.workout_plan_exercises.exercise_id REFERENCES public.exercises(id),
-- pushing a plan that contains one of these exercises fails the child insert.
--
-- Auto-generated from src/data/exercises.ts
-- ============================================================

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('dumbbell-pullover',
    'Dumbbell Pullover',
    'A classic golden-era upper-body builder that heavily stretches the lower pecs, serratus anterior, and lats simultaneously across an arc of motion.',
    'Compound',
    'Intermediate',
    'Pull',
    'Upper',
    'Chest',
    ARRAY['Back', 'Triceps']::public.muscle_group[],
    'Dumbbell',
    'Both',
    false,
    'fly',
    E'[{"title":"Setup","detail":"Lie perpendicular across a flat bench with only your upper back supported, hips slightly lowered, feet planted. Hold one dumbbell with both hands in a diamond grip above your chest."},{"title":"Arc Back","detail":"With a slight bend in your elbows, lower the dumbbell back in an arc over and behind your head until you feel a deep stretch in your chest and lats."},{"title":"Pull Over","detail":"Contract your chest and lats to pull the dumbbell back up in the same arc until it is directly over your chest."},{"title":"Squeeze","detail":"Pause and squeeze your chest and lats at the top before the next rep."}]'::jsonb,
    ARRAY['Bending elbows too much turning it into a triceps extension', 'Letting hips rise during the stretch', 'Using too heavy a weight and hyperextending the shoulders', 'Moving too fast on the stretch phase'],
    'Inhale deeply as the dumbbell lowers to expand the ribcage, exhale as you pull the dumbbell over.',
    '10–15 reps',
    ARRAY['Lie lengthwise flat on the bench first before trying cross-bench', 'Keep the elbow angle fixed throughout the movement', 'Focus on the stretch, not heavy weight'],
    ARRAY['Add 2 kg once you achieve 15 reps with perfect stretch', 'Pause for 2 seconds in the full stretch position'],
    ARRAY['Keep shoulders stable and avoid excessive shoulder hyperextension', 'Check dumbbell collar/weight security before holding overhead'],
    ARRAY['chest-fly', 'cable-fly', 'straight-arm-pulldown'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-pullover', 'db pullover') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-pullover', 'chest pullover') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-pullover', 'lat pullover') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-pullover', 'pullover dumbbell') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('barbell-incline-row',
    'Barbell Incline Row',
    'Performed lying chest-down on an incline bench or pulling a barbell along an inclined torso angle. Completely removes lower back spinal loading, allowing you to recruit the upper back, rhomboids, and lats to pure muscular failure.',
    'Compound',
    'Intermediate',
    'Pull',
    'Upper',
    'Back',
    ARRAY['Biceps', 'Shoulders']::public.muscle_group[],
    'Barbell',
    'Gym',
    false,
    'row',
    E'[{"title":"Setup","detail":"Set an incline bench to roughly 30°–45°. Lie prone with your chest firmly supported against the pad, reaching down to grip the barbell shoulder-width apart."},{"title":"Row","detail":"Pull your elbows up and back toward your hips, retracting your shoulder blades and driving the bar toward the underside of the bench."},{"title":"Squeeze","detail":"Hold the peak contraction for a second, squeezing your mid-back and rhomboids."},{"title":"Lower","detail":"Lower the barbell under control back to full arm extension without letting your shoulders drop forward."}]'::jsonb,
    ARRAY['Lifting your chest off the bench pad', 'Jerking the neck or head upward', 'Using momentum instead of back retraction', 'Cutting the range of motion at the top'],
    'Exhale as you row up, inhale as you lower the barbell.',
    '8–12 reps',
    ARRAY['Keep your chest glued to the pad throughout the set', 'Start with a lighter barbell to feel the upper back', 'Pull with your elbows, not your hands'],
    ARRAY['Progress in 2.5 kg increments', 'Incorporate a 2-second hold at peak contraction'],
    ARRAY['Ensure bench is securely locked into the incline notch', 'Place the barbell safely on the floor or rack between sets'],
    ARRAY['barbell-row', 'dumbbell-row', 't-bar-row', 'seated-cable-row'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-incline-row', 'incline barbell row') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-incline-row', 'chest supported barbell row') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-incline-row', 'incline bench row') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-incline-row', 'barbell incline row') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('dumbbell-shrug',
    'Dumbbell Shrug',
    'Holding dumbbells at the sides allows a natural arm hang that aligns directly with the upper trapezius fibers, delivering targeted trap growth with zero bar interference.',
    'Isolation',
    'Beginner',
    'Pull',
    'Upper',
    'Back',
    ARRAY['Shoulders']::public.muscle_group[],
    'Dumbbell',
    'Both',
    true,
    'press',
    E'[{"title":"Setup","detail":"Stand tall holding heavy dumbbells at your sides with neutral palms and shoulders back."},{"title":"Shrug","detail":"Elevate your shoulders straight up toward your ears in a strict vertical motion."},{"title":"Squeeze","detail":"Hold peak contraction for a full 2-second pause at the top."},{"title":"Lower","detail":"Lower the weights slowly to full stretch."}]'::jsonb,
    ARRAY['Rolling the shoulders in circles (can damage the rotator cuff)', 'Bending the elbows', 'Yanking with the legs'],
    'Inhale at the bottom, exhale as you shrug upward.',
    '10–15 reps',
    ARRAY['Use a strict vertical path only', 'Focus on the 2-second squeeze at the apex'],
    ARRAY['Use lifting straps to overload the traps without grip fatigue', 'Add slow 3-second lowering'],
    ARRAY['Keep the spine neutral and neck straight — do not drop the chin'],
    ARRAY['shrug', 'deadlift', 'barbell-row'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-shrug', 'db shrug') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-shrug', 'dumbbell shrugs') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('seated-dumbbell-lateral-raise',
    'Seated Dumbbell Lateral Raise',
    'Seated positioning eliminates leg drive and hip sway, forcing the lateral deltoid to handle 100% of the load. The premier exercise for capping the side shoulders.',
    'Isolation',
    'Beginner',
    'Push',
    'Upper',
    'Shoulders',
    ARRAY['Back']::public.muscle_group[],
    'Dumbbell',
    'Both',
    true,
    'raise',
    E'[{"title":"Setup","detail":"Sit on the edge of a flat bench with feet planted flat, holding dumbbells at your sides with a neutral grip and a slight forward lean at the hips."},{"title":"Raise","detail":"Raise the dumbbells out to the sides in a slight forward diagonal (scapular plane) until your arms are parallel to the floor."},{"title":"Squeeze","detail":"Hold for a brief beat at shoulder height, with elbows leading slightly higher than wrists."},{"title":"Lower","detail":"Lower the dumbbells with control over 2 seconds back to your sides."}]'::jsonb,
    ARRAY['Shrugging the shoulders up into the ears', 'Using heavy weights and rocking the torso', 'Raising arms straight out to 90° rather than in the scapular plane', 'Swinging dumbbells up with momentum'],
    'Exhale on the raise, inhale on the descent.',
    '12–20 reps',
    ARRAY['Use light dumbbells — side delts respond best to controlled volume', 'Lead with your elbows, keeping wrists below elbows', 'Avoid shrugging'],
    ARRAY['Add a 1-second pause at the top', 'Increase reps toward 20 before moving up in weight', 'Superset with cable lateral raises'],
    ARRAY['Never force heavy weight on lateral raises — rotator cuff safety is paramount', 'Stop immediately if you feel a sharp pinch at the top of the shoulder'],
    ARRAY['lateral-raise', 'cable-lateral-raise', 'upright-row'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('seated-dumbbell-lateral-raise', 'seated lateral raise') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('seated-dumbbell-lateral-raise', 'seated side raise') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('seated-dumbbell-lateral-raise', 'seated dumbbell side raise') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('seated-dumbbell-lateral-raise', 'seated side lateral raise') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('cable-rope-hammer-curl',
    'Cable Rope Hammer Curl',
    'Attaching a rope to a low cable allows continuous tension through a neutral-grip curl. Primarily targets the brachialis (outer bicep) and brachioradialis (outer forearm), adding thickness to the upper and lower arm.',
    'Isolation',
    'Beginner',
    'Pull',
    'Upper',
    'Biceps',
    ARRAY['Forearms']::public.muscle_group[],
    'Cable',
    'Gym',
    true,
    'curl',
    E'[{"title":"Setup","detail":"Attach a rope to the lowest cable pulley. Stand tall, grip the rope with palms facing each other, elbows pinned to your ribs."},{"title":"Curl","detail":"Flex at the elbows to curl the rope upward toward your chest, keeping upper arms still."},{"title":"Spread & Squeeze","detail":"Spread the rope ends apart at the top to peak the contraction on the outer biceps and forearms."},{"title":"Lower","detail":"Lower under control over 2–3 seconds back to a full stretch."}]'::jsonb,
    ARRAY['Swinging your torso or using hip momentum', 'Letting elbows drift forward away from the body', 'Failing to control the negative'],
    'Exhale as you curl up, inhale as you lower.',
    '10–15 reps',
    ARRAY['Keep elbows locked by your sides throughout the set', 'Spread the handles at the top for peak activation'],
    ARRAY['Add a 1-second pause at the top of every rep', 'Slow the lowering tempo to 3 seconds'],
    ARRAY['Keep wrists neutral — do not bend wrists back under load'],
    ARRAY['hammer-curl', 'cable-curl', 'bicep-curl'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('cable-rope-hammer-curl', 'cable hammer curl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('cable-rope-hammer-curl', 'rope hammer curl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('cable-rope-hammer-curl', 'cable rope curl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('cable-rope-hammer-curl', 'cable curl with rope') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('cable-overhead-triceps-extension',
    'Cable Overhead Triceps Extension',
    'An evidence-based triceps builder that places the long head of the triceps under peak stretch by working overhead with continuous cable tension, minimizing elbow joint strain compared to free weights.',
    'Isolation',
    'Beginner',
    'Push',
    'Upper',
    'Triceps',
    ARRAY['Shoulders']::public.muscle_group[],
    'Cable',
    'Gym',
    true,
    'pushdown',
    E'[{"title":"Setup","detail":"Attach a rope to a high or mid pulley. Face away from the stack, take a step forward into a staggered stance, and hold the rope overhead behind your neck."},{"title":"Extend","detail":"Drive through your triceps to extend your arms forward and overhead until elbows lock out."},{"title":"Spread","detail":"Spread the rope ends apart at full lockout for a peak triceps squeeze."},{"title":"Lower","detail":"Carefully allow the elbows to bend back behind your head, getting a deep stretch in the long head."}]'::jsonb,
    ARRAY['Flaring the elbows excessively wide', 'Arching the lower back under load', 'Letting the cable pull you backwards', 'Restricting the stretch behind the head'],
    'Exhale as you extend forward, inhale as you bend your elbows back.',
    '10–15 reps',
    ARRAY['Use a staggered foot stance for stability', 'Keep elbows fixed in space like a hinge', 'Focus on the stretch at the bottom'],
    ARRAY['Add 2.5 kg once you hit 15 clean reps', 'Add a 2-second stretch pause behind the head'],
    ARRAY['Keep your core tight and ribs down to protect the spine', 'Step forward with control before pressing'],
    ARRAY['overhead-extension', 'triceps-pushdown', 'skull-crusher'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('cable-overhead-triceps-extension', 'cable overhead triceps extension') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('cable-overhead-triceps-extension', 'rope overhead triceps extension') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('cable-overhead-triceps-extension', 'cable overhead extension') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('dumbbell-standing-calf-raise',
    'Dumbbell Standing Calf Raise',
    'Standing calf raises performed with dumbbells at your sides. Allows loaded calf training anywhere without requiring a specialized calf raise machine.',
    'Isolation',
    'Beginner',
    'Legs',
    'Lower',
    'Calves',
    '{}'::public.muscle_group[],
    'Dumbbell',
    'Both',
    true,
    'calf',
    E'[{"title":"Setup","detail":"Stand upright with the balls of your feet on a raised block or step, heels hanging off, holding dumbbells at your sides."},{"title":"Lower","detail":"Lower your heels slowly until you feel a full stretch in your gastrocnemius calves."},{"title":"Raise","detail":"Drive forcefully through the balls of your feet, raising up as high onto your toes as possible."},{"title":"Hold","detail":"Pause for a full second at the top of the contraction before lowering."}]'::jsonb,
    ARRAY['Bouncing out of the bottom stretch', 'Rushing reps without pausing at the top', 'Bending the knees during the raise'],
    'Exhale as you push up onto your toes, inhale as you lower your heels.',
    '12–20 reps',
    ARRAY['Hold one dumbbell and use the other hand on a wall for balance', 'Emphasize the deep stretch at the bottom'],
    ARRAY['Add 2-second holds at the peak', 'Increase dumbbell weight in 2 kg increments', 'Transition to single-leg dumbbell calf raises'],
    ARRAY['Ensure the step or block is stable and will not slip under load', 'Keep knees slightly soft, not hyperextended'],
    ARRAY['calf-raise', 'single-leg-calf-raise', 'seated-calf-raise'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-standing-calf-raise', 'standing dumbbell calf raise') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-standing-calf-raise', 'dumbbell calf raise') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-standing-calf-raise', 'db calf raise') ON CONFLICT DO NOTHING;
