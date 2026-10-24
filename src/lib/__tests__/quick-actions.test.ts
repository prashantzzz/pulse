import fs from 'fs';
import path from 'path';
import * as QuickActions from 'expo-quick-actions';
import {
  APP_SHORTCUTS,
  getRouteForQuickAction,
  isQuickActionNavigationReady,
  setupQuickActions,
} from '../quick-actions';

jest.mock('expo-quick-actions', () => ({
  setItems: jest.fn().mockResolvedValue(undefined),
  isSupported: jest.fn().mockResolvedValue(true),
  initial: undefined,
  addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
}));

describe('App Shortcuts (Quick Actions)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JS Quick Actions Definition & Helpers', () => {
    it('defines shortcuts for Workout and Progress with correct routes and icons', () => {
      expect(APP_SHORTCUTS).toHaveLength(2);

      const workoutShortcut = APP_SHORTCUTS.find((s) => s.id === 'workout');
      expect(workoutShortcut).toBeDefined();
      expect(workoutShortcut?.title).toBe('Workout');
      expect(workoutShortcut?.params.href).toBe('/(tabs)/workouts');
      expect(workoutShortcut?.icon).toBeDefined();

      const progressShortcut = APP_SHORTCUTS.find((s) => s.id === 'progress');
      expect(progressShortcut).toBeDefined();
      expect(progressShortcut?.title).toBe('Progress');
      expect(progressShortcut?.params.href).toBe('/(tabs)/progress');
      expect(progressShortcut?.icon).toBeDefined();
    });

    it('sets items when setupQuickActions is called', async () => {
      await setupQuickActions();
      expect(QuickActions.isSupported).toHaveBeenCalled();
      expect(QuickActions.setItems).toHaveBeenCalledWith(APP_SHORTCUTS);
    });

    it('resolves correct target route from quick action params or id', () => {
      expect(getRouteForQuickAction({ id: 'workout', title: 'Workout', params: { href: '/(tabs)/workouts' } })).toBe('/(tabs)/workouts');
      expect(getRouteForQuickAction({ id: 'workout', title: 'Workout' })).toBe('/(tabs)/workouts');
      expect(getRouteForQuickAction({ id: 'progress', title: 'Progress', params: { href: '/(tabs)/progress' } })).toBe('/(tabs)/progress');
      expect(getRouteForQuickAction({ id: 'progress', title: 'Progress' })).toBe('/(tabs)/progress');
      // Never follow arbitrary URLs supplied by a shortcut payload.
      expect(getRouteForQuickAction({ id: 'x', title: 'X', params: { href: 'https://example.com' } })).toBeNull();
      expect(getRouteForQuickAction(null)).toBeNull();
      expect(getRouteForQuickAction(undefined)).toBeNull();
    });

    it('waits for the root Stack before handling a cold-start shortcut', () => {
      const ready = {
        platformOS: 'android',
        fontsLoaded: true,
        hydrated: true,
        isInitialized: true,
        isVerifyingUser: false,
      };
      expect(isQuickActionNavigationReady(ready)).toBe(true);
      expect(isQuickActionNavigationReady({ ...ready, platformOS: 'web' })).toBe(false);
      expect(isQuickActionNavigationReady({ ...ready, fontsLoaded: false })).toBe(false);
      expect(isQuickActionNavigationReady({ ...ready, hydrated: false })).toBe(false);
      expect(isQuickActionNavigationReady({ ...ready, isInitialized: false })).toBe(false);
      expect(isQuickActionNavigationReady({ ...ready, isVerifyingUser: true })).toBe(false);
    });
  });

  describe('Expo quick-actions configuration', () => {
    const rootDir = path.resolve(__dirname, '../../..');

    it('configures expo-quick-actions plugin in app.json', () => {
      const appJsonPath = path.join(rootDir, 'app.json');
      const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      const plugins = appJson.expo.plugins;
      const quickActionsPlugin = plugins.find((p: any) => Array.isArray(p) && p[0] === 'expo-quick-actions');
      expect(quickActionsPlugin).toBeDefined();
      const config = quickActionsPlugin[1];
      expect(config.androidIcons.shortcut_workout).toBeDefined();
      expect(config.androidIcons.shortcut_progress).toBeDefined();
      expect(config.iosActions).toHaveLength(2);
    });

    it('has a route file for each shortcut destination', () => {
      const routes = [
        path.join(rootDir, 'src/app/(tabs)/workouts.tsx'),
        path.join(rootDir, 'src/app/(tabs)/progress.tsx'),
      ];
      for (const route of routes) {
        expect(fs.existsSync(route)).toBe(true);
      }
    });
  });
});
