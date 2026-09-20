import { resolveLaunchRoute } from '../launch';

describe('resolveLaunchRoute (splash → first screen)', () => {
  it('resumes an in-progress workout, otherwise routes by auth/onboarding state', () => {
    // Unauthenticated always lands on login, even with a stale active workout.
    expect(
      resolveLaunchRoute({ isAuthenticated: false, onboarded: true, activeWorkoutId: 'aw-1' }),
    ).toBe('/auth/login');

    // Not onboarded goes to onboarding.
    expect(
      resolveLaunchRoute({ isAuthenticated: true, onboarded: false, activeWorkoutId: 'aw-1' }),
    ).toBe('/onboarding');

    // No active workout → Home.
    expect(
      resolveLaunchRoute({ isAuthenticated: true, onboarded: true, activeWorkoutId: null }),
    ).toBe('/(tabs)/home');
    expect(resolveLaunchRoute({ isAuthenticated: true, onboarded: true })).toBe('/(tabs)/home');

    // Active workout (running or paused) → resume the workout screen directly.
    expect(
      resolveLaunchRoute({ isAuthenticated: true, onboarded: true, activeWorkoutId: 'aw-123' }),
    ).toBe('/workout/aw-123');
  });
});
