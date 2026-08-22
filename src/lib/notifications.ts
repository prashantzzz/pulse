import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const EVENING_REMINDER_ID = 'pulse-evening-workout-reminder';
export const ACTIVE_WORKOUT_NOTIFICATION_ID = 'pulse-active-workout-live';

export const EVENING_REMINDER_CATEGORY = 'evening-reminder-category';
export const ACTIVE_WORKOUT_CATEGORY = 'active-workout-category';

// Configure foreground presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Configure interactive notification action buttons and categories for Android and iOS.
 */
export async function setupNotificationCategories(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    // 1. Category for evening workout reminders (includes 'Start Workout' button)
    await Notifications.setNotificationCategoryAsync(EVENING_REMINDER_CATEGORY, [
      {
        identifier: 'START_WORKOUT',
        buttonTitle: 'Start Workout',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    // 2. Category for active live workout (includes 'Pause' and 'Finish' buttons)
    await Notifications.setNotificationCategoryAsync(ACTIVE_WORKOUT_CATEGORY, [
      {
        identifier: 'PAUSE_WORKOUT',
        buttonTitle: 'Pause',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'FINISH_WORKOUT',
        buttonTitle: 'Finish',
        options: {
          opensAppToForeground: true,
          isDestructive: true,
        },
      },
    ]);
  } catch (err) {
    console.warn('Error setting up notification categories:', err);
  }
}

/**
 * Request notification permissions and create Android notification channels.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      // Channel 1: Scheduled daily reminders
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Workout Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6EE7B7',
        showBadge: true,
      });

      // Channel 2: Live active workout tracking (silent updates, public lockscreen)
      await Notifications.setNotificationChannelAsync('active-workout', {
        name: 'Active Workout Tracker',
        importance: Notifications.AndroidImportance.HIGH,
        sound: undefined,
        enableVibrate: false,
        showBadge: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    await setupNotificationCategories();

    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Error requesting notification permissions:', err);
    return false;
  }
}

/**
 * Present or update the live ongoing workout notification with current set, elapsed duration, and action buttons.
 */
export async function presentActiveWorkoutNotification({
  workoutTitle,
  currentSetInfo,
  durationText,
  isPaused = false,
  workoutId,
}: {
  workoutTitle: string;
  currentSetInfo: string;
  durationText: string;
  isPaused?: boolean;
  workoutId: string;
}): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const statusEmoji = isPaused ? '⏸️ [PAUSED]' : '🔥 [LIVE]';
    const bodyText = `${currentSetInfo} · Duration: ${durationText}`;

    await Notifications.scheduleNotificationAsync({
      identifier: ACTIVE_WORKOUT_NOTIFICATION_ID,
      content: {
        title: `${statusEmoji} ${workoutTitle}`,
        body: bodyText,
        categoryIdentifier: ACTIVE_WORKOUT_CATEGORY,
        sticky: true,
        autoDismiss: false,
        sound: false,
        data: {
          workoutId,
          url: `/workout/${workoutId}`,
          isPaused,
        },
      },
      trigger: null, // deliver immediately
    });
  } catch (err) {
    console.warn('Error presenting active workout notification:', err);
  }
}

/**
 * Dismiss the live active workout notification when the workout finishes or is discarded.
 */
export async function dismissActiveWorkoutNotification(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.dismissNotificationAsync(ACTIVE_WORKOUT_NOTIFICATION_ID);
  } catch (err) {
    console.warn('Error dismissing active workout notification:', err);
  }
}

/**
 * Cancel any scheduled evening workout reminder.
 */
export async function cancelEveningReminder(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelScheduledNotificationAsync(EVENING_REMINDER_ID);
  } catch (err) {
    console.warn('Error cancelling evening reminder:', err);
  }
}

/**
 * Schedule evening reminder for 7:00 PM with 'Start Workout' action button leading to Workouts page.
 */
export async function scheduleEveningReminder(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await cancelEveningReminder();

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(19, 0, 0, 0); // 7:00 PM

    if (now.getTime() >= scheduledTime.getTime()) {
      return;
    }

    const secondsUntil7PM = Math.floor((scheduledTime.getTime() - now.getTime()) / 1000);
    if (secondsUntil7PM <= 0) return;

    await Notifications.scheduleNotificationAsync({
      identifier: EVENING_REMINDER_ID,
      content: {
        title: 'Time to Train! 🏋️',
        body: "No workout logged today. Keep your momentum going and hit your goals!",
        categoryIdentifier: EVENING_REMINDER_CATEGORY,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          url: '/(tabs)/workouts',
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntil7PM,
        repeats: false,
      },
    });
  } catch (err) {
    console.warn('Error scheduling evening reminder:', err);
  }
}
