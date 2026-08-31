import { EXERCISE_MAP, resolveExercise } from '../data/exercises';
import { roundToPlateStep } from './plates';
import type { ExerciseSet, MuscleGroup, MuscleSlug, PR, Workout, WorkoutPlan, WorkoutStats } from '../types';

// ---------------------------------------------------------------------------
// Basic set / workout metrics
// ---------------------------------------------------------------------------

export function setVolume(s: ExerciseSet): number {
  if (s.weightKg != null && s.reps != null) return s.weightKg * s.reps;
  if (s.distanceKm != null) return s.distanceKm * 1000; // meters as cardio "volume"
  if (s.durationSec != null) return s.durationSec;
  return 0;
}

/** Epley estimated 1RM */
export function e1rm(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function workoutDurationMin(w: Workout): number {
  const ms = new Date(w.endTime).getTime() - new Date(w.startTime).getTime();
  return Math.max(1, Math.round(ms / 60000));
}

export function workoutStats(w: Workout): WorkoutStats {
  let volumeKg = 0;
  let sets = 0;
  let reps = 0;
  let distanceKm = 0;
  const muscles = new Set<MuscleGroup>();
  for (const we of w.exercises) {
    const ex = EXERCISE_MAP[we.exerciseId];
    if (ex) {
      muscles.add(ex.muscleGroup);
      for (const m of ex.secondaryMuscles) muscles.add(m);
    }
    for (const s of we.sets) {
      if (!s.completed) continue;
      sets += 1;
      volumeKg += setVolume(s);
      reps += s.reps ?? 0;
      distanceKm += s.distanceKm ?? 0;
    }
  }
  const durationMin = workoutDurationMin(w);
  // Rough calorie estimate: strength ~7 kcal/min, cardio ~9 kcal/min
  const isCardio = w.exercises.some((we) => EXERCISE_MAP[we.exerciseId]?.movement === 'Cardio');
  const calories = Math.round(durationMin * (isCardio ? 9 : 7) * (0.9 + (volumeKg / 20000) * 0.2));
  return { volumeKg: Math.round(volumeKg), sets, reps, durationMin, exercises: w.exercises.length, calories, muscles: [...muscles], distanceKm };
}

// ---------------------------------------------------------------------------
// Personal records
// ---------------------------------------------------------------------------

export interface ExerciseBest {
  exerciseId: string;
  maxWeight: { weightKg: number; reps: number; date: string };
  maxReps: { weightKg: number; reps: number; date: string };
  /** the actual set with the highest estimated 1RM (e1rm + its real weight/reps) */
  maxE1rm: { e1rm: number; weightKg: number; reps: number; date: string };
}

export function bestForExercise(workouts: Workout[], exerciseId: string): ExerciseBest | null {
  let maxWeight: ExerciseBest['maxWeight'] | null = null;
  let maxReps: ExerciseBest['maxReps'] | null = null;
  let maxE1rm: ExerciseBest['maxE1rm'] | null = null;
  for (const w of workouts) {
    for (const we of w.exercises) {
      if (we.exerciseId !== exerciseId) continue;
      for (const s of we.sets) {
        if (!s.completed || s.weightKg == null || s.reps == null) continue;
        if (!maxWeight || s.weightKg > maxWeight.weightKg) maxWeight = { weightKg: s.weightKg, reps: s.reps, date: w.startTime };
        if (!maxReps || s.reps > maxReps.reps) maxReps = { weightKg: s.weightKg, reps: s.reps, date: w.startTime };
        const rm = e1rm(s.weightKg, s.reps);
        if (!maxE1rm || rm > maxE1rm.e1rm) maxE1rm = { e1rm: rm, weightKg: s.weightKg, reps: s.reps, date: w.startTime };
      }
    }
  }
  if (!maxWeight) return null;
  return {
    exerciseId,
    maxWeight,
    maxReps: maxReps ?? maxWeight,
    maxE1rm:
      maxE1rm ??
      ({
        e1rm: e1rm(maxWeight.weightKg, maxWeight.reps),
        weightKg: maxWeight.weightKg,
        reps: maxWeight.reps,
        date: maxWeight.date,
      } as ExerciseBest['maxE1rm']),
  };
}

/** PRs achieved within a workout, compared against everything before it */
export function detectPRs(workout: Workout, allWorkouts: Workout[]): PR[] {
  const prior = allWorkouts.filter(
    (w) => w.id !== workout.id && new Date(w.endTime).getTime() <= new Date(workout.endTime).getTime(),
  );
  const prs: PR[] = [];
  for (const we of workout.exercises) {
    const ex = EXERCISE_MAP[we.exerciseId];
    const prevBest = bestForExercise(prior, we.exerciseId);
    for (const s of we.sets) {
      if (!s.completed || s.weightKg == null || s.reps == null) continue;
      const isWeightPr = !prevBest || s.weightKg > prevBest.maxWeight.weightKg;
      const isRepsPr = !prevBest || s.reps > prevBest.maxReps.reps;
      const rm = e1rm(s.weightKg, s.reps);
      const is1rmPr = !prevBest || rm > prevBest.maxE1rm.e1rm;
      if (!isWeightPr && !isRepsPr && !is1rmPr) continue;
      // compare against the previous best set by estimated strength so the
      // displayed "previous best" is one real set, never a mixed value
      const prev = prevBest ? { weightKg: prevBest.maxE1rm.weightKg, reps: prevBest.maxE1rm.reps } : null;
      const prevRm = prevBest ? prevBest.maxE1rm.e1rm : 0;
      const deltaPct = prevRm > 0 ? Math.round(((rm - prevRm) / prevRm) * 1000) / 10 : 100;
      prs.push({
        exerciseId: we.exerciseId,
        exerciseName: ex?.name ?? we.exerciseId,
        weightKg: s.weightKg,
        reps: s.reps,
        prevWeightKg: prev?.weightKg ?? null,
        prevReps: prev?.reps ?? null,
        kind: is1rmPr ? '1RM' : isWeightPr ? 'Weight' : 'Reps',
        deltaPct,
        workoutId: workout.id,
        date: workout.endTime,
      });
    }
  }
  return prs;
}

// ---------------------------------------------------------------------------
// Streaks & consistency
// ---------------------------------------------------------------------------

/**
 * Zero-padded local day key, e.g. "2026-08-10". Padded month/day keeps string
 * ordering chronological ("2026-10-01" sorts after "2026-09-30"), which the
 * streak calculations rely on. Use this everywhere a day is used as a key.
 */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function workoutDayKeys(workouts: Workout[]): Set<string> {
  const keys = new Set<string>();
  for (const w of workouts) {
    keys.add(dayKey(new Date(w.startTime)));
  }
  return keys;
}

/**
 * Streak ending today (or yesterday, so a workout today keeps it alive).
 * One rest day between sessions is allowed — training every other day keeps
 * the streak going. It only breaks after two or more consecutive missed days.
 */
export function currentStreak(workouts: Workout[]): number {
  const keys = workoutDayKeys(workouts);
  const today = new Date();
  let cursor = today;
  let streak = 0;
  let restDays = 0;
  while (true) {
    if (keys.has(dayKey(cursor))) {
      streak += 1;
      restDays = 0;
    } else {
      restDays += 1;
      if (restDays >= 2) break; // 2+ missed days in a row → streak broken
    }
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
}

export function longestStreak(workouts: Workout[]): number {
  const keys = workoutDayKeys(workouts);
  const days = [...keys].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of days) {
    if (prev) {
      const [py, pm, pd] = prev.split('-').map(Number);
      const [cy, cm, cd] = key.split('-').map(Number);
      const gap = (new Date(cy, cm - 1, cd).getTime() - new Date(py, pm - 1, pd).getTime()) / 86400000;
      // gap 1 = consecutive days, gap 2 = one rest day between sessions —
      // both keep the run alive (same rule as the current streak)
      run = gap <= 2 ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = key;
  }
  return best;
}

export function workoutsInLastDays(workouts: Workout[], days: number): Workout[] {
  const cutoff = Date.now() - days * 86400000;
  return workouts.filter((w) => new Date(w.endTime).getTime() >= cutoff);
}

export function consistencyPct(workouts: Workout[], days: number): number {
  if (days <= 0 || workouts.length === 0) return 0;
  const keys = workoutDayKeys(workouts);
  const now = new Date();
  let active = 0;
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 86400000);
    const k = dayKey(d);
    if (keys.has(k)) {
      active += 1;
      continue;
    }
    // a rest day counts when it's the single day off between two sessions
    // (alternate-day training) — same tolerance as the streak rule
    if (keys.has(dayKey(new Date(d.getTime() - 86400000))) && keys.has(dayKey(new Date(d.getTime() + 86400000)))) {
      active += 1;
    }
  }
  return Math.round((active / days) * 100);
}

