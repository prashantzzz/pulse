import type { IonName } from '../components/ui';
import { EXERCISE_MAP } from '../data/exercises';
import type { MuscleGroup, Workout } from '../types';
import { detectPRs, longestStreak, totalVolume, workoutStats } from './stats';

export interface Achievement {
  icon: IonName;
  title: string;
  desc: string;
  earned: boolean;
  progress?: number;
  cat: string;
}

const EXERCISES_OF = (ids: string[]) => ids;

/** Chest-pressing movements */
const PUSH_CHEST = EXERCISES_OF(['bench-press', 'dumbbell-bench-press', 'incline-bench-press', 'machine-press', 'chest-fly']);
/** Squat / quad-dominant lower-body movements */
const SQUAT_FAMILY = EXERCISES_OF(['squat', 'goblet-squat', 'leg-press', 'leg-extension', 'lunge', 'hip-thrust']);
/** Pulling / back movements */
const PULL_FAMILY = EXERCISES_OF(['lat-pulldown', 'barbell-row', 'seated-cable-row', 'dumbbell-row', 'pull-up', 'machine-row', 'face-pull']);

/**
 * Every achievement in the app, computed live from the logged workouts.
 * Shared by the profile page and the full achievements gallery so the two
 * always agree.
 */
export function computeAchievements(workouts: Workout[]): Achievement[] {
  const volume = totalVolume(workouts);
  const sets = workouts.reduce((s, w) => s + workoutStats(w).sets, 0);
  const prCount = workouts.reduce((n, w) => n + detectPRs(w, workouts).length, 0);
  const exercisesUsed = new Set(workouts.flatMap((w) => w.exercises.map((we) => we.exerciseId))).size;
  const musclesTrained = new Set<MuscleGroup>();
  workouts.forEach((w) =>
    w.exercises.forEach((we) => {
      const mg = EXERCISE_MAP[we.exerciseId]?.muscleGroup;
      if (mg) musclesTrained.add(mg);
    }),
  );

  // completed sets per exercise id
  const setCount: Record<string, number> = {};
  workouts.forEach((w) =>
    w.exercises.forEach((we) => {
      const done = we.sets.filter((s) => s.completed).length;
      if (done > 0) setCount[we.exerciseId] = (setCount[we.exerciseId] ?? 0) + done;
    }),
  );
  const countSetsOf = (ids: string[]) => ids.reduce((n, id) => n + (setCount[id] ?? 0), 0);
  const anySetAtLeast = (kg: number) =>
    workouts.some((w) => w.exercises.some((we) => we.sets.some((s) => (s.weightKg ?? 0) >= kg)));
  const biggestWorkoutVolume = workouts.reduce((best, w) => Math.max(best, workoutStats(w).volumeKg), 0);
  const hasCardio = workouts.some((w) =>
    w.exercises.some((we) => EXERCISE_MAP[we.exerciseId]?.muscleGroup === 'Cardio'),
  );

  const benchSets = countSetsOf(PUSH_CHEST);
  const squatSets = countSetsOf(SQUAT_FAMILY);
  const pullSets = countSetsOf(PULL_FAMILY);
  const musclesTrainedCount = musclesTrained.size;

  return [
    { icon: 'trophy', title: 'First PR', desc: 'Break your first record', earned: prCount > 0, cat: 'Strength' },
    { icon: 'star', title: '5 PRs', desc: 'Set 5 personal records', earned: prCount >= 5, progress: Math.min(1, prCount / 5), cat: 'Strength' },
    { icon: 'flash', title: 'Heavy Hitter', desc: 'Move 60+ kg on a lift', earned: anySetAtLeast(60), cat: 'Strength' },
    { icon: 'barbell', title: 'Bench Boss', desc: 'Log 20 bench press sets', earned: benchSets >= 20, progress: Math.min(1, benchSets / 20), cat: 'Strength' },
    { icon: 'trending-up', title: 'Squat Specialist', desc: 'Log 20 squat-family sets', earned: squatSets >= 20, progress: Math.min(1, squatSets / 20), cat: 'Strength' },
    { icon: 'layers', title: 'Back Builder', desc: 'Log 20 pulling sets', earned: pullSets >= 20, progress: Math.min(1, pullSets / 20), cat: 'Strength' },
    { icon: 'fitness', title: '100 kg Club', desc: 'Lift 100 kg on any set', earned: anySetAtLeast(100), cat: 'Strength' },
    { icon: 'barbell', title: '10 Workouts', desc: 'Complete 10 sessions', earned: workouts.length >= 10, progress: Math.min(1, workouts.length / 10), cat: 'Consistency' },
    { icon: 'calendar', title: '50 Workouts', desc: 'A serious training block', earned: workouts.length >= 50, progress: Math.min(1, workouts.length / 50), cat: 'Consistency' },
    { icon: 'layers', title: '100 Sets', desc: 'Log 100 working sets', earned: sets >= 100, progress: Math.min(1, sets / 100), cat: 'Volume' },
    { icon: 'scale', title: '100K kg Lifted', desc: 'Move 100,000 kg total', earned: volume >= 100000, progress: Math.min(1, volume / 100000), cat: 'Volume' },
    { icon: 'git-network', title: 'Exercise Variety', desc: 'Train with 12+ exercises', earned: exercisesUsed >= 12, progress: Math.min(1, exercisesUsed / 12), cat: 'Volume' },
    { icon: 'body', title: 'Full Body', desc: 'Train 6+ muscle groups', earned: musclesTrainedCount >= 6, progress: Math.min(1, musclesTrainedCount / 6), cat: 'Volume' },
    { icon: 'walk', title: 'Cardio Crusher', desc: 'Finish a cardio session', earned: hasCardio, cat: 'Consistency' },
    { icon: 'flame', title: '30 Day Streak', desc: 'Train 30 days in a row', earned: longestStreak(workouts) >= 30, progress: Math.min(1, longestStreak(workouts) / 30), cat: 'Consistency' },
    { icon: 'shield-checkmark', title: 'Consistency Master', desc: '4+ sessions/week for a month', earned: workouts.length >= 16, progress: Math.min(1, workouts.length / 16), cat: 'Consistency' },
    { icon: 'speedometer', title: 'Volume Machine', desc: 'Hit 3,000 kg in one workout', earned: biggestWorkoutVolume >= 3000, progress: Math.min(1, biggestWorkoutVolume / 3000), cat: 'Volume' },
  ];
}
