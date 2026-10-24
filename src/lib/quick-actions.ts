import * as QuickActions from 'expo-quick-actions';
import { Platform } from 'react-native';

export interface AppShortcut {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  params: {
    href: string;
  };
}

export const APP_SHORTCUTS: AppShortcut[] = [
  {
    id: 'workout',
    title: 'Workout',
    subtitle: 'Start or view workouts',
    icon: Platform.OS === 'ios' ? 'symbol:dumbbell.fill' : 'shortcut_workout',
    params: { href: '/(tabs)/workouts' },
  },
  {
    id: 'progress',
    title: 'Progress',
    subtitle: 'View stats & analytics',
    icon: Platform.OS === 'ios' ? 'symbol:chart.line.uptrend.xyaxis' : 'shortcut_progress',
    params: { href: '/(tabs)/progress' },
  },
];

/**
 * Quick-action navigation must wait until the same conditions that mount the
 * root Stack are true. Otherwise a cold-start shortcut can fire while the app
 * still shows the loading view (no navigator), which drops the action or
 * crashes the app.
 */
export function isQuickActionNavigationReady(params: {
  platformOS: string;
  fontsLoaded: boolean;
  hydrated: boolean;
  isInitialized: boolean;
  isVerifyingUser: boolean;
}): boolean {
  return (
    params.platformOS !== 'web' &&
    params.fontsLoaded &&
    params.hydrated &&
    params.isInitialized &&
    !params.isVerifyingUser
  );
}

/**
 * Configure native Android & iOS dynamic app shortcuts / quick actions.
 *
 * Android uses runtime dynamic shortcuts only. A static `android.app.shortcuts`
 * XML entry cannot carry the bundle this module expects, and a stale one points
 * at a hard-coded activity/package that breaks as soon as the app id changes.
 */
export async function setupQuickActions(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const supported = await QuickActions.isSupported();
    if (!supported) return;
    await QuickActions.setItems(APP_SHORTCUTS);
  } catch {
    // Non-fatal if unsupported on platform/device
  }
}

/**
 * Resolve target route from a quick action or shortcut.
 */
export function getRouteForQuickAction(action: QuickActions.Action | null | undefined): string | null {
  if (!action) return null;
  const href = action.params?.href;
  if (typeof href === 'string' && href.startsWith('/')) {
    return href;
  }
  if (action.id === 'workout') {
    return '/(tabs)/workouts';
  }
  if (action.id === 'progress') {
    return '/(tabs)/progress';
  }
  return null;
}
