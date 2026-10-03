/**
 * Cloud Data Synchronization Layer
 *
 * Synchronizes user data (Profiles, Body Measurements, Workouts, Sets, Plans)
 * bidirectionally between Supabase and the local Zustand `usePulse` store.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { usePulse } from '../store/useStore';
import { genUuid, isValidUuid } from './uuid';
import type { BodyMeasurement, ExerciseSet, SetType, UserProfile, Workout, WorkoutExercise, WorkoutPlan } from '../types';

interface RawSet {
  id: string;
  set_index: number;
  set_type: string | null;
  weight_kg: number | null;
  reps: number | null;
  distance_km: number | null;
  duration_seconds: number | null;
  rpe: number | null;
  notes?: string | null;
  completed?: boolean | null;
  completed_at?: string | null;
}

interface RawExercise {
  id: string;
  exercise_id: string;
  order_index: number;
  notes?: string | null;
  workout_sets?: RawSet[];
}

interface RawWorkout {
  id: string;
  title: string;
  description: string | null;
  started_at: string;
  completed_at: string | null;
  workout_exercises?: RawExercise[];
}

interface RawMeasurement {
  id: string;
  measured_at: string;
  weight_kg: number | null;
  body_fat_pct?: number | null;
  chest_cm?: number | null;
  waist_cm?: number | null;
  biceps_cm?: number | null;
}

/**
 * Maps Supabase nested workout rows to the app's `Workout` model.
 */
