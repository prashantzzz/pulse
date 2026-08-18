/**
 * SINGLE SOURCE OF TRUTH for exercise animations (mp4 + gif).
 *
 * Two tables, both in this file:
 *
 *   1. ANIMATION_ASSETS  — every bundled animation file, keyed by its BASE
 *      name (no extension). This is the only place a file is referenced, and
 *      the only place that knows whether it is an .mp4 ("video") or a .gif.
 *
 *   2. EXERCISE_ANIMATIONS — maps each exercise id to the base name of the
 *      animation it should show. Exercises that share a visual reuse the same
 *      base name (e.g. machine-press shows the incline-bench-press loop).
 *
 * The renderer (components/animation.tsx) branches on `type`, so:
 *
 *   To swap a .gif for an .mp4 keeping the same base name (e.g. you drop a
 *   bench-press.mp4 into assets/vital/): change ONE line in ANIMATION_ASSETS —
 *   point the 'bench-press' key at the mp4 with type 'video'. Nothing else
 *   changes: the exercise mapping and the renderer keep working.
 *
 *   To add a brand-new animation for an exercise: drop the file into
 *   assets/vital/ (.mp4) or assets/gifs/ (.gif), add one line to
 *   ANIMATION_ASSETS, and one line to EXERCISE_ANIMATIONS.
 *
 * Priority when rendering: video (Vital mp4) > gif > muscle-highlight body
 * model fallback (components/animation.tsx renders the anatomical muscle map
 * when an exercise has no asset — never a blank screen).
 */

export type AnimationAsset = { source: number; type: 'video' | 'gif' };

/**
 * Asset registry — base name → bundled asset + its type.
 * `require()` paths must stay literal (Metro resolves them statically at build
 * time), so this is the one place that declares which file each animation
 * lives in and what kind it is.
 */
const ANIMATION_ASSETS: Record<string, AnimationAsset> = {
  // ── Vital free pack clips (HD mp4, assets/vital/) ──────────────────────────
  '0051': { source: require('../../assets/vital/0051.mp4'), type: 'video' }, // pec deck machine fly
  '0054': { source: require('../../assets/vital/0054.mp4'), type: 'video' }, // barbell back squat
  '0057': { source: require('../../assets/vital/0057.mp4'), type: 'video' }, // barbell hip thrust
  '0059': { source: require('../../assets/vital/0059.mp4'), type: 'video' }, // barbell reverse lunges
  '0060': { source: require('../../assets/vital/0060.mp4'), type: 'video' }, // barbell romanian deadlift
  '0062': { source: require('../../assets/vital/0062.mp4'), type: 'video' }, // cycling
  '0064': { source: require('../../assets/vital/0064.mp4'), type: 'video' }, // dumbbell goblet squat
  '0073': { source: require('../../assets/vital/0073.mp4'), type: 'video' }, // leg extension machine
  '0074': { source: require('../../assets/vital/0074.mp4'), type: 'video' }, // leg press machine
  '0077': { source: require('../../assets/vital/0077.mp4'), type: 'video' }, // rowing machine
  '0078': { source: require('../../assets/vital/0078.mp4'), type: 'video' }, // run on treadmill
  '0079': { source: require('../../assets/vital/0079.mp4'), type: 'video' }, // seated leg curl machine
  '0085': { source: require('../../assets/vital/0085.mp4'), type: 'video' }, // triceps pushdown (cable - rope)
  '0087': { source: require('../../assets/vital/0087.mp4'), type: 'video' }, // arnold press dumbbell
  '0090': { source: require('../../assets/vital/0090.mp4'), type: 'video' }, // dumbbell overhead standard
  '0096': { source: require('../../assets/vital/0096.mp4'), type: 'video' }, // lateral raises (dumbbell)
  '0099': { source: require('../../assets/vital/0099.mp4'), type: 'video' }, // rear delt fly (reverse pec deck)

  // ── GIFs for exercises with no Vital clip (assets/gifs/) ───────────────────
  'bench-press': { source: require('../../assets/gifs/bench-press.gif'), type: 'gif' },
  'dumbbell-bench-press': { source: require('../../assets/gifs/dumbbell-bench-press.gif'), type: 'gif' },
  'incline-bench-press': { source: require('../../assets/gifs/incline-bench-press.gif'), type: 'gif' },
  'lat-pulldown': { source: require('../../assets/gifs/lat-pulldown.gif'), type: 'gif' },
  'pull-up': { source: require('../../assets/gifs/pull-up.gif'), type: 'gif' },
  'seated-cable-row': { source: require('../../assets/gifs/seated-cable-row.gif'), type: 'gif' },
  'dumbbell-row': { source: require('../../assets/gifs/dumbbell-row.gif'), type: 'gif' },
  'barbell-row': { source: require('../../assets/gifs/barbell-row.gif'), type: 'gif' },
  'machine-row': { source: require('../../assets/gifs/machine-row.gif'), type: 'gif' },
  'bicep-curl': { source: require('../../assets/gifs/bicep-curl.gif'), type: 'gif' },
  'hammer-curl': { source: require('../../assets/gifs/hammer-curl.gif'), type: 'gif' },
  'overhead-triceps-extension': { source: require('../../assets/gifs/overhead-triceps-extension.gif'), type: 'gif' },
  'standing-calf-raise': { source: require('../../assets/gifs/standing-calf-raise.gif'), type: 'gif' },
  plank: { source: require('../../assets/gifs/plank.gif'), type: 'gif' },
  'russian-twist': { source: require('../../assets/gifs/russian-twist.gif'), type: 'gif' },
};

