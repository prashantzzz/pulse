import { PROGRAM_TEMPLATES } from '../../data/templates';
import {
  applyGoalModifiers,
  getGoalProfile,
  recommendTemplate,
  selectBaseTemplate,
} from '../recommendations';

describe('Recommendations & Goal Modifiers Engine', () => {
  describe('1. 3x3 Matrix Base Template Selection', () => {
    const matrix = [
      { exp: 'Beginner', days: 3, expectedId: 'beginner-3day' },
      { exp: 'Beginner', days: 4, expectedId: 'beginner-4day' },
      { exp: 'Beginner', days: 5, expectedId: 'beginner-5day' },
      { exp: 'Intermediate', days: 3, expectedId: 'intermediate-3day' },
      { exp: 'Intermediate', days: 4, expectedId: 'intermediate-4day' },
      { exp: 'Intermediate', days: 5, expectedId: 'intermediate-5day' },
      { exp: 'Advanced', days: 3, expectedId: 'advanced-3day' },
      { exp: 'Advanced', days: 4, expectedId: 'advanced-4day' },
      { exp: 'Advanced', days: 5, expectedId: 'advanced-5day' },
    ] as const;

    it('selects the correct base template for all 9 experience × days combinations', () => {
      for (const { exp, days, expectedId } of matrix) {
        const template = selectBaseTemplate(exp, days);
        expect(template.id).toBe(expectedId);
        expect(template.experience).toBe(exp);
        expect(template.daysPerWeek).toBe(days);
      }
    });

    it('should gracefully fallback when experience or days are missing or out-of-range', () => {
      // Missing values
      expect(selectBaseTemplate(null, null).id).toBe('beginner-3day');
      expect(selectBaseTemplate(undefined, undefined).id).toBe('beginner-3day');

      // Clamping days (<= 3 -> 3, >= 5 -> 5)
      expect(selectBaseTemplate('Intermediate', 1).id).toBe('intermediate-3day');
      expect(selectBaseTemplate('Intermediate', 2).id).toBe('intermediate-3day');
      expect(selectBaseTemplate('Intermediate', 6).id).toBe('intermediate-5day');
      expect(selectBaseTemplate('Intermediate', 7).id).toBe('intermediate-5day');

      // Invalid experience strings fallback to Beginner
      expect(selectBaseTemplate('ProLifter' as never, 4).id).toBe('beginner-4day');
    });
  });

  describe('2. Commutative (Order-Independent) Two-Goal Combinations', () => {
    const goalPairs: [string, string][] = [
      ['Build Muscle', 'Get Stronger'],
      ['Build Muscle', 'Lose Weight'],
      ['Build Muscle', 'Improve Endurance'],
      ['Get Stronger', 'Improve Endurance'],
      ['Lose Weight', 'Improve Endurance'],
      ['Stay Healthy', 'Improve Endurance'],
      ['Stay Healthy', 'Lose Weight'],
      ['Stay Healthy', 'Build Muscle'],
      ['Stay Healthy', 'Get Stronger'],
      ['Lose Weight', 'Get Stronger'],
    ];

    it('produces identical profiles regardless of goal order for all pairs', () => {
      for (const [goalA, goalB] of goalPairs) {
        const profileAB = getGoalProfile([goalA, goalB]);
        const profileBA = getGoalProfile([goalB, goalA]);

        expect(profileAB.emphasisTitle).toBe(profileBA.emphasisTitle);
        expect(profileAB.emphasisBadge).toBe(profileBA.emphasisBadge);
        expect(profileAB.emphasisDescription).toBe(profileBA.emphasisDescription);
        expect(profileAB.strengthBias).toBe(profileBA.strengthBias);
        expect(profileAB.goalBadges).toEqual(profileBA.goalBadges);
        expect(profileAB.cardioGuidance?.title).toBe(profileBA.cardioGuidance?.title);
      }
    });

    it('handles Muscle + Strength with strength bias and no extra cardio', () => {
      const profile = getGoalProfile(['Build Muscle', 'Get Stronger']);
      expect(profile.emphasisTitle).toBe('Muscle + Strength');
      expect(profile.strengthBias).toBe(true);
      expect(profile.cardioGuidance).toBeUndefined();
    });

    it('handles Muscle + Lose Weight with hypertrophy bias and activity guidance', () => {
      const profile = getGoalProfile(['Build Muscle', 'Lose Weight']);
      expect(profile.emphasisTitle).toBe('Fat Loss + Muscle Retention');
      expect(profile.strengthBias).toBe(false);
      expect(profile.cardioGuidance).toBeDefined();
      expect(profile.cardioGuidance?.title).toBe('Daily Activity & Cardio Guidance');
    });

    it('handles Endurance combinations with dedicated cardio guidance', () => {
      const combinations = [
        ['Build Muscle', 'Improve Endurance'],
        ['Get Stronger', 'Improve Endurance'],
        ['Lose Weight', 'Improve Endurance'],
        ['Stay Healthy', 'Improve Endurance'],
      ];

      for (const pair of combinations) {
        const profile = getGoalProfile(pair);
        expect(profile.cardioGuidance).toBeDefined();
        expect(profile.cardioGuidance?.sessions.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('3. Single Goal Profiles & Defaults', () => {
    it('handles single goals correctly', () => {
      expect(getGoalProfile(['Build Muscle']).emphasisTitle).toBe('Hypertrophy Focus');
      expect(getGoalProfile(['Get Stronger']).emphasisTitle).toBe('Pure Strength Focus');
      expect(getGoalProfile(['Lose Weight']).emphasisTitle).toBe('Fat Loss & Muscle Retention');
      expect(getGoalProfile(['Improve Endurance']).emphasisTitle).toBe('Strength & Endurance Base');
      expect(getGoalProfile(['Stay Healthy']).emphasisTitle).toBe('Balanced Fitness & Health');
    });

    it('defaults gracefully when goals are empty, null, or undefined', () => {
      const empty = getGoalProfile([]);
      expect(empty.emphasisTitle).toBe('Hypertrophy Focus');

      const nil = getGoalProfile(null);
      expect(nil.emphasisTitle).toBe('Hypertrophy Focus');

      const undef = getGoalProfile(undefined);
      expect(undef.emphasisTitle).toBe('Hypertrophy Focus');
    });
  });

  describe('4. Strict Immutability of Base Templates', () => {
    it('never mutates the input template or PROGRAM_TEMPLATES global array', () => {
      const original = selectBaseTemplate('Beginner', 3);
      const originalSquatReps = original.days[0].exercises[0].targetReps;
      expect(originalSquatReps).toBe('6-8');

      const strengthProfile = getGoalProfile(['Get Stronger']);
      const modified = applyGoalModifiers(original, strengthProfile);

      // Modified should have 4-6
      expect(modified.days[0].exercises[0].targetReps).toBe('4-6');

      // Original must remain strictly 6-8
      expect(original.days[0].exercises[0].targetReps).toBe('6-8');

      // Global catalog must remain untouched
      const fromCatalog = PROGRAM_TEMPLATES.find((t) => t.id === 'beginner-3day')!;
      expect(fromCatalog.days[0].exercises[0].targetReps).toBe('6-8');
    });
  });

  describe('5. Compound vs Accessory Rep Modification Safety', () => {
    it('only adjusts core compounds and leaves accessories in higher rep ranges', () => {
      const res = recommendTemplate({
        experienceLevel: 'Beginner',
        daysPerWeek: 3,
        goals: ['Get Stronger'],
      });

      const dayA = res.modifiedTemplate.days[0];
      // Squat (compound) -> modified from 6-8 to 4-6
      const squat = dayA.exercises.find((e) => e.exerciseId === 'squat')!;
      expect(squat.targetReps).toBe('4-6');

      // Bench Press (compound) -> modified from 6-8 to 4-6
      const bench = dayA.exercises.find((e) => e.exerciseId === 'bench-press')!;
      expect(bench.targetReps).toBe('4-6');

      // Lat Pulldown -> remains 8-12
      const pulldown = dayA.exercises.find((e) => e.exerciseId === 'lat-pulldown')!;
      expect(pulldown.targetReps).toBe('8-12');

      // Lateral Raise (isolation) -> remains 12-15
      const lateralRaise = dayA.exercises.find((e) => e.exerciseId === 'lateral-raise')!;
      expect(lateralRaise.targetReps).toBe('12-15');

      const dayB = res.modifiedTemplate.days[1];
      // Bicep Curl (accessory) -> remains 10-15
      const bicepCurl = dayB.exercises.find((e) => e.exerciseId === 'bicep-curl')!;
      expect(bicepCurl.targetReps).toBe('10-15');

      // Shoulder Press (compound) -> modified to 5-8
      const shoulderPress = dayB.exercises.find((e) => e.exerciseId === 'shoulder-press')!;
      expect(shoulderPress.targetReps).toBe('5-8');
    });

    it('leaves rep ranges unchanged when strength is not among selected goals', () => {
      const res = recommendTemplate({
        experienceLevel: 'Beginner',
        daysPerWeek: 3,
        goals: ['Build Muscle', 'Stay Healthy'],
      });

      expect(res.repModifiersApplied).toBe(false);
      expect(res.modifiedTemplate.days[0].exercises[0].targetReps).toBe('6-8');
    });
  });

  describe('6. Cardio Guidance Separation (Does NOT infect WorkoutPlan.exercises)', () => {
    it('provides cardio guidance as a separate coaching object without exceeding 5 exercises/day', () => {
      const res = recommendTemplate({
        experienceLevel: 'Intermediate',
        daysPerWeek: 4,
        goals: ['Improve Endurance', 'Build Muscle'],
      });

      expect(res.cardioGuidance).toBeDefined();
      expect(res.cardioGuidance?.sessions.length).toBeGreaterThanOrEqual(2);

      // Every resistance day MUST strictly still contain <= 5 exercises
      for (const day of res.modifiedTemplate.days) {
        expect(day.exercises.length).toBe(5);
        for (const ex of day.exercises) {
          // No cardio exercise IDs in resistance plan
          expect(['cycling', 'treadmill-run', 'stair-climber', 'jump-rope']).not.toContain(ex.exerciseId);
        }
      }
    });
  });
});