function mapCloudWorkout(raw: RawWorkout): Workout {
  const exercises: WorkoutExercise[] = (raw.workout_exercises || [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((we) => {
      const sets: ExerciseSet[] = (we.workout_sets || [])
        .sort((a, b) => a.set_index - b.set_index)
        .map((st) => ({
          id: st.id,
          setIndex: st.set_index,
          setType: (st.set_type as SetType) || 'working',
          weightKg: st.weight_kg !== null && st.weight_kg !== undefined ? Number(st.weight_kg) : null,
          reps: st.reps !== null && st.reps !== undefined ? Number(st.reps) : null,
          distanceKm: st.distance_km !== null && st.distance_km !== undefined ? Number(st.distance_km) : null,
          durationSec: st.duration_seconds !== null && st.duration_seconds !== undefined ? Number(st.duration_seconds) : null,
          rpe: st.rpe !== null && st.rpe !== undefined ? Number(st.rpe) : null,
          notes: st.notes || null,
          supersetId: null,
          completed: st.completed ?? true,
          completedAt: st.completed_at || null,
        }));

      return {
        id: we.id,
        exerciseId: we.exercise_id,
        order: we.order_index + 1,
        notes: we.notes || null,
        plannedSets: sets.length || 3,
        targetReps: '8-12',
        sets,
      };
    });

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description || '',
    startTime: raw.started_at,
    endTime: raw.completed_at || raw.started_at,
    exercises,
    source: 'user',
  };
}

/**
 * Maps Supabase body measurement row to `BodyMeasurement`.
 */
function mapCloudMeasurement(raw: RawMeasurement): BodyMeasurement {
  return {
    id: raw.id,
    date: raw.measured_at,
    weightKg: raw.weight_kg !== null && raw.weight_kg !== undefined ? Number(raw.weight_kg) : 0,
    bodyFatPct: raw.body_fat_pct !== null && raw.body_fat_pct !== undefined ? Number(raw.body_fat_pct) : null,
    chestCm: raw.chest_cm !== null && raw.chest_cm !== undefined ? Number(raw.chest_cm) : null,
    waistCm: raw.waist_cm !== null && raw.waist_cm !== undefined ? Number(raw.waist_cm) : null,
    bicepsCm: raw.biceps_cm !== null && raw.biceps_cm !== undefined ? Number(raw.biceps_cm) : null,
  };
}

/**
 * Deduplicates workout plans by ID and by case-insensitive title.
 * Preserves the original order and skips duplicate days (e.g. Upper A added twice).
 *
 * When two copies collide, the one that still has exercises wins. This matters
 * during cloud sync: a Supabase copy whose child exercise rows failed to write
 * (FK violation / interrupted write) must never clobber the local plan that
 * still has its exercises. Equal copies keep the first occurrence.
 */
export function deduplicatePlans(plans: WorkoutPlan[]): WorkoutPlan[] {
  if (!plans || plans.length === 0) return [];
  const result: WorkoutPlan[] = [];
  const indexById = new Map<string, number>();
  const indexByTitle = new Map<string, number>();
  const exerciseCount = (p: WorkoutPlan | undefined): number =>
    p && Array.isArray(p.exercises) ? p.exercises.length : 0;

  for (const p of plans) {
    if (!p) continue;
    const normalizedTitle = (p.title || '').trim().toLowerCase();
    const existingIdx =
      (p.id ? indexById.get(p.id) : undefined) ??
      (normalizedTitle ? indexByTitle.get(normalizedTitle) : undefined);

    if (existingIdx !== undefined) {
      if (exerciseCount(p) > exerciseCount(result[existingIdx])) {
        const previous = result[existingIdx];
        const previousTitle = (previous?.title || '').trim().toLowerCase();
        result[existingIdx] = p;
        if (
          previousTitle &&
          previousTitle !== normalizedTitle &&
          indexByTitle.get(previousTitle) === existingIdx
        ) {
          indexByTitle.delete(previousTitle);
        }
        if (p.id) indexById.set(p.id, existingIdx);
        if (normalizedTitle) indexByTitle.set(normalizedTitle, existingIdx);
      }
      continue;
    }

    if (p.id) indexById.set(p.id, result.length);
    if (normalizedTitle) indexByTitle.set(normalizedTitle, result.length);
    result.push(p);
  }
  return result;
}

/**
 * Returns true when `title` collides (case-insensitively, trimmed) with an
 * existing plan title, ignoring the plan identified by `excludeId` (used when
 * renaming a plan so it does not conflict with itself).
 */
export function hasDuplicatePlanTitle(
  plans: WorkoutPlan[],
  title: string,
  excludeId?: string,
): boolean {
  const normalized = (title || '').trim().toLowerCase();
  if (!normalized) return false;
  return (plans || []).some(
    (p) => p.id !== excludeId && (p.title || '').trim().toLowerCase() === normalized,
  );
}

/**
 * Full sync: Pulls user's workouts, measurements, plans, and profile from Supabase into Zustand store.
 */
export async function syncUserDataFromCloud(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;

  try {
    // 1. Fetch Profile
    const { data: profileRow } = await (supabase.from('profiles') as any)
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // 2. Fetch Measurements
    const { data: measurementsData } = await (supabase.from('body_measurements') as any)
      .select('*')
      .eq('user_id', userId)
      .order('measured_at', { ascending: true });

    // 3. Fetch Favorites
    const { data: favoritesData } = await (supabase.from('user_favorite_exercises') as any)
      .select('exercise_id')
      .eq('user_id', userId);

    // 4. Fetch Manual PRs
    const { data: prsData } = await (supabase.from('manual_prs') as any)
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // 5. Fetch Workouts with nested Exercises and Sets (bounded to 1 year window for startup efficiency)
    const oneYearAgoIso = new Date(Date.now() - 365 * 86400000).toISOString();

    let workoutsQuery = (supabase.from('workouts') as any)
      .select(`
        id,
        title,
        description,
        started_at,
        completed_at,
        workout_exercises (
          id,
          exercise_id,
          order_index,
          notes,
          workout_sets (
            id,
            set_index,
            set_type,
            weight_kg,
            reps,
            distance_km,
            duration_seconds,
            rpe,
            notes,
            completed,
            completed_at
          )
        )
      `)
      .eq('user_id', userId);

    if (typeof workoutsQuery.gte === 'function') {
      workoutsQuery = workoutsQuery.gte('started_at', oneYearAgoIso);
    }
    if (typeof workoutsQuery.order === 'function') {
      workoutsQuery = workoutsQuery.order('started_at', { ascending: false });
    }

    const { data: workoutsData } = await workoutsQuery;

    // 6. Fetch User Workout Plans
    const { data: plansData, error: plansErr } = await (supabase.from('workout_plans') as any)
      .select(`
        id,
        name,
        emoji,
        muscles,
        sort_order,
        created_at,
        workout_plan_exercises (
          id,
          exercise_id,
          order_index,
          target_sets,
          target_reps,
          target_weight
        )
      `)
      .eq('user_id', userId);

    if (plansErr) {
      console.warn('Error fetching workout plans from cloud:', plansErr);
    }

    // 7. Transform data
    const cloudWorkouts: Workout[] = (workoutsData || []).map((w: unknown) => mapCloudWorkout(w as RawWorkout));
    const cloudMeasurements: BodyMeasurement[] = (measurementsData || []).map((m: unknown) =>
      mapCloudMeasurement(m as RawMeasurement),
    );
    const cloudFavorites: string[] = (favoritesData || []).map((f: any) => f.exercise_id);
    const cloudPRs: any[] = (prsData || []).map((p: any) => ({
      id: p.id,
      exerciseId: p.exercise_id,
      weightKg: Number(p.weight_kg),
      reps: Number(p.reps),
      date: p.date,
    }));

    const cloudPlans: WorkoutPlan[] = (plansData || [])
      .slice()
      // The user drags plans into their own order; sort_order preserves it
      // across devices. Ties (pre-migration rows) fall back to creation time.
      .sort((a: any, b: any) => {
        const orderA = a.sort_order ?? 0;
        const orderB = b.sort_order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''));
      })
      .map((p: any) => ({
        id: p.id,
        title: p.name,
        emoji: p.emoji || '💪',
        muscles: p.muscles || [],
        exercises: (p.workout_plan_exercises || [])
          .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map((e: any) => ({
            exerciseId: e.exercise_id,
            sets: e.target_sets || 3,
            targetReps: e.target_reps || '8-12',
            targetWeightKg: e.target_weight != null ? Number(e.target_weight) : null,
          })),
      }));

    // If cloud has 0 measurements but local state has initial measurements, push them to cloud
    const localState = usePulse.getState();
    if (cloudMeasurements.length === 0 && localState.measurements.length > 0) {
      for (const m of localState.measurements) {
        directPushMeasurementToCloud(userId, m).catch(() => {});
      }
    }
    if (cloudFavorites.length === 0 && localState.favorites.length > 0) {
      for (const fav of localState.favorites) {
        directPushFavoriteToCloud(userId, fav).catch(() => {});
      }
    }
    if (cloudPRs.length === 0 && localState.manualPRs.length > 0) {
      for (const pr of localState.manualPRs) {
        directPushManualPRToCloud(userId, pr).catch(() => {});
      }
    }
    // If cloud has 0 plans but local state has initial plans, push them to
    // cloud. Never do this when the plans fetch itself failed: a failed fetch
    // also yields an empty list, and treating that as "cloud is empty" used to
    // replace every cloud plan with the (possibly stale) local snapshot.
    if (!plansErr && cloudPlans.length === 0 && localState.plans.length > 0) {
      const cleanLocal = deduplicatePlans(localState.plans);
      pushAllPlansToCloud(userId, cleanLocal).catch(() => {});
    }

    const effectiveMeasurements = cloudMeasurements.length > 0 ? cloudMeasurements : localState.measurements;
    const effectiveFavorites = cloudFavorites.length > 0 ? cloudFavorites : localState.favorites;
    const effectivePRs = cloudPRs.length > 0 ? cloudPRs : localState.manualPRs;

    const latestWeight = effectiveMeasurements.length > 0
      ? effectiveMeasurements[effectiveMeasurements.length - 1].weightKg
      : (profileRow?.weight_kg != null ? Number(profileRow.weight_kg) : localState.profile?.weightKg);
    const latestHeight = profileRow?.height_cm != null
      ? Number(profileRow.height_cm)
      : localState.profile?.heightCm;
    const latestWeightUnit = (profileRow?.weight_unit as 'kg' | 'lbs') ?? localState.profile?.weightUnit ?? localState.weightUnit;

    const userProfile: UserProfile | null = profileRow
      ? {
          name: profileRow.display_name ?? localState.profile?.name ?? 'Athlete',
          gender: (profileRow.gender as 'male' | 'female') ?? localState.profile?.gender ?? 'male',
          goal: profileRow.goal ?? localState.profile?.goal ?? ['Build Muscle'],
          experience: (profileRow.experience_level as 'Beginner' | 'Intermediate' | 'Advanced') ?? localState.profile?.experience ?? 'Intermediate',
          frequencyPerWeek: profileRow.training_frequency ?? localState.profile?.frequencyPerWeek ?? 4,
          equipment: profileRow.equipment ?? localState.profile?.equipment ?? [],
          style: profileRow.preferred_training_style ?? localState.profile?.style ?? [],
          trainingAgeMonths: profileRow.training_age_months ?? localState.profile?.trainingAgeMonths ?? 0,
          onboarded: profileRow.onboarded ?? localState.profile?.onboarded ?? true,
          avatarUrl: profileRow.avatar_url ? `${profileRow.avatar_url}?t=${Date.now()}` : localState.profile?.avatarUrl,
          heightCm: latestHeight,
          weightKg: latestWeight,
          weightUnit: latestWeightUnit,
        }
      : localState.profile;

    // 8. Update local store state
    usePulse.setState((state) => {
      // Merge workouts by ID: preserve local workouts older than 1 year while updating from cloud window
      const workoutMap = new Map<string, Workout>();
      for (const w of state.workouts) {
        if (w.id) workoutMap.set(w.id, w);
      }
      for (const cw of cloudWorkouts) {
        if (cw.id) workoutMap.set(cw.id, cw);
      }
      const consolidatedWorkouts = Array.from(workoutMap.values()).sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );

      // Consolidate plans without duplication.
      // Cloud plans are merged first, but see deduplicatePlans(): a cloud copy
      // that lost its exercise rows never replaces a richer local plan.
      const plansFetchFailed = Boolean(plansErr);
      const rawPlans = !plansFetchFailed && cloudPlans.length > 0
        ? [...cloudPlans, ...state.plans]
        : state.plans;
      const consolidatedPlans = deduplicatePlans(rawPlans);

      // Repair the cloud when it is missing something local state still has:
      //  - cloud duplicates were collapsed by the merge, or
      //  - a plan only exists locally (offline custom builder routine), or
      //  - the chosen plan has exercises while its cloud copy is empty
      //    (child insert previously failed silently).
      // Never push when the fetch failed, and never replace the account with
      // an empty list.
      let needsCloudRepair = false;
      if (!plansFetchFailed && cloudPlans.length > 0 && consolidatedPlans.length > 0) {
        if (consolidatedPlans.length < cloudPlans.length) {
          needsCloudRepair = true;
        } else {
          const cloudById = new Map(cloudPlans.map((p) => [p.id, p] as const));
          const cloudByTitle = new Map(
            cloudPlans.map((p) => [(p.title || '').trim().toLowerCase(), p] as const),
          );
          for (const p of consolidatedPlans) {
            const cloudCopy =
              cloudById.get(p.id) ?? cloudByTitle.get((p.title || '').trim().toLowerCase());
            if (!cloudCopy) {
              needsCloudRepair = true;
              break;
            }
            if ((cloudCopy.exercises?.length ?? 0) === 0 && (p.exercises?.length ?? 0) > 0) {
              needsCloudRepair = true;
              break;
            }
          }
        }
      }
      if (needsCloudRepair) {
        pushAllPlansToCloud(userId, consolidatedPlans).catch(() => {});
      }

      // Merge exercise defaults from cloud plans so client state inherits cloud numbers
      const mergedDefaults = { ...state.exerciseDefaults };
      for (const p of consolidatedPlans) {
        for (const e of p.exercises) {
          if (e.targetWeightKg != null && !mergedDefaults[e.exerciseId]) {
            const numericReps = parseInt(e.targetReps, 10);
            mergedDefaults[e.exerciseId] = {
              weightKg: e.targetWeightKg,
              reps: !isNaN(numericReps) ? numericReps : 10,
            };
          }
        }
      }

      return {
        workouts: consolidatedWorkouts.length > 0 ? consolidatedWorkouts : state.workouts,
        measurements: effectiveMeasurements,
        plans: consolidatedPlans.length > 0 ? consolidatedPlans : state.plans,
        exerciseDefaults: mergedDefaults,
        favorites: effectiveFavorites,
        manualPRs: effectivePRs,
        profile: userProfile,
        onboarded: userProfile ? (userProfile.onboarded ?? state.onboarded) : state.onboarded,
        ...(latestWeightUnit ? { weightUnit: latestWeightUnit } : {}),
      };
    });

    return true;
  } catch (err) {
    console.warn('Exception syncing user data from cloud:', err);
    return false;
  }
}

