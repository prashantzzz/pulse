import type { WorkoutPlan } from '../types';

/**
 * Applying a template replaces the user's whole active routine (`setPlans`).
 *
 * The Workouts screen must warn and ask for confirmation whenever the user
 * already has plan days, so a custom routine is never silently overwritten.
 * Fresh users (no plans yet) can apply a template directly. Completed workout
 * history, PRs and measurements are never touched by a replacement.
 */
export function shouldConfirmTemplateReplace(
  existingPlans: WorkoutPlan[] | null | undefined,
): boolean {
  return (existingPlans?.length ?? 0) > 0;
}
