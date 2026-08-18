import type { ExerciseSet, Workout, WorkoutExercise } from '../../types';
import {
  bestForExercise,
  consistencyPct,
  currentStreak,
  detectPRs,
  e1rm,
  longestStreak,
  previousSet,
  progressScore,
  setVolume,
  strengthProgression,
  workoutStats,
} from '../stats';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

let idCounter = 0;
const uid = (prefix: string) => `${prefix}-${++idCounter}`;

function makeSet(partial: Partial<ExerciseSet> = {}): ExerciseSet {
  return {
    id: uid('s'),
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
    completedAt: '2026-08-10T10:00:00.000Z',
    ...partial,
  };
}

function makeWorkoutExercise(exerciseId: string, sets: ExerciseSet[], partial: Partial<WorkoutExercise> = {}): WorkoutExercise {
  return {
    id: uid('we'),
    exerciseId,
    order: 1,
    notes: null,
    plannedSets: sets.length,
    targetReps: '8-12',
    sets,
    ...partial,
  };
}

function makeWorkout(partial: Partial<Workout> = {}): Workout {
  return {
    id: uid('w'),
    title: 'Push Day',
    description: '',
    startTime: '2026-08-10T09:00:00.000Z',
    endTime: '2026-08-10T10:00:00.000Z',
    exercises: [],
    source: 'user',
    ...partial,
  };
}

/** A workout with `n` completed bench-press sets of weight × reps. */
function benchWorkout(weight: number, reps: number, n = 3, when = '2026-08-10T09:00:00.000Z'): Workout {
  const sets = Array.from({ length: n }, (_, i) =>
    makeSet({ id: uid('s'), setIndex: i + 1, weightKg: weight, reps, completedAt: when }),
  );
  return makeWorkout({
    startTime: when,
    endTime: when,
    exercises: [makeWorkoutExercise('bench-press', sets)],
  });
}

// ---------------------------------------------------------------------------
// Set volume & 1RM
// ---------------------------------------------------------------------------

describe('setVolume', () => {
  it('multiplies weight × reps for strength sets', () => {
    expect(setVolume(makeSet({ weightKg: 100, reps: 5 }))).toBe(500);
    expect(setVolume(makeSet({ weightKg: 82.5, reps: 8 }))).toBe(660);
  });

  it('treats cardio distance as meters', () => {
    expect(setVolume(makeSet({ weightKg: null, reps: null, distanceKm: 2 }))).toBe(2000);
  });

  it('falls back to duration in seconds', () => {
    expect(setVolume(makeSet({ weightKg: null, reps: null, distanceKm: null, durationSec: 45 }))).toBe(45);
  });

  it('returns 0 for an unlogged set', () => {
    expect(setVolume(makeSet({ weightKg: null, reps: null }))).toBe(0);
  });
});

describe('e1rm', () => {
  it('returns the weight itself for a single rep', () => {
    expect(e1rm(100, 1)).toBe(100);
  });

  it('applies the Epley formula for multiple reps', () => {
    expect(e1rm(100, 5)).toBeCloseTo(116.67, 2);
    expect(e1rm(80, 10)).toBeCloseTo(106.67, 2);
  });
});

