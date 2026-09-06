/**
 * Sync Optimization & Fallback Regression Tests
 *
 * Covers:
 *   1. syncUserDataFromCloud applies 1-year boundary (.gte('started_at', ...))
 *   2. syncUserDataFromCloud preserves local workouts older than 1 year (no data loss)
 *   3. pushWorkoutToCloud calls atomic save_workout RPC when available
 *   4. pushWorkoutToCloud gracefully falls back to multi-step inserts when RPC fails or is missing
 */

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { syncUserDataFromCloud, pushWorkoutToCloud } from '../sync';
import { usePulse, Workout } from '../../store/useStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Setup controllable supabase mock
const mockRpc = jest.fn();
const mockWorkoutsGte = jest.fn().mockReturnThis();
const mockWorkoutsOrder = jest.fn();
const mockWorkoutsInsert = jest.fn();
const mockExercisesInsert = jest.fn();
const mockSetsInsert = jest.fn();

jest.mock('../supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-sync-user-id' } } }),
    },
    rpc: (...args: any[]) => mockRpc(...args),
    from: jest.fn((table: string) => {
      if (table === 'workouts') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: (...args: any[]) => {
                mockWorkoutsGte(...args);
                return {
                  order: (...orderArgs: any[]) => {
                    const res = mockWorkoutsOrder(...orderArgs);
                    return res !== undefined ? res : Promise.resolve({ data: [], error: null });
                  },
                };
              },
            }),
          }),
          insert: (...args: any[]) => {
            mockWorkoutsInsert(...args);
            return {
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'inserted-workout-uuid' },
                  error: null,
                }),
              }),
            };
          },
        };
      }
      if (table === 'workout_exercises') {
        return {
          insert: (...args: any[]) => {
            mockExercisesInsert(...args);
            return {
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'inserted-exercise-uuid' },
                  error: null,
                }),
              }),
            };
          },
        };
      }
      if (table === 'workout_sets') {
        return {
          insert: (...args: any[]) => {
            mockSetsInsert(...args);
            return Promise.resolve({ data: null, error: null });
          },
        };
      }
      // default stub for other tables (profiles, workout_plans, etc.)
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

