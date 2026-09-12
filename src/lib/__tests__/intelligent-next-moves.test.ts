import type { ExerciseSet, Workout, WorkoutExercise, WorkoutPlan } from '../../types';
import { nextMoves } from '../stats';

let idCounter = 0;
const uid = (prefix) => prefix + '-' + (++idCounter);

function makeSet(partial) {
  partial = partial || {};
  return { id: uid('s'), setIndex: 1, setType: 'working', weightKg: 80, reps: 8, distanceKm: null, durationSec: null, rpe: null, notes: null, supersetId: null, completed: true, completedAt: new Date().toISOString(), ...partial };
}

function makeWorkoutExercise(exerciseId, sets, partial) {
  partial = partial || {};
  return { id: uid('we'), exerciseId, order: 1, notes: null, plannedSets: sets.length, targetReps: '8-12', sets, ...partial };
}

const todayLocal = new Date();
const daysAgo = (n) => new Date(todayLocal.getFullYear(), todayLocal.getMonth(), todayLocal.getDate() - n, 10).toISOString();
const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();

function makeWorkout(partial) {
  partial = partial || {};
  return { id: uid('w'), title: 'Push Day', description: '', startTime: daysAgo(3), endTime: daysAgo(3), exercises: [], source: 'user', ...partial };
}

const PLANS = [
  { id: 'plan-push', title: 'Push Day', muscles: ['Chest', 'Shoulders', 'Triceps'], emoji: '', exercises: [{ exerciseId: 'bench-press', sets: 3, targetReps: '6-8' }] },
  { id: 'plan-legs', title: 'Leg Day', muscles: ['Quads', 'Hamstrings', 'Calves'], emoji: '', exercises: [{ exerciseId: 'squat', sets: 3, targetReps: '6-8' }] },
];

describe('nextMoves intelligent 8-tier engine', () => {
  it('returns a starter card for a user with 0 workouts', () => {
    const moves = nextMoves([], PLANS);
    expect(moves).toHaveLength(1);
    expect(moves[0].kind).toBe('starter');
    expect(moves[0].action.type).toBe('browse-plans');
  });

  it('returns a recovery card when a workout was completed today', () => {
    const workouts = [makeWorkout({ title: 'Push Day', startTime: hoursAgo(2), endTime: hoursAgo(1), exercises: [makeWorkoutExercise('bench-press', [makeSet()])] })];
    const moves = nextMoves(workouts, PLANS);
    expect(moves[0].kind).toBe('recovery');
    expect(moves[0].action.type).toBe('view-progress');
  });

  it('returns a recovery card for a 3 or more consecutive day training streak', () => {
    // Use days 1, 2, 3 (all yesterday and before = 3-day streak, no today workout)
    // so Tier 1b (streak advisory) fires, not Tier 1a (completed today)
    const workouts = [1, 2, 3].map((n) => makeWorkout({ title: 'Push Day', startTime: daysAgo(n), endTime: daysAgo(n), exercises: [makeWorkoutExercise('bench-press', [makeSet()])] }));
    const moves = nextMoves(workouts, PLANS);
    expect(moves[0].kind).toBe('recovery');
    expect(moves[0].headline).toMatch(/streak/i);
  });


  it('returns a primed card when a plans muscles rested 48-96h', () => {
    const workouts = [makeWorkout({ title: 'Push Day', startTime: hoursAgo(62), endTime: hoursAgo(60), exercises: [makeWorkoutExercise('bench-press', [makeSet()])] })];
    const moves = nextMoves(workouts, PLANS);
    expect(moves.some((m) => m.kind === 'primed')).toBe(true);
    expect(moves.find((m) => m.kind === 'primed').action.type).toBe('start-plan');
  });

  it('returns overload card with concrete +2.5kg target when all planned sets done', () => {
    const sets = [makeSet({ weightKg: 80, reps: 5 }), makeSet({ weightKg: 80, reps: 5 }), makeSet({ weightKg: 80, reps: 5 })];
    const workouts = [makeWorkout({ startTime: daysAgo(3), endTime: daysAgo(3), exercises: [makeWorkoutExercise('bench-press', sets, { plannedSets: 3 })] })];
    const moves = nextMoves(workouts, PLANS);
    const oc = moves.find((m) => m.kind === 'overload');
    expect(oc).toBeDefined();
    expect(oc.overloadTarget.weightKg).toBe(82.5);
    expect(oc.detail).toContain('80');
  });

  it('does NOT emit overload for ad-hoc sets where plannedSets is 0', () => {
    const sets = [makeSet({ weightKg: 80, reps: 5 })];
    const workouts = [makeWorkout({ startTime: daysAgo(3), endTime: daysAgo(3), exercises: [makeWorkoutExercise('bench-press', sets, { plannedSets: 0 })] })];
    const moves = nextMoves(workouts, PLANS);
    expect(moves.every((m) => m.kind !== 'overload')).toBe(true);
  });

  it('surfaces a plan whose muscles have NEVER been trained', () => {
    const workouts = [makeWorkout({ title: 'Leg Day', startTime: daysAgo(2), endTime: daysAgo(2), exercises: [makeWorkoutExercise('squat', [makeSet()])] })];
    const moves = nextMoves(workouts, PLANS);
    const uc = moves.find((m) => m.kind === 'untrained');
    expect(uc).toBeDefined();
    expect(uc.action.planId).toBe('plan-push');
    expect(uc.headline).toMatch(/yet/i);
  });

  it('never returns two cards of the same kind (diversity guarantee)', () => {
    const twoUntrained = [
      { id: 'p1', title: 'Push Day', muscles: ['Chest'], emoji: '', exercises: [] },
      { id: 'p2', title: 'Pull Day', muscles: ['Back'], emoji: '', exercises: [] },
    ];
    const workouts = [makeWorkout({ title: 'Leg Day', startTime: daysAgo(10), endTime: daysAgo(10), exercises: [makeWorkoutExercise('squat', [makeSet()])] })];
    const moves = nextMoves(workouts, twoUntrained);
    const kinds = moves.map((m) => m.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it('handles CSV workouts with empty endTime without NaN errors', () => {
    const workouts = [makeWorkout({ title: 'Push Day', startTime: daysAgo(10), endTime: '', exercises: [makeWorkoutExercise('bench-press', [makeSet()])] })];
    expect(() => nextMoves(workouts, PLANS)).not.toThrow();
    expect(Array.isArray(nextMoves(workouts, PLANS))).toBe(true);
  });
});