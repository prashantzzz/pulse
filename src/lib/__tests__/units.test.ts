import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

import {
  kgToLbs,
  lbsToKg,
  toUserWeight,
  fromUserWeight,
  toUserVolume,
  formatWeight,
  formatWeightWithUnit,
  formatUserWeight,
  formatUserWeightWithUnit,
  formatVolumeWithUnit,
  getBarWeight,
  getWeightStep,
} from '../units';
import { platesForTarget } from '../plates';
import { warmupSets } from '../stats';
import { computeAchievements } from '../achievements';
import { usePulse } from '../../store/useStore';
import type { Workout } from '../../types';

describe('units conversion and helpers', () => {
  describe('kgToLbs and lbsToKg', () => {
    it('converts 100 kg to ~220.46 lbs', () => {
      expect(kgToLbs(100)).toBeCloseTo(220.462, 1);
    });

    it('converts 220.462 lbs back to 100 kg', () => {
      expect(lbsToKg(220.462)).toBeCloseTo(100, 1);
    });

    it('handles 0 and null/undefined gracefully', () => {
      expect(toUserWeight(null, 'lbs')).toBe(0);
      expect(toUserWeight(undefined, 'lbs')).toBe(0);
      expect(toUserWeight(0, 'lbs')).toBe(0);
      expect(fromUserWeight(0, 'lbs')).toBe(0);
    });
  });

  describe('toUserWeight and fromUserWeight', () => {
    it('returns original weight when unit is kg', () => {
      expect(toUserWeight(80, 'kg')).toBe(80);
      expect(fromUserWeight(80, 'kg')).toBe(80);
    });

    it('converts properly when unit is lbs', () => {
      const lbs = toUserWeight(100, 'lbs');
      expect(lbs).toBe(220.5);
      const kg = fromUserWeight(220.462, 'lbs');
      expect(kg).toBe(100);
    });
  });

  describe('toUserVolume', () => {
    it('leaves volume unchanged for kg', () => {
      expect(toUserVolume(5000, 'kg')).toBe(5000);
    });

    it('scales volume by 2.20462 for lbs and rounds to integer', () => {
      expect(toUserVolume(1000, 'lbs')).toBe(2205);
    });
  });

  describe('formatWeight and formatWeightWithUnit', () => {
    it('formats numbers with 1 decimal place if fractional, or integer if whole', () => {
      expect(formatWeight(80)).toBe('80');
      expect(formatWeight(82.5)).toBe('82.5');
      expect(formatWeight(225)).toBe('225');
      expect(formatWeight(225.5)).toBe('225.5');
      expect(formatWeightWithUnit(82.5, 'kg')).toBe('82.5 kg');
      expect(formatWeightWithUnit(225, 'lbs')).toBe('225 lbs');
    });
  });

  describe('formatUserWeight and formatUserWeightWithUnit (DRY canonical kg formatters)', () => {
    it('formats stored kg in metric without or with unit suffix', () => {
      expect(formatUserWeight(100, 'kg')).toBe('100');
      expect(formatUserWeight(82.5, 'kg')).toBe('82.5');
      expect(formatUserWeight(0, 'kg')).toBe('0');
      expect(formatUserWeightWithUnit(100, 'kg')).toBe('100 kg');
      expect(formatUserWeightWithUnit(82.5, 'kg')).toBe('82.5 kg');
      expect(formatUserWeightWithUnit(0, 'kg')).toBe('0 kg');
    });

    it('formats stored kg converted to imperial (lbs) with clean rounding and suffix', () => {
      expect(formatUserWeight(100, 'lbs')).toBe('220.5');
      expect(formatUserWeight(82.5, 'lbs')).toBe('181.9');
      expect(formatUserWeight(0, 'lbs')).toBe('0');
      expect(formatUserWeightWithUnit(100, 'lbs')).toBe('220.5 lbs');
      expect(formatUserWeightWithUnit(82.5, 'lbs')).toBe('181.9 lbs');
      expect(formatUserWeightWithUnit(0, 'lbs')).toBe('0 lbs');
    });

    it('handles null and undefined gracefully with placeholder dash', () => {
      expect(formatUserWeight(null, 'kg')).toBe('—');
      expect(formatUserWeight(undefined, 'kg')).toBe('—');
      expect(formatUserWeightWithUnit(null, 'kg')).toBe('—');
      expect(formatUserWeightWithUnit(undefined, 'lbs')).toBe('—');
    });
  });

  describe('Round-trip conversion fidelity', () => {
    it('standard metric barbell weights converted to lbs and back stay within 0.1 kg', () => {
      const metricWeights = [20, 40, 60, 80, 100, 140, 200];
      for (const wKg of metricWeights) {
        const userLbs = toUserWeight(wKg, 'lbs');
        const backKg = fromUserWeight(userLbs, 'lbs');
        expect(Math.abs(backKg - wKg)).toBeLessThanOrEqual(0.1);
      }
    });

    it('standard imperial weights converted to kg and back stay within 0.1 lb', () => {
      const imperialWeights = [45, 95, 135, 185, 225, 315, 405];
      for (const wLbs of imperialWeights) {
        const storedKg = fromUserWeight(wLbs, 'lbs');
        const backLbs = toUserWeight(storedKg, 'lbs');
        expect(Math.abs(backLbs - wLbs)).toBeLessThanOrEqual(0.1);
      }
    });
  });

  describe('formatVolumeWithUnit', () => {
    it('formats small volume without k suffix', () => {
      expect(formatVolumeWithUnit(500, 'kg')).toBe('500 kg');
    });

    it('formats metric volume >= 1000 with k suffix and kg', () => {
      expect(formatVolumeWithUnit(5000, 'kg')).toBe('5.0k kg');
    });

    it('formats imperial volume >= 1000 with k suffix and lbs', () => {
      expect(formatVolumeWithUnit(5000, 'lbs')).toBe('11.0k lbs');
    });
  });

  describe('getBarWeight and getWeightStep', () => {
    it('returns 20 and 2.5 for kg', () => {
      expect(getBarWeight('kg')).toBe(20);
      expect(getWeightStep('kg')).toBe(2.5);
    });

    it('returns 45 and 5 for lbs', () => {
      expect(getBarWeight('lbs')).toBe(45);
      expect(getWeightStep('lbs')).toBe(5);
    });
  });
});

