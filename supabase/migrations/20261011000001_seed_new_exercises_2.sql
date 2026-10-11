-- ============================================================
-- Migration: seed 21 exercises onboarded 2026-10-11
-- (overhead press, curl, hinge, push-up, pull-up, lunge, core staples)
--
-- The app catalog (src/data/exercises.ts) gained these exercises with
-- bundled videos in assets/vital/. Because
-- public.workout_plan_exercises.exercise_id REFERENCES public.exercises(id),
-- pushing a plan that contains one of these exercises fails the child insert
-- unless each id is seeded here.
--
-- Auto-generated from src/data/exercises.ts
-- ============================================================

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('barbell-overhead-press',
    'Standing Barbell Overhead Press',
    'The king of upper-body pressing. Pressing a barbell overhead from a standing position builds the entire shoulder girdle plus triceps and trunk stability — no other lift loads the delts as heavily through a full range.',
    'Compound',
    'Intermediate',
    'Push',
    'Upper',
    'Shoulders',
    ARRAY['Triceps', 'Core']::public.muscle_group[],
    'Barbell',
    'Gym',
    false,
    'press',
    E'[{"title":"Setup","detail":"Unrack the bar at collarbone height with a grip just outside the shoulders. Squeeze your glutes, brace your core, and tuck your ribs down."},{"title":"Press","detail":"Drive the bar straight up. As it clears your forehead, push your head slightly through so the bar finishes over mid-foot."},{"title":"Lockout","detail":"Lock your elbows fully with biceps roughly by your ears — do not shrug."},{"title":"Lower","detail":"Bring the bar back down to the collarbone under control before the next rep."}]'::jsonb,
    ARRAY['Leaning back excessively, turning it into an incline press', 'Stopping reps at forehead height', 'Loose glutes letting the lower back overarch', 'Flaring elbows wide on the way up'],
    'Take a big braced breath at the collarbone, exhale through the sticking point.',
    '5–8 reps for strength, 8–12 for size',
    ARRAY['Start with an empty bar to groove the vertical bar path', 'Squeeze your glutes hard before every single rep', 'Keep the bar close — it should nearly graze your nose'],
    ARRAY['Add 2.5 kg per session while reps stay clean', 'Add paused reps at forehead height to kill the sticking point', 'Build volume with seated dumbbell pressing'],
    ARRAY['Never press behind the neck', 'Use a rack with safeties for heavy attempts', 'Stop if you feel a sharp pinch at the top of the shoulder'],
    ARRAY['shoulder-press', 'machine-shoulder-press', 'arnold-press', 'landmine-press'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-overhead-press', 'overhead press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-overhead-press', 'ohp') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-overhead-press', 'military press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-overhead-press', 'barbell shoulder press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-overhead-press', 'standing overhead press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-overhead-press', 'strict press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-overhead-press', 'barbell overhead press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('barbell-curl',
    'Barbell Curl',
    'The classic mass builder for the biceps. A straight or EZ bar lets both arms load heavy together with the wrists locked in, making it the curl variation most lifters track as their strength number.',
    'Isolation',
    'Beginner',
    'Pull',
    'Upper',
    'Biceps',
    ARRAY['Forearms']::public.muscle_group[],
    'Barbell',
    'Gym',
    true,
    'curl',
    E'[{"title":"Setup","detail":"Stand tall gripping the bar underhand at shoulder width, elbows pinned to your ribs."},{"title":"Curl","detail":"Contract your biceps to curl the bar up toward your chest without moving your upper arms."},{"title":"Squeeze","detail":"Pause and squeeze hard at the top for a full second."},{"title":"Lower","detail":"Lower the bar over 2–3 seconds to a full stretch — no dropping."}]'::jsonb,
    ARRAY['Swinging the hips to throw the weight up', 'Letting elbows drift forward past the ribs', 'Cutting the bottom half of the range', 'Bending wrists back under the load'],
    'Exhale as you curl up, inhale as you lower.',
    '8–12 reps',
    ARRAY['Start with an empty bar or EZ bar to spare the wrists', 'Stand against a wall to kill any swing habit'],
    ARRAY['Add 2.5 kg once you hit 12 strict reps', 'Add a 3-second negative on the final set'],
    ARRAY['Keep wrists straight — switch to an EZ bar if straight-bar curls ache', 'Do not use back swing to move weight your biceps cannot handle'],
    ARRAY['bicep-curl', 'hammer-curl', 'cable-curl', 'preacher-curl'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-curl', 'barbell curl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-curl', 'bb curl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-curl', 'straight bar curl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-curl', 'standing barbell curl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('barbell-curl', 'ez bar curl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('trap-bar-deadlift',
    'Trap Bar Deadlift',
    'A deadlift performed inside a hexagonal trap bar with a neutral grip. The load stays centered through your body instead of out front, so the quads drive harder and the lower back takes less shear — the friendliest way to pull heavy.',
    'Compound',
    'Intermediate',
    'Legs',
    'Full Body',
    'Back',
    ARRAY['Quads', 'Glutes', 'Hamstrings']::public.muscle_group[],
    'Barbell',
    'Gym',
    false,
    'deadlift',
    E'[{"title":"Setup","detail":"Stand centered inside the trap bar with feet hip-width, shins close to the front rail. Hinge down and grip the handles."},{"title":"Brace","detail":"Set your chest tall, pull the slack out of the bar, and brace your trunk hard."},{"title":"Drive","detail":"Push the floor away, extending knees and hips together — think leg press, not back pull."},{"title":"Lockout","detail":"Stand fully tall with glutes squeezed. Lower by hinging back down with control."}]'::jsonb,
    ARRAY['Rounding the lower back off the floor', 'Letting the hips shoot up before the chest', 'Shrugging the weight at lockout', 'Bouncing reps off the floor'],
    'Take a big braced breath at the bottom, exhale at lockout.',
    '3–6 reps for strength, 6–10 for size',
    ARRAY['Learn the hip hinge with Romanian deadlifts first', 'Use the high handles until mobility allows the low ones'],
    ARRAY['Add 5 kg per session while form stays rigid', 'Work low-handle pulls for extra leg drive'],
    ARRAY['Keep the spine neutral — the trap bar forgives, but not that much', 'Use collars; plates slide on the raised sleeves'],
    ARRAY['deadlift', 'sumo-deadlift', 'romanian-deadlift'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('trap-bar-deadlift', 'hex bar deadlift') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('trap-bar-deadlift', 'trap bar deadlift') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('trap-bar-deadlift', 'trap bar dead lift') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('trap-bar-deadlift', 'hexbar deadlift') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('trap-bar-deadlift', 'trapbar deadlift') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('pike-push-up',
    'Pike Push-Up',
    'A bodyweight overhead press: hips piked high, you lower the crown of your head toward the floor. It loads the front and side delts with zero equipment and is the direct stepping stone to handstand push-ups.',
    'Compound',
    'Intermediate',
    'Push',
    'Upper',
    'Shoulders',
    ARRAY['Triceps', 'Chest', 'Core']::public.muscle_group[],
    'Bodyweight',
    'Both',
    false,
    'press',
    E'[{"title":"Setup","detail":"From a push-up position, walk your feet toward your hands and lift your hips high until your body forms an inverted V."},{"title":"Lower","detail":"Bend your elbows to lower the top of your head toward the floor between your hands."},{"title":"Touch","detail":"Descend until your head nearly touches, keeping elbows tracking back rather than flaring wide."},{"title":"Press","detail":"Drive back up to straight arms, pushing the floor away."}]'::jsonb,
    ARRAY['Hips sagging into a regular push-up', 'Flaring elbows to 90°', 'Half reps that stop well short of the floor'],
    'Inhale lowering down, exhale pressing back up.',
    '6–12 reps',
    ARRAY['Elevate your feet on a box to increase the shoulder angle gradually', 'Build a 60-second plank first for the core demand'],
    ARRAY['Raise the feet higher to load the shoulders more', 'Work toward wall-assisted handstand push-ups'],
    ARRAY['Warm up the wrists and shoulders first', 'Stop if blood pressure spikes cause dizziness — breathe continuously'],
    ARRAY['shoulder-press', 'push-up', 'diamond-push-up'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('pike-push-up', 'pike pushup') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('pike-push-up', 'pike push ups') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('pike-push-up', 'pike press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('incline-push-up',
    'Incline Push-Up',
    'A push-up with hands elevated on a bench, box, or wall. Raising the hands unloads the movement, making it the perfect first step toward full push-ups while building the same chest, shoulder, and triceps strength.',
    'Compound',
    'Beginner',
    'Push',
    'Upper',
    'Chest',
    ARRAY['Triceps', 'Shoulders']::public.muscle_group[],
    'Bodyweight',
    'Both',
    true,
    'bench',
    E'[{"title":"Setup","detail":"Place your hands on a sturdy elevated surface slightly wider than shoulder width and walk your feet back into a straight plank line."},{"title":"Lower","detail":"Bend your elbows to lower your chest toward the surface, keeping your body rigid from head to heels."},{"title":"Press","detail":"Push through your palms until your arms are straight, without letting the hips sag or pike."},{"title":"Repeat","detail":"Lower with control — the negative builds as much strength as the press."}]'::jsonb,
    ARRAY['Sagging hips in the middle', 'Half reps that stop well above the surface', 'Flaring elbows to 90°'],
    'Inhale as you lower, exhale as you press up.',
    '8–15 reps',
    ARRAY['Start with a high surface like a wall or countertop', 'Lower the surface height as you get stronger until you reach the floor'],
    ARRAY['Reduce the incline step by step', 'Add a 2-second pause at the bottom of each rep'],
    ARRAY['Check the surface is stable before loading it', 'Keep wrists stacked under shoulders'],
    ARRAY['push-up', 'diamond-push-up', 'dips'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('incline-push-up', 'incline pushup') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('incline-push-up', 'incline push ups') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('incline-push-up', 'elevated push up') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('incline-push-up', 'hands elevated push up') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('negative-pull-up',
    'Negative Pull-Up',
    'An eccentric-only pull-up: jump or step to the top, then lower yourself as slowly as possible. Negatives build the exact back and arm strength needed for a first full pull-up faster than any other drill.',
    'Compound',
    'Beginner',
    'Pull',
    'Upper',
    'Back',
    ARRAY['Biceps', 'Forearms']::public.muscle_group[],
    'Bodyweight',
    'Both',
    true,
    'pulldown',
    E'[{"title":"Start at the top","detail":"Stand on a box or jump so your chin starts above the bar with an overhand grip."},{"title":"Lower slowly","detail":"Take 3–5 full seconds to lower yourself until your arms are completely straight."},{"title":"Control the bottom","detail":"Do not drop the last few inches — stay tight all the way to a dead hang."},{"title":"Reset","detail":"Step back up and repeat. Stop the set when you can no longer slow the descent."}]'::jsonb,
    ARRAY['Dropping fast through the bottom half', 'Shrugging up into the ears at the start', 'Kipping the legs for momentum'],
    'Inhale at the top, exhale slowly through the descent.',
    '3–5 slow negatives',
    ARRAY['Use a sturdy box so every rep starts from the top', 'Aim to add one second to the descent each week'],
    ARRAY['Extend the lowering phase toward 8–10 seconds', 'Move to band-assisted full pull-ups, then strict reps'],
    ARRAY['Warm up the shoulders and elbows first', 'Stop if the elbows or shoulders ache sharply'],
    ARRAY['pull-up', 'chin-up', 'assisted-pullup'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('negative-pull-up', 'negative pullup') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('negative-pull-up', 'negative pull ups') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('negative-pull-up', 'eccentric pull up') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('negative-pull-up', 'jumping pull up') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('dumbbell-step-up',
    'Dumbbell Step-Up',
    'A single-leg strength staple: drive up onto a box holding dumbbells. Each leg works independently with minimal spinal loading, building balanced quads and glutes plus real-world single-leg stability.',
    'Compound',
    'Beginner',
    'Legs',
    'Lower',
    'Quads',
    ARRAY['Glutes', 'Core']::public.muscle_group[],
    'Dumbbell',
    'Both',
    true,
    'lunge',
    E'[{"title":"Setup","detail":"Hold dumbbells at your sides facing a knee-high box or bench. Place one full foot on top."},{"title":"Drive","detail":"Push through the heel of the top foot to stand tall on the box, bringing the trailing foot up beside it."},{"title":"Control","detail":"Pause briefly at the top without pushing off the trailing leg."},{"title":"Lower","detail":"Step back down with control, alternating legs or finishing all reps on one side first."}]'::jsonb,
    ARRAY['Pushing off the bottom leg for momentum', 'Knee caving inward over the toes', 'Using a box so high the hips tilt', 'Dropping down uncontrolled'],
    'Inhale at the bottom, exhale driving up.',
    '8–12 reps per leg',
    ARRAY['Start bodyweight-only until balance is solid', 'Use a lower box — knee height or below'],
    ARRAY['Add dumbbell load in small jumps', 'Slow the lowering phase to 3 seconds'],
    ARRAY['Check the box cannot slide or tip before loading it', 'Keep the working knee tracking over the toes'],
    ARRAY['lunge', 'bulgarian-split-squat', 'split-squat'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-step-up', 'db step up') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-step-up', 'dumbbell step ups') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-step-up', 'step up') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-step-up', 'step ups') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-step-up', 'step-ups') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-step-up', 'weighted step up') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('kettlebell-overhead-press',
    'Kettlebell Overhead Press',
    'A single-arm overhead press with a kettlebell racked at the shoulder. The offset load forces the shoulder stabilizers and obliques to work overtime, building pressing strength that transfers to every other lift.',
    'Compound',
    'Intermediate',
    'Push',
    'Upper',
    'Shoulders',
    ARRAY['Triceps', 'Core']::public.muscle_group[],
    'Kettlebell',
    'Both',
    false,
    'press',
    E'[{"title":"Rack","detail":"Clean the bell to the rack position: wrist straight, elbow tucked, bell resting on the forearm, fist under the chin."},{"title":"Brace","detail":"Squeeze your glutes, brace your abs, and keep ribs down — no leaning away from the bell."},{"title":"Press","detail":"Drive the bell straight up, rotating the arm slightly so the biceps finishes by your ear at lockout."},{"title":"Lower","detail":"Pull the bell back down to the rack under control without letting it crash onto the forearm."}]'::jsonb,
    ARRAY['Leaning sideways away from the bell', 'Bent wrist letting the bell flop back', 'Flaring the elbow out during the press', 'Rushing the lowering phase'],
    'Brace and inhale in the rack, exhale through the press.',
    '5–10 reps per arm',
    ARRAY['Master the two-arm dumbbell press first', 'Start with a bell you can strict-press 8 times', 'Practice the clean so every rep starts from a solid rack'],
    ARRAY['Move up one bell size when 10 clean reps feel easy', 'Add a 2-second pause at lockout', 'Progress to double-kettlebell pressing'],
    ARRAY['Keep the wrist straight — never let the bell bend it backward', 'Clear overhead space before pressing'],
    ARRAY['shoulder-press', 'arnold-press', 'barbell-overhead-press'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('kettlebell-overhead-press', 'kb overhead press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('kettlebell-overhead-press', 'kettlebell press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('kettlebell-overhead-press', 'single arm kettlebell press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('kettlebell-overhead-press', 'kettlebell shoulder press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('landmine-press',
    'Landmine Press',
    'An angled single-arm press with one end of a barbell anchored in a landmine base or corner. The arc is naturally shoulder-friendly, making it the go-to heavy press for lifters with cranky shoulders.',
    'Compound',
    'Intermediate',
    'Push',
    'Upper',
    'Shoulders',
    ARRAY['Triceps', 'Chest']::public.muscle_group[],
    'Barbell',
    'Gym',
    false,
    'press',
    E'[{"title":"Setup","detail":"Wedge one end of a barbell into a landmine base or corner. Take a half-kneeling or split stance facing the bar, gripping the thick end at shoulder height."},{"title":"Brace","detail":"Squeeze the glute of the down knee and brace your core so the torso cannot rotate."},{"title":"Press","detail":"Drive the bar up and forward along its arc until your arm is extended, reaching the shoulder toward the ceiling at the top."},{"title":"Lower","detail":"Guide the bar back to the shoulder under control, keeping the torso square."}]'::jsonb,
    ARRAY['Rotating the torso with the press', 'Pressing straight up instead of along the arc', 'Letting the lower back overarch at lockout'],
    'Inhale at the shoulder, exhale through the press.',
    '8–12 reps per arm',
    ARRAY['Start half-kneeling — the stance locks the hips in place', 'Use an empty bar until the arc feels natural'],
    ARRAY['Add small plates once 12 clean reps feel easy', 'Try the standing split-stance version for more core demand'],
    ARRAY['Check the anchored end cannot slip out mid-set', 'Keep the pressing shoulder packed, not shrugged'],
    ARRAY['shoulder-press', 'machine-shoulder-press', 'barbell-overhead-press'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('landmine-press', 'landmine shoulder press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('landmine-press', 'landmine overhead press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('landmine-press', 'landmine push press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('spider-curl',
    'Spider Curl',
    'A prone curl performed chest-down on an incline bench with arms hanging straight down. Gravity loads the biceps hardest at full contraction, and cheating is physically impossible — pure peak isolation.',
    'Isolation',
    'Intermediate',
    'Pull',
    'Upper',
    'Biceps',
    ARRAY['Forearms']::public.muscle_group[],
    'Dumbbell',
    'Both',
    false,
    'curl',
    E'[{"title":"Setup","detail":"Lie chest-down on an incline bench set around 45°, dumbbells hanging straight below your shoulders."},{"title":"Curl","detail":"Curl both dumbbells up toward your shoulders without moving your upper arms."},{"title":"Squeeze","detail":"Hold the peak contraction for a second — this is where the spider curl pays off."},{"title":"Lower","detail":"Lower slowly to full arm extension, letting the biceps stretch completely."}]'::jsonb,
    ARRAY['Swinging the torso to heave the weights', 'Stopping short of full extension at the bottom', 'Pulling the elbows backward'],
    'Exhale curling up, inhale lowering down.',
    '10–15 reps',
    ARRAY['Go lighter than your normal curl — the leverage is brutal', 'Keep your chest glued to the pad'],
    ARRAY['Add a 2-second pause at peak contraction', 'Slow negatives to 4 seconds on the last set'],
    ARRAY['Set the bench on flat, non-slip flooring', 'Do not let the dumbbells crash down when fatigued'],
    ARRAY['preacher-curl', 'incline-curl', 'concentration-curl'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('spider-curl', 'spider bicep curl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('spider-curl', 'prone incline curl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('spider-curl', 'dumbbell spider curl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('bird-dog',
    'Bird Dog',
    'A quadruped stability drill: extend the opposite arm and leg while keeping the torso perfectly still. It trains the deep spinal stabilizers and glutes together — the foundation of a pain-free back and heavy lifting.',
    'Isolation',
    'Beginner',
    'Core',
    'Core',
    'Core',
    ARRAY['Back', 'Glutes']::public.muscle_group[],
    'Bodyweight',
    'Both',
    true,
    'plank',
    E'[{"title":"Setup","detail":"Start on all fours with hands under shoulders, knees under hips, spine neutral."},{"title":"Extend","detail":"Slowly reach your right arm forward and left leg straight back until both are parallel to the floor."},{"title":"Hold","detail":"Pause 2–3 seconds without letting the hips rock or the lower back arch."},{"title":"Switch","detail":"Return under control and repeat on the opposite side."}]'::jsonb,
    ARRAY['Rocking the hips side to side', 'Arching the lower back at full extension', 'Rushing reps without the hold'],
    'Exhale as you extend, inhale returning to all fours.',
    '8–12 reps per side',
    ARRAY['Shorten the reach until you can keep the hips level', 'Imagine balancing a cup of water on your lower back'],
    ARRAY['Extend the hold toward 10 seconds per side', 'Draw small squares with the extended hand and foot'],
    ARRAY['Move within a pain-free range — no forcing extension', 'Pad the knees on hard floors'],
    ARRAY['dead-bug', 'plank', 'hyperextension'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('bird-dog', 'bird dog exercise') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('bird-dog', 'birddog') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('bird-dog', 'quadruped arm leg raise') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('split-squat',
    'Split Squat',
    'The stationary foundation of all lunge training: one foot forward, one back, straight up and down. It teaches single-leg strength and balance with zero impact, and scales from rehab to loaded work.',
    'Compound',
    'Beginner',
    'Legs',
    'Lower',
    'Quads',
    ARRAY['Glutes', 'Core']::public.muscle_group[],
    'Bodyweight',
    'Both',
    true,
    'lunge',
    E'[{"title":"Stance","detail":"Take a long staggered stance, torso tall, hands on hips or at your sides."},{"title":"Descend","detail":"Bend both knees to lower straight down until the front thigh is roughly parallel to the floor."},{"title":"Track","detail":"Keep the front knee stacked over the ankle and most of your weight on the front heel."},{"title":"Drive","detail":"Push through the front foot to return to the top without stepping the feet together."}]'::jsonb,
    ARRAY['Stance too short, jamming the front knee forward', 'Leaning the torso far forward', 'Pushing off the back leg instead of the front'],
    'Inhale lowering down, exhale driving up.',
    '10–15 reps per leg',
    ARRAY['Hold a wall or rack for balance at first', 'Shorten the stance until depth feels comfortable'],
    ARRAY['Add dumbbells at your sides', 'Elevate the rear foot to become a Bulgarian split squat'],
    ARRAY['Keep the front knee behind the toes line of comfort — mild travel is fine, pain is not', 'Wear grippy shoes on smooth floors'],
    ARRAY['lunge', 'bulgarian-split-squat', 'dumbbell-step-up'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('split-squat', 'static lunge') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('split-squat', 'stationary lunge') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('split-squat', 'bodyweight split squat') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('split-squat', 'split squats') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('reverse-nordic-curl',
    'Reverse Nordic Curl',
    'A kneeling quad isolation where you lean your whole torso backward under control. It loads the quads through a deep knee-flexion stretch most lifters never train — the missing piece for bulletproof knees.',
    'Isolation',
    'Advanced',
    'Legs',
    'Lower',
    'Quads',
    ARRAY['Core']::public.muscle_group[],
    'Bodyweight',
    'Both',
    false,
    'squat',
    E'[{"title":"Setup","detail":"Kneel tall on a pad with ankles anchored or feet flat behind you, arms crossed on your chest."},{"title":"Lean","detail":"Keeping hips extended in one straight line from knees to shoulders, lean your torso backward slowly."},{"title":"Control","detail":"Go only as far as you can reverse — even a few inches is productive at first."},{"title":"Return","detail":"Squeeze your quads and glutes to pull yourself back upright without bending at the hips."}]'::jsonb,
    ARRAY['Breaking at the hips instead of leaning as one line', 'Dropping too deep too soon', 'Holding your breath through the effort'],
    'Inhale leaning back, exhale driving upright.',
    '5–10 reps',
    ARRAY['Start with partial range holding a doorframe or rack', 'Pad the knees generously'],
    ARRAY['Increase lean depth an inch at a time', 'Add a 3-second pause at the deepest point'],
    ARRAY['Anchor the feet securely — a slip loads the knees badly', 'Stop if the knees ache sharply rather than the quads burning'],
    ARRAY['leg-extension', 'nordic-curl', 'bulgarian-split-squat'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('reverse-nordic-curl', 'reverse nordic') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('reverse-nordic-curl', 'reverse nordics') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('reverse-nordic-curl', 'kneeling leg extension') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('hollow-hold',
    'Hollow Body Hold',
    'The fundamental gymnastics core position: lower back glued to the floor, shoulders and legs hovering. It builds the rigid, hollow trunk that transfers into pull-ups, handstands, and every heavy barbell lift.',
    'Isolation',
    'Intermediate',
    'Core',
    'Core',
    'Core',
    '{}'::public.muscle_group[],
    'Bodyweight',
    'Both',
    false,
    'plank',
    E'[{"title":"Setup","detail":"Lie on your back and press your lower back flat into the floor — no gap allowed."},{"title":"Shape","detail":"Lift your shoulders and straight legs a few inches off the floor, arms reaching overhead, body curved like a banana."},{"title":"Hold","detail":"Breathe steadily behind a braced trunk and hold the shape without letting the lower back peel up."},{"title":"Release","detail":"Rest, then repeat. Quality seconds beat shaky long holds."}]'::jsonb,
    ARRAY['Lower back arching off the floor', 'Holding your breath instead of bracing', 'Bent knees to fake longer holds'],
    'Take short, controlled breaths while keeping the trunk braced.',
    '20–45 second holds',
    ARRAY['Bend the knees (tuck hold) to shorten the lever', 'Keep arms at your sides instead of overhead at first'],
    ARRAY['Extend hold time in 5-second jumps', 'Progress to hollow rocks'],
    ARRAY['Stop if the lower back cramps rather than the abs burning', 'Do not force the position with a pre-existing back injury'],
    ARRAY['plank', 'dead-bug', 'crunch'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('hollow-hold', 'hollow hold') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('hollow-hold', 'hollow body hold') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('hollow-hold', 'hollow position') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('l-sit-hold',
    'L-Sit Hold',
    'Seated on the floor or parallettes, press your body up and hold your legs straight out front. The L-sit compresses the abs brutally while demanding triceps lockout strength — a true test of relative strength.',
    'Isolation',
    'Advanced',
    'Core',
    'Core',
    'Core',
    ARRAY['Triceps']::public.muscle_group[],
    'Bodyweight',
    'Both',
    false,
    'plank',
    E'[{"title":"Setup","detail":"Sit with legs straight, hands planted beside your hips, fingers forward."},{"title":"Lift","detail":"Press through your palms to lift your hips off the floor, locking your elbows."},{"title":"Extend","detail":"Hold your legs straight and together, toes pointed, torso tall."},{"title":"Hold","detail":"Breathe steadily and hold the L without letting the shoulders shrug to your ears."}]'::jsonb,
    ARRAY['Bent knees throughout the hold', 'Shoulders shrugged up instead of pressed down', 'Leaning back instead of staying tall'],
    'Breathe shallow and steady — never hold your breath.',
    '10–30 second holds',
    ARRAY['Start with tucked knees (tuck sit) for short holds', 'Use parallettes or blocks to give the legs clearance'],
    ARRAY['Straighten one leg at a time before both', 'Add 5 seconds per session toward a 30-second hold'],
    ARRAY['Warm up the wrists thoroughly', 'Stop if the shoulders roll forward painfully'],
    ARRAY['hanging-leg-raise', 'plank', 'dead-bug'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('l-sit-hold', 'l sit') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('l-sit-hold', 'l-sit') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('l-sit-hold', 'l sit hold') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('dragon-flag',
    'Dragon Flag',
    'The legendary Bruce Lee core movement: from shoulder stands you lower your entire rigid body toward the bench without bending. It loads the whole anterior chain eccentrically like nothing else in bodyweight training.',
    'Isolation',
    'Advanced',
    'Core',
    'Core',
    'Core',
    ARRAY['Back']::public.muscle_group[],
    'Bodyweight',
    'Both',
    false,
    'crunch',
    E'[{"title":"Setup","detail":"Lie on a flat bench gripping its edge behind your head, body in a shoulder-stand position with weight on your upper back."},{"title":"Lower","detail":"Keeping your body in one perfectly straight line, slowly lower toward the bench."},{"title":"Control","detail":"Descend only as far as you can reverse — the eccentric is the exercise."},{"title":"Return","detail":"Pull back up to vertical without kicking or bending at the hips."}]'::jsonb,
    ARRAY['Bending at the hips into a leg raise', 'Dropping uncontrollably through the bottom half', 'Arching the back instead of staying rigid'],
    'Inhale at the top, exhale slowly through the descent.',
    '3–8 reps',
    ARRAY['Start with tucked dragon flags (knees bent)', 'Practice negatives only: lower slowly, reset at the top'],
    ARRAY['Add one rep per session before extending range', 'Work toward straddle and full lay versions'],
    ARRAY['Use a heavy, stable bench that cannot tip', 'Stop immediately with any neck or lower-back pain'],
    ARRAY['hanging-leg-raise', 'crunch', 'ab-wheel-rollout'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dragon-flag', 'dragon flags') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dragon-flag', 'dragonflag') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('wide-grip-bench-press',
    'Wide-Grip Bench Press',
    'A bench press with hands placed well outside shoulder width. The wider grip shortens the range of motion and shifts more load onto the outer chest and front delts — a classic powerlifting assistance variation.',
    'Compound',
    'Intermediate',
    'Push',
    'Upper',
    'Chest',
    ARRAY['Shoulders', 'Triceps']::public.muscle_group[],
    'Barbell',
    'Gym',
    false,
    'bench',
    E'[{"title":"Setup","detail":"Lie flat with feet planted. Grip the bar roughly two hand-widths wider than your normal bench grip and unrack with a spotter."},{"title":"Lower","detail":"Lower the bar under control to mid-chest, keeping elbows at about 45–60° from the torso."},{"title":"Press","detail":"Drive the bar straight up until your arms lock out, keeping your shoulder blades pinned."},{"title":"Reset","detail":"Pause briefly at the top, then lower for the next rep — no bouncing."}]'::jsonb,
    ARRAY['Gripping so wide the wrists bend back', 'Flaring elbows to a full 90° under load', 'Bouncing the bar off the chest', 'Lifting the hips off the bench'],
    'Inhale at the top, hold while lowering, exhale forcefully through the press.',
    '5–8 reps',
    ARRAY['Master the standard bench press first', 'Use a spotter — the wide grip is harder to bail from', 'Keep wrists stacked over elbows'],
    ARRAY['Add 2.5 kg per session', 'Rotate with close-grip pressing for balanced triceps strength'],
    ARRAY['Stop if you feel a pinch in the front of the shoulder', 'Always use collars and a spotter near failure'],
    ARRAY['bench-press', 'incline-bench-press', 'dips'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('wide-grip-bench-press', 'wide grip bench') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('wide-grip-bench-press', 'wide bench press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('wide-grip-bench-press', 'wide-grip bench') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('single-leg-deadlift',
    'Single-Leg Romanian Deadlift',
    'A Romanian deadlift balanced on one leg. It hammers the hamstrings and glutes unilaterally while forcing the foot, ankle, and core stabilizers to work — equal parts strength and balance training.',
    'Compound',
    'Intermediate',
    'Legs',
    'Lower',
    'Hamstrings',
    ARRAY['Glutes', 'Core']::public.muscle_group[],
    'Dumbbell',
    'Both',
    false,
    'deadlift',
    E'[{"title":"Setup","detail":"Stand on one leg holding a dumbbell in the opposite hand, knee soft, hips square."},{"title":"Hinge","detail":"Push the free leg straight back as you hinge forward, lowering the dumbbell toward the floor."},{"title":"Stretch","detail":"Descend until your torso is near parallel, feeling a deep hamstring stretch — no rounding."},{"title":"Drive","detail":"Squeeze the standing glute to pull yourself back upright, hips square throughout."}]'::jsonb,
    ARRAY['Opening the hips and rotating the torso', 'Rounding the lower back at the bottom', 'Bending the standing knee into a squat'],
    'Inhale hinging down, exhale driving up.',
    '8–12 reps per leg',
    ARRAY['Touch a wall lightly for balance until the pattern is stable', 'Start with no weight to learn the hinge'],
    ARRAY['Add dumbbell load once 12 clean reps feel easy', 'Pause 2 seconds at the bottom stretch'],
    ARRAY['Keep the back flat — depth past a flat back adds nothing', 'Clear floor space in case balance fails'],
    ARRAY['romanian-deadlift', 'good-morning', 'bulgarian-split-squat'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('single-leg-deadlift', 'single leg rdl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('single-leg-deadlift', 'single leg romanian deadlift') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('single-leg-deadlift', 'one leg deadlift') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('single-leg-deadlift', 'single-leg deadlift') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('dumbbell-romanian-deadlift',
    'Dumbbell Romanian Deadlift',
    'The classic hip-hinge builder performed with dumbbells at your sides. Dumbbells allow a freer hip path than a barbell and train each side evenly — the safest way to load the hamstrings and glutes heavy.',
    'Compound',
    'Intermediate',
    'Legs',
    'Lower',
    'Hamstrings',
    ARRAY['Glutes', 'Back']::public.muscle_group[],
    'Dumbbell',
    'Both',
    false,
    'deadlift',
    E'[{"title":"Setup","detail":"Stand tall holding dumbbells in front of your thighs, feet hip-width, knees soft."},{"title":"Hinge","detail":"Push your hips straight back, sliding the dumbbells down the fronts of your legs with a flat back."},{"title":"Stretch","detail":"Descend until you feel a deep hamstring stretch, typically just below the knees — no rounding."},{"title":"Drive","detail":"Drive your hips forward to stand tall, squeezing the glutes hard at the top."}]'::jsonb,
    ARRAY['Rounding the lower back at the bottom', 'Squatting down instead of hinging back', 'Letting the dumbbells drift far from the legs', 'Hyperextending the lower back at lockout'],
    'Inhale hinging down, exhale driving the hips through.',
    '8–12 reps',
    ARRAY['Learn the hinge by pushing your hips to a wall behind you', 'Keep the dumbbells grazing your legs the whole rep'],
    ARRAY['Add dumbbell load once 12 clean reps feel easy', 'Slow the lowering phase to 3 seconds'],
    ARRAY['Stop the descent where the back wants to round — depth past that adds nothing', 'Keep the neck neutral, eyes on the floor ahead'],
    ARRAY['romanian-deadlift', 'single-leg-deadlift', 'good-morning'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-romanian-deadlift', 'dumbbell romanian deadlift') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-romanian-deadlift', 'db romanian deadlift') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-romanian-deadlift', 'dumbbell rdl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-romanian-deadlift', 'db rdl') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('kettlebell-sumo-deadlift',
    'Kettlebell Sumo Deadlift',
    'A wide-stance deadlift lifting a kettlebell from the floor between your feet. The sumo position shortens the pull and spares the back, making it the ideal first deadlift pattern for beginners.',
    'Compound',
    'Beginner',
    'Legs',
    'Lower',
    'Glutes',
    ARRAY['Hamstrings', 'Back']::public.muscle_group[],
    'Kettlebell',
    'Both',
    true,
    'deadlift',
    E'[{"title":"Setup","detail":"Stand with feet wide, toes turned out, kettlebell on the floor centered between your feet."},{"title":"Grip","detail":"Hinge down with a flat back and grip the bell handle with both hands."},{"title":"Drive","detail":"Push the floor away, extending hips and knees together until fully upright with glutes squeezed."},{"title":"Lower","detail":"Hinge back down, placing the bell on the same floor spot every rep."}]'::jsonb,
    ARRAY['Rounding the back to reach the bell', 'Squatting straight down instead of hinging', 'Letting the knees cave inward'],
    'Brace and inhale at the bottom, exhale standing tall.',
    '8–15 reps',
    ARRAY['Elevate the bell on a step if you cannot reach it flat-backed', 'Practice the hip hinge unloaded first'],
    ARRAY['Move to heavier bells in 4 kg jumps', 'Progress to the barbell sumo deadlift'],
    ARRAY['Keep the spine neutral from start to finish', 'Set the bell down fully between reps — no bouncing'],
    ARRAY['sumo-deadlift', 'deadlift', 'kettlebell-swing'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('kettlebell-sumo-deadlift', 'kb sumo deadlift') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('kettlebell-sumo-deadlift', 'sumo deadlift kettlebell') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('kettlebell-sumo-deadlift', 'kettlebell sumo dead lift') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('dumbbell-close-press',
    'Dumbbell Close Chest Press',
    'A neutral-grip dumbbell press with the weights held close together. The palms-in position is easy on the shoulders and hammers the inner chest and triceps at the same time.',
    'Compound',
    'Beginner',
    'Push',
    'Upper',
    'Chest',
    ARRAY['Triceps', 'Shoulders']::public.muscle_group[],
    'Dumbbell',
    'Both',
    true,
    'bench',
    E'[{"title":"Setup","detail":"Lie back holding two dumbbells pressed together over your chest, palms facing each other."},{"title":"Lower","detail":"Lower the paired dumbbells to your lower chest, keeping elbows tucked close to your ribs."},{"title":"Press","detail":"Drive both dumbbells up together, squeezing them inward as you extend your arms."},{"title":"Squeeze","detail":"Pause at lockout and squeeze the chest and triceps before lowering."}]'::jsonb,
    ARRAY['Letting the dumbbells drift apart', 'Flaring elbows wide', 'Shortening the range at the bottom'],
    'Exhale on the press, inhale while lowering.',
    '8–12 reps',
    ARRAY['Start light — the squeeze matters more than the load', 'Keep the dumbbells touching throughout the set'],
    ARRAY['Add weight in 2 kg steps', 'Add a 2-second squeeze at lockout'],
    ARRAY['Keep a firm grip — neutral dumbbells can slip when fatigued', 'Lower to the floor safely if you fail a rep'],
    ARRAY['dumbbell-bench-press', 'close-grip-bench-press', 'chest-fly'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-close-press', 'neutral grip dumbbell press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-close-press', 'hammer press dumbbell') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-close-press', 'close grip dumbbell press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('dumbbell-close-press', 'dumbbell close chest press') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES
  ('wide-push-up',
    'Wide Push-Up',
    'A push-up with hands set well outside shoulder width. The wide base stretches the chest through a bigger range and shifts emphasis to the outer pecs and front delts.',
    'Compound',
    'Beginner',
    'Push',
    'Upper',
    'Chest',
    ARRAY['Shoulders', 'Triceps']::public.muscle_group[],
    'Bodyweight',
    'Both',
    true,
    'bench',
    E'[{"title":"Setup","detail":"Get into a plank with hands roughly one and a half shoulder-widths apart, fingers forward, body in a straight line."},{"title":"Lower","detail":"Bend your elbows out to the sides as you lower your chest toward the floor."},{"title":"Stretch","detail":"Descend until your chest nearly touches, feeling a deep stretch across the pecs."},{"title":"Press","detail":"Drive back up to full arm extension without letting the hips sag."}]'::jsonb,
    ARRAY['Sagging or piked hips', 'Dropping the head toward the floor', 'Cutting depth to chase rep counts'],
    'Inhale lowering down, exhale pressing up.',
    '8–15 reps',
    ARRAY['Elevate your hands slightly if full-depth reps are out of reach', 'Keep the core braced like a moving plank'],
    ARRAY['Add a weighted backpack or vest', 'Slow the lowering phase to 3 seconds'],
    ARRAY['Stop if the front of the shoulder pinches — narrow the grip slightly', 'Warm up wrists before high-rep sets'],
    ARRAY['push-up', 'incline-push-up', 'dips'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('wide-push-up', 'wide pushup') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('wide-push-up', 'wide grip pushup') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('wide-push-up', 'wide push ups') ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES ('wide-push-up', 'wide arm push up') ON CONFLICT DO NOTHING;
