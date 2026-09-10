import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import * as Notifications from 'expo-notifications';
import { usePulse } from '../../store/useStore';
import { playRestOverSound, resetRestSoundDeduplication } from '../sound';
import { syncActiveWorkoutNotification, setupNotificationCategories, ACTIVE_WORKOUT_CATEGORY, ACTIVE_WORKOUT_RESTING_CATEGORY } from '../notifications';
import type { WorkoutPlanExercise } from '../../types';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

const mockSetAudioModeAsync = jest.fn().mockResolvedValue(undefined);
const mockPlay = jest.fn();
const mockSeekTo = jest.fn().mockResolvedValue(undefined);
const mockCreateAudioPlayer = jest.fn().mockReturnValue({
  play: mockPlay,
  seekTo: mockSeekTo,
  volume: 1.0,
});

jest.mock('expo-audio', () => ({
  setAudioModeAsync: mockSetAudioModeAsync,
  createAudioPlayer: mockCreateAudioPlayer,
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationCategoryAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notif-id-1'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  dismissNotificationAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { HIGH: 4, DEFAULT: 3, LOW: 2 },
  AndroidNotificationPriority: { HIGH: 'high', LOW: 'low' },
  AndroidNotificationVisibility: { PUBLIC: 1 },
}));

const mockPlanExercises: WorkoutPlanExercise[] = [
  {
    id: 'pe-1',
    exerciseId: 'bench-press',
    sets: 2,
    targetReps: '8-10',
    targetWeightKg: 80,
  },
  {
    id: 'pe-2',
    exerciseId: 'triceps-pushdown',
    sets: 1,
    targetReps: '12',
    targetWeightKg: 35,
  },
];

