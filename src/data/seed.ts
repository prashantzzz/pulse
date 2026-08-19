import type { BodyMeasurement, Friend, UserProfile, WorkoutPlan } from '../types';

import { SEED_WORKOUTS } from './seed-workouts';

export { SEED_WORKOUTS };

export const SEED_PLANS: WorkoutPlan[] = [
  {
    id: 'plan-push', title: 'Push Day', emoji: '🔥', muscles: ['Chest', 'Shoulders', 'Triceps'],
    exercises: [
      { exerciseId: 'bench-press', sets: 4, targetReps: '6-8' },
      { exerciseId: 'incline-bench-press', sets: 3, targetReps: '8-10' },
      { exerciseId: 'shoulder-press', sets: 3, targetReps: '8-10' },
      { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-15' },
      { exerciseId: 'triceps-pushdown', sets: 3, targetReps: '10-15' },
    ],
  },
  {
    id: 'plan-pull', title: 'Pull Day', emoji: '🏹', muscles: ['Back', 'Biceps'],
    exercises: [
      { exerciseId: 'deadlift', sets: 3, targetReps: '5-6' },
      { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
      { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
      { exerciseId: 'bicep-curl', sets: 3, targetReps: '8-12' },
      { exerciseId: 'hammer-curl', sets: 2, targetReps: '10-12' },
    ],
  },
  {
    id: 'plan-legs', title: 'Leg Day', emoji: '🦵', muscles: ['Quads', 'Hamstrings', 'Calves'],
    exercises: [
      { exerciseId: 'squat', sets: 4, targetReps: '6-8' },
      { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '8-10' },
      { exerciseId: 'leg-press', sets: 3, targetReps: '10-12' },
      { exerciseId: 'calf-raise', sets: 3, targetReps: '12-15' },
    ],
  },
  {
    id: 'plan-upper', title: 'Upper Body', emoji: '💪', muscles: ['Chest', 'Back', 'Shoulders'],
    exercises: [
      { exerciseId: 'incline-bench-press', sets: 3, targetReps: '8-10' },
      { exerciseId: 'barbell-row', sets: 3, targetReps: '8-10' },
      { exerciseId: 'lat-pulldown', sets: 3, targetReps: '10-12' },
      { exerciseId: 'seated-cable-row', sets: 2, targetReps: '10-12' },
      { exerciseId: 'lateral-raise', sets: 2, targetReps: '15-20' },
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
  heightCm: 178,
  weightKg: 66,
  weightUnit: 'kg',
};

// Body-weight history: a slow, steady bulk from 61.5 kg ~5 months ago up to
// 66 kg today (the user's real numbers) — monthly check-ins.
export const SEED_MEASUREMENTS: BodyMeasurement[] = (() => {
  const out: BodyMeasurement[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i * 30);
    const progress = (5 - i) / 5; // 0 oldest → 1 today
    out.push({
      id: `m${i}`,
      date: d.toISOString(),
      weightKg: Math.round((61.5 + progress * 4.5) * 10) / 10,
      bodyFatPct: Math.round((17 + progress * 2) * 10) / 10,
      chestCm: Math.round(92 + progress * 4),
      waistCm: Math.round(76 + progress * 3),
      bicepsCm: Math.round(33 + progress * 2.5),
    });
  }
  return out;
})();

export const SEED_FRIENDS: Friend[] = [];

export const SEED_FAVORITES = ['bench-press', 'lat-pulldown', 'squat', 'shoulder-press'];