describe('imperial plate calculator', () => {
  it('returns barOnly when target is at or below 45 lbs bar', () => {
    const r = platesForTarget(45, undefined, 'lbs');
    expect(r.barOnly).toBe(true);
    expect(r.plates).toEqual([]);
    expect(r.perSideKg).toBe(0);
  });

  it('calculates 135 lbs (1 plate of 45 lbs each side)', () => {
    // (135 - 45) / 2 = 45 per side
    const r = platesForTarget(135, undefined, 'lbs');
    expect(r.barOnly).toBe(false);
    expect(r.plates).toEqual([45]);
    expect(r.perSideKg).toBe(45);
    expect(r.remainderKg).toBe(0);
  });

  it('calculates 225 lbs (2 plates of 45 lbs each side)', () => {
    // (225 - 45) / 2 = 90 per side -> [45, 45]
    const r = platesForTarget(225, undefined, 'lbs');
    expect(r.barOnly).toBe(false);
    expect(r.plates).toEqual([45, 45]);
    expect(r.perSideKg).toBe(90);
    expect(r.remainderKg).toBe(0);
  });

  it('calculates 185 lbs (45 + 25 each side)', () => {
    // (185 - 45) / 2 = 70 per side -> [45, 25]
    const r = platesForTarget(185, undefined, 'lbs');
    expect(r.barOnly).toBe(false);
    expect(r.plates).toEqual([45, 25]);
    expect(r.perSideKg).toBe(70);
    expect(r.remainderKg).toBe(0);
  });

  it('handles fractional remainder in lbs', () => {
    // 152 lbs -> (152 - 45) / 2 = 53.5 lbs per side -> loaded = 52.5 (45 + 5 + 2.5), remainder = 1
    const r = platesForTarget(152, undefined, 'lbs');
    expect(r.plates).toEqual([45, 5, 2.5]);
    expect(r.perSideKg).toBe(52.5);
    expect(r.remainderKg).toBe(1);
  });
});

describe('warmupSets in lbs', () => {
  it('returns empty array when below imperial threshold (90 lbs)', () => {
    expect(warmupSets(85, 'lbs')).toEqual([]);
    expect(warmupSets(45, 'lbs')).toEqual([]);
  });

  it('ramps correctly for 200 lbs working weight', () => {
    // 25% = 50, 50% = 100, 75% = 150, 87.5% = 175
    // all are >= 45 lbs bar and rounded to 5 lb steps
    const wu = warmupSets(200, 'lbs');
    expect(wu).toEqual([
      { kg: 50, reps: 10 },
      { kg: 100, reps: 8 },
      { kg: 150, reps: 5 },
      { kg: 175, reps: 3 },
    ]);
  });
});

