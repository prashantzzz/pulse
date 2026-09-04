import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { EXERCISES, EXERCISE_MAP, swapOptions } from '../../data/exercises';
import type { Workout } from '../../types';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

describe('Exercise Swap Recommendations & Running Workout Context', () => {
  describe('1. Exercise Alternatives Data Integrity', () => {
    it('every alternative across all exercises references a valid canonical exercise in EXERCISE_MAP', () => {
      const invalidPairs: { exercise: string; invalidAlt: string }[] = [];

      for (const ex of EXERCISES) {
        for (const altId of ex.alternatives) {
          if (!EXERCISE_MAP[altId]) {
            invalidPairs.push({ exercise: ex.id, invalidAlt: altId });
          }
        }
      }

      expect(invalidPairs).toEqual([]);
    });

    it('no exercise lists itself as an alternative', () => {
      const selfRefs: string[] = [];

      for (const ex of EXERCISES) {
        if (ex.alternatives.includes(ex.id)) {
          selfRefs.push(ex.id);
        }
      }

      expect(selfRefs).toEqual([]);
    });

    it('validates critical swap recommendations for core exercises', () => {
      // Incline bench press must recommend incline dumbbell press
      const inclineBench = EXERCISE_MAP['incline-bench-press'];
      expect(inclineBench).toBeDefined();
      expect(inclineBench.alternatives).toContain('incline-dumbbell-bench-press');

      // Chest fly must recommend pec-deck (formerly broken machine-fly)
      const chestFly = EXERCISE_MAP['chest-fly'];
      expect(chestFly).toBeDefined();
      expect(chestFly.alternatives).toContain('pec-deck');
      expect(chestFly.alternatives).not.toContain('machine-fly');

      // Face pull must recommend rear-delt-fly (formerly broken band-face-pull)
      const facePull = EXERCISE_MAP['face-pull'];
      expect(facePull).toBeDefined();
      expect(facePull.alternatives).toContain('rear-delt-fly');
      expect(facePull.alternatives).not.toContain('band-face-pull');

      // Deadlift must recommend romanian-deadlift and sumo-deadlift (formerly broken trap-bar-deadlift)
      const deadlift = EXERCISE_MAP['deadlift'];
      expect(deadlift).toBeDefined();
      expect(deadlift.alternatives).toContain('romanian-deadlift');
      expect(deadlift.alternatives).toContain('sumo-deadlift');
      expect(deadlift.alternatives).not.toContain('trap-bar-deadlift');

      // Shoulder press must recommend machine-shoulder-press (not chest machine-press)
      const shoulderPress = EXERCISE_MAP['shoulder-press'];
      expect(shoulderPress).toBeDefined();
      expect(shoulderPress.alternatives).toContain('machine-shoulder-press');
      expect(shoulderPress.alternatives).not.toContain('machine-press');
      expect(shoulderPress.alternatives).not.toContain('push-press');

      // Core exercises must reference hanging-leg-raise (not broken hanging-raise)
      const plank = EXERCISE_MAP['plank'];
      expect(plank).toBeDefined();
      expect(plank.alternatives).toContain('hanging-leg-raise');
      expect(plank.alternatives).not.toContain('hanging-raise');

      const crunch = EXERCISE_MAP['crunch'];
      expect(crunch).toBeDefined();
      expect(crunch.alternatives).toContain('hanging-leg-raise');
      expect(crunch.alternatives).not.toContain('hanging-raise');
    });
  });

  describe('2. swapOptions Algorithm', () => {
    it('returns up to the requested limit of valid unique swap candidates for any exercise', () => {
      for (const ex of EXERCISES) {
        const options = swapOptions(ex, 4);
        expect(options.length).toBeGreaterThan(0);
        expect(options.length).toBeLessThanOrEqual(4);

        // Does not contain self
        expect(options.some((o) => o.id === ex.id)).toBe(false);

        // All returned IDs are distinct
        const ids = options.map((o) => o.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });

    it('prioritizes curated alternatives before falling back to matching movements or muscle groups', () => {
      const squat = EXERCISE_MAP['squat'];
      const swaps = swapOptions(squat, 5);
      expect(swaps.length).toBeGreaterThanOrEqual(3);

      const swapIds = swaps.map((s) => s.id);
      expect(swapIds).toContain('goblet-squat');
      expect(swapIds).toContain('leg-press');
      expect(swapIds).toContain('hack-squat');
    });
  });

  describe('3. Running Workout Context & Add-To-Workout Button Visibility Logic', () => {
    function computeIsFromRunningWorkout(
      fromRunning: string | undefined,
      activeWorkout: Workout | null,
    ): boolean {
      return Boolean(fromRunning) && Boolean(activeWorkout) && !activeWorkout?.endTime;
    }

    const mockActiveWorkout: Workout = {
      id: 'w-active-1',
      title: 'Upper Power',
      description: 'Active session',
      startTime: '2026-09-05T03:00:00Z',
      endTime: '',
      source: 'user',
      exercises: [],
    };

    it('hides Add to Workout button when opened from within a running workout (fromRunning=1 and active workout running)', () => {
      const isFromRunningWorkout = computeIsFromRunningWorkout('1', mockActiveWorkout);
      expect(isFromRunningWorkout).toBe(true);
    });

    it('shows Add to Workout button when navigated from other screens (Library, Home, Builder) even if a workout is running in background', () => {
      // User browses library while workout is active
      const isFromRunningWorkout = computeIsFromRunningWorkout(undefined, mockActiveWorkout);
      expect(isFromRunningWorkout).toBe(false);
    });

    it('shows Add to Workout button when no workout is currently active', () => {
      const isFromRunningWorkout = computeIsFromRunningWorkout('1', null);
      expect(isFromRunningWorkout).toBe(false);
    });

    it('shows Add to Workout button if active workout has already ended/completed', () => {
      const completedWorkout: Workout = {
        ...mockActiveWorkout,
        endTime: '2026-09-05T03:45:00Z',
      };
      const isFromRunningWorkout = computeIsFromRunningWorkout('1', completedWorkout);
      expect(isFromRunningWorkout).toBe(false);
    });
  });
});
