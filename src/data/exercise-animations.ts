/**
 * SINGLE SOURCE OF TRUTH for exercise animations (.mp4 videos).
 *
 * 1. ANIMATION_ASSETS: Bundled HD video (.mp4) assets from assets/vital/.
 * 2. EXERCISE_ANIMATIONS: Strict 1-to-1 mapping for exact exercise matches.
 *    Non-matching exercises return null and cleanly render the anatomical muscle map.
 */

export type AnimationAsset = { source: number; type: 'video'; aspectRatio: number };

const ANIMATION_ASSETS: Record<string, AnimationAsset> = {
  // ── Chest ──
  'barbell-bench-press-flat': { source: require('../../assets/vital/barbell-bench-press-flat.mp4'), type: 'video', aspectRatio: 1.0 },
  'barbell-incline-bench-press': { source: require('../../assets/vital/barbell-incline-bench-press.mp4'), type: 'video', aspectRatio: 1.0 },
  'decline-bench-press': { source: require('../../assets/vital/decline-bench-press.mp4'), type: 'video', aspectRatio: 1.778 },
  'dumbbell-bench-press-flat': { source: require('../../assets/vital/dumbbell-bench-press-flat.mp4'), type: 'video', aspectRatio: 1.0 },
  'incline-dumbbell-bench-press': { source: require('../../assets/vital/incline-dumbbell-bench-press.mp4'), type: 'video', aspectRatio: 1.0 },
  'dumbbell-flys-flat': { source: require('../../assets/vital/dumbbell-flys-flat.mp4'), type: 'video', aspectRatio: 1.0 },
  'dumbbell-flys-incline': { source: require('../../assets/vital/dumbbell-flys-incline.mp4'), type: 'video', aspectRatio: 1.0 },
  'cable-chest-fly': { source: require('../../assets/vital/cable-chest-fly.mp4'), type: 'video', aspectRatio: 1.778 },
  'pec-deck-machine-fly': { source: require('../../assets/vital/pec-deck-machine-fly.mp4'), type: 'video', aspectRatio: 1.0 },
  'machine-chest-press': { source: require('../../assets/vital/machine-chest-press.mp4'), type: 'video', aspectRatio: 1.778 },
  'chest-dips': { source: require('../../assets/vital/chest-dips.mp4'), type: 'video', aspectRatio: 1.778 },
  'push-ups': { source: require('../../assets/vital/push-ups.mp4'), type: 'video', aspectRatio: 1.0 },
  'decline-push-ups': { source: require('../../assets/vital/decline-push-ups.mp4'), type: 'video', aspectRatio: 1.0 },
  'diamond-push-up': { source: require('../../assets/vital/diamond-push-up.mp4'), type: 'video', aspectRatio: 1.0 },
  'dumbbell-pullover': { source: require('../../assets/vital/Dumbbell-Pullover.mp4'), type: 'video', aspectRatio: 1.778 },

  // ── Back ──
  'lat-pulldown': { source: require('../../assets/vital/lat-pulldown.mp4'), type: 'video', aspectRatio: 1.778 },
  'lat-pulldown-machine': { source: require('../../assets/vital/lat-pulldown-machine.mp4'), type: 'video', aspectRatio: 1.778 },
  'resistance-band-pulldown': { source: require('../../assets/vital/resistance-band-pulldown.mp4'), type: 'video', aspectRatio: 1.778 },
  'pull-up': { source: require('../../assets/vital/pull-up.mp4'), type: 'video', aspectRatio: 1.0 },
  'assisted-pull-up': { source: require('../../assets/vital/assisted-pull-up.mp4'), type: 'video', aspectRatio: 1.778 },
  'chin-up-leg-folded': { source: require('../../assets/vital/chin-up-leg-folded.mp4'), type: 'video', aspectRatio: 1.0 },
  'bent-over-barbell-row': { source: require('../../assets/vital/bent-over-barbell-row.mp4'), type: 'video', aspectRatio: 1.0 },
  'dumbbell-row': { source: require('../../assets/vital/dumbbell-row.mp4'), type: 'video', aspectRatio: 1.778 },
  'barbell-incline-row': { source: require('../../assets/vital/Barbell-Incline-Row.mp4'), type: 'video', aspectRatio: 1.778 },
  'seated-cable-row': { source: require('../../assets/vital/seated-cable-row.mp4'), type: 'video', aspectRatio: 1.778 },
  'barbell-t-bar-row': { source: require('../../assets/vital/barbell-t-bar-row.mp4'), type: 'video', aspectRatio: 1.828 },
  'machine-row': { source: require('../../assets/vital/machine-row.mp4'), type: 'video', aspectRatio: 1.778 },
  'face-pull': { source: require('../../assets/vital/face-pull.mp4'), type: 'video', aspectRatio: 1.778 },
  'back-extension': { source: require('../../assets/vital/back-extension.mp4'), type: 'video', aspectRatio: 1.778 },
  'dumbbell-shrug': { source: require('../../assets/vital/dumbbell-shrug.mp4'), type: 'video', aspectRatio: 1.0 },
  'barbell-shrug': { source: require('../../assets/vital/Barbell-Shrug.mp4'), type: 'video', aspectRatio: 1.778 },

  // ── Shoulders ──
  'dumbbell-overhead-press': { source: require('../../assets/vital/dumbbell-overhead-press.mp4'), type: 'video', aspectRatio: 1.0 },
  'machine-shoulder-press': { source: require('../../assets/vital/machine-shoulder-press.mp4'), type: 'video', aspectRatio: 1.778 },
  'dumbbell-arnold-press': { source: require('../../assets/vital/dumbbell-arnold-press.mp4'), type: 'video', aspectRatio: 1.0 },
  'dumbbell-lateral-raise': { source: require('../../assets/vital/dumbbell-lateral-raise.mp4'), type: 'video', aspectRatio: 1.0 },
  'dumbbell-seated-lateral-raise': { source: require('../../assets/vital/Dumbbell-Seated-Lateral-raise.mp4'), type: 'video', aspectRatio: 1.778 },
  'cable-lateral-raise': { source: require('../../assets/vital/cable-lateral-raise.mp4'), type: 'video', aspectRatio: 1.778 },
  'rear-delt-fly': { source: require('../../assets/vital/rear-delt-fly.mp4'), type: 'video', aspectRatio: 1.0 },
  'dumbbell-front-raise': { source: require('../../assets/vital/dumbbell-front-raise.mp4'), type: 'video', aspectRatio: 1.0 },
  'plate-front-raise': { source: require('../../assets/vital/plate-front-raise.mp4'), type: 'video', aspectRatio: 1.0 },
  'upright-row': { source: require('../../assets/vital/upright-row.mp4'), type: 'video', aspectRatio: 1.778 },

  // ── Arms ──
  'dumbbell-curl': { source: require('../../assets/vital/dumbbell-curl.mp4'), type: 'video', aspectRatio: 1.0 },
  'dumbbell-hammer-curl': { source: require('../../assets/vital/dumbbell-hammer-curl.mp4'), type: 'video', aspectRatio: 1.0 },
  'dumbbell-incline-curl': { source: require('../../assets/vital/dumbbell-incline-curl.mp4'), type: 'video', aspectRatio: 1.0 },
  'cable-curl': { source: require('../../assets/vital/cable-curl.mp4'), type: 'video', aspectRatio: 1.778 },
  'cable-rope-hammer-curl': { source: require('../../assets/vital/Cable-rope-Hammer-Curl.mp4'), type: 'video', aspectRatio: 1.778 },
  'concentration-curl': { source: require('../../assets/vital/concentration-curl.mp4'), type: 'video', aspectRatio: 1.778 },
  'barbell-preacher-curl-ez-bar': { source: require('../../assets/vital/barbell-preacher-curl-ez-bar.mp4'), type: 'video', aspectRatio: 1.0 },
  'triceps-pushdown-cable': { source: require('../../assets/vital/triceps-pushdown-cable.mp4'), type: 'video', aspectRatio: 1.0 },
  'skull-crusher': { source: require('../../assets/vital/skull-crusher.mp4'), type: 'video', aspectRatio: 1.778 },
  'dumbbell-overhead-triceps-extension': { source: require('../../assets/vital/dumbbell-overhead-triceps-extension.mp4'), type: 'video', aspectRatio: 1.0 },
  'cable-overhead-triceps-extension': { source: require('../../assets/vital/Cable-Overhead-Triceps-Extension-rope.mp4'), type: 'video', aspectRatio: 1.778 },
  'close-grip-bench-press': { source: require('../../assets/vital/close-grip-bench-Press.mp4'), type: 'video', aspectRatio: 1.778 },
  'triceps-kickback': { source: require('../../assets/vital/triceps-kickback.mp4'), type: 'video', aspectRatio: 1.778 },

  // ── Legs / Lower Body ──
  'barbell-back-squat': { source: require('../../assets/vital/barbell-back-squat.mp4'), type: 'video', aspectRatio: 1.0 },
  'front-squat': { source: require('../../assets/vital/front-squat.mp4'), type: 'video', aspectRatio: 1.778 },
  'hack-squat': { source: require('../../assets/vital/hack-squat.mp4'), type: 'video', aspectRatio: 1.778 },
  'dumbbell-goblet-squat': { source: require('../../assets/vital/dumbbell-goblet-squat.mp4'), type: 'video', aspectRatio: 1.0 },
  'leg-press-machine': { source: require('../../assets/vital/leg-press-machine.mp4'), type: 'video', aspectRatio: 1.0 },
  'leg-extension-machine': { source: require('../../assets/vital/leg-extension-machine.mp4'), type: 'video', aspectRatio: 1.0 },
  'seated-leg-curl-machine': { source: require('../../assets/vital/seated-leg-curl-machine.mp4'), type: 'video', aspectRatio: 1.0 },
  'lying-leg-curl': { source: require('../../assets/vital/lying-leg-curl.mp4'), type: 'video', aspectRatio: 1.778 },
  'nordic-hamstring-curl': { source: require('../../assets/vital/Nordic-Hamstring-Curl.mp4'), type: 'video', aspectRatio: 1.778 },
  'barbell-deadlift': { source: require('../../assets/vital/barbell-deadlift.mp4'), type: 'video', aspectRatio: 1.0 },
  'barbell-romanian-deadlift': { source: require('../../assets/vital/barbell-romanian-deadlift.mp4'), type: 'video', aspectRatio: 1.0 },
  'barbell-deadlift-sumo': { source: require('../../assets/vital/barbell-deadlift-sumo.mp4'), type: 'video', aspectRatio: 1.0 },
  'barbell-good-morning': { source: require('../../assets/vital/barbell-good-morning.mp4'), type: 'video', aspectRatio: 1.0 },
  'barbell-hip-thrust': { source: require('../../assets/vital/barbell-hip-thrust.mp4'), type: 'video', aspectRatio: 1.0 },
  'glute-bridge': { source: require('../../assets/vital/Glute-Bridge.mp4'), type: 'video', aspectRatio: 1.778 },
  'glute-kickback': { source: require('../../assets/vital/glute-kickback.mp4'), type: 'video', aspectRatio: 1.778 },
  'dumbbell-lunge': { source: require('../../assets/vital/dumbbell-lunge.mp4'), type: 'video', aspectRatio: 1.844 },
  'barbell-reverse-lunges': { source: require('../../assets/vital/barbell-reverse-lunges.mp4'), type: 'video', aspectRatio: 1.0 },
  'dumbbell-bulgarian-split-squat': { source: require('../../assets/vital/dumbbell-bulgarian-split-squat.mp4'), type: 'video', aspectRatio: 1.0 },
  'standing-calf-raise': { source: require('../../assets/vital/standing-calf-raise.mp4'), type: 'video', aspectRatio: 1.778 },
  'seated-calf-raise': { source: require('../../assets/vital/seated-calf-raise.mp4'), type: 'video', aspectRatio: 1.778 },
  'leg-press-calf-raise': { source: require('../../assets/vital/Leg-Press-Calf-raise.mp4'), type: 'video', aspectRatio: 1.778 },
  'dumbbell-standing-calf-raise': { source: require('../../assets/vital/Dumbbell-Standing-Calf-Raise.mp4'), type: 'video', aspectRatio: 1.778 },
  'pistol-squat': { source: require('../../assets/vital/pistol-squat.mp4'), type: 'video', aspectRatio: 1.0 },
  'kettlebell-swing': { source: require('../../assets/vital/kettlebell-swing.mp4'), type: 'video', aspectRatio: 1.0 },

  // ── Core & Cardio ──
  'plank': { source: require('../../assets/vital/plank.mp4'), type: 'video', aspectRatio: 1.0 },
  'side-plank': { source: require('../../assets/vital/side-plank.mp4'), type: 'video', aspectRatio: 1.778 },
  'plate-russian-twist': { source: require('../../assets/vital/plate-russian-twist.mp4'), type: 'video', aspectRatio: 1.0 },
  'hanging-leg-raises': { source: require('../../assets/vital/hanging-leg-raises.mp4'), type: 'video', aspectRatio: 1.0 },
  'cable-crunch': { source: require('../../assets/vital/cable-crunch.mp4'), type: 'video', aspectRatio: 1.778 },
  'bicycle-crunch': { source: require('../../assets/vital/bicycle-crunch.mp4'), type: 'video', aspectRatio: 1.778 },
  'dead-bug': { source: require('../../assets/vital/dead-bug.mp4'), type: 'video', aspectRatio: 1.778 },
  'ab-wheel-rollout': { source: require('../../assets/vital/ab-wheel-rollout.mp4'), type: 'video', aspectRatio: 1.778 },
  'sit-ups': { source: require('../../assets/vital/sit-ups.mp4'), type: 'video', aspectRatio: 1.0 },
  'treadmill-run': { source: require('../../assets/vital/treadmill-run.mp4'), type: 'video', aspectRatio: 1.0 },
  'stationary-bike-cycling': { source: require('../../assets/vital/stationary-bike-cycling.mp4'), type: 'video', aspectRatio: 1.0 },
  'rowing-machine': { source: require('../../assets/vital/rowing-machine.mp4'), type: 'video', aspectRatio: 1.0 },
  'stair-climber': { source: require('../../assets/vital/stair-climber.mp4'), type: 'video', aspectRatio: 1.778 },
  'mountain-climber': { source: require('../../assets/vital/mountain-climber.mp4'), type: 'video', aspectRatio: 1.778 },
  'burpee': { source: require('../../assets/vital/burpee.mp4'), type: 'video', aspectRatio: 1.778 },
  'battle-ropes': { source: require('../../assets/vital/Battle-Ropes.mp4'), type: 'video', aspectRatio: 1.778 },
};