describe('workoutStats', () => {
  it('aggregates volume, sets, reps, duration and muscles across exercises', () => {
    const w = makeWorkout({
      exercises: [
        // bench-press: Chest (+ Triceps, Shoulders)
        makeWorkoutExercise('bench-press', [makeSet({ setIndex: 1, weightKg: 100, reps: 5 }), makeSet({ setIndex: 2, weightKg: 100, reps: 5 }), makeSet({ setIndex: 3, weightKg: 110, reps: 3 })]),
        // squat: Legs (+ Glutes, Core)
        makeWorkoutExercise('squat', [makeSet({ setIndex: 1, weightKg: 140, reps: 5 }), makeSet({ setIndex: 2, weightKg: 140, reps: 5 }), makeSet({ setIndex: 3, weightKg: 140, reps: 5 })]),
      ],
    });

    const stats = workoutStats(w);
    expect(stats.volumeKg).toBe(3430); // 500+500+330 + 700*3
    expect(stats.sets).toBe(6);
    expect(stats.reps).toBe(28);
    expect(stats.durationMin).toBe(60);
    expect(stats.exercises).toBe(2);
    expect(stats.muscles.sort()).toEqual(['Chest', 'Core', 'Glutes', 'Quads', 'Shoulders', 'Triceps']);
  });

  it('ignores incomplete sets', () => {
    const w = makeWorkout({
      exercises: [
        makeWorkoutExercise('bench-press', [
          makeSet({ setIndex: 1, weightKg: 100, reps: 5, completed: true }),
          makeSet({ setIndex: 2, weightKg: 100, reps: 5, completed: false }),
        ]),
      ],
    });
    expect(workoutStats(w).sets).toBe(1);
    expect(workoutStats(w).volumeKg).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Personal records
// ---------------------------------------------------------------------------

describe('bestForExercise', () => {
  it('returns the heaviest, most-repped and strongest set across workouts', () => {
    const workouts = [benchWorkout(100, 5), benchWorkout(90, 12), benchWorkout(120, 3)];
    const best = bestForExercise(workouts, 'bench-press');
    expect(best).not.toBeNull();
    expect(best!.maxWeight).toMatchObject({ weightKg: 120, reps: 3 });
    expect(best!.maxReps).toMatchObject({ weightKg: 90, reps: 12 });
    expect(best!.maxE1rm.e1rm).toBeCloseTo(e1rm(120, 3), 5);
  });

  it('returns null when the exercise was never completed', () => {
    expect(bestForExercise([benchWorkout(100, 5)], 'squat')).toBeNull();
  });
});

describe('strengthProgression', () => {
  const recent = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

  it('plots weekly max e1rm for weighted exercises at their true time slots', () => {
    const workouts = [
      makeWorkout({ endTime: recent(2), exercises: [makeWorkoutExercise('bench-press', [makeSet({ weightKg: 100, reps: 5 })])] }),
      makeWorkout({ endTime: recent(9), exercises: [makeWorkoutExercise('bench-press', [makeSet({ weightKg: 90, reps: 5 })])] }),
    ];
    const prog = strengthProgression(workouts, 'bench-press', 12);
    expect(prog).toHaveLength(12); // every week kept so the x-axis is true
    expect(prog.filter((p) => p.value > 0)).toHaveLength(2);
    expect(prog.every((p) => p.unit === 'kg' || p.value === 0)).toBe(true);
    expect(Math.max(...prog.map((p) => p.value))).toBeCloseTo(Math.round(e1rm(100, 5) * 10) / 10, 5);
  });

  it('falls back to max reps per week when no weight was ever logged', () => {
    const weightless = (reps: number, daysAgo: number) =>
      makeWorkout({
        endTime: recent(daysAgo),
        exercises: [makeWorkoutExercise('lat-pulldown', [makeSet({ weightKg: null, reps })])],
      });
    const workouts = [weightless(10, 2), weightless(12, 9)];
    const prog = strengthProgression(workouts, 'lat-pulldown', 12);
    expect(prog).toHaveLength(12);
    expect(prog.filter((p) => p.value > 0)).toHaveLength(2);
    expect(prog.some((p) => p.unit === 'reps')).toBe(true);
    expect(Math.max(...prog.map((p) => p.value))).toBe(12);
  });

  it('buckets daily when the range is a single week (7D)', () => {
    const workouts = [
      makeWorkout({ endTime: recent(1), exercises: [makeWorkoutExercise('bench-press', [makeSet({ weightKg: 100, reps: 5 })])] }),
      makeWorkout({ endTime: recent(5), exercises: [makeWorkoutExercise('bench-press', [makeSet({ weightKg: 90, reps: 5 })])] }),
    ];
    const prog = strengthProgression(workouts, 'bench-press', 1);
    expect(prog).toHaveLength(7); // last 7 days
    expect(prog.filter((p) => p.value > 0)).toHaveLength(2);
  });

  it('ignores weightless sets when the exercise also has weighted sets', () => {
    const workouts = [
      makeWorkout({
        endTime: recent(2),
        exercises: [
          makeWorkoutExercise('leg-press', [
            makeSet({ weightKg: 100, reps: 10 }),
            makeSet({ weightKg: null, reps: 15 }),
          ]),
        ],
      }),
    ];
    const prog = strengthProgression(workouts, 'leg-press', 12);
    expect(prog.filter((p) => p.value > 0)).toHaveLength(1);
    const filled = prog.find((p) => p.value > 0)!;
    expect(filled.unit).toBe('kg');
    expect(filled.value).toBeCloseTo(Math.round(e1rm(100, 10) * 10) / 10, 5);
  });
});

describe('detectPRs', () => {
  it('marks a first-time lift as a 100% PR', () => {
    const prior = makeWorkout({ title: 'Leg Day', exercises: [makeWorkoutExercise('squat', [makeSet({ setIndex: 1, weightKg: 140, reps: 5 })])] });
    const current = benchWorkout(100, 5, 1, '2026-08-11T09:00:00.000Z');
    const prs = detectPRs(current, [prior, current]);
    expect(prs).toHaveLength(1);
    expect(prs[0]).toMatchObject({ exerciseId: 'bench-press', weightKg: 100, reps: 5, kind: '1RM', deltaPct: 100, prevWeightKg: null });
  });

  it('detects a heavier lift as a weight + 1RM PR with a delta vs the previous best', () => {
    const prior = benchWorkout(100, 5, 1, '2026-08-01T09:00:00.000Z');
    const current = benchWorkout(105, 5, 1, '2026-08-11T09:00:00.000Z');
    const prs = detectPRs(current, [prior, current]);
    expect(prs).toHaveLength(1);
    expect(prs[0].kind).toBe('1RM');
    expect(prs[0].prevWeightKg).toBe(100);
    expect(prs[0].prevReps).toBe(5);
    expect(prs[0].deltaPct).toBeCloseTo(5, 0);
  });

  it('does not report PRs for sets below the previous best', () => {
    const prior = benchWorkout(100, 5, 1, '2026-08-01T09:00:00.000Z');
    const current = benchWorkout(95, 5, 1, '2026-08-11T09:00:00.000Z');
    expect(detectPRs(current, [prior, current])).toHaveLength(0);
  });
});

describe('previousSet', () => {
  it('returns the most recent completed set at the same index', () => {
    const older = benchWorkout(90, 8, 3, '2026-08-01T09:00:00.000Z');
    const newer = benchWorkout(100, 5, 3, '2026-08-05T09:00:00.000Z');
    const hit = previousSet([older, newer], 'bench-press', 2);
    expect(hit).toEqual({ weightKg: 100, reps: 5, date: '2026-08-05T09:00:00.000Z' });
  });

  it('returns null when the exercise has never been done', () => {
    expect(previousSet([benchWorkout(100, 5)], 'squat', 1)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

// Local calendar-day helpers — immune to timezone and DST shifts that would
// otherwise make "n days ago" land on the wrong calendar day.
const todayLocal = new Date();
const daysAgo = (n: number) => new Date(todayLocal.getFullYear(), todayLocal.getMonth(), todayLocal.getDate() - n, 9).toISOString();

describe('currentStreak', () => {
  it('counts consecutive days ending today', () => {
    const workouts = [0, 1, 2].map((n) => makeWorkout({ startTime: daysAgo(n), endTime: daysAgo(n) }));
    expect(currentStreak(workouts)).toBe(3);
  });

  it('keeps the streak alive with one rest day (alternate-day training)', () => {
    const workouts = [0, 2, 4, 6].map((n) => makeWorkout({ startTime: daysAgo(n), endTime: daysAgo(n) }));
    expect(currentStreak(workouts)).toBe(4);
  });

  it('breaks the streak after two consecutive missed days', () => {
    const workouts = [0, 3].map((n) => makeWorkout({ startTime: daysAgo(n), endTime: daysAgo(n) }));
    expect(currentStreak(workouts)).toBe(1);
  });

  it('counts a streak that ended yesterday when there is no workout today', () => {
    const workouts = [1, 2].map((n) => makeWorkout({ startTime: daysAgo(n), endTime: daysAgo(n) }));
    expect(currentStreak(workouts)).toBe(2);
  });
});

describe('longestStreak', () => {
  it('allows one rest day between sessions', () => {
    const workouts = [0, 2, 4].map((n) => makeWorkout({ startTime: daysAgo(n), endTime: daysAgo(n) }));
    expect(longestStreak(workouts)).toBe(3);
  });

  it('resets the run on a two-day gap', () => {
    const workouts = [0, 1, 4].map((n) => makeWorkout({ startTime: daysAgo(n), endTime: daysAgo(n) }));
    expect(longestStreak(workouts)).toBe(2);
  });

  it('finds the longest run across gaps', () => {
    const workouts = [0, 1, 2, 5, 6].map((n) => makeWorkout({ startTime: daysAgo(n), endTime: daysAgo(n) }));
    expect(longestStreak(workouts)).toBe(3);
  });

  it('counts streaks that cross a month boundary', () => {
    // Sep 30 + Oct 1 must be adjacent — non-padded keys would sort wrongly.
    const sep30 = makeWorkout({ startTime: new Date(2026, 8, 30, 9).toISOString(), endTime: new Date(2026, 8, 30, 10).toISOString() });
    const oct1 = makeWorkout({ startTime: new Date(2026, 9, 1, 9).toISOString(), endTime: new Date(2026, 9, 1, 10).toISOString() });
    expect(longestStreak([sep30, oct1])).toBe(2);
  });
});

describe('consistencyPct', () => {
  it('scores alternate-day training as fully consistent', () => {
    const workouts = [0, 2, 4, 6].map((n) => makeWorkout({ startTime: daysAgo(n), endTime: daysAgo(n) }));
    // 7-day window: 4 training days + 3 single rest days between them = 7 active
    expect(consistencyPct(workouts, 7)).toBe(100);
  });

  it('does not credit rest days that follow another rest day', () => {
    const workouts = [0, 3].map((n) => makeWorkout({ startTime: daysAgo(n), endTime: daysAgo(n) }));
    // 7-day window: only the two training days are active
    expect(consistencyPct(workouts, 7)).toBe(29);
  });
});



// ---------------------------------------------------------------------------
// Leaderboard scoring
// ---------------------------------------------------------------------------

describe('progressScore', () => {
  it('is 0 with no activity', () => {
    expect(
      progressScore({ workoutsThisWeek: 0, prsThisMonth: 0, streak: 0, volumeKg: 0, consistency: 0, goalCompletion: 0 }),
    ).toBe(0);
  });

  it('caps at 100', () => {
    expect(
      progressScore({ workoutsThisWeek: 99, prsThisMonth: 99, streak: 99, volumeKg: 1e9, consistency: 99, goalCompletion: 99 }),
    ).toBe(100);
  });

  it('scores balanced activity proportionally', () => {
    expect(
      progressScore({ workoutsThisWeek: 3, prsThisMonth: 2, streak: 3, volumeKg: 48000, consistency: 12, goalCompletion: 1 }),
    ).toBe(96);
  });
});