export function sessionsPerWeek(workouts: Workout[], weeks = 4): number {
  if (workouts.length === 0) return 0;
  const recent = workoutsInLastDays(workouts, weeks * 7);
  return Math.round((recent.length / weeks) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Volume analytics
// ---------------------------------------------------------------------------

export function totalVolume(workouts: Workout[]): number {
  return Math.round(workouts.reduce((sum, w) => sum + workoutStats(w).volumeKg, 0));
}

export const GROUP_TO_SLUGS: Record<MuscleGroup, MuscleSlug[]> = {
  Chest: ['chest'],
  Back: ['upper-back', 'trapezius', 'lower-back'],
  Shoulders: ['deltoids'],
  Biceps: ['biceps'],
  Triceps: ['triceps'],
  Quads: ['quadriceps', 'adductors'],
  Hamstrings: ['hamstring'],
  Glutes: ['gluteal'],
  Calves: ['calves'],
  Core: ['abs', 'obliques'],
  Forearms: ['forearm'],
  Cardio: [],
};

export type TrainingStatus = 'Well Trained' | 'Moderate' | 'Undertrained';

export function getTrainingEfficiency(weeklySets: number): {
  status: TrainingStatus;
  intensity: number;
  level: number;
} {
  if (weeklySets >= 6) {
    return { status: 'Well Trained', intensity: 1.0, level: 3 };
  }
  if (weeklySets >= 3) {
    return { status: 'Moderate', intensity: 0.5, level: 2 };
  }
  return { status: 'Undertrained', intensity: 0.25, level: 1 };
}

export function volumeByMuscle(workouts: Workout[], days?: number): { muscle: MuscleGroup; volume: number; sets: number }[] {
  const list = days ? workoutsInLastDays(workouts, days) : workouts;
  const map = new Map<MuscleGroup, { volume: number; sets: number }>();
  for (const w of list) {
    for (const we of w.exercises) {
      const ex = resolveExercise(we.exerciseId);
      if (!ex) continue;
      let exVol = 0;
      let sets = 0;
      for (const s of we.sets) {
        if (!s.completed) continue;
        exVol += setVolume(s);
        sets += 1;
      }
      const primary = map.get(ex.muscleGroup) ?? { volume: 0, sets: 0 };
      primary.volume += exVol;
      primary.sets += sets;
      map.set(ex.muscleGroup, primary);
      for (const sec of ex.secondaryMuscles) {
        const entry = map.get(sec) ?? { volume: 0, sets: 0 };
        entry.volume += exVol * 0.5;
        entry.sets += Math.round(sets * 0.5);
        map.set(sec, entry);
      }
    }
  }
  return [...map.entries()]
    .map(([muscle, v]) => ({ muscle, volume: Math.round(v.volume), sets: v.sets }))
    .sort((a, b) => b.volume - a.volume);
}

export function volumeBySlug(
  workouts: Workout[],
  days?: number,
): { slug: MuscleSlug; volume: number; sets: number }[] {
  const list = days ? workoutsInLastDays(workouts, days) : workouts;
  const map = new Map<MuscleSlug, { volume: number; sets: number }>();
  for (const w of list) {
    for (const we of w.exercises) {
      const ex = resolveExercise(we.exerciseId);
      if (!ex) continue;
      let exVol = 0;
      let sets = 0;
      for (const s of we.sets) {
        if (!s.completed) continue;
        exVol += setVolume(s);
        sets += 1;
      }
      if (sets === 0) continue;

      const targets: MuscleSlug[] =
        ex.targetSlugs && ex.targetSlugs.length > 0
          ? ex.targetSlugs
          : (GROUP_TO_SLUGS[ex.muscleGroup] || []);

      const secondaries: MuscleSlug[] =
        ex.secondarySlugs && ex.secondarySlugs.length > 0
          ? ex.secondarySlugs
          : (ex.secondaryMuscles.flatMap((m) => GROUP_TO_SLUGS[m] || []));

      const targetShare = targets.length > 0 ? exVol / targets.length : exVol;
      for (const slug of targets) {
        const entry = map.get(slug) ?? { volume: 0, sets: 0 };
        entry.volume += targetShare;
        entry.sets += sets;
        map.set(slug, entry);
      }

      const secShare = secondaries.length > 0 ? (exVol * 0.5) / secondaries.length : exVol * 0.5;
      for (const slug of secondaries) {
        const entry = map.get(slug) ?? { volume: 0, sets: 0 };
        entry.volume += secShare;
        entry.sets += Math.round(sets * 0.5);
        map.set(slug, entry);
      }
    }
  }
  return [...map.entries()]
    .map(([slug, v]) => ({ slug, volume: Math.round(v.volume), sets: v.sets }))
    .sort((a, b) => b.volume - a.volume);
}

export interface DayVolume {
  date: string;
  label: string;
  volume: number;
  workouts: number;
}

export function dailyVolume(workouts: Workout[], days = 7): DayVolume[] {
  const out: DayVolume[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 86400000);
    out.push({ date: d.toDateString(), label: d.toLocaleDateString('en-US', { weekday: 'short' }), volume: 0, workouts: 0 });
  }
  for (const w of workouts) {
    const start = new Date(w.startTime);
    const day = start.toDateString();
    const slot = out.find((o) => o.date === day);
    if (slot) {
      slot.volume += workoutStats(w).volumeKg;
      slot.workouts += 1;
    }
  }
  return out;
}

export function weeklyVolumes(workouts: Workout[], weeks = 8): { label: string; volume: number; sets: number }[] {
  const out: { label: string; volume: number; sets: number }[] = [];
  const now = new Date();
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const end = new Date(now.getTime() - i * 7 * 86400000);
    const label =
      weeks <= 8
        ? end.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
        : end.toLocaleDateString('en-US', { month: 'short' });
    out.push({ label, volume: 0, sets: 0 });
  }
  for (const w of workouts) {
    const ageDays = Math.floor((Date.now() - new Date(w.endTime).getTime()) / 86400000);
    const idx = Math.floor(ageDays / 7);
    if (idx >= 0 && idx < weeks) {
      const st = workoutStats(w);
      out[weeks - 1 - idx].volume += st.volumeKg;
      out[weeks - 1 - idx].sets += st.sets;
    }
  }
  return out;
}

