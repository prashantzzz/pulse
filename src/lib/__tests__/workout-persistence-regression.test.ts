import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { usePulse } from '../../store/useStore';
import { PROGRAM_TEMPLATES, templateToPlans } from '../../data/templates';
import type { WorkoutPlan } from '../../types';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

describe('Workout Exercise Reps and Weight Persistence Regression', () => {
  beforeEach(() => {
    usePulse.setState({
      plans: [],
      workouts: [],
      measurements: [],
      favorites: [],
      manualPRs: [],
      exerciseDefaults: {},
      activeWorkout: null,
      profile: {
        name: 'Alex',
        goal: ['Build Muscle'],
        experience: 'Intermediate',
        frequencyPerWeek: 4,
        equipment: ['Dumbbell', 'Barbell'],
        style: ['Upper / Lower'],
        trainingAgeMonths: 12,
        onboarded: true,
      },
    });
  });

  it('Case 1: User modifies weight/reps, saves, and discards workout -> changes are persisted to the user plan', () => {
    // 1. User has an active routine plan (e.g. Upper A)
    const initialPlan: WorkoutPlan = {
      id: 'plan-upper-a',
      title: 'Upper A',
      emoji: '⚡',
      muscles: ['Chest', 'Back'],
      exercises: [
        {
          exerciseId: 'incline-dumbbell-bench-press',
          sets: 3,
          targetReps: '8-10',
          targetWeightKg: null,
        },
      ],
    };

    usePulse.setState({ plans: [initialPlan] });

    // 2. User starts the workout
    const active = usePulse.getState().startWorkout(initialPlan.title, initialPlan.exercises, initialPlan.id);
    expect(active.planId).toBe('plan-upper-a');
    expect(active.exercises[0].sets[0].weightKg).toBe(12); // intermediate default for DB compound

    const targetEx = active.exercises[0];
    const set1 = targetEx.sets[0];

    // 3. User customizes Set 1 to 24 kg and 8 reps, and saves (saveOnly / patchSet)
    usePulse.getState().patchSet(targetEx.exerciseId, set1.id, {
      weightKg: 24,
      reps: 8,
      notes: 'Felt solid',
    });

    const activeAfterSave = usePulse.getState().activeWorkout!;
    expect(activeAfterSave.exercises[0].sets[0].weightKg).toBe(24);
    expect(activeAfterSave.exercises[0].sets[0].reps).toBe(8);

    // Subsequent uncompleted sets automatically adopt the new weight
    expect(activeAfterSave.exercises[0].sets[1].weightKg).toBe(24);
    expect(activeAfterSave.exercises[0].sets[2].weightKg).toBe(24);

    // 4. User opens menu and discards workout
    usePulse.getState().cancelActiveWorkout();

    // 5. Active workout is discarded
    expect(usePulse.getState().activeWorkout).toBeNull();
    // No completed workout was logged to history
    expect(usePulse.getState().workouts).toHaveLength(0);

    // 6. BUT user's workout plan in `plans` RETAINS the updated target weight and reps!
    const updatedPlan = usePulse.getState().plans.find((p) => p.id === 'plan-upper-a')!;
    expect(updatedPlan).toBeDefined();
    expect(updatedPlan.exercises[0].targetWeightKg).toBe(24);
    expect(updatedPlan.exercises[0].targetReps).toBe('8');

    // 7. When the user launches that workout again, it starts with 24 kg and 8 reps!
    const restarted = usePulse.getState().startWorkout(updatedPlan.title, updatedPlan.exercises, updatedPlan.id);
    expect(restarted.exercises[0].sets[0].weightKg).toBe(24);
    expect(restarted.exercises[0].sets[0].reps).toBe(8);
    expect(restarted.exercises[0].sets[1].weightKg).toBe(24);
    expect(restarted.exercises[0].sets[2].weightKg).toBe(24);
  });

  it('Case 2: Curated PROGRAM_TEMPLATES are strictly immutable and never modified by user edits', () => {
    // Curated template has targetReps '8-12' and no targetWeightKg
    const curatedTemplate = PROGRAM_TEMPLATES.find((t) => t.id === 'intermediate-4day')!;
    const originalIncline = curatedTemplate.days[0].exercises.find((e) => e.exerciseId === 'incline-dumbbell-bench-press')!;
    expect(originalIncline.targetReps).toBe('8-12');

    // Convert to user plans
    const userPlans = templateToPlans(curatedTemplate);
    usePulse.setState({ plans: userPlans });

    // User starts Day 1, modifies weight to 32 kg, reps to 6, and discards
    const day1Plan = userPlans[0];
    usePulse.getState().startWorkout(day1Plan.title, day1Plan.exercises, day1Plan.id);
    const active = usePulse.getState().activeWorkout!;
    const ex = active.exercises.find((e) => e.exerciseId === 'incline-dumbbell-bench-press')!;
    usePulse.getState().patchSet(ex.exerciseId, ex.sets[0].id, { weightKg: 32, reps: 6 });
    usePulse.getState().cancelActiveWorkout();

    // The user's plan was updated
    const userDay1 = usePulse.getState().plans[0];
    const userIncline = userDay1.exercises.find((e) => e.exerciseId === 'incline-dumbbell-bench-press')!;
    expect(userIncline.targetWeightKg).toBe(32);
    expect(userIncline.targetReps).toBe('6');

    // BUT the global PROGRAM_TEMPLATES remains 100% pristine!
    const checkTemplate = PROGRAM_TEMPLATES.find((t) => t.id === 'intermediate-4day')!;
    const checkIncline = checkTemplate.days[0].exercises.find((e) => e.exerciseId === 'incline-dumbbell-bench-press')!;
    expect(checkIncline.targetReps).toBe('8-12');
    expect((checkIncline as any).targetWeightKg).toBeUndefined();
  });

  it('Case 3: Save & finish preserves weights across both history and workout routine', () => {
    const plan: WorkoutPlan = {
      id: 'plan-bench',
      title: 'Chest Day',
      emoji: '💪',
      muscles: ['Chest'],
      exercises: [
        {
          exerciseId: 'bench-press',
          sets: 3,
          targetReps: '5',
          targetWeightKg: 50,
        },
      ],
    };
    usePulse.setState({ plans: [plan] });

    usePulse.getState().startWorkout(plan.title, plan.exercises, plan.id);
    const active = usePulse.getState().activeWorkout!;
    const set1 = active.exercises[0].sets[0];

    // User logs 55 kg and completes set
    usePulse.getState().patchSet('bench-press', set1.id, { weightKg: 55, reps: 5, completed: true });
    usePulse.getState().finishWorkout();

    // Finished workout history has 55 kg
    expect(usePulse.getState().workouts).toHaveLength(1);
    expect(usePulse.getState().workouts[0].exercises[0].sets[0].weightKg).toBe(55);

    // Plan routine also updated to 55 kg
    expect(usePulse.getState().plans[0].exercises[0].targetWeightKg).toBe(55);
  });

  it('Case 4: Global user exercise memory remembers weight for ad-hoc workouts started without a plan', () => {
    // Start an ad-hoc workout not tied to a plan
    const active = usePulse.getState().startWorkout('Ad-hoc Workout', [
      { exerciseId: 'bicep-curl', sets: 3, targetReps: '10' },
    ]);

    // User sets 16 kg on bicep curl
    usePulse.getState().patchSet('bicep-curl', active.exercises[0].sets[0].id, {
      weightKg: 16,
      reps: 12,
    });

    // Workout discarded
    usePulse.getState().cancelActiveWorkout();

    // Verify global exercise defaults remembered 16 kg
    expect(usePulse.getState().exerciseDefaults['bicep-curl']).toEqual({
      weightKg: 16,
      reps: 12,
    });

    // Another new workout with bicep curl starts with 16 kg and 12 reps
    const newWorkout = usePulse.getState().startWorkout('Arm Blast', [
      { exerciseId: 'bicep-curl', sets: 3, targetReps: '10' },
    ]);
    expect(newWorkout.exercises[0].sets[0].weightKg).toBe(16);
    expect(newWorkout.exercises[0].sets[0].reps).toBe(12);
  });

  it('Case 5: Builder plan with explicit targetWeightKg pre-fills active workout sets', () => {
    const customPlan: WorkoutPlan = {
      id: 'plan-custom-squat',
      title: 'Leg Day',
      emoji: '🦵',
      muscles: ['Quads'],
      exercises: [
        {
          exerciseId: 'squat',
          sets: 3,
          targetReps: '5',
          targetWeightKg: 80,
        },
      ],
    };

    usePulse.getState().addPlan(customPlan);

    const active = usePulse.getState().startWorkout(customPlan.title, customPlan.exercises, customPlan.id);
    expect(active.exercises[0].sets[0].weightKg).toBe(80);
    expect(active.exercises[0].sets[0].reps).toBe(5);
  });

  it('Case 6: Editing Bench Press in Day 1 Push updates Day 3 Full Body, survives discard, and defaults to user values everywhere', () => {
    // 1. User has two routine plans containing Bench Press
    const planPush: WorkoutPlan = {
      id: 'plan-push-1',
      title: 'Push Day',
      emoji: '💥',
      muscles: ['Chest', 'Shoulders', 'Triceps'],
      exercises: [
        { exerciseId: 'bench-press', sets: 3, targetReps: '8-12', targetWeightKg: null },
        { exerciseId: 'overhead-press', sets: 3, targetReps: '8-12', targetWeightKg: null },
      ],
    };

    const planFullBody: WorkoutPlan = {
      id: 'plan-fullbody-3',
      title: 'Full Body Day',
      emoji: '🏋️',
      muscles: ['Chest', 'Back', 'Quads'],
      exercises: [
        { exerciseId: 'squat', sets: 3, targetReps: '5', targetWeightKg: 80 },
        { exerciseId: 'bench-press', sets: 3, targetReps: '8-12', targetWeightKg: null },
      ],
    };

    usePulse.setState({ plans: [planPush, planFullBody] });

    // 2. User starts Push Day
    const active = usePulse.getState().startWorkout(planPush.title, planPush.exercises, planPush.id);
    const benchEx = active.exercises.find((e) => e.exerciseId === 'bench-press')!;
    const set1 = benchEx.sets[0];

    // 3. User edits Bench Press to 85 kg and 8 reps in the running workout
    usePulse.getState().patchSet('bench-press', set1.id, { weightKg: 85, reps: 8 });

    // Verify running workout sets updated immediately
    const currentActive = usePulse.getState().activeWorkout!;
    const activeBench = currentActive.exercises.find((e) => e.exerciseId === 'bench-press')!;
    expect(activeBench.sets[0].weightKg).toBe(85);
    expect(activeBench.sets[0].reps).toBe(8);
    // Auto-propagated to subsequent sets
    expect(activeBench.sets[1].weightKg).toBe(85);
    expect(activeBench.sets[2].weightKg).toBe(85);

    // 4. User DISCARDS the workout
    usePulse.getState().cancelActiveWorkout();
    expect(usePulse.getState().activeWorkout).toBeNull();
    expect(usePulse.getState().workouts).toHaveLength(0); // no fake workout in history

    // 5. Verify BOTH plans in plans[] have Bench Press updated to 85kg and 8 reps!
    const updatedPush = usePulse.getState().plans.find((p) => p.id === 'plan-push-1')!;
    const updatedFullBody = usePulse.getState().plans.find((p) => p.id === 'plan-fullbody-3')!;

    const pushBench = updatedPush.exercises.find((e) => e.exerciseId === 'bench-press')!;
    const fullBodyBench = updatedFullBody.exercises.find((e) => e.exerciseId === 'bench-press')!;

    expect(pushBench.targetWeightKg).toBe(85);
    expect(pushBench.targetReps).toBe('8');

    expect(fullBodyBench.targetWeightKg).toBe(85);
    expect(fullBodyBench.targetReps).toBe('8');

    // 6. Next time user opens Full Body Day -> Bench Press defaults to 85kg and 8 reps
    const fullBodySession = usePulse.getState().startWorkout(updatedFullBody.title, updatedFullBody.exercises, updatedFullBody.id);
    const sessionBench = fullBodySession.exercises.find((e) => e.exerciseId === 'bench-press')!;
    expect(sessionBench.sets[0].weightKg).toBe(85);
    expect(sessionBench.sets[0].reps).toBe(8);
    expect(sessionBench.sets[1].weightKg).toBe(85);
    expect(sessionBench.sets[2].weightKg).toBe(85);

    usePulse.getState().cancelActiveWorkout();

    // 7. Next time user opens Push Day -> Bench Press also defaults to 85kg and 8 reps
    const pushSession = usePulse.getState().startWorkout(updatedPush.title, updatedPush.exercises, updatedPush.id);
    const pushSessionBench = pushSession.exercises.find((e) => e.exerciseId === 'bench-press')!;
    expect(pushSessionBench.sets[0].weightKg).toBe(85);
    expect(pushSessionBench.sets[0].reps).toBe(8);

    usePulse.getState().cancelActiveWorkout();

    // 8. Starting an ad-hoc workout with Bench Press also defaults to 85kg and 8 reps
    const adHocSession = usePulse.getState().startWorkout('Quick Chest', [
      { exerciseId: 'bench-press', sets: 3, targetReps: '10' },
    ]);
    expect(adHocSession.exercises[0].sets[0].weightKg).toBe(85);
    expect(adHocSession.exercises[0].sets[0].reps).toBe(8);
  });

  it('Case 7: Activating a new template inherits the user customized exercise weights and reps', () => {
    // User already customized bench-press and bicep-curl
    usePulse.setState({
      exerciseDefaults: {
        'bench-press': { weightKg: 90, reps: 6 },
        'bicep-curl': { weightKg: 18, reps: 10 },
      },
    });

    const template = PROGRAM_TEMPLATES.find((t) => t.id === 'intermediate-4day')!;
    const newRoutine = templateToPlans(template, usePulse.getState().exerciseDefaults);

    // Bench press in day 1 inherits 90 kg and 6 reps
    const day1Bench = newRoutine[0].exercises.find((e) => e.exerciseId === 'bench-press');
    if (day1Bench) {
      expect(day1Bench.targetWeightKg).toBe(90);
      expect(day1Bench.targetReps).toBe('6');
    }

    // Global reference template remains completely untouched (immutable)
    const rawTemplateBench = template.days[0].exercises.find((e) => e.exerciseId === 'bench-press');
    if (rawTemplateBench) {
      expect(rawTemplateBench.targetReps).not.toBe('6');
    }
  });
});
