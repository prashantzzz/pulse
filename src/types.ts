/**
 * PULSE data model.
 *
 * Designed to map 1:1 onto a CSV export of workout logs:
 *   Workout title, Start time, End time, Description, Exercise title, Superset ID,
 *   Exercise notes, Set index, Set type, Weight (kg), Repetitions, Distance (km),
 *   Duration (sec), RPE, Notes
 *
 * Strength sets use weight+reps; cardio sets use distance+duration;
 * advanced users can optionally use RPE, notes and supersets — no redesign needed.
 */

// ---------------------------------------------------------------------------
// Exercises (knowledge base)
// ---------------------------------------------------------------------------

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Core'
  | 'Forearms'
  | 'Cardio';

export type MuscleSlug =
  | 'chest'
  | 'upper-back'
  | 'lower-back'
  | 'trapezius'
  | 'deltoids'
  | 'biceps'
  | 'triceps'
  | 'abs'
  | 'obliques'
  | 'forearm'
  | 'quadriceps'
  | 'adductors'
  | 'hamstring'
  | 'gluteal'
  | 'calves'
  | 'neck'
  | 'tibialis';

export type Equipment =
  | 'Barbell'
  | 'Dumbbell'
  | 'Machine'
  | 'Cable'
  | 'Bodyweight'
  | 'Kettlebell'
  | 'Plate'
  | 'Band'
  | 'Cardio';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type MovementPattern = 'Push' | 'Pull' | 'Legs' | 'Core' | 'Cardio';
export type BodyRegion = 'Upper' | 'Lower' | 'Core' | 'Full Body';

/** Which animation keyframe set to use in the exercise figure */
export type AnimationKey =
  | 'bench'
  | 'press'
  | 'raise'
  | 'fly'
  | 'row'
  | 'pulldown'
  | 'curl'
  | 'pushdown'
  | 'squat'
  | 'deadlift'
  | 'lunge'
  | 'calf'
  | 'crunch'
  | 'plank'
  | 'run';

export interface ExerciseStep {
  title: string;
  detail: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  targetSlugs?: MuscleSlug[];
  secondarySlugs?: MuscleSlug[];
  equipment: Equipment;
  difficulty: Difficulty;
  type: 'Compound' | 'Isolation';
  movement: MovementPattern;
  region: BodyRegion;
  location: 'Gym' | 'Home' | 'Both';
  beginnerFriendly: boolean;
  /** animation key */
  animation: AnimationKey;
  /** common alternative names that resolve to this canonical id (e.g. "Flat Bench Press" → bench-press) */
  aliases?: string[];
  about: string;
  steps: ExerciseStep[];
  commonMistakes: string[];
  breathing: string;
  repRange: string;
  beginnerTips: string[];
  progressionTips: string[];
  safetyTips: string[];
  /** ids of alternative exercises */
  alternatives: string[];
}

// ---------------------------------------------------------------------------
// Logged workouts (CSV-compatible)
// ---------------------------------------------------------------------------

export type SetType = 'warmup' | 'working' | 'failure' | 'drop' | 'cooldown' | 'cardio';

export interface ExerciseSet {
  id: string;
  /** 1-based index within the exercise */
  setIndex: number;
  setType: SetType;
  weightKg: number | null;
  reps: number | null;
  distanceKm: number | null;
  durationSec: number | null;
  rpe: number | null;
  notes: string | null;
  /** groups superset exercises together */
  supersetId: string | null;
  completed: boolean;
  completedAt: string | null;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  order: number;
  notes: string | null;
  /** planned number of sets (used to pre-fill logging) */
  plannedSets: number;
  /** planned target reps, e.g. "6-10" */
  targetReps: string;
  sets: ExerciseSet[];
}

export interface RestTimerState {
  targetEndTimeMs: number;
  totalSeconds: number;
  exerciseName: string;
  reason: string;
  paused: boolean;
  remainingSecWhenPaused?: number;
  completedSetInfo?: string;
  nextSetInfo?: string;
}

export interface Workout {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  exercises: WorkoutExercise[];
  source?: 'seed' | 'user';
  /** originating plan ID if started from a WorkoutPlan */
  planId?: string | null;
  /** pause/resume state for an in-progress workout (never persisted to history) */
  paused?: boolean;
  pausedAt?: string | null;
  /** in-progress adaptive rest timer (never persisted to history) */
  restTimer?: RestTimerState | null;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPct: number | null;
  chestCm: number | null;
  waistCm: number | null;
  bicepsCm: number | null;
}

/** A personal record logged manually (outside a workout session). */
export interface ManualPR {
  id: string;
  exerciseId: string;
  weightKg: number;
  reps: number;
  /** ISO date the record was set */
  date: string;
}

export interface UserProfile {
  name: string;
  /** body-model used by the muscle map (falls back to 'male') */
  gender?: 'male' | 'female';
  goal: string[];
  experience: 'Beginner' | 'Intermediate' | 'Advanced';
  frequencyPerWeek: number;
  equipment: string[];
  style: string[];
  trainingAgeMonths: number;
  onboarded: boolean;
  heightCm?: number;
  weightKg?: number;
  weightUnit?: 'kg' | 'lbs';
  avatarUrl?: string;
}

export interface WorkoutPlanExercise {
  exerciseId: string;
  sets: number;
  targetReps: string;
  targetWeightKg?: number | null;
}

/** A workout plan (template) the user can start or build */
export interface WorkoutPlan {
  id: string;
  title: string;
  muscles: string[];
  emoji: string;
  exercises: WorkoutPlanExercise[];
}

// ---------------------------------------------------------------------------
// Active workout (in-progress state)
// ---------------------------------------------------------------------------

export type ActiveWorkout = Workout;

// ---------------------------------------------------------------------------
// Social
// ---------------------------------------------------------------------------

export interface Friend {
  id: string;
  name: string;
  isContact: boolean;
  /** balanced progress score 0-100 */
  score: number;
  workoutsThisWeek: number;
  prsThisMonth: number;
  streak: number;
  volumeKg: number;
  avatarHue: number;
}

// ---------------------------------------------------------------------------
// Derived / computed
// ---------------------------------------------------------------------------

export interface SetSummary {
  weightKg: number | null;
  reps: number | null;
}

export interface WorkoutStats {
  volumeKg: number;
  sets: number;
  reps: number;
  durationMin: number;
  exercises: number;
  calories: number;
  muscles: MuscleGroup[];
  distanceKm: number;
}

export interface PR {
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  prevWeightKg: number | null;
  prevReps: number | null;
  kind: 'Weight' | 'Reps' | '1RM' | 'Volume';
  deltaPct: number;
  workoutId: string;
  date: string;
}