describe('Next Rep Action & Audio-Ducked Rest Timer Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRestSoundDeduplication();
    usePulse.setState({
      activeWorkout: null,
      workouts: [],
      weightUnit: 'kg',
    });
  });

  describe('Notification Category Actions', () => {
    it('registers ACTIVE_WORKOUT_CATEGORY with Next Rep, Pause, and Finish buttons', async () => {
      await setupNotificationCategories();

      expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
        ACTIVE_WORKOUT_CATEGORY,
        expect.arrayContaining([
          expect.objectContaining({
            identifier: 'NEXT_REP',
            buttonTitle: 'Next Rep',
            options: { opensAppToForeground: false },
          }),
          expect.objectContaining({
            identifier: 'PAUSE_WORKOUT',
            buttonTitle: 'Pause',
            options: { opensAppToForeground: false },
          }),
          expect.objectContaining({
            identifier: 'FINISH_WORKOUT',
            buttonTitle: 'Finish',
            options: { opensAppToForeground: true, isDestructive: true },
          }),
        ])
      );
    });
  });

  describe('completeNextSetAndStartRest store logic', () => {
    it('returns null when there is no active workout', () => {
      const result = usePulse.getState().completeNextSetAndStartRest();
      expect(result).toBeNull();
    });

    it('completes the first set and starts the rest period with next set details', async () => {
      usePulse.getState().startWorkout('Chest & Arms', mockPlanExercises);

      const activeBefore = usePulse.getState().activeWorkout;
      expect(activeBefore).toBeDefined();
      expect(activeBefore?.restTimer).toBeFalsy();

      // Tap 'Next Rep'
      const result = usePulse.getState().completeNextSetAndStartRest();
      expect(result).not.toBeNull();
      expect(result?.exerciseId).toBe('bench-press');
      expect(result?.completedSetIndex).toBe(1);
      expect(result?.doneSets).toBe(1);
      expect(result?.totalSets).toBe(3);

      const activeAfter = usePulse.getState().activeWorkout;
      expect(activeAfter?.exercises[0].sets[0].completed).toBe(true);
      expect(activeAfter?.exercises[0].sets[1].completed).toBe(false);

      // Rest timer started
      expect(activeAfter?.restTimer).toBeDefined();
      expect(activeAfter?.restTimer?.totalSeconds).toBeGreaterThan(0);
      expect(activeAfter?.restTimer?.paused).toBe(false);
      expect(activeAfter?.restTimer?.nextSetInfo).toContain('Bench Press');

      // Sync notification reflects resting state
      await syncActiveWorkoutNotification(activeAfter!);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: '⏱️ Resting · Chest & Arms',
            categoryIdentifier: ACTIVE_WORKOUT_RESTING_CATEGORY,
          }),
        })
      );
    });

    it('advances sequentially across sets and exercises when Next Rep is tapped', () => {
      usePulse.getState().startWorkout('Chest & Arms', mockPlanExercises);

      // Set 1
      usePulse.getState().completeNextSetAndStartRest();
      let aw = usePulse.getState().activeWorkout!;
      expect(aw.exercises[0].sets[0].completed).toBe(true);
      expect(aw.exercises[0].sets[1].completed).toBe(false);

      // Set 2
      const res2 = usePulse.getState().completeNextSetAndStartRest();
      expect(res2?.completedSetIndex).toBe(2);
      aw = usePulse.getState().activeWorkout!;
      expect(aw.exercises[0].sets[1].completed).toBe(true);
      expect(aw.restTimer?.nextSetInfo).toContain('Triceps Pushdown');

      // Set 3 (Final set)
      const res3 = usePulse.getState().completeNextSetAndStartRest();
      expect(res3?.exerciseId).toBe('triceps-pushdown');
      expect(res3?.doneSets).toBe(3);
      expect(res3?.totalSets).toBe(3);

      aw = usePulse.getState().activeWorkout!;
      expect(aw.exercises[1].sets[0].completed).toBe(true);
      // All sets done -> NO rest timer started!
      expect(aw.restTimer).toBeNull();
    });

    it('safely returns null if called when all sets are already completed', () => {
      usePulse.getState().startWorkout('Chest & Arms', mockPlanExercises);

      // Complete all 3 sets
      usePulse.getState().completeNextSetAndStartRest();
      usePulse.getState().completeNextSetAndStartRest();
      usePulse.getState().completeNextSetAndStartRest();

      // Fourth tap
      const res = usePulse.getState().completeNextSetAndStartRest();
      expect(res).toBeNull();
      const aw = usePulse.getState().activeWorkout!;
      expect(aw.restTimer).toBeNull();
    });
  });

  describe('Audio Playback & Audio Ducking', () => {
    it('configures audio session with duckOthers and plays chime once on natural expiration', async () => {
      const restEndTime = Date.now() + 60000;

      const played = await playRestOverSound(restEndTime);
      expect(played).toBe(true);

      // Audio focus: duckOthers ensures Spotify / YouTube Music volume dips rather than pausing!
      expect(mockSetAudioModeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          playsInSilentMode: true,
          interruptionMode: 'duckOthers',
        })
      );
      expect(mockCreateAudioPlayer).toHaveBeenCalled();
      expect(mockPlay).toHaveBeenCalled();
    });

    it('deduplicates playback so it never plays twice for the same rest period', async () => {
      const restEndTime = Date.now() + 60000;

      const firstPlay = await playRestOverSound(restEndTime);
      expect(firstPlay).toBe(true);

      // Second trigger for the same rest session (e.g. from index effect and background watcher)
      const secondPlay = await playRestOverSound(restEndTime);
      expect(secondPlay).toBe(false);
      expect(mockPlay).toHaveBeenCalledTimes(1);
    });

    it('does NOT play chime if the user skips the rest period', () => {
      usePulse.getState().startWorkout('Chest & Arms', mockPlanExercises);
      usePulse.getState().completeNextSetAndStartRest();

      const aw = usePulse.getState().activeWorkout!;
      expect(aw.restTimer).toBeDefined();

      // User skips rest before time is up
      usePulse.getState().clearRestTimer();

      const awAfter = usePulse.getState().activeWorkout!;
      expect(awAfter.restTimer).toBeNull();

      // Sound should NOT have been invoked
      expect(mockPlay).not.toHaveBeenCalled();
    });
  });
});