describe('achievements adaptation to weightUnit', () => {
  const mockWorkout: Workout = {
    id: 'w-1',
    title: 'Bench PR Workout',
    description: '',
    startTime: '2026-08-10T09:00:00.000Z',
    endTime: '2026-08-10T10:00:00.000Z',
    source: 'user',
    exercises: [
      {
        id: 'we-1',
        exerciseId: 'bench-press',
        order: 1,
        notes: null,
        plannedSets: 1,
        targetReps: '1',
        sets: [
          {
            id: 's-1',
            setIndex: 1,
            setType: 'working',
            weightKg: 105, // > 100 kg, > 225 lbs
            reps: 1,
            distanceKm: null,
            durationSec: null,
            rpe: null,
            notes: null,
            supersetId: null,
            completed: true,
            completedAt: '2026-08-10T10:00:00.000Z',
          },
        ],
      },
    ],
  };

  it('uses 100 kg Club badge title when unit is kg', () => {
    const achsKg = computeAchievements([mockWorkout], 'kg');
    const badgeKg = achsKg.find((a) => a.title === '100 kg Club');
    expect(badgeKg).toBeDefined();
    expect(badgeKg?.earned).toBe(true);
  });

  it('uses 225 lb Club badge title when unit is lbs', () => {
    const achsLbs = computeAchievements([mockWorkout], 'lbs');
    const badgeLbs = achsLbs.find((a) => a.title === '225 lb Club');
    expect(badgeLbs).toBeDefined();
    expect(badgeLbs?.earned).toBe(true);
  });
});

describe('Real-time weightUnit state reactivity across usePulse', () => {
  beforeEach(() => {
    usePulse.setState({
      weightUnit: 'kg',
      workouts: [],
      plans: [],
      activeWorkout: null,
      activeRestTimer: null,
      profile: {
        name: 'Alex',
        goal: ['Build Muscle'],
        experience: 'Intermediate',
        frequencyPerWeek: 4,
        equipment: ['Dumbbell', 'Barbell'],
        style: ['Upper / Lower'],
        trainingAgeMonths: 12,
        onboarded: true,
        weightUnit: 'kg',
      },
    });
  });

  it('toggling setWeightUnit updates store weightUnit and profile.weightUnit in real time', () => {
    expect(usePulse.getState().weightUnit).toBe('kg');
    expect(usePulse.getState().profile?.weightUnit).toBe('kg');

    usePulse.getState().setWeightUnit('lbs');
    expect(usePulse.getState().weightUnit).toBe('lbs');
    expect(usePulse.getState().profile?.weightUnit).toBe('lbs');

    usePulse.getState().setWeightUnit('kg');
    expect(usePulse.getState().weightUnit).toBe('kg');
    expect(usePulse.getState().profile?.weightUnit).toBe('kg');
  });

  it('rest timer and set completion formats weight using the active weightUnit in real time', () => {
    usePulse.getState().startWorkout('Chest Workout', [
      { exerciseId: 'bench-press', sets: 2, targetReps: '5', targetWeightKg: 100 },
    ]);

    const active = usePulse.getState().activeWorkout!;
    expect(active).toBeDefined();
    const set1 = active.exercises[0].sets[0];

    // Case 1: Active unit is 'kg'
    usePulse.getState().setWeightUnit('kg');
    usePulse.getState().completeSet('bench-press', set1.id);

    let timer = usePulse.getState().activeWorkout?.restTimer;
    expect(timer).toBeDefined();
    expect(timer?.completedSetInfo).toContain('100 kg');
    expect(timer?.nextSetInfo).toContain('100 kg');

    // Case 2: User changes unit to 'lbs' in real-time mid-workout
    usePulse.getState().setWeightUnit('lbs');
    usePulse.getState().startWorkout('Chest Workout Lbs', [
      { exerciseId: 'bench-press', sets: 2, targetReps: '5', targetWeightKg: 100 },
    ]);
    const benchSet1 = usePulse.getState().activeWorkout!.exercises[0].sets[0];
    usePulse.getState().completeSet('bench-press', benchSet1.id);

    timer = usePulse.getState().activeWorkout?.restTimer;
    expect(timer).toBeDefined();
    expect(timer?.completedSetInfo).toContain('220.5 lbs');
    expect(timer?.nextSetInfo).toContain('220.5 lbs');
  });
});
