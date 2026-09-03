import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { usePulse } from '../../store/useStore';
import { templateToPlans } from '../../data/templates';
import { recommendTemplate } from '../recommendations';
import { getSmartTodayPlan } from '../stats';
import type { BodyMeasurement, ManualPR, Workout, WorkoutPlan } from '../../types';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

describe('Active Routine Replacement & Smart Sequencing Regression', () => {
  beforeEach(() => {
    usePulse.setState({
      plans: [],
      workouts: [],
      measurements: [],
      favorites: [],
      manualPRs: [],
      activeWorkout: null,
    });
  });

  it('replacing the active routine does NOT mutate or delete completed workouts, PRs, or measurements', () => {
    // 1. Setup user with existing historical workouts, PRs, and measurements
    const historicalWorkout: Workout = {
      id: 'w-historical-1',
      title: 'Full Body A',
      description: 'First workout log',
      startTime: '2026-08-01T10:00:00Z',
      endTime: '2026-08-01T11:00:00Z',
      source: 'user',
      exercises: [
        {
          id: 'we-1',
          exerciseId: 'squat',
          order: 1,
          notes: null,
          plannedSets: 3,
          targetReps: '6-8',
          sets: [
            {
              id: 's-1',
              setIndex: 1,
              setType: 'working',
              weightKg: 100,
              reps: 8,
              distanceKm: null,
              durationSec: null,
              rpe: 8,
              notes: null,
              supersetId: null,
              completed: true,
              completedAt: '2026-08-01T10:15:00Z',
            },
          ],
        },
      ],
    };

    const measurement: BodyMeasurement = {
      id: 'm-1',
      date: '2026-08-01T08:00:00Z',
      weightKg: 75,
      bodyFatPct: 15,
      chestCm: 100,
      waistCm: 80,
      bicepsCm: 36,
    };

    const manualPR: ManualPR = {
      id: 'pr-1',
      exerciseId: 'bench-press',
      weightKg: 110,
      reps: 1,
      date: '2026-08-01T09:00:00Z',
    };

    const initialPlan: WorkoutPlan = {
      id: 'old-routine-day-1',
      title: 'Old Routine Day 1',
      emoji: '⚡',
      muscles: ['Chest'],
      exercises: [{ exerciseId: 'bench-press', sets: 3, targetReps: '8-12' }],
    };

    usePulse.setState({
      workouts: [historicalWorkout],
      measurements: [measurement],
      manualPRs: [manualPR],
      plans: [initialPlan],
    });

    expect(usePulse.getState().plans).toHaveLength(1);
    expect(usePulse.getState().workouts).toHaveLength(1);
    expect(usePulse.getState().measurements).toHaveLength(1);
    expect(usePulse.getState().manualPRs).toHaveLength(1);

    // 2. User selects and applies a new 4-day Upper/Lower template
    const rec = recommendTemplate({
      experienceLevel: 'Intermediate',
      daysPerWeek: 4,
      goals: ['Build Muscle', 'Get Stronger'],
    });

    const newRoutinePlans = templateToPlans(rec.modifiedTemplate);
    usePulse.getState().setPlans(newRoutinePlans);

    const state = usePulse.getState();

    // Routine is replaced with the 4 days of the new template
    expect(state.plans).toHaveLength(4);
    expect(state.plans.map((p) => p.title)).toEqual([
      'Upper A',
      'Lower A',
      'Upper B',
      'Lower B',
    ]);

    // STRICT HISTORY PRESERVATION
    expect(state.workouts).toHaveLength(1);
    expect(state.workouts[0].id).toBe('w-historical-1');
    expect(state.workouts[0].exercises[0].sets[0].weightKg).toBe(100);

    expect(state.measurements).toHaveLength(1);
    expect(state.measurements[0].weightKg).toBe(75);

    expect(state.manualPRs).toHaveLength(1);
    expect(state.manualPRs[0].weightKg).toBe(110);
  });

  it('getSmartTodayPlan accurately sequences through the newly activated routine days', () => {
    const rec = recommendTemplate({
      experienceLevel: 'Intermediate',
      daysPerWeek: 4,
      goals: ['Build Muscle'],
    });
    const routinePlans = templateToPlans(rec.modifiedTemplate);
    usePulse.getState().setPlans(routinePlans);

    const plans = usePulse.getState().plans;

    // Case 1: Fresh user with no logged workouts -> recommends Day 1 ('Upper A')
    const res1 = getSmartTodayPlan([], plans, null);
    expect(res1.state).toBe('READY_TO_START');
    expect(res1.plan?.title).toBe('Upper A');

    // Case 2: User completed 'Upper A' yesterday -> smart plan sequences to Day 2 ('Lower A')
    const completedYesterday: Workout = {
      id: 'w-yesterday',
      title: 'Upper A',
      description: '',
      startTime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      endTime: new Date(Date.now() - 23 * 3600 * 1000).toISOString(),
      exercises: [],
    };

    const res2 = getSmartTodayPlan([completedYesterday], plans, null);
    expect(res2.state).toBe('READY_TO_START');
    expect(res2.plan?.title).toBe('Lower A');
  });

  it('maintains custom workout builder compatibility alongside template routines', () => {
    const rec = recommendTemplate({
      experienceLevel: 'Beginner',
      daysPerWeek: 3,
      goals: ['Build Muscle'],
    });
    usePulse.getState().setPlans(templateToPlans(rec.modifiedTemplate));
    expect(usePulse.getState().plans).toHaveLength(3);

    // Builder adds a custom day
    const customDay: WorkoutPlan = {
      id: 'custom-day-core',
      title: 'Core & Conditioning',
      emoji: '🔥',
      muscles: ['Core'],
      exercises: [{ exerciseId: 'plank', sets: 3, targetReps: '60s' }],
    };

    usePulse.getState().addPlan(customDay);
    expect(usePulse.getState().plans).toHaveLength(4);
    expect(usePulse.getState().plans[3].title).toBe('Core & Conditioning');

    // Builder updates an existing day
    const updatedDay = {
      ...usePulse.getState().plans[0],
      title: 'Full Body A (Modified)',
    };
    usePulse.getState().updatePlan(usePulse.getState().plans[0].id, updatedDay);

    expect(usePulse.getState().plans[0].title).toBe('Full Body A (Modified)');
  });
});