/**
 * Offline Sync Queue & Cloud Sync System
 */

const OFFLINE_QUEUE_KEY = '@nextrep_offline_sync_queue';

export type OfflineMutation =
  | { type: 'upsert_workout'; userId: string; workout: Workout; timestamp: number }
  | { type: 'delete_workout'; userId: string; workoutId: string; timestamp: number }
  | { type: 'wipe_user_workouts'; userId: string; timestamp: number }
  | { type: 'wipe_all_user_data'; userId: string; timestamp: number }
  | { type: 'upsert_measurement'; userId: string; measurement: BodyMeasurement; timestamp: number }
  | { type: 'upsert_profile'; userId: string; profile: Partial<UserProfile>; timestamp: number }
  | { type: 'push_all_plans'; userId: string; plans: WorkoutPlan[]; timestamp: number }
  | { type: 'delete_plan'; userId: string; planId: string; planTitle?: string; timestamp: number };

async function getOfflineQueue(): Promise<OfflineMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveOfflineQueue(queue: OfflineMutation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Failed to persist offline sync queue:', e);
  }
}

// Serialize read-modify-write cycles on the persisted queue so concurrent
// enqueues (e.g. a plan push failing while a workout push also fails) cannot
// drop each other's mutations.
let queueWriteChain: Promise<void> = Promise.resolve();

