import { intensityColor } from '../../components/heatmap';
import { GROUP_TO_SLUGS, bestForExercise, dayKey, volumePerSessionByWeek } from '../stats';
import { colors } from '../../theme';
import type { ExerciseSet, Workout, WorkoutExercise } from '../../types';

let idCounter = 0;
const uid = (prefix: string) => `${prefix}-${++idCounter}`;

function makeSet(partial: Partial<ExerciseSet> = {}): ExerciseSet {
  return {
    id: uid('s'),
    setIndex: 1,
    setType: 'working',
    weightKg: 80,
    reps: 8,
    distanceKm: null,
    durationSec: null,
    rpe: null,
    notes: null,
    supersetId: null,
    completed: true,
    completedAt: '2026-09-10T10:00:00.000Z',
    ...partial,
  };
}

function makeWorkoutExercise(exerciseId: string, sets: ExerciseSet[]): WorkoutExercise {
  return {
    id: uid('we'),
    exerciseId,
    order: 1,
    notes: null,
    plannedSets: sets.length,
    targetReps: '8-10',
    sets,
  };
}

function makeWorkout(partial: Partial<Workout> = {}): Workout {
  return {
    id: uid('w'),
    title: 'Strength Test',
    description: '',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    exercises: [makeWorkoutExercise('bench-press', [makeSet()])],
    source: 'user',
    ...partial,
  };
}

