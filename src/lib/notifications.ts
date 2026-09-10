import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { EXERCISE_MAP } from '../data/exercises';
import type { ActiveWorkout } from '../types';

export const EVENING_REMINDER_ID = 'pulse-evening-workout-reminder';
export const ACTIVE_WORKOUT_NOTIFICATION_ID = 'pulse-active-workout-live';

export const EVENING_REMINDER_CATEGORY = 'evening-reminder-category';
export const ACTIVE_WORKOUT_CATEGORY = 'active-workout-category';
export const ACTIVE_WORKOUT_PAUSED_CATEGORY = 'active-workout-paused-category';
export const ACTIVE_WORKOUT_RESTING_CATEGORY = 'active-workout-resting-category';

// Configure foreground presentation behavior — live workout tracker stays silent in the shade without popup alert banners
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const isLive = notification?.request?.identifier === ACTIVE_WORKOUT_NOTIFICATION_ID;
      return {
        shouldShowAlert: !isLive,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: !isLive,
        shouldShowList: true,
      };
    },
  });
}

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

    // 2. Category for active live workout running (includes 'Next Rep', 'Pause', and 'Finish' buttons)
    await Notifications.setNotificationCategoryAsync(ACTIVE_WORKOUT_CATEGORY, [
      {
        identifier: 'NEXT_REP',
        buttonTitle: 'Next Rep',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'PAUSE_WORKOUT',
        buttonTitle: 'Pause',
        options: {
          opensAppToForeground: false,
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

    // 3. Category for active live workout paused (includes 'Resume' and 'Finish' buttons)
    await Notifications.setNotificationCategoryAsync(ACTIVE_WORKOUT_PAUSED_CATEGORY, [
      {
        identifier: 'RESUME_WORKOUT',
        buttonTitle: 'Resume',
        options: {
          opensAppToForeground: false,
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

    // 4. Category for active live workout resting (includes 'Skip Rest' and 'Finish' buttons — NO Pause button)
    await Notifications.setNotificationCategoryAsync(ACTIVE_WORKOUT_RESTING_CATEGORY, [
      {
        identifier: 'SKIP_REST',
        buttonTitle: 'Skip Rest',
        options: {
          opensAppToForeground: false,
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

      // Channel 2: Live active workout tracking (silent ongoing updates in notification tray)
      await Notifications.setNotificationChannelAsync('active-workout', {
        name: 'Active Workout Tracker',
        importance: Notifications.AndroidImportance.LOW,
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
 * Present or update the live ongoing workout notification with current set progress and action buttons.
 * Updates in-place silently in the shade without heads-up popups or recurring timer intervals.
 */
export async function presentActiveWorkoutNotification({
  workoutTitle,
  currentSetInfo,
  durationText,
  isPaused = false,
  isResting = false,
  workoutId,
}: {
  workoutTitle: string;
  currentSetInfo: string;
  durationText?: string;
  isPaused?: boolean;
  isResting?: boolean;
  workoutId: string;
}): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    let title = workoutTitle;
    let category = ACTIVE_WORKOUT_CATEGORY;

    if (isResting) {
      title = `⏱️ Resting · ${workoutTitle}`;
      category = ACTIVE_WORKOUT_RESTING_CATEGORY;
    } else if (isPaused) {
      title = `⏸️ ${workoutTitle}`;
      category = ACTIVE_WORKOUT_PAUSED_CATEGORY;
    }

    const bodyText = currentSetInfo;

    await Notifications.scheduleNotificationAsync({
      identifier: ACTIVE_WORKOUT_NOTIFICATION_ID,
      content: {
        title,
        body: bodyText,
        categoryIdentifier: category,
        sticky: true,
        autoDismiss: false,
        sound: false,
        priority: Notifications.AndroidNotificationPriority.LOW,
        ...(Platform.OS === 'android' ? { channelId: 'active-workout' } : {}),
        data: {
          workoutId,
          url: `/workout/${workoutId}`,
          isPaused,
          isResting,
        },
      },
      trigger: null, // update in-place immediately
    });
  } catch (err) {
    console.warn('Error presenting active workout notification:', err);
  }
}

/**
 * Synchronize the active workout live notification in-place based on current workout state.
 * Works seamlessly whether called from the workout screen, root layout action listeners,
 * or background subscribers.
 */
export async function syncActiveWorkoutNotification(w: ActiveWorkout): Promise<void> {
  if (Platform.OS === 'web') return;

  const rt = w.restTimer;
  const curSLeft = rt
    ? rt.paused
      ? (rt.remainingSecWhenPaused ?? 0)
      : Math.max(0, Math.ceil((rt.targetEndTimeMs - Date.now()) / 1000))
    : 0;
  const isResting = !!rt && curSLeft > 0;
  const cEx = w.exercises.find((we) => we.sets.some((s) => !s.completed)) ?? w.exercises[w.exercises.length - 1];
  const cExName = cEx ? EXERCISE_MAP[cEx.exerciseId]?.name ?? 'Exercise' : 'Workout';
  const dSets = w.exercises.reduce((s, we) => s + we.sets.filter((x) => x.completed).length, 0);
  const tSets = w.exercises.reduce((s, we) => s + we.sets.length, 0);

  let info = '';
  if (isResting && rt) {
    const stripped = rt.nextSetInfo ? rt.nextSetInfo.replace(/\s*\([^)]*\)\s*$/, '').trim() : '';
    info = stripped ? `Up next: ${stripped}` : '';
  } else {
    info = tSets > 0
      ? (dSets < tSets ? `Set ${dSets + 1} · ${cExName}` : 'All sets completed')
      : 'Workout in progress';
  }

  await presentActiveWorkoutNotification({
    workoutTitle: w.title,
    currentSetInfo: info,
    isPaused: w.paused ?? false,
    isResting,
    workoutId: w.id,
  });
}

/**
 * Dismiss the live active workout notification when the workout finishes or is discarded.
 */
export async function dismissActiveWorkoutNotification(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.dismissNotificationAsync(ACTIVE_WORKOUT_NOTIFICATION_ID);
    await Notifications.cancelScheduledNotificationAsync(ACTIVE_WORKOUT_NOTIFICATION_ID);
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
 * Schedule daily evening reminder at 7:00 PM (19:00) with 'Start Workout' action button leading to Workouts page.
 * Uses native daily calendar trigger so Android and iOS schedule repeating alarms at the exact local time.
 */
export async function scheduleEveningReminder(hour = 19, minute = 0): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await cancelEveningReminder();

    await Notifications.scheduleNotificationAsync({
      identifier: EVENING_REMINDER_ID,
      content: {
        title: 'Time to Train! 🏋️',
        body: "No workout yet. Don’t break your streak!",
        categoryIdentifier: EVENING_REMINDER_CATEGORY,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
        data: {
          url: '/(tabs)/workouts',
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'default',
      },
    });
  } catch (err) {
    console.warn('Error scheduling evening reminder:', err);
  }
}
