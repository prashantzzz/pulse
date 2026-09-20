/**
 * Resolves the first route shown after the splash screen.
 *
 * If a workout is still active (started but not finished or discarded), it is
 * resumed directly, so killing the app from recents mid-session and reopening
 * it returns the athlete to the running workout instead of Home.
 */
export function resolveLaunchRoute(params: {
  isAuthenticated: boolean;
  onboarded: boolean;
  activeWorkoutId?: string | null;
}): string {
  if (!params.isAuthenticated) return '/auth/login';
  if (!params.onboarded) return '/onboarding';
  return params.activeWorkoutId ? `/workout/${params.activeWorkoutId}` : '/(tabs)/home';
}
