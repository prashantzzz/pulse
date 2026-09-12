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
 * Configure native Android & iOS dynamic app shortcuts / quick actions.
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
  if (typeof action.params?.href === 'string') {
    return action.params.href;
  }
  if (action.id === 'workout') {
    return '/(tabs)/workouts';
  }
  if (action.id === 'progress') {
    return '/(tabs)/progress';
  }
  return null;
}
