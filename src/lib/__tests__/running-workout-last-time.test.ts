/**
 * Running Workout — Last Time Column & Exercise Data Tests
 *
 * Verifies:
 * 1. "Last time" column is filled up for all sets for the whole exercise (no sets left blank).
 * 2. All sets of an exercise have even/consistent values, even when previous workout had fewer sets.
 * 3. Weighted exercises (Barbell, Dumbbell, Cable, Machine) display "N kg × M reps", never just reps.
 * 4. Bodyweight & cardio exercises (Push-up, Pull-up, Plank) display "M reps", never kg.
 * 5. Brand-new exercises with no prior workout history fall back to plan/intelligent defaults.
 */

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { usePulse, Workout } from '../../store/useStore';
import { previousSet, exerciseInvolvesWeights, getDefaultSetValues } from '../stats';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

describe('Running Workout — Last Time Column & Exercise Data', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    usePulse.getState().clearSessionCache();
  });

  it('populates all sets evenly when the previous session only had 1 completed set', () => {
    // Simulate previous workout where Squat only had 1 set completed (90kg x 5 reps)
    const prevWorkout: Workout = {
      id: 'w-prev-squat',
      title: 'Leg Day',
      startTime: '2026-08-15T18:00:00.000Z',
      endTime: '2026-08-15T18:45:00.000Z',
      source: 'user',
      exercises: [
        {
          id: 'we-squat-1',
          exerciseId: 'squat',
          order: 1,
          notes: null,
          plannedSets: 1,
          targetReps: '5',
          sets: [
            {
              id: 's-1',
              setIndex: 1,
              setType: 'working',
              weightKg: 90,
              reps: 5,
              distanceKm: null,
              durationSec: null,
              rpe: null,
              notes: null,
              supersetId: null,
              completed: true,
              completedAt: '2026-08-15T18:15:00.000Z',
            },
          ],
        },
      ],
    };

    // Current running workout with 4 sets of Squats
    const currentSets = [1, 2, 3, 4].map((setIndex) => {
      const p = previousSet([prevWorkout], 'squat', setIndex, 'current-w-id');
      return { setIndex, prev: p };
    });

    // Every set MUST be filled up
    expect(currentSets).toHaveLength(4);
    for (const s of currentSets) {
      expect(s.prev).not.toBeNull();
      expect(s.prev?.weightKg).toBe(90);
      expect(s.prev?.reps).toBe(5);
    }
  });

  it('guarantees weighted exercises (Cable, Machine, Dumbbell, Barbell) have positive weight and format as kg × reps', () => {
    // Test Lat Pulldown (Cable) and Leg Press (Machine)
    expect(exerciseInvolvesWeights('lat-pulldown')).toBe(true);
    expect(exerciseInvolvesWeights('seated-cable-row')).toBe(true);
    expect(exerciseInvolvesWeights('triceps-pushdown')).toBe(true);
    expect(exerciseInvolvesWeights('leg-press')).toBe(true);
    expect(exerciseInvolvesWeights('bench-press')).toBe(true);

    // Even if historical log had null weight for lat pulldown, previousSet provides valid weight
    const cableHistory: Workout = {
      id: 'w-cable-old',
      title: 'Pull Day',
      startTime: '2026-08-10T18:00:00.000Z',
      endTime: '2026-08-10T18:45:00.000Z',
      source: 'user',
      exercises: [
        {
          id: 'we-lat',
          exerciseId: 'lat-pulldown',
          order: 1,
          notes: null,
          plannedSets: 3,
          targetReps: '10',
          sets: [
            {
              id: 's-1',
              setIndex: 1,
              setType: 'working',
              weightKg: null,
              reps: 10,
              distanceKm: null,
              durationSec: null,
              rpe: null,
              notes: null,
              supersetId: null,
              completed: true,
              completedAt: '2026-08-10T18:15:00.000Z',
            },
          ],
        },
      ],
    };

    const p = previousSet([cableHistory], 'lat-pulldown', 1);
    expect(p).not.toBeNull();
    expect(p!.weightKg).toBeGreaterThan(0);
    expect(p!.reps).toBe(10);
  });

  it('strictly returns weightKg = null for bodyweight movements (Pull-up, Push-up, Dips)', () => {
    expect(exerciseInvolvesWeights('pull-up')).toBe(false);
    expect(exerciseInvolvesWeights('push-up')).toBe(false);
    expect(exerciseInvolvesWeights('chin-up')).toBe(false);
    expect(exerciseInvolvesWeights('dips')).toBe(false);
    expect(exerciseInvolvesWeights('plank')).toBe(false);

    const bwHistory: Workout = {
      id: 'w-bw-old',
      title: 'Pull Day',
      startTime: '2026-08-12T18:00:00.000Z',
      endTime: '2026-08-12T18:45:00.000Z',
      source: 'user',
      exercises: [
        {
          id: 'we-pu',
          exerciseId: 'pull-up',
          order: 1,
          notes: null,
          plannedSets: 3,
          targetReps: '6',
          sets: [
            {
              id: 's-1',
              setIndex: 1,
              setType: 'working',
              weightKg: 0,
              reps: 6,
              distanceKm: null,
              durationSec: null,
              rpe: null,
              notes: null,
              supersetId: null,
              completed: true,
              completedAt: '2026-08-12T18:15:00.000Z',
            },
          ],
        },
      ],
    };

    const p = previousSet([bwHistory], 'pull-up', 1);
    expect(p).not.toBeNull();
    expect(p!.weightKg).toBeNull();
    expect(p!.reps).toBe(6);
  });

  it('fills up all sets for brand-new exercises with no prior workout history', () => {
    // User starts a workout with Romanian Deadlift for the first time
    const exId = 'romanian-deadlift';
    const isWeighted = exerciseInvolvesWeights(exId);
    expect(isWeighted).toBe(true);

    const defaults = getDefaultSetValues(exId, 1, 'Intermediate', '8-12');

    expect(defaults.weightKg).toBeGreaterThan(0);
    expect(defaults.reps).toBeGreaterThan(0);
  });

  it('handles historical workout with 2 completed sets when current workout has 4 sets', () => {
    const prevWorkout: Workout = {
      id: 'w-prev-bench',
      title: 'Chest Day',
      startTime: '2026-08-18T10:00:00.000Z',
      endTime: '2026-08-18T11:00:00.000Z',
      source: 'user',
      exercises: [
        {
          id: 'we-bench',
          exerciseId: 'bench-press',
          order: 1,
          notes: null,
          plannedSets: 2,
          targetReps: '8',
          sets: [
            {
              id: 's-1',
              setIndex: 1,
              setType: 'working',
              weightKg: 80,
              reps: 10,
              distanceKm: null,
              durationSec: null,
              rpe: null,
              notes: null,
              supersetId: null,
              completed: true,
              completedAt: '2026-08-18T10:15:00.000Z',
            },
            {
              id: 's-2',
              setIndex: 2,
              setType: 'working',
              weightKg: 85,
              reps: 8,
              distanceKm: null,
              durationSec: null,
              rpe: null,
              notes: null,
              supersetId: null,
              completed: true,
              completedAt: '2026-08-18T10:20:00.000Z',
            },
          ],
        },
      ],
    };

    // Current workout with 4 sets
    const s1 = previousSet([prevWorkout], 'bench-press', 1);
    const s2 = previousSet([prevWorkout], 'bench-press', 2);
    const s3 = previousSet([prevWorkout], 'bench-press', 3);
    const s4 = previousSet([prevWorkout], 'bench-press', 4);

    expect(s1).toEqual({ weightKg: 80, reps: 10, date: '2026-08-18T10:00:00.000Z' });
    expect(s2).toEqual({ weightKg: 85, reps: 8, date: '2026-08-18T10:00:00.000Z' });
    // Sets 3 and 4 should fall back to the last completed set from that same session (Set 2: 85kg x 8)
    expect(s3).toEqual({ weightKg: 85, reps: 8, date: '2026-08-18T10:00:00.000Z' });
    expect(s4).toEqual({ weightKg: 85, reps: 8, date: '2026-08-18T10:00:00.000Z' });
  });

  it('handles non-contiguous historical sets where middle set was skipped', () => {
    const prevWorkout: Workout = {
      id: 'w-prev-overhead',
      title: 'Shoulder Day',
      startTime: '2026-08-19T10:00:00.000Z',
      endTime: '2026-08-19T11:00:00.000Z',
      source: 'user',
      exercises: [
        {
          id: 'we-ohp',
          exerciseId: 'overhead-press',
          order: 1,
          notes: null,
          plannedSets: 3,
          targetReps: '10',
          sets: [
            {
              id: 's-1',
              setIndex: 1,
              setType: 'working',
              weightKg: 40,
              reps: 10,
              distanceKm: null,
              durationSec: null,
              rpe: null,
              notes: null,
              supersetId: null,
              completed: true,
              completedAt: '2026-08-19T10:10:00.000Z',
            },
            {
              id: 's-2',
              setIndex: 2,
              setType: 'working',
              weightKg: 45,
              reps: 8,
              distanceKm: null,
              durationSec: null,
              rpe: null,
              notes: null,
              supersetId: null,
              completed: false, // User skipped set 2
              completedAt: null,
            },
            {
              id: 's-3',
              setIndex: 3,
              setType: 'working',
              weightKg: 45,
              reps: 6,
              distanceKm: null,
              durationSec: null,
              rpe: null,
              notes: null,
              supersetId: null,
              completed: true,
              completedAt: '2026-08-19T10:20:00.000Z',
            },
          ],
        },
      ],
    };

    const s1 = previousSet([prevWorkout], 'overhead-press', 1);
    const s2 = previousSet([prevWorkout], 'overhead-press', 2);
    const s3 = previousSet([prevWorkout], 'overhead-press', 3);

    expect(s1).toEqual({ weightKg: 40, reps: 10, date: '2026-08-19T10:00:00.000Z' });
    // Set 2 was skipped in history; it falls back to the last completed set (Set 3: 45kg x 6)
    expect(s2).toEqual({ weightKg: 45, reps: 6, date: '2026-08-19T10:00:00.000Z' });
    expect(s3).toEqual({ weightKg: 45, reps: 6, date: '2026-08-19T10:00:00.000Z' });
  });

  it('matches exercise aliases seamlessly (e.g. barbell-squat in history matches squat query)', () => {
    const prevWorkout: Workout = {
      id: 'w-prev-alias',
      title: 'Leg Day',
      startTime: '2026-08-20T10:00:00.000Z',
      endTime: '2026-08-20T11:00:00.000Z',
      source: 'user',
      exercises: [
        {
          id: 'we-alias-squat',
          exerciseId: 'barbell-squat', // Alias of 'squat'
          order: 1,
          notes: null,
          plannedSets: 1,
          targetReps: '5',
          sets: [
            {
              id: 's-1',
              setIndex: 1,
              setType: 'working',
              weightKg: 100,
              reps: 5,
              distanceKm: null,
              durationSec: null,
              rpe: null,
              notes: null,
              supersetId: null,
              completed: true,
              completedAt: '2026-08-20T10:15:00.000Z',
            },
          ],
        },
      ],
    };

    const p = previousSet([prevWorkout], 'squat', 1);
    expect(p).not.toBeNull();
    expect(p?.weightKg).toBe(100);
    expect(p?.reps).toBe(5);
  });

  it('handles custom unmapped exercise IDs and defaults to positive weight', () => {
    const customExId = 'custom-unmapped-lift';
    expect(exerciseInvolvesWeights(customExId)).toBe(true);

    const defaults = getDefaultSetValues(customExId, 1);
    expect(defaults.weightKg).toBeGreaterThan(0);
    expect(defaults.reps).toBeGreaterThan(0);

    const customHistory: Workout = {
      id: 'w-custom',
      title: 'Custom Day',
      startTime: '2026-08-21T10:00:00.000Z',
      endTime: '2026-08-21T11:00:00.000Z',
      source: 'user',
      exercises: [
        {
          id: 'we-c-1',
          exerciseId: customExId,
          order: 1,
          notes: null,
          plannedSets: 1,
          targetReps: '10',
          sets: [
            {
              id: 's-1',
              setIndex: 1,
              setType: 'working',
              weightKg: 0, // Missing or zero weight logged
              reps: 10,
              distanceKm: null,
              durationSec: null,
              rpe: null,
              notes: null,
              supersetId: null,
              completed: true,
              completedAt: '2026-08-21T10:15:00.000Z',
            },
          ],
        },
      ],
    };

    const p = previousSet([customHistory], customExId, 1);
    expect(p).not.toBeNull();
    expect(p!.weightKg).toBeGreaterThan(0);
    expect(p!.reps).toBe(10);
  });

  it('strictly returns weightKg = null for cardio exercises', () => {
    expect(exerciseInvolvesWeights('treadmill-running')).toBe(false);
    expect(exerciseInvolvesWeights('cycling')).toBe(false);
    expect(exerciseInvolvesWeights('rowing-machine')).toBe(false);
    expect(exerciseInvolvesWeights('jump-rope')).toBe(false);
    expect(exerciseInvolvesWeights('stair-climber')).toBe(false);

    const cardioHistory: Workout = {
      id: 'w-cardio',
      title: 'Cardio Day',
      startTime: '2026-08-22T10:00:00.000Z',
      endTime: '2026-08-22T10:45:00.000Z',
      source: 'user',
      exercises: [
        {
          id: 'we-cardio-1',
          exerciseId: 'treadmill-running',
          order: 1,
          notes: null,
          plannedSets: 1,
          targetReps: '1',
          sets: [
            {
              id: 's-1',
              setIndex: 1,
              setType: 'cardio',
              weightKg: 50, // Erroneously has weight
              reps: 1,
              distanceKm: 5,
              durationSec: 1800,
              rpe: null,
              notes: null,
              supersetId: null,
              completed: true,
              completedAt: '2026-08-22T10:30:00.000Z',
            },
          ],
        },
      ],
    };

    const p = previousSet([cardioHistory], 'treadmill-running', 1);
    expect(p).not.toBeNull();
    expect(p!.weightKg).toBeNull();
    expect(p!.reps).toBe(1);
  });

  it('safeguards historical sets with null or zero reps by falling back to positive reps', () => {
    const prevWorkout: Workout = {
      id: 'w-zero-reps',
      title: 'Arm Day',
      startTime: '2026-08-23T10:00:00.000Z',
      endTime: '2026-08-23T11:00:00.000Z',
      source: 'user',
      exercises: [
        {
          id: 'we-curl',
          exerciseId: 'barbell-curl',
          order: 1,
          notes: null,
          plannedSets: 1,
          targetReps: '10',
          sets: [
            {
              id: 's-1',
              setIndex: 1,
              setType: 'working',
              weightKg: 30,
              reps: null, // Corrupted/missing reps
              distanceKm: null,
              durationSec: null,
              rpe: null,
              notes: null,
              supersetId: null,
              completed: true,
              completedAt: '2026-08-23T10:15:00.000Z',
            },
          ],
        },
      ],
    };

    const p = previousSet([prevWorkout], 'barbell-curl', 1);
    expect(p).not.toBeNull();
    expect(p!.weightKg).toBe(30);
    expect(p!.reps).toBeGreaterThan(0);
  });

  it('selects the most recent session and excludes the active workout ID', () => {
    const olderWorkout: Workout = {
      id: 'w-older',
      title: 'Push Day 1',
      startTime: '2026-08-01T10:00:00.000Z',
      endTime: '2026-08-01T11:00:00.000Z',
      source: 'user',
      exercises: [
        {
          id: 'we-old-bench',
          exerciseId: 'bench-press',
          order: 1,
          notes: null,
          plannedSets: 1,
          targetReps: '10',
          sets: [
            {
              id: 's-old',
              setIndex: 1,
              setType: 'working',
              weightKg: 70,
              reps: 10,
              distanceKm: null,
              durationSec: null,
              rpe: null,
              notes: null,
              supersetId: null,
              completed: true,
              completedAt: '2026-08-01T10:15:00.000Z',
            },
          ],
        },
      ],
    };

    const newerWorkout: Workout = {
      id: 'w-newer',
      title: 'Push Day 2',
      startTime: '2026-08-15T10:00:00.000Z',
      endTime: '2026-08-15T11:00:00.000Z',
      source: 'user',
      exercises: [
        {
          id: 'we-new-bench',
          exerciseId: 'bench-press',
          order: 1,
          notes: null,
          plannedSets: 1,
          targetReps: '8',
          sets: [
            {
              id: 's-new',
              setIndex: 1,
              setType: 'working',
              weightKg: 85,
              reps: 8,
              distanceKm: null,
              durationSec: null,
              rpe: null,
              notes: null,
              supersetId: null,
              completed: true,
              completedAt: '2026-08-15T10:15:00.000Z',
            },
          ],
        },
      ],
    };

    const currentActiveWorkoutId = 'w-current-active';

    // Must pick the newer workout (85kg x 8), not the older one (70kg x 10)
    const p = previousSet([olderWorkout, newerWorkout], 'bench-press', 1, currentActiveWorkoutId);
    expect(p).toEqual({ weightKg: 85, reps: 8, date: '2026-08-15T10:00:00.000Z' });

    // When excluding the newer workout (e.g. if it were the active workout), it picks the older one
    const pExcluded = previousSet([olderWorkout, newerWorkout], 'bench-press', 1, 'w-newer');
    expect(pExcluded).toEqual({ weightKg: 70, reps: 10, date: '2026-08-01T10:00:00.000Z' });
  });

  it('formats Last Time correctly: kg × reps for weighted, reps for bodyweight, and never undefined', () => {
    const formatPrev = (prev?: { weightKg: number | null; reps: number | null }, isBodyweight = false) => {
      return !isBodyweight && prev?.weightKg != null && prev.weightKg > 0 && prev?.reps != null
        ? `${prev.weightKg} kg × ${prev.reps}`
        : prev?.reps != null
          ? `${prev.reps} reps`
          : '—';
    };

    // Weighted exercise with positive weight
    expect(formatPrev({ weightKg: 100, reps: 5 }, false)).toBe('100 kg × 5');
    expect(formatPrev({ weightKg: 22.5, reps: 10 }, false)).toBe('22.5 kg × 10');

    // Bodyweight exercises
    expect(formatPrev({ weightKg: null, reps: 12 }, true)).toBe('12 reps');
    expect(formatPrev({ weightKg: 0, reps: 8 }, true)).toBe('8 reps');

    // Unset / empty
    expect(formatPrev(undefined, false)).toBe('—');
    expect(formatPrev(undefined, true)).toBe('—');
  });
});
