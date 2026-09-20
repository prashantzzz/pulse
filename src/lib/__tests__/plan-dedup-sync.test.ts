import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Cloud returns the SAME routine day twice under different ids (the historical
// "template added twice" bug), plus one distinct day.
const mockCloudPlans = [
  { id: 'cloud-uuid-1', name: 'Upper A', emoji: '💪', muscles: [], workout_plan_exercises: [] },
  { id: 'cloud-uuid-2', name: 'upper a', emoji: '💪', muscles: [], workout_plan_exercises: [] },
  { id: 'cloud-uuid-3', name: 'Lower B', emoji: '🦵', muscles: [], workout_plan_exercises: [] },
];

jest.mock('../supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: jest.fn((table: string) => {
      if (table === 'workout_plans') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: mockCloudPlans, error: null }),
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }
      if (table === 'workouts') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    }),
  },
}));

import { syncUserDataFromCloud } from '../sync';
import { usePulse } from '../../store/useStore';
import type { WorkoutPlan } from '../../types';

describe('Cloud sync de-duplicates repeated routine days ("template added twice")', () => {
  beforeEach(() => {
    usePulse.setState({
      plans: [],
      workouts: [],
      measurements: [],
      favorites: [],
      manualPRs: [],
      exerciseDefaults: {},
      profile: null,
    });
  });

  it('collapses cloud plans that share a title (different ids) into a single plan', async () => {
    await syncUserDataFromCloud('u1');

    const plans = usePulse.getState().plans;
    expect(plans).toHaveLength(2);
    const titles = plans.map((p) => p.title.toLowerCase());
    expect(titles).toEqual(['upper a', 'lower b']);
    // no duplicate titles remain
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('drops a local plan that duplicates a cloud plan by title (different id)', async () => {
    const localDup: WorkoutPlan = {
      id: 'local-uuid-9',
      title: 'lower b',
      emoji: '🦵',
      muscles: [],
      exercises: [],
    };
    usePulse.setState({ plans: [localDup] });

    await syncUserDataFromCloud('u1');

    const lowerB = usePulse.getState().plans.filter((p) => p.title.toLowerCase() === 'lower b');
    expect(lowerB).toHaveLength(1);
    expect(usePulse.getState().plans).toHaveLength(2);
  });

  it('keeps distinct local-only plans alongside cloud plans', async () => {
    const localOnly: WorkoutPlan = {
      id: 'local-uuid-10',
      title: 'Custom Arms',
      emoji: '💪',
      muscles: [],
      exercises: [],
    };
    usePulse.setState({ plans: [localOnly] });

    await syncUserDataFromCloud('u1');

    const titles = usePulse
      .getState()
      .plans.map((p) => p.title.toLowerCase())
      .sort();
    expect(titles).toEqual(['custom arms', 'lower b', 'upper a']);
  });
});