export async function enqueueOfflineMutation(mutation: OfflineMutation): Promise<void> {
  const write = queueWriteChain.then(async () => {
    const queue = await getOfflineQueue();
    let nextQueue: OfflineMutation[];
    if (mutation.type === 'push_all_plans') {
      // Whole-state snapshot: keep only the newest one per user so a stale
      // list can never replay over newer data, and retries cannot grow the
      // queue without bound.
      nextQueue = queue.filter(
        (item) => !(item.type === 'push_all_plans' && item.userId === mutation.userId),
      );
    } else if (mutation.type === 'delete_plan') {
      nextQueue = queue.filter(
        (item) =>
          !(
            item.type === 'delete_plan' &&
            item.userId === mutation.userId &&
            item.planId === mutation.planId
          ),
      );
    } else {
      nextQueue = queue;
    }
    nextQueue.push(mutation);
    await saveOfflineQueue(nextQueue);
  });
  queueWriteChain = write.catch(() => {});
  await write.catch(() => {});
  // Attempt to immediately process if online
  await flushOfflineSyncQueue().catch(() => {});
}

let isFlushing = false;

export async function flushOfflineSyncQueue(): Promise<boolean> {
  if (isFlushing || !isSupabaseConfigured) return false;
  isFlushing = true;

  try {
    // ── SECURITY: Validate current authenticated user ──────────────────────
    // Every queued mutation MUST belong to the currently signed-in user.
    // This prevents cross-user mutation replay: mutations queued by User A
    // must NOT be executed under User B's session.
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser?.id) {
      // No authenticated user — do not process any queued mutations.
      isFlushing = false;
      return false;
    }
    const currentUserId = currentUser.id;
    // ──────────────────────────────────────────────────────────────────────

    const queue = await getOfflineQueue();
    if (queue.length === 0) {
      isFlushing = false;
      return true;
    }

    const remaining: OfflineMutation[] = [];

    for (const item of queue) {
      // ── SECURITY: Reject any mutation that does not belong to the
      // currently authenticated user. These are stale/cross-user items.
      if (item.userId !== currentUserId) {
        console.warn(
          '[Security] Discarding offline mutation: userId mismatch.',
          `Queue item userId=${item.userId}, current session userId=${currentUserId}. Mutation type=${item.type}`
        );
        // Drop silently — do NOT add to remaining (discard the item).
        continue;
      }

      let success = false;
      try {
        if (item.type === 'upsert_workout') {
          success = await directPushWorkoutToCloud(item.userId, item.workout);
        } else if (item.type === 'delete_workout') {
          success = await directDeleteWorkoutFromCloud(item.userId, item.workoutId);
        } else if (item.type === 'wipe_user_workouts') {
          success = await directWipeUserWorkoutsInCloud(item.userId);
        } else if (item.type === 'wipe_all_user_data') {
          success = await directWipeAllUserDataInCloud(item.userId);
        } else if (item.type === 'upsert_measurement') {
          success = await directPushMeasurementToCloud(item.userId, item.measurement);
        } else if (item.type === 'upsert_profile') {
          const { upsertProfile } = await import('./auth');
          const res = await upsertProfile(item.userId, item.profile);
          success = !!res;
        } else if (item.type === 'push_all_plans') {
          success = await directPushAllPlansToCloud(item.userId, item.plans);
        } else if (item.type === 'delete_plan') {
          success = await directRemovePlanFromCloud(item.userId, item.planId, item.planTitle);
        }
      } catch (err) {
        console.warn('Error processing queued mutation:', err);
        success = false;
      }

      if (!success) {
        remaining.push(item);
      }
    }

    await saveOfflineQueue(remaining);
    isFlushing = false;
    return remaining.length === 0;
  } catch (err) {
    console.warn('Exception during flushOfflineSyncQueue:', err);
    isFlushing = false;
    return false;
  }
}