/**
 * Exact Exercise ID → Animation asset key mapping.
 * Only exact matching animations are mapped. Exercises without an exact
 * animation match do NOT show misleading movements and instead render
 * the anatomical muscle target heatmap directly.
 */
const EXERCISE_ANIMATIONS: Record<string, string> = {
  // ── Chest ──
  'bench-press': 'barbell-bench-press-flat',
  'incline-bench-press': 'barbell-incline-bench-press',
  'decline-bench-press': 'decline-bench-press',
  'dumbbell-bench-press': 'dumbbell-bench-press-flat',
  'incline-dumbbell-bench-press': 'incline-dumbbell-bench-press',
  'chest-fly': 'dumbbell-flys-flat',
  'incline-dumbbell-fly': 'dumbbell-flys-incline',
  'cable-fly': 'cable-chest-fly',
  'pec-deck': 'pec-deck-machine-fly',
  'machine-press': 'machine-chest-press',
  'dips': 'chest-dips',
  'push-up': 'push-ups',
  'decline-push-up': 'decline-push-ups',
  'diamond-push-up': 'diamond-push-up',
  'dumbbell-pullover': 'dumbbell-pullover',

  // ── Back ──
  'lat-pulldown': 'lat-pulldown',
  'band-pulldown': 'resistance-band-pulldown',
  'pull-up': 'pull-up',
  'assisted-pullup': 'assisted-pull-up',
  'chin-up': 'chin-up-leg-folded',
  'barbell-row': 'bent-over-barbell-row',
  'dumbbell-row': 'dumbbell-row',
  'barbell-incline-row': 'barbell-incline-row',
  'seated-cable-row': 'seated-cable-row',
  't-bar-row': 'barbell-t-bar-row',
  'machine-row': 'machine-row',
  'face-pull': 'face-pull',
  'hyperextension': 'back-extension',
  'dumbbell-shrug': 'dumbbell-shrug',
  'shrug': 'barbell-shrug',

  // ── Shoulders ──
  'shoulder-press': 'dumbbell-overhead-press',
  'machine-shoulder-press': 'machine-shoulder-press',
  'arnold-press': 'dumbbell-arnold-press',
  'lateral-raise': 'dumbbell-lateral-raise',
  'seated-dumbbell-lateral-raise': 'dumbbell-seated-lateral-raise',
  'cable-lateral-raise': 'cable-lateral-raise',
  'rear-delt-fly': 'rear-delt-fly',
  'front-raise': 'dumbbell-front-raise',
  'plate-front-raise': 'plate-front-raise',
  'upright-row': 'upright-row',

  // ── Arms ──
  'bicep-curl': 'dumbbell-curl',
  'hammer-curl': 'dumbbell-hammer-curl',
  'incline-curl': 'dumbbell-incline-curl',
  'cable-curl': 'cable-curl',
  'cable-rope-hammer-curl': 'cable-rope-hammer-curl',
  'concentration-curl': 'concentration-curl',
  'preacher-curl': 'barbell-preacher-curl-ez-bar',
  'triceps-pushdown': 'triceps-pushdown-cable',
  'skull-crusher': 'skull-crusher',
  'overhead-extension': 'dumbbell-overhead-triceps-extension',
  'cable-overhead-triceps-extension': 'cable-overhead-triceps-extension',
  'close-grip-bench-press': 'close-grip-bench-press',
  'triceps-kickback': 'triceps-kickback',

  // ── Legs / Lower Body ──
  'squat': 'barbell-back-squat',
  'front-squat': 'front-squat',
  'hack-squat': 'hack-squat',
  'goblet-squat': 'dumbbell-goblet-squat',
  'leg-press': 'leg-press-machine',
  'leg-extension': 'leg-extension-machine',
  'leg-curl': 'seated-leg-curl-machine',
  'lying-leg-curl': 'lying-leg-curl',
  'nordic-curl': 'nordic-hamstring-curl',
  'deadlift': 'barbell-deadlift',
  'romanian-deadlift': 'barbell-romanian-deadlift',
  'sumo-deadlift': 'barbell-deadlift-sumo',
  'good-morning': 'barbell-good-morning',
  'hip-thrust': 'barbell-hip-thrust',
  'glute-bridge': 'glute-bridge',
  'cable-kickback': 'glute-kickback',
  'lunge': 'dumbbell-lunge',
  'barbell-reverse-lunge': 'barbell-reverse-lunges',
  'bulgarian-split-squat': 'dumbbell-bulgarian-split-squat',
  'calf-raise': 'standing-calf-raise',
  'seated-calf-raise': 'seated-calf-raise',
  'leg-press-calf-raise': 'leg-press-calf-raise',
  'dumbbell-standing-calf-raise': 'dumbbell-standing-calf-raise',
  'single-leg-calf-raise': 'dumbbell-standing-calf-raise',
  'pistol-squat': 'pistol-squat',
  'kettlebell-swing': 'kettlebell-swing',

  // ── Core & Cardio ──
  'plank': 'plank',
  'side-plank': 'side-plank',
  'russian-twist': 'plate-russian-twist',
  'hanging-leg-raise': 'hanging-leg-raises',
  'crunch': 'cable-crunch',
  'bicycle-crunch': 'bicycle-crunch',
  'dead-bug': 'dead-bug',
  'ab-wheel-rollout': 'ab-wheel-rollout',
  'sit-ups': 'sit-ups',
  'treadmill-run': 'treadmill-run',
  'cycling': 'stationary-bike-cycling',
  'rower': 'rowing-machine',
  'stair-climber': 'stair-climber',
  'mountain-climber': 'mountain-climber',
  'burpees': 'burpee',
  'battle-ropes': 'battle-ropes',
};

/**
 * Returns the exact animation asset for an exercise, or null when it has none.
 */
export function getExerciseAnimation(exerciseId: string): AnimationAsset | null {
  const base = EXERCISE_ANIMATIONS[exerciseId];
  if (!base) return null;
  return ANIMATION_ASSETS[base] ?? null;
}
