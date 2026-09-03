import { EXERCISE_MAP } from '../exercises';
import { PROGRAM_TEMPLATES, templateToPlans, validateCuratedTemplates } from '../templates';

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

  it('should pass comprehensive validateCuratedTemplates validation', () => {
    const result = validateCuratedTemplates(PROGRAM_TEMPLATES);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('should enforce that NO curated workout day contains more than 5 exercises (strictly 1–5)', () => {
    for (const template of PROGRAM_TEMPLATES) {
      for (const day of template.days) {
        expect(day.exercises.length).toBeGreaterThanOrEqual(1);
        expect(day.exercises.length).toBeLessThanOrEqual(5);
        // All 9 designed templates have exactly 5 exercises
        expect(day.exercises.length).toBe(5);
      }
    }
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

  it('should accurately convert a ProgramTemplate into WorkoutPlan format with fresh UUIDs and cloned arrays', () => {
    const beginner3 = PROGRAM_TEMPLATES.find((t) => t.id === 'beginner-3day')!;
    const plans1 = templateToPlans(beginner3);
    const plans2 = templateToPlans(beginner3);

    expect(plans1).toHaveLength(3);
    expect(plans1[0].title).toBe('Full Body A');
    expect(plans1[0].exercises).toHaveLength(5);
    expect(plans1[0].exercises[0].exerciseId).toBe('squat');
    expect(plans1[0].exercises[0].sets).toBe(3);
    expect(plans1[0].exercises[0].targetReps).toBe('6-8');

    // Generated IDs must be unique per instantiation
    expect(plans1[0].id).not.toBe(plans2[0].id);
  });
});
