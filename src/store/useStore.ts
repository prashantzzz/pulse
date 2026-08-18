import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  SEED_FAVORITES,
  SEED_FRIENDS,
  SEED_MEASUREMENTS,
  SEED_PLANS,
  SEED_PROFILE,
  SEED_WORKOUTS,
} from '../data/seed';
import { applyAccent, type AccentKey } from '../theme';
import type {
  ActiveWorkout,
  BodyMeasurement,
  ExerciseSet,
  Friend,
  ManualPR,
  UserProfile,
  Workout,
  WorkoutExercise,
  WorkoutPlan,
} from '../types';

let uid = 1;
function genId(prefix: string): string {
  uid += 1;
  return `${prefix}${Date.now().toString(36)}${uid}`;
}

interface PulseState {
  hydrated: boolean;
  onboarded: boolean;
  seeded: boolean;
  /** user-selected accent color key */
  accentKey: AccentKey;
  profile: UserProfile | null;
  workouts: Workout[];
  /** user-editable workout plans (seeded from SEED_PLANS) */
  plans: WorkoutPlan[];
  measurements: BodyMeasurement[];
  favorites: string[];
  friends: Friend[];
  /** personal records logged manually (outside a session) */
  manualPRs: ManualPR[];
  activeWorkout: ActiveWorkout | null;

  setHydrated: () => void;
  completeOnboarding: (profile: UserProfile) => void;
  setAccent: (key: AccentKey) => void;
  toggleFavorite: (exerciseId: string) => void;
  setProfile: (p: Partial<UserProfile>) => void;

  /** Create an active workout from a plan (or raw exercise specs) */
  startWorkout: (
    title: string,
    exercises: { exerciseId: string; sets: number; targetReps: string }[],
  ) => Workout;
  /** Patch a set within the active workout */
  patchSet: (exerciseId: string, setId: string, patch: Partial<ExerciseSet>) => void;
  completeSet: (exerciseId: string, setId: string) => void;
  /** Freeze the workout's elapsed timer; the elapsed time is captured so it survives navigation */
  pauseActiveWorkout: () => void;
  /** Un-pause by shifting startTime forward by the paused duration */
  resumeActiveWorkout: () => void;
  /** Discard the active workout entirely */
  cancelActiveWorkout: () => void;
  /** Finalize active workout into history; returns the finished workout */
  finishWorkout: () => Workout | null;

  saveBuiltWorkout: (title: string, exercises: WorkoutExercise[], startTime: string, endTime: string) => void;
  /** Replace an existing plan (edit via the builder) */
  updatePlan: (id: string, plan: WorkoutPlan) => void;
  /** Remove a plan (only the template — workout history is untouched) */
  removePlan: (id: string) => void;
  addMeasurement: (m: BodyMeasurement) => void;
  addManualPR: (pr: Omit<ManualPR, 'id'>) => void;
  removeManualPR: (id: string) => void;
  /** Merge CSV-imported workouts (deduped by title+start time) */
  importWorkouts: (imported: Workout[]) => void;
  resetDemo: () => void;
  clearAllData: () => void;
}