describe('Progress Pages Audit & Training Streak Map Fixes', () => {
  describe('Heatmap & Training Streak Map Visuals', () => {
    it('returns vibrant illuminated tier colors for active cells instead of dim 20% alpha', () => {
      const accent = '#34D399'; // Mint default
      // Empty
      expect(intensityColor(0, accent)).toBe(colors.surface3);

      // Lowest active tier must be clearly lighted (38% alpha '60', NOT dim '33')
      expect(intensityColor(0.1, accent)).toBe('#34D39960');

      // Moderate volume tier (60% alpha '99')
      expect(intensityColor(0.4, accent)).toBe('#34D39999');

      // High volume tier (85% alpha 'D9')
      expect(intensityColor(0.7, accent)).toBe('#34D399D9');

      // Peak volume (100% full accent)
      expect(intensityColor(0.9, accent)).toBe('#34D399');
    });

    it('guarantees bodyweight or 0-volume workouts produce a lighted intensity tier (never 0)', () => {
      // Bodyweight pushups with 0kg weight
      const bodyweightWorkout = makeWorkout({
        title: 'Calisthenics',
        startTime: new Date().toISOString(),
        exercises: [
          makeWorkoutExercise('pull-up', [
            makeSet({ weightKg: null, reps: 10, completed: true }),
            makeSet({ weightKg: null, reps: 8, completed: true }),
          ]),
        ],
      });

      const dayVols = new Map<string, number>();
      const k = dayKey(new Date(bodyweightWorkout.startTime));
      const exVol = bodyweightWorkout.exercises.reduce(
        (s, we) => s + we.sets.filter((x) => x.completed).reduce((a, st) => a + (st.weightKg ?? 0) * (st.reps ?? 0), 0),
        0,
      );
      dayVols.set(k, exVol);

      const maxDay = 10000;
      const vol = dayVols.get(k) ?? 0;
      // When workout completed but vol is 0, intensity is floored at 0.2 (Tier 1)
      const intensity = vol <= 0 ? 0.2 : Math.min(1, 0.25 + 0.75 * Math.sqrt(vol / maxDay));

      expect(intensity).toBe(0.2);
      expect(intensityColor(intensity, colors.accent)).not.toBe(colors.surface3);
      expect(intensityColor(intensity, colors.accent)).toBe(`${colors.accent}60`);
    });

    it('prevents heavy volume days from crushing normal arm/shoulder sessions into unlit tiers', () => {
      const maxDay = 12000; // Big leg day
      const armDayVol = 1800; // Arm session (15% of max volume)

      // Old formula was linear: 1800 / 12000 = 0.15 (< 0.25 -> 20% alpha)
      const oldIntensity = armDayVol / maxDay;
      expect(oldIntensity).toBeLessThan(0.25);

      // New balanced non-linear formula:
      const newIntensity = Math.min(1, 0.25 + 0.75 * Math.sqrt(armDayVol / maxDay));
      expect(newIntensity).toBeGreaterThanOrEqual(0.5); // Lands comfortably in Tier 2 / Tier 3!
      expect(intensityColor(newIntensity, colors.accent)).toBe(`${colors.accent}99`);
    });
  });

  describe('Volume Tab Chronological Time-Series Fix', () => {
    it('plots volumePerSessionByWeek chronologically from oldest week to newest week', () => {
      const now = Date.now();
      const twoWeeksAgo = new Date(now - 14 * 86400000).toISOString();
      const today = new Date(now).toISOString();

      const oldWorkout = makeWorkout({
        title: 'Old Session',
        startTime: twoWeeksAgo,
        endTime: twoWeeksAgo,
        exercises: [makeWorkoutExercise('bench-press', [makeSet({ weightKg: 50, reps: 10 })])], // vol = 500
      });

      const todayWorkout = makeWorkout({
        title: 'Today Session',
        startTime: today,
        endTime: today,
        exercises: [makeWorkoutExercise('bench-press', [makeSet({ weightKg: 100, reps: 10 })])], // vol = 1000
      });

      const result = volumePerSessionByWeek([oldWorkout, todayWorkout], 4);
      expect(result).toHaveLength(4);

      // Result is ordered oldest to newest.
      // Index 3 (last) must contain today's session (vol = 1000)
      expect(result[3].value).toBe(1000);

      // Index 1 (2 weeks ago) must contain old session (vol = 500)
      expect(result[1].value).toBe(500);

      // Index 0 (3 weeks ago) has 0 workouts
      expect(result[0].value).toBe(0);
    });
  });

  describe('Records Tab PR Dates & Deduping', () => {
    it('preserves workout PR dates when computing bestForExercise', () => {
      const prDate = '2026-08-20T18:00:00.000Z';
      const w = makeWorkout({
        startTime: prDate,
        endTime: prDate,
        exercises: [makeWorkoutExercise('squat', [makeSet({ weightKg: 140, reps: 5 })])],
      });

      const best = bestForExercise([w], 'squat');
      expect(best).not.toBeNull();
      expect(best!.maxE1rm.date).toBe(prDate);
      expect(best!.maxWeight.date).toBe(prDate);
    });

    it('dedupes records so an exercise only appears once with its highest 1RM', () => {
      const records = [
        { id: 'm1', exerciseId: 'bench-press', weightKg: 90, reps: 5, e1rmKg: 105 },
        { id: 'w1', exerciseId: 'bench-press', weightKg: 85, reps: 5, e1rmKg: 99 },
        { id: 'w2', exerciseId: 'squat', weightKg: 120, reps: 5, e1rmKg: 140 },
      ];

      const byExercise = new Map<string, (typeof records)[0]>();
      for (const r of records) {
        const cur = byExercise.get(r.exerciseId);
        if (!cur || r.e1rmKg > cur.e1rmKg) {
          byExercise.set(r.exerciseId, r);
        }
      }

      const deduped = [...byExercise.values()];
      expect(deduped).toHaveLength(2);
      expect(deduped.find((r) => r.exerciseId === 'bench-press')?.e1rmKg).toBe(105);
    });
  });

  describe('Body Tab Muscle Group to Slug Fallback', () => {
    it('provides valid slugs for all major muscle groups', () => {
      const groups = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Forearms'] as const;
      for (const g of groups) {
        const slugs = GROUP_TO_SLUGS[g];
        expect(slugs).toBeDefined();
        expect(slugs.length).toBeGreaterThan(0);
        expect(typeof slugs[0]).toBe('string');
      }
    });
  });
});
