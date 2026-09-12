import fs from 'fs';
import path from 'path';
import * as QuickActions from 'expo-quick-actions';
import { APP_SHORTCUTS, getRouteForQuickAction, setupQuickActions } from '../quick-actions';

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
      expect(getRouteForQuickAction(null)).toBeNull();
      expect(getRouteForQuickAction(undefined)).toBeNull();
    });
  });

  describe('Android Native Shortcuts Manifest & Resources', () => {
    const rootDir = path.resolve(__dirname, '../../..');

    it('includes shortcuts metadata in AndroidManifest.xml', () => {
      const manifestPath = path.join(rootDir, 'android/app/src/main/AndroidManifest.xml');
      const manifest = fs.readFileSync(manifestPath, 'utf8');
      expect(manifest).toContain('android:name="android.app.shortcuts"');
      expect(manifest).toContain('android:resource="@xml/shortcuts"');
    });

    it('defines shortcuts.xml with workout and progress intents', () => {
      const shortcutsXmlPath = path.join(rootDir, 'android/app/src/main/res/xml/shortcuts.xml');
      expect(fs.existsSync(shortcutsXmlPath)).toBe(true);
      const xml = fs.readFileSync(shortcutsXmlPath, 'utf8');
      expect(xml).toContain('android:shortcutId="workout"');
      expect(xml).toContain('android:data="nextrep://(tabs)/workouts"');
      expect(xml).toContain('android:shortcutId="progress"');
      expect(xml).toContain('android:data="nextrep://(tabs)/progress"');
      expect(xml).toContain('@drawable/shortcut_workout');
      expect(xml).toContain('@drawable/shortcut_progress');
    });

    it('defines shortcut labels in strings.xml', () => {
      const stringsXmlPath = path.join(rootDir, 'android/app/src/main/res/values/strings.xml');
      const stringsXml = fs.readFileSync(stringsXmlPath, 'utf8');
      expect(stringsXml).toContain('shortcut_workout_short');
      expect(stringsXml).toContain('Workout');
      expect(stringsXml).toContain('shortcut_progress_short');
      expect(stringsXml).toContain('Progress');
    });

    it('has vector drawables and png icons for workout and progress', () => {
      const workoutXml = path.join(rootDir, 'android/app/src/main/res/drawable/shortcut_workout.xml');
      const progressXml = path.join(rootDir, 'android/app/src/main/res/drawable/shortcut_progress.xml');
      expect(fs.existsSync(workoutXml)).toBe(true);
      expect(fs.existsSync(progressXml)).toBe(true);

      const workoutPng = path.join(rootDir, 'assets/images/shortcut-workout.png');
      const progressPng = path.join(rootDir, 'assets/images/shortcut-progress.png');
      expect(fs.existsSync(workoutPng)).toBe(true);
      expect(fs.existsSync(progressPng)).toBe(true);
    });

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
  });
});