export const usePulse = create<PulseState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboarded: false,
      seeded: false,
      accentKey: 'lime',
      profile: null,
      workouts: [],
      plans: SEED_PLANS,
      measurements: [],
      favorites: [],
      friends: [],
      manualPRs: [],
      activeWorkout: null,

      setHydrated: () => set({ hydrated: true }),

      setAccent: (key) => {
        applyAccent(key);
        set({ accentKey: key });
      },

      completeOnboarding: (profile) => {
        const { seeded } = get();
        set({
          onboarded: true,
          profile,
          seeded: true,
          workouts: seeded ? get().workouts : SEED_WORKOUTS,
          measurements: seeded ? get().measurements : SEED_MEASUREMENTS,
          favorites: seeded ? get().favorites : SEED_FAVORITES,
          friends: seeded ? get().friends : SEED_FRIENDS,
        });
      },

      toggleFavorite: (exerciseId) =>
        set((s) => ({
          favorites: s.favorites.includes(exerciseId)
            ? s.favorites.filter((f) => f !== exerciseId)
            : [...s.favorites, exerciseId],
        })),

      setProfile: (p) =>
        set((s) => ({ profile: s.profile ? { ...s.profile, ...p } : s.profile })),

      startWorkout: (title, specs) => {
        const now = new Date();
        const active: ActiveWorkout = {
          id: genId('aw'),
          title,
          description: '',
          startTime: now.toISOString(),
          endTime: now.toISOString(),
          source: 'user',
          exercises: specs.map((spec, i) => {
            const sets: ExerciseSet[] = Array.from({ length: spec.sets }, (_, si) => ({
              id: genId('s'),
              setIndex: si + 1,
              setType: si === 0 && spec.sets > 3 ? 'warmup' : 'working',
              weightKg: null,
              reps: null,
              distanceKm: null,
              durationSec: null,
              rpe: null,
              notes: null,
              supersetId: null,
              completed: false,
              completedAt: null,
            }));
            return {
              id: genId('we'),
              exerciseId: spec.exerciseId,
              order: i + 1,
              notes: null,
              plannedSets: spec.sets,
              targetReps: spec.targetReps,
              sets,
            };
          }),
        };
        set({ activeWorkout: active });
        return active;
      },

      patchSet: (exerciseId, setId, patch) =>
        set((s) => {
          if (!s.activeWorkout) return s;
          return {
            activeWorkout: {
              ...s.activeWorkout,
              exercises: s.activeWorkout.exercises.map((we) =>
                we.exerciseId === exerciseId
                  ? { ...we, sets: we.sets.map((st) => (st.id === setId ? { ...st, ...patch } : st)) }
                  : we,
              ),
            },
          };
        }),

      completeSet: (exerciseId, setId) =>
        set((s) => {
          if (!s.activeWorkout) return s;
          return {
            activeWorkout: {
              ...s.activeWorkout,
              endTime: new Date().toISOString(),
              exercises: s.activeWorkout.exercises.map((we) =>
                we.exerciseId === exerciseId
                  ? {
                      ...we,
                      sets: we.sets.map((st) =>
                        st.id === setId
                          ? { ...st, completed: true, completedAt: new Date().toISOString() }
                          : st,
                      ),
                    }
                  : we,
              ),
            },
          };
        }),

      pauseActiveWorkout: () =>
        set((s) => {
          if (!s.activeWorkout || s.activeWorkout.paused) return s;
          return {
            activeWorkout: {
              ...s.activeWorkout,
              paused: true,
              pausedAt: new Date().toISOString(),
            },
          };
        }),

      resumeActiveWorkout: () =>
        set((s) => {
          const aw = s.activeWorkout;
          if (!aw || !aw.paused || !aw.pausedAt) return s;
          // shift startTime forward by the paused duration so every existing
          // `now - startTime` calculation keeps working unchanged
          const pausedMs = Date.now() - new Date(aw.pausedAt).getTime();
          return {
            activeWorkout: {
              ...aw,
              paused: false,
              pausedAt: null,
              startTime: new Date(new Date(aw.startTime).getTime() + pausedMs).toISOString(),
            },
          };
        }),

      cancelActiveWorkout: () => set({ activeWorkout: null }),

      finishWorkout: () => {
        const { activeWorkout } = get();
        if (!activeWorkout) return null;
        // when finishing while paused, end the workout at the pause moment so
        // the recorded duration matches the displayed (frozen) elapsed time
        const end = activeWorkout.paused ? (activeWorkout.pausedAt ?? new Date().toISOString()) : new Date().toISOString();
        const finished: Workout = {
          ...activeWorkout,
          paused: undefined,
          pausedAt: undefined,
          endTime: end,
        };
        set((s) => ({
          workouts: [...s.workouts, finished],
          activeWorkout: null,
        }));
        return finished;
      },

      saveBuiltWorkout: (title, exercises, startTime, endTime) =>
        set((s) => ({
          workouts: [
            ...s.workouts,
            {
              id: genId('w'),
              title,
              description: '',
              startTime,
              endTime,
              source: 'user',
              exercises,
            },
          ],
        })),

      updatePlan: (id, plan) =>
        set((s) => ({
          plans: s.plans.map((p) => (p.id === id ? plan : p)),
        })),

      removePlan: (id) =>
        set((s) => ({
          plans: s.plans.filter((p) => p.id !== id),
        })),

      addMeasurement: (m) => set((s) => ({ measurements: [...s.measurements, m] })),

      addManualPR: (pr) =>
        set((s) => ({
          manualPRs: [{ id: genId('pr'), ...pr }, ...s.manualPRs],
        })),

      removeManualPR: (id) =>
        set((s) => ({ manualPRs: s.manualPRs.filter((p) => p.id !== id) })),

      importWorkouts: (imported) =>
        set((s) => {
          const existing = new Set(s.workouts.map((w) => `${w.title}|${w.startTime}`));
          const fresh = imported
            .filter((w) => !existing.has(`${w.title}|${w.startTime}`))
            .map((w) => ({
              ...w,
              id: genId('w'),
              source: 'user' as const,
              exercises: w.exercises.map((we) => ({
                ...we,
                id: genId('we'),
                sets: we.sets.map((st) => ({ ...st, id: genId('s') })),
              })),
            }));
          return { workouts: [...fresh, ...s.workouts] };
        }),

      resetDemo: () =>
        set({
          profile: SEED_PROFILE,
          workouts: SEED_WORKOUTS,
          plans: SEED_PLANS,
          measurements: SEED_MEASUREMENTS,
          favorites: SEED_FAVORITES,
          friends: SEED_FRIENDS,
          manualPRs: [],
          activeWorkout: null,
          onboarded: true,
          seeded: true,
        }),

      clearAllData: () =>
        set({
          workouts: [],
          plans: SEED_PLANS,
          measurements: [],
          favorites: [],
          friends: [],
          manualPRs: [],
          activeWorkout: null,
          profile: null,
          onboarded: false,
          seeded: true,
        }),
    }),
    {
      name: 'pulse-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        onboarded: s.onboarded,
        seeded: s.seeded,
        accentKey: s.accentKey,
        profile: s.profile,
        workouts: s.workouts,
        plans: s.plans,
        measurements: s.measurements,
        favorites: s.favorites,
        friends: s.friends,
        manualPRs: s.manualPRs,
        activeWorkout: s.activeWorkout,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

// --- ticking clock for elapsed timers --------------------------------------
// Cached snapshot + interval so useSyncExternalStore never sees a changing
// snapshot outside a tick (which would cause an infinite render loop).
let cachedNow = Date.now();
const nowSubs = new Set<() => void>();
let nowInterval: ReturnType<typeof setInterval> | null = null;

export function useNow(intervalMs = 1000): number {
  return useSyncExternalStore(
    (cb) => {
      nowSubs.add(cb);
      if (!nowInterval) {
        nowInterval = setInterval(() => {
          cachedNow = Date.now();
          nowSubs.forEach((l) => l());
        }, intervalMs);
      }
      return () => {
        nowSubs.delete(cb);
        if (nowSubs.size === 0 && nowInterval) {
          clearInterval(nowInterval);
          nowInterval = null;
        }
      };
    },
    () => cachedNow,
    () => cachedNow,
  );
}