/**
 * Strength progression for an exercise: best e1rm per week.
 *
 * Every time slot is kept in the returned series (zero value = no data) so
 * points plot at their true position on the x-axis — a rest week is "no data",
 * not a strength drop, and the chart breaks the line there instead of dipping
 * to zero or compressing the timeline.
 *
 * When a strength exercise has sets logged but never any weight (e.g. cable
 * machines logged by pin/plate position, like lat pulldown or seated cable
 * row), an e1rm can't be computed — so the series falls back to the best reps
 * per period and marks every point `unit: 'reps'` so the UI can label it
 * correctly instead of showing a blank chart.
 */
export function strengthProgression(
  workouts: Workout[],
  exerciseId: string,
  weeks = 12,
): { label: string; value: number; unit?: 'kg' | 'reps' }[] {
  // A 7-day range is a single week, which would collapse to one lonely dot —
  // bucket the last 7 days individually instead so the short range maps to a
  // real daily trend.
  const daily = weeks <= 1;
  const slots = daily ? 7 : weeks;
  const slotMs = daily ? 86400000 : 7 * 86400000;
  const now = new Date();
  const buckets: { label: string; value: number; unit?: 'kg' | 'reps' }[] = [];
  for (let i = slots - 1; i >= 0; i -= 1) {
    const t = new Date(now.getTime() - i * slotMs);
    buckets.push({
      label: daily
        ? t.toLocaleDateString('en-US', { weekday: 'short' })
        : t.toLocaleDateString('en-US', { month: 'short' }),
      value: 0,
    });
  }
  let anyWeight = false;
  let anyReps = false;
  for (const w of workouts) {
    const idx = Math.floor((Date.now() - new Date(w.endTime).getTime()) / slotMs);
    if (idx < 0 || idx >= slots) continue;
    for (const we of w.exercises) {
      if (we.exerciseId !== exerciseId) continue;
      for (const s of we.sets) {
        if (!s.completed) continue;
        if (s.weightKg != null && s.reps != null) anyWeight = true;
        if (s.reps != null) anyReps = true;
        if (anyWeight) break;
      }
      if (anyWeight) break;
    }
    if (anyWeight) break;
  }
  // No weighted sets at all → plot max reps per period instead of e1rm.
  const repsMode = !anyWeight && anyReps;
  for (const w of workouts) {
    const idx = Math.floor((Date.now() - new Date(w.endTime).getTime()) / slotMs);
    if (idx < 0 || idx >= slots) continue;
    for (const we of w.exercises) {
      if (we.exerciseId !== exerciseId) continue;
      for (const s of we.sets) {
        if (!s.completed || s.reps == null) continue;
        if (!repsMode && (s.weightKg == null || s.reps == null)) continue;
        const val = repsMode ? s.reps : e1rm(s.weightKg!, s.reps);
        const bucket = buckets[slots - 1 - idx];
        bucket.value = Math.max(bucket.value, Math.round(val * 10) / 10);
        bucket.unit = repsMode ? 'reps' : 'kg';
      }
    }
  }
  return buckets;
}

