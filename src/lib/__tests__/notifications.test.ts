import * as Notifications from 'expo-notifications';
import {
  ACTIVE_WORKOUT_CATEGORY,
  ACTIVE_WORKOUT_NOTIFICATION_ID,
  ACTIVE_WORKOUT_PAUSED_CATEGORY,
  ACTIVE_WORKOUT_RESTING_CATEGORY,
  EVENING_REMINDER_CATEGORY,
  EVENING_REMINDER_ID,
  dismissActiveWorkoutNotification,
  hasCompletedWorkoutOnDate,
  handleNotificationPresentation,
  isReminderSuppressed,
  presentActiveWorkoutNotification,
  scheduleEveningReminder,
  setupNotificationCategories,
  syncActiveWorkoutNotification,
  syncWorkoutReminder,
} from '../notifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationCategoryAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id-123'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  dismissNotificationAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3, LOW: 2 },
  AndroidNotificationPriority: { MAX: 'max', HIGH: 'high', LOW: 'low' },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval', DAILY: 'daily', DATE: 'date' },
}));

describe('Notifications System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register notification categories with correct interactive action buttons', async () => {
    await setupNotificationCategories();

    // 1. Evening reminder with 'Start Workout'
    expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
      EVENING_REMINDER_CATEGORY,
      [
        expect.objectContaining({
          identifier: 'START_WORKOUT',
          buttonTitle: 'Start Workout',
          options: { opensAppToForeground: true },
        }),
      ],
    );

    // 2. Active workout running with 'Next Rep', 'Pause' and 'Finish'
    expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
      ACTIVE_WORKOUT_CATEGORY,
      [
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
      ],
    );

    // 3. Active workout paused with 'Resume' and 'Finish'
    expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
      ACTIVE_WORKOUT_PAUSED_CATEGORY,
      [
        expect.objectContaining({
          identifier: 'RESUME_WORKOUT',
          buttonTitle: 'Resume',
          options: { opensAppToForeground: false },
        }),
        expect.objectContaining({
          identifier: 'FINISH_WORKOUT',
          buttonTitle: 'Finish',
          options: { opensAppToForeground: true, isDestructive: true },
        }),
      ],
    );

    // 4. Active workout resting with 'Skip Rest' and 'Finish' (NO Pause button)
    expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
      ACTIVE_WORKOUT_RESTING_CATEGORY,
      [
        expect.objectContaining({
          identifier: 'SKIP_REST',
          buttonTitle: 'Skip Rest',
          options: { opensAppToForeground: false },
        }),
        expect.objectContaining({
          identifier: 'FINISH_WORKOUT',
          buttonTitle: 'Finish',
          options: { opensAppToForeground: true, isDestructive: true },
        }),
      ],
    );
  });

  it('should present active workout live notification with current ith set and actions', async () => {
    await presentActiveWorkoutNotification({
      workoutTitle: 'Push Day A',
      currentSetInfo: 'Set 2 · Bench Press',
      isPaused: false,
      workoutId: 'w-123',
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: ACTIVE_WORKOUT_NOTIFICATION_ID,
      content: expect.objectContaining({
        title: 'Push Day A',
        body: 'Set 2 · Bench Press',
        categoryIdentifier: ACTIVE_WORKOUT_CATEGORY,
        sticky: true,
        autoDismiss: false,
        sound: false,
        priority: 'low',
        data: {
          workoutId: 'w-123',
          url: '/workout/w-123',
          isPaused: false,
          isResting: false,
        },
      }),
      trigger: null,
    });
  });

  it('should present resting workout notification without pause button and with resting category', async () => {
    await presentActiveWorkoutNotification({
      workoutTitle: 'Push Day A',
      currentSetInfo: 'Rest: 01:30 (Bench Press) · Up Next: Set 3 · Bench Press',
      isResting: true,
      workoutId: 'w-123',
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: ACTIVE_WORKOUT_NOTIFICATION_ID,
      content: expect.objectContaining({
        title: '⏱️ Resting · Push Day A',
        body: 'Rest: 01:30 (Bench Press) · Up Next: Set 3 · Bench Press',
        categoryIdentifier: ACTIVE_WORKOUT_RESTING_CATEGORY,
        data: expect.objectContaining({ isResting: true }),
      }),
      trigger: null,
    });
  });

  it('should present paused workout notification with minimal pause icon and resume category', async () => {
    await presentActiveWorkoutNotification({
      workoutTitle: 'Push Day A',
      currentSetInfo: 'Set 2 · Bench Press',
      isPaused: true,
      workoutId: 'w-123',
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: ACTIVE_WORKOUT_NOTIFICATION_ID,
      content: expect.objectContaining({
        title: '⏸️ Push Day A',
        body: 'Set 2 · Bench Press',
        categoryIdentifier: ACTIVE_WORKOUT_PAUSED_CATEGORY,
        data: expect.objectContaining({ isPaused: true }),
      }),
      trigger: null,
    });
  });

  it('should dismiss active workout notification', async () => {
    await dismissActiveWorkoutNotification();
    expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith(ACTIVE_WORKOUT_NOTIFICATION_ID);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(ACTIVE_WORKOUT_NOTIFICATION_ID);
  });

  it('should schedule evening reminder with Start Workout category', async () => {
    await scheduleEveningReminder();
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(EVENING_REMINDER_ID);
  });

  it('should sync active workout notification using syncActiveWorkoutNotification', async () => {
    const mockActiveWorkout: any = {
      id: 'w-sync-test',
      title: 'Leg Day',
      paused: false,
      exercises: [
        {
          id: 'we-1',
          exerciseId: 'squat',
          sets: [
            { id: 's-1', setIndex: 1, completed: true },
            { id: 's-2', setIndex: 2, completed: false },
          ],
        },
      ],
      restTimer: {
        targetEndTimeMs: Date.now() + 60000,
        totalSeconds: 60,
        nextSetInfo: 'Set 2 · Squat (100 kg × 5 reps)',
        paused: false,
      },
    };

    await syncActiveWorkoutNotification(mockActiveWorkout);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: ACTIVE_WORKOUT_NOTIFICATION_ID,
      content: expect.objectContaining({
        title: '⏱️ Resting · Leg Day',
        body: 'Up next: Set 2 · Squat',
        categoryIdentifier: ACTIVE_WORKOUT_RESTING_CATEGORY,
      }),
      trigger: null,
    });
  });

  describe('Workout Reminder Suppression Logic', () => {
    const today = new Date('2026-09-10T14:30:00');
    const yesterday = new Date('2026-09-09T18:00:00');

    it('hasCompletedWorkoutOnDate correctly identifies today vs other days', () => {
      const workoutToday: any = {
        id: 'w-today',
        startTime: '2026-09-10T09:00:00.000Z',
        endTime: '2026-09-10T10:00:00.000Z',
      };
      const workoutYesterday: any = {
        id: 'w-yest',
        startTime: '2026-09-09T09:00:00.000Z',
        endTime: '2026-09-09T10:00:00.000Z',
      };

      expect(hasCompletedWorkoutOnDate([workoutToday], today)).toBe(true);
      expect(hasCompletedWorkoutOnDate([workoutYesterday], today)).toBe(false);
      expect(hasCompletedWorkoutOnDate([], today)).toBe(false);
    });

    it('isReminderSuppressed returns true if user is currently doing a workout', () => {
      const mockActive: any = { id: 'aw-1', title: 'Chest Day', exercises: [] };
      expect(
        isReminderSuppressed({
          workouts: [],
          activeWorkout: mockActive,
          now: today,
        }),
      ).toBe(true);
    });

    it('isReminderSuppressed returns true if user completed a workout today', () => {
      const workoutToday: any = {
        id: 'w-today',
        startTime: '2026-09-10T09:00:00.000Z',
        endTime: '2026-09-10T10:00:00.000Z',
      };
      expect(
        isReminderSuppressed({
          workouts: [workoutToday],
          activeWorkout: null,
          now: today,
        }),
      ).toBe(true);
    });

    it('isReminderSuppressed returns false if no workout today and not currently working out', () => {
      const workoutYesterday: any = {
        id: 'w-yesterday',
        startTime: '2026-09-09T09:00:00.000Z',
        endTime: '2026-09-09T10:00:00.000Z',
      };
      expect(
        isReminderSuppressed({
          workouts: [workoutYesterday],
          activeWorkout: null,
          now: today,
        }),
      ).toBe(false);
    });

    it('syncWorkoutReminder schedules today 7 PM if not suppressed and before 7 PM', async () => {
      const before7PM = new Date('2026-09-10T14:00:00');
      await syncWorkoutReminder({
        workouts: [],
        activeWorkout: null,
        now: before7PM,
      });

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(EVENING_REMINDER_ID);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        identifier: EVENING_REMINDER_ID,
        content: expect.objectContaining({
          categoryIdentifier: EVENING_REMINDER_CATEGORY,
        }),
        trigger: {
          type: 'daily',
          hour: 19,
          minute: 0,
          channelId: 'default',
        },
      });
    });

    it('syncWorkoutReminder does NOT schedule for today if user completed a workout today before 7 PM', async () => {
      const before7PM = new Date('2026-09-10T14:00:00');
      const workoutToday: any = {
        id: 'w-today',
        startTime: '2026-09-10T11:00:00.000Z',
        endTime: '2026-09-10T12:00:00.000Z',
      };

      await syncWorkoutReminder({
        workouts: [workoutToday],
        activeWorkout: null,
        now: before7PM,
      });

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(EVENING_REMINDER_ID);
      // Scheduled specifically for tomorrow with DATE trigger (NOT today DAILY)
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        identifier: EVENING_REMINDER_ID,
        content: expect.objectContaining({
          categoryIdentifier: EVENING_REMINDER_CATEGORY,
        }),
        trigger: expect.objectContaining({
          type: 'date',
          date: expect.any(Date),
        }),
      });

      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.find(
        (c) => c[0].identifier === EVENING_REMINDER_ID,
      );
      const scheduledDate = call[0].trigger.date as Date;
      expect(scheduledDate.getDate()).toBe(11); // Tomorrow!
      expect(scheduledDate.getHours()).toBe(19);
    });

    it('syncWorkoutReminder does NOT schedule for today if user is doing a workout at 6:50 PM', async () => {
      const at650PM = new Date('2026-09-10T18:50:00');
      const mockActive: any = { id: 'aw-1', title: 'Evening Lift', exercises: [] };

      await syncWorkoutReminder({
        workouts: [],
        activeWorkout: mockActive,
        now: at650PM,
      });

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(EVENING_REMINDER_ID);
      // Scheduled for tomorrow (NOT today)
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        identifier: EVENING_REMINDER_ID,
        content: expect.objectContaining({
          categoryIdentifier: EVENING_REMINDER_CATEGORY,
        }),
        trigger: expect.objectContaining({
          type: 'date',
          date: expect.any(Date),
        }),
      });

      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.find(
        (c) => c[0].identifier === EVENING_REMINDER_ID,
      );
      const scheduledDate = call[0].trigger.date as Date;
      expect(scheduledDate.getDate()).toBe(11); // Tomorrow!
    });

    it('syncWorkoutReminder schedules repeating daily when triggered after 7 PM', async () => {
      const after7PM = new Date('2026-09-10T20:30:00');
      const workoutToday: any = {
        id: 'w-today',
        startTime: '2026-09-10T19:15:00.000Z',
        endTime: '2026-09-10T20:15:00.000Z',
      };

      await syncWorkoutReminder({
        workouts: [workoutToday],
        activeWorkout: null,
        now: after7PM,
      });

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(EVENING_REMINDER_ID);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        identifier: EVENING_REMINDER_ID,
        content: expect.objectContaining({
          categoryIdentifier: EVENING_REMINDER_CATEGORY,
        }),
        trigger: {
          type: 'daily',
          hour: 19,
          minute: 0,
          channelId: 'default',
        },
      });
    });

    it('syncWorkoutReminder restores today 7 PM reminder when active workout is cancelled before 7 PM without training today', async () => {
      const before7PM = new Date('2026-09-10T17:00:00');

      // 1. User starts workout at 5 PM -> cancelled for today
      await syncWorkoutReminder({
        workouts: [],
        activeWorkout: { id: 'aw-temp' } as any,
        now: before7PM,
      });
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(EVENING_REMINDER_ID);

      jest.clearAllMocks();

      // 2. User cancels/discards active workout at 5:15 PM -> restored for today
      const at515PM = new Date('2026-09-10T17:15:00');
      await syncWorkoutReminder({
        workouts: [],
        activeWorkout: null,
        now: at515PM,
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        identifier: EVENING_REMINDER_ID,
        content: expect.objectContaining({
          categoryIdentifier: EVENING_REMINDER_CATEGORY,
        }),
        trigger: {
          type: 'daily',
          hour: 19,
          minute: 0,
          channelId: 'default',
        },
      });
    });

    it('syncWorkoutReminder stays suppressed if user cancels active workout but completed another workout earlier today', async () => {
      const before7PM = new Date('2026-09-10T17:30:00');
      const workoutFinishedMorning: any = {
        id: 'w-morning',
        startTime: '2026-09-10T08:00:00.000Z',
        endTime: '2026-09-10T09:00:00.000Z',
      };

      await syncWorkoutReminder({
        workouts: [workoutFinishedMorning],
        activeWorkout: null,
        now: before7PM,
      });

      // Must NOT schedule for today; schedules for tomorrow
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.find(
        (c) => c[0].identifier === EVENING_REMINDER_ID,
      );
      expect(call[0].trigger.type).toBe('date');
      const scheduledDate = call[0].trigger.date as Date;
      expect(scheduledDate.getDate()).toBe(11);
    });

    it('hasCompletedWorkoutOnDate handles invalid target dates and malformed workout entries gracefully', () => {
      expect(hasCompletedWorkoutOnDate([], new Date('invalid-date'))).toBe(false);
      expect(hasCompletedWorkoutOnDate([null as any, undefined as any], today)).toBe(false);
      expect(hasCompletedWorkoutOnDate([{ id: 'w-nodates', startTime: '', endTime: '' } as any], today)).toBe(false);
      expect(hasCompletedWorkoutOnDate([{ id: 'w-baddates', startTime: 'not-a-date', endTime: 'also-not-a-date' } as any], today)).toBe(false);
    });

    it('handleNotificationPresentation suppresses alert and banner when evening reminder is suppressed', async () => {
      const mockEveningNotification: any = {
        request: {
          identifier: EVENING_REMINDER_ID,
        },
      };

      // When suppressed (e.g. user worked out today or in workout)
      const behaviorSuppressed = await handleNotificationPresentation(
        mockEveningNotification,
        () => true, // suppressionCheck returns true
      );

      expect(behaviorSuppressed).toEqual({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      });

      // When not suppressed (user has not worked out today)
      const behaviorUnsuppressed = await handleNotificationPresentation(
        mockEveningNotification,
        () => false, // suppressionCheck returns false
      );

      expect(behaviorUnsuppressed).toEqual({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      });
    });

    it('handleNotificationPresentation silences live active workout notification in the shade', async () => {
      const mockLiveNotification: any = {
        request: {
          identifier: ACTIVE_WORKOUT_NOTIFICATION_ID,
        },
      };

      const behavior = await handleNotificationPresentation(mockLiveNotification);

      expect(behavior).toEqual({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: true,
      });
    });
  });
});
