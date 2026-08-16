/**
 * Looping exercise animations, bundled locally.
 *
 * Source: the free `exercises-dataset` (github.com/hasaneyldrm/exercises-dataset,
 * MIT code/data). The animation media is © Gym visual (gymvisual.com) — used
 * with permission per the dataset's NOTICE; see NOTICE.md for attribution.
 *
 * Exercises without an entry here fall back to the built-in animated SVG figure.
 */

export const EXERCISE_GIFS: Record<string, number> = {
  'bench-press': require('../../assets/exercises/bench-press.gif'),
  'dumbbell-bench-press': require('../../assets/exercises/dumbbell-bench-press.gif'),
  'incline-bench-press': require('../../assets/exercises/incline-bench-press.gif'),
  'shoulder-press': require('../../assets/exercises/shoulder-press.gif'),
  'arnold-press': require('../../assets/exercises/arnold-press.gif'),
  'lateral-raise': require('../../assets/exercises/lateral-raise.gif'),
  'chest-fly': require('../../assets/exercises/chest-fly.gif'),
  'lat-pulldown': require('../../assets/exercises/lat-pulldown.gif'),
  'seated-cable-row': require('../../assets/exercises/seated-cable-row.gif'),
  'dumbbell-row': require('../../assets/exercises/dumbbell-row.gif'),
  'barbell-row': require('../../assets/exercises/barbell-row.gif'),
  'machine-row': require('../../assets/exercises/machine-row.gif'),
  'pull-up': require('../../assets/exercises/pull-up.gif'),
  'bicep-curl': require('../../assets/exercises/bicep-curl.gif'),
  'hammer-curl': require('../../assets/exercises/hammer-curl.gif'),
  'triceps-pushdown': require('../../assets/exercises/triceps-pushdown.gif'),
  'overhead-triceps-extension': require('../../assets/exercises/overhead-triceps-extension.gif'),
  squat: require('../../assets/exercises/squat.gif'),
  'goblet-squat': require('../../assets/exercises/goblet-squat.gif'),
  'romanian-deadlift': require('../../assets/exercises/romanian-deadlift.gif'),
  deadlift: require('../../assets/exercises/deadlift.gif'),
  'leg-press': require('../../assets/exercises/leg-press.gif'),
  'leg-extension': require('../../assets/exercises/leg-extension.gif'),
  'seated-leg-curl': require('../../assets/exercises/seated-leg-curl.gif'),
  'standing-calf-raise': require('../../assets/exercises/standing-calf-raise.gif'),
  'dumbbell-lunge': require('../../assets/exercises/dumbbell-lunge.gif'),
  plank: require('../../assets/exercises/plank.gif'),
  'russian-twist': require('../../assets/exercises/russian-twist.gif'),
  'treadmill-run': require('../../assets/exercises/treadmill-run.gif'),
  'stationary-bike': require('../../assets/exercises/stationary-bike.gif'),
};

export function hasExerciseGif(exerciseId: string): boolean {
  return exerciseId in EXERCISE_GIFS;
}
