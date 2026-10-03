import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

type Row = Record<string, any>;

/**
 * Stateful fake Supabase used to reproduce the "custom plan loses its
 * exercises" and "ghost plan" bugs end-to-end.
 */
const mockCloud = {
  workout_plans: [] as Row[],
  workout_plan_exercises: [] as Row[],
  /** when true, workout_plan_exercises upserts fail (e.g. FK violation) */
  failPlanExerciseUpsert: false,
  /** when true, workout_plans deletes fail (e.g. offline / transient error) */
  failPlanDelete: false,
  /** when true, fetching workouts plans fails (transient network / RLS error) */
  failPlansFetch: false,
  /** number of destructive statements received, used to guard against regressions */
  deleteCalls: { plans: 0, planExercises: 0 },
};

jest.mock('../supabase', () => {
  function matches(row: any, filters: { col: string; op: string; val: any }[]): boolean {
    return filters.every((f) => {
      const value = row[f.col];
      if (f.op === 'eq') return value === f.val;
      if (f.op === 'in') return Array.isArray(f.val) && f.val.includes(value);
      if (f.op === 'gte') return typeof value === 'number' ? value >= f.val : String(value) >= String(f.val);
      return true;
    });
  }

  function createBuilder(table: string) {
    let action: { type: 'select' | 'upsert' | 'delete'; payload?: any } = { type: 'select' };
    const filters: { col: string; op: string; val: any }[] = [];
    let single = false;

    const selectRows = (): Row[] => {
      let rows: Row[] = mockCloud[table as 'workout_plans' | 'workout_plan_exercises'] ?? [];
      if (table === 'workout_plans') {
        rows = rows.map((plan) => ({
          ...plan,
          workout_plan_exercises: mockCloud.workout_plan_exercises.filter((e) => e.plan_id === plan.id),
        }));
      }
      return rows.filter((row) => matches(row, filters));
    };

    const exec = (): { data: any; error: any } => {
      if (action.type === 'select') {
        if (table === 'workout_plans' && mockCloud.failPlansFetch) {
          return { data: null, error: { message: 'network request failed' } };
        }
        const rows = selectRows();
        return { data: single ? rows[0] ?? null : rows, error: null };
      }
      if (action.type === 'upsert') {
        const payload = Array.isArray(action.payload) ? action.payload : [action.payload];
        if (table === 'workout_plan_exercises') {
          if (mockCloud.failPlanExerciseUpsert) {
            return {
              data: null,
              error: { code: '23503', message: 'insert violates foreign key constraint "workout_plan_exercises_exercise_id_fkey"' },
            };
          }
          for (const row of payload) {
            const idx = mockCloud.workout_plan_exercises.findIndex(
              (r) => r.plan_id === row.plan_id && r.order_index === row.order_index,
            );
            if (idx >= 0) mockCloud.workout_plan_exercises[idx] = { ...mockCloud.workout_plan_exercises[idx], ...row };
            else mockCloud.workout_plan_exercises.push({ ...row });
          }
          return { data: null, error: null };
        }
        if (table === 'workout_plans') {
          for (const row of payload) {
            const idx = mockCloud.workout_plans.findIndex((r) => r.id === row.id);
            if (idx >= 0) mockCloud.workout_plans[idx] = { ...mockCloud.workout_plans[idx], ...row };
            else mockCloud.workout_plans.push({ ...row });
          }
          return { data: single ? payload[0] : payload, error: null };
        }
        return { data: null, error: null };
      }
      // delete
      if (table === 'workout_plans') {
        mockCloud.deleteCalls.plans += 1;
        if (mockCloud.failPlanDelete) return { data: null, error: { message: 'delete failed' } };
        const removedIds: string[] = [];
        mockCloud.workout_plans = mockCloud.workout_plans.filter((row) => {
          if (matches(row, filters)) {
            removedIds.push(row.id);
            return false;
          }
          return true;
        });
        mockCloud.workout_plan_exercises = mockCloud.workout_plan_exercises.filter(
          (e) => !removedIds.includes(e.plan_id),
        );
        return { data: null, error: null };
      }
      if (table === 'workout_plan_exercises') {
        mockCloud.deleteCalls.planExercises += 1;
        mockCloud.workout_plan_exercises = mockCloud.workout_plan_exercises.filter((row) => !matches(row, filters));
        return { data: null, error: null };
      }
      return { data: null, error: null };
    };

    const builder: any = {
      select: () => builder,
      upsert: (payload: any) => {
        action = { type: 'upsert', payload };
        return builder;
      },
      delete: () => {
        action = { type: 'delete' };
        return builder;
      },
      eq: (col: string, val: any) => {
        filters.push({ col, op: 'eq', val });
        return builder;
      },
      in: (col: string, val: any) => {
        filters.push({ col, op: 'in', val });
        return builder;
      },
      gte: (col: string, val: any) => {
        filters.push({ col, op: 'gte', val });
        return builder;
      },
      order: () => builder,
      limit: () => builder,
      single: () => {
        single = true;
        return Promise.resolve(exec());
      },
      maybeSingle: () => {
        const rows = selectRows();
        return Promise.resolve({ data: rows[0] ?? null, error: null });
      },
      then: (resolve: any, reject: any) => Promise.resolve(exec()).then(resolve, reject),
      catch: (fn: any) => Promise.resolve(exec()).catch(fn),
    };
    return builder;
  }

  return {
    isSupabaseConfigured: true,
    supabase: {
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1' } } }),
      },
      from: (table: string) => createBuilder(table),
    },
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';

import { usePulse } from '../../store/useStore';
import { PROGRAM_TEMPLATES, templateToPlans } from '../../data/templates';
import { shouldConfirmTemplateReplace } from '../plan-replacement';
import {
  deduplicatePlans,
  flushOfflineSyncQueue,
  pushAllPlansToCloud,
  pushPlanToCloud,
  removePlanFromCloud,
  syncUserDataFromCloud,
} from '../sync';
import type { BodyMeasurement, ManualPR, Workout, WorkoutPlan } from '../../types';

const TEST_USER_ID = 'u1';

function makePlan(id: string, title: string, exerciseIds: string[]): WorkoutPlan {
  return {
    id,
    title,
    emoji: '💪',
    muscles: ['Back'],
    exercises: exerciseIds.map((exerciseId) => ({
      exerciseId,
      sets: 3,
      targetReps: '8-12',
      targetWeightKg: null,
    })),
  };
}

function makeWorkout(id: string): Workout {
  return {
    id,
    title: 'Logged Session',
    description: '',
    startTime: '2026-09-01T10:00:00.000Z',
    endTime: '2026-09-01T11:00:00.000Z',
    source: 'user',
    exercises: [],
  };
}

function makeMeasurement(id: string): BodyMeasurement {
  return {
    id,
    date: '2026-09-01T08:00:00.000Z',
    weightKg: 75,
    bodyFatPct: 15,
    chestCm: null,
    waistCm: null,
    bicepsCm: null,
  };
}

function makePR(id: string): ManualPR {
  return { id, exerciseId: 'bench-press', weightKg: 110, reps: 1, date: '2026-09-01T09:00:00.000Z' };
}

async function readQueue(): Promise<any[]> {
  const raw = await AsyncStorage.getItem('@nextrep_offline_sync_queue');
  return raw ? JSON.parse(raw) : [];
}

/** Let fire-and-forget cloud repairs settle. */
function settle() {
  return new Promise((resolve) => setTimeout(resolve, 10));
}

describe('Custom plan cloud sync resilience', () => {
  beforeEach(async () => {
    mockCloud.workout_plans = [];
    mockCloud.workout_plan_exercises = [];
    mockCloud.failPlanExerciseUpsert = false;
    mockCloud.failPlanDelete = false;
    mockCloud.failPlansFetch = false;
    mockCloud.deleteCalls = { plans: 0, planExercises: 0 };
    usePulse.setState({
      plans: [],
      workouts: [],
      measurements: [],
      favorites: [],
      manualPRs: [],
      exerciseDefaults: {},
      profile: null,
    });
    await AsyncStorage.clear();
  });

  it('keeps the stored cloud exercises when the replacement insert fails (no wipe to 0)', async () => {
    // The plan already exists in the cloud with one stored exercise row.
    mockCloud.workout_plans = [
      { id: '11111111-1111-4111-8111-111111111111', user_id: TEST_USER_ID, name: 'Pull Day', emoji: '💪', muscles: ['Back'] },
    ];
    mockCloud.workout_plan_exercises = [
      {
        plan_id: '11111111-1111-4111-8111-111111111111',
        exercise_id: 'lat-pulldown',
        order_index: 0,
        target_sets: 3,
        target_reps: '8-12',
        target_weight: null,
      },
    ];

    // Second exercise is missing from the server catalog -> child insert fails.
    mockCloud.failPlanExerciseUpsert = true;
    const plan = makePlan('11111111-1111-4111-8111-111111111111', 'Pull Day', ['lat-pulldown', 'dumbbell-pullover']);
    usePulse.setState({ plans: [plan] });
    await pushPlanToCloud(TEST_USER_ID, plan);

    // Previously stored rows survive: the write no longer deletes first.
    expect(mockCloud.workout_plan_exercises.map((e) => e.exercise_id)).toEqual(['lat-pulldown']);
    // The failed push is queued for retry instead of being reported as saved.
    const queue = await readQueue();
    expect(queue.some((m) => m.type === 'push_all_plans')).toBe(true);
  });

  it('does not replace a local plan with an empty cloud copy, and repairs the cloud', async () => {
    // Cloud row lost its children in a previous broken push.
    mockCloud.workout_plans = [
      { id: '22222222-2222-4222-8222-222222222222', user_id: TEST_USER_ID, name: 'Push Day', emoji: '💪', muscles: ['Chest'] },
    ];
    usePulse.setState({
      plans: [makePlan('22222222-2222-4222-8222-222222222222', 'Push Day', ['bench-press', 'overhead-press'])],
    });

    await syncUserDataFromCloud(TEST_USER_ID);
    await settle();

    const localPlan = usePulse.getState().plans[0];
    expect(localPlan.exercises).toHaveLength(2);
    // The empty cloud copy was repaired from local state.
    expect(
      mockCloud.workout_plan_exercises.filter((e) => e.plan_id === '22222222-2222-4222-8222-222222222222'),
    ).toHaveLength(2);
  });

  it('pushes local-only plans back to the cloud instead of leaving them device-local', async () => {
    mockCloud.workout_plans = [
      { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', user_id: TEST_USER_ID, name: 'Day A', emoji: '💪', muscles: [] },
    ];
    usePulse.setState({
      plans: [
        makePlan('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Day A', ['squat']),
        makePlan('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Day B', ['bench-press']),
      ],
    });

    await syncUserDataFromCloud(TEST_USER_ID);
    await settle();

    expect(mockCloud.workout_plans.map((p) => p.id).sort()).toEqual(['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb']);
    expect(
      mockCloud.workout_plan_exercises.filter((e) => e.plan_id === 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
    ).toHaveLength(1);
  });

  it('retries a failed plan deletion instead of leaving a ghost plan in the cloud', async () => {
    mockCloud.workout_plans = [
      { id: '33333333-3333-4333-8333-333333333333', user_id: TEST_USER_ID, name: 'Leg Day', emoji: '🦵', muscles: [] },
    ];

    mockCloud.failPlanDelete = true;
    await removePlanFromCloud(TEST_USER_ID, '33333333-3333-4333-8333-333333333333', 'Leg Day');
    expect(mockCloud.workout_plans).toHaveLength(1);

    const queue = await readQueue();
    expect(queue.some((m) => m.type === 'delete_plan')).toBe(true);

    mockCloud.failPlanDelete = false;
    await flushOfflineSyncQueue();

    expect(mockCloud.workout_plans).toHaveLength(0);
    expect(await readQueue()).toHaveLength(0);
  });

  it('deletes legacy non-UUID plans from the cloud by title', async () => {
    mockCloud.workout_plans = [
      { id: 'cloud-uuid-legacy', user_id: TEST_USER_ID, name: 'Pull Day', emoji: '💪', muscles: [] },
      { id: 'cloud-uuid-other', user_id: TEST_USER_ID, name: 'Push Day', emoji: '💪', muscles: [] },
    ];

    await removePlanFromCloud(TEST_USER_ID, 'plan-legacy-1', 'Pull Day');

    expect(mockCloud.workout_plans.map((p) => p.name)).toEqual(['Push Day']);
  });

  it('never treats a failed plans fetch as "the account has no plans"', async () => {
    // A previous version replaced every cloud plan with the local snapshot
    // whenever the fetch returned an error:
    //   if (cloudPlans.length === 0 && localState.plans.length > 0) push all
    // That path is now guarded by the fetch error.
    mockCloud.workout_plans = [
      { id: '55555555-5555-4555-8555-555555555555', user_id: TEST_USER_ID, name: 'Cloud Only Day', emoji: '💪', muscles: [] },
    ];
    usePulse.setState({ plans: [makePlan('66666666-6666-4666-8666-666666666666', 'Local Day', ['plank'])] });

    mockCloud.failPlansFetch = true;
    await syncUserDataFromCloud(TEST_USER_ID);
    await settle();

    // Local plans are preserved and the cloud is left untouched.
    expect(usePulse.getState().plans.map((p) => p.title)).toEqual(['Local Day']);
    expect(mockCloud.workout_plans.map((p) => p.name)).toEqual(['Cloud Only Day']);
    expect(mockCloud.failPlanExerciseUpsert).toBe(false);

    mockCloud.failPlansFetch = false;
  });

  it('deduplicatePlans prefers the copy that still has exercises', () => {
    const empty = makePlan('same-id', 'Push Day', []);
    const rich = makePlan('same-id', 'Push Day', ['bench-press', 'overhead-press']);

    expect(deduplicatePlans([empty, rich])[0].exercises).toHaveLength(2);
    expect(deduplicatePlans([rich, empty])[0].exercises).toHaveLength(2);
    // Equal copies keep the first occurrence
    expect(deduplicatePlans([empty, makePlan('other-id', 'Empty Day', [])])).toHaveLength(2);
  });

  it('bulk replace pushes first and never deletes before writing (no delete-all window)', async () => {
    // Cloud already holds the same two plans: a no-op replace must not issue a
    // single destructive statement. The old implementation always deleted the
    // whole account first, which is what allowed plans to vanish.
    const plans = [
      makePlan('77777777-7777-4777-8777-777777777777', 'Day A', ['squat']),
      makePlan('88888888-8888-4888-8888-888888888888', 'Day B', ['bench-press']),
    ];
    await pushAllPlansToCloud(TEST_USER_ID, plans);
    expect(mockCloud.workout_plans).toHaveLength(2);
    expect(mockCloud.deleteCalls.plans).toBe(0);

    mockCloud.deleteCalls = { plans: 0, planExercises: 0 };
    await pushAllPlansToCloud(TEST_USER_ID, plans);
    expect(mockCloud.deleteCalls.plans).toBe(0); // nothing stale, nothing deleted
    expect(mockCloud.workout_plans).toHaveLength(2);
  });

  it('bulk replace only removes cloud plans that are no longer in the list', async () => {
    const kept = makePlan('99999999-9999-4999-8999-999999999999', 'Kept Day', ['squat']);
    const dropped = makePlan('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'Dropped Day', ['bench-press']);
    await pushAllPlansToCloud(TEST_USER_ID, [kept, dropped]);
    expect(mockCloud.workout_plans).toHaveLength(2);

    await pushAllPlansToCloud(TEST_USER_ID, [kept]);

    expect(mockCloud.workout_plans.map((p) => p.name)).toEqual(['Kept Day']);
    expect(
      mockCloud.workout_plan_exercises.filter((e) => e.plan_id === dropped.id),
    ).toHaveLength(0);
    expect(
      mockCloud.workout_plan_exercises.filter((e) => e.plan_id === kept.id),
    ).toHaveLength(1);
  });

  it('shrinking a plan removes only its trailing exercise rows', async () => {
    const plan = makePlan('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb', 'Shrink Day', [
      'squat',
      'bench-press',
      'deadlift',
    ]);
    await pushPlanToCloud(TEST_USER_ID, plan);
    expect(mockCloud.workout_plan_exercises).toHaveLength(3);

    const shorter = {
      ...plan,
      exercises: plan.exercises.slice(0, 2),
    };
    mockCloud.deleteCalls = { plans: 0, planExercises: 0 };
    await pushPlanToCloud(TEST_USER_ID, shorter);

    expect(mockCloud.workout_plan_exercises.map((e) => e.exercise_id)).toEqual([
      'squat',
      'bench-press',
    ]);
    // exactly one scoped trim delete, not a wipe
    expect(mockCloud.deleteCalls.planExercises).toBe(1);
  });
});

describe('Template activation replaces the routine safely', () => {
  beforeEach(async () => {
    mockCloud.workout_plans = [];
    mockCloud.workout_plan_exercises = [];
    mockCloud.failPlanExerciseUpsert = false;
    mockCloud.failPlanDelete = false;
    mockCloud.failPlansFetch = false;
    mockCloud.deleteCalls = { plans: 0, planExercises: 0 };
    usePulse.setState({
      plans: [],
      workouts: [],
      measurements: [],
      favorites: [],
      manualPRs: [],
      exerciseDefaults: {},
      profile: null,
    });
    await AsyncStorage.clear();
  });

  it('requires a replace confirmation exactly when the user already has plans', () => {
    expect(shouldConfirmTemplateReplace([])).toBe(false);
    expect(shouldConfirmTemplateReplace(null)).toBe(false);
    expect(shouldConfirmTemplateReplace(undefined)).toBe(false);
    expect(shouldConfirmTemplateReplace([makePlan('x', 'Push Day', ['bench-press'])])).toBe(true);
  });

  it('activating a template replaces the cloud routine and keeps earned history intact', async () => {
    // The user has a custom routine plus logged history, measurements and PRs.
    const customA = makePlan('cccccccc-3333-4333-8333-cccccccccccc', 'My Custom A', ['squat']);
    const customB = makePlan('dddddddd-4444-4444-8444-dddddddddddd', 'My Custom B', ['bench-press']);
    const history: Workout[] = [makeWorkout('w-1')];
    const measurements: BodyMeasurement[] = [makeMeasurement('m-1')];
    const prs: ManualPR[] = [makePR('pr-1')];
    usePulse.setState({ plans: [customA, customB], workouts: history, measurements, manualPRs: prs });
    await pushAllPlansToCloud(TEST_USER_ID, [customA, customB]);
    expect(mockCloud.workout_plans).toHaveLength(2);

    // The user confirms "Replace Plan" on the template sheet -> setPlans().
    const template = PROGRAM_TEMPLATES[0];
    const templatePlans = templateToPlans(template);
    usePulse.getState().setPlans(templatePlans);
    await settle();

    // Cloud routine now mirrors the template days only.
    expect(mockCloud.workout_plans.map((p) => p.name).sort()).toEqual(
      templatePlans.map((p) => p.title).sort(),
    );
    expect(
      mockCloud.workout_plan_exercises.filter((e) => e.plan_id === customA.id),
    ).toHaveLength(0);
    for (const plan of templatePlans) {
      expect(
        mockCloud.workout_plan_exercises.filter((e) => e.plan_id === plan.id),
      ).toHaveLength(plan.exercises.length);
    }

    // History, measurements and PRs are untouched by the replacement.
    const state = usePulse.getState();
    expect(state.workouts).toHaveLength(1);
    expect(state.measurements).toHaveLength(1);
    expect(state.manualPRs).toHaveLength(1);
  });

  it('a sync after template activation does not resurrect the replaced custom plans', async () => {
    const custom = makePlan('eeeeeeee-5555-4555-8555-eeeeeeeeeeee', 'Old Custom Day', ['squat']);
    await pushAllPlansToCloud(TEST_USER_ID, [custom]);

    const templatePlans = templateToPlans(PROGRAM_TEMPLATES[0]);
    usePulse.getState().setPlans(templatePlans);
    await settle();

    // Reopen the app: full pull from the cloud.
    await syncUserDataFromCloud(TEST_USER_ID);
    await settle();

    expect(usePulse.getState().plans.map((p) => p.title)).toEqual(
      templatePlans.map((p) => p.title),
    );
    expect(usePulse.getState().plans.some((p) => p.title === 'Old Custom Day')).toBe(false);
  });
});

describe('My Plans order is preserved in the cloud', () => {
  beforeEach(async () => {
    mockCloud.workout_plans = [];
    mockCloud.workout_plan_exercises = [];
    mockCloud.failPlanExerciseUpsert = false;
    mockCloud.failPlanDelete = false;
    mockCloud.failPlansFetch = false;
    mockCloud.deleteCalls = { plans: 0, planExercises: 0 };
    usePulse.setState({
      plans: [],
      workouts: [],
      measurements: [],
      favorites: [],
      manualPRs: [],
      exerciseDefaults: {},
      profile: null,
    });
    await AsyncStorage.clear();
  });

  it('stores each plan slot as sort_order when the routine is pushed', async () => {
    const a = makePlan('11111111-aaaa-4aaa-8aaa-111111111111', 'Day A', ['squat']);
    const b = makePlan('22222222-bbbb-4bbb-8bbb-222222222222', 'Day B', ['bench-press']);
    const c = makePlan('33333333-cccc-4ccc-8ccc-333333333333', 'Day C', ['deadlift']);

    await pushAllPlansToCloud(TEST_USER_ID, [c, a, b]);

    const sortById = new Map(mockCloud.workout_plans.map((p) => [p.id, p.sort_order]));
    expect(sortById.get(c.id)).toBe(0);
    expect(sortById.get(a.id)).toBe(1);
    expect(sortById.get(b.id)).toBe(2);
  });

  it('a drag reorder rewrites the cloud order', async () => {
    const a = makePlan('11111111-aaaa-4aaa-8aaa-111111111111', 'Day A', ['squat']);
    const b = makePlan('22222222-bbbb-4bbb-8bbb-222222222222', 'Day B', ['bench-press']);
    usePulse.getState().setPlans([a, b]);
    await settle();

    usePulse.getState().reorderPlans([b.id, a.id]);
    await settle();
    await settle();

    const sortById = new Map(mockCloud.workout_plans.map((p) => [p.id, p.sort_order]));
    expect(sortById.get(b.id)).toBe(0);
    expect(sortById.get(a.id)).toBe(1);
  });

  it('restores the dragged order when syncing from the cloud', async () => {
    // Cloud rows come back unsorted (mock keeps insert order); the client sorts
    // by sort_order so the user's routine order survives a reinstall.
    mockCloud.workout_plans = [
      { id: '11111111-aaaa-4aaa-8aaa-111111111111', user_id: TEST_USER_ID, name: 'Day C', emoji: '💪', muscles: [], sort_order: 2 },
      { id: '22222222-bbbb-4bbb-8bbb-222222222222', user_id: TEST_USER_ID, name: 'Day A', emoji: '💪', muscles: [], sort_order: 0 },
      { id: '33333333-cccc-4ccc-8ccc-333333333333', user_id: TEST_USER_ID, name: 'Day B', emoji: '💪', muscles: [], sort_order: 1 },
    ];

    await syncUserDataFromCloud(TEST_USER_ID);

    expect(usePulse.getState().plans.map((p) => p.title)).toEqual(['Day A', 'Day B', 'Day C']);
  });
});
