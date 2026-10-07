import { EXERCISE_MAP } from '../data/exercises';
import type { ManualPR, Workout } from '../types';
import { bestForExercise, e1rm } from './stats';

/**
 * Records data layer for the Progress → Records tab.
 *
 * Everything here is derived from the user's real workout history (plus their
 * manually logged PRs) — no placeholders, no synthetic numbers. The metrics:
 * - PR events: every time a completed set sets a new all-time best for its
 *   exercise (estimated 1RM for weighted lifts, reps for bodyweight/cardio,
 *   matching the detectPRs semantics).
 * - Best 1RM: the highest estimated 1RM ever recorded, per exercise and overall.
 */

/** A new all-time best achieved on a specific date. */
export interface PrEvent {
  exerciseId: string;
  date: string;
  /** Estimated 1RM for weighted lifts; reps for bodyweight/cardio */
  value: number;
  kind: '1RM' | 'Reps';
  weightKg: number;
  reps: number;
}

function monthStart(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

function monthDiff(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

/**
 * Chronological list of all-time-best events: one entry each time a completed
 * set beats the previous best for its exercise.
 */
export function prTimeline(workouts: Workout[]): PrEvent[] {
  const sorted = [...workouts].sort(
    (a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime(),
  );
  const bestByExercise = new Map<string, number>();
  const events: PrEvent[] = [];

  for (const w of sorted) {
    for (const we of w.exercises) {
      const ex = EXERCISE_MAP[we.exerciseId];
      const isBodyweight = ex?.equipment === 'Bodyweight' || ex?.movement === 'Cardio';
      for (const s of we.sets) {
        if (!s.completed || s.reps == null) continue;
        const weightKg = s.weightKg ?? (isBodyweight ? 0 : null);
        if (weightKg == null) continue;

        const kind: PrEvent['kind'] = weightKg > 0 ? '1RM' : 'Reps';
        const value = kind === '1RM' ? e1rm(weightKg, s.reps) : s.reps;
        const previous = bestByExercise.get(we.exerciseId);
        if (previous != null && value <= previous) continue;

        bestByExercise.set(we.exerciseId, value);
        events.push({ exerciseId: we.exerciseId, date: w.endTime, value, kind, weightKg, reps: s.reps });
      }
    }
  }
  return events;
}

/** PR counts per calendar month for the last `months` months (oldest → newest). */
export function monthlyPrCounts(
  workouts: Workout[],
  months = 6,
  now: Date = new Date(),
): number[] {
  const counts = new Array<number>(months).fill(0);
  const firstMonth = monthStart(new Date(now.getFullYear(), now.getMonth() - (months - 1), 1));
  const nowMs = now.getTime();

  for (const ev of prTimeline(workouts)) {
    const t = new Date(ev.date).getTime();
    if (t < firstMonth || t > nowMs) continue;
    const index = monthDiff(new Date(firstMonth), new Date(monthStart(new Date(t))));
    if (index >= 0 && index < months) counts[index] += 1;
  }
  return counts;
}

/** Runs `cb` for every completed weighted set (bodyweight/cardio sets skipped). */
function forEachWeightedSet(
  workouts: Workout[],
  cb: (date: string, weightKg: number, reps: number) => void,
) {
  for (const w of workouts) {
    for (const we of w.exercises) {
      const ex = EXERCISE_MAP[we.exerciseId];
      const isBodyweight = ex?.equipment === 'Bodyweight' || ex?.movement === 'Cardio';
      for (const s of we.sets) {
        if (!s.completed || s.reps == null) continue;
        const weightKg = s.weightKg ?? (isBodyweight ? 0 : null);
        if (weightKg == null || weightKg <= 0) continue;
        cb(w.endTime, weightKg, s.reps);
      }
    }
  }
}

/**
 * Cumulative all-time best e1RM at the end of each of the last `months` months
 * (oldest → newest). Manual PRs are included so the chart matches the card value.
 */
export function monthlyBestE1rm(
  workouts: Workout[],
  manualPRs: ManualPR[] = [],
  months = 6,
  now: Date = new Date(),
): number[] {
  const perMonth = new Map<number, number>();
  const note = (date: string, weightKg: number, reps: number) => {
    const key = monthStart(new Date(date));
    perMonth.set(key, Math.max(perMonth.get(key) ?? 0, e1rm(weightKg, reps)));
  };

  forEachWeightedSet(workouts, note);
  for (const pr of manualPRs) {
    if (pr.weightKg > 0) note(pr.date, pr.weightKg, pr.reps);
  }

  const keys = [...perMonth.keys()].sort((a, b) => a - b);
  const out: number[] = [];
  let cursor = 0;
  let running = 0;
  for (let i = months - 1; i >= 0; i -= 1) {
    // Exclusive end of this month (start of the following month).
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime();
    while (cursor < keys.length && keys[cursor] < monthEnd) {
      running = Math.max(running, perMonth.get(keys[cursor])!);
      cursor += 1;
    }
    out.push(running);
  }
  return out;
}

export interface RecordsSummary {
  /** Every new all-time best ever recorded */
  allTimePrs: number;
  /** New bests in the last 3 calendar months */
  recentPrs: number;
  /** New bests in the 3 calendar months before that */
  prevPrs: number;
  /** Highest estimated 1RM ever (workouts + manual PRs) */
  bestE1rm: number;
  /** Highest estimated 1RM before the last 3 calendar months */
  bestE1rmBefore3m: number;
}

export function recordsSummary(
  workouts: Workout[],
  manualPRs: ManualPR[] = [],
  now: Date = new Date(),
): RecordsSummary {
  const events = prTimeline(workouts);
  const recentStart = new Date(now.getFullYear(), now.getMonth() - 3, 1).getTime();
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 6, 1).getTime();

  let recentPrs = 0;
  let prevPrs = 0;
  for (const ev of events) {
    const t = new Date(ev.date).getTime();
    if (t >= recentStart) recentPrs += 1;
    else if (t >= prevStart) prevPrs += 1;
  }

  let bestE1rm = 0;
  let bestE1rmBefore3m = 0;
  const note = (date: string, weightKg: number, reps: number) => {
    const rm = e1rm(weightKg, reps);
    if (rm > bestE1rm) bestE1rm = rm;
    if (new Date(date).getTime() < recentStart && rm > bestE1rmBefore3m) bestE1rmBefore3m = rm;
  };
  forEachWeightedSet(workouts, note);
  for (const pr of manualPRs) {
    if (pr.weightKg > 0) note(pr.date, pr.weightKg, pr.reps);
  }

  return { allTimePrs: events.length, recentPrs, prevPrs, bestE1rm, bestE1rmBefore3m };
}

// ---------------------------------------------------------------------------
// Ranked records list
// ---------------------------------------------------------------------------

export interface RecordEntry {
  id: string;
  exerciseId: string;
  /** The actual set behind the record (matches the displayed e1RM) */
  weightKg: number;
  reps: number;
  e1rmKg: number;
  date?: string;
}

/**
 * One record per exercise: the best of the user's manual PRs and their workout
 * history, keeping whichever has the higher estimated 1RM.
 */
export function buildRecords(workouts: Workout[], manualPRs: ManualPR[]): RecordEntry[] {
  const exerciseIds = [...new Set(workouts.flatMap((w) => w.exercises.map((we) => we.exerciseId)))];

  const workoutRecords = exerciseIds
    .map((exerciseId): RecordEntry | null => {
      const best = bestForExercise(workouts, exerciseId);
      if (!best) return null;
      return {
        id: exerciseId,
        exerciseId,
        weightKg: best.maxE1rm.weightKg,
        reps: best.maxE1rm.reps,
        e1rmKg: best.maxE1rm.e1rm,
        date: best.maxE1rm.date ?? best.maxWeight.date,
      };
    })
    .filter((r): r is RecordEntry => r !== null);

  const manualRecords: RecordEntry[] = manualPRs.map((pr) => ({
    id: pr.id,
    exerciseId: pr.exerciseId,
    weightKg: pr.weightKg,
    reps: pr.reps,
    e1rmKg: e1rm(pr.weightKg, pr.reps),
    date: pr.date,
  }));

  const byExercise = new Map<string, RecordEntry>();
  for (const r of [...manualRecords, ...workoutRecords]) {
    const current = byExercise.get(r.exerciseId);
    if (!current || r.e1rmKg > current.e1rmKg) byExercise.set(r.exerciseId, r);
  }
  return [...byExercise.values()];
}

export const RECORD_SORTS = ['e1rm', 'weight', 'recent'] as const;
export type RecordSort = (typeof RECORD_SORTS)[number];

export const RECORD_SORT_LABELS: Record<RecordSort, string> = {
  e1rm: 'Highest 1RM',
  weight: 'Heaviest Weight',
  recent: 'Most Recent',
};

export function sortRecords(records: RecordEntry[], sort: RecordSort): RecordEntry[] {
  const copy = [...records];
  if (sort === 'weight') {
    copy.sort((a, b) => b.weightKg - a.weightKg);
  } else if (sort === 'recent') {
    copy.sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());
  } else {
    copy.sort((a, b) => b.e1rmKg - a.e1rmKg);
  }
  return copy;
}