/**
 * Direct cloud operations
 */
async function directWipeUserWorkoutsInCloud(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;
  try {
    const { error } = await (supabase.from('workouts') as any).delete().eq('user_id', userId);
    return !error;
  } catch {
    return false;
  }
}

async function directDeleteWorkoutFromCloud(userId: string, workoutId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;
  try {
    const { error } = await (supabase.from('workouts') as any).delete().eq('id', workoutId).eq('user_id', userId);
    return !error;
  } catch {
    return false;
  }
}

async function directPushWorkoutToCloud(userId: string, workout: Workout): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;

  // 1. Attempt atomic save_workout RPC if available on Supabase
  const payload = {
    id: workout.id,
    user_id: userId,
    title: workout.title,
    description: workout.description || null,
    started_at: workout.startTime,
    completed_at: workout.endTime,
    source: workout.source || 'user',
    exercises: (workout.exercises || []).map((we, eIdx) => ({
      exercise_id: we.exerciseId,
      order_index: eIdx,
      notes: we.notes || null,
      sets: (we.sets || []).map((s, sIdx) => ({
        set_index: s.setIndex || sIdx + 1,
        set_type: s.setType || 'working',
        weight_kg: s.weightKg !== null && s.weightKg !== undefined ? s.weightKg : null,
        reps: s.reps !== null && s.reps !== undefined ? s.reps : null,
        distance_km: s.distanceKm !== null && s.distanceKm !== undefined ? s.distanceKm : null,
        duration_seconds: s.durationSec !== null && s.durationSec !== undefined ? s.durationSec : null,
        rpe: s.rpe !== null && s.rpe !== undefined ? s.rpe : null,
        completed: s.completed ?? true,
        completed_at: s.completedAt || null,
        notes: s.notes || null,
      })),
    })),
  };

  if (typeof (supabase as any).rpc === 'function') {
    try {
      const { data: rpcData, error: rpcErr } = await (supabase as any).rpc('save_workout', { payload });
      if (!rpcErr && rpcData?.success) {
        return true;
      }
    } catch {
      // Fall through to direct table inserts if RPC fails or is not yet installed
    }
  }

  // 2. Fallback: Multi-step direct table inserts
  try {
    // Reuse the client id when it is already a UUID so a retried/offline-flushed
    // save updates the same row instead of creating duplicates.
    const fallbackWorkoutId = isValidUuid(workout.id) ? workout.id : genUuid();
    const { data: wRow, error: wErr } = await (supabase.from('workouts') as any)
      .upsert(
        {
          id: fallbackWorkoutId,
          user_id: userId,
          title: workout.title,
          description: workout.description || null,
          started_at: workout.startTime,
          completed_at: workout.endTime,
          source: workout.source || 'user',
        },
        { onConflict: 'id' },
      )
      .select('id')
      .single();

    if (wErr || !wRow) {
      return false;
    }

    const workoutId = wRow.id;

    // Clear previously-persisted children so a retried save is idempotent
    // (mirrors the atomic save_workout RPC behaviour).
    await (supabase.from('workout_exercises') as any).delete().eq('workout_id', workoutId);

    for (let eIdx = 0; eIdx < workout.exercises.length; eIdx++) {
      const we = workout.exercises[eIdx];
      const { data: exRow, error: exErr } = await (supabase.from('workout_exercises') as any)
        .insert({
          workout_id: workoutId,
          exercise_id: we.exerciseId,
          order_index: eIdx,
          notes: we.notes || null,
        })
        .select('id')
        .single();

      if (exErr || !exRow) continue;

      const exerciseId = exRow.id;
      const setsToInsert = we.sets.map((s, sIdx) => ({
        workout_exercise_id: exerciseId,
        set_index: s.setIndex || sIdx + 1,
        set_type: s.setType || 'working',
        weight_kg: s.weightKg !== null && s.weightKg !== undefined ? s.weightKg : null,
        reps: s.reps !== null && s.reps !== undefined ? s.reps : null,
        distance_km: s.distanceKm !== null && s.distanceKm !== undefined ? s.distanceKm : null,
        duration_seconds: s.durationSec !== null && s.durationSec !== undefined ? s.durationSec : null,
        rpe: s.rpe !== null && s.rpe !== undefined ? s.rpe : null,
        completed: s.completed ?? true,
        completed_at: s.completedAt || null,
        notes: s.notes || null,
      }));

      if (setsToInsert.length > 0) {
        await (supabase.from('workout_sets') as any).insert(setsToInsert);
      }
    }

    return true;
  } catch {
    return false;
  }
}

