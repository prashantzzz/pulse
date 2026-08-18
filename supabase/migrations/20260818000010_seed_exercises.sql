-- ============================================================
-- Migration 010: seed exercise catalog
-- Auto-generated from src/data/exercises.ts
-- ============================================================

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'bench-press',
  'Bench Press',
  'The king of upper-body strength. A compound push that builds the chest, front delts and triceps simultaneously. No other movement packs as much muscle onto the torso.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY['Triceps', 'Shoulders']::public.muscle_group[],
  'Barbell'::public.equipment_type,
  'Gym',
  false,
  'bench'::public.animation_key,
  '[{"title":"Setup","detail":"Lie flat, feet planted wide. Grip the bar slightly wider than shoulder width and pull your shoulder blades together into the bench."},{"title":"Lower","detail":"Brace your core and lower the bar under control to mid-chest, elbows tucked about 45°."},{"title":"Press","detail":"Drive the bar up and slightly back until your arms lock out, keeping your shoulders pinned."},{"title":"Lockout","detail":"Squeeze your chest at the top, then reset before the next rep — no bouncing."}]'::jsonb,
  ARRAY['Bouncing the bar off your chest', 'Flaring elbows to 90° under load', 'Lifting your hips off the bench', 'Gripping too narrow or too wide']::TEXT[],
  'Inhale at the top, hold as you lower, exhale forcefully during the press.',
  '4–8 reps for strength, 8–12 for size',
  ARRAY['Start with an empty bar to groove the pattern', 'Use a spotter or safety pins until confident', 'Tuck elbows ~45° to protect the shoulder']::TEXT[],
  ARRAY['Add 2.5 kg per session on the bar', 'Add paused reps at the chest for power out of the bottom', 'Rotate in incline work to keep the chest growing']::TEXT[],
  ARRAY['Never lift without collars on the bar', 'Use a spotter for near-max attempts', 'Stop if you feel a sharp pinch in the shoulder']::TEXT[],
  ARRAY['dumbbell-bench-press', 'machine-press', 'push-up']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('bench-press', 'flat bench press') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('bench-press', 'barbell bench press') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('bench-press', 'bb bench press') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('bench-press', 'bench press barbell') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('bench-press', 'bench') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'dumbbell-bench-press',
  'Dumbbell Bench Press',
  'A safer, more flexible cousin of the barbell press. Dumbbells allow a deeper stretch and correct left-right imbalances — a great chest builder for beginners and advanced lifters alike.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY['Triceps', 'Shoulders']::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'bench'::public.animation_key,
  '[{"title":"Setup","detail":"Lie back holding dumbbells at chest height, palms forward, feet planted."},{"title":"Lower","detail":"Lower the weights to the sides of your chest until you feel a deep stretch."},{"title":"Press","detail":"Drive both dumbbells up and slightly inward until arms are extended."},{"title":"Control","detail":"Lower slowly — control the negative for constant tension."}]'::jsonb,
  ARRAY['Banging the dumbbells together at the top', 'Flaring elbows', 'Pressing from a rounded lower back']::TEXT[],
  'Exhale as you press up, inhale as you lower the weights.',
  '6–12 reps',
  ARRAY['Pick a weight you can press 8 clean reps with', 'Kick the dumbbells up with your knees for safety', 'Keep wrists neutral, not bent back']::TEXT[],
  ARRAY['Increase weight in 2 kg steps', 'Add a 2-second pause at the bottom', 'Try one-arm presses to fix imbalances']::TEXT[],
  ARRAY['Use a controlled kick-up to avoid shoulder strain', 'Lower the dumbbells to the floor if you fail a rep']::TEXT[],
  ARRAY['bench-press', 'machine-press', 'push-up']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-bench-press', 'db bench press') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-bench-press', 'dumbbell press flat') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'incline-bench-press',
  'Incline Bench Press',
  'Targets the upper portion of the chest for a fuller, more balanced pec development. The ~30° incline shifts emphasis to the clavicular head and front delts.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY['Shoulders', 'Triceps']::public.muscle_group[],
  'Barbell'::public.equipment_type,
  'Gym',
  false,
  'bench'::public.animation_key,
  '[{"title":"Setup","detail":"Set the bench to 30–45°. Lie back with shoulder blades retracted and feet planted."},{"title":"Lower","detail":"Lower the bar to the upper chest, elbows tucked ~45°."},{"title":"Press","detail":"Press the bar up and slightly back, keeping the chest tall."},{"title":"Finish","detail":"Lock out softly — do not fully relax at the top."}]'::jsonb,
  ARRAY['Bench too steep (turns into a shoulder press)', 'Arching the lower back off the bench', 'Lowering the bar to the lower chest']::TEXT[],
  'Inhale at the top, exhale on the press, inhale while lowering.',
  '6–10 reps',
  ARRAY['Start lighter than your flat bench — upper chest is weaker', 'Keep the bar path over the mid-upper chest']::TEXT[],
  ARRAY['Add 2.5 kg weekly', 'Pair with flat pressing for balanced growth']::TEXT[],
  ARRAY['Use a spotter — the incline position makes bailing harder']::TEXT[],
  ARRAY['dumbbell-bench-press', 'machine-press', 'push-up']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('incline-bench-press', 'incline press') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('incline-bench-press', 'incline barbell press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'chest-fly',
  'Chest Fly',
  'A pure chest isolation movement. The fly stretches the pecs through a wide arc with minimal triceps involvement — great for stretch-mediated growth.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY['Shoulders']::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'fly'::public.animation_key,
  '[{"title":"Setup","detail":"Lie on a bench holding dumbbells above your chest, palms facing each other."},{"title":"Open","detail":"With a slight elbow bend, open your arms wide until you feel a chest stretch."},{"title":"Squeeze","detail":"Squeeze the dumbbells together in an arc, as if hugging a barrel."},{"title":"Peak","detail":"Pause at the top and squeeze the chest hard before lowering."}]'::jsonb,
  ARRAY['Bending the elbows too much (becomes a press)', 'Dropping the weights too deep and straining the shoulders', 'Using momentum']::TEXT[],
  'Exhale while squeezing together, inhale while opening.',
  '10–15 reps',
  ARRAY['Use light weights — the stretch does the work', 'Keep elbows fixed at ~15° bend']::TEXT[],
  ARRAY['Slow the eccentric to 3 seconds', 'Use cables for constant tension']::TEXT[],
  ARRAY['Stop the range where the shoulder feels pinched', 'Never bounce out of the bottom']::TEXT[],
  ARRAY['cable-fly', 'machine-fly', 'bench-press']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('chest-fly', 'dumbbell fly') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('chest-fly', 'db fly') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('chest-fly', 'pec fly') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'machine-press',
  'Machine Chest Press',
  'A fixed-path chest press that is safe and simple to learn. Ideal for beginners building pressing strength or for finishers after heavy barbell work.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY['Triceps', 'Shoulders']::public.muscle_group[],
  'Machine'::public.equipment_type,
  'Gym',
  true,
  'press'::public.animation_key,
  '[{"title":"Setup","detail":"Adjust the seat so handles sit at mid-chest height."},{"title":"Press","detail":"Press the handles forward until your arms are extended."},{"title":"Return","detail":"Return slowly until a light chest stretch."}]'::jsonb,
  ARRAY['Seat too high or low', 'Slamming the weight back between reps']::TEXT[],
  'Exhale on the press, inhale on the return.',
  '8–15 reps',
  ARRAY['Adjust seat height first — everything else follows', 'Feel the chest, not the triceps']::TEXT[],
  ARRAY['Add weight each session', 'Slow the return to 3 seconds']::TEXT[],
  ARRAY['Use the safety stops on heavy sets']::TEXT[],
  ARRAY['bench-press', 'dumbbell-bench-press', 'push-up']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('machine-press', 'machine chest press') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('machine-press', 'machine bench press') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('machine-press', 'chest press machine') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'decline-bench-press',
  'Decline Bench Press',
  'A bench press on a slight decline that emphasizes the lower pecs while taking stress off the shoulders. A favorite accessory for lifters whose front delts take over on the flat press.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY['Triceps', 'Shoulders']::public.muscle_group[],
  'Barbell'::public.equipment_type,
  'Gym',
  false,
  'bench'::public.animation_key,
  '[{"title":"Setup","detail":"Set the bench to a ~15–30° decline and secure your legs under the pads. Grip slightly wider than shoulders, shoulder blades pulled together."},{"title":"Lower","detail":"Lower the bar to the lower chest under control, elbows tucked ~45°."},{"title":"Press","detail":"Drive the bar up and slightly back to lockout."},{"title":"Finish","detail":"Reset at the top — no bouncing off the chest."}]'::jsonb,
  ARRAY['Going too steep and over-stretching the shoulders', 'Bouncing the bar', 'Letting the elbows flare']::TEXT[],
  'Inhale at the top, hold while lowering, exhale on the press.',
  '6–10 reps',
  ARRAY['Use a lighter load than your flat press', 'Keep the bar path over the lower sternum']::TEXT[],
  ARRAY['Add 2.5 kg per session', 'Add a pause on the chest']::TEXT[],
  ARRAY['Use a spotter or safety pins', 'Lower under control — the decline angle can feel odd at first']::TEXT[],
  ARRAY['bench-press', 'dips', 'dumbbell-bench-press']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('decline-bench-press', 'decline press') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('decline-bench-press', 'declined bench press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'cable-fly',
  'Cable Chest Fly',
  'The cable fly keeps constant tension on the pecs through the entire arc — including the squeeze at the top that dumbbells can''t match. One of the best chest isolators for stretch and pump.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY['Shoulders']::public.muscle_group[],
  'Cable'::public.equipment_type,
  'Gym',
  true,
  'fly'::public.animation_key,
  '[{"title":"Setup","detail":"Set both pulleys at chest height and take a step forward into a split stance."},{"title":"Open","detail":"With a slight elbow bend, open your arms until you feel a chest stretch."},{"title":"Squeeze","detail":"Bring your hands together in front of your chest, squeezing the pecs."},{"title":"Return","detail":"Resist the cable on the way back out."}]'::jsonb,
  ARRAY['Bending the elbows into a pressing motion', 'Letting the shoulders roll forward', 'Using momentum to swing the stack']::TEXT[],
  'Exhale as you squeeze together, inhale as you open.',
  '12–15 reps',
  ARRAY['Light weight — the constant tension is deceptive', 'Keep a soft elbow bend locked in']::TEXT[],
  ARRAY['Slow the opening to 3 seconds', 'Add a 2-second pause at peak squeeze']::TEXT[],
  ARRAY['Stop the range where the shoulder feels pinched', 'Keep your chest tall, shoulders back']::TEXT[],
  ARRAY['chest-fly', 'pec-deck', 'bench-press']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('cable-fly', 'cable crossover') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('cable-fly', 'cable cross over') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'pec-deck',
  'Pec Deck (Machine Fly)',
  'A seated machine fly that isolates the chest through a fixed path — beginner-friendly and shoulder-safe, with a hard squeeze at peak contraction that dumbbell flies can''t replicate.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY['Shoulders']::public.muscle_group[],
  'Machine'::public.equipment_type,
  'Gym',
  true,
  'fly'::public.animation_key,
  '[{"title":"Setup","detail":"Sit with your back flat against the pad and elbows at ~90° on the pads."},{"title":"Squeeze","detail":"Squeeze the handles together in front of your chest."},{"title":"Hold","detail":"Pause at peak contraction."},{"title":"Return","detail":"Return slowly until a light stretch — don''t let the stack slam."}]'::jsonb,
  ARRAY['Rounding the back to cheat', 'Bouncing out of the bottom', 'Going too heavy and losing the squeeze']::TEXT[],
  'Exhale on the squeeze, inhale on the return.',
  '12–20 reps',
  ARRAY['Set the seat so handles meet mid-chest', 'Squeeze for a full second at the front']::TEXT[],
  ARRAY['Slow the eccentric to 3 seconds', 'Add a pause on every rep']::TEXT[],
  ARRAY['Adjust the seat height before loading', 'Stop if the front of the shoulder pinches']::TEXT[],
  ARRAY['cable-fly', 'chest-fly', 'bench-press']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('pec-deck', 'machine fly') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('pec-deck', 'pec deck fly') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('pec-deck', 'butterfly machine') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'push-up',
  'Push-Up',
  'The world''s most accessible chest builder. Push-ups build pressing strength, core stability and triceps — anywhere, anytime, with zero equipment.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY['Triceps', 'Shoulders', 'Core']::public.muscle_group[],
  'Bodyweight'::public.equipment_type,
  'Both',
  true,
  'bench'::public.animation_key,
  '[{"title":"Setup","detail":"Hands slightly wider than shoulders, body in a straight line from head to heels."},{"title":"Lower","detail":"Lower your chest toward the floor, elbows tucked ~45°."},{"title":"Press","detail":"Drive through the palms to push back up."},{"title":"Finish","detail":"Keep the core braced — no sagging hips."}]'::jsonb,
  ARRAY['Hips sagging or piking', 'Elbows flaring straight out', 'Partial reps with a short range']::TEXT[],
  'Inhale on the way down, exhale on the press.',
  '10–25 reps',
  ARRAY['Start from your knees or an elevated bench', 'Keep the body in one rigid plank']::TEXT[],
  ARRAY['Add a weight vest or backpack', 'Try deficit push-ups for a deeper stretch', 'Progress to one-arm and explosive variations']::TEXT[],
  ARRAY['Warm up the wrists', 'Stop if you feel sharp shoulder pain']::TEXT[],
  ARRAY['bench-press', 'dumbbell-bench-press', 'dips']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('push-up', 'press-up') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('push-up', 'press up') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('push-up', 'pushup') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'dips',
  'Chest Dips',
  'A heavy compound dip that loads the lower chest and triceps through a deep stretch. Leaning forward shifts the emphasis to the pecs — an elite upper-body mass builder.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Chest'::public.muscle_group,
  ARRAY['Triceps', 'Shoulders']::public.muscle_group[],
  'Bodyweight'::public.equipment_type,
  'Both',
  false,
  'press'::public.animation_key,
  '[{"title":"Setup","detail":"Grip the parallel bars, lock the arms, and lean your chest forward slightly."},{"title":"Lower","detail":"Lower until the shoulders are just below the elbows, keeping the chest tall."},{"title":"Drive","detail":"Push back up, thinking of pressing the bars away."},{"title":"Finish","detail":"Lock out softly without shrugging."}]'::jsonb,
  ARRAY['Going too deep and stressing the shoulder capsule', 'Flaring the elbows wide', 'Swinging the legs for momentum']::TEXT[],
  'Inhale on the descent, exhale as you press up.',
  '8–15 reps',
  ARRAY['Use a band or assisted machine to build the pattern', 'Lean forward — upright dips hit the triceps']::TEXT[],
  ARRAY['Add weight via a dip belt', 'Slow the descent to 3 seconds', 'Add a pause in the stretched position']::TEXT[],
  ARRAY['Warm up the shoulders thoroughly', 'Stop at the depth where the shoulder feels comfortable']::TEXT[],
  ARRAY['bench-press', 'push-up', 'decline-bench-press']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dips', 'chest dip') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dips', 'tricep dip') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dips', 'parallel bar dip') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'lat-pulldown',
  'Lat Pulldown',
  'The best gateway to pull-up strength. Pulldowns build the lats and upper back with adjustable load, making them perfect for lifters who cannot yet do pull-ups.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Back'::public.muscle_group,
  ARRAY['Biceps', 'Shoulders']::public.muscle_group[],
  'Cable'::public.equipment_type,
  'Gym',
  true,
  'pulldown'::public.animation_key,
  '[{"title":"Setup","detail":"Sit with thighs locked under the pads. Grip the bar wider than shoulders."},{"title":"Initiate","detail":"Pull your shoulder blades down and together — start the movement with your back."},{"title":"Pull","detail":"Drive the bar to your upper chest, elbows pointing down and in."},{"title":"Return","detail":"Let the arms extend fully, feeling the lats stretch, without letting the stack slam."}]'::jsonb,
  ARRAY['Leaning way back and using momentum', 'Pulling the bar behind the neck', 'Using the arms instead of the lats']::TEXT[],
  'Exhale as you pull down, inhale as you return.',
  '8–12 reps',
  ARRAY['Imagine pulling your elbows into your back pockets', 'Squeeze the bar, don''t strangle it']::TEXT[],
  ARRAY['Add weight weekly', 'Switch to a neutral grip to bias the lower lats', 'Graduate to weighted pull-ups']::TEXT[],
  ARRAY['Secure your thighs — getting lifted off the seat strains the lower back']::TEXT[],
  ARRAY['pull-up', 'band-pulldown', 'assisted-pullup']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('lat-pulldown', 'lat pull down') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('lat-pulldown', 'pulldown') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('lat-pulldown', 'lat pulldown cable') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'pull-up',
  'Pull-Up',
  'The ultimate test of relative upper-body strength. Pull-ups build a wide, powerful back and demand serious grip, lat and core engagement.',
  'Compound'::public.exercise_category,
  'Advanced'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Back'::public.muscle_group,
  ARRAY['Biceps', 'Shoulders', 'Core']::public.muscle_group[],
  'Bodyweight'::public.equipment_type,
  'Both',
  false,
  'pulldown'::public.animation_key,
  '[{"title":"Hang","detail":"Hang with an overhand grip, shoulders pulled away from the ears."},{"title":"Pull","detail":"Drive elbows down and back to pull your chest to the bar."},{"title":"Squeeze","detail":"Pause at the top with the chest tall."},{"title":"Lower","detail":"Lower under control to a full hang."}]'::jsonb,
  ARRAY['Kipping and swinging for reps', 'Partial reps that never reach the top', 'Shrugging the shoulders at the start']::TEXT[],
  'Exhale as you pull up, inhale as you lower.',
  '6–12 reps (or as many as possible)',
  ARRAY['Use bands or an assisted machine to build volume', 'Do negatives: lower slowly from the top']::TEXT[],
  ARRAY['Add weight via a dip belt', 'Work toward 20 clean reps', 'Add pause pull-ups at the top']::TEXT[],
  ARRAY['Warm up the shoulders first', 'Stop if you feel a sharp elbow or shoulder pain']::TEXT[],
  ARRAY['lat-pulldown', 'band-pulldown', 'assisted-pullup']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('pull-up', 'pullup') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('pull-up', 'pull up') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'band-pulldown',
  'Resistance Band Pulldown',
  'A home-friendly lat builder using a band anchored overhead. Great when you lack a cable machine — the band offers increasing tension at the top of the pull.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Back'::public.muscle_group,
  ARRAY['Biceps']::public.muscle_group[],
  'Band'::public.equipment_type,
  'Home',
  true,
  'pulldown'::public.animation_key,
  '[{"title":"Anchor","detail":"Anchor the band overhead (door frame or rack) and kneel beneath it."},{"title":"Pull","detail":"Pull the band down to your chest, elbows driving down."},{"title":"Return","detail":"Return slowly until arms are straight."}]'::jsonb,
  ARRAY['Pulling with the arms only', 'Letting the band snap back']::TEXT[],
  'Exhale on the pull, inhale on the return.',
  '10–15 reps',
  ARRAY['Choke the band shorter for more resistance', 'Squeeze the lats at the bottom']::TEXT[],
  ARRAY['Use a heavier band', 'Add a 2-second hold at the bottom']::TEXT[],
  ARRAY['Check the anchor before every set', 'Never let go of the band under tension']::TEXT[],
  ARRAY['lat-pulldown', 'pull-up', 'assisted-pullup']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('band-pulldown', 'band pulldown') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('band-pulldown', 'resistance band pulldown') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'seated-cable-row',
  'Seated Cable Row',
  'A horizontal pull that thickens the mid-back and rear delts. The cable keeps constant tension, making it one of the most effective rowing variations.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Back'::public.muscle_group,
  ARRAY['Biceps', 'Shoulders']::public.muscle_group[],
  'Cable'::public.equipment_type,
  'Gym',
  true,
  'row'::public.animation_key,
  '[{"title":"Setup","detail":"Sit tall with knees slightly bent and grab the handle with a neutral grip."},{"title":"Pull","detail":"Drive elbows back and squeeze the shoulder blades together as you pull to your stomach."},{"title":"Pause","detail":"Hold the contraction for a beat."},{"title":"Return","detail":"Extend your arms forward, letting the shoulders round slightly to stretch the lats."}]'::jsonb,
  ARRAY['Rocking the torso like a pendulum', 'Shrugging the shoulders', 'Pulling to the chest instead of the stomach']::TEXT[],
  'Exhale as you pull in, inhale as you reach forward.',
  '8–12 reps',
  ARRAY['Keep your chest proud — posture is the movement', 'Pull with the elbows, not the hands']::TEXT[],
  ARRAY['Add weight weekly', 'Pause 2 seconds at peak contraction']::TEXT[],
  ARRAY['Keep the lower back neutral — no excessive lean back']::TEXT[],
  ARRAY['dumbbell-row', 'barbell-row', 'machine-row']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('seated-cable-row', 'cable row') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('seated-cable-row', 'seated row') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('seated-cable-row', 'seated cable row cable') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'dumbbell-row',
  'Dumbbell Row',
  'A one-arm row that builds back thickness and fixes strength imbalances between sides. The supported position spares the lower back while allowing a huge range of motion.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Back'::public.muscle_group,
  ARRAY['Biceps', 'Shoulders']::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'row'::public.animation_key,
  '[{"title":"Setup","detail":"Place one knee and hand on a bench. Keep your back flat, chest open."},{"title":"Row","detail":"Pull the dumbbell to your hip, driving the elbow back."},{"title":"Squeeze","detail":"Squeeze the lats at the top."},{"title":"Lower","detail":"Lower fully to a stretched position."}]'::jsonb,
  ARRAY['Rotating the torso to heave the weight', 'Rounding the lower back', 'Using a short, half range of motion']::TEXT[],
  'Exhale as you row up, inhale as you lower.',
  '8–12 reps per side',
  ARRAY['Use a bench for support — no swinging', 'Pull toward the hip, not the armpit']::TEXT[],
  ARRAY['Increase weight in 2 kg steps', 'Add a pause at the top']::TEXT[],
  ARRAY['Keep the neck neutral — don''t look up']::TEXT[],
  ARRAY['seated-cable-row', 'barbell-row', 'machine-row']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'barbell-row',
  'Barbell Row',
  'A heavy hinge-row that loads the entire posterior chain while building a thick back. One of the best mass builders for upper-body pulling strength.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Back'::public.muscle_group,
  ARRAY['Biceps', 'Shoulders', 'Glutes']::public.muscle_group[],
  'Barbell'::public.equipment_type,
  'Gym',
  false,
  'row'::public.animation_key,
  '[{"title":"Setup","detail":"Hinge at the hips with a flat back, bar hanging at knee height."},{"title":"Pull","detail":"Drive the elbows back to pull the bar to your lower ribs."},{"title":"Squeeze","detail":"Squeeze the mid-back at the top."},{"title":"Lower","detail":"Lower under control to straight arms."}]'::jsonb,
  ARRAY['Standing upright (turns into a curl)', 'Rounding the lower back under load', 'Yanking with momentum']::TEXT[],
  'Brace and hold as you row, exhale at the top.',
  '5–10 reps',
  ARRAY['Master the hip hinge position first', 'Start light and groove the bar path']::TEXT[],
  ARRAY['Add 2.5 kg per session', 'Try a Yates row for heavier loading']::TEXT[],
  ARRAY['Keep the spine rigid — drop the weight if form breaks']::TEXT[],
  ARRAY['dumbbell-row', 'seated-cable-row', 'machine-row']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-row', 'bent-over row') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-row', 'bent over row') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-row', 'bb row') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-row', 'barbell bent over row') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'face-pull',
  'Face Pull',
  'The best shoulder-health exercise you can do. Face pulls strengthen the rear delts, rotator cuff and upper traps — the muscles that keep your shoulders happy under heavy pressing.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Back'::public.muscle_group,
  ARRAY['Shoulders']::public.muscle_group[],
  'Cable'::public.equipment_type,
  'Gym',
  true,
  'row'::public.animation_key,
  '[{"title":"Setup","detail":"Set a rope attachment at face height and grab it with palms facing in."},{"title":"Pull","detail":"Pull the rope toward your face, flaring your elbows high."},{"title":"Rotate","detail":"Finish by rotating your hands back, as if flexing your biceps."},{"title":"Return","detail":"Return slowly, resisting the cable."}]'::jsonb,
  ARRAY['Pulling to the chest instead of the face', 'Using heavy weight and momentum', 'Forgetting the external rotation']::TEXT[],
  'Exhale as you pull, inhale as you return.',
  '12–20 reps',
  ARRAY['Light weight, high reps — form is everything', 'Think "elbows high, hands apart at the end"']::TEXT[],
  ARRAY['Increase reps before increasing weight', 'Add them as a daily shoulder-health ritual']::TEXT[],
  ARRAY['Don''t yank the rope — control the return']::TEXT[],
  ARRAY['rear-delt-fly', 'band-face-pull']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('face-pull', 'facepull') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('face-pull', 'face pull') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'machine-row',
  'Machine Row',
  'A fixed-path row that isolates the mid-back without balance demands. Simple to load and ideal for high-volume back training.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Back'::public.muscle_group,
  ARRAY['Biceps']::public.muscle_group[],
  'Machine'::public.equipment_type,
  'Gym',
  true,
  'row'::public.animation_key,
  '[{"title":"Setup","detail":"Sit tall, chest against the pad, grab the handles."},{"title":"Pull","detail":"Pull the handles to your stomach, squeezing the shoulder blades."},{"title":"Return","detail":"Return until the arms are straight."}]'::jsonb,
  ARRAY['Leaning back to cheat the weight', 'Short range of motion']::TEXT[],
  'Exhale on the pull, inhale on the return.',
  '8–15 reps',
  ARRAY['Squeeze for a full second at the back', 'Keep the chest on the pad']::TEXT[],
  ARRAY['Add a plate each week', 'Slow the negative to 3 seconds']::TEXT[],
  ARRAY['Reset your back position each rep']::TEXT[],
  ARRAY['seated-cable-row', 'dumbbell-row', 'barbell-row']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'chin-up',
  'Chin-Up',
  'The pull-up''s underhand cousin. The supinated grip lets the biceps assist more, making chin-ups slightly easier and a phenomenal addition to any pull day.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Back'::public.muscle_group,
  ARRAY['Biceps', 'Shoulders']::public.muscle_group[],
  'Bodyweight'::public.equipment_type,
  'Both',
  false,
  'pulldown'::public.animation_key,
  '[{"title":"Hang","detail":"Hang with an underhand, shoulder-width grip, shoulders away from the ears."},{"title":"Pull","detail":"Drive the elbows down to pull your chin over the bar."},{"title":"Squeeze","detail":"Squeeze at the top — chest tall."},{"title":"Lower","detail":"Lower under control to a full hang."}]'::jsonb,
  ARRAY['Kipping or swinging for reps', 'Half reps that never clear the bar', 'Letting the shoulders shrug at the start']::TEXT[],
  'Exhale as you pull up, inhale as you lower.',
  '6–12 reps',
  ARRAY['Use bands or an assisted machine', 'Practice slow negatives from the top']::TEXT[],
  ARRAY['Add weight via a dip belt', 'Work toward 15+ clean reps', 'Pause at the top for extra time under tension']::TEXT[],
  ARRAY['Control the bottom — no dropping into the hang']::TEXT[],
  ARRAY['pull-up', 'lat-pulldown', 'assisted-pullup']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'assisted-pullup',
  'Assisted Pull-Up',
  'The pull-up machine removes bodyweight so you can build lat strength progressively — the smartest path from zero pull-ups to your first unassisted set.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Back'::public.muscle_group,
  ARRAY['Biceps', 'Shoulders']::public.muscle_group[],
  'Machine'::public.equipment_type,
  'Gym',
  true,
  'pulldown'::public.animation_key,
  '[{"title":"Setup","detail":"Set the assist weight, kneel or stand on the pad, grip the bar wider than shoulders."},{"title":"Pull","detail":"Drive the elbows down to pull your chin toward the bar."},{"title":"Squeeze","detail":"Pause briefly at the top."},{"title":"Lower","detail":"Lower slowly to a full hang before the next rep."}]'::jsonb,
  ARRAY['Reducing the assist too fast', 'Kipping the legs', 'Partial reps']::TEXT[],
  'Exhale as you pull, inhale as you lower.',
  '8–15 reps',
  ARRAY['Pick an assist where you can do ~10 controlled reps', 'Full range every rep']::TEXT[],
  ARRAY['Drop the assist 5–10 kg as you get stronger', 'Finish with slow negatives']::TEXT[],
  ARRAY['Set the knee pad properly — a slipped knee under load hurts']::TEXT[],
  ARRAY['pull-up', 'chin-up', 'lat-pulldown']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('assisted-pullup', 'assisted pull up') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('assisted-pullup', 'assisted pull-up machine') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  't-bar-row',
  'T-Bar Row',
  'A barbell row anchored at one end, allowing heavy loading in a stable position. The T-bar row packs serious mid-back thickness with less lower-back stress than a free barbell row.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Back'::public.muscle_group,
  ARRAY['Biceps', 'Shoulders']::public.muscle_group[],
  'Barbell'::public.equipment_type,
  'Gym',
  false,
  'row'::public.animation_key,
  '[{"title":"Setup","detail":"Straddle the bar with the weight at your end, hinge forward with a flat back, and grip the handle."},{"title":"Row","detail":"Drive the elbows back to pull the handle to your chest."},{"title":"Squeeze","detail":"Squeeze the mid-back at the top."},{"title":"Lower","detail":"Lower under control to a full stretch."}]'::jsonb,
  ARRAY['Standing upright instead of hinging', 'Rounding the lower back', 'Jerking the weight with momentum']::TEXT[],
  'Brace and hold as you row, exhale at the top.',
  '8–12 reps',
  ARRAY['Light weight — get the hinge position right first', 'Keep the chest proud']::TEXT[],
  ARRAY['Add 2.5 kg per session', 'Pause 2 seconds at peak contraction']::TEXT[],
  ARRAY['Keep the spine neutral throughout', 'Use a handle, not a poorly-secured grip']::TEXT[],
  ARRAY['barbell-row', 'seated-cable-row', 'machine-row']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('t-bar-row', 't bar row') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('t-bar-row', 'landmine row') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'straight-arm-pulldown',
  'Straight-Arm Pulldown',
  'An isolation move that fires the lats with straight arms — a great way to feel and fatigue the lats without biceps involvement. Perfect as a warm-up or finisher.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Back'::public.muscle_group,
  ARRAY['Core']::public.muscle_group[],
  'Cable'::public.equipment_type,
  'Gym',
  true,
  'pulldown'::public.animation_key,
  '[{"title":"Setup","detail":"Face the high pulley, grip the bar with straight, slightly-bent arms, and step back into a slight lean."},{"title":"Pull","detail":"Sweep the bar down to your thighs, keeping the arms straight and squeezing the lats."},{"title":"Pause","detail":"Squeeze at the bottom."},{"title":"Return","detail":"Return slowly until the arms reach shoulder height."}]'::jsonb,
  ARRAY['Bending the elbows into a row', 'Leaning forward excessively', 'Rushing the movement']::TEXT[],
  'Exhale as you pull down, inhale as you return.',
  '12–15 reps',
  ARRAY['Light weight — think “long arms, big squeeze”', 'Keep the core tight to avoid over-leaning']::TEXT[],
  ARRAY['Slow the return to 3 seconds', 'Increase weight once form is locked']::TEXT[],
  ARRAY['Don''t force the range if the shoulder complains']::TEXT[],
  ARRAY['lat-pulldown', 'pull-up', 'band-pulldown']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'hyperextension',
  'Back Extension',
  'A hip-hinge movement that builds the erector spinae, glutes and hamstrings — the support system for every heavy deadlift and squat. The best lower-back strengthener in the gym.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Lower'::public.body_region,
  'Back'::public.muscle_group,
  ARRAY['Glutes', 'Hamstrings']::public.muscle_group[],
  'Machine'::public.equipment_type,
  'Gym',
  true,
  'deadlift'::public.animation_key,
  '[{"title":"Setup","detail":"Set the pad at hip height and hook your ankles under the supports."},{"title":"Hinge","detail":"Hinge forward until your torso is past 45°, back flat."},{"title":"Extend","detail":"Raise your torso until it is in line with your legs."},{"title":"Finish","detail":"Squeeze the glutes at the top without hyperextending."}]'::jsonb,
  ARRAY['Overextending the lower back at the top', 'Rounding the spine at the bottom', 'Using momentum']::TEXT[],
  'Exhale as you extend, inhale as you hinge down.',
  '12–20 reps',
  ARRAY['Use bodyweight until the pattern is clean', 'Keep the neck neutral']::TEXT[],
  ARRAY['Hold a plate across your chest', 'Add a 2-second pause at the top']::TEXT[],
  ARRAY['Never hyperextend — stop at neutral spine']::TEXT[],
  ARRAY['good-morning', 'romanian-deadlift', 'hyperextension']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'shrug',
  'Barbell Shrug',
  'The direct builder for the upper traps — the muscles that carry the bar in deadlifts and give your shoulders that powerful slope. Simple, heavy, effective.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Back'::public.muscle_group,
  ARRAY['Shoulders']::public.muscle_group[],
  'Barbell'::public.equipment_type,
  'Gym',
  true,
  'press'::public.animation_key,
  '[{"title":"Setup","detail":"Hold the bar at your thighs with an overhand grip, standing tall."},{"title":"Shrug","detail":"Shrug your shoulders straight up toward your ears."},{"title":"Squeeze","detail":"Squeeze the traps at the top."},{"title":"Lower","detail":"Lower under control — don''t roll the shoulders."}]'::jsonb,
  ARRAY['Rolling the shoulders (invites injury)', 'Bending the elbows into a row', 'Using momentum']::TEXT[],
  'Exhale as you shrug, inhale as you lower.',
  '10–15 reps',
  ARRAY['Start with a weight you can shrug 12 clean reps', 'Shrug straight up — no circles']::TEXT[],
  ARRAY['Add 2.5 kg per session', 'Pause 2 seconds at the top']::TEXT[],
  ARRAY['Keep the neck relaxed — don''t press the head down']::TEXT[],
  ARRAY['dumbbell-shrug', 'rack-pull', 'deadlift']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'shoulder-press',
  'Shoulder Press',
  'The foundation of shoulder size and overhead strength. Dumbbells allow a natural arc and are far safer overhead than a barbell for most lifters.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Shoulders'::public.muscle_group,
  ARRAY['Triceps', 'Core']::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'press'::public.animation_key,
  '[{"title":"Setup","detail":"Stand tall, dumbbells at shoulder height, palms forward, core braced."},{"title":"Press","detail":"Press the dumbbells up until your arms are extended overhead."},{"title":"Lock","detail":"Finish with the weights slightly behind your head line — not directly overhead."},{"title":"Lower","detail":"Lower under control back to shoulder height."}]'::jsonb,
  ARRAY['Arching the lower back to press', 'Pressing the weights forward', 'Not bracing the core']::TEXT[],
  'Inhale at the bottom, exhale during the press, hold the brace.',
  '6–10 reps',
  ARRAY['Squeeze your glutes to protect the lower back', 'Start seated if balance is an issue']::TEXT[],
  ARRAY['Add 2 kg per session', 'Try a 2-second pause at the top', 'Rotate in strict barbell presses']::TEXT[],
  ARRAY['Never arch violently — if you must, the weight is too heavy']::TEXT[],
  ARRAY['machine-press', 'arnold-press', 'push-press']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('shoulder-press', 'overhead press') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('shoulder-press', 'ohp') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('shoulder-press', 'military press') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('shoulder-press', 'barbell shoulder press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'arnold-press',
  'Arnold Press',
  'A rotating shoulder press that hits all three delt heads in one movement. The twist from palms-in to palms-out keeps tension through the entire arc.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Shoulders'::public.muscle_group,
  ARRAY['Triceps']::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  false,
  'press'::public.animation_key,
  '[{"title":"Start","detail":"Hold dumbbells at chin height, palms facing you, elbows tucked."},{"title":"Rotate","detail":"As you press up, rotate your palms to face forward."},{"title":"Press","detail":"Finish with arms extended overhead."},{"title":"Reverse","detail":"Rotate back down to the start position under control."}]'::jsonb,
  ARRAY['Rushing the rotation', 'Using the legs to bounce', 'Dropping the elbows too low']::TEXT[],
  'Exhale as you press and rotate, inhale as you lower.',
  '8–12 reps',
  ARRAY['Use light dumbbells to learn the rotation', 'Keep the core tight throughout']::TEXT[],
  ARRAY['Slow the lowering to 3 seconds', 'Add a pause at the bottom']::TEXT[],
  ARRAY['Keep the shoulders away from the ears — no shrugging']::TEXT[],
  ARRAY['shoulder-press', 'machine-press', 'push-press']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'lateral-raise',
  'Lateral Raise',
  'The essential side-delt builder that creates the "capped" shoulder look. A simple arm arc that demands light weights and perfect discipline.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Shoulders'::public.muscle_group,
  ARRAY['Back']::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'raise'::public.animation_key,
  '[{"title":"Stand","detail":"Stand tall, dumbbells at your sides, slight elbow bend."},{"title":"Raise","detail":"Raise the weights out to shoulder height, leading with the elbows."},{"title":"Pause","detail":"Pause at the top — pinkies slightly higher than thumbs."},{"title":"Lower","detail":"Lower slowly, stopping just before the weights touch your thighs."}]'::jsonb,
  ARRAY['Using momentum and swinging', 'Shrugging up to the ears', 'Going too heavy and pressing the weight up']::TEXT[],
  'Exhale as you raise, inhale as you lower.',
  '12–20 reps',
  ARRAY['Light weight — 5–8 kg is plenty', 'Do them early in the session, before fatigue sets in']::TEXT[],
  ARRAY['Slow the negative to 3 seconds', 'Use partial reps at the top for extra volume']::TEXT[],
  ARRAY['Keep the arc in front of the body, not behind']::TEXT[],
  ARRAY['cable-lateral-raise', 'machine-lateral-raise']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('lateral-raise', 'side raise') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('lateral-raise', 'dumbbell lateral raise') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'rear-delt-fly',
  'Rear Delt Fly',
  'An isolation movement for the rear delts — the muscle most lifters neglect. Strong rear delts improve posture and keep the shoulders balanced against pressing work.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Shoulders'::public.muscle_group,
  ARRAY['Back']::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'fly'::public.animation_key,
  '[{"title":"Setup","detail":"Hinge forward with a flat back, dumbbells hanging below your chest."},{"title":"Fly","detail":"Raise the weights out and up in a wide arc, leading with the elbows."},{"title":"Squeeze","detail":"Squeeze the rear delts at the top."},{"title":"Lower","detail":"Lower under control."}]'::jsonb,
  ARRAY['Rounding the back', 'Using the traps to shrug', 'Momentum-driven swings']::TEXT[],
  'Exhale as you raise, inhale as you lower.',
  '12–20 reps',
  ARRAY['Use very light weight', 'Chest up, spine neutral']::TEXT[],
  ARRAY['Pause 2 seconds at the top', 'Use cables for constant tension']::TEXT[],
  ARRAY['Keep the neck long — no looking up']::TEXT[],
  ARRAY['face-pull', 'band-face-pull']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('rear-delt-fly', 'reverse fly') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('rear-delt-fly', 'rear delt raise') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'machine-shoulder-press',
  'Machine Shoulder Press',
  'A fixed-path overhead press that lets you push heavy without balance or core demands. A safe, effective way to build shoulder size, especially for beginners.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Shoulders'::public.muscle_group,
  ARRAY['Triceps']::public.muscle_group[],
  'Machine'::public.equipment_type,
  'Gym',
  true,
  'press'::public.animation_key,
  '[{"title":"Setup","detail":"Adjust the seat so the handles start at shoulder height."},{"title":"Press","detail":"Press the handles overhead until your arms are extended."},{"title":"Lock","detail":"Pause softly at the top."},{"title":"Lower","detail":"Lower under control back to shoulder height."}]'::jsonb,
  ARRAY['Seat too low or high', 'Pressing the handles forward instead of up', 'Slamming the weight down']::TEXT[],
  'Exhale as you press, inhale as you lower.',
  '8–15 reps',
  ARRAY['Set the seat height first', 'Keep the back against the pad']::TEXT[],
  ARRAY['Add weight each session', 'Slow the lowering to 3 seconds']::TEXT[],
  ARRAY['Use the safety stops on heavy sets']::TEXT[],
  ARRAY['shoulder-press', 'arnold-press', 'push-press']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('machine-shoulder-press', 'shoulder press machine') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('machine-shoulder-press', 'machine overhead press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'cable-lateral-raise',
  'Cable Lateral Raise',
  'A lateral raise with constant cable tension — the side delts stay loaded even at the bottom of the rep, where dumbbells go slack. The secret weapon for capped shoulders.',
  'Isolation'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Shoulders'::public.muscle_group,
  ARRAY['Back']::public.muscle_group[],
  'Cable'::public.equipment_type,
  'Gym',
  false,
  'raise'::public.animation_key,
  '[{"title":"Setup","detail":"Stand sideways to a low pulley, holding the handle across your body."},{"title":"Raise","detail":"Raise your arm out to shoulder height, leading with the elbow."},{"title":"Pause","detail":"Pause at the top."},{"title":"Lower","detail":"Lower slowly, resisting the cable."}]'::jsonb,
  ARRAY['Swinging the torso', 'Raising too high and shrugging', 'Using too much weight']::TEXT[],
  'Exhale as you raise, inhale as you lower.',
  '12–20 reps',
  ARRAY['Use a light plate — tension is constant', 'Keep a slight elbow bend']::TEXT[],
  ARRAY['Slow the negative to 3 seconds', 'Do partial reps at the top for extra volume']::TEXT[],
  ARRAY['Keep the arc in front of the body']::TEXT[],
  ARRAY['lateral-raise', 'machine-lateral-raise', 'upright-row']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'front-raise',
  'Front Raise',
  'A simple isolation lift for the front delts — the head that already works hard on presses. Great as a targeted finisher or to correct underdeveloped front shoulders.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Shoulders'::public.muscle_group,
  ARRAY['Chest']::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'raise'::public.animation_key,
  '[{"title":"Setup","detail":"Stand tall with dumbbells at your thighs, palms facing you."},{"title":"Raise","detail":"Raise one arm forward to shoulder height, keeping it straight-ish."},{"title":"Pause","detail":"Pause briefly at the top."},{"title":"Lower","detail":"Lower under control and alternate arms."}]'::jsonb,
  ARRAY['Swinging the body', 'Raising above shoulder height and shrugging', 'Using momentum']::TEXT[],
  'Exhale as you raise, inhale as you lower.',
  '12–15 reps',
  ARRAY['Light weight, controlled reps', 'Alternate arms to keep form honest']::TEXT[],
  ARRAY['Slow the negative to 3 seconds', 'Use both arms together for heavier loads']::TEXT[],
  ARRAY['Stop at shoulder height — no pressing above with the hips']::TEXT[],
  ARRAY['lateral-raise', 'cable-lateral-raise', 'shoulder-press']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('front-raise', 'dumbbell front raise') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'upright-row',
  'Upright Row',
  'A vertical pull that builds the side and front delts plus the upper traps in one movement. Keep the bar path close and the elbows above the wrists to protect the shoulders.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Shoulders'::public.muscle_group,
  ARRAY['Biceps', 'Back']::public.muscle_group[],
  'Barbell'::public.equipment_type,
  'Gym',
  false,
  'curl'::public.animation_key,
  '[{"title":"Setup","detail":"Hold the bar at your thighs with an overhand grip, hands shoulder-width."},{"title":"Pull","detail":"Pull the bar up along your body, leading with the elbows."},{"title":"Peak","detail":"Stop when the bar reaches upper-chest height."},{"title":"Lower","detail":"Lower under control back to the thighs."}]'::jsonb,
  ARRAY['Pulling the bar too high (impingement risk)', 'Wrists below the elbows', 'Swinging the torso']::TEXT[],
  'Exhale as you pull up, inhale as you lower.',
  '10–15 reps',
  ARRAY['Use a wide grip and stop at chest height', 'Keep the bar close to the body']::TEXT[],
  ARRAY['Increase weight gradually', 'Use a rope or dumbbells for a neutral grip']::TEXT[],
  ARRAY['If the shoulder pinches, widen the grip or stop higher']::TEXT[],
  ARRAY['lateral-raise', 'front-raise', 'shrug']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'bicep-curl',
  'Bicep Curl',
  'The classic arm-builder. Strict curls with controlled tempo build the biceps and forearm strength while sparing the shoulders from swinging load.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Biceps'::public.muscle_group,
  ARRAY['Forearms']::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'curl'::public.animation_key,
  '[{"title":"Setup","detail":"Stand tall, dumbbells at your sides, palms facing forward, elbows pinned to your ribs."},{"title":"Curl","detail":"Curl the weights up, squeezing the biceps at the top."},{"title":"Pause","detail":"Pause briefly at the top."},{"title":"Lower","detail":"Lower slowly over 2–3 seconds to full extension."}]'::jsonb,
  ARRAY['Swinging the body to heave the weight', 'Letting the elbows drift forward', 'Cutting the range short at the bottom']::TEXT[],
  'Exhale as you curl up, inhale as you lower.',
  '8–15 reps',
  ARRAY['Pin the elbows to your sides', 'Curl both arms together for symmetry']::TEXT[],
  ARRAY['Slow the eccentric to 4 seconds', 'Try incline curls for a deeper stretch']::TEXT[],
  ARRAY['Keep wrists neutral — no flaring']::TEXT[],
  ARRAY['hammer-curl', 'incline-curl', 'cable-curl']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('bicep-curl', 'barbell curl') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('bicep-curl', 'bb curl') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('bicep-curl', 'curl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'hammer-curl',
  'Hammer Curl',
  'A curl with a neutral grip that emphasizes the brachialis and forearms, adding thickness to the upper arm from every angle.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Biceps'::public.muscle_group,
  ARRAY['Forearms']::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'curl'::public.animation_key,
  '[{"title":"Setup","detail":"Hold dumbbells at your sides, palms facing each other."},{"title":"Curl","detail":"Curl up, keeping the neutral grip, elbow pinned."},{"title":"Squeeze","detail":"Squeeze at the top."},{"title":"Lower","detail":"Lower slowly to full extension."}]'::jsonb,
  ARRAY['Rotating the wrists mid-rep', 'Swinging the torso']::TEXT[],
  'Exhale up, inhale down.',
  '8–15 reps',
  ARRAY['Keep palms facing each other the whole set', 'Full stretch at the bottom']::TEXT[],
  ARRAY['Alternate arms for heavier loads', 'Add a pause at the top']::TEXT[],
  ARRAY['Control the negative — no dropping']::TEXT[],
  ARRAY['bicep-curl', 'incline-curl', 'cable-curl']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'incline-curl',
  'Incline Dumbbell Curl',
  'An incline bench curl that places the biceps in a stretched position — the angle that drives the most growth. The bane of ego lifters, the gift of smart ones.',
  'Isolation'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Biceps'::public.muscle_group,
  ARRAY['Forearms']::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  false,
  'curl'::public.animation_key,
  '[{"title":"Setup","detail":"Recline on a 45–60° bench, arms hanging straight down, palms forward."},{"title":"Curl","detail":"Curl the weights up without letting the shoulders roll forward."},{"title":"Squeeze","detail":"Squeeze at the top."},{"title":"Lower","detail":"Lower slowly until the arms hang fully."}]'::jsonb,
  ARRAY['Arching the back', 'Shoulders rolling forward at the top', 'Too heavy, too fast']::TEXT[],
  'Exhale up, inhale down.',
  '8–12 reps',
  ARRAY['Drop the weight — the stretch position is humbling', 'Keep the shoulders pinned back']::TEXT[],
  ARRAY['Slow negatives to 4 seconds', 'One-and-a-quarter reps for extra time under tension']::TEXT[],
  ARRAY['Don''t force the range if the shoulder complains']::TEXT[],
  ARRAY['bicep-curl', 'hammer-curl', 'cable-curl']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('incline-curl', 'incline dumbbell curl') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('incline-curl', 'incline curl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'cable-curl',
  'Cable Curl',
  'A curl against a cable keeps constant tension on the biceps at the top — exactly where dumbbell curls relax. Ideal for chasing peak contraction and a brutal pump.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Biceps'::public.muscle_group,
  ARRAY['Forearms']::public.muscle_group[],
  'Cable'::public.equipment_type,
  'Gym',
  true,
  'curl'::public.animation_key,
  '[{"title":"Setup","detail":"Stand facing a low pulley with a bar or rope, elbows pinned to your sides."},{"title":"Curl","detail":"Curl up, keeping the elbows fixed."},{"title":"Squeeze","detail":"Squeeze hard at the top — the cable keeps loading."},{"title":"Return","detail":"Return slowly, resisting the weight."}]'::jsonb,
  ARRAY['Elbows drifting forward', 'Leaning back to heave the weight', 'Cutting the top squeeze short']::TEXT[],
  'Exhale as you curl, inhale as you lower.',
  '10–15 reps',
  ARRAY['Lock the elbows to your ribs', 'Light weight, full control']::TEXT[],
  ARRAY['Pause 2 seconds at peak contraction', 'Use a rope for a deeper squeeze']::TEXT[],
  ARRAY['Keep the wrists neutral']::TEXT[],
  ARRAY['bicep-curl', 'preacher-curl', 'incline-curl']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('cable-curl', 'cable bicep curl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'preacher-curl',
  'Preacher Curl',
  'The preacher bench locks your arms in front of you, removing any body English — the biceps must do all the work, especially through a deep, unforgiving stretch at the bottom.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Biceps'::public.muscle_group,
  ARRAY['Forearms']::public.muscle_group[],
  'Barbell'::public.equipment_type,
  'Gym',
  true,
  'curl'::public.animation_key,
  '[{"title":"Setup","detail":"Sit with your armpits snug against the pad and grab the bar shoulder-width."},{"title":"Lower","detail":"Lower until your arms are nearly straight — feel the deep stretch."},{"title":"Curl","detail":"Curl the bar up, squeezing the biceps."},{"title":"Squeeze","detail":"Pause at the top before lowering."}]'::jsonb,
  ARRAY['Lifting the hips off the seat', 'Bouncing at the bottom', 'Partial reps to avoid the stretch']::TEXT[],
  'Exhale as you curl up, inhale as you lower.',
  '8–12 reps',
  ARRAY['Use the EZ-bar to spare the wrists', 'Embrace the stretch — it''s the point']::TEXT[],
  ARRAY['Slow the negative to 4 seconds', 'Add one-and-a-quarter reps']::TEXT[],
  ARRAY['Keep the elbows fully supported on the pad']::TEXT[],
  ARRAY['bicep-curl', 'incline-curl', 'cable-curl']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('preacher-curl', 'preacher curl machine') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'concentration-curl',
  'Concentration Curl',
  'A seated one-arm curl with the elbow braced against the inner thigh — total isolation that forces strict form. The classic “feel the muscle” movement for peak development.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Pull'::public.movement_pattern,
  'Upper'::public.body_region,
  'Biceps'::public.muscle_group,
  ARRAY['Forearms']::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'curl'::public.animation_key,
  '[{"title":"Setup","detail":"Sit and brace one elbow against your inner thigh, arm hanging straight down."},{"title":"Curl","detail":"Curl the dumbbell up toward your shoulder without moving the elbow."},{"title":"Squeeze","detail":"Squeeze hard at the top."},{"title":"Lower","detail":"Lower slowly to a full stretch."}]'::jsonb,
  ARRAY['Rocking the torso', 'Using the shoulder to lift', 'Dropping the weight at the bottom']::TEXT[],
  'Exhale as you curl, inhale as you lower.',
  '10–15 reps per arm',
  ARRAY['Light weight — control is the whole exercise', 'Keep the elbow pinned']::TEXT[],
  ARRAY['Slow the negative to 4 seconds', 'Add a pause at the top']::TEXT[],
  ARRAY['Keep the wrist neutral — no flaring']::TEXT[],
  ARRAY['bicep-curl', 'hammer-curl', 'preacher-curl']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'triceps-pushdown',
  'Triceps Pushdown',
  'The quickest way to add triceps size. Constant cable tension keeps the muscle loaded through the entire lockout, where the triceps work hardest.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Triceps'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Cable'::public.equipment_type,
  'Gym',
  true,
  'pushdown'::public.animation_key,
  '[{"title":"Setup","detail":"Stand facing the cable, elbows tucked to your sides, bar at chest height."},{"title":"Push","detail":"Press the bar down until your arms are fully locked out."},{"title":"Squeeze","detail":"Squeeze the triceps hard at the bottom."},{"title":"Return","detail":"Return slowly to chest height, keeping elbows still."}]'::jsonb,
  ARRAY['Elbows flaring outward', 'Leaning over the bar', 'Rushing the top half of the rep']::TEXT[],
  'Exhale on the pushdown, inhale on the return.',
  '10–15 reps',
  ARRAY['Lock the elbows in place — only the forearms move', 'Lean slightly, don''t hunch']::TEXT[],
  ARRAY['Add a rope attachment for a deeper squeeze', 'Pause 2 seconds at lockout']::TEXT[],
  ARRAY['Keep the shoulders down — no shrugging']::TEXT[],
  ARRAY['overhead-extension', 'skull-crusher', 'dips']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('triceps-pushdown', 'pushdown') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('triceps-pushdown', 'cable pushdown') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('triceps-pushdown', 'tricep pushdown') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'overhead-extension',
  'Overhead Triceps Extension',
  'Targets the long head of the triceps — the part that gives the arm its horseshoe shape. Reaching overhead stretches the long head far more than pushdowns.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Triceps'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'pushdown'::public.animation_key,
  '[{"title":"Setup","detail":"Hold one dumbbell overhead with both hands, arms extended."},{"title":"Lower","detail":"Lower the weight behind your head, elbows pointing forward."},{"title":"Stretch","detail":"Feel the deep triceps stretch at the bottom."},{"title":"Extend","detail":"Extend back to full lockout."}]'::jsonb,
  ARRAY['Elbows flaring out wide', 'Arching the lower back', 'Bouncing the weight off the neck']::TEXT[],
  'Exhale as you extend, inhale as you lower.',
  '10–15 reps',
  ARRAY['Keep the elbows close to the ears', 'Start with a light dumbbell']::TEXT[],
  ARRAY['Slow the lowering to 4 seconds', 'Use a rope cable for constant tension']::TEXT[],
  ARRAY['Stop if the shoulder pinches — reduce the range']::TEXT[],
  ARRAY['triceps-pushdown', 'skull-crusher', 'dips']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('overhead-extension', 'overhead triceps extension') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('overhead-extension', 'skull crusher overhead') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'skull-crusher',
  'Skull Crusher (Lying Triceps Extension)',
  'A lying triceps extension that loads the long head through a deep stretch. Heavy, effective and humbling — the elbows stay pinned while the bar travels from forehead to lockout.',
  'Isolation'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Triceps'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Barbell'::public.equipment_type,
  'Gym',
  false,
  'pushdown'::public.animation_key,
  '[{"title":"Setup","detail":"Lie on a bench holding an EZ-bar above your chest, arms extended."},{"title":"Lower","detail":"Lower the bar toward your forehead, elbows pointing up and pinned."},{"title":"Stretch","detail":"Feel the deep triceps stretch at the bottom."},{"title":"Extend","detail":"Extend back to lockout, keeping the elbows still."}]'::jsonb,
  ARRAY['Elbows flaring out wide', 'Lowering to the neck instead of the forehead', 'Using the shoulders to press']::TEXT[],
  'Exhale as you extend, inhale as you lower.',
  '8–12 reps',
  ARRAY['Use the EZ-bar and a light load', 'Keep the upper arms perpendicular to the floor']::TEXT[],
  ARRAY['Slow the lowering to 3 seconds', 'Try dumbbells for a deeper stretch']::TEXT[],
  ARRAY['Have a spotter for heavy sets', 'Never bounce the bar off your forehead']::TEXT[],
  ARRAY['overhead-extension', 'triceps-pushdown', 'close-grip-bench-press']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('skull-crusher', 'lying triceps extension') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('skull-crusher', 'french press') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('skull-crusher', 'ez bar extension') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'close-grip-bench-press',
  'Close-Grip Bench Press',
  'A bench press with a shoulder-width grip that shifts the load onto the triceps — a heavy compound that builds raw pressing power and lockout strength.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Triceps'::public.muscle_group,
  ARRAY['Chest', 'Shoulders']::public.muscle_group[],
  'Barbell'::public.equipment_type,
  'Gym',
  false,
  'bench'::public.animation_key,
  '[{"title":"Setup","detail":"Grip the bar shoulder-width, wrists stacked over the elbows. Retract the shoulder blades."},{"title":"Lower","detail":"Lower the bar to the lower chest, elbows tucked tight."},{"title":"Press","detail":"Drive the bar up, thinking of pushing with the triceps."},{"title":"Lock","detail":"Lock out fully at the top."}]'::jsonb,
  ARRAY['Gripping too narrow (wrist strain)', 'Elbows flaring out', 'Bouncing off the chest']::TEXT[],
  'Inhale at the top, hold as you lower, exhale on the press.',
  '6–10 reps',
  ARRAY['Start lighter than your regular bench', 'Keep the wrists stacked over the elbows']::TEXT[],
  ARRAY['Add 2.5 kg per session', 'Add paused reps at the chest']::TEXT[],
  ARRAY['Use a spotter — a missed rep near the face is dangerous']::TEXT[],
  ARRAY['triceps-pushdown', 'dips', 'skull-crusher']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('close-grip-bench-press', 'close grip bench') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('close-grip-bench-press', 'close grip bench press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'triceps-kickback',
  'Triceps Kickback',
  'A strict one-arm extension with the upper arm parallel to the floor. The movement isolates the triceps behind the elbow — light weights, high reps, full control.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Push'::public.movement_pattern,
  'Upper'::public.body_region,
  'Triceps'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'pushdown'::public.animation_key,
  '[{"title":"Setup","detail":"Hinge forward with a flat back, upper arm pinned parallel to your torso, elbow bent 90°."},{"title":"Extend","detail":"Extend the forearm back until the arm is straight."},{"title":"Squeeze","detail":"Squeeze the triceps at lockout."},{"title":"Return","detail":"Return slowly to the bent position."}]'::jsonb,
  ARRAY['Swinging the upper arm', 'Using the shoulder to lift', 'Rushing the lockout']::TEXT[],
  'Exhale as you extend, inhale as you return.',
  '12–15 reps per arm',
  ARRAY['Very light weight — form over load', 'Keep the upper arm still']::TEXT[],
  ARRAY['Pause 2 seconds at lockout', 'Slow the negative to 3 seconds']::TEXT[],
  ARRAY['Keep the neck neutral — don''t look up']::TEXT[],
  ARRAY['triceps-pushdown', 'overhead-extension', 'skull-crusher']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('triceps-kickback', 'kickback') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('triceps-kickback', 'dumbbell kickback') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'squat',
  'Squat',
  'The undisputed king of lower-body exercises. The squat builds leg and glute size, core strength and full-body athleticism — no machine replicates its value.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Quads'::public.muscle_group,
  ARRAY['Glutes', 'Core']::public.muscle_group[],
  'Barbell'::public.equipment_type,
  'Gym',
  false,
  'squat'::public.animation_key,
  '[{"title":"Setup","detail":"Bar on your upper traps, feet shoulder-width, toes slightly out. Brace hard."},{"title":"Descend","detail":"Sit back and down, hips and knees bending together, chest tall."},{"title":"Depth","detail":"Descend until your thighs reach at least parallel — knees tracking over toes."},{"title":"Drive","detail":"Drive through the whole foot to stand up, squeezing the glutes at the top."}]'::jsonb,
  ARRAY['Knees caving inward', 'Rising with the hips first (good morning squat)', 'Heels lifting off the floor', 'Losing the brace — rounding the back']::TEXT[],
  'Take a big breath and brace before each rep; exhale at the top.',
  '5–8 reps for strength, 8–12 for size',
  ARRAY['Master the goblet squat before loading a bar', 'Film your sets to check depth', 'Use a box to learn the hip-hinge pattern']::TEXT[],
  ARRAY['Add 2.5 kg per session', 'Pause squats for control out of the hole', 'Rotate in front squats to strengthen the quads']::TEXT[],
  ARRAY['Use safeties or a spotter for heavy sets', 'Never round the lower back under load']::TEXT[],
  ARRAY['goblet-squat', 'leg-press', 'hack-squat']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('squat', 'barbell squat') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('squat', 'back squat') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('squat', 'bb squat') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'goblet-squat',
  'Goblet Squat',
  'The best squat for learning the pattern. Holding a weight at your chest forces an upright torso, great depth and teaches the sit-back mechanics of a perfect squat.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Quads'::public.muscle_group,
  ARRAY['Glutes', 'Core']::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'squat'::public.animation_key,
  '[{"title":"Setup","detail":"Hold a dumbbell vertically at your chest, elbows down, feet shoulder-width."},{"title":"Sit","detail":"Sit back and down until your thighs are parallel or deeper."},{"title":"Pause","detail":"Pause briefly in the hole."},{"title":"Stand","detail":"Drive up through the whole foot to standing."}]'::jsonb,
  ARRAY['Elbows dropping as you descend', 'Rising onto the toes', 'Rounding the back at the bottom']::TEXT[],
  'Brace before descending, exhale as you stand.',
  '10–15 reps',
  ARRAY['Use a bench behind you to learn depth', 'Keep the chest proud the entire rep']::TEXT[],
  ARRAY['Increase the dumbbell weight', 'Add a 3-second descent for control']::TEXT[],
  ARRAY['Keep heels planted — weight in the mid-foot']::TEXT[],
  ARRAY['squat', 'leg-press', 'hack-squat']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('goblet-squat', 'goblet squat dumbbell') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'romanian-deadlift',
  'Romanian Deadlift',
  'The premier hamstring and glute builder. The RDL trains the hip hinge with constant tension on the posterior chain — the key to strong pulls and injury-resistant hamstrings.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Hamstrings'::public.muscle_group,
  ARRAY['Glutes', 'Back']::public.muscle_group[],
  'Barbell'::public.equipment_type,
  'Gym',
  false,
  'deadlift'::public.animation_key,
  '[{"title":"Setup","detail":"Stand tall with the bar at your thighs, slight knee bend, core braced."},{"title":"Hinge","detail":"Push your hips back, keeping the bar close to your legs as it travels down."},{"title":"Stretch","detail":"Lower until you feel a deep hamstring stretch — back stays flat."},{"title":"Drive","detail":"Drive the hips forward to stand tall, squeezing the glutes at the top."}]'::jsonb,
  ARRAY['Rounding the lower back', 'Bending the knees too much (turns into a squat)', 'Letting the bar drift away from the legs']::TEXT[],
  'Brace before each rep; exhale as you stand.',
  '6–10 reps',
  ARRAY['Learn the hinge with an empty bar or PVC pipe', 'Keep the bar glued to your thighs']::TEXT[],
  ARRAY['Add 2.5 kg weekly', 'Pause 2 seconds in the stretched position']::TEXT[],
  ARRAY['Never round the back — drop the weight if you must']::TEXT[],
  ARRAY['deadlift', 'hyperextension', 'leg-curl']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('romanian-deadlift', 'rdl') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('romanian-deadlift', 'romanian dead lift') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'deadlift',
  'Deadlift',
  'The ultimate full-body strength lift. The deadlift loads the entire posterior chain, grip, core and back — building raw strength that transfers to every other lift.',
  'Compound'::public.exercise_category,
  'Advanced'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Full Body'::public.body_region,
  'Back'::public.muscle_group,
  ARRAY['Hamstrings', 'Glutes', 'Core']::public.muscle_group[],
  'Barbell'::public.equipment_type,
  'Gym',
  false,
  'deadlift'::public.animation_key,
  '[{"title":"Setup","detail":"Feet under the bar, grip just outside the knees. Hinge down with a flat back."},{"title":"Pull","detail":"Take the slack out of the bar, brace, then push the floor away."},{"title":"Lock","detail":"Stand tall, hips and knees extended together."},{"title":"Lower","detail":"Hinge the bar down under control, keeping it close."}]'::jsonb,
  ARRAY['Rounding the back before the bar leaves the floor', 'Jerking the bar off the floor', 'Hyperextending at the top']::TEXT[],
  'Big breath and brace at the bottom; exhale at lockout.',
  '3–6 reps for strength',
  ARRAY['Master the RDL and hip hinge first', 'Keep the bar in contact with your legs']::TEXT[],
  ARRAY['Add 2.5 kg per session', 'Use a mixed grip or straps when grip fails']::TEXT[],
  ARRAY['Never pull with a rounded spine', 'Use a platform or bumper plates']::TEXT[],
  ARRAY['romanian-deadlift', 'trap-bar-deadlift', 'hyperextension']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('deadlift', 'conventional deadlift') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('deadlift', 'barbell deadlift') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'leg-press',
  'Leg Press',
  'A machine squat that removes balance and back demands, allowing heavy quad and glute loading. Great for high-volume leg training and for lifters with back limitations.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Quads'::public.muscle_group,
  ARRAY['Glutes']::public.muscle_group[],
  'Machine'::public.equipment_type,
  'Gym',
  true,
  'squat'::public.animation_key,
  '[{"title":"Setup","detail":"Sit with feet shoulder-width on the platform, lower back against the pad."},{"title":"Lower","detail":"Lower the platform until your knees reach ~90°, keeping the lower back pinned."},{"title":"Press","detail":"Drive through the whole foot to extend the legs."},{"title":"Stop","detail":"Stop just short of locking the knees."}]'::jsonb,
  ARRAY['Lowering too deep until the hips tuck', 'Locking the knees hard at the top', 'Heels lifting off the platform']::TEXT[],
  'Exhale as you press, inhale as you lower.',
  '8–15 reps',
  ARRAY['Foot position higher = more glutes; lower = more quads', 'Keep the hips glued to the seat']::TEXT[],
  ARRAY['Add weight each session', 'Pause at the bottom of the rep']::TEXT[],
  ARRAY['Always use the safety stops', 'Never bounce the weight']::TEXT[],
  ARRAY['squat', 'goblet-squat', 'hack-squat']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('leg-press', 'horizontal leg press') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('leg-press', 'leg press machine') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('leg-press', 'sled press') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('leg-press', 'leg press horizontal') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'leg-extension',
  'Leg Extension',
  'A direct quad isolation that adds knee-strength and leg volume with minimal recovery cost. Perfect as a pre-exhaust before squats or a finisher after them.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Quads'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Machine'::public.equipment_type,
  'Gym',
  true,
  'squat'::public.animation_key,
  '[{"title":"Setup","detail":"Sit with knees aligned to the machine pivot, ankles behind the pad."},{"title":"Extend","detail":"Extend your legs fully, squeezing the quads at the top."},{"title":"Pause","detail":"Pause briefly at lockout."},{"title":"Lower","detail":"Lower slowly — don''t let the stack slam."}]'::jsonb,
  ARRAY['Riding the momentum', 'Flaring the knees', 'Cutting the top of the rep']::TEXT[],
  'Exhale as you extend, inhale as you lower.',
  '10–15 reps',
  ARRAY['Align the pivot with your knee joint', 'Keep a light knee bend at the top']::TEXT[],
  ARRAY['Slow the negative to 3 seconds', 'Add single-leg sets to fix imbalances']::TEXT[],
  ARRAY['Stop if you feel sharp knee pain — adjust the machine first']::TEXT[],
  ARRAY['squat', 'goblet-squat', 'lunge']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'leg-curl',
  'Seated Leg Curl',
  'Direct hamstring isolation that balances all that quad work. Strong hamstrings protect the knees and improve your squat and deadlift.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Hamstrings'::public.muscle_group,
  ARRAY['Calves']::public.muscle_group[],
  'Machine'::public.equipment_type,
  'Gym',
  true,
  'lunge'::public.animation_key,
  '[{"title":"Setup","detail":"Sit with the pad above your heels and knees aligned to the pivot."},{"title":"Curl","detail":"Curl your heels down and back, squeezing the hamstrings."},{"title":"Pause","detail":"Pause at the peak contraction."},{"title":"Return","detail":"Return slowly to a full stretch."}]'::jsonb,
  ARRAY['Lifting the hips off the seat', 'Using momentum', 'Partial reps']::TEXT[],
  'Exhale as you curl, inhale as you return.',
  '10–15 reps',
  ARRAY['Adjust the pad to sit right above the heels', 'Keep the hips down']::TEXT[],
  ARRAY['Slow the negative to 3 seconds', 'Add drop sets as a finisher']::TEXT[],
  ARRAY['Align the machine pivot with the knee']::TEXT[],
  ARRAY['romanian-deadlift', 'hyperextension']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('leg-curl', 'hamstring curl') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('leg-curl', 'seated leg curl') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('leg-curl', 'leg curl machine') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'lying-leg-curl',
  'Lying Leg Curl',
  'A prone hamstring curl that stretches the muscle at the start of each rep — a slightly different stimulus than the seated version, with more hip-extension bias from the long head.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Hamstrings'::public.muscle_group,
  ARRAY['Calves']::public.muscle_group[],
  'Machine'::public.equipment_type,
  'Gym',
  true,
  'lunge'::public.animation_key,
  '[{"title":"Setup","detail":"Lie face-down with the pad just above your heels and knees just off the bench."},{"title":"Curl","detail":"Curl your heels toward your glutes, squeezing the hamstrings."},{"title":"Pause","detail":"Pause at peak contraction."},{"title":"Return","detail":"Return slowly to a full stretch."}]'::jsonb,
  ARRAY['Lifting the hips off the bench', 'Using momentum', 'Partial reps']::TEXT[],
  'Exhale as you curl, inhale as you return.',
  '10–15 reps',
  ARRAY['Adjust the pad so it sits right above the heels', 'Keep the hips pressed down']::TEXT[],
  ARRAY['Slow the negative to 3 seconds', 'Add single-leg sets to fix imbalances']::TEXT[],
  ARRAY['Align the machine pivot with the knee']::TEXT[],
  ARRAY['leg-curl', 'romanian-deadlift', 'nordic-curl']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('lying-leg-curl', 'lying leg curl') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('lying-leg-curl', 'prone leg curl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'nordic-curl',
  'Nordic Hamstring Curl',
  'The gold standard for hamstring strength and injury prevention. Anchored at the ankles, you lower your torso to the floor against your hamstrings — a brutal eccentric that bulletproofs the knee.',
  'Isolation'::public.exercise_category,
  'Advanced'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Hamstrings'::public.muscle_group,
  ARRAY['Calves']::public.muscle_group[],
  'Bodyweight'::public.equipment_type,
  'Both',
  false,
  'lunge'::public.animation_key,
  '[{"title":"Setup","detail":"Kneel with your ankles anchored, torso tall, hips extended."},{"title":"Lower","detail":"Lower your torso toward the floor as slowly as possible, resisting with the hamstrings."},{"title":"Catch","detail":"Catch yourself with your hands and push back to the start."},{"title":"Repeat","detail":"Keep the hips extended — don''t sit back."}]'::jsonb,
  ARRAY['Folding at the hips', 'Dropping fast and catching with the hands', 'Doing too many reps']::TEXT[],
  'Exhale slowly during the lowering phase.',
  '5–10 slow reps',
  ARRAY['Use a band around the chest for assistance', 'Lower only halfway at first']::TEXT[],
  ARRAY['Increase the range of motion', 'Add a slow eccentric tempo']::TEXT[],
  ARRAY['Stop when form breaks — this movement is very taxing', 'Use a pad under the knees']::TEXT[],
  ARRAY['lying-leg-curl', 'romanian-deadlift', 'good-morning']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('nordic-curl', 'nordic hamstring curl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'good-morning',
  'Good Morning',
  'A barbell hip hinge that loads the hamstrings, glutes and lower back through a deep stretch. An outstanding posterior-chain builder when performed with strict, patient form.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Hamstrings'::public.muscle_group,
  ARRAY['Glutes', 'Back']::public.muscle_group[],
  'Barbell'::public.equipment_type,
  'Gym',
  false,
  'deadlift'::public.animation_key,
  '[{"title":"Setup","detail":"Bar across your upper traps, feet hip-width, knees slightly bent, core braced."},{"title":"Hinge","detail":"Push the hips back, keeping the back flat and the bar over your mid-foot."},{"title":"Stretch","detail":"Lower until you feel a deep hamstring stretch."},{"title":"Drive","detail":"Drive the hips forward to stand tall."}]'::jsonb,
  ARRAY['Rounding the lower back', 'Bending the knees into a squat', 'Going too deep too soon']::TEXT[],
  'Brace before each rep; exhale as you stand.',
  '6–10 reps',
  ARRAY['Master the hinge with the empty bar', 'Keep the bar path over the mid-foot']::TEXT[],
  ARRAY['Add 2.5 kg weekly', 'Slow the lowering to 3 seconds']::TEXT[],
  ARRAY['Never round the spine — drop the weight if you must', 'Use safeties or a spotter']::TEXT[],
  ARRAY['romanian-deadlift', 'hyperextension', 'nordic-curl']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('good-morning', 'goodmorning') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('good-morning', 'barbell good morning') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'calf-raise',
  'Standing Calf Raise',
  'The key to strong, visible calves. Calves respond to heavy loads and full range of motion — a deep stretch at the bottom and a hard squeeze at the top.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Calves'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Machine'::public.equipment_type,
  'Gym',
  true,
  'calf'::public.animation_key,
  '[{"title":"Setup","detail":"Stand with the balls of your feet on the platform, shoulders under the pads."},{"title":"Lower","detail":"Lower your heels until you feel a deep calf stretch."},{"title":"Raise","detail":"Drive up onto your toes as high as possible."},{"title":"Squeeze","detail":"Pause at the top."}]'::jsonb,
  ARRAY['Bouncing at the bottom', 'Partial reps — small range of motion', 'Rushing the movement']::TEXT[],
  'Exhale as you rise, inhale as you lower.',
  '10–20 reps',
  ARRAY['Full range: deep stretch, tall rise', 'Keep the knees slightly bent']::TEXT[],
  ARRAY['Add a 2-second pause at the top', 'Try single-leg raises']::TEXT[],
  ARRAY['Hold the handles — balance first']::TEXT[],
  ARRAY['seated-calf-raise', 'single-leg-calf-raise']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('calf-raise', 'standing calf raise') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('calf-raise', 'calf raise standing') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'seated-calf-raise',
  'Seated Calf Raise',
  'With the knees bent, the seated calf raise targets the soleus — the deeper calf muscle that gives the lower leg thickness. Heavy weight and a deep stretch are the keys.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Calves'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Machine'::public.equipment_type,
  'Gym',
  true,
  'calf'::public.animation_key,
  '[{"title":"Setup","detail":"Sit with the balls of your feet on the platform, knees under the pads."},{"title":"Lower","detail":"Lower your heels until you feel a deep stretch."},{"title":"Raise","detail":"Drive up onto your toes as high as possible."},{"title":"Squeeze","detail":"Pause at the top."}]'::jsonb,
  ARRAY['Bouncing at the bottom', 'Partial reps', 'Letting the pads lift off the knees']::TEXT[],
  'Exhale as you rise, inhale as you lower.',
  '12–20 reps',
  ARRAY['Full range — deep stretch, tall rise', 'Keep the knees stacked under the pads']::TEXT[],
  ARRAY['Pause 2 seconds at the top', 'Add a slow 3-second lowering']::TEXT[],
  ARRAY['Start light to groove the path']::TEXT[],
  ARRAY['calf-raise', 'single-leg-calf-raise', 'leg-press-calf-raise']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('seated-calf-raise', 'seated calf raise machine') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'single-leg-calf-raise',
  'Single-Leg Calf Raise',
  'One leg does all the work — doubling the load on each calf and exposing left-right imbalances. Doable anywhere with a step or a stair.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Calves'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Bodyweight'::public.equipment_type,
  'Both',
  true,
  'calf'::public.animation_key,
  '[{"title":"Setup","detail":"Stand on one foot with the ball on a step, heel hanging off."},{"title":"Lower","detail":"Lower the heel until you feel a deep stretch."},{"title":"Raise","detail":"Drive up onto the toes as high as possible."},{"title":"Squeeze","detail":"Pause at the top."}]'::jsonb,
  ARRAY['Rushing the reps', 'Using momentum', 'Letting the knee bend excessively']::TEXT[],
  'Exhale as you rise, inhale as you lower.',
  '12–20 reps per leg',
  ARRAY['Hold a wall or rail for balance', 'Full range of motion']::TEXT[],
  ARRAY['Hold a dumbbell in one hand', 'Slow the lowering to 3 seconds']::TEXT[],
  ARRAY['Keep the working knee slightly bent', 'Use support until balance is solid']::TEXT[],
  ARRAY['calf-raise', 'seated-calf-raise', 'leg-press-calf-raise']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('single-leg-calf-raise', 'single leg calf raise') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'leg-press-calf-raise',
  'Leg Press Calf Raise',
  'Calf raises on the leg press allow you to load the calves with serious weight in a safe, seated position. A heavy, deep-stretch finisher for stubborn calves.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Calves'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Machine'::public.equipment_type,
  'Gym',
  true,
  'squat'::public.animation_key,
  '[{"title":"Setup","detail":"Sit in the leg press with the balls of your feet on the bottom of the platform."},{"title":"Lower","detail":"Lower the platform by stretching your ankles — heels drop toward you."},{"title":"Raise","detail":"Push the platform away by driving onto your toes."},{"title":"Squeeze","detail":"Pause at the top."}]'::jsonb,
  ARRAY['Using the knees instead of the ankles', 'Partial range', 'Locking the knees at the top']::TEXT[],
  'Exhale as you press, inhale as you lower.',
  '12–20 reps',
  ARRAY['Use a light stack to learn the ankle motion', 'Keep the knees slightly bent']::TEXT[],
  ARRAY['Add weight each session', 'Pause 2 seconds at the top']::TEXT[],
  ARRAY['Never lock the knees at the top of the press']::TEXT[],
  ARRAY['calf-raise', 'seated-calf-raise', 'single-leg-calf-raise']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('leg-press-calf-raise', 'calf press') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('leg-press-calf-raise', 'leg press calf raise') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'lunge',
  'Dumbbell Lunge',
  'A unilateral leg builder that develops balance, hip stability and single-leg strength. Lunges correct imbalances that squats and presses miss.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Quads'::public.muscle_group,
  ARRAY['Glutes', 'Core']::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'lunge'::public.animation_key,
  '[{"title":"Setup","detail":"Stand tall with dumbbells at your sides, feet hip-width."},{"title":"Step","detail":"Step forward and lower until both knees are ~90°."},{"title":"Drive","detail":"Push through the front heel to return to standing."},{"title":"Alternate","detail":"Alternate legs with control."}]'::jsonb,
  ARRAY['The front knee caving inward', 'The back knee slamming the floor', 'Leaning too far forward']::TEXT[],
  'Exhale as you drive up, inhale as you lower.',
  '8–12 reps per leg',
  ARRAY['Take a big enough step — a short step stresses the knee', 'Start with bodyweight']::TEXT[],
  ARRAY['Add dumbbells', 'Try walking lunges or deficit lunges']::TEXT[],
  ARRAY['Keep the front knee tracking over the toes']::TEXT[],
  ARRAY['squat', 'goblet-squat', 'leg-press']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('lunge', 'walking lunge') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('lunge', 'dumbbell lunge') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'front-squat',
  'Front Squat',
  'A squat with the bar racked on the front delts that forces an upright torso — shifting more work onto the quads and core. The movement that makes back squats feel easy by comparison.',
  'Compound'::public.exercise_category,
  'Advanced'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Quads'::public.muscle_group,
  ARRAY['Core', 'Glutes']::public.muscle_group[],
  'Barbell'::public.equipment_type,
  'Gym',
  false,
  'squat'::public.animation_key,
  '[{"title":"Setup","detail":"Rack the bar on your front delts, elbows high, feet shoulder-width."},{"title":"Descend","detail":"Sit straight down, keeping the elbows up and chest tall."},{"title":"Depth","detail":"Descend to at least parallel, knees tracking over toes."},{"title":"Drive","detail":"Drive up through the whole foot to standing."}]'::jsonb,
  ARRAY['Elbows dropping and the bar rolling forward', 'Leaning forward — the torso must stay upright', 'Knees caving inward']::TEXT[],
  'Big breath and brace; exhale at the top.',
  '5–8 reps for strength, 8–12 for size',
  ARRAY['Master the front rack position before adding load', 'Use a cross-arm grip to learn']::TEXT[],
  ARRAY['Add 2.5 kg per session', 'Add paused reps at the bottom']::TEXT[],
  ARRAY['Use safeties or a spotter', 'Let the bar fall forward (never catch it with your wrists) if you fail']::TEXT[],
  ARRAY['squat', 'hack-squat', 'leg-press']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('front-squat', 'front squat barbell') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'hack-squat',
  'Hack Squat',
  'A machine squat on a fixed sled that removes balance while allowing heavy quad loading with a deep range of motion. A leg-day staple for bodybuilders and beginners alike.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Quads'::public.muscle_group,
  ARRAY['Glutes']::public.muscle_group[],
  'Machine'::public.equipment_type,
  'Gym',
  true,
  'squat'::public.animation_key,
  '[{"title":"Setup","detail":"Set your back against the pad, feet shoulder-width on the platform."},{"title":"Lower","detail":"Lower until your thighs are at least parallel, keeping the lower back against the pad."},{"title":"Press","detail":"Drive through the whole foot to extend the legs."},{"title":"Stop","detail":"Stop just short of locking the knees."}]'::jsonb,
  ARRAY['Feet too high or low on the platform', 'Hips tucking at the bottom', 'Locking the knees hard']::TEXT[],
  'Exhale as you press, inhale as you lower.',
  '8–12 reps',
  ARRAY['Feet low = quads, feet high = glutes', 'Keep the hips glued to the pad']::TEXT[],
  ARRAY['Add weight each session', 'Pause at the bottom of the rep']::TEXT[],
  ARRAY['Always use the safety stops', 'Never bounce out of the bottom']::TEXT[],
  ARRAY['squat', 'leg-press', 'front-squat']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('hack-squat', 'hack squat machine') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'bulgarian-split-squat',
  'Bulgarian Split Squat',
  'A rear-foot-elevated split squat that hammers one leg at a time — brutal for the quads, glutes and balance. The single best unilateral leg builder you can do.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Quads'::public.muscle_group,
  ARRAY['Glutes', 'Core']::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  false,
  'lunge'::public.animation_key,
  '[{"title":"Setup","detail":"Stand a stride from a bench, rear foot laced on top, front foot planted."},{"title":"Lower","detail":"Lower straight down until the front thigh is at least parallel."},{"title":"Drive","detail":"Drive through the front heel to stand back up."},{"title":"Finish","detail":"Keep the torso upright — no leaning."}]'::jsonb,
  ARRAY['The front knee caving inward', 'Leaning the torso forward', 'Not going deep enough']::TEXT[],
  'Exhale as you drive up, inhale as you lower.',
  '8–12 reps per leg',
  ARRAY['Start with bodyweight and a short range', 'Find a stable foot position first']::TEXT[],
  ARRAY['Add dumbbells or a barbell', 'Raise the front foot for more range']::TEXT[],
  ARRAY['Keep the front knee tracking over the toes', 'Use a bench you can trust']::TEXT[],
  ARRAY['lunge', 'squat', 'goblet-squat']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'hip-thrust',
  'Barbell Hip Thrust',
  'The most effective glute builder in the gym. The hip thrust trains the glutes through a full hip extension — the movement pattern they exist to perform.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Glutes'::public.muscle_group,
  ARRAY['Hamstrings', 'Core']::public.muscle_group[],
  'Barbell'::public.equipment_type,
  'Gym',
  false,
  'deadlift'::public.animation_key,
  '[{"title":"Setup","detail":"Upper back on a bench, bar over your hips, feet planted shoulder-width."},{"title":"Lower","detail":"Lower your hips toward the floor."},{"title":"Drive","detail":"Drive through your heels to raise your hips until your torso is parallel to the floor."},{"title":"Squeeze","detail":"Squeeze the glutes hard at the top."}]'::jsonb,
  ARRAY['Hyperextending the lower back at the top', 'Feet too far from the body', 'Rushing the movement']::TEXT[],
  'Brace and exhale as you drive up.',
  '8–12 reps',
  ARRAY['Use a pad or folded towel over the hips', 'Tuck the chin — keep the neck neutral']::TEXT[],
  ARRAY['Add 2.5 kg weekly', 'Pause 2 seconds at the top']::TEXT[],
  ARRAY['Drive with the glutes, not the lower back']::TEXT[],
  ARRAY['glute-bridge', 'romanian-deadlift']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'glute-bridge',
  'Glute Bridge',
  'The simplest, safest way to teach the glutes to extend the hip. Floor bridges build the mind-muscle connection you need before graduating to loaded hip thrusts.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Glutes'::public.muscle_group,
  ARRAY['Hamstrings', 'Core']::public.muscle_group[],
  'Bodyweight'::public.equipment_type,
  'Both',
  true,
  'deadlift'::public.animation_key,
  '[{"title":"Setup","detail":"Lie on your back, knees bent, feet flat and hip-width, arms at your sides."},{"title":"Drive","detail":"Drive through your heels to raise your hips until your body forms a straight line."},{"title":"Squeeze","detail":"Squeeze the glutes hard at the top."},{"title":"Lower","detail":"Lower under control."}]'::jsonb,
  ARRAY['Overextending the lower back at the top', 'Feet too close or too far', 'Rushing the reps']::TEXT[],
  'Exhale as you drive up, inhale as you lower.',
  '15–20 reps',
  ARRAY['Start with 3 sets of 15', 'Think “squeeze the glutes, not the back”']::TEXT[],
  ARRAY['Add a band above the knees', 'Progress to single-leg bridges', 'Add weight for hip thrusts']::TEXT[],
  ARRAY['Stop at neutral spine — no arching']::TEXT[],
  ARRAY['hip-thrust', 'cable-kickback', 'donkey-kick']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'cable-kickback',
  'Cable Glute Kickback',
  'An ankle-cuff cable movement that kicks the leg back against resistance — constant tension on the glutes with zero lower-back load. A favorite accessory for glute development.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Glutes'::public.muscle_group,
  ARRAY['Hamstrings']::public.muscle_group[],
  'Cable'::public.equipment_type,
  'Gym',
  true,
  'deadlift'::public.animation_key,
  '[{"title":"Setup","detail":"Attach the cuff to one ankle and face the low pulley."},{"title":"Kick","detail":"Kick the leg back and up, squeezing the glute."},{"title":"Squeeze","detail":"Pause at peak contraction."},{"title":"Return","detail":"Return slowly without letting the stack slam."}]'::jsonb,
  ARRAY['Arching the lower back', 'Swinging the leg with momentum', 'Using the lower back to lift']::TEXT[],
  'Exhale as you kick back, inhale as you return.',
  '12–15 reps per leg',
  ARRAY['Light weight — feel the glute', 'Keep the hips square']::TEXT[],
  ARRAY['Increase the weight gradually', 'Slow the negative to 3 seconds']::TEXT[],
  ARRAY['Keep the core braced to protect the lower back']::TEXT[],
  ARRAY['glute-bridge', 'donkey-kick', 'hip-thrust']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'sumo-deadlift',
  'Sumo Deadlift',
  'A wide-stance deadlift that shifts the emphasis from the lower back to the glutes, adductors and quads. Many lifters find the shorter bar path makes it the strongest pull variation.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Full Body'::public.body_region,
  'Glutes'::public.muscle_group,
  ARRAY['Quads', 'Back']::public.muscle_group[],
  'Barbell'::public.equipment_type,
  'Gym',
  false,
  'deadlift'::public.animation_key,
  '[{"title":"Setup","detail":"Stand wide with toes turned out, shins close to the bar, grip inside the knees."},{"title":"Pull","detail":"Push the floor away, driving the knees out, keeping the chest up."},{"title":"Lock","detail":"Stand tall with hips and knees extended together."},{"title":"Lower","detail":"Hinge the bar down under control."}]'::jsonb,
  ARRAY['Knees caving inward off the floor', 'Rounding the back', 'Jerking the bar']::TEXT[],
  'Big breath and brace at the bottom; exhale at lockout.',
  '3–6 reps for strength',
  ARRAY['Learn the sumo stance with light weight', 'Drive the knees out hard']::TEXT[],
  ARRAY['Add 2.5 kg per session', 'Use straps when grip fails']::TEXT[],
  ARRAY['Never pull with a rounded spine', 'Use a platform or bumper plates']::TEXT[],
  ARRAY['deadlift', 'trap-bar-deadlift', 'hip-thrust']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'donkey-kick',
  'Donkey Kick',
  'A four-point kneeling movement that kicks the heel toward the ceiling — a simple, joint-friendly way to fire the glutes and build the mind-muscle connection.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Legs'::public.movement_pattern,
  'Lower'::public.body_region,
  'Glutes'::public.muscle_group,
  ARRAY['Core']::public.muscle_group[],
  'Bodyweight'::public.equipment_type,
  'Both',
  true,
  'lunge'::public.animation_key,
  '[{"title":"Setup","detail":"Start on all fours, hands under shoulders, knees under hips, spine neutral."},{"title":"Kick","detail":"Drive one heel up toward the ceiling, knee bent 90°, squeezing the glute."},{"title":"Pause","detail":"Pause at the top."},{"title":"Return","detail":"Return to the start under control."}]'::jsonb,
  ARRAY['Arching the lower back', 'Swinging the leg with momentum', 'Rotating the hips open']::TEXT[],
  'Exhale as you kick up, inhale as you return.',
  '15–20 reps per leg',
  ARRAY['Keep the hips square to the floor', 'Small range of motion — feel the glute']::TEXT[],
  ARRAY['Add an ankle weight', 'Slow the lowering to 3 seconds']::TEXT[],
  ARRAY['Keep the neck neutral']::TEXT[],
  ARRAY['glute-bridge', 'cable-kickback', 'hip-thrust']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'plank',
  'Plank',
  'The gold standard of core stability. The plank trains the entire trunk to resist extension — the foundation of heavy squats, deadlifts and presses.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Core'::public.movement_pattern,
  'Core'::public.body_region,
  'Core'::public.muscle_group,
  ARRAY['Shoulders']::public.muscle_group[],
  'Bodyweight'::public.equipment_type,
  'Both',
  true,
  'plank'::public.animation_key,
  '[{"title":"Setup","detail":"Forearms on the floor, elbows under shoulders, body in a straight line."},{"title":"Brace","detail":"Squeeze the glutes and brace the abs — no sagging hips."},{"title":"Hold","detail":"Hold with steady breathing, neck neutral."},{"title":"Finish","detail":"Lower your knees to finish — never arch the back."}]'::jsonb,
  ARRAY['Hips sagging toward the floor', 'Hips piking up high', 'Holding your breath']::TEXT[],
  'Breathe steadily throughout the hold.',
  '30–90 second holds',
  ARRAY['Start with 3 × 30 seconds', 'Keep a straight line from head to heels']::TEXT[],
  ARRAY['Add time or sets', 'Progress to side planks and weighted planks']::TEXT[],
  ARRAY['Stop if the lower back aches — reset your position']::TEXT[],
  ARRAY['crunch', 'russian-twist', 'hanging-raise']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'crunch',
  'Cable Crunch',
  'A weighted crunch that builds visible abs. The cable adds load to the spinal flexion pattern so the abs can grow like any other muscle.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Core'::public.movement_pattern,
  'Core'::public.body_region,
  'Core'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Cable'::public.equipment_type,
  'Gym',
  true,
  'crunch'::public.animation_key,
  '[{"title":"Setup","detail":"Kneel below a rope attachment, hands beside your head."},{"title":"Crunch","detail":"Crunch down, curling your ribs toward your hips."},{"title":"Squeeze","detail":"Squeeze the abs at the bottom."},{"title":"Return","detail":"Return slowly, resisting the cable."}]'::jsonb,
  ARRAY['Pulling with the arms', 'Using the hips instead of the abs', 'Fast, sloppy reps']::TEXT[],
  'Exhale as you crunch, inhale as you return.',
  '12–20 reps',
  ARRAY['Keep the hips still — only the spine curls', 'Light weight, controlled reps']::TEXT[],
  ARRAY['Add weight', 'Slow the negative to 3 seconds']::TEXT[],
  ARRAY['No neck pulling — hands lightly behind the head']::TEXT[],
  ARRAY['plank', 'russian-twist', 'hanging-raise']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'russian-twist',
  'Russian Twist',
  'A rotational core exercise that strengthens the obliques — the muscles that stabilize rotation in every sport and daily movement.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Core'::public.movement_pattern,
  'Core'::public.body_region,
  'Core'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Dumbbell'::public.equipment_type,
  'Both',
  true,
  'crunch'::public.animation_key,
  '[{"title":"Setup","detail":"Sit with knees bent, lean back slightly, hold a weight at your chest."},{"title":"Twist","detail":"Rotate your torso to one side, bringing the weight beside your hip."},{"title":"Rotate","detail":"Rotate to the other side with control."},{"title":"Repeat","detail":"Keep the chest tall the whole time."}]'::jsonb,
  ARRAY['Swinging the arms instead of rotating the torso', 'Rounding the back', 'Going too fast']::TEXT[],
  'Exhale with each twist.',
  '12–20 reps per side',
  ARRAY['Start with bodyweight', 'Feet on the floor first, lift them later']::TEXT[],
  ARRAY['Add weight', 'Slow the tempo']::TEXT[],
  ARRAY['Keep the spine tall — no slumping']::TEXT[],
  ARRAY['plank', 'crunch', 'hanging-raise']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'hanging-leg-raise',
  'Hanging Leg Raise',
  'Hanging from a bar, you raise your legs without swinging — one of the hardest and most effective lower-ab builders there is, loading the core through full hip flexion.',
  'Isolation'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Core'::public.movement_pattern,
  'Core'::public.body_region,
  'Core'::public.muscle_group,
  ARRAY['Shoulders', 'Forearms']::public.muscle_group[],
  'Bodyweight'::public.equipment_type,
  'Both',
  false,
  'crunch'::public.animation_key,
  '[{"title":"Hang","detail":"Hang from a bar with a firm grip, shoulders away from the ears, legs straight."},{"title":"Raise","detail":"Raise your legs to hip height or higher without swinging."},{"title":"Pause","detail":"Pause briefly at the top."},{"title":"Lower","detail":"Lower slowly to a full hang."}]'::jsonb,
  ARRAY['Swinging the legs for momentum', 'Raising with bent hips instead of the abs', 'Letting the shoulders take over']::TEXT[],
  'Exhale as you raise, inhale as you lower.',
  '8–15 reps',
  ARRAY['Start with knee raises or lying leg raises', 'Keep the scapulas pulled down']::TEXT[],
  ARRAY['Straighten the legs', 'Add a slow lowering phase', 'Add ankle weights']::TEXT[],
  ARRAY['Warm up the shoulders and grip', 'Stop if the lower back aches']::TEXT[],
  ARRAY['crunch', 'dead-bug', 'bicycle-crunch']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'side-plank',
  'Side Plank',
  'The lateral core stabilizer — side planks build the obliques and quadratus lumborum that protect the spine during rotation and side-loading. The perfect partner to the front plank.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Core'::public.movement_pattern,
  'Core'::public.body_region,
  'Core'::public.muscle_group,
  ARRAY['Shoulders']::public.muscle_group[],
  'Bodyweight'::public.equipment_type,
  'Both',
  true,
  'plank'::public.animation_key,
  '[{"title":"Setup","detail":"Lie on your side with your elbow under your shoulder and legs stacked."},{"title":"Lift","detail":"Lift your hips so your body forms a straight line from head to heels."},{"title":"Hold","detail":"Hold with the core braced and hips square."},{"title":"Finish","detail":"Lower with control and switch sides."}]'::jsonb,
  ARRAY['Hips sagging or rolling forward', 'Piking the hips up', 'Holding the breath']::TEXT[],
  'Breathe steadily throughout the hold.',
  '20–45 second holds per side',
  ARRAY['Start with knees bent for support', 'Keep the elbow directly under the shoulder']::TEXT[],
  ARRAY['Add time', 'Lift the top leg for an added challenge']::TEXT[],
  ARRAY['Stop if the shoulder or hip aches']::TEXT[],
  ARRAY['plank', 'russian-twist', 'ab-wheel-rollout']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'ab-wheel-rollout',
  'Ab Wheel Rollout',
  'Roll out and the abs fight to keep your spine from collapsing — one of the hardest core exercises ever devised. Nothing teaches anti-extension like the wheel.',
  'Isolation'::public.exercise_category,
  'Advanced'::public.difficulty_level,
  'Core'::public.movement_pattern,
  'Core'::public.body_region,
  'Core'::public.muscle_group,
  ARRAY['Shoulders', 'Back']::public.muscle_group[],
  'Bodyweight'::public.equipment_type,
  'Both',
  false,
  'plank'::public.animation_key,
  '[{"title":"Setup","detail":"Kneel with the wheel under your shoulders, core braced, glutes squeezed."},{"title":"Roll","detail":"Roll the wheel forward, keeping your hips extended and back flat."},{"title":"Stretch","detail":"Go as far as you can hold a neutral spine."},{"title":"Return","detail":"Pull the wheel back with the abs."}]'::jsonb,
  ARRAY['Letting the hips drop or the back arch', 'Rolling too far too soon', 'Using the arms instead of the core']::TEXT[],
  'Exhale as you roll back in, inhale as you roll out.',
  '6–12 reps',
  ARRAY['Use a wall to limit the range', 'Start from an incline if kneeling is too hard']::TEXT[],
  ARRAY['Increase the roll-out distance', 'Add slow eccentric tempo']::TEXT[],
  ARRAY['Stop the rep the moment the back arches']::TEXT[],
  ARRAY['plank', 'dead-bug', 'hanging-leg-raise']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'dead-bug',
  'Dead Bug',
  'A deceptively simple anti-extension exercise: lying on your back, you lower opposite arm and leg while keeping the lower back pressed to the floor. Rehab gold for the core.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Core'::public.movement_pattern,
  'Core'::public.body_region,
  'Core'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Bodyweight'::public.equipment_type,
  'Both',
  true,
  'crunch'::public.animation_key,
  '[{"title":"Setup","detail":"Lie on your back, arms pointing up, knees bent at 90° over your hips."},{"title":"Extend","detail":"Lower your right arm and left leg toward the floor together."},{"title":"Hold","detail":"Hold just above the floor, keeping the lower back down."},{"title":"Return","detail":"Return to the start and switch sides."}]'::jsonb,
  ARRAY['The lower back arching off the floor', 'Rushing the movement', 'Holding the breath']::TEXT[],
  'Exhale as you extend, inhale as you return.',
  '8–12 reps per side',
  ARRAY['Shorten the range until the back stays flat', 'Move slowly']::TEXT[],
  ARRAY['Straighten the legs further', 'Add ankle weights']::TEXT[],
  ARRAY['Press the lower back into the floor the whole time']::TEXT[],
  ARRAY['plank', 'hanging-leg-raise', 'bicycle-crunch']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'mountain-climber',
  'Mountain Climber',
  'A plank with running knees — the core holds a rigid bridge while your legs drive, spiking the heart rate. A conditioning staple that doubles as core work.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Core'::public.movement_pattern,
  'Full Body'::public.body_region,
  'Core'::public.muscle_group,
  ARRAY['Shoulders', 'Cardio']::public.muscle_group[],
  'Bodyweight'::public.equipment_type,
  'Both',
  true,
  'run'::public.animation_key,
  '[{"title":"Setup","detail":"Start in a high plank, hands under shoulders, body in a straight line."},{"title":"Drive","detail":"Drive one knee toward your chest, then switch quickly."},{"title":"Keep","detail":"Keep the hips low and the core braced — no bouncing."},{"title":"Finish","detail":"Maintain a steady rhythm."}]'::jsonb,
  ARRAY['Hips rising as you get tired', 'Hands too far forward', 'Arching the lower back']::TEXT[],
  'Breathe rhythmically with the movement.',
  '30–60 seconds',
  ARRAY['Slow the pace until form is solid', 'Keep the hips level']::TEXT[],
  ARRAY['Speed up the cadence', 'Add a push-up between switches']::TEXT[],
  ARRAY['Warm up the wrists', 'Stop if the lower back sags']::TEXT[],
  ARRAY['plank', 'burpees', 'treadmill-run']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('mountain-climber', 'mountain climber') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'bicycle-crunch',
  'Bicycle Crunch',
  'The top-rated ab exercise in many studies — a rotating crunch that lights up the obliques and upper abs together. Slow, twisting reps beat fast, sloppy ones.',
  'Isolation'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Core'::public.movement_pattern,
  'Core'::public.body_region,
  'Core'::public.muscle_group,
  ARRAY[]::public.muscle_group[],
  'Bodyweight'::public.equipment_type,
  'Both',
  true,
  'crunch'::public.animation_key,
  '[{"title":"Setup","detail":"Lie on your back, hands lightly behind your head, legs lifted."},{"title":"Twist","detail":"Bring one elbow toward the opposite knee while the other leg extends."},{"title":"Rotate","detail":"Switch sides in a slow, pedaling motion."},{"title":"Repeat","detail":"Keep the lower back pressed down."}]'::jsonb,
  ARRAY['Pulling on the neck', 'Moving too fast', 'Letting the lower back arch']::TEXT[],
  'Exhale with each twist.',
  '12–20 reps per side',
  ARRAY['Keep the feet closer to the floor for less leverage', 'Hands stay loose behind the head']::TEXT[],
  ARRAY['Slow the tempo', 'Add an ankle weight']::TEXT[],
  ARRAY['Never yank the neck with your hands']::TEXT[],
  ARRAY['crunch', 'russian-twist', 'hanging-leg-raise']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'treadmill-run',
  'Treadmill Run',
  'Classic cardiovascular conditioning. Track distance and duration to build endurance, burn calories and support recovery between heavy lifting sessions.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Cardio'::public.movement_pattern,
  'Full Body'::public.body_region,
  'Cardio'::public.muscle_group,
  ARRAY['Quads', 'Hamstrings']::public.muscle_group[],
  'Cardio'::public.equipment_type,
  'Gym',
  true,
  'run'::public.animation_key,
  '[{"title":"Warm up","detail":"Walk for 3–5 minutes to raise the heart rate."},{"title":"Set pace","detail":"Build to a challenging-but-holdable pace."},{"title":"Maintain","detail":"Hold form: tall posture, light foot strike."},{"title":"Cool down","detail":"Walk down for 3 minutes."}]'::jsonb,
  ARRAY['Starting too fast', 'Holding the handrails', 'Looking down at the display']::TEXT[],
  'Breathe rhythmically — 3 steps in, 2 steps out.',
  '20–45 minute sessions',
  ARRAY['Use the interval setting to mix walk/run', 'Stay at a pace you can speak in short sentences']::TEXT[],
  ARRAY['Add 5 minutes per week', 'Try incline intervals']::TEXT[],
  ARRAY['Use the safety clip', 'Land softly — no heel-striking']::TEXT[],
  ARRAY['cycling', 'rower', 'stair-climber']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('treadmill-run', 'treadmill') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('treadmill-run', 'treadmill running') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'cycling',
  'Stationary Bike',
  'Low-impact cardio that spares the joints while delivering serious conditioning. Ideal for recovery days and for adding volume without taxing the knees.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Cardio'::public.movement_pattern,
  'Lower'::public.body_region,
  'Cardio'::public.muscle_group,
  ARRAY['Quads', 'Hamstrings']::public.muscle_group[],
  'Cardio'::public.equipment_type,
  'Both',
  true,
  'run'::public.animation_key,
  '[{"title":"Setup","detail":"Adjust the seat so the knee is slightly bent at the bottom of the pedal stroke."},{"title":"Spin","detail":"Pedal with smooth, round strokes — push and pull."},{"title":"Resistance","detail":"Find a resistance you can hold at 80–100 rpm."},{"title":"Finish","detail":"Spin easy for the final minutes."}]'::jsonb,
  ARRAY['Seat too low — knee pain', 'Mashing hard gears at low cadence', 'Hunched posture']::TEXT[],
  'Steady rhythmic breathing throughout.',
  '20–60 minute sessions',
  ARRAY['Start with 15–20 minutes', 'Keep the cadence smooth']::TEXT[],
  ARRAY['Add interval sprints', 'Increase session length']::TEXT[],
  ARRAY['Set the seat height before starting']::TEXT[],
  ARRAY['treadmill-run', 'rower', 'stair-climber']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('cycling', 'stationary bike') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('cycling', 'exercise bike') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('cycling', 'bike') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'rower',
  'Rowing Machine',
  'A full-body cardio machine that hits the legs, back and arms while elevating the heart rate. Rowing is the closest thing to a total-body workout on cardio equipment.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Cardio'::public.movement_pattern,
  'Full Body'::public.body_region,
  'Back'::public.muscle_group,
  ARRAY['Quads', 'Hamstrings', 'Cardio']::public.muscle_group[],
  'Cardio'::public.equipment_type,
  'Gym',
  true,
  'row'::public.animation_key,
  '[{"title":"Catch","detail":"Legs compressed, arms straight, torso leaned forward."},{"title":"Drive","detail":"Push with the legs first, then swing the torso, then pull with the arms."},{"title":"Finish","detail":"Legs extended, slight lean back, handle at the ribs."},{"title":"Return","detail":"Reverse the sequence: arms, torso, legs."}]'::jsonb,
  ARRAY['Pulling with the arms first', 'Slouching the shoulders', 'Rowing too fast and losing form']::TEXT[],
  'Exhale on the drive, inhale on the return.',
  '10–30 minute sessions',
  ARRAY['Learn the sequence slowly: legs, body, arms', 'Keep the back flat']::TEXT[],
  ARRAY['Try 500 m intervals', 'Use the drag setting to match your strength']::TEXT[],
  ARRAY['Keep the core braced — no rounded back']::TEXT[],
  ARRAY['treadmill-run', 'cycling', 'stair-climber']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('rower', 'rowing machine') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('rower', 'erg') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('rower', 'rowing') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'stair-climber',
  'Stair Climber',
  'A machine that never lies — every step is a weighted single-leg step-up. Stair climbing builds serious lower-body endurance and glute burn without any impact.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Cardio'::public.movement_pattern,
  'Lower'::public.body_region,
  'Cardio'::public.muscle_group,
  ARRAY['Quads', 'Glutes', 'Calves']::public.muscle_group[],
  'Cardio'::public.equipment_type,
  'Gym',
  true,
  'run'::public.animation_key,
  '[{"title":"Setup","detail":"Step on with upright posture, hands lightly on the rails."},{"title":"Climb","detail":"Step with full foot strikes — don''t bounce on your toes."},{"title":"Pace","detail":"Hold a steady pace you can maintain."},{"title":"Finish","detail":"Cool down by slowing the machine before stepping off."}]'::jsonb,
  ARRAY['Leaning on the handrails', 'Taking tiny, quick steps', 'Hunched posture']::TEXT[],
  'Breathe rhythmically — 3 steps in, 2 steps out.',
  '15–40 minute sessions',
  ARRAY['Start at a slow speed for 10 minutes', 'Use the rails only for balance']::TEXT[],
  ARRAY['Increase speed or time', 'Add intervals: 1 minute fast, 1 minute slow']::TEXT[],
  ARRAY['Step off carefully — the steps keep moving', 'Keep the chest tall']::TEXT[],
  ARRAY['treadmill-run', 'cycling', 'elliptical']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('stair-climber', 'stairmaster') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('stair-climber', 'stair machine') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'elliptical',
  'Elliptical Trainer',
  'Smooth, low-impact cardio that moves the legs in a gliding ellipse — gentle on the knees while still delivering a real conditioning stimulus. Great for recovery days.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Cardio'::public.movement_pattern,
  'Full Body'::public.body_region,
  'Cardio'::public.muscle_group,
  ARRAY['Quads', 'Hamstrings']::public.muscle_group[],
  'Cardio'::public.equipment_type,
  'Both',
  true,
  'run'::public.animation_key,
  '[{"title":"Setup","detail":"Step on and grip the moving handles for a full-body stroke."},{"title":"Glide","detail":"Push and pull in a smooth, circular motion."},{"title":"Resistance","detail":"Find a resistance you can hold at a steady cadence."},{"title":"Finish","detail":"Slow the machine for the final minutes."}]'::jsonb,
  ARRAY['Hunched posture', 'Resting all the weight on the handles', 'Mashing high resistance at low cadence']::TEXT[],
  'Steady rhythmic breathing throughout.',
  '20–45 minute sessions',
  ARRAY['Start with 15–20 minutes', 'Keep the motion smooth and even']::TEXT[],
  ARRAY['Add resistance or interval sprints', 'Increase session length']::TEXT[],
  ARRAY['Step on and off only when the machine is stopped']::TEXT[],
  ARRAY['treadmill-run', 'cycling', 'stair-climber']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'jump-rope',
  'Jump Rope',
  'The most portable cardio on the planet — a jump rope delivers an elite conditioning workout in minutes, building calf strength, rhythm and coordination.',
  'Compound'::public.exercise_category,
  'Beginner'::public.difficulty_level,
  'Cardio'::public.movement_pattern,
  'Full Body'::public.body_region,
  'Cardio'::public.muscle_group,
  ARRAY['Calves', 'Shoulders']::public.muscle_group[],
  'Bodyweight'::public.equipment_type,
  'Both',
  true,
  'run'::public.animation_key,
  '[{"title":"Setup","detail":"Hold the handles at hip height with a slight elbow bend."},{"title":"Jump","detail":"Jump softly on the balls of your feet, just enough to clear the rope."},{"title":"Rhythm","detail":"Spin the rope from the wrists, not the shoulders."},{"title":"Pace","detail":"Keep a steady, small jump — land quietly."}]'::jsonb,
  ARRAY['Jumping too high', 'Spinning from the shoulders', 'Landing on flat feet']::TEXT[],
  'Breathe rhythmically with your jumps.',
  '5–20 minute intervals',
  ARRAY['Learn the basic bounce first', 'Start with 30-second rounds']::TEXT[],
  ARRAY['Add double-unders', 'Try interval rounds: 30s fast, 30s slow']::TEXT[],
  ARRAY['Jump on a forgiving surface', 'Wear supportive shoes']::TEXT[],
  ARRAY['treadmill-run', 'burpees', 'cycling']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('jump-rope', 'skipping') ON CONFLICT DO NOTHING;
INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('jump-rope', 'skipping rope') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'burpees',
  'Burpee',
  'The total-body conditioning movement — squat, plank, push-up, jump. Nothing builds work capacity faster, and nothing humbles you more reliably.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Cardio'::public.movement_pattern,
  'Full Body'::public.body_region,
  'Cardio'::public.muscle_group,
  ARRAY['Chest', 'Quads', 'Core']::public.muscle_group[],
  'Bodyweight'::public.equipment_type,
  'Both',
  false,
  'run'::public.animation_key,
  '[{"title":"Squat","detail":"Drop into a squat and place your hands on the floor."},{"title":"Plank","detail":"Kick your feet back into a plank."},{"title":"Push","detail":"Perform a push-up (or lower your chest to the floor)."},{"title":"Jump","detail":"Jump your feet back in and explode upward."}]'::jsonb,
  ARRAY['Sagging hips in the plank', 'Partial push-ups', 'Slow, broken transitions']::TEXT[],
  'Exhale on the jump, inhale on the descent.',
  '8–20 reps',
  ARRAY['Step back instead of jumping', 'Skip the push-up until you''re ready']::TEXT[],
  ARRAY['Increase speed or reps', 'Add a tuck jump at the top']::TEXT[],
  ARRAY['Warm up the wrists and shoulders', 'Stop if you lose form']::TEXT[],
  ARRAY['jump-rope', 'mountain-climber', 'treadmill-run']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('burpees', 'burpee') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES (
  'battle-ropes',
  'Battle Ropes',
  'Heavy ropes slammed in waves build conditioning, grip and upper-body endurance simultaneously. Short, intense rounds are the name of the game.',
  'Compound'::public.exercise_category,
  'Intermediate'::public.difficulty_level,
  'Cardio'::public.movement_pattern,
  'Full Body'::public.body_region,
  'Cardio'::public.muscle_group,
  ARRAY['Shoulders', 'Back', 'Core']::public.muscle_group[],
  'Cardio'::public.equipment_type,
  'Gym',
  false,
  'run'::public.animation_key,
  '[{"title":"Setup","detail":"Stand with feet shoulder-width, knees soft, grip one rope end in each hand."},{"title":"Wave","detail":"Alternate arms fast to send waves down the ropes."},{"title":"Drive","detail":"Generate power from the legs and core, not just the arms."},{"title":"Finish","detail":"Keep the chest tall and shoulders relaxed."}]'::jsonb,
  ARRAY['Stiff straight legs', 'Hunching the shoulders', 'Letting the waves die out']::TEXT[],
  'Exhale with each slam, breathe rhythmically.',
  '20–45 second rounds',
  ARRAY['Use a lighter rope and shorter rounds', 'Anchor your feet before starting']::TEXT[],
  ARRAY['Increase round length or intensity', 'Try alternating wave patterns']::TEXT[],
  ARRAY['Warm up the shoulders', 'Stop if the grip or shoulders fatigue hard']::TEXT[],
  ARRAY['burpees', 'rower', 'jump-rope']::TEXT[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('battle-ropes', 'battle rope') ON CONFLICT DO NOTHING;

