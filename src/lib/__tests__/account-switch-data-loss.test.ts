import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

type Row = Record<string, any>;

/**
 * Stateful fake Supabase for the production "plans disappear after account
 * switch" incident.
 *
 * `hasSortOrderColumn: false` reproduces the real outage: the released app
 * queried `workout_plans.sort_order`, but migration 20261001000001 had not been
 * applied, so every plans read/write failed with 42703/PGRST204.
 */
const mockCloud = {
  currentUserId: 'user-a' as string,
  hasSortOrderColumn: false,
  failAllPlanWrites: false,
  /** simulate a network failure on any workout_plans read */
  failPlanReads: false,
  /** auth state change listener captured by the real useAuth store */
  authEventCallback: null as null | ((event: string, session: any) => unknown),
  workout_plans: [] as Row[],
  workout_plan_exercises: [] as Row[],
  /** delete attempts issued against workout_plans */
  planDeleteCalls: 0,
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
    let action: { type: 'select' | 'upsert' | 'delete' | 'insert'; payload?: any } = { type: 'select' };
    let selectColumns = '';
    let single = false;
    const filters: { col: string; op: string; val: any }[] = [];

    const sortOrderError = () => ({
      code: 'PGRST204',
      message: "Could not find the 'sort_order' column of 'workout_plans' in the schema cache",
    });

    const selectRows = (): Row[] => {
      let rows: Row[] = (mockCloud[table as 'workout_plans' | 'workout_plan_exercises'] ?? []) as Row[];
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
        if (table === 'workout_plans' && mockCloud.failPlanReads) {
          return { data: null, error: { code: '500', message: 'network request failed' } };
        }
        if (
          table === 'workout_plans' &&
          selectColumns.includes('sort_order') &&
          !mockCloud.hasSortOrderColumn
        ) {
          return { data: null, error: sortOrderError() };
        }
        const rows = selectRows();
        return { data: single ? rows[0] ?? null : rows, error: null };
      }

      if (action.type === 'upsert') {
        const payload = Array.isArray(action.payload) ? action.payload : [action.payload];
        if (table === 'workout_plans') {
          const includesSortOrder = payload.some((row) => 'sort_order' in row);
          if (mockCloud.failAllPlanWrites || (includesSortOrder && !mockCloud.hasSortOrderColumn)) {
            return { data: null, error: sortOrderError() };
          }
          for (const row of payload) {
            const idx = mockCloud.workout_plans.findIndex((r) => r.id === row.id);
            if (idx >= 0) mockCloud.workout_plans[idx] = { ...mockCloud.workout_plans[idx], ...row };
            else mockCloud.workout_plans.push({ ...row });
          }
          return { data: single ? payload[0] : payload, error: null };
        }
        if (table === 'workout_plan_exercises') {
          for (const row of payload) {
            const idx = mockCloud.workout_plan_exercises.findIndex(
              (r) => r.plan_id === row.plan_id && r.order_index === row.order_index,
            );
            if (idx >= 0) mockCloud.workout_plan_exercises[idx] = { ...mockCloud.workout_plan_exercises[idx], ...row };
            else mockCloud.workout_plan_exercises.push({ ...row });
          }
          return { data: null, error: null };
        }
        return { data: null, error: null };
      }

      if (action.type === 'insert') {
        return { data: null, error: null };
      }

      // delete
      if (table === 'workout_plans') {
        mockCloud.planDeleteCalls += 1;
        const removedIds: string[] = [];
        mockCloud.workout_plans = mockCloud.workout_plans.filter((row) => {
          if (row.user_id === 'user-a' || row.user_id === 'user-b') {
            if (matches(row, filters)) {
              removedIds.push(row.id);
              return false;
            }
          }
          return true;
        });
        mockCloud.workout_plan_exercises = mockCloud.workout_plan_exercises.filter(
          (e) => !removedIds.includes(e.plan_id),
        );
        return { data: null, error: null };
      }
      if (table === 'workout_plan_exercises') {
        mockCloud.workout_plan_exercises = mockCloud.workout_plan_exercises.filter((row) => !matches(row, filters));
        return { data: null, error: null };
      }
      return { data: null, error: null };
    };

    const builder: any = {
      select: (columns?: string) => {
        selectColumns = columns ?? '';
        return builder;
      },
      upsert: (payload: any) => {
        action = { type: 'upsert', payload };
        return builder;
      },
      insert: (payload: any) => {
        action = { type: 'insert', payload };
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
        getUser: async () => ({ data: { user: { id: mockCloud.currentUserId } } }),
        getSession: async () => ({ data: { session: null } }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: (cb: (event: string, session: any) => unknown) => {
          mockCloud.authEventCallback = cb;
          return { data: { subscription: { unsubscribe: jest.fn() } } };
        },
      },
      from: (table: string) => createBuilder(table),
    },
  };
});

