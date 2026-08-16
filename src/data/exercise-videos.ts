/**
 * Looping exercise animations (HD MP4), bundled locally.
 *
 * Source: the free "Vital Animations Free Pack" (50 HD 1080p gym exercise
 * loops + JSON metadata, same schema as the full Vital dataset). The files in
 * assets/vital/ are the pack's original 1080p MP4s, unmodified — they are
 * shot on a light studio background and are shown on a matching light card in
 * the app (no chroma-keying or blending).
 *
 * Exercises without an entry here fall back to the built-in animated SVG
 * figure (see components/animation.tsx).
 */

export const EXERCISE_VIDEOS: Record<string, number> = {
  'chest-fly': require('../../assets/vital/0051.mp4'), // pec deck machine fly
  squat: require('../../assets/vital/0054.mp4'), // barbell back squat
  'hip-thrust': require('../../assets/vital/0057.mp4'), // barbell hip thrust
  lunge: require('../../assets/vital/0059.mp4'), // barbell reverse lunges
  deadlift: require('../../assets/vital/0060.mp4'), // barbell romanian deadlift (closest hinge in the pack)
  'romanian-deadlift': require('../../assets/vital/0060.mp4'), // barbell romanian deadlift
  cycling: require('../../assets/vital/0062.mp4'), // cycling
  'goblet-squat': require('../../assets/vital/0064.mp4'), // dumbbell goblet squat
  'leg-extension': require('../../assets/vital/0073.mp4'), // leg extension machine
  'leg-press': require('../../assets/vital/0074.mp4'), // leg press machine
  rower: require('../../assets/vital/0077.mp4'), // rowing machine
  'treadmill-run': require('../../assets/vital/0078.mp4'), // run on treadmill
  'leg-curl': require('../../assets/vital/0079.mp4'), // seated leg curl machine
  'triceps-pushdown': require('../../assets/vital/0085.mp4'), // triceps pushdown (cable - rope)
  'arnold-press': require('../../assets/vital/0087.mp4'), // arnold press dumbbell
  'shoulder-press': require('../../assets/vital/0090.mp4'), // dumbbell overhead standard
  'lateral-raise': require('../../assets/vital/0096.mp4'), // lateral raises (dumbbell)
  'rear-delt-fly': require('../../assets/vital/0099.mp4'), // rear delt fly (reverse pec deck)
};

export function hasExerciseVideo(exerciseId: string): boolean {
  return exerciseId in EXERCISE_VIDEOS;
}
