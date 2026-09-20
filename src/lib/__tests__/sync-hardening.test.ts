import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

import { deduplicatePlans, hasDuplicatePlanTitle } from '../sync';
import { usePulse } from '../../store/useStore';
import { isValidUuid } from '../uuid';
import type { Workout, WorkoutPlan } from '../../types';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

const makePlan = (id: string, title: string): WorkoutPlan => ({
  id,
  title,
  emoji: '💪',
  muscles: [],
  exercises: [],
});

describe('deduplicatePlans — negative & edge cases', () => {
  it('handles empty / null / undefined input', () => {
    expect(deduplicatePlans([])).toEqual([]);
    expect(deduplicatePlans(null as unknown as WorkoutPlan[])).toEqual([]);
    expect(deduplicatePlans(undefined as unknown as WorkoutPlan[])).toEqual([]);
  });

  it('drops duplicate IDs, keeping the first occurrence', () => {
    const result = deduplicatePlans([makePlan('1', 'Upper A'), makePlan('1', 'Upper B')]);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Upper A');
  });

  it('drops case-insensitive duplicate titles even when IDs differ', () => {
    const result = deduplicatePlans([makePlan('1', 'Push Day'), makePlan('2', '  push DAY ')]);
    expect(result.map((p) => p.id)).toEqual(['1']);
  });

  it('preserves distinct plans in their original order', () => {
    const result = deduplicatePlans([
      makePlan('1', 'Upper'),
      makePlan('2', 'Lower'),
      makePlan('3', 'Push'),
    ]);
    expect(result.map((p) => p.id)).toEqual(['1', '2', '3']);
  });

  it('skips null entries without throwing', () => {
    const result = deduplicatePlans([
      null as unknown as WorkoutPlan,
      makePlan('1', 'Upper'),
      undefined as unknown as WorkoutPlan,
    ]);
    expect(result.map((p) => p.id)).toEqual(['1']);
  });

  it('is idempotent (running it twice yields the same result)', () => {
    const input = [makePlan('1', 'Upper'), makePlan('1', 'Upper'), makePlan('2', 'Lower')];
    const once = deduplicatePlans(input);
    expect(deduplicatePlans(once)).toEqual(once);
  });
});

describe('hasDuplicatePlanTitle — negative & edge cases', () => {
  const plans = [makePlan('1', 'Push Day'), makePlan('2', 'Lower B')];

  it('detects case-insensitive and trimmed collisions', () => {
    expect(hasDuplicatePlanTitle(plans, '  push day ')).toBe(true);
    expect(hasDuplicatePlanTitle(plans, 'PUSH DAY')).toBe(true);
  });

  it('returns false for unique or blank titles', () => {
    expect(hasDuplicatePlanTitle(plans, 'Upper A')).toBe(false);
    expect(hasDuplicatePlanTitle(plans, '   ')).toBe(false);
  });

  it('ignores the excluded plan id so a plan can keep its own title', () => {
    expect(hasDuplicatePlanTitle(plans, 'Push Day', '1')).toBe(false);
  });
});

describe('Workout IDs are stable UUIDs (idempotent cloud sync)', () => {
  beforeEach(() => {
    usePulse.setState({
      workouts: [],
      plans: [],
      activeWorkout: null,
      exerciseDefaults: {},
      profile: null,
    });
  });

  it('startWorkout creates a valid UUID', () => {
    const w = usePulse
      .getState()
      .startWorkout('Push', [{ exerciseId: 'bench-press', sets: 2, targetReps: '8-12' }]);
    expect(isValidUuid(w.id)).toBe(true);
  });

  it('saveBuiltWorkout assigns a valid UUID', () => {
    usePulse
      .getState()
      .saveBuiltWorkout('Built', [], '2026-01-01T00:00:00.000Z', '2026-01-01T01:00:00.000Z');
    expect(isValidUuid(usePulse.getState().workouts[0].id)).toBe(true);
  });

  it('importWorkouts assigns valid UUIDs and preserves imported content', () => {
    const imported: Workout[] = [
      {
        id: 'csv-1',
        title: 'Legs',
        description: '',
        startTime: '2026-01-01T00:00:00.000Z',
        endTime: '2026-01-01T01:00:00.000Z',
        source: 'user',
        exercises: [],
      },
    ];
    usePulse.getState().importWorkouts(imported);
    const w = usePulse.getState().workouts[0];
    expect(isValidUuid(w.id)).toBe(true);
    expect(w.title).toBe('Legs');
  });

  it('replaceWorkouts assigns valid UUIDs', () => {
    usePulse.getState().replaceWorkouts([
      {
        id: 'csv-2',
        title: 'Push',
        description: '',
        startTime: '2026-01-02T00:00:00.000Z',
        endTime: '2026-01-02T01:00:00.000Z',
        source: 'user',
        exercises: [],
      },
    ]);
    expect(isValidUuid(usePulse.getState().workouts[0].id)).toBe(true);
  });
});