describe('Sync Optimization & Fallback Tests', () => {
  const TEST_USER_ID = 'test-sync-user-id';

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    usePulse.getState().clearSessionCache();
  });

  describe('1-Year Window & History Preservation in syncUserDataFromCloud', () => {
    it('queries workouts with .gte(started_at, 1-year-ago ISO)', async () => {
      await syncUserDataFromCloud(TEST_USER_ID);

      expect(mockWorkoutsGte).toHaveBeenCalledTimes(1);
      const [col, timestamp] = mockWorkoutsGte.mock.calls[0];
      expect(col).toBe('started_at');

      // Verify timestamp is approximately 365 days ago (within 2 days tolerance)
      const queryDate = new Date(timestamp);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 365);
      const diffMs = Math.abs(queryDate.getTime() - expectedDate.getTime());
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
      expect(diffMs).toBeLessThan(twoDaysMs);
    });

    it('preserves local workouts older than 1 year when syncing cloud data', async () => {
      // Local state has an older workout from 500 days ago
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 500);

      const oldLocalWorkout: Workout = {
        id: 'old-workout-500d-ago',
        title: 'Historic PR Day',
        startTime: oldDate.toISOString(),
        endTime: oldDate.toISOString(),
        exercises: [],
        source: 'user',
      };

      usePulse.setState({
        workouts: [oldLocalWorkout],
      });

      // Setup mock to return 1 cloud workout within the 1-year window
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10);
      const cloudWorkoutRaw = {
        id: 'cloud-workout-recent',
        title: 'Recent Push Day',
        description: null,
        started_at: recentDate.toISOString(),
        completed_at: recentDate.toISOString(),
        workout_exercises: [],
      };

      mockWorkoutsOrder.mockResolvedValueOnce({ data: [cloudWorkoutRaw], error: null });

      await syncUserDataFromCloud(TEST_USER_ID);

      const storeWorkouts = usePulse.getState().workouts;
      // Both workouts should be present!
      expect(storeWorkouts).toHaveLength(2);
      const ids = storeWorkouts.map((w) => w.id);
      expect(ids).toContain('old-workout-500d-ago');
      expect(ids).toContain('cloud-workout-recent');
      // Sorted descending by startTime (recent first)
      expect(storeWorkouts[0].id).toBe('cloud-workout-recent');
      expect(storeWorkouts[1].id).toBe('old-workout-500d-ago');
    });
  });

  describe('Atomic save_workout RPC & Graceful Fallback in pushWorkoutToCloud', () => {
    const sampleWorkout: Workout = {
      id: 'test-workout-101',
      title: 'Full Body Blast',
      description: 'Heavy session',
      startTime: '2026-09-06T10:00:00.000Z',
      endTime: '2026-09-06T11:00:00.000Z',
      source: 'user',
      exercises: [
        {
          id: 'we-1',
          exerciseId: 'bench-press',
          notes: 'Paused reps',
          sets: [
            {
              id: 's-1',
              setIndex: 1,
              setType: 'working',
              weightKg: 100,
              reps: 5,
              rpe: 8,
              completed: true,
              completedAt: '2026-09-06T10:15:00.000Z',
            },
          ],
        },
      ],
    };

    it('uses save_workout RPC when available on Supabase and succeeds', async () => {
      mockRpc.mockResolvedValueOnce({
        data: { success: true, workout_id: 'test-workout-101' },
        error: null,
      });

      const result = await pushWorkoutToCloud(TEST_USER_ID, sampleWorkout);

      expect(result).toBe(true);
      expect(mockRpc).toHaveBeenCalledTimes(1);
      expect(mockRpc).toHaveBeenCalledWith('save_workout', {
        payload: expect.objectContaining({
          id: 'test-workout-101',
          user_id: TEST_USER_ID,
          title: 'Full Body Blast',
          exercises: expect.arrayContaining([
            expect.objectContaining({
              exercise_id: 'bench-press',
              sets: expect.arrayContaining([
                expect.objectContaining({
                  weight_kg: 100,
                  reps: 5,
                }),
              ]),
            }),
          ]),
        }),
      });

      // Direct table inserts should NOT have been called
      expect(mockWorkoutsInsert).not.toHaveBeenCalled();
      expect(mockExercisesInsert).not.toHaveBeenCalled();
      expect(mockSetsInsert).not.toHaveBeenCalled();
    });

    it('falls back to multi-step direct inserts when RPC returns an error (e.g. RPC not installed)', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'function save_workout does not exist', code: '42883' },
      });

      const result = await pushWorkoutToCloud(TEST_USER_ID, sampleWorkout);

      expect(result).toBe(true);
      expect(mockRpc).toHaveBeenCalledTimes(1);

      // Verify fallback multi-step inserts executed
      expect(mockWorkoutsInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: TEST_USER_ID,
          title: 'Full Body Blast',
        })
      );
      expect(mockExercisesInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          workout_id: 'inserted-workout-uuid',
          exercise_id: 'bench-press',
        })
      );
      expect(mockSetsInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            workout_exercise_id: 'inserted-exercise-uuid',
            weight_kg: 100,
            reps: 5,
          }),
        ])
      );
    });

    it('falls back to multi-step direct inserts when RPC throws an exception', async () => {
      mockRpc.mockRejectedValueOnce(new Error('Network or permission exception'));

      const result = await pushWorkoutToCloud(TEST_USER_ID, sampleWorkout);

      expect(result).toBe(true);
      expect(mockRpc).toHaveBeenCalledTimes(1);
      expect(mockWorkoutsInsert).toHaveBeenCalled();
      expect(mockExercisesInsert).toHaveBeenCalled();
      expect(mockSetsInsert).toHaveBeenCalled();
    });
  });
});
