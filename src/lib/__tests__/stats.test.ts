import type { ExerciseSet, Workout, WorkoutExercise, WorkoutPlan } from '../../types';
import {
  bestForExercise,
  classifyWorkout,
  consistencyPct,
  currentStreak,
  detectPlateaus,
  detectPRs,
  e1rm,
  exerciseInvolvesWeights,
  getDefaultSetValues,
  getRecommendedRestSeconds,
  getSmartTodayPlan,
  getTrainingEfficiency,
  longestStreak,
  matchWorkoutToPlanIndex,
  nextMove,
  plateauForExercise,
  previousSet,
  progressScore,
  setVolume,
  strengthProgression,
  volumeByMuscle,
  volumeBySlug,
  warmupSets,
  workoutRepeatSpecs,
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

  it('detects a first-time bodyweight exercise as a 100% Reps PR with 0kg weight', () => {
    const burpeeSet = makeSet({ setIndex: 1, weightKg: 0, reps: 8 });
    const workout = makeWorkout({
      exercises: [makeWorkoutExercise('burpees', [burpeeSet])],
      endTime: '2026-08-11T10:00:00.000Z',
    });
    const prs = detectPRs(workout, [workout]);
    expect(prs).toHaveLength(1);
    expect(prs[0]).toMatchObject({
      exerciseId: 'burpees',
      weightKg: 0,
      reps: 8,
      kind: 'Reps',
      deltaPct: 100,
      prevWeightKg: null,
      prevReps: null,
    });
  });

  it('detects a higher-rep bodyweight exercise as a Reps PR with correct rep delta and 0kg', () => {
    const prior = makeWorkout({
      exercises: [makeWorkoutExercise('burpees', [makeSet({ setIndex: 1, weightKg: 0, reps: 8 })])],
      endTime: '2026-08-01T10:00:00.000Z',
    });
    const current = makeWorkout({
      exercises: [makeWorkoutExercise('burpees', [makeSet({ setIndex: 1, weightKg: 0, reps: 10 })])],
      endTime: '2026-08-11T10:00:00.000Z',
    });
    const prs = detectPRs(current, [prior, current]);
    expect(prs).toHaveLength(1);
    expect(prs[0]).toMatchObject({
      exerciseId: 'burpees',
      weightKg: 0,
      reps: 10,
      kind: 'Reps',
      deltaPct: 25,
      prevWeightKg: 0,
      prevReps: 8,
    });
  });

  it('does not report a PR for bodyweight exercise with lower or equal reps', () => {
    const prior = makeWorkout({
      exercises: [makeWorkoutExercise('burpees', [makeSet({ setIndex: 1, weightKg: 0, reps: 10 })])],
      endTime: '2026-08-01T10:00:00.000Z',
    });
    const current = makeWorkout({
      exercises: [makeWorkoutExercise('burpees', [makeSet({ setIndex: 1, weightKg: 0, reps: 8 })])],
      endTime: '2026-08-11T10:00:00.000Z',
    });
    expect(detectPRs(current, [prior, current])).toHaveLength(0);
  });

  it('detects a Reps PR for bodyweight exercise when weightKg is null (legacy/imported sets)', () => {
    const prior = makeWorkout({
      exercises: [makeWorkoutExercise('push-up', [makeSet({ setIndex: 1, weightKg: null, reps: 15 })])],
      endTime: '2026-08-01T10:00:00.000Z',
    });
    const current = makeWorkout({
      exercises: [makeWorkoutExercise('push-up', [makeSet({ setIndex: 1, weightKg: null, reps: 20 })])],
      endTime: '2026-08-11T10:00:00.000Z',
    });
    const prs = detectPRs(current, [prior, current]);
    expect(prs).toHaveLength(1);
    expect(prs[0]).toMatchObject({
      exerciseId: 'push-up',
      weightKg: 0,
      reps: 20,
      kind: 'Reps',
      deltaPct: 33.3,
      prevWeightKg: 0,
      prevReps: 15,
    });
  });

  it('correctly tracks weighted bodyweight sets as weight/1RM PRs without forcing weight to 0kg', () => {
    const prior = makeWorkout({
      exercises: [makeWorkoutExercise('dips', [makeSet({ setIndex: 1, weightKg: 10, reps: 6 })])],
      endTime: '2026-08-01T10:00:00.000Z',
    });
    const current = makeWorkout({
      exercises: [makeWorkoutExercise('dips', [makeSet({ setIndex: 1, weightKg: 20, reps: 6 })])],
      endTime: '2026-08-11T10:00:00.000Z',
    });
    const prs = detectPRs(current, [prior, current]);
    expect(prs).toHaveLength(1);
    expect(prs[0].kind).toBe('1RM');
    expect(prs[0].weightKg).toBe(20);
    expect(prs[0].prevWeightKg).toBe(10);
    expect(prs[0].reps).toBe(6);
  });
});

