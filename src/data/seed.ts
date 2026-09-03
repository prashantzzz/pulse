import type { BodyMeasurement, Friend, UserProfile, WorkoutPlan } from '../types';
import { recommendTemplate } from '../lib/recommendations';
import { templateToPlans } from './templates';
import { SEED_WORKOUTS } from './seed-workouts';

export { SEED_WORKOUTS };

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
  style: ['Upper / Lower'],
  trainingAgeMonths: 14,
  onboarded: true,
  heightCm: 178,
  weightKg: 66,
  weightUnit: 'kg',
};

/**
 * Seeded active routine derived from demo user's profile
 * (Intermediate, 4 Days, Muscle + Strength focus -> Upper / Lower).
 */
export const SEED_PLANS: WorkoutPlan[] = templateToPlans(
  recommendTemplate(SEED_PROFILE).modifiedTemplate,
);

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