async function directPushMeasurementToCloud(userId: string, m: BodyMeasurement): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;

  const { error } = await (supabase.from('body_measurements') as any).insert({
    user_id: userId,
    measured_at: m.date,
    weight_kg: m.weightKg,
    body_fat_pct: m.bodyFatPct || null,
    chest_cm: m.chestCm || null,
    waist_cm: m.waistCm || null,
    biceps_cm: m.bicepsCm || null,
  });

  return !error;
}

/**
 * Plan cloud writes are serialized through a single promise chain. Call sites
 * (setPlans, addPlan/updatePlan, patchSet, offline queue flushes, sync repair)
 * used to run "delete everything, then re-insert" concurrently; interleaved
 * deletes could wipe plans or their exercises, and the next sync then adopted
 * that broken cloud state. Serializing keeps every plan mutation ordered.
 */
let planOpChain: Promise<unknown> = Promise.resolve();
function withPlanLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = planOpChain.then(fn, fn);
  planOpChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/**
 * Pushes a single plan and returns its cloud id on success, or null on any
 * failure. Exercise rows are upserted BEFORE stale rows are removed, so a
 * failed write (missing exercise in the server catalog, transient error,
 * interrupted request) can never wipe the exercises already stored in the
 * cloud — the caller retries instead of silently saving an empty plan.
 */
async function pushPlanToCloudUnlocked(
  userId: string,
  plan: WorkoutPlan,
  sortOrder?: number,
): Promise<string | null> {
  if (!isSupabaseConfigured || !userId) return null;
  try {
    const validId = isValidUuid(plan.id) ? plan.id : genUuid();
    const planRow: Record<string, unknown> = {
      id: validId,
      user_id: userId,
      name: plan.title,
      emoji: plan.emoji || '💪',
      muscles: plan.muscles || [],
    };
    // Persist the plan's slot in the user's active routine. Omit it when the
    // caller does not know the position, so a partial update cannot shuffle
    // plans accidentally.
    if (typeof sortOrder === 'number' && sortOrder >= 0) {
      planRow.sort_order = sortOrder;
    }
    const { data: pRow, error: pErr } = await (supabase.from('workout_plans') as any)
      .upsert(planRow)
      .select('id')
      .single();

    if (pErr || !pRow) return null;
    const planId: string = pRow.id;

    const exerciseRows = (plan.exercises || []).map((e, idx) => ({
      plan_id: planId,
      exercise_id: e.exerciseId,
      order_index: idx,
      target_sets: e.sets || 3,
      target_reps: e.targetReps || '8-12',
      target_weight: e.targetWeightKg ?? null,
    }));

    if (exerciseRows.length > 0) {
      const { error: upsertErr } = await (supabase.from('workout_plan_exercises') as any)
        .upsert(exerciseRows, { onConflict: 'plan_id,order_index' });
      if (upsertErr) return null;
    }

    // Only after the new rows are stored, drop leftovers from a previously
    // longer version of this plan.
    const { error: trimErr } = await (supabase.from('workout_plan_exercises') as any)
      .delete()
      .eq('plan_id', planId)
      .gte('order_index', exerciseRows.length);
    if (trimErr) return null;

    return planId;
  } catch {
    return null;
  }
}