describe('exerciseInvolvesWeights', () => {
  it('identifies weighted vs bodyweight/cardio movements correctly', () => {
    // Weighted exercises
    expect(exerciseInvolvesWeights('bench-press')).toBe(true);
    expect(exerciseInvolvesWeights('squat')).toBe(true);
    expect(exerciseInvolvesWeights('lat-pulldown')).toBe(true);
    expect(exerciseInvolvesWeights('seated-cable-row')).toBe(true);
    expect(exerciseInvolvesWeights('triceps-pushdown')).toBe(true);
    expect(exerciseInvolvesWeights('leg-press')).toBe(true);
    expect(exerciseInvolvesWeights('incline-dumbbell-press')).toBe(true);

    // Bodyweight / Cardio exercises (do NOT involve weights)
    expect(exerciseInvolvesWeights('push-up')).toBe(false);
    expect(exerciseInvolvesWeights('pull-up')).toBe(false);
    expect(exerciseInvolvesWeights('chin-up')).toBe(false);
    expect(exerciseInvolvesWeights('dips')).toBe(false);
    expect(exerciseInvolvesWeights('plank')).toBe(false);
    expect(exerciseInvolvesWeights('treadmill-run')).toBe(false);
    expect(exerciseInvolvesWeights('jump-rope')).toBe(false);
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

  it('can exclude the current workout id (for replaying a finished workout)', () => {
    const w = benchWorkout(90, 8, 3, '2026-08-20T09:00:00.000Z');
    expect(previousSet([w], 'bench-press', 1, w.id)).toBeNull();
    expect(previousSet([w], 'bench-press', 1)).toEqual({ weightKg: 90, reps: 8, date: '2026-08-20T09:00:00.000Z' });
  });

  it('falls back to the last completed set from that same session so all sets stay even and populated', () => {
    // Single completed set in previous session (e.g. 90kg x 5 on squat)
    const singleSetWorkout: Workout = {
      id: 'w-squat-1',
      title: 'Leg Day',
      startTime: '2026-08-15T18:00:00.000Z',
      endTime: '2026-08-15T18:45:00.000Z',
      source: 'user',
      exercises: [
        {
          id: 'we-1',
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

    // Set 1 gets exact set
    expect(previousSet([singleSetWorkout], 'squat', 1)).toEqual({
      weightKg: 90,
      reps: 5,
      date: '2026-08-15T18:00:00.000Z',
    });
    // Set 2, Set 3, Set 4 all fall back to Set 1 from that session — keeping all sets populated and even!
    expect(previousSet([singleSetWorkout], 'squat', 2)).toEqual({
      weightKg: 90,
      reps: 5,
      date: '2026-08-15T18:00:00.000Z',
    });
    expect(previousSet([singleSetWorkout], 'squat', 3)).toEqual({
      weightKg: 90,
      reps: 5,
      date: '2026-08-15T18:00:00.000Z',
    });
    expect(previousSet([singleSetWorkout], 'squat', 4)).toEqual({
      weightKg: 90,
      reps: 5,
      date: '2026-08-15T18:00:00.000Z',
    });
  });

  it('guarantees positive weight for weighted exercises even if historical set had null weight', () => {
    const cableWorkoutNoWeight: Workout = {
      id: 'w-cable-1',
      title: 'Pull Day',
      startTime: '2026-08-12T18:00:00.000Z',
      endTime: '2026-08-12T18:45:00.000Z',
      source: 'user',
      exercises: [
        {
          id: 'we-lat',
          exerciseId: 'lat-pulldown',
          order: 1,
          notes: '7th hole',
          plannedSets: 3,
          targetReps: '10',
          sets: [
            {
              id: 's-lat-1',
              setIndex: 1,
              setType: 'working',
              weightKg: null, // missing weight
              reps: 10,
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

    const res = previousSet([cableWorkoutNoWeight], 'lat-pulldown', 1);
    expect(res).not.toBeNull();
    expect(res!.weightKg).toBeGreaterThan(0); // Never null or 0 for a weighted exercise
    expect(res!.reps).toBe(10);
  });

  it('preserves null weight for bodyweight exercises', () => {
    const bodyweightWorkout: Workout = {
      id: 'w-bw-1',
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
              id: 's-pu-1',
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

    const res = previousSet([bodyweightWorkout], 'pull-up', 1);
    expect(res).not.toBeNull();
    expect(res!.weightKg).toBeNull(); // Strictly null for bodyweight exercises
    expect(res!.reps).toBe(6);
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

  it('returns 0 for empty workouts', () => {
    expect(consistencyPct([], 7)).toBe(0);
    expect(consistencyPct([], 28)).toBe(0);
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
    // 40 (3 workouts) + 16 (2 PRs) + 12 (streak) + 8 (volume capped) + 12 (consistency) + 4 (goals) = 92
    expect(
      progressScore({ workoutsThisWeek: 3, prsThisMonth: 2, streak: 3, volumeKg: 48000, consistency: 12, goalCompletion: 1 }),
    ).toBe(92);
  });

  it('caps raw volume so it can never dominate the score', () => {
    const base = { workoutsThisWeek: 1, prsThisMonth: 0, streak: 1, consistency: 10, goalCompletion: 0 };
    expect(progressScore({ ...base, volumeKg: 40000 })).toBe(progressScore({ ...base, volumeKg: 1e9 }));
    expect(progressScore({ ...base, volumeKg: 1e9 })).toBeLessThan(50); // volume alone can't carry anyone
  });

  it('rewards consistency more than volume at the margin', () => {
    const a = progressScore({ workoutsThisWeek: 2, prsThisMonth: 0, streak: 4, volumeKg: 80000, consistency: 5, goalCompletion: 0.5 });
    const b = progressScore({ workoutsThisWeek: 2, prsThisMonth: 0, streak: 4, volumeKg: 0, consistency: 15, goalCompletion: 0.5 });
    // raising consistency 5% → 15% (10 pts) outpoints 80,000 kg of extra volume (capped 8 pts)
    expect(b).toBeGreaterThan(a);
  });
});

// ---------------------------------------------------------------------------
// Warm-up suggestions
// ---------------------------------------------------------------------------

describe('warmupSets', () => {
  it('ramps 25/50/75/~87% of the working weight with standard rep counts', () => {
    expect(warmupSets(80)).toEqual([
      { kg: 20, reps: 10 },
      { kg: 40, reps: 8 },
      { kg: 60, reps: 5 },
      { kg: 70, reps: 3 },
    ]);
  });

  it('rounds to the nearest plate step and drops bar-only steps', () => {
    expect(warmupSets(62.5)).toEqual([
      { kg: 30, reps: 8 },
      { kg: 45, reps: 5 },
      { kg: 52.5, reps: 3 },
    ]);
  });

  it('returns nothing below a meaningful working weight', () => {
    expect(warmupSets(39)).toEqual([]);
    expect(warmupSets(20)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Plateau detection
// ---------------------------------------------------------------------------

describe('detectPlateaus', () => {
  const recent = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

  it('flags an exercise stuck at the same load across four sessions', () => {
    const workouts = [5, 10, 15, 20].map((d) => benchWorkout(60, 5, 3, recent(d)));
    const plateaus = detectPlateaus(workouts);
    expect(plateaus).toHaveLength(1);
    expect(plateaus[0]).toMatchObject({ exerciseId: 'bench-press', sessions: 4, spreadKg: 0 });
  });

  it('does not flag an exercise that is progressing', () => {
    const workouts = [5, 10, 15, 20].map((d, i) => benchWorkout(60 + i * 5, 5, 3, recent(d)));
    expect(detectPlateaus(workouts)).toHaveLength(0);
  });

  it('skips regressions — the all-time best is clearly above the recent window', () => {
    const workouts = [
      benchWorkout(100, 5, 1, recent(30)), // old all-time best
      benchWorkout(60, 5, 1, recent(5)),
      benchWorkout(60, 5, 1, recent(10)),
      benchWorkout(60, 5, 1, recent(15)),
      benchWorkout(60, 5, 1, recent(20)),
    ];
    expect(detectPlateaus(workouts)).toHaveLength(0);
  });

  it('needs at least the minimum number of sessions', () => {
    const workouts = [5, 10, 15].map((d) => benchWorkout(60, 5, 1, recent(d)));
    expect(detectPlateaus(workouts, { minSessions: 4 })).toHaveLength(0);
    expect(detectPlateaus(workouts, { minSessions: 3 })).toHaveLength(1);
  });

  it('ignores exercises logged without weight (no load to stall on)', () => {
    const workouts = [5, 10, 15, 20].map((d) =>
      makeWorkout({
        endTime: recent(d),
        exercises: [makeWorkoutExercise('lat-pulldown', [makeSet({ weightKg: null, reps: 10 })])],
      }),
    );
    expect(detectPlateaus(workouts)).toHaveLength(0);
  });

  it('plateauForExercise finds a single exercise or returns null', () => {
    const workouts = [5, 10, 15, 20].map((d) => benchWorkout(60, 5, 1, recent(d)));
    expect(plateauForExercise(workouts, 'bench-press')?.exerciseId).toBe('bench-press');
    expect(plateauForExercise(workouts, 'squat')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Repeat workout
// ---------------------------------------------------------------------------

describe('workoutRepeatSpecs', () => {
  it('recreates exercise structure from completed sets', () => {
    const w = makeWorkout({
      title: 'Push Day',
      exercises: [
        makeWorkoutExercise('bench-press', [makeSet({ completed: true }), makeSet({ completed: true }), makeSet({ completed: false })], { targetReps: '6-8', plannedSets: 3 }),
        makeWorkoutExercise('lateral-raise', [makeSet({ completed: false })], { targetReps: '', plannedSets: 4 }),
      ],
    });
    expect(workoutRepeatSpecs(w)).toEqual([
      { exerciseId: 'bench-press', sets: 2, targetReps: '6-8' },
      { exerciseId: 'lateral-raise', sets: 4, targetReps: '8-12' },
    ]);
  });
});

// ---------------------------------------------------------------------------
// Next move (one deterministic recommendation)
// ---------------------------------------------------------------------------

const PLANS: WorkoutPlan[] = [
  { id: 'plan-push', title: 'Push Day', muscles: ['Chest', 'Shoulders', 'Triceps'], emoji: '🔥', exercises: [{ exerciseId: 'bench-press', sets: 3, targetReps: '6-8' }] },
  { id: 'plan-legs', title: 'Leg Day', muscles: ['Quads', 'Hamstrings', 'Calves'], emoji: '🦵', exercises: [{ exerciseId: 'squat', sets: 3, targetReps: '6-8' }] },
];

// ---------------------------------------------------------------------------
// Workout categorization (history filters)
// ---------------------------------------------------------------------------

describe('classifyWorkout', () => {
  it('maps plan-style titles to their chip', () => {
    expect(classifyWorkout(makeWorkout({ title: 'Push Day' }))).toBe('Push');
    expect(classifyWorkout(makeWorkout({ title: 'Pull Day' }))).toBe('Pull');
    expect(classifyWorkout(makeWorkout({ title: 'Leg Day' }))).toBe('Legs');
    expect(classifyWorkout(makeWorkout({ title: 'Legs' }))).toBe('Legs');
    expect(classifyWorkout(makeWorkout({ title: 'Upper Body' }))).toBe('Upper');
    expect(classifyWorkout(makeWorkout({ title: 'Full Body' }))).toBe('Full');
  });

  it('maps short CSV-style titles too', () => {
    expect(classifyWorkout(makeWorkout({ title: 'Push' }))).toBe('Push');
    expect(classifyWorkout(makeWorkout({ title: 'Pull' }))).toBe('Pull');
    expect(classifyWorkout(makeWorkout({ title: 'Legs' }))).toBe('Legs');
  });

  it('falls back to content for arbitrary titles (no hints)', () => {
    const pushy = makeWorkout({
      title: 'Chest & Triceps',
      exercises: [
        makeWorkoutExercise('bench-press', [makeSet()]),
        makeWorkoutExercise('lateral-raise', [makeSet()]),
      ],
    });
    expect(classifyWorkout(pushy)).toBe('Push');

    const legy = makeWorkout({
      title: 'My Workout',
      exercises: [makeWorkoutExercise('squat', [makeSet()]), makeWorkoutExercise('leg-press', [makeSet()])],
    });
    expect(classifyWorkout(legy)).toBe('Legs');
  });

  it('classifies a 50/50 push+pull session as Upper (region majority)', () => {
    const w = makeWorkout({
      title: 'Mixed Day',
      exercises: [
        makeWorkoutExercise('bench-press', [makeSet()]),
        makeWorkoutExercise('lat-pulldown', [makeSet()]),
      ],
    });
    expect(classifyWorkout(w)).toBe('Upper');
  });

  it('lands mixed full-body sessions on Full', () => {
    const w = makeWorkout({
      title: 'Conditioning',
      exercises: [
        makeWorkoutExercise('squat', [makeSet()]),
        makeWorkoutExercise('lat-pulldown', [makeSet()]),
        makeWorkoutExercise('treadmill-run', [makeSet()]),
      ],
    });
    expect(classifyWorkout(w)).toBe('Full');
  });

  it('returns Other for workouts with no recognizable exercises', () => {
    // default makeWorkout title is 'Push Day' — use a hint-free title so only
    // the content matters
    expect(classifyWorkout(makeWorkout({ title: 'My Workout', exercises: [] }))).toBe('Other');
    expect(classifyWorkout(makeWorkout({ title: 'My Workout', exercises: [makeWorkoutExercise('not-an-exercise', [makeSet()])] }))).toBe('Other');
  });
});

describe('nextMove', () => {
  it('recommends a plan whose muscles have not been trained recently', () => {
    const workouts = [
      makeWorkout({ title: 'Push Day', startTime: daysAgo(10), endTime: daysAgo(10), exercises: [makeWorkoutExercise('bench-press', [makeSet({ completed: true })])] }),
      makeWorkout({ title: 'Leg Day', startTime: daysAgo(2), endTime: daysAgo(2), exercises: [makeWorkoutExercise('squat', [makeSet({ completed: true })])] }),
    ];
    const move = nextMove(workouts, PLANS);
    expect(move?.kind).toBe('untrained');
    expect(move?.action).toEqual({ type: 'start-plan', planId: 'plan-push', planTitle: 'Push Day' });
    expect(move?.headline).toContain('trained recently');
  });

  it('skips the plan the home hero is already offering', () => {
    const workouts = [
      makeWorkout({ title: 'Push Day', startTime: daysAgo(10), endTime: daysAgo(10), exercises: [makeWorkoutExercise('bench-press', [makeSet({ completed: true })])] }),
      makeWorkout({ title: 'Leg Day', startTime: daysAgo(2), endTime: daysAgo(2), exercises: [makeWorkoutExercise('squat', [makeSet({ completed: true })])] }),
    ];
    expect(nextMove(workouts, PLANS, 'plan-push')?.kind).not.toBe('untrained');
  });

  it('surfaces an exercise close to its all-time PR', () => {
    const workouts = [
      benchWorkout(90, 5, 3, daysAgo(3)), // recent best e1rm = 105
      benchWorkout(100, 5, 3, daysAgo(80)), // all-time best e1rm = 116.7 (outside radar window)
    ];
    const move = nextMove(workouts, PLANS);
    expect(move?.kind).toBe('pr-close');
    expect(move?.action).toEqual({ type: 'view-exercise', exerciseId: 'bench-press', exerciseName: 'Bench Press' });
    expect(move?.pct).toBeGreaterThanOrEqual(90);
  });

  it('flags a stalled exercise when nothing else applies', () => {
    const workouts = [
      // every plan muscle trained within the week; bench stuck at 60 across four sessions
      makeWorkout({ title: 'Leg Day', startTime: daysAgo(1), endTime: daysAgo(1), exercises: [makeWorkoutExercise('squat', [makeSet({ completed: true })])] }),
      makeWorkout({ title: 'Push Day', startTime: daysAgo(2), endTime: daysAgo(2), exercises: [makeWorkoutExercise('bench-press', [makeSet({ weightKg: 60, reps: 5, completed: true })])] }),
      benchWorkout(60, 5, 1, daysAgo(3)),
      benchWorkout(60, 5, 1, daysAgo(4)),
      benchWorkout(60, 5, 1, daysAgo(5)),
    ];
    const move = nextMove(workouts, PLANS);
    expect(move?.kind).toBe('plateau');
    expect(move?.action).toEqual({ type: 'view-exercise', exerciseId: 'bench-press', exerciseName: 'Bench Press' });
  });

  it('returns null when there is nothing worth saying', () => {
    const workouts = [
      makeWorkout({ title: 'Push Day', startTime: daysAgo(1), endTime: daysAgo(1), exercises: [makeWorkoutExercise('bench-press', [makeSet({ weightKg: 70, reps: 5, completed: true })])] }),
      makeWorkout({ title: 'Leg Day', startTime: daysAgo(2), endTime: daysAgo(2), exercises: [makeWorkoutExercise('squat', [makeSet({ weightKg: 80, reps: 5, completed: true })])] }),
      benchWorkout(60, 5, 1, daysAgo(5)),
      benchWorkout(65, 5, 1, daysAgo(4)),
      benchWorkout(70, 5, 1, daysAgo(3)),
    ];
    expect(nextMove(workouts, PLANS)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Muscle & Anatomical Slug Volume Tracking & Training Efficiency
// ---------------------------------------------------------------------------

describe('volumeByMuscle and volumeBySlug', () => {
  it('correctly maps template plans, custom builder plans, ad-hoc logs, and alias names', () => {
    const workouts: Workout[] = [
      makeWorkout({
        title: 'Pull Session',
        exercises: [
          // Canonical ID: Upper Back / Lats
          makeWorkoutExercise('lat-pulldown', [
            makeSet({ weightKg: 60, reps: 10, completed: true }),
            makeSet({ weightKg: 60, reps: 10, completed: true }),
          ]),
          // Alias / Name match: Trapezius
          makeWorkoutExercise('db shrug', [
            makeSet({ weightKg: 30, reps: 12, completed: true }),
            makeSet({ weightKg: 30, reps: 12, completed: true }),
          ]),
          // Lower Back
          makeWorkoutExercise('hyperextension', [
            makeSet({ weightKg: 10, reps: 15, completed: true }),
          ]),
        ],
      }),
    ];

    const byGroup = volumeByMuscle(workouts);
    const backGroup = byGroup.find((g) => g.muscle === 'Back');
    expect(backGroup).toBeDefined();
    expect(backGroup!.sets).toBe(5); // 2 + 2 + 1

    const bySlug = volumeBySlug(workouts);
    const upperBack = bySlug.find((s) => s.slug === 'upper-back');
    const traps = bySlug.find((s) => s.slug === 'trapezius');
    const lowerBack = bySlug.find((s) => s.slug === 'lower-back');

    expect(upperBack).toBeDefined();
    expect(upperBack!.sets).toBe(2);
    expect(upperBack!.volume).toBe(1200);

    expect(traps).toBeDefined();
    expect(traps!.sets).toBe(2);
    expect(traps!.volume).toBe(720);

    expect(lowerBack).toBeDefined();
    expect(lowerBack!.sets).toBe(1);
    expect(lowerBack!.volume).toBe(150);
  });

  it('allocates secondary fractional volume (50%) and sets to secondary muscles like Core, Triceps, and Shoulders', () => {
    const workouts: Workout[] = [
      makeWorkout({
        title: 'Full Body Compound Session',
        exercises: [
          // Bench Press: Primary Chest (100%), Secondary Triceps (50%), Shoulders (50%)
          makeWorkoutExercise('bench-press', [
            makeSet({ weightKg: 100, reps: 10, completed: true }), // 1,000 kg
            makeSet({ weightKg: 100, reps: 10, completed: true }), // 1,000 kg
          ]),
          // Squat: Primary Quads (100%), Secondary Glutes (50%), Core (50%)
          makeWorkoutExercise('squat', [
            makeSet({ weightKg: 120, reps: 10, completed: true }), // 1,200 kg
            makeSet({ weightKg: 120, reps: 10, completed: true }), // 1,200 kg
          ]),
        ],
      }),
    ];

    const byGroup = volumeByMuscle(workouts);
    const chest = byGroup.find((g) => g.muscle === 'Chest');
    const quads = byGroup.find((g) => g.muscle === 'Quads');
    const triceps = byGroup.find((g) => g.muscle === 'Triceps');
    const shoulders = byGroup.find((g) => g.muscle === 'Shoulders');
    const core = byGroup.find((g) => g.muscle === 'Core');
    const glutes = byGroup.find((g) => g.muscle === 'Glutes');

    // Primary: 100% volume & sets
    expect(chest?.volume).toBe(2000);
    expect(chest?.sets).toBe(2);
    expect(quads?.volume).toBe(2400);
    expect(quads?.sets).toBe(2);

    // Secondary: 50% volume & sets
    expect(triceps?.volume).toBe(1000);
    expect(triceps?.sets).toBe(1);
    expect(shoulders?.volume).toBe(1000);
    expect(shoulders?.sets).toBe(1);
    expect(core?.volume).toBe(1200);
    expect(core?.sets).toBe(1);
    expect(glutes?.volume).toBe(1200);
    expect(glutes?.sets).toBe(1);

    // Slug-level: check that anatomical abs received secondary volume from Squats
    const bySlug = volumeBySlug(workouts);
    const absSlug = bySlug.find((s) => s.slug === 'abs');
    expect(absSlug).toBeDefined();
    expect(absSlug!.volume).toBeGreaterThan(0);
    expect(absSlug!.sets).toBeGreaterThan(0);
  });

  it('calculates training efficiency accurately based on weekly set volume', () => {
    expect(getTrainingEfficiency(8)).toEqual({ status: 'Well Trained', intensity: 1.0, level: 3 });
    expect(getTrainingEfficiency(6)).toEqual({ status: 'Well Trained', intensity: 1.0, level: 3 });
    expect(getTrainingEfficiency(4.5)).toEqual({ status: 'Moderate', intensity: 0.5, level: 2 });
    expect(getTrainingEfficiency(3)).toEqual({ status: 'Moderate', intensity: 0.5, level: 2 });
    expect(getTrainingEfficiency(1.5)).toEqual({ status: 'Undertrained', intensity: 0.25, level: 1 });
    expect(getTrainingEfficiency(0)).toEqual({ status: 'Undertrained', intensity: 0.25, level: 1 });
  });
});

// ---------------------------------------------------------------------------
// Smart Next-Workout Recommendation Engine Tests
// ---------------------------------------------------------------------------

describe('Smart Next-Workout Recommendation Engine (getSmartTodayPlan)', () => {
  const samplePlans: WorkoutPlan[] = [
    {
      id: 'plan-push',
      title: 'Push Power',
      muscles: ['Chest', 'Triceps', 'Shoulders'],
      emoji: '💪',
      exercises: [
        { exerciseId: 'bench-press', sets: 3, targetReps: '8-10' },
        { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '10-12' },
        { exerciseId: 'triceps-pushdown', sets: 3, targetReps: '12-15' },
      ],
    },
    {
      id: 'plan-pull',
      title: 'Pull Hypertrophy',
      muscles: ['Back', 'Biceps'],
      emoji: '⚡',
      exercises: [
        { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-10' },
        { exerciseId: 'dumbbell-row', sets: 3, targetReps: '10-12' },
        { exerciseId: 'bicep-curl', sets: 3, targetReps: '12-15' },
      ],
    },
    {
      id: 'plan-legs',
      title: 'Legs & Calves',
      muscles: ['Quads', 'Hamstrings', 'Calves'],
      emoji: '🦵',
      exercises: [
        { exerciseId: 'squat', sets: 4, targetReps: '6-8' },
        { exerciseId: 'standing-calf-raise', sets: 4, targetReps: '12-15' },
      ],
    },
  ];

  it('returns NO_PLANS when user has no plans created', () => {
    const result = getSmartTodayPlan([], []);
    expect(result.state).toBe('NO_PLANS');
  });

  it('prioritizes IN_PROGRESS state when an active workout is currently running', () => {
    const active = makeWorkout({ id: 'active-1', title: 'Active Push' });
    const result = getSmartTodayPlan([], samplePlans, active);
    expect(result.state).toBe('IN_PROGRESS');
    expect(result.activeWorkout?.id).toBe('active-1');
  });

  it('returns Day 1 (Push) when user has 0 prior workouts in history', () => {
    const result = getSmartTodayPlan([], samplePlans);
    expect(result.state).toBe('READY_TO_START');
    expect(result.plan?.id).toBe('plan-push');
  });

  it('advances to Day 2 (Pull) after Day 1 (Push) even when user takes 3 rest days', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    const workouts: Workout[] = [
      makeWorkout({
        title: 'Push Power',
        startTime: threeDaysAgo,
        endTime: threeDaysAgo,
        exercises: [
          makeWorkoutExercise('bench-press', [makeSet({ weightKg: 80, reps: 10, completed: true })]),
        ],
      }),
    ];

    const result = getSmartTodayPlan(workouts, samplePlans);
    expect(result.state).toBe('READY_TO_START');
    expect(result.plan?.id).toBe('plan-pull'); // Day 2, not skipped!
  });

  it('accurately identifies COMPLETED_TODAY when user logged a workout earlier today', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
    const workouts: Workout[] = [
      makeWorkout({
        title: 'Push Power',
        startTime: fiveMinutesAgo,
        endTime: fiveMinutesAgo,
        exercises: [
          makeWorkoutExercise('bench-press', [makeSet({ weightKg: 80, reps: 10, completed: true })]),
        ],
      }),
    ];

    const result = getSmartTodayPlan(workouts, samplePlans);
    expect(result.state).toBe('COMPLETED_TODAY');
    expect(result.completedWorkout?.title).toBe('Push Power');
    expect(result.nextUpPlan?.id).toBe('plan-pull'); // Previews tomorrow's session
  });

  it('resolves arbitrary custom plan names (e.g. "My Custom Alpha") via 3-tier exercise and muscle matching', () => {
    const customPlans: WorkoutPlan[] = [
      {
        id: 'cp-1',
        title: 'My Custom Alpha',
        muscles: ['Chest', 'Triceps', 'Shoulders'],
        emoji: '🔥',
        exercises: [
          { exerciseId: 'bench-press', sets: 3, targetReps: '10' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '10' },
        ],
      },
      {
        id: 'cp-2',
        title: 'Session Destroyer',
        muscles: ['Back', 'Biceps'],
        emoji: '⚡',
        exercises: [
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '10' },
          { exerciseId: 'bicep-curl', sets: 3, targetReps: '10' },
        ],
      },
    ];

    // User logs an ad-hoc session with a random title "Gym with Alex" containing bench and incline DB press
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
    const workouts: Workout[] = [
      makeWorkout({
        title: 'Gym with Alex',
        startTime: twoDaysAgo,
        endTime: twoDaysAgo,
        exercises: [
          makeWorkoutExercise('bench-press', [makeSet({ weightKg: 80, reps: 10, completed: true })]),
          makeWorkoutExercise('incline-dumbbell-bench-press', [makeSet({ weightKg: 28, reps: 10, completed: true })]),
        ],
      }),
    ];

    const matchedIdx = matchWorkoutToPlanIndex(workouts[0], customPlans);
    expect(matchedIdx).toBe(0); // Matched to 'My Custom Alpha' via exercise overlap!

    const result = getSmartTodayPlan(workouts, customPlans);
    expect(result.state).toBe('READY_TO_START');
    expect(result.plan?.id).toBe('cp-2'); // Recommends 'Session Destroyer' next!
  });

  it('restarts from Day 1 after a long layoff (> 14 days inactivity)', () => {
    const twentyDaysAgo = new Date(Date.now() - 20 * 86400000).toISOString();
    const workouts: Workout[] = [
      makeWorkout({
        title: 'Pull Hypertrophy', // Day 2 was done 20 days ago
        startTime: twentyDaysAgo,
        endTime: twentyDaysAgo,
        exercises: [
          makeWorkoutExercise('lat-pulldown', [makeSet({ weightKg: 70, reps: 10, completed: true })]),
        ],
      }),
    ];

    const result = getSmartTodayPlan(workouts, samplePlans);
    expect(result.state).toBe('READY_TO_START');
    expect(result.plan?.id).toBe('plan-push'); // Resets to Day 1!
    expect(result.isLongLayoff).toBe(true);
  });

  it('handles two-a-day workouts by correctly pointing to the sequence after the latest completed session', () => {
    const now = Date.now();
    const morning = new Date(now - 15 * 60000).toISOString();
    const afternoon = new Date(now - 5 * 60000).toISOString();
    const workouts: Workout[] = [
      makeWorkout({
        id: 'w-afternoon',
        title: 'Pull Hypertrophy', // Day 2
        startTime: afternoon,
        endTime: afternoon,
        exercises: [makeWorkoutExercise('lat-pulldown', [makeSet({ weightKg: 70, reps: 10, completed: true })])],
      }),
      makeWorkout({
        id: 'w-morning',
        title: 'Push Power', // Day 1
        startTime: morning,
        endTime: morning,
        exercises: [makeWorkoutExercise('bench-press', [makeSet({ weightKg: 80, reps: 10, completed: true })])],
      }),
    ];

    const result = getSmartTodayPlan(workouts, samplePlans);
    expect(result.state).toBe('COMPLETED_TODAY');
    expect(result.completedWorkout?.id).toBe('w-afternoon');
    expect(result.nextUpPlan?.id).toBe('plan-legs'); // Day 3 (Legs) up next!
  });

  it('allows manual swap override even if a workout was completed today', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
    const workouts: Workout[] = [
      makeWorkout({
        title: 'Push Power',
        startTime: fiveMinutesAgo,
        endTime: fiveMinutesAgo,
        exercises: [makeWorkoutExercise('bench-press', [makeSet({ weightKg: 80, reps: 10, completed: true })])],
      }),
    ];

    // User explicitly overrides by selecting 'plan-legs'
    const result = getSmartTodayPlan(workouts, samplePlans, null, 'plan-legs');
    expect(result.state).toBe('READY_TO_START');
    expect(result.plan?.id).toBe('plan-legs');
  });

  it('safely falls back to Day 1 when previous workout is completely unrecognised (similarity < 0.25)', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    const workouts: Workout[] = [
      makeWorkout({
        title: 'Random Outdoor Run',
        startTime: threeDaysAgo,
        endTime: threeDaysAgo,
        exercises: [], // empty exercises, no match to strength plans
      }),
    ];

    const matchedIdx = matchWorkoutToPlanIndex(workouts[0], samplePlans);
    expect(matchedIdx).toBe(-1); // below confidence threshold

    const result = getSmartTodayPlan(workouts, samplePlans);
    expect(result.state).toBe('READY_TO_START');
    expect(result.plan?.id).toBe('plan-push'); // Falls back cleanly to Day 1
  });
});

describe('Adaptive CNS & Muscular Fatigue Rest Engine (getRecommendedRestSeconds)', () => {
  it('assigns 120s rest for heavy CNS compound barbell exercises', () => {
    const deadlift = getRecommendedRestSeconds('deadlift');
    expect(deadlift.seconds).toBe(120);
    expect(deadlift.intensityTier).toBe('CNS Heavy');

    const squat = getRecommendedRestSeconds('squat');
    expect(squat.seconds).toBe(120);
    expect(squat.intensityTier).toBe('CNS Heavy');

    const bench = getRecommendedRestSeconds('bench-press');
    expect(bench.seconds).toBe(120);
    expect(bench.intensityTier).toBe('CNS Heavy');

    const barbellRow = getRecommendedRestSeconds('barbell-row');
    expect(barbellRow.seconds).toBe(120);
    expect(barbellRow.intensityTier).toBe('CNS Heavy');
  });

  it('assigns 90s rest for moderate compound dumbbell, cable, and bodyweight movements', () => {
    const latPulldown = getRecommendedRestSeconds('lat-pulldown');
    expect(latPulldown.seconds).toBe(90);
    expect(latPulldown.intensityTier).toBe('Compound');

    const pullUp = getRecommendedRestSeconds('pull-up');
    expect(pullUp.seconds).toBe(90);
    expect(pullUp.intensityTier).toBe('Compound');

    const dbIncline = getRecommendedRestSeconds('incline-dumbbell-bench-press');
    expect(dbIncline.seconds).toBe(90);
    expect(dbIncline.intensityTier).toBe('Compound');

    const lunges = getRecommendedRestSeconds('dumbbell-lunge');
    expect(lunges.seconds).toBe(90);
    expect(lunges.intensityTier).toBe('Compound');
  });

  it('assigns 60s rest for standard hypertrophy isolation exercises', () => {
    const bicepCurl = getRecommendedRestSeconds('bicep-curl');
    expect(bicepCurl.seconds).toBe(60);
    expect(bicepCurl.intensityTier).toBe('Isolation');

    const tricepsPushdown = getRecommendedRestSeconds('triceps-pushdown');
    expect(tricepsPushdown.seconds).toBe(60);
    expect(tricepsPushdown.intensityTier).toBe('Isolation');

    const latRaise = getRecommendedRestSeconds('lateral-raise');
    expect(latRaise.seconds).toBe(60);
    expect(latRaise.intensityTier).toBe('Isolation');
  });

  it('assigns 45s rest for core, calves, and light accessory exercises', () => {
    const crunches = getRecommendedRestSeconds('crunch');
    expect(crunches.seconds).toBe(45);
    expect(crunches.intensityTier).toBe('Accessory');

    const calfRaise = getRecommendedRestSeconds('calf-raise');
    expect(calfRaise.seconds).toBe(45);
    expect(calfRaise.intensityTier).toBe('Accessory');
  });
});

describe('getDefaultSetValues', () => {
  it('assigns 0kg for bodyweight movements with lenient reps tailored to experience', () => {
    const pushup = getDefaultSetValues('push-up', 1, 'Beginner');
    expect(pushup.weightKg).toBe(0);
    expect(pushup.reps).toBeGreaterThanOrEqual(8);

    const pullup = getDefaultSetValues('pull-up', 1, 'Beginner');
    expect(pullup.weightKg).toBe(0);
    expect(pullup.reps).toBe(3);

    const pullupAdv = getDefaultSetValues('pull-up', 1, 'Advanced');
    expect(pullupAdv.weightKg).toBe(0);
    expect(pullupAdv.reps).toBe(10);
  });

  it('assigns lenient barbell weights for compound lifts based on experience', () => {
    const benchBeg = getDefaultSetValues('bench-press', 1, 'Beginner');
    expect(benchBeg.weightKg).toBe(20); // standard empty barbell

    const benchAdv = getDefaultSetValues('bench-press', 1, 'Advanced');
    expect(benchAdv.weightKg).toBe(50);

    const squatBeg = getDefaultSetValues('squat', 1, 'Beginner');
    expect(squatBeg.weightKg).toBe(20); // standard empty bar for beginner squat learning
  });

  it('assigns lighter weights for warm-up sets', () => {
    const work = getDefaultSetValues('bench-press', 2, 'Intermediate', undefined, false);
    const warmup = getDefaultSetValues('bench-press', 1, 'Intermediate', undefined, true);
    expect(warmup.weightKg).toBeLessThanOrEqual(work.weightKg);
  });
});