jest.mock('../../lib/notifications', () => ({
  syncWorkoutReminder: jest.fn(),
  dismissActiveWorkoutNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn(),
    signOut: jest.fn(),
    isSignedIn: jest.fn().mockResolvedValue(false),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
  isErrorWithCode: jest.fn(),
  isSuccessResponse: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

import { syncUserDataFromCloud, pushPlanToCloud, pushAllPlansToCloud, enqueueOfflineMutation, flushOfflineSyncQueue, backupPlansForUser, loadPlansBackup } from '../sync';
import { usePulse } from '../../store/useStore';
import { useAuth } from '../../store/useAuth';
import type { WorkoutPlan } from '../../types';

const USER_A = 'user-a';
const USER_B = 'user-b';
const PLAN_A_ID = '11111111-1111-4111-8111-111111111111';

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

function seedCloudPlan(userId: string, plan: WorkoutPlan) {
  mockCloud.workout_plans.push({ id: plan.id, user_id: userId, name: plan.title, emoji: plan.emoji, muscles: plan.muscles });
  plan.exercises.forEach((e, idx) => {
    mockCloud.workout_plan_exercises.push({
      plan_id: plan.id,
      exercise_id: e.exerciseId,
      order_index: idx,
      target_sets: e.sets,
      target_reps: e.targetReps,
      target_weight: e.targetWeightKg,
    });
  });
}

async function readQueue(): Promise<any[]> {
  const raw = await AsyncStorage.getItem('@nextrep_offline_sync_queue');
  return raw ? JSON.parse(raw) : [];
}

describe('Critical: plans must survive account switching and a delayed sort_order migration', () => {
  beforeEach(async () => {
    mockCloud.currentUserId = USER_A;
    mockCloud.hasSortOrderColumn = false;
    mockCloud.failAllPlanWrites = false;
    mockCloud.failPlanReads = false;
    mockCloud.authEventCallback = null;
    mockCloud.workout_plans = [];
    mockCloud.workout_plan_exercises = [];
    mockCloud.planDeleteCalls = 0;
    usePulse.setState({
      plans: [],
      workouts: [],
      measurements: [],
      favorites: [],
      manualPRs: [],
      exerciseDefaults: {},
      profile: null,
      onboarded: false,
    });
    await AsyncStorage.clear();
  });

  // ── Root cause: missing sort_order column ────────────────────────────────

  it('reads cloud plans even when the server is missing sort_order (legacy schema fallback)', async () => {
    seedCloudPlan(USER_A, makePlan(PLAN_A_ID, 'Push Day', ['bench-press']));

    const ok = await syncUserDataFromCloud(USER_A);

    expect(ok).toBe(true);
    expect(usePulse.getState().plans.map((p) => p.title)).toEqual(['Push Day']);
  });

  it('writes plan edits even when the server is missing sort_order', async () => {
    mockCloud.hasSortOrderColumn = false;

    await pushPlanToCloud(USER_A, makePlan(PLAN_A_ID, 'Push Day', ['bench-press', 'overhead-press']));

    expect(mockCloud.workout_plans.filter((p) => p.user_id === USER_A)).toHaveLength(1);
    expect(mockCloud.workout_plan_exercises.filter((e) => e.plan_id === PLAN_A_ID)).toHaveLength(2);
    expect(await readQueue()).toHaveLength(0);
  });

  it('A → B → A account switching keeps A plans visible (the reported incident)', async () => {
    // A had plans in the cloud from before the update.
    seedCloudPlan(USER_A, makePlan(PLAN_A_ID, 'Push Day', ['bench-press']));
    usePulse.setState({ plans: [makePlan(PLAN_A_ID, 'Push Day', ['bench-press'])], onboarded: true });

    // Sign out: local cache + queue are cleared (as the app does).
    usePulse.getState().clearSessionCache();
    await AsyncStorage.removeItem('@nextrep_offline_sync_queue');
    expect(usePulse.getState().plans).toHaveLength(0);

    // Sign in as B on the same device (B has no plans).
    mockCloud.currentUserId = USER_B;
    await syncUserDataFromCloud(USER_B);
    expect(usePulse.getState().plans).toHaveLength(0);

    // Sign back in as A: the plans MUST come back from the cloud.
    mockCloud.currentUserId = USER_A;
    await syncUserDataFromCloud(USER_A);

    expect(usePulse.getState().plans.map((p) => p.title)).toEqual(['Push Day']);
    expect(mockCloud.workout_plans.filter((p) => p.user_id === USER_A)).toHaveLength(1);
  });

  // ── Empty replacement guard ──────────────────────────────────────────────

  it('an empty plan replacement never deletes the account’s cloud plans', async () => {
    seedCloudPlan(USER_A, makePlan(PLAN_A_ID, 'Push Day', ['bench-press']));

    await pushAllPlansToCloud(USER_A, []);
    await enqueueOfflineMutation({ type: 'push_all_plans', userId: USER_A, plans: [], timestamp: Date.now() });

    expect(mockCloud.workout_plans.filter((p) => p.user_id === USER_A)).toHaveLength(1);
    expect(mockCloud.planDeleteCalls).toBe(0);
    expect(await readQueue()).toHaveLength(0);
  });

  it('a failed plan push queues a recovery snapshot that restores the plan (never wipes)', async () => {
    mockCloud.failAllPlanWrites = true;
    const plan = makePlan(PLAN_A_ID, 'Leg Day', ['squat']);

    await pushPlanToCloud(USER_A, plan);

    const queue = await readQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('push_all_plans');
    // Snapshot must never be empty, even if local state was cleared meanwhile.
    expect(queue[0].plans.length).toBeGreaterThanOrEqual(1);
    expect(mockCloud.workout_plans).toHaveLength(0);

    // Network recovers: the queued snapshot is replayed and the plan appears.
    mockCloud.failAllPlanWrites = false;
    await flushOfflineSyncQueue();

    expect(mockCloud.workout_plans.filter((p) => p.user_id === USER_A)).toHaveLength(1);
    expect(await readQueue()).toHaveLength(0);
  });

  // ── Per-user backup safety net ───────────────────────────────────────────

  it('restores the routine from the local backup when both cloud and local plans are empty', async () => {
    const plan = makePlan(PLAN_A_ID, 'Pull Day', ['lat-pulldown']);
    usePulse.setState({ plans: [plan] });
    await backupPlansForUser(USER_A, [plan]);

    // Worst case: local cache cleared AND the cloud copy gone.
    usePulse.getState().clearSessionCache();
    expect(usePulse.getState().plans).toHaveLength(0);

    await syncUserDataFromCloud(USER_A);
    // The backup restore pushes back to the cloud in the background.
    await new Promise((r) => setTimeout(r, 10));

    expect(usePulse.getState().plans.map((p) => p.title)).toEqual(['Pull Day']);
    expect(mockCloud.workout_plans.filter((p) => p.user_id === USER_A)).toHaveLength(1);
  });

  // ── Account isolation on silent account switch ───────────────────────────

  it('switching accounts without a sign-out never leaks the previous user’s plans into the new account', async () => {
    // A is signed in with plans.
    seedCloudPlan(USER_A, makePlan(PLAN_A_ID, 'Push Day', ['bench-press']));
    mockCloud.currentUserId = USER_A;
    await syncUserDataFromCloud(USER_A);
    expect(usePulse.getState().plans).toHaveLength(1);

    // Wire up the real auth listener and switch directly to B (no SIGNED_OUT).
    // The auth store must believe A is signed in for the switch to be detected.
    useAuth.getState().initialize();
    await new Promise((r) => setTimeout(r, 0));
    expect(mockCloud.authEventCallback).toBeTruthy();
    useAuth.setState({ user: { id: USER_A } as any, isAuthenticated: true });
    // Remove A's earlier backup so the assertion below proves the switch itself
    // preserved A's routine before the cache wipe.
    await AsyncStorage.removeItem(`@nextrep_plans_backup_${USER_A}`);

    mockCloud.currentUserId = USER_B;
    await mockCloud.authEventCallback!('SIGNED_IN', { user: { id: USER_B, email: 'b@example.com' } });
    await new Promise((r) => setTimeout(r, 10));

    // B must see only B's plans (none) — A's local plans must not leak across.
    expect(usePulse.getState().plans).toHaveLength(0);
    expect(mockCloud.workout_plans.filter((p) => p.user_id === USER_B)).toHaveLength(0);
    // A's cloud copy stays intact, and A's routine was backed up locally.
    expect(mockCloud.workout_plans.filter((p) => p.user_id === USER_A)).toHaveLength(1);
    expect((await loadPlansBackup(USER_A)).map((p) => p.title)).toEqual(['Push Day']);
  });

  it('signing out backs up the routine before the local cache is cleared', async () => {
    const plan = makePlan(PLAN_A_ID, 'Push Day', ['bench-press']);
    usePulse.setState({ plans: [plan] });
    useAuth.setState({ user: { id: USER_A } as any, isAuthenticated: true, session: {} as any });

    await useAuth.getState().signOut();
    await new Promise((r) => setTimeout(r, 10));

    expect(usePulse.getState().plans).toHaveLength(0);
    expect((await loadPlansBackup(USER_A)).map((p) => p.title)).toEqual(['Push Day']);
  });

  it('deleting the last plan clears the local backup so it cannot be resurrected', async () => {
    const plan = makePlan(PLAN_A_ID, 'Push Day', ['bench-press']);
    seedCloudPlan(USER_A, plan);
    usePulse.setState({ plans: [plan] });
    await backupPlansForUser(USER_A, [plan]);

    usePulse.getState().removePlan(PLAN_A_ID);
    await new Promise((r) => setTimeout(r, 10));

    expect(usePulse.getState().plans).toHaveLength(0);
    expect(await loadPlansBackup(USER_A)).toEqual([]);
    expect(mockCloud.workout_plans.filter((p) => p.user_id === USER_A)).toHaveLength(0);

    // A later sync must not bring the deleted routine back.
    await syncUserDataFromCloud(USER_A);
    expect(usePulse.getState().plans).toHaveLength(0);
  });

  it('a failed plans read is never treated as an empty cloud (no restore, no wipe)', async () => {
    const plan = makePlan(PLAN_A_ID, 'Push Day', ['bench-press']);
    seedCloudPlan(USER_A, plan);
    await backupPlansForUser(USER_A, [plan]);

    mockCloud.failPlanReads = true;
    const ok = await syncUserDataFromCloud(USER_A);

    expect(ok).toBe(true);
    // Nothing was restored from the backup (the read failure is not "empty cloud")...
    expect(usePulse.getState().plans).toHaveLength(0);
    // ...and the cloud plan is untouched.
    expect(mockCloud.workout_plans.filter((p) => p.user_id === USER_A)).toHaveLength(1);
    expect(mockCloud.planDeleteCalls).toBe(0);
  });

  it('reordering plans works when the server is missing sort_order (nothing lost, nothing queued)', async () => {
    mockCloud.hasSortOrderColumn = false;
    const push = makePlan(PLAN_A_ID, 'Push Day', ['bench-press']);
    const legs = makePlan('22222222-2222-4222-8222-222222222222', 'Leg Day', ['squat']);

    const ok = await pushAllPlansToCloud(USER_A, [legs, push]);

    expect(ok).toBe(true);
    const titles = mockCloud.workout_plans
      .filter((p) => p.user_id === USER_A)
      .map((p) => p.name)
      .sort();
    expect(titles).toEqual(['Leg Day', 'Push Day']);
    expect(mockCloud.workout_plan_exercises).toHaveLength(2);
    expect(await readQueue()).toHaveLength(0);
  });

  it('flushing a legacy empty push_all_plans queue item never deletes cloud plans', async () => {
    seedCloudPlan(USER_A, makePlan(PLAN_A_ID, 'Push Day', ['bench-press']));
    // An older app version could have queued an empty whole-account snapshot.
    await AsyncStorage.setItem(
      '@nextrep_offline_sync_queue',
      JSON.stringify([{ type: 'push_all_plans', userId: USER_A, plans: [], timestamp: Date.now() }]),
    );

    const done = await flushOfflineSyncQueue();

    expect(done).toBe(true);
    expect(mockCloud.workout_plans.filter((p) => p.user_id === USER_A)).toHaveLength(1);
    expect(mockCloud.planDeleteCalls).toBe(0);
    expect(await readQueue()).toHaveLength(0);
  });
});
