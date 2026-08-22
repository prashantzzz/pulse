import * as Notifications from 'expo-notifications';
import {
  ACTIVE_WORKOUT_CATEGORY,
  ACTIVE_WORKOUT_NOTIFICATION_ID,
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
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  AndroidNotificationPriority: { HIGH: 'high' },
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

    // 2. Active workout with 'Pause' and 'Finish'
    expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
      ACTIVE_WORKOUT_CATEGORY,
      [
        expect.objectContaining({
          identifier: 'PAUSE_WORKOUT',
          buttonTitle: 'Pause',
          options: { opensAppToForeground: true },
        }),
        expect.objectContaining({
          identifier: 'FINISH_WORKOUT',
          buttonTitle: 'Finish',
          options: { opensAppToForeground: true, isDestructive: true },
        }),
      ],
    );
  });

  it('should present active workout live notification with current set, duration, and actions', async () => {
    await presentActiveWorkoutNotification({
      workoutTitle: 'Push Day A',
      currentSetInfo: 'Set 2/6 · Bench Press',
      durationText: '14:32',
      isPaused: false,
      workoutId: 'w-123',
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: ACTIVE_WORKOUT_NOTIFICATION_ID,
      content: {
        title: '🔥 [LIVE] Push Day A',
        body: 'Set 2/6 · Bench Press · Duration: 14:32',
        categoryIdentifier: ACTIVE_WORKOUT_CATEGORY,
        sticky: true,
        autoDismiss: false,
        sound: false,
        data: {
          workoutId: 'w-123',
          url: '/workout/w-123',
          isPaused: false,
        },
      },
      trigger: null,
    });
  });

  it('should dismiss active workout notification', async () => {
    await dismissActiveWorkoutNotification();
    expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith(ACTIVE_WORKOUT_NOTIFICATION_ID);
  });

  it('should schedule evening reminder with Start Workout category', async () => {
    await scheduleEveningReminder();
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(EVENING_REMINDER_ID);
  });
});
