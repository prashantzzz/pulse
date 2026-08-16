import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';import { SEED_FAVORITES,
  SEED_FRIENDS,
  SEED_MEASUREMENTS,
  SEED_PROFILE,
  SEED_WORKOUTS,
} from '../data/seed';
import { EXERCISE_MAP } from '../data/exercises';
import { applyAccent, type AccentKey } from '../theme';
import type {
  ActiveWorkout,
  BodyMeasurement,
  ExerciseSet,
  Friend,
  UserProfile,
  Workout,
  WorkoutExercise,
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
  measurements: BodyMeasurement[];
  favorites: string[];
  friends: Friend[];
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
  cancelActiveWorkout: () => void;
  /** Finalize active workout into history; returns the finished workout */
  finishWorkout: () => Workout | null;

  saveBuiltWorkout: (title: string, exercises: WorkoutExercise[], startTime: string, endTime: string) => void;
  addMeasurement: (m: BodyMeasurement) => void;
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
      measurements: [],
      favorites: [],
      friends: [],
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
            const ex = EXERCISE_MAP[spec.exerciseId];
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

      cancelActiveWorkout: () => set({ activeWorkout: null }),

      finishWorkout: () => {
        const { activeWorkout } = get();
        if (!activeWorkout) return null;
        const finished: Workout = {
          ...activeWorkout,
          endTime: new Date().toISOString(),
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

      addMeasurement: (m) => set((s) => ({ measurements: [...s.measurements, m] })),

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
          measurements: SEED_MEASUREMENTS,
          favorites: SEED_FAVORITES,
          friends: SEED_FRIENDS,
          activeWorkout: null,
          onboarded: true,
          seeded: true,
        }),

      clearAllData: () =>
        set({
          workouts: [],
          measurements: [],
          favorites: [],
          friends: [],
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
        measurements: s.measurements,
        favorites: s.favorites,
        friends: s.friends,
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
