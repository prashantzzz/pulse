import {
  buildRecords,
  monthlyBestE1rm,
  monthlyPrCounts,
  prTimeline,
  recordsSummary,
  sortRecords,
  type RecordEntry,
} from '../records';
import type { ExerciseSet, ManualPR, Workout, WorkoutExercise } from '../../types';

const NOW = new Date('2026-10-07T12:00:00');

let uid = 0;
const nextId = (p: string) => `${p}-${++uid}`;

function makeSet(partial: Partial<ExerciseSet> = {}): ExerciseSet {
  return {
    id: nextId('s'),
    setIndex: 1,
    setType: 'working',
    weightKg: 80,
    reps: 5,
    distanceKm: null,
    durationSec: null,
    rpe: null,
    notes: null,
    supersetId: null,
    completed: true,
    completedAt: null,
    ...partial,
  };
}

function makeWorkoutExercise(exerciseId: string, sets: ExerciseSet[]): WorkoutExercise {
  return {
    id: nextId('we'),
    exerciseId,
    order: 1,
    notes: null,
    plannedSets: sets.length,
    targetReps: '5',
    sets,
  };
}

function makeWorkout(id: string, endTime: string, exercises: WorkoutExercise[]): Workout {
  return {
    id,
    title: 'Session',
    description: '',
    startTime: endTime,
    endTime,
    source: 'user',
    exercises,
  };
}

// Chronological history: bench PRs in Jan + Aug, squat PRs in May + Sep.
const WORKOUTS: Workout[] = [
  makeWorkout('w1', '2026-01-05T10:00:00.000Z', [
    makeWorkoutExercise('bench-press', [makeSet({ weightKg: 80, reps: 5 })]),
  ]),
  makeWorkout('w2', '2026-05-20T10:00:00.000Z', [
    makeWorkoutExercise('squat', [makeSet({ weightKg: 100, reps: 5 })]),
  ]),
  makeWorkout('w3', '2026-08-10T10:00:00.000Z', [
    makeWorkoutExercise('bench-press', [makeSet({ weightKg: 85, reps: 5 })]),
  ]),
  makeWorkout('w4', '2026-09-15T10:00:00.000Z', [
    makeWorkoutExercise('squat', [makeSet({ weightKg: 110, reps: 5 })]),
  ]),
];

