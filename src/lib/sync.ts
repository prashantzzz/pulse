/**
 * Cloud Data Synchronization Layer
 *
 * Synchronizes user data (Profiles, Body Measurements, Workouts, Sets, Plans)
 * bidirectionally between Supabase and the local Zustand `usePulse` store.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { usePulse } from '../store/useStore';
import { SEED_PLANS } from '../data/seed';
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

    // 3. Fetch Workouts with nested Exercises and Sets
    const { data: workoutsData, error: workoutsErr } = await (supabase.from('workouts') as any)
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
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    // 4. Fetch User Workout Plans
    const { data: plansData, error: plansErr } = await (supabase.from('workout_plans') as any)
      .select(`
        id,
        name,
        emoji,
        muscles,
        workout_plan_exercises (
          id,
          exercise_id,
          order_index,
          target_sets,
          target_reps
        )
      `)
      .eq('user_id', userId);

    if (plansErr) {
      console.warn('Error fetching workout plans from cloud:', plansErr);
    }

    // 5. Transform data
    const cloudWorkouts: Workout[] = (workoutsData || []).map((w: unknown) => mapCloudWorkout(w as RawWorkout));
    const cloudMeasurements: BodyMeasurement[] = (measurementsData || []).map((m: unknown) =>
      mapCloudMeasurement(m as RawMeasurement),
    );

    const cloudPlans: WorkoutPlan[] = (plansData || []).map((p: any) => ({
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
        })),
    }));

    const userProfile: UserProfile | null = profileRow
      ? {
          name: profileRow.display_name ?? 'Athlete',
          gender: (profileRow.gender as 'male' | 'female') ?? 'male',
          goal: profileRow.goal ?? ['Build Muscle'],
          experience: (profileRow.experience_level as 'Beginner' | 'Intermediate' | 'Advanced') ?? 'Intermediate',
          frequencyPerWeek: profileRow.training_frequency ?? 4,
          equipment: profileRow.equipment ?? [],
          style: profileRow.preferred_training_style ?? [],
          trainingAgeMonths: profileRow.training_age_months ?? 0,
          onboarded: profileRow.onboarded ?? true,
          avatarUrl: profileRow.avatar_url ? `${profileRow.avatar_url}?t=${Date.now()}` : undefined,
        }
      : null;

    // 6. Update local store state
    usePulse.setState((state) => {
      // Merge plans by ID to ensure local plans and cloud plans are safely consolidated
      const planMap = new Map<string, WorkoutPlan>();
      for (const p of state.plans) {
        if (p.id) planMap.set(p.id, p);
      }
      for (const cp of cloudPlans) {
        if (cp.id) planMap.set(cp.id, cp);
      }
      const consolidatedPlans = Array.from(planMap.values());

      return {
        workouts: cloudWorkouts,
        measurements: cloudMeasurements,
        plans: consolidatedPlans.length > 0 ? consolidatedPlans : (state.plans.length > 0 ? state.plans : SEED_PLANS),
        profile: userProfile ?? state.profile,
        onboarded: userProfile ? (userProfile.onboarded ?? state.onboarded) : state.onboarded,
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_QUEUE_KEY = '@nextrep_offline_sync_queue';

export type OfflineMutation =
  | { type: 'upsert_workout'; userId: string; workout: Workout; timestamp: number }
  | { type: 'delete_workout'; userId: string; workoutId: string; timestamp: number }
  | { type: 'wipe_user_workouts'; userId: string; timestamp: number }
  | { type: 'upsert_measurement'; userId: string; measurement: BodyMeasurement; timestamp: number }
  | { type: 'upsert_profile'; userId: string; profile: Partial<UserProfile>; timestamp: number };

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

export async function enqueueOfflineMutation(mutation: OfflineMutation): Promise<void> {
  const queue = await getOfflineQueue();
  queue.push(mutation);
  await saveOfflineQueue(queue);
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
        } else if (item.type === 'upsert_measurement') {
          success = await directPushMeasurementToCloud(item.userId, item.measurement);
        } else if (item.type === 'upsert_profile') {
          const { upsertProfile } = await import('./auth');
          const res = await upsertProfile(item.userId, item.profile);
          success = !!res;
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

  // 1. Insert Workout
  const { data: wRow, error: wErr } = await (supabase.from('workouts') as any)
    .insert({
      user_id: userId,
      title: workout.title,
      description: workout.description || null,
      started_at: workout.startTime,
      completed_at: workout.endTime,
      source: workout.source || 'user',
    })
    .select('id')
    .single();

  if (wErr || !wRow) {
    return false;
  }

  const workoutId = wRow.id;

  // 2. Insert Exercises and Sets
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

async function directPushPlanToCloud(userId: string, plan: WorkoutPlan): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;
  try {
    const validId = isValidUuid(plan.id) ? plan.id : genUuid();
    const { data: pRow, error: pErr } = await (supabase.from('workout_plans') as any)
      .upsert({
        id: validId,
        user_id: userId,
        name: plan.title,
        emoji: plan.emoji || '💪',
        muscles: plan.muscles || [],
      })
      .select('id')
      .single();

    if (pErr || !pRow) return false;
    const planId = pRow.id;

    await (supabase.from('workout_plan_exercises') as any).delete().eq('plan_id', planId);

    const exercisesToInsert = plan.exercises.map((e, idx) => ({
      plan_id: planId,
      exercise_id: e.exerciseId,
      order_index: idx,
      target_sets: e.sets || 3,
      target_reps: e.targetReps || '8-12',
    }));

    if (exercisesToInsert.length > 0) {
      await (supabase.from('workout_plan_exercises') as any).insert(exercisesToInsert);
    }
    return true;
  } catch {
    return false;
  }
}

async function directRemovePlanFromCloud(userId: string, planId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;
  // If planId is not a valid UUID (e.g. legacy/local-only id), nothing exists in Supabase to delete
  if (!isValidUuid(planId)) return true;
  try {
    const { error } = await (supabase.from('workout_plans') as any)
      .delete()
      .eq('id', planId)
      .eq('user_id', userId);
    return !error;
  } catch {
    return false;
  }
}

async function directPushAllPlansToCloud(userId: string, plans: WorkoutPlan[]): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;
  try {
    await (supabase.from('workout_plans') as any).delete().eq('user_id', userId);
    for (const p of plans) {
      await directPushPlanToCloud(userId, p);
    }
    return true;
  } catch {
    return false;
  }
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
  try {
    await directPushPlanToCloud(userId, plan);
    return true;
  } catch {
    return false;
  }
}

export async function removePlanFromCloud(userId: string, planId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    await directRemovePlanFromCloud(userId, planId);
    return true;
  } catch {
    return false;
  }
}

export async function pushAllPlansToCloud(userId: string, plans: WorkoutPlan[]): Promise<boolean> {
  if (!userId) return false;
  try {
    await directPushAllPlansToCloud(userId, plans);
    return true;
  } catch {
    return false;
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