function directPushPlanToCloud(
  userId: string,
  plan: WorkoutPlan,
  sortOrder?: number,
): Promise<string | null> {
  return withPlanLock(() => pushPlanToCloudUnlocked(userId, plan, sortOrder));
}

async function removePlanFromCloudUnlocked(
  userId: string,
  planId: string,
  planTitle?: string,
): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;
  try {
    if (isValidUuid(planId)) {
      const { error } = await (supabase.from('workout_plans') as any)
        .delete()
        .eq('id', planId)
        .eq('user_id', userId);
      return !error;
    }
    // Legacy/local-only ids were never stored as-is in Supabase (every push
    // generated a fresh UUID). Remove cloud copies by exact title so a delete
    // cannot leave a ghost plan that later shadows a re-created plan.
    if (planTitle) {
      const { error } = await (supabase.from('workout_plans') as any)
        .delete()
        .eq('user_id', userId)
        .eq('name', planTitle);
      return !error;
    }
    return true;
  } catch {
    return false;
  }
}

function directRemovePlanFromCloud(
  userId: string,
  planId: string,
  planTitle?: string,
): Promise<boolean> {
  return withPlanLock(() => removePlanFromCloudUnlocked(userId, planId, planTitle));
}

/**
 * Replaces the account's plans with `plans` without the previous
 * "delete everything up front" window. Every plan is pushed first (each push
 * is itself non-destructive); only when all pushes succeeded are cloud rows
 * that are no longer part of the list removed. A crash or failed request
 * mid-way therefore leaves extra plans at worst, never zero plans.
 */
async function replaceAllPlansUnlocked(userId: string, plans: WorkoutPlan[]): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;
  try {
    const keptCloudIds = new Set<string>();
    let allPushed = true;
    for (let idx = 0; idx < plans.length; idx++) {
      const cloudId = await pushPlanToCloudUnlocked(userId, plans[idx], idx);
      if (cloudId) keptCloudIds.add(cloudId);
      else allPushed = false;
    }
    if (!allPushed) return false;

    const { data: existing, error: fetchErr } = await (supabase.from('workout_plans') as any)
      .select('id')
      .eq('user_id', userId);
    if (fetchErr) return true; // plans are safe; stale cleanup can wait for the next sync

    const staleIds = ((existing || []) as { id: string }[])
      .map((row) => row.id)
      .filter((id) => !keptCloudIds.has(id));

    if (staleIds.length > 0) {
      const { error: deleteErr } = await (supabase.from('workout_plans') as any)
        .delete()
        .eq('user_id', userId)
        .in('id', staleIds);
      if (deleteErr) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function directPushAllPlansToCloud(userId: string, plans: WorkoutPlan[]): Promise<boolean> {
  return withPlanLock(() => replaceAllPlansUnlocked(userId, plans));
}

/**
 * Public export wrappers that automatically queue offline if cloud is unreachable
 */
export async function pushWorkoutToCloud(userId: string, workout: Workout): Promise<boolean> {
  if (!userId) return false;
  try {
    const success = await directPushWorkoutToCloud(userId, workout);
    if (!success) {
      await enqueueOfflineMutation({ type: 'upsert_workout', userId, workout, timestamp: Date.now() });
    }
    return true;
  } catch {
    await enqueueOfflineMutation({ type: 'upsert_workout', userId, workout, timestamp: Date.now() });
    return true;
  }
}

export async function pushPlanToCloud(userId: string, plan: WorkoutPlan): Promise<boolean> {
  if (!userId) return false;
  // Keep the plan in its current routine slot (e.g. edits must not reorder it).
  const localIndex = usePulse.getState().plans.findIndex((p) => p.id === plan.id);
  try {
    const cloudId = await directPushPlanToCloud(
      userId,
      plan,
      localIndex >= 0 ? localIndex : undefined,
    );
    if (!cloudId) {
      await enqueueOfflineMutation({ type: 'push_all_plans', userId, plans: usePulse.getState().plans, timestamp: Date.now() });
    }
    return true;
  } catch {
    await enqueueOfflineMutation({ type: 'push_all_plans', userId, plans: usePulse.getState().plans, timestamp: Date.now() });
    return true;
  }
}

export async function removePlanFromCloud(
  userId: string,
  planId: string,
  planTitle?: string,
): Promise<boolean> {
  if (!userId) return false;
  try {
    const success = await directRemovePlanFromCloud(userId, planId, planTitle);
    if (!success) {
      await enqueueOfflineMutation({ type: 'delete_plan', userId, planId, planTitle, timestamp: Date.now() });
    }
    return true;
  } catch {
    await enqueueOfflineMutation({ type: 'delete_plan', userId, planId, planTitle, timestamp: Date.now() });
    return true;
  }
}

export async function pushAllPlansToCloud(userId: string, plans: WorkoutPlan[]): Promise<boolean> {
  if (!userId) return false;
  try {
    const success = await directPushAllPlansToCloud(userId, plans);
    if (!success) {
      await enqueueOfflineMutation({ type: 'push_all_plans', userId, plans, timestamp: Date.now() });
    }
    return true;
  } catch {
    await enqueueOfflineMutation({ type: 'push_all_plans', userId, plans, timestamp: Date.now() });
    return true;
  }
}

export async function pushMeasurementToCloud(userId: string, m: BodyMeasurement): Promise<boolean> {
  if (!userId) return false;
  try {
    const success = await directPushMeasurementToCloud(userId, m);
    if (!success) {
      await enqueueOfflineMutation({ type: 'upsert_measurement', userId, measurement: m, timestamp: Date.now() });
    }
    return true;
  } catch {
    await enqueueOfflineMutation({ type: 'upsert_measurement', userId, measurement: m, timestamp: Date.now() });
    return true;
  }
}

export async function wipeUserWorkoutsInCloud(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const success = await directWipeUserWorkoutsInCloud(userId);
    if (!success) {
      await enqueueOfflineMutation({ type: 'wipe_user_workouts', userId, timestamp: Date.now() });
    }
    return true;
  } catch {
    await enqueueOfflineMutation({ type: 'wipe_user_workouts', userId, timestamp: Date.now() });
    return true;
  }
}

async function directWipeAllUserDataInCloud(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;
  try {
    const results = await Promise.allSettled([
      (supabase.from('workouts') as any).delete().eq('user_id', userId),
      (supabase.from('workout_plans') as any).delete().eq('user_id', userId),
      (supabase.from('body_measurements') as any).delete().eq('user_id', userId),
      (supabase.from('user_favorite_exercises') as any).delete().eq('user_id', userId),
      (supabase.from('manual_prs') as any).delete().eq('user_id', userId),
      (supabase.from('user_goals') as any).delete().eq('user_id', userId),
      (supabase.from('profiles') as any).update({
        height_cm: null,
        weight_kg: null,
        onboarded: false,
        goal: [],
        preferred_training_style: [],
        training_age_months: 0,
        equipment: [],
      }).eq('id', userId),
    ]);

    const criticalFailed = results.some(
      (r) => r.status === 'rejected' || (r.status === 'fulfilled' && (r.value as any)?.error)
    );
    return !criticalFailed;
  } catch {
    return false;
  }
}

export async function wipeAllUserDataInCloud(userId: string): Promise<boolean> {
  if (!userId) return false;
  // Always clear offline mutation queue so old pending workouts/measurements don't get flushed back
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY).catch(() => {});
  try {
    const success = await directWipeAllUserDataInCloud(userId);
    if (!success) {
      await enqueueOfflineMutation({ type: 'wipe_all_user_data', userId, timestamp: Date.now() });
    }
    return success;
  } catch {
    await enqueueOfflineMutation({ type: 'wipe_all_user_data', userId, timestamp: Date.now() });
    return false;
  }
}

