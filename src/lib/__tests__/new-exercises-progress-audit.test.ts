import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

import { EXERCISE_MAP, resolveExercise } from '../../data/exercises';
import { getExerciseAnimation } from '../../data/exercise-animations';
import { getExerciseThumb } from '../../data/exercise-thumbnails';
import { prTimeline } from '../../lib/records';
import {
  bestForExercise,
  consistencyPct,
  currentStreak,
  exerciseInvolvesWeights,
  getDefaultSetValues,
  getRecommendedRestSeconds,
  volumeByMuscle,
  volumeBySlug,
  workoutStats,
} from '../../lib/stats';
import type { Workout } from '../../types';

/**
 * Onboarding audit for the 22 exercises added 2026-10-11.
 *
 * Simulates a user training every new exercise on a regular basis and proves
 * each one counts up on every Progress tab through the exact metadata paths
 * those tabs read:
 * - Body tab      → volumeByMuscle (muscleGroup + secondaryMuscles) and
 *                   volumeBySlug (targetSlugs + secondarySlugs)
 * - Strength tab  → bestForExercise (weighted e1RM / bodyweight reps)
 * - Volume tab    → workoutStats (muscles set + set/volume totals)
 * - Regularity    → currentStreak / consistencyPct (date-based counting)
 * - Records tab   → prTimeline (equipment-based 1RM-vs-Reps detection)
 *
 * It also locks the store-level helpers that branch on exercise metadata:
 * exerciseInvolvesWeights (log-screen UI), getDefaultSetValues (sane starter
 * loads), getRecommendedRestSeconds (rest tiers), plus the video/thumb maps.
 */

const WEIGHTED_IDS = [
  'barbell-overhead-press',
  'barbell-curl',
  'trap-bar-deadlift',
  'dumbbell-step-up',
  'kettlebell-overhead-press',
  'landmine-press',
  'spider-curl',
  'wide-grip-bench-press',
  'single-leg-deadlift',
  'kettlebell-sumo-deadlift',
  'dumbbell-close-press',
  'dumbbell-romanian-deadlift',
];

const BODYWEIGHT_IDS = [
  'pike-push-up',
  'incline-push-up',
  'negative-pull-up',
  'wide-push-up',
  'bird-dog',
  'split-squat',
  'reverse-nordic-curl',
  'hollow-hold',
  'l-sit-hold',
  'dragon-flag',
];

const VIDEO_IDS = [...WEIGHTED_IDS.filter((id) => id !== 'dumbbell-romanian-deadlift'), ...BODYWEIGHT_IDS];

function makeWorkout(): Workout {
  const now = new Date().toISOString();
  return {
    id: 'w-audit',
    title: 'Audit Session',
    description: '',
    startTime: now,
    endTime: now,
    source: 'user',
    exercises: [...WEIGHTED_IDS, ...BODYWEIGHT_IDS].map((exerciseId, i) => ({
      id: `we-${i}`,
      exerciseId,
      order: i + 1,
      notes: null,
      plannedSets: 1,
      targetReps: '8',
      sets: [
        {
          id: `s-${i}`,
          setIndex: 1,
          setType: 'working',
          // Bodyweight moves log reps with no load, exactly like the log screen stores them.
          weightKg: BODYWEIGHT_IDS.includes(exerciseId) ? null : 40,
          reps: 8,
          distanceKm: null,
          durationSec: null,
          rpe: null,
          notes: null,
          supersetId: null,
          completed: true,
          completedAt: now,
        },
      ],
    })),
  };
}

