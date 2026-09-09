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
export function computeAchievements(workouts: Workout[], unit: 'kg' | 'lbs' = 'kg'): Achievement[] {
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

  const benchSets = countSetsOf(PUSH_CHEST);
  const squatSets = countSetsOf(SQUAT_FAMILY);
  const pullSets = countSetsOf(PULL_FAMILY);
  const musclesTrainedCount = musclesTrained.size;

  const isLbs = unit === 'lbs';

  return [
    { icon: 'trophy', title: 'First PR', desc: 'Break your first personal record', earned: prCount > 0, cat: 'Strength' },
    { icon: 'star', title: '10 PRs', desc: 'Set 10 personal records', earned: prCount >= 10, progress: Math.min(1, prCount / 10), cat: 'Strength' },
    { icon: 'ribbon', title: '25 PRs', desc: 'Set 25 personal records', earned: prCount >= 25, progress: Math.min(1, prCount / 25), cat: 'Strength' },
    {
      icon: 'flash',
      title: 'Heavy Hitter',
      desc: isLbs ? 'Move 175+ lbs on any lift' : 'Move 80+ kg on any lift',
      earned: anySetAtLeast(isLbs ? 175 / 2.20462 : 80),
      cat: 'Strength',
    },
    {
      icon: 'fitness',
      title: isLbs ? '225 lb Club' : '100 kg Club',
      desc: isLbs ? 'Lift 225+ lbs on a working set' : 'Lift 100+ kg on a working set',
      earned: anySetAtLeast(isLbs ? 225 / 2.20462 : 100),
      cat: 'Strength',
    },
    {
      icon: 'trophy',
      title: '3-Plate Beast',
      desc: isLbs ? 'Lift 315+ lbs on a working set' : 'Lift 140+ kg on a working set',
      earned: anySetAtLeast(isLbs ? 315 / 2.20462 : 140),
      cat: 'Strength',
    },
    { icon: 'barbell', title: 'Bench Boss', desc: 'Log 60 chest pressing sets', earned: benchSets >= 60, progress: Math.min(1, benchSets / 60), cat: 'Strength' },
    { icon: 'trending-up', title: 'Squat Specialist', desc: 'Log 60 squat-family sets', earned: squatSets >= 60, progress: Math.min(1, squatSets / 60), cat: 'Strength' },
    { icon: 'layers', title: 'Back Builder', desc: 'Log 60 pulling sets', earned: pullSets >= 60, progress: Math.min(1, pullSets / 60), cat: 'Strength' },
    { icon: 'barbell', title: '25 Workouts', desc: 'Complete 25 training sessions', earned: workouts.length >= 25, progress: Math.min(1, workouts.length / 25), cat: 'Consistency' },
    { icon: 'calendar', title: 'Century Club', desc: 'Complete 100 workouts', earned: workouts.length >= 100, progress: Math.min(1, workouts.length / 100), cat: 'Consistency' },
    { icon: 'medal', title: 'Iron Veteran', desc: 'Complete 250 workouts', earned: workouts.length >= 250, progress: Math.min(1, workouts.length / 250), cat: 'Consistency' },
    { icon: 'layers', title: '500 Sets', desc: 'Log 500 working sets', earned: sets >= 500, progress: Math.min(1, sets / 500), cat: 'Volume' },
    { icon: 'speedometer', title: '1,000 Sets', desc: 'Log 1,000 working sets', earned: sets >= 1000, progress: Math.min(1, sets / 1000), cat: 'Volume' },
    {
      icon: 'scale',
      title: isLbs ? '500K lbs Lifted' : '250K kg Lifted',
      desc: isLbs ? 'Move 500,000 lbs total volume' : 'Move 250,000 kg total volume',
      earned: (isLbs ? volume * 2.20462 : volume) >= (isLbs ? 500000 : 250000),
      progress: Math.min(1, (isLbs ? volume * 2.20462 : volume) / (isLbs ? 500000 : 250000)),
      cat: 'Volume',
    },
    {
      icon: 'diamond',
      title: isLbs ? 'Two Million Lbs Titan' : 'Million Kg Titan',
      desc: isLbs ? 'Move 2,000,000 lbs total volume' : 'Move 1,000,000 kg total volume',
      earned: (isLbs ? volume * 2.20462 : volume) >= (isLbs ? 2000000 : 1000000),
      progress: Math.min(1, (isLbs ? volume * 2.20462 : volume) / (isLbs ? 2000000 : 1000000)),
      cat: 'Volume',
    },
    { icon: 'git-network', title: 'Exercise Variety', desc: 'Train with 20+ distinct exercises', earned: exercisesUsed >= 20, progress: Math.min(1, exercisesUsed / 20), cat: 'Volume' },
    { icon: 'body', title: 'Full Body', desc: 'Train 6+ muscle groups', earned: musclesTrainedCount >= 6, progress: Math.min(1, musclesTrainedCount / 6), cat: 'Volume' },
    { icon: 'flame', title: '30 Day Streak', desc: 'Train 30 days in a row', earned: longestStreak(workouts) >= 30, progress: Math.min(1, longestStreak(workouts) / 30), cat: 'Consistency' },
    {
      icon: 'speedometer',
      title: 'Beast Mode Session',
      desc: isLbs ? 'Hit 22,000 lbs in a single workout' : 'Hit 10,000 kg in a single workout',
      earned: (isLbs ? biggestWorkoutVolume * 2.20462 : biggestWorkoutVolume) >= (isLbs ? 22000 : 10000),
      progress: Math.min(1, (isLbs ? biggestWorkoutVolume * 2.20462 : biggestWorkoutVolume) / (isLbs ? 22000 : 10000)),
      cat: 'Volume',
    },
  ];
}
