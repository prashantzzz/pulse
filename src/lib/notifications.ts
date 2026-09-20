import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { EXERCISE_MAP } from '../data/exercises';
import type { ActiveWorkout, Workout } from '../types';

export const EVENING_REMINDER_ID = 'pulse-evening-workout-reminder';
export const ACTIVE_WORKOUT_NOTIFICATION_ID = 'pulse-active-workout-live';

export const EVENING_REMINDER_CATEGORY = 'evening-reminder-category';
export const ACTIVE_WORKOUT_CATEGORY = 'active-workout-category';
export const ACTIVE_WORKOUT_PAUSED_CATEGORY = 'active-workout-paused-category';
export const ACTIVE_WORKOUT_RESTING_CATEGORY = 'active-workout-resting-category';

/**
 * Resolves the in-app route a tapped notification should open, if any.
 * Live-workout notifications carry both `workoutId` and `url`; the workout id
 * is preferred so callers can de-duplicate against the already-open screen.
 */
export function resolveNotificationRoute(
  data?: { url?: string; workoutId?: string } | null,
): string | null {
  if (data?.workoutId) return `/workout/${data.workoutId}`;
  if (data?.url) return data.url;
  return null;
}

let cachedUsePulse: any = null;
function getStoreState(): { workouts: Workout[]; activeWorkout: ActiveWorkout | null } | null {
  try {
    if (!cachedUsePulse) {
      cachedUsePulse = require('../store/useStore').usePulse;
    }
    if (cachedUsePulse?.getState) {
      return cachedUsePulse.getState();
    }
  } catch {
    // fallback if store not loaded or in isolated tests
  }
  return null;
}

/**
 * Checks if any completed workout was performed on the given local calendar date.
 */
export function hasCompletedWorkoutOnDate(workouts: Workout[], targetDate: Date = new Date()): boolean {
  if (!targetDate || isNaN(targetDate.getTime())) return false;
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();

  return workouts.some((w) => {
    if (!w) return false;
    const dates = [w.endTime, w.startTime].filter(Boolean);
    return dates.some((dStr) => {
      const d = new Date(dStr);
      return (
        !isNaN(d.getTime()) &&
        d.getFullYear() === targetYear &&
        d.getMonth() === targetMonth &&
        d.getDate() === targetDay
      );
    });
  });
}

export interface ReminderSuppressionCheckParams {
  workouts?: Workout[];
  activeWorkout?: ActiveWorkout | null;
  now?: Date;
}

/**
 * Determines whether the evening workout reminder should be suppressed for today.
 * The reminder will NOT fire if:
 * 1. The user has completed some workout today, OR
 * 2. The user is actively doing a workout (activeWorkout is not null) during the reminder time.
 */
export function isReminderSuppressed(params?: ReminderSuppressionCheckParams): boolean {
  const now = params?.now ?? new Date();
  let workouts = params?.workouts;
  let activeWorkout = params?.activeWorkout;

  if (workouts === undefined || activeWorkout === undefined) {
    const storeState = getStoreState();
    if (workouts === undefined) workouts = storeState?.workouts ?? [];
    if (activeWorkout === undefined) activeWorkout = storeState?.activeWorkout ?? null;
  }

  // If user is actively in a workout (exercising, resting, paused), suppress!
  if (activeWorkout !== null) return true;

  // If user has completed a workout today, suppress!
  return hasCompletedWorkoutOnDate(workouts, now);
}

/**
 * Presentation handler logic for Expo Notifications foreground delivery.
 * - Suppresses alert/banner/sound if active workout live notification.
 * - Suppresses evening reminder if user completed workout today or is currently training.
 */
export async function handleNotificationPresentation(
  notification: Notifications.Notification,
  suppressionCheck?: (params?: ReminderSuppressionCheckParams) => boolean
): Promise<Notifications.NotificationBehavior> {
  const isLive = notification?.request?.identifier === ACTIVE_WORKOUT_NOTIFICATION_ID;
  const isEveningReminder = notification?.request?.identifier === EVENING_REMINDER_ID;

  if (isEveningReminder) {
    const check = suppressionCheck ?? isReminderSuppressed;
    const suppressed = check();
    if (suppressed) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      };
    }
  }

  return {
    shouldShowAlert: !isLive,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: !isLive,
    shouldShowList: true,
  };
}

// Configure foreground presentation behavior — live workout tracker stays silent in the shade without popup alert banners
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: handleNotificationPresentation,
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
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6EE7B7',
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
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

export interface SyncWorkoutReminderOptions {
  workouts?: Workout[];
  activeWorkout?: ActiveWorkout | null;
  hour?: number;
  minute?: number;
  now?: Date;
}

/**
 * Synchronizes the daily evening workout reminder at 7:00 PM (19:00 local time).
 * - Suppressed if user completed a workout today or is currently doing a workout.
 * - When suppressed before 19:00: cancels today's reminder and schedules tomorrow's reminder at 19:00 with DATE trigger.
 * - When suppressed at/after 19:00: schedules daily reminder repeating from tomorrow at 19:00.
 * - When NOT suppressed before 19:00: schedules daily reminder for today at 19:00.
 * - When NOT suppressed at/after 19:00: schedules daily reminder repeating from tomorrow at 19:00.
 */
export async function syncWorkoutReminder(options?: SyncWorkoutReminderOptions): Promise<void> {
  if (Platform.OS === 'web') return;

  const hour = options?.hour ?? 19;
  const minute = options?.minute ?? 0;
  const now = options?.now ?? new Date();

  const suppressed = isReminderSuppressed({
    workouts: options?.workouts,
    activeWorkout: options?.activeWorkout,
    now,
  });

  const todayReminderTime = new Date(now);
  todayReminderTime.setHours(hour, minute, 0, 0);

  const tomorrowReminderTime = new Date(now);
  tomorrowReminderTime.setDate(tomorrowReminderTime.getDate() + 1);
  tomorrowReminderTime.setHours(hour, minute, 0, 0);

  try {
    await cancelEveningReminder();

    const notificationContent = {
      title: 'Time to Train! 🏋️',
      body: "No workout yet. Don’t break your streak!",
      categoryIdentifier: EVENING_REMINDER_CATEGORY,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
      data: {
        url: '/(tabs)/workouts',
      },
    };

    if (suppressed) {
      // User worked out today or is currently working out
      if (now.getTime() < todayReminderTime.getTime()) {
        // Today's 7 PM has not arrived yet, but must NOT fire today.
        // Schedule specifically for tomorrow at 7:00 PM local time.
        await Notifications.scheduleNotificationAsync({
          identifier: EVENING_REMINDER_ID,
          content: notificationContent,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: tomorrowReminderTime,
            channelId: 'default',
          },
        });
      } else {
        // 7 PM today has already passed, schedule daily repeating from tomorrow
        await Notifications.scheduleNotificationAsync({
          identifier: EVENING_REMINDER_ID,
          content: notificationContent,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: 'default',
          },
        });
      }
    } else {
      // Not suppressed: user has not worked out today and is not currently in a workout
      await Notifications.scheduleNotificationAsync({
        identifier: EVENING_REMINDER_ID,
        content: notificationContent,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: 'default',
        },
      });
    }
  } catch (err) {
    console.warn('Error syncing workout reminder:', err);
  }
}

/**
 * Schedule daily evening reminder at 7:00 PM (19:00).
 * Delegates to syncWorkoutReminder() to respect workout completion and active workout status.
 */
export async function scheduleEveningReminder(hour = 19, minute = 0): Promise<void> {
  return syncWorkoutReminder({ hour, minute });
}
