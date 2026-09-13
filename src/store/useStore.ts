import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  pushMeasurementToCloud,
  pushWorkoutToCloud,
  wipeUserWorkoutsInCloud,
  wipeAllUserDataInCloud,
  pushPlanToCloud,
  pushAllPlansToCloud,
  removePlanFromCloud,
  pushFavoriteToCloud,
  removeFavoriteFromCloud,
  pushManualPRToCloud,
  removeManualPRFromCloud,
} from '../lib/sync';
import { supabase } from '../lib/supabase';
import { templateToPlans } from '../data/templates';
import { recommendTemplate } from '../lib/recommendations';
import { EXERCISE_MAP } from '../data/exercises';
import { applyAccent, type AccentKey } from '../theme';
import { getDefaultSetValues, previousSet, getRecommendedRestSeconds } from '../lib/stats';
import { formatUserWeightWithUnit } from '../lib/units';

import type {
  ActiveWorkout,
  BodyMeasurement,
  ExerciseSet,
  Friend,
  ManualPR,
  RestTimerState,
  UserProfile,
  Workout,
  WorkoutExercise,
  WorkoutPlan,
  WorkoutPlanExercise,
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
  weightUnit: 'kg' | 'lbs';
  profile: UserProfile | null;
  workouts: Workout[];
  /** user-editable workout plans (seeded from SEED_PLANS) */
  plans: WorkoutPlan[];
  measurements: BodyMeasurement[];
  favorites: string[];
  friends: Friend[];
  /** personal records logged manually (outside a session) */
  manualPRs: ManualPR[];
  /** User-remembered preferred/last weights and reps for exercises */
  exerciseDefaults: Record<string, { weightKg: number; reps: number }>;
  activeWorkout: ActiveWorkout | null;
  autoRestTimer: boolean;
  hapticsEnabled: boolean;

  setHydrated: () => void;
  completeOnboarding: (profile: UserProfile) => void;
  setAccent: (key: AccentKey) => void;
  setWeightUnit: (unit: 'kg' | 'lbs') => void;
  setAutoRestTimer: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  toggleFavorite: (exerciseId: string) => void;
  setProfile: (p: Partial<UserProfile>) => void;
  addFriend: (friend: Friend) => void;
  setFriends: (friends: Friend[]) => void;

  /** Create an active workout from a plan (or raw exercise specs) */
  startWorkout: (
    title: string,
    exercises: (WorkoutPlanExercise | { exerciseId: string; sets: number; targetReps: string; targetWeightKg?: number | null })[],
    planId?: string | null,
  ) => Workout;
  /** Patch a set within the active workout */
  patchSet: (exerciseId: string, setId: string, patch: Partial<ExerciseSet>) => void;
  completeSet: (exerciseId: string, setId: string) => void;
  /** Complete the first incomplete set in the active workout and automatically start recommended rest timer */
  completeNextSetAndStartRest: () => {
    exerciseId: string;
    setId: string;
    completedSetIndex: number;
    totalSets: number;
    doneSets: number;
  } | null;
  /** Freeze the workout's elapsed timer; the elapsed time is captured so it survives navigation */
  pauseActiveWorkout: () => void;
  /** Un-pause by shifting startTime forward by the paused duration */
  resumeActiveWorkout: () => void;
  /** Start or update adaptive rest timer in the active workout */
  startRestTimer: (rest: {
    totalSeconds: number;
    exerciseName: string;
    reason: string;
    completedSetInfo?: string;
    nextSetInfo?: string;
  }) => void;
  /** Pause the active rest timer, preserving remaining seconds */
  pauseRestTimer: () => void;
  /** Resume the paused rest timer */
  resumeRestTimer: () => void;
  /** Add/subtract seconds to the rest timer */
  addRestSeconds: (sec: number) => void;
  /** Clear/skip the rest timer */
  clearRestTimer: () => void;
  /** Discard the active workout entirely */
  cancelActiveWorkout: () => void;
  /** Finalize active workout into history; returns the finished workout */
  finishWorkout: () => Workout | null;

  saveBuiltWorkout: (title: string, exercises: WorkoutExercise[], startTime: string, endTime: string) => void;
  /** Append a new workout plan (e.g. built via the builder) */
  addPlan: (plan: WorkoutPlan) => void;
  /** Replace entire active workout plans set (e.g. when applying a template) */
  setPlans: (plans: WorkoutPlan[]) => void;
  /** Replace an existing plan (edit via the builder) */
  updatePlan: (id: string, plan: WorkoutPlan) => void;
  /** Remove a plan (only the template — workout history is untouched) */
  removePlan: (id: string) => void;
  addMeasurement: (m: BodyMeasurement) => void;
  addManualPR: (pr: Omit<ManualPR, 'id'>) => void;
  removeManualPR: (id: string) => void;
  /** Merge CSV-imported workouts (deduped by title+start time) */
  importWorkouts: (imported: Workout[]) => void;
  /** Overwrite workout history with new set */
  replaceWorkouts: (imported: Workout[]) => void;
  clearAllData: () => Promise<void>;
  /** Clear all local user session state upon logout without cloud data deletion */
  clearSessionCache: () => void;
}