/**
 * Exercise id → animation base name (see ANIMATION_ASSETS above).
 * Point an exercise at a different animation by changing its value here.
 */
const EXERCISE_ANIMATIONS: Record<string, string> = {
  // ── Vital pack clips ──
  'chest-fly': '0051',
  squat: '0054',
  'hip-thrust': '0057',
  lunge: '0059',
  deadlift: '0060',
  'romanian-deadlift': '0060', // same clip as deadlift
  cycling: '0062',
  'goblet-squat': '0064',
  'leg-extension': '0073',
  'leg-press': '0074',
  rower: '0077',
  'treadmill-run': '0078',
  'leg-curl': '0079',
  'triceps-pushdown': '0085',
  'arnold-press': '0087',
  'shoulder-press': '0090',
  'lateral-raise': '0096',
  'rear-delt-fly': '0099',

  // ── GIFs (own clip) ──
  'bench-press': 'bench-press',
  'dumbbell-bench-press': 'dumbbell-bench-press',
  'incline-bench-press': 'incline-bench-press',
  'lat-pulldown': 'lat-pulldown',
  'pull-up': 'pull-up',
  'seated-cable-row': 'seated-cable-row',
  'dumbbell-row': 'dumbbell-row',
  'barbell-row': 'barbell-row',
  'machine-row': 'machine-row',
  'bicep-curl': 'bicep-curl',
  'hammer-curl': 'hammer-curl',
  'overhead-extension': 'overhead-triceps-extension',
  'calf-raise': 'standing-calf-raise',
  plank: 'plank',
  'russian-twist': 'russian-twist',

  // ── GIFs reusing the closest movement-family loop ──
  'machine-press': 'incline-bench-press', // machine chest press → incline press
  'band-pulldown': 'seated-cable-row', // resistance band pulldown → seated cable row
  'face-pull': 'machine-row', // face pull → machine row
  'incline-curl': 'overhead-triceps-extension', // incline dumbbell curl → overhead extension
  crunch: 'russian-twist', // cable crunch → russian twist

  // ── Newer exercises: only reuse a loop when the movement is visually
  //    faithful. Exercises without a match here (or in the tables above) get
  //    no animation and render the muscle-highlight body model instead — see
  //    the fallback in components/animation.tsx. To give any of them a real
  //    animation later, drop a file into assets/vital|gifs and add one line
  //    to ANIMATION_ASSETS + one line here.
  // Chest
  'decline-bench-press': 'bench-press', // decline press → bench press
  'cable-fly': '0051', // cable fly → pec deck machine fly
  'pec-deck': '0051', // pec deck → its own Vital clip
  // Back
  'chin-up': 'pull-up', // chin-up → pull-up (same hang-and-pull)
  'assisted-pullup': 'pull-up', // assisted pull-up → pull-up
  't-bar-row': 'barbell-row', // T-bar row → barbell row
  'straight-arm-pulldown': 'lat-pulldown', // straight-arm pulldown → lat pulldown
  // Shoulders
  'machine-shoulder-press': '0090', // machine shoulder press → dumbbell overhead press
  'cable-lateral-raise': '0096', // cable lateral raise → dumbbell lateral raise
  // Biceps
  'cable-curl': 'bicep-curl', // cable curl → dumbbell curl
  'preacher-curl': 'bicep-curl', // preacher curl → dumbbell curl
  'concentration-curl': 'bicep-curl', // concentration curl → dumbbell curl
  // Triceps
  'skull-crusher': 'overhead-triceps-extension', // skull crusher → overhead extension
  'close-grip-bench-press': 'bench-press', // close-grip press → bench press
  // Quads
  'front-squat': '0054', // front squat → back squat
  'hack-squat': '0054', // hack squat → back squat
  'bulgarian-split-squat': '0059', // split squat → reverse lunge
  // Hamstrings
  'lying-leg-curl': '0079', // lying leg curl → seated leg curl
  'good-morning': '0060', // good morning → romanian deadlift hinge
  // Glutes
  'glute-bridge': '0057', // glute bridge → hip thrust
  'sumo-deadlift': '0060', // sumo deadlift → deadlift
  // Calves
  'seated-calf-raise': 'standing-calf-raise', // seated calf raise → standing calf raise
  'single-leg-calf-raise': 'standing-calf-raise', // single-leg calf raise → standing calf raise
  'leg-press-calf-raise': '0074', // leg press calf raise → leg press
  // Core
  'side-plank': 'plank', // side plank → plank
};

/**
 * Returns the animation asset for an exercise, or null when it has none
 * (falls back to the animated SVG figure in components/animation.tsx).
 * The caller branches on `asset.type` to pick the right renderer.
 */
export function getExerciseAnimation(exerciseId: string): AnimationAsset | null {
  const base = EXERCISE_ANIMATIONS[exerciseId];
  if (!base) return null;
  return ANIMATION_ASSETS[base] ?? null;
}