describe('New-exercise onboarding audit (all 22 count up on every Progress tab)', () => {
  const workouts = [makeWorkout()];

  it('Body tab: every primary muscle group and secondary muscle counts sets', () => {
    const byMuscle = new Map(volumeByMuscle(workouts).map((r) => [r.muscle, r.sets]));
    for (const id of [...WEIGHTED_IDS, ...BODYWEIGHT_IDS]) {
      const ex = EXERCISE_MAP[id];
      expect(byMuscle.get(ex.muscleGroup)).toBeGreaterThanOrEqual(1);
      for (const sec of ex.secondaryMuscles) {
        expect(byMuscle.get(sec)).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('Body tab: every target slug and secondary slug counts sets', () => {
    const bySlug = new Map(volumeBySlug(workouts).map((r) => [r.slug, r.sets]));
    for (const id of [...WEIGHTED_IDS, ...BODYWEIGHT_IDS]) {
      const ex = EXERCISE_MAP[id];
      expect(ex.targetSlugs.length).toBeGreaterThan(0);
      for (const slug of [...(ex.targetSlugs ?? []), ...(ex.secondarySlugs ?? [])]) {
        expect(bySlug.get(slug)).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('Strength tab: every exercise produces a best (weighted e1RM / bodyweight reps)', () => {
    for (const id of WEIGHTED_IDS) {
      const best = bestForExercise(workouts, id);
      expect(best).not.toBeNull();
      expect(best!.maxWeight.weightKg).toBe(40);
      expect(best!.maxE1rm.e1rm).toBeGreaterThan(40);
    }
    for (const id of BODYWEIGHT_IDS) {
      const best = bestForExercise(workouts, id);
      expect(best).not.toBeNull();
      expect(best!.maxReps.reps).toBe(8);
    }
  });

  it('Volume tab: workout stats include every new muscle group with all 22 sets', () => {
    const stats = workoutStats(workouts[0]);
    expect(stats.sets).toBe(22);
    for (const id of [...WEIGHTED_IDS, ...BODYWEIGHT_IDS]) {
      expect(stats.muscles).toContain(EXERCISE_MAP[id].muscleGroup);
    }
  });

  it('Regularity tab: the session counts toward streak and consistency', () => {
    expect(currentStreak(workouts)).toBeGreaterThanOrEqual(1);
    expect(consistencyPct(workouts, 7)).toBeGreaterThan(0);
  });

  it('Records tab: PR events fire for every exercise with the right kind', () => {
    const events = prTimeline(workouts);
    const byExercise = new Map(events.map((e) => [e.exerciseId, e.kind]));
    for (const id of WEIGHTED_IDS) expect(byExercise.get(id)).toBe('1RM');
    for (const id of BODYWEIGHT_IDS) expect(byExercise.get(id)).toBe('Reps');
  });

  it('log screen branching: only the weighted exercises involve weights', () => {
    for (const id of WEIGHTED_IDS) expect(exerciseInvolvesWeights(id)).toBe(true);
    for (const id of BODYWEIGHT_IDS) expect(exerciseInvolvesWeights(id)).toBe(false);
  });

  it('starter loads are sane (bodyweight stays unloaded)', () => {
    for (const id of BODYWEIGHT_IDS) {
      expect(getDefaultSetValues(id).weightKg).toBe(0);
    }
    for (const id of WEIGHTED_IDS) {
      const { weightKg, reps } = getDefaultSetValues(id);
      expect(weightKg).toBeGreaterThan(0);
      expect(reps).toBeGreaterThanOrEqual(1);
    }
    // Barbell compounds suggest real bar loads, curls stay light.
    expect(getDefaultSetValues('barbell-curl').weightKg).toBeLessThan(
      getDefaultSetValues('trap-bar-deadlift').weightKg,
    );
  });

  it('rest tiers follow the movement (heavy barbell / core / isolation)', () => {
    for (const id of ['trap-bar-deadlift', 'barbell-overhead-press', 'wide-grip-bench-press', 'landmine-press']) {
      expect(getRecommendedRestSeconds(id).seconds).toBe(120);
    }
    for (const id of ['bird-dog', 'hollow-hold', 'l-sit-hold', 'dragon-flag']) {
      expect(getRecommendedRestSeconds(id).seconds).toBe(45);
    }
    for (const id of ['barbell-curl', 'spider-curl']) {
      expect(getRecommendedRestSeconds(id).seconds).toBe(60);
    }
    for (const id of ['dumbbell-step-up', 'split-squat', 'negative-pull-up']) {
      expect(getRecommendedRestSeconds(id).seconds).toBe(90);
    }
  });

  it('canonical ids resolve to themselves (no alias shadowing) and media maps agree', () => {
    for (const id of [...WEIGHTED_IDS, ...BODYWEIGHT_IDS]) {
      expect(resolveExercise(id)?.id).toBe(id);
    }
    // Moved aliases land on the new owners, untouched ones stay put.
    expect(resolveExercise('military press')?.id).toBe('barbell-overhead-press');
    expect(resolveExercise('bb curl')?.id).toBe('barbell-curl');
    expect(resolveExercise('db rdl')?.id).toBe('dumbbell-romanian-deadlift');
    expect(resolveExercise('dumbbell romanian deadlift')?.id).toBe('dumbbell-romanian-deadlift');
    expect(resolveExercise('curl')?.id).toBe('bicep-curl');
    expect(resolveExercise('rdl')?.id).toBe('romanian-deadlift');
    // Every video exercise resolves to a real asset; the video-less RDL
    // cleanly falls back to the muscle map, with an icon thumb fallback.
    for (const id of VIDEO_IDS) {
      const anim = getExerciseAnimation(id);
      expect(anim?.type).toBe('video');
      expect(anim?.aspectRatio).toBeGreaterThan(0);
      expect(getExerciseThumb(id)).toBeDefined();
    }
    expect(getExerciseAnimation('dumbbell-romanian-deadlift')).toBeNull();
    expect(getExerciseThumb('dumbbell-romanian-deadlift')).toBeUndefined();
  });
});
