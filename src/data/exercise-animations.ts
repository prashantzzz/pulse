/**
 * SINGLE SOURCE OF TRUTH for exercise animations (mp4 + gif).
 *
 * 1. ANIMATION_ASSETS: Bundled video (.mp4) and image (.gif) assets.
 * 2. EXERCISE_ANIMATIONS: Strict 1-to-1 mapping for exact exercise matches only.
 *    Non-matching exercises return null and cleanly render the anatomical muscle map.
 */

export type AnimationAsset = { source: number; type: 'video' | 'gif' };

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

  // ── GIFs with exact exercise execution (assets/gifs/) ─────────────────────
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
 * Exact Exercise ID → Animation asset key mapping.
 * Only exact matching animations are mapped. Exercises without an exact
 * animation match do NOT show misleading movements and instead render
 * the anatomical muscle target heatmap directly.
 */
const EXERCISE_ANIMATIONS: Record<string, string> = {
  // ── Chest ──
  'bench-press': 'bench-press',
  'dumbbell-bench-press': 'dumbbell-bench-press',
  'incline-bench-press': 'incline-bench-press',
  'pec-deck': '0051',

  // ── Back ──
  'lat-pulldown': 'lat-pulldown',
  'pull-up': 'pull-up',
  'seated-cable-row': 'seated-cable-row',
  'dumbbell-row': 'dumbbell-row',
  'barbell-row': 'barbell-row',
  'machine-row': 'machine-row',

  // ── Shoulders ──
  'shoulder-press': '0090',
  'arnold-press': '0087',
  'lateral-raise': '0096',
  'rear-delt-fly': '0099',

  // ── Arms ──
  'bicep-curl': 'bicep-curl',
  'hammer-curl': 'hammer-curl',
  'triceps-pushdown': '0085',
  'overhead-extension': 'overhead-triceps-extension',

  // ── Legs / Lower Body ──
  squat: '0054',
  'goblet-squat': '0064',
  'leg-press': '0074',
  'leg-extension': '0073',
  'leg-curl': '0079',
  deadlift: '0060',
  'romanian-deadlift': '0060',
  'hip-thrust': '0057',
  lunge: '0059',
  'calf-raise': 'standing-calf-raise',

  // ── Core & Cardio ──
  plank: 'plank',
  'russian-twist': 'russian-twist',
  'treadmill-run': '0078',
  cycling: '0062',
  rower: '0077',
};

/**
 * Returns the exact animation asset for an exercise, or null when it has none.
 */
export function getExerciseAnimation(exerciseId: string): AnimationAsset | null {
  const base = EXERCISE_ANIMATIONS[exerciseId];
  if (!base) return null;
  return ANIMATION_ASSETS[base] ?? null;
}