describe('records data layer (all metrics from real history)', () => {
  it('prTimeline records one event per new all-time best, in chronological order', () => {
    const events = prTimeline(WORKOUTS);

    expect(events.map((e) => `${e.exerciseId}@${e.date.slice(0, 7)}`)).toEqual([
      'bench-press@2026-01',
      'squat@2026-05',
      'bench-press@2026-08',
      'squat@2026-09',
    ]);
    // Values are real estimated 1RMs (Epley): 80×5 = 93.33, 110×5 = 128.33
    expect(events[0].value).toBeCloseTo(93.33, 1);
    expect(events[3].value).toBeCloseTo(128.33, 1);
    expect(events[3].weightKg).toBe(110);
    expect(events[3].reps).toBe(5);
  });

  it('ignores incomplete sets and does not count a lower set twice', () => {
    const workouts: Workout[] = [
      makeWorkout('a', '2026-09-01T10:00:00.000Z', [
        makeWorkoutExercise('bench-press', [
          makeSet({ weightKg: 200, reps: 5, completed: false }), // ignored
          makeSet({ weightKg: 100, reps: 5 }),
          makeSet({ weightKg: 90, reps: 5 }), // below the best — no event
        ]),
      ]),
    ];

    const events = prTimeline(workouts);
    expect(events).toHaveLength(1);
    expect(events[0].weightKg).toBe(100);
  });

  it('uses reps for bodyweight exercises (matching detectPRs semantics)', () => {
    const workouts: Workout[] = [
      makeWorkout('bw1', '2026-09-01T10:00:00.000Z', [
        makeWorkoutExercise('pull-up', [makeSet({ weightKg: null, reps: 10 })]),
      ]),
      makeWorkout('bw2', '2026-09-20T10:00:00.000Z', [
        makeWorkoutExercise('pull-up', [makeSet({ weightKg: null, reps: 12 })]),
      ]),
    ];

    const events = prTimeline(workouts);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ kind: 'Reps', value: 10 });
    expect(events[1]).toMatchObject({ kind: 'Reps', value: 12 });
  });

  it('buckets PRs into the last 6 calendar months (oldest → newest)', () => {
    // now = Oct 2026 → buckets: May, Jun, Jul, Aug, Sep, Oct
    expect(monthlyPrCounts(WORKOUTS, 6, NOW)).toEqual([1, 0, 0, 1, 1, 0]);
  });

  it('carries the cumulative best e1RM forward across months and includes manual PRs', () => {
    const manual: ManualPR[] = [
      { id: 'm1', exerciseId: 'squat', weightKg: 120, reps: 3, date: '2026-10-02T10:00:00.000Z' },
    ];

    const withoutManual = monthlyBestE1rm(WORKOUTS, [], 6, NOW);
    expect(withoutManual).toHaveLength(6);
    expect(withoutManual[0]).toBeCloseTo(116.67, 1); // May: squat 100×5
    expect(withoutManual[4]).toBeCloseTo(128.33, 1); // Sep: squat 110×5
    expect(withoutManual[5]).toBeCloseTo(128.33, 1); // Oct carries it forward

    const withManual = monthlyBestE1rm(WORKOUTS, manual, 6, NOW);
    expect(withManual[5]).toBeCloseTo(132, 1); // 120×3 → Epley 132
  });

  it('summarizes PR counts per window and the best e1RM before the last 3 months', () => {
    const summary = recordsSummary(WORKOUTS, [], NOW);

    expect(summary.allTimePrs).toBe(4);
    expect(summary.recentPrs).toBe(2); // Aug + Sep
    expect(summary.prevPrs).toBe(1); // May
    expect(summary.bestE1rm).toBeCloseTo(128.33, 1);
    expect(summary.bestE1rmBefore3m).toBeCloseTo(116.67, 1);
  });

  it('buildRecords keeps the higher of manual PR and workout best, using the real set', () => {
    const manual: ManualPR[] = [
      { id: 'm1', exerciseId: 'bench-press', weightKg: 100, reps: 1, date: '2026-10-01T10:00:00.000Z' },
      { id: 'm2', exerciseId: 'squat', weightKg: 100, reps: 5, date: '2026-06-01T10:00:00.000Z' },
    ];

    const records = buildRecords(WORKOUTS, manual);
    expect(records).toHaveLength(2);

    const bench = records.find((r) => r.exerciseId === 'bench-press')!;
    // Manual 100×1 (e1RM 100) beats the workout best 85×5 (99.17)
    expect(bench.weightKg).toBe(100);
    expect(bench.reps).toBe(1);
    expect(bench.date).toBe('2026-10-01T10:00:00.000Z');

    const squat = records.find((r) => r.exerciseId === 'squat')!;
    // Workout 110×5 (128.33) beats the manual 100×5 (116.67)
    expect(squat.weightKg).toBe(110);
    expect(squat.reps).toBe(5);
    expect(squat.date).toBe('2026-09-15T10:00:00.000Z');
  });

  it('sorts records by 1RM, heaviest weight and recency', () => {
    const entries: RecordEntry[] = [
      { id: 'a', exerciseId: 'a', weightKg: 100, reps: 1, e1rmKg: 100, date: '2026-09-01T00:00:00Z' },
      { id: 'b', exerciseId: 'b', weightKg: 80, reps: 10, e1rmKg: 106.7, date: '2026-08-01T00:00:00Z' },
      { id: 'c', exerciseId: 'c', weightKg: 120, reps: 2, e1rmKg: 128, date: '2026-07-01T00:00:00Z' },
    ];

    expect(sortRecords(entries, 'e1rm').map((r) => r.id)).toEqual(['c', 'b', 'a']);
    expect(sortRecords(entries, 'weight').map((r) => r.id)).toEqual(['c', 'a', 'b']);
    expect(sortRecords(entries, 'recent').map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });
});
