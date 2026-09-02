import * as Notifications from 'expo-notifications';
import {
  ACTIVE_WORKOUT_CATEGORY,
  ACTIVE_WORKOUT_NOTIFICATION_ID,
  ACTIVE_WORKOUT_PAUSED_CATEGORY,
  ACTIVE_WORKOUT_RESTING_CATEGORY,
  EVENING_REMINDER_CATEGORY,
  EVENING_REMINDER_ID,
  dismissActiveWorkoutNotification,
  presentActiveWorkoutNotification,
  scheduleEveningReminder,
  setupNotificationCategories,
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
  AndroidImportance: { HIGH: 4, DEFAULT: 3, LOW: 2 },
  AndroidNotificationPriority: { HIGH: 'high', LOW: 'low' },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
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

    // 2. Active workout running with 'Pause' and 'Finish'
    expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
      ACTIVE_WORKOUT_CATEGORY,
      [
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
});
