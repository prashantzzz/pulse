import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { usePulse } from '../../store/useStore';
import type { WorkoutPlan } from '../../types';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

describe('Workout Plans Store & Builder Integration', () => {
  beforeEach(() => {
    usePulse.setState({
      plans: [],
      workouts: [],
      measurements: [],
      favorites: [],
      manualPRs: [],
    });
  });

  it('should append a custom workout plan to My Plans without replacing existing plans', () => {
    const initialPlan: WorkoutPlan = {
      id: 'plan-1',
      title: 'Full Body A',
      emoji: '🔥',
      muscles: ['Chest', 'Back'],
      exercises: [{ exerciseId: 'bench-press', sets: 3, targetReps: '6-8' }],
    };

    usePulse.getState().setPlans([initialPlan]);
    expect(usePulse.getState().plans).toHaveLength(1);

    const customPlan: WorkoutPlan = {
      id: 'plan-custom-123',
      title: 'Arm Specialization',
      emoji: '💪',
      muscles: ['Biceps', 'Triceps'],
      exercises: [
        { exerciseId: 'bicep-curl', sets: 3, targetReps: '8-12' },
        { exerciseId: 'triceps-pushdown', sets: 3, targetReps: '10-15' },
      ],
    };

    usePulse.getState().addPlan(customPlan);

    const updatedPlans = usePulse.getState().plans;
    expect(updatedPlans).toHaveLength(2);
    expect(updatedPlans[0].id).toBe('plan-1');
    expect(updatedPlans[1].id).toBe('plan-custom-123');
    expect(updatedPlans[1].title).toBe('Arm Specialization');
  });

  it('should update an existing plan in place', () => {
    const plan: WorkoutPlan = {
      id: 'plan-edit-1',
      title: 'Leg Day',
      emoji: '🦵',
      muscles: ['Quads', 'Hamstrings'],
      exercises: [{ exerciseId: 'squat', sets: 3, targetReps: '5-8' }],
    };

    usePulse.getState().setPlans([plan]);

    const modifiedPlan: WorkoutPlan = {
      ...plan,
      title: 'Heavy Leg Day',
      exercises: [
        { exerciseId: 'squat', sets: 4, targetReps: '4-6' },
        { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '6-8' },
      ],
    };

    usePulse.getState().updatePlan('plan-edit-1', modifiedPlan);

    const plans = usePulse.getState().plans;
    expect(plans).toHaveLength(1);
    expect(plans[0].title).toBe('Heavy Leg Day');
    expect(plans[0].exercises).toHaveLength(2);
  });

  it('should remove a plan without affecting other plans or workout history', () => {
    const p1: WorkoutPlan = {
      id: 'plan-a',
      title: 'Day A',
      emoji: '⚡',
      muscles: ['Chest'],
      exercises: [],
    };
    const p2: WorkoutPlan = {
      id: 'plan-b',
      title: 'Day B',
      emoji: '⚡',
      muscles: ['Back'],
      exercises: [],
    };

    usePulse.getState().setPlans([p1, p2]);
    expect(usePulse.getState().plans).toHaveLength(2);

    usePulse.getState().removePlan('plan-a');
    expect(usePulse.getState().plans).toHaveLength(1);
    expect(usePulse.getState().plans[0].id).toBe('plan-b');
  });

  it('blocks adding a plan whose title duplicates an existing plan (case-insensitive)', () => {
    const existing: WorkoutPlan = { id: 'plan-1', title: 'Push Day', emoji: '💪', muscles: [], exercises: [] };
    usePulse.getState().setPlans([existing]);

    const dup: WorkoutPlan = { id: 'plan-2', title: '  push day ', emoji: '💪', muscles: [], exercises: [] };
    const ok = usePulse.getState().addPlan(dup);

    expect(ok).toBe(false);
    expect(usePulse.getState().plans).toHaveLength(1);
    expect(usePulse.getState().plans[0].id).toBe('plan-1');
  });

  it('allows adding a plan with a unique title', () => {
    const existing: WorkoutPlan = { id: 'plan-1', title: 'Push Day', emoji: '💪', muscles: [], exercises: [] };
    usePulse.getState().setPlans([existing]);

    const unique: WorkoutPlan = { id: 'plan-2', title: 'Pull Day', emoji: '🏹', muscles: [], exercises: [] };
    expect(usePulse.getState().addPlan(unique)).toBe(true);
    expect(usePulse.getState().plans).toHaveLength(2);
  });

  it("blocks renaming a plan onto another plan's title", () => {
    const p1: WorkoutPlan = { id: 'plan-1', title: 'Push Day', emoji: '💪', muscles: [], exercises: [] };
    const p2: WorkoutPlan = { id: 'plan-2', title: 'Pull Day', emoji: '🏹', muscles: [], exercises: [] };
    usePulse.getState().setPlans([p1, p2]);

    const renamed: WorkoutPlan = { ...p2, title: 'push day' };
    expect(usePulse.getState().updatePlan('plan-2', renamed)).toBe(false);
    expect(usePulse.getState().plans.find((p) => p.id === 'plan-2')?.title).toBe('Pull Day');
  });

  it('allows editing a plan while keeping its own title', () => {
    const p1: WorkoutPlan = { id: 'plan-1', title: 'Push Day', emoji: '💪', muscles: [], exercises: [] };
    usePulse.getState().setPlans([p1]);

    const edited: WorkoutPlan = {
      ...p1,
      exercises: [{ exerciseId: 'bench-press', sets: 4, targetReps: '5' }],
    };
    expect(usePulse.getState().updatePlan('plan-1', edited)).toBe(true);
    expect(usePulse.getState().plans[0].exercises).toHaveLength(1);
  });
});
