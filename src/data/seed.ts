import type { BodyMeasurement, Friend, SetType, UserProfile, Workout, WorkoutPlan } from '../types';

let workoutN = 0;
let setN = 0;

function daysAgoIso(daysAgo: number, hour: number, minute = 0, durationMin = 52): { start: string; end: string } {
  const start = new Date();
  start.setDate(start.getDate() - daysAgo);
  start.setHours(hour, minute, 0, 0);
  const end = new Date(start.getTime() + durationMin * 60000);
  return { start: start.toISOString(), end: end.toISOString() };
}

type SetSpec = [number, number] | [number, number, SetType] | [number, number, SetType, number];

function buildWorkout(
  title: string,
  daysAgo: number,
  hour: number,
  durationMin: number,
  exercises: { id: string; targetReps: string; sets: SetSpec[] }[],
  description = '',
): Workout {
  workoutN += 1;
  const { start, end } = daysAgoIso(daysAgo, hour, 0, durationMin);
  return {
    id: `w${workoutN}`,
    title,
    description,
    startTime: start,
    endTime: end,
    source: 'seed',
    exercises: exercises.map((we, wi) => ({
      id: `we${workoutN}-${wi + 1}`,
      exerciseId: we.id,
      order: wi + 1,
      notes: null,
      plannedSets: we.sets.length,
      targetReps: we.targetReps,
      sets: we.sets.map((spec, si) => {
        setN += 1;
        const [weightKg, reps, setType = 'working', rpe = 0] = spec;
        return {
          id: `s${setN}`,
          setIndex: si + 1,
          setType,
          weightKg,
          reps,
          distanceKm: null,
          durationSec: null,
          rpe: rpe || null,
          notes: null,
          supersetId: null,
          completed: true,
          completedAt: new Date(new Date(start).getTime() + wi * 7 * 60000 + si * 90 * 1000).toISOString(),
        };
      }),
    })),
  };
}

