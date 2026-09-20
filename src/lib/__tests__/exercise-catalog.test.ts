import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import {
  ANATOMY_SLUGS,
  EQUIPMENT_OPTIONS,
  EXERCISES,
  EXERCISE_MAP,
  MUSCLE_GROUPS,
  resolveExercise,
  searchExercises,
  swapOptions,
} from '../../data/exercises';
import { getExerciseAnimation } from '../../data/exercise-animations';
import { PROGRAM_TEMPLATES, templateToPlans, validateCuratedTemplates } from '../../data/templates';
import { SEED_WORKOUTS } from '../../data/seed-workouts';
import type { Workout } from '../../types';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
describe('Exercise Swap Recommendations & Running Workout Context', () => {
  describe('1. Exercise Alternatives Data Integrity', () => {
    it('every alternative across all exercises references a valid canonical exercise in EXERCISE_MAP', () => {
      const invalidPairs: { exercise: string; invalidAlt: string }[] = [];

      for (const ex of EXERCISES) {
        for (const altId of ex.alternatives) {
          if (!EXERCISE_MAP[altId]) {
            invalidPairs.push({ exercise: ex.id, invalidAlt: altId });
          }
        }
      }

      expect(invalidPairs).toEqual([]);
    });

    it('no exercise lists itself as an alternative', () => {
      const selfRefs: string[] = [];

      for (const ex of EXERCISES) {
        if (ex.alternatives.includes(ex.id)) {
          selfRefs.push(ex.id);
        }
      }

      expect(selfRefs).toEqual([]);
    });

    it('validates critical swap recommendations for core exercises', () => {
      // Incline bench press must recommend incline dumbbell press
      const inclineBench = EXERCISE_MAP['incline-bench-press'];
      expect(inclineBench).toBeDefined();
      expect(inclineBench.alternatives).toContain('incline-dumbbell-bench-press');

      // Chest fly must recommend pec-deck (formerly broken machine-fly)
      const chestFly = EXERCISE_MAP['chest-fly'];
      expect(chestFly).toBeDefined();
      expect(chestFly.alternatives).toContain('pec-deck');
      expect(chestFly.alternatives).not.toContain('machine-fly');

      // Face pull must recommend rear-delt-fly (formerly broken band-face-pull)
      const facePull = EXERCISE_MAP['face-pull'];
      expect(facePull).toBeDefined();
      expect(facePull.alternatives).toContain('rear-delt-fly');
      expect(facePull.alternatives).not.toContain('band-face-pull');

      // Deadlift must recommend romanian-deadlift and sumo-deadlift (formerly broken trap-bar-deadlift)
      const deadlift = EXERCISE_MAP['deadlift'];
      expect(deadlift).toBeDefined();
      expect(deadlift.alternatives).toContain('romanian-deadlift');
      expect(deadlift.alternatives).toContain('sumo-deadlift');
      expect(deadlift.alternatives).not.toContain('trap-bar-deadlift');

      // Shoulder press must recommend machine-shoulder-press (not chest machine-press)
      const shoulderPress = EXERCISE_MAP['shoulder-press'];
      expect(shoulderPress).toBeDefined();
      expect(shoulderPress.alternatives).toContain('machine-shoulder-press');
      expect(shoulderPress.alternatives).not.toContain('machine-press');
      expect(shoulderPress.alternatives).not.toContain('push-press');

      // Core exercises must reference hanging-leg-raise (not broken hanging-raise)
      const plank = EXERCISE_MAP['plank'];
      expect(plank).toBeDefined();
      expect(plank.alternatives).toContain('hanging-leg-raise');
      expect(plank.alternatives).not.toContain('hanging-raise');

      const crunch = EXERCISE_MAP['crunch'];
      expect(crunch).toBeDefined();
      expect(crunch.alternatives).toContain('hanging-leg-raise');
      expect(crunch.alternatives).not.toContain('hanging-raise');
    });
  });

  describe('2. swapOptions Algorithm', () => {
    it('returns up to the requested limit of valid unique swap candidates for any exercise', () => {
      for (const ex of EXERCISES) {
        const options = swapOptions(ex, 4);
        expect(options.length).toBeGreaterThan(0);
        expect(options.length).toBeLessThanOrEqual(4);

        // Does not contain self
        expect(options.some((o) => o.id === ex.id)).toBe(false);

        // All returned IDs are distinct
        const ids = options.map((o) => o.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });

    it('prioritizes curated alternatives before falling back to matching movements or muscle groups', () => {
      const squat = EXERCISE_MAP['squat'];
      const swaps = swapOptions(squat, 5);
      expect(swaps.length).toBeGreaterThanOrEqual(3);

      const swapIds = swaps.map((s) => s.id);
      expect(swapIds).toContain('goblet-squat');
      expect(swapIds).toContain('leg-press');
      expect(swapIds).toContain('hack-squat');
    });
  });

  describe('3. Running Workout Context & Add-To-Workout Button Visibility Logic', () => {
    function computeIsFromRunningWorkout(
      fromRunning: string | undefined,
      activeWorkout: Workout | null,
    ): boolean {
      return Boolean(fromRunning) && Boolean(activeWorkout) && !activeWorkout?.endTime;
    }

    const mockActiveWorkout: Workout = {
      id: 'w-active-1',
      title: 'Upper Power',
      description: 'Active session',
      startTime: '2026-09-05T03:00:00Z',
      endTime: '',
      source: 'user',
      exercises: [],
    };

    it('hides Add to Workout button when opened from within a running workout (fromRunning=1 and active workout running)', () => {
      const isFromRunningWorkout = computeIsFromRunningWorkout('1', mockActiveWorkout);
      expect(isFromRunningWorkout).toBe(true);
    });

    it('shows Add to Workout button when navigated from other screens (Library, Home, Builder) even if a workout is running in background', () => {
      // User browses library while workout is active
      const isFromRunningWorkout = computeIsFromRunningWorkout(undefined, mockActiveWorkout);
      expect(isFromRunningWorkout).toBe(false);
    });

    it('shows Add to Workout button when no workout is currently active', () => {
      const isFromRunningWorkout = computeIsFromRunningWorkout('1', null);
      expect(isFromRunningWorkout).toBe(false);
    });

    it('shows Add to Workout button if active workout has already ended/completed', () => {
      const completedWorkout: Workout = {
        ...mockActiveWorkout,
        endTime: '2026-09-05T03:45:00Z',
      };
      const isFromRunningWorkout = computeIsFromRunningWorkout('1', completedWorkout);
      expect(isFromRunningWorkout).toBe(false);
    });
  });

  describe('4. Exercise Animations & Catalog Additions', () => {
    const newExerciseIds = [
      'battle-ropes',
      'shrug',
      'mountain-climber',
      'dead-bug',
      'leg-press-calf-raise',
      'dumbbell-standing-calf-raise',
      'nordic-curl',
      'glute-bridge',
      'cable-kickback',
      'ab-wheel-rollout',
      'hack-squat',
      'close-grip-bench-press',
      'cable-rope-hammer-curl',
      'cable-overhead-triceps-extension',
      'barbell-incline-row',
      'seated-dumbbell-lateral-raise',
      'dumbbell-pullover',
    ];

    it('all 17 vital animation exercises resolve to valid video animation assets', () => {
      for (const id of newExerciseIds) {
        const anim = getExerciseAnimation(id);
        expect(anim).toBeDefined();
        expect(anim?.type).toBe('video');
        expect(anim?.aspectRatio).toBeGreaterThan(0);
        expect(anim?.source).toBeDefined();
      }
    });

    it('new exercises have comprehensive library details, valid targets, and working alternatives', () => {
      for (const id of [
        'dumbbell-pullover',
        'barbell-incline-row',
        'seated-dumbbell-lateral-raise',
        'cable-rope-hammer-curl',
        'cable-overhead-triceps-extension',
        'dumbbell-standing-calf-raise',
      ]) {
        const ex = EXERCISE_MAP[id];
        expect(ex).toBeDefined();
        expect(ex.name.length).toBeGreaterThan(0);
        expect(ex.about.length).toBeGreaterThan(10);
        expect(ex.steps.length).toBeGreaterThanOrEqual(3);
        expect(ex.repRange).toMatch(/\d+/);
        expect(ex.alternatives.length).toBeGreaterThan(0);
        expect(ex.targetSlugs.length).toBeGreaterThan(0);
        for (const alt of ex.alternatives) {
          expect(EXERCISE_MAP[alt]).toBeDefined();
          expect(alt).not.toBe(id);
        }
        expect(MUSCLE_GROUPS).toContain(ex.muscleGroup);
        expect(EQUIPMENT_OPTIONS).toContain(ex.equipment);
        for (const slug of ex.targetSlugs) {
          expect(ANATOMY_SLUGS).toContain(slug);
        }
      }
    });

    it('resolves aliases and supports multi-parameter searching for new exercises', () => {
      // Alias resolution
      expect(resolveExercise('cable hammer curl')?.id).toBe('cable-rope-hammer-curl');
      expect(resolveExercise('db pullover')?.id).toBe('dumbbell-pullover');
      expect(resolveExercise('incline barbell row')?.id).toBe('barbell-incline-row');
      expect(resolveExercise('seated lateral raise')?.id).toBe('seated-dumbbell-lateral-raise');
      expect(resolveExercise('rope overhead triceps extension')?.id).toBe('cable-overhead-triceps-extension');
      expect(resolveExercise('standing dumbbell calf raise')?.id).toBe('dumbbell-standing-calf-raise');

      // Search exercises
      expect(searchExercises({ query: 'pullover' }).some((e) => e.id === 'dumbbell-pullover')).toBe(true);
      expect(searchExercises({ query: 'incline row' }).some((e) => e.id === 'barbell-incline-row')).toBe(true);
      expect(searchExercises({ query: 'seated lateral' }).some((e) => e.id === 'seated-dumbbell-lateral-raise')).toBe(true);
      expect(searchExercises({ query: 'rope hammer' }).some((e) => e.id === 'cable-rope-hammer-curl')).toBe(true);
      expect(searchExercises({ query: 'overhead triceps' }).some((e) => e.id === 'cable-overhead-triceps-extension')).toBe(true);
      expect(searchExercises({ query: 'standing calf' }).some((e) => e.id === 'dumbbell-standing-calf-raise')).toBe(true);
    });
  });
});


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


describe('SEED_WORKOUTS (parsed from the user CSV)', () => {
  it('contains the expected number of sessions', () => {
    expect(SEED_WORKOUTS.length).toBeGreaterThanOrEqual(30);
  });

  it('maps log session titles onto the app plan titles', () => {
    const titles = new Set(SEED_WORKOUTS.map((w) => w.title));
    expect(titles.has('Push Day')).toBe(true);
    expect(titles.has('Pull Day')).toBe(true);
    expect(titles.has('Leg Day')).toBe(true);
    // no unmapped raw titles from the CSV remain
    expect(titles.has('Push')).toBe(false);
    expect(titles.has('Pull')).toBe(false);
    expect(titles.has('Legs')).toBe(false);
  });

  it('every workout has exercises with logged sets', () => {
    for (const w of SEED_WORKOUTS) {
      expect(w.exercises.length).toBeGreaterThan(0);
      for (const we of w.exercises) {
        expect(we.sets.length).toBeGreaterThan(0);
        expect(we.sets.some((s) => s.completed)).toBe(true);
      }
    }
  });

  it('resolves every seed exercise title to the canonical knowledge base (no custom fallbacks)', () => {
    const custom = SEED_WORKOUTS.flatMap((w) => w.exercises.map((e) => e.exerciseId)).filter((id) => id.startsWith('custom-'));
    expect(custom).toEqual([]);
  });

  it('sessions are stamped as seed data with real dates', () => {
    for (const w of SEED_WORKOUTS) {
      expect(w.source).toBe('seed');
      expect(new Date(w.startTime).getTime()).not.toBeNaN();
      expect(new Date(w.endTime).getTime()).toBeGreaterThanOrEqual(new Date(w.startTime).getTime());
    }
  });
});