/** Average working-set volume per session, per week */
export function volumePerSessionByWeek(workouts: Workout[], weeks = 8): { label: string; value: number }[] {
  const weeksData = weeklyVolumes(workouts, weeks);
  const byWeek = new Map<string, { volume: number; sessions: number }>();
  const labels = weeksData.map((w) => w.label);
  labels.forEach((l, i) => byWeek.set(`${i}`, { volume: 0, sessions: 0 }));
  for (const w of workouts) {
    const ageDays = Math.floor((Date.now() - new Date(w.endTime).getTime()) / 86400000);
    const idx = Math.floor(ageDays / 7);
    if (idx < 0 || idx >= weeks) continue;
    const entry = byWeek.get(`${idx}`)!;
    entry.volume += workoutStats(w).volumeKg;
    entry.sessions += 1;
  }
  // Keep every week in the series (zero = rest week) so points plot at their
  // true position; the line chart treats zeros as gaps rather than dips.
  return labels.map((label, i) => {
    const e = byWeek.get(`${i}`)!;
    return { label, value: e.sessions ? Math.round(e.volume / e.sessions) : 0 };
  });
}

// ---------------------------------------------------------------------------
// "What changed?" — compare a workout with its previous equivalent
// ---------------------------------------------------------------------------

export interface WhatChanged {
  volumePct: number;
  repsDelta: number;
  avgWeightDelta: number;
  durationDeltaMin: number;
  setDelta: number;
}

export function whatChanged(current: Workout, prev: Workout): WhatChanged {
  const cs = workoutStats(current);
  const ps = workoutStats(prev);
  const avgWeight = (w: Workout) => {
    let total = 0;
    let n = 0;
    for (const we of w.exercises) for (const s of we.sets) if (s.completed && s.weightKg != null) { total += s.weightKg; n += 1; }
    return n ? total / n : 0;
  };
  const pct = ps.volumeKg > 0 ? Math.round(((cs.volumeKg - ps.volumeKg) / ps.volumeKg) * 100) : 0;
  return {
    volumePct: pct,
    repsDelta: cs.reps - ps.reps,
    avgWeightDelta: Math.round((avgWeight(current) - avgWeight(prev)) * 10) / 10,
    durationDeltaMin: cs.durationMin - ps.durationMin,
    setDelta: cs.sets - ps.sets,
  };
}

// ---------------------------------------------------------------------------
// Workout categorization (history filters)
// ---------------------------------------------------------------------------

export type WorkoutCategory = 'Push' | 'Pull' | 'Legs' | 'Upper' | 'Full' | 'Other';

/**
 * Reliable category for the History filters, replacing naive title matching
 * ("Leg Day" never matched "Legs", nothing ever matched "Full").
 *
 * A title that clearly names the session type wins ("Push Day" → Push,
 * "Upper Body" → Upper, "Full Body" → Full) — the user's own label is the
 * strongest signal of intent. Otherwise the workout is classified from its
 * actual content using the knowledge base's movement + region fields, so
 * arbitrary titles like "Chest & Triceps" still land in the right chip and
 * CSV titles like "Legs" work even when the content is mixed.
 */
export function classifyWorkout(workout: Pick<Workout, 'title' | 'exercises'>): WorkoutCategory {
  const title = (workout.title ?? '').toLowerCase();
  if (/(full\s*bod(y|ies)|^full$)/.test(title)) return 'Full';
  if (title.includes('upper')) return 'Upper';
  if (title.includes('leg') || title.includes('lower')) return 'Legs';
  if (title.includes('push')) return 'Push';
  if (title.includes('pull')) return 'Pull';

  const movement = { Push: 0, Pull: 0, Legs: 0, Core: 0, Cardio: 0 };
  const region = { Upper: 0, Lower: 0, Core: 0, 'Full Body': 0 };
  let total = 0;
  for (const we of workout.exercises) {
    const ex = EXERCISE_MAP[we.exerciseId];
    if (!ex) continue;
    movement[ex.movement] += 1;
    region[ex.region] += 1;
    total += 1;
  }
  if (total === 0) return 'Other';

  // strict majority (> half) on a movement or region — ties fall through so a
  // 50/50 push/pull session isn't mislabeled; any full-body movement then wins
  const majority = (count: number) => count * 2 > total;
  if (majority(movement.Push)) return 'Push';
  if (majority(movement.Pull)) return 'Pull';
  if (majority(movement.Legs)) return 'Legs';
  if (majority(region.Upper)) return 'Upper';
  if (majority(region.Lower)) return 'Legs';
  if (region['Full Body'] > 0) return 'Full';
  return 'Other';
}

// ---------------------------------------------------------------------------
// Stalled-exercise detection (plateaus)
// ---------------------------------------------------------------------------

export interface Plateau {
  exerciseId: string;
  exerciseName: string;
  /** number of recent sessions compared */
  sessions: number;
  /** spread of the best set (e1rm) across those sessions, kg */
  spreadKg: number;
  /** best e1rm within the window */
  bestKg: number;
  /** all-time best e1rm */
  allTimeBestKg: number;
}

export interface PlateauOptions {
  /** minimum recent sessions required to call it a plateau */
  minSessions?: number;
  /** max spread (kg) between sessions' best sets to count as "unchanged" */
  toleranceKg?: number;
  /** ignore sessions older than this */
  maxAgeDays?: number;
  limit?: number;
}

/**
 * Exercises whose recent best set (estimated 1RM) has stayed within a small
 * tolerance across several sessions. Deliberately simple and explainable:
 * e.g. bench 60 kg, 60, 60, 60 across four sessions = plateau.
 *
 * Only strength sets with a logged weight are considered (a cable stack with
 * no kg value has no load to stall on). A regression is not a plateau — if the
 * all-time best is clearly above the recent window, the exercise is left alone.
 */
