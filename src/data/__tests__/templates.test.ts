import { EXERCISE_MAP } from '../exercises';
import { PROGRAM_TEMPLATES, templateToPlans } from '../templates';

describe('Workout Program Templates Library', () => {
  it('should include all 9 evidence-based program combinations', () => {
    expect(PROGRAM_TEMPLATES).toHaveLength(9);

    const ids = PROGRAM_TEMPLATES.map((t) => t.id);
    expect(ids).toEqual([
      'beginner-3day',
      'beginner-4day',
      'beginner-5day',
      'intermediate-3day',
      'intermediate-4day',
      'intermediate-5day',
      'advanced-3day',
      'advanced-4day',
      'advanced-5day',
    ]);
  });

  it('should mark the 3 recommended baseline programs correctly', () => {
    const recommended = PROGRAM_TEMPLATES.filter((t) => t.isRecommended);
    expect(recommended).toHaveLength(3);
    expect(recommended.map((t) => t.id)).toEqual(['beginner-3day', 'intermediate-4day', 'advanced-5day']);
  });

  it('should verify that all exercises in all 9 templates resolve in EXERCISE_MAP', () => {
    for (const template of PROGRAM_TEMPLATES) {
      expect(template.days.length).toBeGreaterThanOrEqual(3);
      for (const day of template.days) {
        expect(day.exercises.length).toBeGreaterThan(0);
        for (const spec of day.exercises) {
          const ex = EXERCISE_MAP[spec.exerciseId];
          expect(ex).toBeDefined();
          expect(ex.name).toBeTruthy();
          expect(spec.sets).toBeGreaterThan(0);
          expect(spec.targetReps).toMatch(/^\d+[-–]\d+$/);
        }
      }
    }
  });

  it('should accurately convert a ProgramTemplate into WorkoutPlan format', () => {
    const beginner3 = PROGRAM_TEMPLATES.find((t) => t.id === 'beginner-3day')!;
    const plans = templateToPlans(beginner3);

    expect(plans).toHaveLength(3);
    expect(plans[0].title).toBe('Full Body A');
    expect(plans[0].exercises).toHaveLength(7);
    expect(plans[0].exercises[0].exerciseId).toBe('bench-press');
    expect(plans[0].exercises[0].sets).toBe(3);
    expect(plans[0].exercises[0].targetReps).toBe('6-8');
  });
});
