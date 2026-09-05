import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { wipeAllUserDataInCloud, syncUserDataFromCloud } from '../sync';
import { usePulse } from '../../store/useStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

const mockDelete = jest.fn().mockReturnThis();
const mockUpdate = jest.fn().mockReturnThis();

jest.mock('../supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-uuid-123' } } }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    from: jest.fn((table: string) => ({
      delete: () => ({
        eq: (col: string, val: string) => {
          mockDelete(table, col, val);
          return Promise.resolve({ data: null, error: null });
        },
      }),
      update: (fields: any) => ({
        eq: (col: string, val: string) => {
          mockUpdate(table, fields, col, val);
          return Promise.resolve({ data: null, error: null });
        },
      }),
      select: (fields?: string) => ({
        eq: (col: string, val: string) => ({
          order: (col2: string, opts: any) => Promise.resolve({ data: [], error: null }),
          maybeSingle: () => Promise.resolve({
            data: {
              id: val,
              display_name: 'Test Athlete',
              onboarded: false,
              height_cm: null,
              weight_kg: null,
            },
            error: null,
          }),
        }),
      }),
    })),
  },
}));

describe('Clear All Data & Cloud Wipe Verification', () => {
  const TEST_USER_ID = 'test-user-uuid-123';

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    usePulse.getState().clearSessionCache();
  });

  it('wipeAllUserDataInCloud deletes workouts, plans, measurements, favorites, PRs, and goals for the user only', async () => {
    const success = await wipeAllUserDataInCloud(TEST_USER_ID);
    expect(success).toBe(true);

    // Verify each table was targeted with user_id = TEST_USER_ID
    expect(mockDelete).toHaveBeenCalledWith('workouts', 'user_id', TEST_USER_ID);
    expect(mockDelete).toHaveBeenCalledWith('workout_plans', 'user_id', TEST_USER_ID);
    expect(mockDelete).toHaveBeenCalledWith('body_measurements', 'user_id', TEST_USER_ID);
    expect(mockDelete).toHaveBeenCalledWith('user_favorite_exercises', 'user_id', TEST_USER_ID);
    expect(mockDelete).toHaveBeenCalledWith('manual_prs', 'user_id', TEST_USER_ID);
    expect(mockDelete).toHaveBeenCalledWith('user_goals', 'user_id', TEST_USER_ID);

    // Verify profiles table was updated to reset biometrics and onboarding
    expect(mockUpdate).toHaveBeenCalledWith(
      'profiles',
      expect.objectContaining({
        height_cm: null,
        weight_kg: null,
        onboarded: false,
      }),
      'id',
      TEST_USER_ID,
    );
  });

  it('usePulse.getState().clearAllData awaits cloud wipe and leaves local state completely clean', async () => {
    // Populate store with active user data
    usePulse.setState({
      workouts: [
        {
          id: 'w-active',
          title: 'Heavy Deadlift Session',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          exercises: [],
        },
      ],
      measurements: [
        {
          id: 'm-1',
          date: '2026-08-20',
          weightKg: 80,
        },
      ],
      favorites: ['deadlift', 'bench-press'],
      manualPRs: [
        {
          id: 'pr-1',
          exerciseId: 'deadlift',
          weightKg: 180,
          reps: 1,
          date: '2026-08-20',
        },
      ],
      profile: {
        name: 'Iron Lifter',
        gender: 'male',
        goal: ['Strength'],
        experience: 'Advanced',
        frequencyPerWeek: 5,
        equipment: ['Barbell'],
        style: ['Powerlifting'],
        trainingAgeMonths: 36,
        onboarded: true,
      },
      onboarded: true,
    });

    expect(usePulse.getState().workouts).toHaveLength(1);
    expect(usePulse.getState().measurements).toHaveLength(1);
    expect(usePulse.getState().favorites).toHaveLength(2);

    // Run clearAllData
    await usePulse.getState().clearAllData();

    // Verify store is cleared
    const state = usePulse.getState();
    expect(state.workouts).toHaveLength(0);
    expect(state.measurements).toHaveLength(0);
    expect(state.favorites).toHaveLength(0);
    expect(state.manualPRs).toHaveLength(0);
    expect(state.profile).toBeNull();
    expect(state.onboarded).toBe(false);
    expect(state.plans).toEqual([]);

    // Verify cloud wipe was called
    expect(mockDelete).toHaveBeenCalledWith('workouts', 'user_id', TEST_USER_ID);
  });

  it('syncUserDataFromCloud on a wiped account does NOT restore old workouts, measurements, or plans', async () => {
    // Simulate cloud returning empty records
    await syncUserDataFromCloud(TEST_USER_ID);

    const state = usePulse.getState();
    expect(state.workouts).toHaveLength(0);
    expect(state.measurements).toHaveLength(0);
    expect(state.favorites).toHaveLength(0);
    expect(state.manualPRs).toHaveLength(0);
    expect(state.plans).toEqual([]);
    expect(state.onboarded).toBe(false);
  });
});