/**
 * Pure helper function to apply a set completion to an active workout and compute the next rest timer.
 * Follows DRY principles between completeSet and completeNextSetAndStartRest.
 */
function applySetCompletionToWorkout(
  workout: ActiveWorkout,
  exerciseId: string,
  setId: string,
  weightUnit: 'kg' | 'lbs',
  workouts: Workout[],
  autoRest: boolean = true,
): {
  updatedWorkout: ActiveWorkout;
  completedSetIndex: number;
  totalSets: number;
  doneSets: number;
} {
  const nowIso = new Date().toISOString();
  const updatedExercises = workout.exercises.map((we) =>
    we.exerciseId === exerciseId
      ? {
          ...we,
          sets: we.sets.map((st) =>
            st.id === setId
              ? { ...st, completed: true, completedAt: nowIso }
              : st,
          ),
        }
      : we,
  );

  const totalSets = updatedExercises.reduce((sum, we) => sum + we.sets.length, 0);
  const doneSets = updatedExercises.reduce((sum, we) => sum + we.sets.filter((x) => x.completed).length, 0);

  let nextRestTimer: RestTimerState | null = null;
  if (autoRest && totalSets > 0 && doneSets < totalSets) {
    const rec = getRecommendedRestSeconds(exerciseId);
    const ex = EXERCISE_MAP[exerciseId];
    const completedSet = updatedExercises.find((we) => we.exerciseId === exerciseId)?.sets.find((st) => st.id === setId);
    const completedSetInfo = completedSet
      ? `Set ${completedSet.setIndex} (${completedSet.weightKg != null ? `${formatUserWeightWithUnit(completedSet.weightKg, weightUnit)} × ` : ''}${completedSet.reps ?? '–'} reps)`
      : undefined;

    let nextSetInfo = '';
    for (const e of updatedExercises) {
      const nextS = e.sets.find((st) => !st.completed);
      if (nextS) {
        const nextEx = EXERCISE_MAP[e.exerciseId];
        const p = previousSet(workouts, e.exerciseId, nextS.setIndex, workout.id);
        const wVal = nextS.weightKg ?? p?.weightKg;
        const rVal = nextS.reps ?? p?.reps ?? e.targetReps;
        nextSetInfo = `Set ${nextS.setIndex} · ${nextEx?.name ?? 'Exercise'} (${wVal != null ? `${formatUserWeightWithUnit(wVal, weightUnit)} × ` : ''}${rVal} reps)`;
        break;
      }
    }

    nextRestTimer = {
      targetEndTimeMs: Date.now() + rec.seconds * 1000,
      totalSeconds: rec.seconds,
      exerciseName: ex?.name ?? 'Exercise',
      reason: rec.label,
      paused: false,
      completedSetInfo,
      nextSetInfo,
    };
  }

  const completedSet = updatedExercises.find((we) => we.exerciseId === exerciseId)?.sets.find((st) => st.id === setId);

  return {
    updatedWorkout: {
      ...workout,
      endTime: nowIso,
      exercises: updatedExercises,
      restTimer: nextRestTimer,
    },
    completedSetIndex: completedSet?.setIndex ?? 1,
    totalSets,
    doneSets,
  };
}