async function directPushFavoriteToCloud(userId: string, exerciseId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId || !exerciseId) return false;
  try {
    const { error } = await (supabase.from('user_favorite_exercises') as any).upsert({
      user_id: userId,
      exercise_id: exerciseId,
    });
    return !error;
  } catch {
    return false;
  }
}

async function directRemoveFavoriteFromCloud(userId: string, exerciseId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId || !exerciseId) return false;
  try {
    const { error } = await (supabase.from('user_favorite_exercises') as any)
      .delete()
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId);
    return !error;
  } catch {
    return false;
  }
}

async function directPushManualPRToCloud(userId: string, pr: any): Promise<boolean> {
  if (!isSupabaseConfigured || !userId || !pr) return false;
  try {
    const validId = isValidUuid(pr.id) ? pr.id : genUuid();
    const { error } = await (supabase.from('manual_prs') as any).upsert({
      id: validId,
      user_id: userId,
      exercise_id: pr.exerciseId,
      weight_kg: pr.weightKg,
      reps: pr.reps,
      date: pr.date,
    });
    return !error;
  } catch {
    return false;
  }
}

async function directRemoveManualPRFromCloud(userId: string, prId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId || !prId) return false;
  if (!isValidUuid(prId)) return true;
  try {
    const { error } = await (supabase.from('manual_prs') as any)
      .delete()
      .eq('id', prId)
      .eq('user_id', userId);
    return !error;
  } catch {
    return false;
  }
}

export async function pushFavoriteToCloud(userId: string, exerciseId: string): Promise<boolean> {
  return await directPushFavoriteToCloud(userId, exerciseId);
}

export async function removeFavoriteFromCloud(userId: string, exerciseId: string): Promise<boolean> {
  return await directRemoveFavoriteFromCloud(userId, exerciseId);
}

export async function pushManualPRToCloud(userId: string, pr: any): Promise<boolean> {
  return await directPushManualPRToCloud(userId, pr);
}

export async function removeManualPRFromCloud(userId: string, prId: string): Promise<boolean> {
  return await directRemoveManualPRFromCloud(userId, prId);
}