export function detectPlateaus(workouts: Workout[], opts: PlateauOptions = {}): Plateau[] {
  const { minSessions = 4, toleranceKg = 2.5, maxAgeDays = 56, limit = 3 } = opts;
  const cutoff = Date.now() - maxAgeDays * 86400000;
  const byExercise = new Map<string, { ts: number; best: number }[]>();
  for (const w of workouts) {
    const ts = new Date(w.endTime).getTime();
    if (ts < cutoff) continue;
    for (const we of w.exercises) {
      let best = 0;
      for (const s of we.sets) {
        if (!s.completed || s.weightKg == null) continue;
        const val = s.reps != null ? e1rm(s.weightKg, s.reps) : s.weightKg;
        if (val > best) best = val;
      }
      if (best <= 0) continue;
      const list = byExercise.get(we.exerciseId) ?? [];
      list.push({ ts, best });
      byExercise.set(we.exerciseId, list);
    }
  }
  const out: Plateau[] = [];
  for (const [exerciseId, sessions] of byExercise) {
    if (sessions.length < minSessions) continue;
    sessions.sort((a, b) => b.ts - a.ts);
    const recent = sessions.slice(0, minSessions);
    const best = Math.max(...recent.map((s) => s.best));
    const spread = best - Math.min(...recent.map((s) => s.best));
    if (spread > toleranceKg) continue;
    const allTimeBest = Math.max(...sessions.map((s) => s.best));
    if (allTimeBest > best + toleranceKg) continue; // regression, not a plateau
    out.push({
      exerciseId,
      exerciseName: EXERCISE_MAP[exerciseId]?.name ?? exerciseId,
      sessions: recent.length,
      spreadKg: Math.round(spread * 10) / 10,
      bestKg: Math.round(best * 10) / 10,
      allTimeBestKg: Math.round(allTimeBest * 10) / 10,
    });
  }
  return out
    .sort((a, b) => b.sessions - a.sessions || a.spreadKg - b.spreadKg)
    .slice(0, limit);
}

/** Is this single exercise currently plateauing? (used on the exercise page) */
export function plateauForExercise(workouts: Workout[], exerciseId: string): Plateau | null {
  return detectPlateaus(workouts, { limit: 1 }).find((p) => p.exerciseId === exerciseId) ?? null;
}

// ---------------------------------------------------------------------------
// Warm-up suggestion (simple deterministic ramp)
// ---------------------------------------------------------------------------

export interface WarmupSet {
  kg: number;
  reps: number;
}

/**
 * A quick warm-up ramp for a strength working weight:
 *   25% × 10 · 50% × 8 · 75% × 5 · ~87% × 3 → then work sets.
 * Weights round down to the nearest 2.5 kg plate and bar-only steps are
 * dropped, so an 80 kg bench suggests 20×10 · 40×8 · 60×5 · 70×3.
 */
export function warmupSets(weightKg: number): WarmupSet[] {
  if (!(weightKg >= 40)) return [];
  const steps: { pct: number; reps: number }[] = [
    { pct: 0.25, reps: 10 },
    { pct: 0.5, reps: 8 },
    { pct: 0.75, reps: 5 },
    { pct: 0.875, reps: 3 },
  ];
  return steps
    .map((s) => ({ kg: roundToPlateStep(weightKg * s.pct), reps: s.reps }))
    .filter((s) => s.kg >= 20);
}

// ---------------------------------------------------------------------------
// Repeat workout
// ---------------------------------------------------------------------------

export interface WorkoutRepeatSpec {
  exerciseId: string;
  sets: number;
  targetReps: string;
}

/**
 * Turn a finished workout back into plan specs (exercise structure + set
 * targets) so it can be started again via the normal startWorkout flow.
 * Uses the number of completed sets (falling back to the planned count).
 */
export function workoutRepeatSpecs(workout: Workout): WorkoutRepeatSpec[] {
  return workout.exercises.map((we) => {
    const done = we.sets.filter((s) => s.completed).length;
    const sets = done > 0 ? done : we.plannedSets > 0 ? we.plannedSets : 3;
    return { exerciseId: we.exerciseId, sets, targetReps: we.targetReps || '8-12' };
  });
}

// ---------------------------------------------------------------------------
// "Your next move" — one deterministic recommendation
// ---------------------------------------------------------------------------

export type NextMoveAction =
  | { type: 'start-plan'; planId: string; planTitle: string }
  | { type: 'view-exercise'; exerciseId: string; exerciseName: string };

export interface NextMove {
  kind: 'untrained' | 'pr-close' | 'plateau';
  headline: string;
  detail: string;
  cta: string;
  action: NextMoveAction;
  /** 0-100 closeness to an all-time best (pr-close only) */
  pct?: number;
}

const MUSCLE_LABEL: Partial<Record<MuscleGroup, string>> = {
  Quads: 'Legs',
  Hamstrings: 'Legs',
  Glutes: 'Legs',
  Calves: 'Legs',
  Chest: 'Chest',
  Back: 'Back',
  Shoulders: 'Shoulders',
  Biceps: 'Arms',
  Triceps: 'Arms',
  Core: 'Core',
};

/**
 * Pick ONE primary recommendation, in priority order:
 *   1. a planned muscle group that hasn't been trained in a while (start it),
 *   2. an exercise close to an all-time PR (view it / chase it),
 *   3. a stalled exercise (view it, add reps before weight).
 * `todayPlanId` is the plan already offered by the home hero, so the two
 * surfaces never compete. Returns null when there is nothing worth saying.
 */
/**
 * Returns a list of contextual training recommendations for the carousel.
 */
