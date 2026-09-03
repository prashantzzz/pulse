import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { useAuth } from '../../store/useAuth';
import { usePulse } from '../../store/useStore';
import { ACCENTS, colors, gradients } from '../../theme';
import { workoutStats } from '../stats';
import type { Workout } from '../../types';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

describe('Recent Fixes Regression & Negative Test Suite', () => {
  describe('Auth State & isVerifyingUser lifecycle', () => {
    beforeEach(() => {
      useAuth.setState({
        session: null,
        user: null,
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
        isVerifyingUser: false,
      });
      usePulse.getState().clearSessionCache();
    });

    it('initializes with isVerifyingUser as false', () => {
      expect(useAuth.getState().isVerifyingUser).toBe(false);
    });

    it('allows toggling isVerifyingUser state', () => {
      useAuth.getState().setIsVerifyingUser(true);
      expect(useAuth.getState().isVerifyingUser).toBe(true);

      useAuth.getState().setIsVerifyingUser(false);
      expect(useAuth.getState().isVerifyingUser).toBe(false);
    });

    it('signOut resets isVerifyingUser and authentication state completely', async () => {
      useAuth.setState({
        session: { user: { id: 'u123' } } as any,
        user: { id: 'u123' } as any,
        isAuthenticated: true,
        isVerifyingUser: true,
      });

      await useAuth.getState().signOut();

      const state = useAuth.getState();
      expect(state.isVerifyingUser).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
    });

    it('clearSessionCache resets onboarded and profile cache', () => {
      usePulse.setState({
        onboarded: true,
        profile: { name: 'Tester', gender: 'male', goal: ['Build Muscle'], experience: 'Beginner', frequencyPerWeek: 3, equipment: [], style: [], trainingAgeMonths: 0, onboarded: true },
      });

      usePulse.getState().clearSessionCache();

      expect(usePulse.getState().onboarded).toBe(false);
      expect(usePulse.getState().profile).toBeNull();
    });
  });

  describe('Theme Accent Real-time Updates', () => {
    it('updates colors.accent and gradients when setAccent is called', () => {
      usePulse.getState().setAccent('gold');
      expect(usePulse.getState().accentKey).toBe('gold');
      expect(colors.accent).toBe(ACCENTS.gold.accent);
      expect(gradients.accent[0]).toBe(ACCENTS.gold.gradient[0]);
      expect(gradients.accent[1]).toBe(ACCENTS.gold.gradient[1]);

      usePulse.getState().setAccent('rose');
      expect(usePulse.getState().accentKey).toBe('rose');
      expect(colors.accent).toBe(ACCENTS.rose.accent);
      expect(gradients.accent[0]).toBe(ACCENTS.rose.gradient[0]);

      usePulse.getState().setAccent('mint');
      expect(usePulse.getState().accentKey).toBe('mint');
      expect(colors.accent).toBe(ACCENTS.mint.accent);
    });
  });

  describe('Set Logger: Save vs Complete', () => {
    beforeEach(() => {
      usePulse.setState({
        activeWorkout: {
          id: 'test-w',
          title: 'Test Workout',
          exercises: [
            {
              id: 'we-1',
              exerciseId: 'bench-press',
              name: 'Bench Press',
              order: 1,
              sets: [
                { id: 's-1', setIndex: 1, setType: 'normal', targetReps: '8-12', weightKg: 60, reps: 10, completed: false },
                { id: 's-2', setIndex: 2, setType: 'normal', targetReps: '8-12', weightKg: 60, reps: 10, completed: false },
              ],
            },
          ],
          startTime: new Date().toISOString(),
          volume: 0,
          notes: '',
        },
      });
    });

    it('patchSet (Save action) saves reps & weight without marking set as completed', () => {
      usePulse.getState().patchSet('bench-press', 's-1', {
        weightKg: 80,
        reps: 8,
        rpe: 8.5,
        notes: 'Pre-set warm up adjusted',
      });

      const active = usePulse.getState().activeWorkout;
      const set1 = active?.exercises[0].sets[0];
      expect(set1?.weightKg).toBe(80);
      expect(set1?.reps).toBe(8);
      expect(set1?.rpe).toBe(8.5);
      expect(set1?.notes).toBe('Pre-set warm up adjusted');
      expect(set1?.completed).toBe(false);
      expect(set1?.completedAt).toBeUndefined();
    });

    it('Complete set flow updates values and marks completed', () => {
      usePulse.getState().patchSet('bench-press', 's-1', {
        weightKg: 75,
        reps: 10,
        rpe: 8,
        completed: true,
        completedAt: new Date().toISOString(),
      });

      const active = usePulse.getState().activeWorkout;
      const set1 = active?.exercises[0].sets[0];
      expect(set1?.completed).toBe(true);
      expect(set1?.completedAt).toBeDefined();
      expect(set1?.weightKg).toBe(75);
      expect(set1?.reps).toBe(10);
    });
  });

  describe('Android Hardware Back Navigation Segment Guard', () => {
    function isTabScreen(segments: string[]): boolean {
      return segments[0] === '(tabs)' && segments.length <= 2;
    }

    it('identifies top-level tab routes correctly', () => {
      expect(isTabScreen(['(tabs)', 'home'])).toBe(true);
      expect(isTabScreen(['(tabs)', 'profile'])).toBe(true);
      expect(isTabScreen(['(tabs)', 'workouts'])).toBe(true);
      expect(isTabScreen(['(tabs)'])).toBe(true);
    });

    it('does not intercept when stack screens are pushed on top', () => {
      expect(isTabScreen(['settings'])).toBe(false);
      expect(isTabScreen(['workout', 'w-1', 'log'])).toBe(false);
      expect(isTabScreen(['gym-mode'])).toBe(false);
      expect(isTabScreen(['history'])).toBe(false);
      expect(isTabScreen(['records'])).toBe(false);
      expect(isTabScreen(['library'])).toBe(false);
      expect(isTabScreen(['(tabs)', 'workouts', 'detail'])).toBe(false);
    });
  });

  describe('Calorie Calculation in workoutStats (not placeholder ~6)', () => {
    it('calculates realistic calories based on duration and heavy compound sets', () => {
      const now = Date.now();
      const mockWorkout: Workout = {
        id: 'w-heavy',
        title: 'Push Heavy',
        startTime: new Date(now - 45 * 60 * 1000).toISOString(),
        endTime: new Date(now).toISOString(),
        volume: 6000,
        exercises: [
          {
            id: 'we-1',
            exerciseId: 'bench-press',
            name: 'Bench Press',
            order: 1,
            sets: [
              { id: 's1', setIndex: 1, setType: 'normal', targetReps: '8', weightKg: 80, reps: 8, completed: true },
              { id: 's2', setIndex: 2, setType: 'normal', targetReps: '8', weightKg: 80, reps: 8, completed: true },
              { id: 's3', setIndex: 3, setType: 'normal', targetReps: '8', weightKg: 80, reps: 8, completed: true },
            ],
          },
        ],
      };

      const stats = workoutStats(mockWorkout);
      expect(stats.calories).toBeGreaterThan(150);
      expect(stats.calories).toBeLessThan(600);
      expect(stats.volumeKg).toBe(1920);
      expect(stats.sets).toBe(3);
    });
  });
});