export const usePulse = create<PulseState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboarded: false,
      seeded: false,
      accentKey: 'mint',
      weightUnit: 'kg',
      profile: null,
      workouts: [],
      plans: [],
      measurements: [],
      favorites: [],
      friends: [],
      manualPRs: [],
      exerciseDefaults: {},
      activeWorkout: null,
      autoRestTimer: true,
      hapticsEnabled: true,

      setHydrated: () => set({ hydrated: true }),

      setAccent: (key) => {
        applyAccent(key);
        set({ accentKey: key });
      },

      setAutoRestTimer: (enabled) => set({ autoRestTimer: enabled }),
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),

      setWeightUnit: (unit) => {
        set({ weightUnit: unit });
        const p = get().profile;
        if (p) {
          const updated = { ...p, weightUnit: unit };
          set({ profile: updated });
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              import('../lib/auth').then(({ upsertProfile }) => {
                upsertProfile(user.id, updated).catch(() => {});
              });
            }
          }).catch(() => {});
        }
      },

      completeOnboarding: (profile) => {
        const currentPlans = get().plans;
        let activePlans = currentPlans;
        if (!currentPlans || currentPlans.length === 0) {
          const rec = recommendTemplate(profile);
          activePlans = templateToPlans(rec.modifiedTemplate, get().exerciseDefaults);
        }
        set({
          onboarded: true,
          profile,
          weightUnit: profile.weightUnit ?? 'kg',
          seeded: true,
          plans: activePlans,
          workouts: get().workouts,
          measurements: get().measurements,
          favorites: get().favorites,
          friends: get().friends,
        });

        if (activePlans !== currentPlans && activePlans.length > 0) {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) pushAllPlansToCloud(user.id, activePlans).catch(() => {});
          }).catch(() => {});
        }
      },

      toggleFavorite: (exerciseId) =>
        set((s) => {
          const isFav = s.favorites.includes(exerciseId);
          const nextFavs = isFav
            ? s.favorites.filter((f) => f !== exerciseId)
            : [...s.favorites, exerciseId];

          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              if (isFav) {
                removeFavoriteFromCloud(user.id, exerciseId).catch(() => {});
              } else {
                pushFavoriteToCloud(user.id, exerciseId).catch(() => {});
              }
            }
          }).catch(() => {});

          return { favorites: nextFavs };
        }),

      setProfile: (p) => {
        set((s) => {
          const updated = s.profile ? { ...s.profile, ...p } : null;
          if (updated) {
            supabase.auth.getUser().then(({ data: { user } }) => {
              if (user) {
                import('../lib/auth').then(({ upsertProfile }) => {
                  upsertProfile(user.id, updated).catch(() => {});
                });
              }
            }).catch(() => {});
          }
          return { profile: updated };
        });
      },

      addFriend: (friend) =>
        set((s) => ({
          friends: s.friends.some((f) => f.id === friend.id)
            ? s.friends.map((f) => (f.id === friend.id ? friend : f))
            : [...s.friends, friend],
        })),

      setFriends: (friends) => set({ friends }),

      startWorkout: (title, specs, planId) => {
        const now = new Date();
        const profile = get().profile;
        const workouts = get().workouts;
        const experience = profile?.experience ?? 'Beginner';
        const plans = get().plans;
        const matchedPlan = plans.find(
          (p) => (planId && p.id === planId) || p.title.trim().toLowerCase() === title.trim().toLowerCase(),
        );
        const resolvedPlanId = planId ?? matchedPlan?.id ?? null;

        const active: ActiveWorkout = {
          id: genId('aw'),
          title,
          description: '',
          startTime: now.toISOString(),
          endTime: now.toISOString(),
          source: 'user',
          planId: resolvedPlanId,
          exercises: specs.map((spec, i) => {
            const planEx = matchedPlan?.exercises.find((pe) => pe.exerciseId === spec.exerciseId);
            const targetWeight = spec.targetWeightKg ?? planEx?.targetWeightKg;
            const targetReps = spec.targetReps ?? planEx?.targetReps ?? '8-12';

            const sets: ExerciseSet[] = Array.from({ length: spec.sets }, (_, si) => {
              const setIndex = si + 1;
              const isWarmup = si === 0 && spec.sets > 3;
              const prev = previousSet(workouts, spec.exerciseId, setIndex);
              const defaults = getDefaultSetValues(
                spec.exerciseId,
                setIndex,
                experience,
                targetReps,
                isWarmup,
              );
              const remembered = get().exerciseDefaults?.[spec.exerciseId];
              const weightKg =
                targetWeight != null
                  ? targetWeight
                  : (remembered?.weightKg ?? prev?.weightKg ?? defaults.weightKg);

              const numericTargetReps =
                targetReps && !targetReps.includes('-') && !isNaN(Number(targetReps))
                  ? Number(targetReps)
                  : null;
              const reps =
                remembered?.reps ??
                numericTargetReps ??
                (prev?.reps ?? defaults.reps);

              return {
                id: genId('s'),
                setIndex,
                setType: isWarmup ? 'warmup' : 'working',
                weightKg,
                reps,
                distanceKm: null,
                durationSec: null,
                rpe: null,
                notes: null,
                supersetId: null,
                completed: false,
                completedAt: null,
              };
            });
            return {
              id: genId('we'),
              exerciseId: spec.exerciseId,
              order: i + 1,
              notes: null,
              plannedSets: spec.sets,
              targetReps,
              sets,
            };
          }),
        };
        set({ activeWorkout: active });
        import('../lib/notifications').then(({ syncWorkoutReminder }) => {
          syncWorkoutReminder({ workouts: get().workouts, activeWorkout: active });
        }).catch(() => {});
        return active;
      },

      patchSet: (exerciseId, setId, patch) =>
        set((s) => {
          if (!s.activeWorkout) return s;
          const clearingRest = patch.completed === false;

          const targetEx = s.activeWorkout.exercises.find((we) => we.exerciseId === exerciseId);
          const targetSet = targetEx?.sets.find((st) => st.id === setId);
          const oldWeight = targetSet?.weightKg;

          const updatedExercises = s.activeWorkout.exercises.map((we) => {
            if (we.exerciseId !== exerciseId) return we;
            return {
              ...we,
              sets: we.sets.map((st) => {
                if (st.id === setId) {
                  return { ...st, ...patch };
                }
                // Auto-propagate weight to subsequent uncompleted sets if they were still at old weight
                if (
                  patch.weightKg != null &&
                  !st.completed &&
                  st.setIndex > (targetSet?.setIndex ?? 0) &&
                  (st.weightKg === oldWeight || st.weightKg == null)
                ) {
                  return { ...st, weightKg: patch.weightKg };
                }
                return st;
              }),
            };
          });

          const nextActiveWorkout: ActiveWorkout = {
            ...s.activeWorkout,
            restTimer: clearingRest ? null : s.activeWorkout.restTimer,
            exercises: updatedExercises,
          };

          // Update remembered exercise defaults
          const currentDef = s.exerciseDefaults[exerciseId];
          const newWeight = patch.weightKg ?? targetSet?.weightKg ?? currentDef?.weightKg ?? 20;
          const newReps = patch.reps ?? targetSet?.reps ?? currentDef?.reps ?? 10;
          const nextExerciseDefaults = {
            ...s.exerciseDefaults,
            [exerciseId]: {
              weightKg: newWeight,
              reps: newReps,
            },
          };

          // Persist to user's workout plans (their own workout routine!):
          // Update ALL plans containing this exercise so every workout day/split
          // stays unified and in sync with the athlete's latest numbers.
          const changedPlans: WorkoutPlan[] = [];
          const updatedPlans = s.plans.map((p) => {
            const hasEx = p.exercises.some((pe) => pe.exerciseId === exerciseId);
            if (!hasEx) return p;
            const updatedPlanExercises = p.exercises.map((pe) => {
              if (pe.exerciseId !== exerciseId) return pe;
              return {
                ...pe,
                targetWeightKg: patch.weightKg != null ? patch.weightKg : (pe.targetWeightKg ?? newWeight),
                targetReps: patch.reps != null ? String(patch.reps) : pe.targetReps,
              };
            });
            const updatedPlan: WorkoutPlan = {
              ...p,
              exercises: updatedPlanExercises,
            };
            changedPlans.push(updatedPlan);
            return updatedPlan;
          });

          // Sync all changed plans to user's cloud DB in Supabase
          if (changedPlans.length > 0) {
            supabase.auth.getUser().then(({ data: { user } }) => {
              if (user) {
                for (const p of changedPlans) {
                  pushPlanToCloud(user.id, p).catch(() => {});
                }
              }
            }).catch(() => {});
          }

          return {
            activeWorkout: nextActiveWorkout,
            exerciseDefaults: nextExerciseDefaults,
            plans: updatedPlans,
          };
        }),

      completeSet: (exerciseId, setId) =>
        set((s) => {
          if (!s.activeWorkout) return s;
          const { updatedWorkout } = applySetCompletionToWorkout(
            s.activeWorkout,
            exerciseId,
            setId,
            s.weightUnit,
            s.workouts,
            s.autoRestTimer !== false,
          );
          return { activeWorkout: updatedWorkout };
        }),

      completeNextSetAndStartRest: () => {
        let result: {
          exerciseId: string;
          setId: string;
          completedSetIndex: number;
          totalSets: number;
          doneSets: number;
        } | null = null;

        set((s) => {
          if (!s.activeWorkout) return s;
          const aw = s.activeWorkout;

          // Find the first exercise with an incomplete set
          let targetExId: string | null = null;
          let targetSetId: string | null = null;
          for (const we of aw.exercises) {
            const inc = we.sets.find((st) => !st.completed);
            if (inc) {
              targetExId = we.exerciseId;
              targetSetId = inc.id;
              break;
            }
          }

          if (!targetExId || !targetSetId) {
            return s;
          }

          const { updatedWorkout, completedSetIndex, totalSets, doneSets } = applySetCompletionToWorkout(
            aw,
            targetExId,
            targetSetId,
            s.weightUnit,
            s.workouts,
            s.autoRestTimer !== false,
          );

          result = {
            exerciseId: targetExId,
            setId: targetSetId,
            completedSetIndex,
            totalSets,
            doneSets,
          };

          return { activeWorkout: updatedWorkout };
        });

        return result;
      },

      startRestTimer: (rest) =>
        set((s) => {
          if (!s.activeWorkout) return s;
          return {
            activeWorkout: {
              ...s.activeWorkout,
              restTimer: {
                ...rest,
                targetEndTimeMs: Date.now() + rest.totalSeconds * 1000,
                paused: false,
              },
            },
          };
        }),

      pauseRestTimer: () =>
        set((s) => {
          const rt = s.activeWorkout?.restTimer;
          if (!s.activeWorkout || !rt || rt.paused) return s;
          const remainingSec = Math.max(0, Math.ceil((rt.targetEndTimeMs - Date.now()) / 1000));
          return {
            activeWorkout: {
              ...s.activeWorkout,
              restTimer: {
                ...rt,
                paused: true,
                remainingSecWhenPaused: remainingSec,
              },
            },
          };
        }),

      resumeRestTimer: () =>
        set((s) => {
          const rt = s.activeWorkout?.restTimer;
          if (!s.activeWorkout || !rt || !rt.paused) return s;
          const remainingSec = rt.remainingSecWhenPaused ?? 0;
          return {
            activeWorkout: {
              ...s.activeWorkout,
              restTimer: {
                ...rt,
                paused: false,
                remainingSecWhenPaused: undefined,
                targetEndTimeMs: Date.now() + remainingSec * 1000,
              },
            },
          };
        }),

      addRestSeconds: (sec) =>
        set((s) => {
          const rt = s.activeWorkout?.restTimer;
          if (!s.activeWorkout || !rt) return s;
          if (rt.paused) {
            const curRemaining = rt.remainingSecWhenPaused ?? 0;
            const nextRemaining = Math.max(5, curRemaining + sec);
            const nextTotal = Math.max(5, rt.totalSeconds + (sec > 0 ? sec : 0));
            return {
              activeWorkout: {
                ...s.activeWorkout,
                restTimer: {
                  ...rt,
                  totalSeconds: nextTotal,
                  remainingSecWhenPaused: nextRemaining,
                },
              },
            };
          } else {
            const curRemaining = Math.max(0, Math.ceil((rt.targetEndTimeMs - Date.now()) / 1000));
            const nextRemaining = Math.max(5, curRemaining + sec);
            const nextTotal = Math.max(5, rt.totalSeconds + (sec > 0 ? sec : 0));
            return {
              activeWorkout: {
                ...s.activeWorkout,
                restTimer: {
                  ...rt,
                  totalSeconds: nextTotal,
                  targetEndTimeMs: Date.now() + nextRemaining * 1000,
                },
              },
            };
          }
        }),

      clearRestTimer: () =>
        set((s) => {
          if (!s.activeWorkout || !s.activeWorkout.restTimer) return s;
          return {
            activeWorkout: {
              ...s.activeWorkout,
              restTimer: null,
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

      cancelActiveWorkout: () => {
        import('../lib/notifications').then(({ dismissActiveWorkoutNotification, syncWorkoutReminder }) => {
          dismissActiveWorkoutNotification();
          syncWorkoutReminder({ workouts: get().workouts, activeWorkout: null });
        }).catch(() => {});
        set({ activeWorkout: null });
      },

      finishWorkout: () => {
        const { activeWorkout } = get();
        if (!activeWorkout) return null;
        // Dismiss live tracking notification immediately
        import('../lib/notifications').then(({ dismissActiveWorkoutNotification }) => dismissActiveWorkoutNotification()).catch(() => {});
        // when finishing while paused, end the workout at the pause moment so
        // the recorded duration matches the displayed (frozen) elapsed time
        const end = activeWorkout.paused ? (activeWorkout.pausedAt ?? new Date().toISOString()) : new Date().toISOString();
        const finished: Workout = {
          ...activeWorkout,
          paused: undefined,
          pausedAt: undefined,
          restTimer: undefined,
          endTime: end,
        };
        const nextWorkouts = [...get().workouts, finished];
        set({
          workouts: nextWorkouts,
          activeWorkout: null,
        });
        // Sync evening notification reminder since user trained today
        import('../lib/notifications').then(({ syncWorkoutReminder }) => {
          syncWorkoutReminder({ workouts: nextWorkouts, activeWorkout: null });
        }).catch(() => {});
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) pushWorkoutToCloud(user.id, finished).catch(() => {});
        }).catch(() => {});
        return finished;
      },

      saveBuiltWorkout: (title, exercises, startTime, endTime) => {
        const built: Workout = {
          id: genId('w'),
          title,
          description: '',
          startTime,
          endTime,
          source: 'user',
          exercises,
        };
        const nextWorkouts = [
          ...get().workouts,
          built,
        ];
        set({
          workouts: nextWorkouts,
        });
        import('../lib/notifications').then(({ syncWorkoutReminder }) => {
          syncWorkoutReminder({ workouts: nextWorkouts, activeWorkout: get().activeWorkout });
        }).catch(() => {});
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) pushWorkoutToCloud(user.id, built).catch(() => {});
        }).catch(() => {});
      },

      addPlan: (plan) => {
        const nextDefs = { ...get().exerciseDefaults };
        let defsChanged = false;
        for (const e of plan.exercises) {
          if (e.targetWeightKg != null) {
            const numReps = parseInt(e.targetReps, 10);
            nextDefs[e.exerciseId] = {
              weightKg: e.targetWeightKg,
              reps: !isNaN(numReps) ? numReps : (nextDefs[e.exerciseId]?.reps ?? 10),
            };
            defsChanged = true;
          }
        }
        set((s) => ({
          plans: [...s.plans, plan],
          exerciseDefaults: defsChanged ? nextDefs : s.exerciseDefaults,
        }));
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) pushPlanToCloud(user.id, plan).catch(() => {});
        }).catch(() => {});
      },

      setPlans: (plans) => {
        set({ plans });
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) pushAllPlansToCloud(user.id, plans).catch(() => {});
        }).catch(() => {});
      },

      updatePlan: (id, plan) => {
        const nextDefs = { ...get().exerciseDefaults };
        let defsChanged = false;
        for (const e of plan.exercises) {
          if (e.targetWeightKg != null) {
            const numReps = parseInt(e.targetReps, 10);
            nextDefs[e.exerciseId] = {
              weightKg: e.targetWeightKg,
              reps: !isNaN(numReps) ? numReps : (nextDefs[e.exerciseId]?.reps ?? 10),
            };
            defsChanged = true;
          }
        }
        set((s) => ({
          plans: s.plans.map((p) => (p.id === id ? plan : p)),
          exerciseDefaults: defsChanged ? nextDefs : s.exerciseDefaults,
        }));
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) pushPlanToCloud(user.id, plan).catch(() => {});
        }).catch(() => {});
      },

      removePlan: (id) => {
        set((s) => ({
          plans: s.plans.filter((p) => p.id !== id),
        }));
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) removePlanFromCloud(user.id, id).catch(() => {});
        }).catch(() => {});
      },

      addMeasurement: (m) => {
        set((s) => ({
          measurements: [...s.measurements, m],
          profile: s.profile ? { ...s.profile, weightKg: m.weightKg } : s.profile,
        }));
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            pushMeasurementToCloud(user.id, m).catch(() => {});
            const cur = get().profile;
            if (cur) {
              import('../lib/auth').then(({ upsertProfile }) => {
                upsertProfile(user.id, { ...cur, weightKg: m.weightKg }).catch(() => {});
              });
            }
          }
        }).catch(() => {});
      },

      addManualPR: (pr) => {
        const item: ManualPR = { id: genId('pr'), ...pr };
        set((s) => ({
          manualPRs: [item, ...s.manualPRs],
        }));
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) pushManualPRToCloud(user.id, item).catch(() => {});
        }).catch(() => {});
      },

      removeManualPR: (id) => {
        set((s) => ({ manualPRs: s.manualPRs.filter((p) => p.id !== id) }));
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) removeManualPRFromCloud(user.id, id).catch(() => {});
        }).catch(() => {});
      },

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
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              for (const fw of fresh) {
                pushWorkoutToCloud(user.id, fw).catch(() => {});
              }
            }
          }).catch(() => {});
          const nextWorkouts = [...fresh, ...s.workouts];
          import('../lib/notifications').then(({ syncWorkoutReminder }) => {
            syncWorkoutReminder({ workouts: nextWorkouts, activeWorkout: s.activeWorkout });
          }).catch(() => {});
          return { workouts: nextWorkouts };
        }),

      replaceWorkouts: (imported) =>
        set(() => {
          const fresh = imported.map((w) => ({
            ...w,
            id: genId('w'),
            source: 'user' as const,
            exercises: w.exercises.map((we) => ({
              ...we,
              id: genId('we'),
              sets: we.sets.map((st) => ({ ...st, id: genId('s') })),
            })),
          }));
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              wipeUserWorkoutsInCloud(user.id).then(() => {
                for (const fw of fresh) {
                  pushWorkoutToCloud(user.id, fw).catch(() => {});
                }
              }).catch(() => {});
            }
          }).catch(() => {});
          import('../lib/notifications').then(({ syncWorkoutReminder }) => {
            syncWorkoutReminder({ workouts: fresh, activeWorkout: null });
          }).catch(() => {});
          return { workouts: fresh };
        }),

      clearAllData: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            await wipeAllUserDataInCloud(user.id);
          }
        } catch (e) {
          console.warn('Failed to wipe cloud data during clearAllData:', e);
        } finally {
          import('../lib/notifications').then(({ dismissActiveWorkoutNotification, syncWorkoutReminder }) => {
            dismissActiveWorkoutNotification();
            syncWorkoutReminder({ workouts: [], activeWorkout: null });
          }).catch(() => {});
          await AsyncStorage.removeItem('@nextrep_offline_sync_queue').catch(() => {});
          set({
            workouts: [],
            plans: [],
            measurements: [],
            favorites: [],
            friends: [],
            manualPRs: [],
            exerciseDefaults: {},
            activeWorkout: null,
            profile: null,
            onboarded: false,
            seeded: false,
          });
        }
      },

      clearSessionCache: () => {
        import('../lib/notifications').then(({ syncWorkoutReminder }) => {
          syncWorkoutReminder({ workouts: [], activeWorkout: null });
        }).catch(() => {});
        set({
          profile: null,
          workouts: [],
          plans: [],
          measurements: [],
          favorites: [],
          friends: [],
          manualPRs: [],
          exerciseDefaults: {},
          activeWorkout: null,
          onboarded: false,
          seeded: false,
        });
      },
    }),
    {
      name: 'nextrep-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        onboarded: s.onboarded,
        seeded: s.seeded,
        accentKey: s.accentKey,
        weightUnit: s.weightUnit,
        profile: s.profile,
        workouts: s.workouts,
        plans: s.plans,
        measurements: s.measurements,
        favorites: s.favorites,
        friends: s.friends,
        manualPRs: s.manualPRs,
        exerciseDefaults: s.exerciseDefaults,
        activeWorkout: s.activeWorkout,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Remove any legacy mock friends like 'f2'..'f6' ('Marcus Lee', etc.)
          if (state.friends && state.friends.length > 0) {
            const legacyIds = new Set(['f2', 'f3', 'f4', 'f5', 'f6']);
            const cleanFriends = state.friends.filter(
              (f) =>
                !legacyIds.has(f.id) &&
                f.id !== 'me' &&
                f.name !== 'Marcus Lee' &&
                f.name !== 'Sofia Reyes' &&
                f.name !== 'James Okafor' &&
                f.name !== 'Priya Nair' &&
                f.name !== 'Daniel Kim'
            );
            if (cleanFriends.length !== state.friends.length) {
              state.setFriends(cleanFriends);
            }
          }
          state.setHydrated();
        }
      },
    },
  ),
);

export const useNextRep = usePulse;

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