export function nextMoves(workouts: Workout[], plans: WorkoutPlan[], todayPlanId?: string): NextMove[] {
  if (workouts.length === 0) return [];
  const moves: NextMove[] = [];
  const now = Date.now();

  // 1. Untrained muscle groups (plans that haven't been hit recently).
  for (const plan of plans) {
    if (todayPlanId && plan.id === todayPlanId) continue;
    const muscleSet = new Set(plan.muscles);
    let lastTs = 0;
    for (const w of workouts) {
      if (w.title === plan.title) {
        lastTs = Math.max(lastTs, new Date(w.endTime).getTime());
        continue;
      }
      for (const we of w.exercises) {
        const ex = EXERCISE_MAP[we.exerciseId];
        if (ex && muscleSet.has(ex.muscleGroup)) {
          lastTs = Math.max(lastTs, new Date(w.endTime).getTime());
          break;
        }
      }
    }
    if (!lastTs) continue;
    const days = Math.floor((now - lastTs) / 86400000);
    if (days >= 4) {
      const label = MUSCLE_LABEL[plan.muscles[0] as MuscleGroup] ?? plan.muscles[0];
      const plural = label.endsWith('s');
      moves.push({
        kind: 'untrained',
        headline: `${label} ${plural ? "haven't" : "hasn't"} been trained recently.`,
        detail: `${days} days since your last ${plan.title} session — consistency drives results.`,
        cta: `Start ${plan.title}`,
        action: { type: 'start-plan', planId: plan.id, planTitle: plan.title },
      });
    }
  }

  // 2. Close to an all-time personal record (PR radar).
  const radarList = prRadar(workouts, 2);
  for (const radar of radarList) {
    if (radar.pct >= 85) {
      moves.push({
        kind: 'pr-close',
        headline: `You're close to a ${radar.exerciseName} PR.`,
        detail: `${radar.pct}% of your all-time best — one strong session could set a new record.`,
        cta: `View ${radar.exerciseName}`,
        action: { type: 'view-exercise', exerciseId: radar.exerciseId, exerciseName: radar.exerciseName },
        pct: radar.pct,
      });
    }
  }

  // 3. Stalled strength exercises.
  const plateaus = detectPlateaus(workouts, { limit: 2 });
  for (const plateau of plateaus) {
    moves.push({
      kind: 'plateau',
      headline: `${plateau.exerciseName} may be plateauing.`,
      detail: `Same load across your last ${plateau.sessions} sessions. Try adding 1-2 reps before increasing weight.`,
      cta: `View ${plateau.exerciseName}`,
      action: { type: 'view-exercise', exerciseId: plateau.exerciseId, exerciseName: plateau.exerciseName },
    });
  }

  return moves.slice(0, 4);
}

export function nextMove(workouts: Workout[], plans: WorkoutPlan[], todayPlanId?: string): NextMove | null {
  const moves = nextMoves(workouts, plans, todayPlanId);
  return moves.length > 0 ? moves[0] : null;
}

// ---------------------------------------------------------------------------
// PR Radar
// ---------------------------------------------------------------------------

export interface RadarItem {
  exerciseId: string;
  exerciseName: string;
  /** 0-100: how close recent best is to all-time best */
  pct: number;
  currentBest: number;
  allTimeBest: number;
}

