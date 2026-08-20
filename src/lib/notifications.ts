import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const EVENING_REMINDER_ID = 'pulse-evening-workout-reminder';

// Configure foreground presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the OS (Android 13+ / iOS).
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
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Workout Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6EE7B7',
      });
    }

    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Error requesting notification permissions:', err);
    return false;
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
 * Schedule evening reminder for 7:00 PM if user has not recorded any workout today.
 */
export async function scheduleEveningReminder(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    // Cancel any existing one first
    await cancelEveningReminder();

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(19, 0, 0, 0); // 7:00 PM

    // If it's already past 7:00 PM today, don't fire today
    if (now.getTime() >= scheduledTime.getTime()) {
      return;
    }

    const secondsUntil7PM = Math.floor((scheduledTime.getTime() - now.getTime()) / 1000);
    if (secondsUntil7PM <= 0) return;

    await Notifications.scheduleNotificationAsync({
      identifier: EVENING_REMINDER_ID,
      content: {
        title: 'Time to Train! 🏋️',
        body: "You haven't logged any workout today. Keep your momentum going and hit your goal!",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
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
