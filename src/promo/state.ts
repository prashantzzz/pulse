/* eslint-disable react-hooks/refs --
 * Promo motion code keeps Animated values, cascade slots and play keys in refs:
 * they are imperative animation state that must not trigger re-renders. Slot
 * assignment intentionally happens during render (parents before children) so
 * cascades order top-down. Same convention as draggable-plan-list.tsx.
 */
/**
 * Promo mock state — a "real athlete" snapshot built from the tracker CSV.
 *
 * The promo build never signs in to Supabase; this module fabricates the live
 * Zustand store contents (workouts, plans, profile, measurements, defaults) so
 * every screen renders the same rich data the athlete would see, with the most
 * recent session re-timed to "today" so the Home hero, streaks and PRs are all
 * alive during recording.
 */
import { SEED_FAVORITES, SEED_MEASUREMENTS, SEED_PLANS, SEED_PROFILE } from '../data/seed';
import type { ManualPR, Workout } from '../types';
import { PROMO } from './config';
import { PROMO_SEED_WORKOUTS } from './seed.generated';

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function shiftIso(iso: string | null | undefined, delta: number): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  return new Date(t + delta).toISOString();
}

/**
 * Shift the whole log forward by whole days so the newest session lands on
 * "today" (the recording day), preserving time-of-day and the spacing between
 * sessions. The newest session is then re-timed to finish ~75 minutes ago, so
 * Home reads as a fresh "COMPLETED TODAY" celebration.
 */
function buildWorkouts(): Workout[] {
  const sorted = [...PROMO_SEED_WORKOUTS].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
  if (!PROMO.shiftToToday || sorted.length === 0) return sorted;

  const latest = sorted[sorted.length - 1];
  const latestEnd = new Date(latest.endTime || latest.startTime).getTime();
  const delta = startOfDay(Date.now()) - startOfDay(latestEnd);

  const shifted: Workout[] = sorted.map((w) => ({
    ...w,
    startTime: shiftIso(w.startTime, delta) ?? w.startTime,
    endTime: shiftIso(w.endTime || w.startTime, delta) ?? w.endTime,
    exercises: w.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({ ...s, completedAt: shiftIso(s.completedAt, delta) })),
    })),
  }));

  if (PROMO.clampLatestToNow) {
    const last = shifted[shifted.length - 1];
    const rawStart = new Date(last.startTime).getTime();
    const rawEnd = new Date(last.endTime).getTime();
    const duration = Math.max(30 * MINUTE_MS, rawEnd - rawStart);
    const end = Date.now() - 75 * MINUTE_MS;
    const finishedAt = new Date(end).toISOString();
    shifted[shifted.length - 1] = {
      ...last,
      startTime: new Date(end - duration).toISOString(),
      endTime: finishedAt,
      exercises: last.exercises.map((ex) => ({
        ...ex,
        sets: ex.sets.map((s) => (s.completedAt ? { ...s, completedAt: finishedAt } : s)),
      })),
    };
  }

  return shifted;
}

/** Latest working weight/reps per exercise — mirrors what completeSet remembers. */
function computeExerciseDefaults(workouts: Workout[]): Record<string, { weightKg: number; reps: number }> {
  const defaults: Record<string, { weightKg: number; reps: number }> = {};
  for (const w of workouts) {
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        if (s.completed && s.setType !== 'warmup' && s.weightKg != null && s.reps != null) {
          defaults[ex.exerciseId] = { weightKg: s.weightKg, reps: s.reps };
        }
      }
    }
  }
  return defaults;
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

/** A few manual records so the Records screen shows both data sources. */
function buildManualPRs(): ManualPR[] {
  return [
    { id: 'promo-pr-bench', exerciseId: 'bench-press', weightKg: 70, reps: 4, date: daysAgo(2) },
    { id: 'promo-pr-squat', exerciseId: 'squat', weightKg: 100, reps: 7, date: daysAgo(1) },
    { id: 'promo-pr-deadlift', exerciseId: 'deadlift', weightKg: 95, reps: 8, date: daysAgo(6) },
  ];
}

/** Full promo snapshot for the pulse store. */
export function buildPromoPulseState() {
  const workouts = buildWorkouts();
  return {
    onboarded: true,
    seeded: true,
    accentKey: 'mint' as const,
    weightUnit: 'kg' as const,
    profile: SEED_PROFILE,
    workouts,
    plans: SEED_PLANS,
    measurements: SEED_MEASUREMENTS,
    favorites: [...SEED_FAVORITES],
    friends: [] as never[],
    manualPRs: buildManualPRs(),
    exerciseDefaults: computeExerciseDefaults(workouts),
    activeWorkout: null as null,
    autoRestTimer: true,
    hapticsEnabled: true,
  };
}