export function prRadar(workouts: Workout[], limit = 4): RadarItem[] {
  const recent = workoutsInLastDays(workouts, 21);
  const items: RadarItem[] = [];
  const seen = new Set<string>();
  for (const w of recent) {
    for (const we of w.exercises) {
      if (seen.has(we.exerciseId)) continue;
      seen.add(we.exerciseId);
      const best = bestForExercise(workouts, we.exerciseId);
      const recentBest = bestForExercise(recent, we.exerciseId);
      if (!best || !recentBest || best.maxE1rm.e1rm <= 0) continue;
      const pct = Math.round((recentBest.maxE1rm.e1rm / best.maxE1rm.e1rm) * 100);
      if (pct < 100) {
        items.push({
          exerciseId: we.exerciseId,
          exerciseName: EXERCISE_MAP[we.exerciseId]?.name ?? we.exerciseId,
          pct,
          currentBest: recentBest.maxE1rm.e1rm,
          allTimeBest: best.maxE1rm.e1rm,
        });
      }
    }
  }
  return items.sort((a, b) => b.pct - a.pct).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Auto-generated insights
// ---------------------------------------------------------------------------

export interface Insight {
  icon: string;
  title: string;
  body: string;
  tone: 'up' | 'down' | 'flat';
}

export function generateInsights(workouts: Workout[]): Insight[] {
  const insights: Insight[] = [];
  const recent = workoutsInLastDays(workouts, 42); // 6 weeks
  const prev = workoutsInLastDays(workouts, 84).filter((w) => !recent.includes(w));

  const pushing = volumeByMuscle(recent).filter((v) => ['Chest', 'Shoulders', 'Triceps'].includes(v.muscle)).reduce((s, v) => s + v.volume, 0);
  const pulling = volumeByMuscle(recent).filter((v) => ['Back', 'Biceps'].includes(v.muscle)).reduce((s, v) => s + v.volume, 0);
  const prevPushing = volumeByMuscle(prev).filter((v) => ['Chest', 'Shoulders', 'Triceps'].includes(v.muscle)).reduce((s, v) => s + v.volume, 0);
  const prevPulling = volumeByMuscle(prev).filter((v) => ['Back', 'Biceps'].includes(v.muscle)).reduce((s, v) => s + v.volume, 0);

  if (prevPulling > 0 && prevPushing > 0) {
    const pushGrowth = (pushing - prevPushing) / prevPushing;
    const pullGrowth = (pulling - prevPulling) / prevPulling;
    if (pullGrowth > pushGrowth + 0.05) {
      insights.push({
        icon: 'arrow-up-circle',
        title: 'Pull ahead',
        body: 'Your pulling strength has increased faster than your pushing strength over the last 6 weeks.',
        tone: 'up',
      });
    } else if (pushGrowth > pullGrowth + 0.05) {
      insights.push({
        icon: 'arrow-up-circle',
        title: 'Push ahead',
        body: 'Your pushing strength has outpaced pulling over the last 6 weeks — keep the back work coming.',
        tone: 'up',
      });
    }
  }

  const legVol = (list: Workout[]) =>
    volumeByMuscle(list)
      .filter((v) => v.muscle === 'Quads' || v.muscle === 'Hamstrings')
      .reduce((s, v) => s + v.volume, 0);
  const legsNow = legVol(recent);
  const legsPrev = legVol(prev);
  if (legsPrev > 0 && legsNow < legsPrev * 0.82) {
    insights.push({
      icon: 'alert-circle',
      title: 'Legs dropping',
      body: `Your leg volume has dropped ${Math.round((1 - legsNow / legsPrev) * 100)}% compared with the previous month.`,
      tone: 'down',
    });
  }

  const avgDur = (list: Workout[]) => (list.length ? list.reduce((s, w) => s + workoutStats(w).durationMin, 0) / list.length : 0);
  const avgVol = (list: Workout[]) => (list.length ? list.reduce((s, w) => s + workoutStats(w).volumeKg, 0) / list.length : 0);
  const durNow = avgDur(recent);
  const durPrev = avgDur(prev);
  const volNow = avgVol(recent);
  const volPrev = avgVol(prev);
  if (durPrev > 0 && volPrev > 0 && Math.abs(durNow - durPrev) < 4 && volNow > volPrev * 1.05) {
    insights.push({
      icon: 'trending-up',
      title: 'Efficient gains',
      body: 'Your average workout duration has stayed stable while total volume increased — great density.',
      tone: 'up',
    });
  }

  const bestMuscle = volumeByMuscle(recent)[0];
  if (bestMuscle) {
    insights.push({
      icon: 'flame',
      title: 'Best performing muscle',
      body: `${bestMuscle.muscle} leads your training with ${bestMuscle.volume.toLocaleString()} kg of volume this month.`,
      tone: 'up',
    });
  }

  const freq = sessionsPerWeek(workouts);
  insights.push({
    icon: 'calendar',
    title: 'Training frequency',
    body: `You average ${freq} sessions per week — ${freq >= 3 ? 'a solid, consistent rhythm.' : 'try to reach 3 for steady progress.'}`,
    tone: freq >= 3 ? 'up' : 'flat',
  });

  if (insights.length < 3) {
    insights.push({
      icon: 'bulb',
      title: 'Consistency is king',
      body: `Your consistency score is ${consistencyPct(workouts, 28)}% over the last 28 days. Keep showing up.`,
      tone: 'flat',
    });
  }
  return insights.slice(0, 4);
}

// ---------------------------------------------------------------------------
// Leaderboard progress score (balanced — not bodyweight)
// ---------------------------------------------------------------------------

export interface LeaderboardInput {
  workoutsThisWeek: number;
  prsThisMonth: number;
  streak: number;
  volumeKg: number;
  consistency: number;
  goalCompletion: number;
}

/**
 * Balanced 0-100 score. Point budget (max 100):
 *   workouts this week  40 (showing up)
 *   PRs this month      16 (improvement)
 *   streak               12 (consistency)
 *   consistency %        16 (consistency)
 *   volume               8  (a real but capped contribution — raw load must
 *                            never dominate the score)
 *   goal adherence       8
 *
 * Deliberately rewards consistency and improvement over absolute strength or
 * body weight: volume is capped at 8 points, and it only counts when the rest
 * of the training behaviour is already there.
 */
export function progressScore(i: LeaderboardInput): number {
  const s =
    Math.min(i.workoutsThisWeek * 14, 40) +
    Math.min(i.prsThisMonth * 8, 16) +
    Math.min(i.streak * 4, 12) +
    Math.min(i.volumeKg / 4000, 8) +
    Math.min(i.consistency, 16) +
    Math.min(i.goalCompletion * 4, 8);
  return Math.min(100, Math.round(s));
}

/**
 * The most recent completed set at the same index for an exercise (for
 * 'last time' hints). Sorts by start time explicitly so the answer does not
 * depend on the store's workout ordering.
 */
export function previousSet(
  workouts: Workout[],
  exerciseId: string,
  setIndex: number,
  excludeWorkoutId?: string,
): { weightKg: number | null; reps: number | null; date: string } | null {
  const sorted = [...workouts].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  for (const w of sorted) {
    if (excludeWorkoutId && w.id === excludeWorkoutId) continue;
    const we = w.exercises.find((x) => x.exerciseId === exerciseId);
    const s = we?.sets[setIndex - 1];
    if (s && s.completed) return { weightKg: s.weightKg, reps: s.reps, date: w.startTime };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export function workoutAgeInDays(w: Workout): number {
  return Math.max(0, Math.floor((Date.now() - new Date(w.startTime).getTime()) / 86400000));
}

export function formatCompact(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}

// ---------------------------------------------------------------------------
// Smart Next-Workout Engine & Progression Recommendations
// ---------------------------------------------------------------------------

export type SmartTodayPlanState =
  | 'IN_PROGRESS'
  | 'NO_PLANS'
  | 'COMPLETED_TODAY'
  | 'READY_TO_START';

export interface SmartTodayPlanResult {
  state: SmartTodayPlanState;
  plan?: WorkoutPlan;
  completedWorkout?: Workout;
  nextUpPlan?: WorkoutPlan;
  prevEquivalent?: Workout | null;
  activeWorkout?: Workout | null;
  isLongLayoff?: boolean;
}

/**
 * Calculates a 0.0 - 1.0 similarity score between a completed workout and a plan template.
 * Tier 1: Exact title match (score: 1.0)
 * Tier 2: Exercise ID Jaccard overlap (score: 0.6 * jaccard + 0.4 * muscle_sim)
 * Tier 3: Muscle & Movement pattern vector similarity
 */
export function calculatePlanSimilarity(
  workout: Pick<Workout, 'title' | 'exercises'>,
  plan: WorkoutPlan,
): number {
  const wTitle = (workout.title ?? '').trim().toLowerCase();
  const pTitle = (plan.title ?? '').trim().toLowerCase();

  // Tier 1: Exact title match
  if (wTitle && pTitle && wTitle === pTitle) {
    return 1.0;
  }

  // Tier 2: Exercise ID Overlap (Jaccard similarity)
  const workoutExIds = new Set(workout.exercises.map((e) => e.exerciseId));
  const planExIds = new Set(plan.exercises.map((e) => e.exerciseId));

  let sharedCount = 0;
  for (const id of workoutExIds) {
    if (planExIds.has(id)) sharedCount += 1;
  }

  const unionSize = new Set([...workoutExIds, ...planExIds]).size;
  const jaccard = unionSize > 0 ? sharedCount / unionSize : 0;

  if (jaccard >= 0.5) {
    return 0.8 + jaccard * 0.2;
  }

  // Tier 3: Muscle Group & Movement Pattern Vector Similarity
  const workoutMuscles = new Set<string>();
  const workoutMovements = new Set<string>();
  for (const we of workout.exercises) {
    const ex = EXERCISE_MAP[we.exerciseId];
    if (ex) {
      workoutMuscles.add(ex.muscleGroup);
      workoutMovements.add(ex.movement);
    }
  }

  const planMuscles = new Set(plan.muscles);
  const planMovements = new Set<string>();
  for (const pe of plan.exercises) {
    const ex = EXERCISE_MAP[pe.exerciseId];
    if (ex) {
      planMovements.add(ex.movement);
    }
  }

  let sharedMuscles = 0;
  for (const m of workoutMuscles) {
    if (planMuscles.has(m)) sharedMuscles += 1;
  }
  const muscleSim =
    workoutMuscles.size > 0 && planMuscles.size > 0
      ? sharedMuscles / Math.max(workoutMuscles.size, planMuscles.size)
      : 0;

  let sharedMovements = 0;
  for (const mov of workoutMovements) {
    if (planMovements.has(mov)) sharedMovements += 1;
  }
  const movementSim =
    workoutMovements.size > 0 && planMovements.size > 0
      ? sharedMovements / Math.max(workoutMovements.size, planMovements.size)
      : 0;

  return jaccard * 0.4 + muscleSim * 0.4 + movementSim * 0.2;
}

/**
 * Finds the index of the plan in `plans` that best matches the given completed workout.
 * Returns -1 if no plan matches with at least 0.25 confidence.
 */
export function matchWorkoutToPlanIndex(
  workout: Pick<Workout, 'title' | 'exercises'>,
  plans: WorkoutPlan[],
): number {
  if (!plans || plans.length === 0) return -1;

  let bestIndex = -1;
  let bestScore = 0.25; // minimum threshold

  for (let i = 0; i < plans.length; i += 1) {
    const score = calculatePlanSimilarity(workout, plans[i]);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

/**
 * Intelligent next-workout recommendation engine.
 */
export function getSmartTodayPlan(
  workouts: Workout[],
  plans: WorkoutPlan[],
  activeWorkout?: Workout | null,
  manualSelectedPlanId?: string | null,
): SmartTodayPlanResult {
  // 1. If an active workout is in progress, prioritize resuming it
  if (activeWorkout) {
    return {
      state: 'IN_PROGRESS',
      activeWorkout,
    };
  }

  // 2. If user has no plans, prompt template chooser
  if (!plans || plans.length === 0) {
    return { state: 'NO_PLANS' };
  }

  // Sort workouts newest first
  const sortedWorkouts = [...workouts].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
  );

  // 3. Check if user already completed a workout today (since local midnight)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const workoutDoneToday = sortedWorkouts.find(
    (w) => new Date(w.startTime).getTime() >= todayStart.getTime(),
  );

  const lastCompleted = sortedWorkouts[0];
  const daysSinceLast = lastCompleted
    ? (Date.now() - new Date(lastCompleted.startTime).getTime()) / 86400000
    : 999;
  const isLongLayoff = daysSinceLast > 14 && !!lastCompleted;

  // Determine the next plan index
  let recommendedIndex = 0;

  if (manualSelectedPlanId) {
    const manualIdx = plans.findIndex((p) => p.id === manualSelectedPlanId);
    if (manualIdx !== -1) {
      recommendedIndex = manualIdx;
    }
  } else if (!isLongLayoff && lastCompleted) {
    const matchedIdx = matchWorkoutToPlanIndex(lastCompleted, plans);
    if (matchedIdx !== -1) {
      recommendedIndex = (matchedIdx + 1) % plans.length;
    }
  }

  const selectedPlan = plans[recommendedIndex] ?? plans[0];
  const prevEquivalent =
    sortedWorkouts.find((w) => w.title === selectedPlan.title) ?? null;

  if (workoutDoneToday && !manualSelectedPlanId) {
    return {
      state: 'COMPLETED_TODAY',
      completedWorkout: workoutDoneToday,
      nextUpPlan: selectedPlan,
      prevEquivalent,
    };
  }

  return {
    state: 'READY_TO_START',
    plan: selectedPlan,
    prevEquivalent,
    isLongLayoff,
  };
}

export interface RecommendedRest {
  seconds: number;
  label: string;
  intensityTier: 'CNS Heavy' | 'Compound' | 'Isolation' | 'Accessory';
}

/**
 * Calculates adaptive rest period based on neurological and muscular fatigue demand.
 * 1. Heavy Central Nervous System (CNS) Barbell Compounds: 120s
 * 2. Moderate Compound Movements (DBs, Cables, Pull-Ups, Dips, Lunges): 90s
 * 3. Standard Isolation Movements (Curls, Pushdowns, Raises, Extensions): 60s
 * 4. Core & Bodyweight Accessories (Planks, Crunches, Calves): 45s
 */
export function getRecommendedRestSeconds(exerciseId: string): RecommendedRest {
  const ex = EXERCISE_MAP[exerciseId];
  if (!ex) {
    return { seconds: 90, label: 'Standard Rest', intensityTier: 'Compound' };
  }

  // 1. Heavy CNS Barbell Compounds
  const heavyCnsSlugs = [
    'deadlift',
    'barbell-deadlift-sumo',
    'squat',
    'front-squat',
    'bench-press',
    'barbell-row',
    'overhead-press',
    'clean-and-jerk',
    'snatch',
    'leg-press',
    't-bar-row',
  ];
  if (heavyCnsSlugs.includes(ex.id) || (ex.type === 'Compound' && ex.equipment === 'Barbell')) {
    return { seconds: 120, label: 'Heavy CNS Recovery (120s)', intensityTier: 'CNS Heavy' };
  }

  // 2. Moderate Compounds
  if (
    ex.type === 'Compound' ||
    [
      'dumbbell-incline-press',
      'dumbbell-bench-press',
      'pull-up',
      'chin-up',
      'lat-pulldown',
      'seated-cable-row',
      'dumbbell-lunge',
      'dumbbell-bulgarian-split-squat',
      'dips',
      'machine-chest-press',
      'machine-row',
    ].includes(ex.id)
  ) {
    return { seconds: 90, label: 'Muscular Recovery (90s)', intensityTier: 'Compound' };
  }

  // 3. Core, Calves & Light Accessories
  if (
    ex.muscleGroup === 'Core' ||
    ex.muscleGroup === 'Calves' ||
    ex.movement === 'Cardio' ||
    (ex.equipment === 'Bodyweight' && ex.type === 'Isolation')
  ) {
    return { seconds: 45, label: 'Fast Turnover (45s)', intensityTier: 'Accessory' };
  }

  // 4. Standard Isolation
  return { seconds: 60, label: 'Hypertrophy Rest (60s)', intensityTier: 'Isolation' };
}