/** Cardio workout — exercises use distance/duration instead of weight/reps */
function buildCardioWorkout(
  title: string,
  daysAgo: number,
  hour: number,
  durationMin: number,
  cardio: { id: string; distanceKm: number; durationSec: number }[],
): Workout {
  workoutN += 1;
  const { start, end } = daysAgoIso(daysAgo, hour, 0, durationMin);
  return {
    id: `w${workoutN}`,
    title,
    description: 'Conditioning',
    startTime: start,
    endTime: end,
    source: 'seed',
    exercises: cardio.map((c, wi) => {
      setN += 1;
      return {
        id: `we${workoutN}-${wi + 1}`,
        exerciseId: c.id,
        order: wi + 1,
        notes: null,
        plannedSets: 1,
        targetReps: `${Math.round(c.durationSec / 60)} min`,
        sets: [
          {
            id: `s${setN}`,
            setIndex: 1,
            setType: 'cardio',
            weightKg: null,
            reps: null,
            distanceKm: c.distanceKm,
            durationSec: c.durationSec,
            rpe: null,
            notes: null,
            supersetId: null,
            completed: true,
            completedAt: new Date(new Date(start).getTime() + wi * 5 * 60000).toISOString(),
          },
        ],
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Workout history — 5 weeks of progressive training
// ---------------------------------------------------------------------------

export const SEED_WORKOUTS: Workout[] = [
  // Week 1
  buildWorkout('Push Day', 34, 17, 52, [
    { id: 'bench-press', targetReps: '6-10', sets: [[20, 10], [20, 10], [20, 8]] },
    { id: 'shoulder-press', targetReps: '8-12', sets: [[15, 12], [17.5, 10], [17.5, 8]] },
    { id: 'chest-fly', targetReps: '10-15', sets: [[12, 12], [12, 10]] },
    { id: 'triceps-pushdown', targetReps: '10-15', sets: [[20, 12], [22.5, 10]] },
  ]),
  buildWorkout('Pull Day', 32, 18, 50, [
    { id: 'lat-pulldown', targetReps: '8-12', sets: [[40, 12], [45, 10], [45, 8]] },
    { id: 'seated-cable-row', targetReps: '8-12', sets: [[45, 12], [50, 10]] },
    { id: 'dumbbell-row', targetReps: '8-12', sets: [[20, 12], [22.5, 10]] },
    { id: 'face-pull', targetReps: '12-20', sets: [[25, 15], [25, 15]] },
    { id: 'bicep-curl', targetReps: '8-15', sets: [[12, 12], [12, 10]] },
  ]),
  buildWorkout('Leg Day', 30, 7, 55, [
    { id: 'squat', targetReps: '5-8', sets: [[50, 8], [55, 6], [55, 6]] },
    { id: 'romanian-deadlift', targetReps: '6-10', sets: [[60, 10], [65, 8]] },
    { id: 'leg-press', targetReps: '8-15', sets: [[120, 12], [140, 10]] },
    { id: 'calf-raise', targetReps: '10-20', sets: [[80, 15], [90, 12]] },
  ]),

  // Week 2
  buildWorkout('Upper Body', 26, 18, 49, [
    { id: 'bench-press', targetReps: '6-10', sets: [[20, 10], [22.5, 8], [22.5, 6]] },
    { id: 'seated-cable-row', targetReps: '8-12', sets: [[50, 12], [55, 10]] },
    { id: 'shoulder-press', targetReps: '8-12', sets: [[17.5, 10], [20, 8]] },
    { id: 'hammer-curl', targetReps: '8-15', sets: [[12, 12], [14, 10]] },
  ]),
  buildWorkout('Push Day', 24, 17, 54, [
    { id: 'bench-press', targetReps: '6-10', sets: [[22.5, 8], [22.5, 8], [25, 6]] },
    { id: 'incline-bench-press', targetReps: '6-10', sets: [[20, 8], [20, 8]] },
    { id: 'lateral-raise', targetReps: '12-20', sets: [[8, 15], [8, 12]] },
    { id: 'triceps-pushdown', targetReps: '10-15', sets: [[25, 12], [25, 10]] },
    { id: 'chest-fly', targetReps: '10-15', sets: [[14, 12], [14, 10]] },
  ]),
  buildWorkout('Pull Day', 22, 18, 51, [
    { id: 'lat-pulldown', targetReps: '8-12', sets: [[45, 12], [50, 10], [50, 8]] },
    { id: 'barbell-row', targetReps: '5-10', sets: [[40, 10], [45, 8]] },
    { id: 'face-pull', targetReps: '12-20', sets: [[27.5, 15], [27.5, 15]] },
    { id: 'bicep-curl', targetReps: '8-15', sets: [[14, 10], [14, 8]] },
  ]),

  // Week 3
  buildWorkout('Leg Day', 19, 7, 58, [
    { id: 'squat', targetReps: '5-8', sets: [[55, 8], [60, 6], [60, 5]] },
    { id: 'romanian-deadlift', targetReps: '6-10', sets: [[65, 10], [70, 8]] },
    { id: 'leg-press', targetReps: '8-15', sets: [[140, 12], [160, 10]] },
    { id: 'leg-extension', targetReps: '10-15', sets: [[40, 15], [45, 12]] },
    { id: 'calf-raise', targetReps: '10-20', sets: [[90, 15], [100, 12]] },
  ]),
  buildWorkout('Push Day', 17, 17, 55, [
    { id: 'bench-press', targetReps: '6-10', sets: [[22.5, 8], [25, 6], [25, 5, 'failure', 9]] },
    { id: 'shoulder-press', targetReps: '8-12', sets: [[20, 10], [22.5, 8], [22.5, 8]] },
    { id: 'chest-fly', targetReps: '10-15', sets: [[14, 12], [16, 10]] },
    { id: 'triceps-pushdown', targetReps: '10-15', sets: [[27.5, 12], [30, 10]] },
  ]),
  buildWorkout('Pull Day', 15, 18, 53, [
    { id: 'lat-pulldown', targetReps: '8-12', sets: [[50, 12], [55, 10], [55, 8]] },
    { id: 'dumbbell-row', targetReps: '8-12', sets: [[24, 10], [24, 10]] },
    { id: 'face-pull', targetReps: '12-20', sets: [[30, 15], [30, 12]] },
    { id: 'hammer-curl', targetReps: '8-15', sets: [[14, 10], [16, 8]] },
  ]),

  // Week 4
  buildWorkout('Full Body', 6, 7, 60, [
    { id: 'squat', targetReps: '5-8', sets: [[60, 6], [65, 5]] },
    { id: 'bench-press', targetReps: '6-10', sets: [[25, 6], [27.5, 5]] },
    { id: 'barbell-row', targetReps: '5-10', sets: [[45, 8], [50, 6]] },
    { id: 'shoulder-press', targetReps: '8-12', sets: [[22.5, 8], [22.5, 6]] },
  ]),
  buildWorkout('Push Day', 10, 17, 54, [
    { id: 'bench-press', targetReps: '6-10', sets: [[25, 8], [27.5, 6], [27.5, 5]] },
    { id: 'incline-bench-press', targetReps: '6-10', sets: [[22.5, 8], [22.5, 6]] },
    { id: 'lateral-raise', targetReps: '12-20', sets: [[10, 12], [10, 10]] },
    { id: 'chest-fly', targetReps: '10-15', sets: [[16, 10], [16, 8]] },
    { id: 'triceps-pushdown', targetReps: '10-15', sets: [[30, 12], [32.5, 10]] },
  ]),
  buildWorkout('Pull Day', 8, 18, 52, [
    { id: 'lat-pulldown', targetReps: '8-12', sets: [[55, 10], [60, 8], [60, 8]] },
    { id: 'seated-cable-row', targetReps: '8-12', sets: [[55, 12], [60, 10]] },
    { id: 'bicep-curl', targetReps: '8-15', sets: [[16, 8], [16, 8]] },
    { id: 'face-pull', targetReps: '12-20', sets: [[32.5, 12], [32.5, 12]] },
  ]),

  // Week 5
  buildWorkout('Leg Day', 3, 7, 57, [
    { id: 'squat', targetReps: '5-8', sets: [[65, 6], [70, 5], [60, 8, 'drop']] },
    { id: 'romanian-deadlift', targetReps: '6-10', sets: [[70, 8], [75, 8]] },
    { id: 'leg-press', targetReps: '8-15', sets: [[160, 12], [180, 10]] },
    { id: 'leg-curl', targetReps: '10-15', sets: [[45, 12], [50, 10]] },
    { id: 'calf-raise', targetReps: '10-20', sets: [[100, 15], [110, 12]] },
  ]),
  buildWorkout('Upper Body', 2, 18, 50, [
    { id: 'bench-press', targetReps: '6-10', sets: [[27.5, 6], [27.5, 6], [30, 4, 'failure', 10]] },
    { id: 'seated-cable-row', targetReps: '8-12', sets: [[60, 10], [65, 8]] },
    { id: 'shoulder-press', targetReps: '8-12', sets: [[22.5, 8], [25, 8, 'working', 8]] },
    { id: 'hammer-curl', targetReps: '8-15', sets: [[16, 10], [18, 8]] },
  ]),
  buildWorkout('Push Day', 1, 17, 54, [
    { id: 'bench-press', targetReps: '6-10', sets: [[27.5, 8], [30, 6], [30, 6]] },
    { id: 'incline-bench-press', targetReps: '6-10', sets: [[22.5, 8], [25, 6]] },
    { id: 'lateral-raise', targetReps: '12-20', sets: [[10, 12], [12, 10]] },
    { id: 'triceps-pushdown', targetReps: '10-15', sets: [[32.5, 12], [35, 10]] },
    { id: 'chest-fly', targetReps: '10-15', sets: [[16, 12], [18, 10]] },
  ]),

  // Cardio session
  buildCardioWorkout('Conditioning', 13, 7, 28, [
    { id: 'treadmill-run', distanceKm: 4.2, durationSec: 1680 },
    { id: 'rower', distanceKm: 1.5, durationSec: 600 },
  ]),
];

// ---------------------------------------------------------------------------
// Plans (workout templates)
// ---------------------------------------------------------------------------

export const SEED_PLANS: WorkoutPlan[] = [
  {
    id: 'plan-push', title: 'Push Day', emoji: '🔥', muscles: ['Chest', 'Shoulders', 'Triceps'],
    exercises: [
      { exerciseId: 'bench-press', sets: 4, targetReps: '6-10' },
      { exerciseId: 'incline-bench-press', sets: 3, targetReps: '8-12' },
      { exerciseId: 'shoulder-press', sets: 3, targetReps: '8-12' },
      { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
      { exerciseId: 'triceps-pushdown', sets: 3, targetReps: '10-15' },
      { exerciseId: 'chest-fly', sets: 3, targetReps: '10-15' },
    ],
  },
  {
    id: 'plan-pull', title: 'Pull Day', emoji: '🏹', muscles: ['Back', 'Biceps'],
    exercises: [
      { exerciseId: 'lat-pulldown', sets: 4, targetReps: '8-12' },
      { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
      { exerciseId: 'dumbbell-row', sets: 3, targetReps: '8-12' },
      { exerciseId: 'face-pull', sets: 3, targetReps: '12-20' },
      { exerciseId: 'bicep-curl', sets: 3, targetReps: '8-15' },
    ],
  },
  {
    id: 'plan-legs', title: 'Leg Day', emoji: '🦵', muscles: ['Legs', 'Calves'],
    exercises: [
      { exerciseId: 'squat', sets: 4, targetReps: '5-8' },
      { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '6-10' },
      { exerciseId: 'leg-press', sets: 3, targetReps: '8-15' },
      { exerciseId: 'leg-curl', sets: 3, targetReps: '10-15' },
      { exerciseId: 'calf-raise', sets: 3, targetReps: '10-20' },
    ],
  },
  {
    id: 'plan-upper', title: 'Upper Body', emoji: '💪', muscles: ['Chest', 'Back', 'Shoulders'],
    exercises: [
      { exerciseId: 'bench-press', sets: 3, targetReps: '6-10' },
      { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
      { exerciseId: 'shoulder-press', sets: 3, targetReps: '8-12' },
      { exerciseId: 'hammer-curl', sets: 3, targetReps: '8-15' },
    ],
  },
  {
    id: 'plan-full', title: 'Full Body', emoji: '⚡', muscles: ['Chest', 'Back', 'Legs', 'Shoulders'],
    exercises: [
      { exerciseId: 'squat', sets: 3, targetReps: '5-8' },
      { exerciseId: 'bench-press', sets: 3, targetReps: '6-10' },
      { exerciseId: 'barbell-row', sets: 3, targetReps: '5-10' },
      { exerciseId: 'shoulder-press', sets: 3, targetReps: '8-12' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Profile / measurements / friends
// ---------------------------------------------------------------------------

export const SEED_PROFILE: UserProfile = {
  name: 'Alex',
  gender: 'male',
  goal: ['Build Muscle', 'Get Stronger'],
  experience: 'Intermediate',
  frequencyPerWeek: 4,
  equipment: ['Barbell', 'Dumbbell', 'Machine', 'Cable'],
  style: ['Push / Pull / Legs'],
  trainingAgeMonths: 14,
  onboarded: true,
};

export const SEED_MEASUREMENTS: BodyMeasurement[] = (() => {
  const out: BodyMeasurement[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i * 30);
    const progress = i / 5;
    out.push({
      id: `m${i}`,
      date: d.toISOString(),
      weightKg: Math.round((84.2 - progress * 5.1) * 10) / 10,
      bodyFatPct: Math.round((21.5 - progress * 3.4) * 10) / 10,
      chestCm: Math.round(98 + progress * 4.5),
      waistCm: Math.round(88 - progress * 5),
      bicepsCm: Math.round(34.5 + progress * 3.5),
    });
  }
  return out;
})();

export const SEED_FRIENDS: Friend[] = [
  // Note: no "You" placeholder here — the leaderboard always computes the
  // current user's row live (id 'me') from the logged workouts.
  { id: 'f2', name: 'Marcus Lee', isContact: true, score: 78, workoutsThisWeek: 5, prsThisMonth: 2, streak: 9, volumeKg: 41200, avatarHue: 160 },
  { id: 'f3', name: 'Sofia Reyes', isContact: true, score: 71, workoutsThisWeek: 4, prsThisMonth: 3, streak: 14, volumeKg: 28700, avatarHue: 200 },
  { id: 'f4', name: 'James Okafor', isContact: true, score: 64, workoutsThisWeek: 3, prsThisMonth: 1, streak: 6, volumeKg: 35100, avatarHue: 20 },
  { id: 'f5', name: 'Priya Nair', isContact: true, score: 58, workoutsThisWeek: 4, prsThisMonth: 2, streak: 5, volumeKg: 22400, avatarHue: 280 },
  { id: 'f6', name: 'Daniel Kim', isContact: true, score: 52, workoutsThisWeek: 2, prsThisMonth: 1, streak: 4, volumeKg: 18900, avatarHue: 40 },
];

export const SEED_FAVORITES = ['bench-press', 'lat-pulldown', 'squat', 'shoulder-press'];
