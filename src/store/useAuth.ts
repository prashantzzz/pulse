import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { fetchProfile, signOut as authSignOut, syncGoogleProfile, type ProfileRow } from '../lib/auth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { usePulse } from './useStore';
import type { UserProfile } from '../types';
import { syncUserDataFromCloud, flushOfflineSyncQueue, backupPlansForUser } from '../lib/sync';
import { dismissActiveWorkoutNotification } from '../lib/notifications';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  isVerifyingUser: boolean;

  setSession: (session: Session | null) => void;
  setIsVerifyingUser: (val: boolean) => void;
  initialize: () => () => void;
  signOut: () => Promise<void>;
  syncProfileFromCloud: (userId: string) => Promise<ProfileRow | null>;
  syncUserData: (userId: string) => Promise<boolean>;
}

function mapRowToUserProfile(row: ProfileRow, currentProfile?: UserProfile | null): UserProfile {
  return {
    name: row.display_name ?? currentProfile?.name ?? 'Athlete',
    gender: (row.gender as 'male' | 'female') ?? currentProfile?.gender ?? 'male',
    goal: row.goal ?? currentProfile?.goal ?? ['Build Muscle'],
    experience: (row.experience_level as 'Beginner' | 'Intermediate' | 'Advanced') ?? currentProfile?.experience ?? 'Beginner',
    frequencyPerWeek: row.training_frequency ?? currentProfile?.frequencyPerWeek ?? 3,
    equipment: row.equipment ?? currentProfile?.equipment ?? [],
    style: row.preferred_training_style ?? currentProfile?.style ?? [],
    trainingAgeMonths: row.training_age_months ?? currentProfile?.trainingAgeMonths ?? 0,
    onboarded: row.onboarded ?? currentProfile?.onboarded ?? false,
    avatarUrl: row.avatar_url ? `${row.avatar_url}?t=${Date.now()}` : currentProfile?.avatarUrl,
    heightCm: row.height_cm != null ? Number(row.height_cm) : currentProfile?.heightCm,
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : currentProfile?.weightKg,
    weightUnit: (row.weight_unit as 'kg' | 'lbs') ?? currentProfile?.weightUnit,
  };
}

export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: true,
  isInitialized: false,
  isAuthenticated: false,
  isVerifyingUser: false,

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.user),
    });
  },

  setIsVerifyingUser: (val) => set({ isVerifyingUser: val }),

  syncProfileFromCloud: async (userId: string) => {
    try {
      const row = await fetchProfile(userId);
      if (row) {
        const state = usePulse.getState();
        const currentProfile = state.profile;
        const currentMeasurements = state.measurements;
        const latestMeasurementWeight = currentMeasurements.length > 0
          ? currentMeasurements[currentMeasurements.length - 1].weightKg
          : undefined;

        const localProfile = mapRowToUserProfile(row, currentProfile);
        if (localProfile.weightKg == null && latestMeasurementWeight != null) {
          localProfile.weightKg = latestMeasurementWeight;
        }

        usePulse.setState({
          profile: localProfile,
          onboarded: row.onboarded ?? currentProfile?.onboarded ?? false,
          ...(localProfile.weightUnit ? { weightUnit: localProfile.weightUnit } : {}),
        });
        return row;
      }
    } catch (e) {
      console.warn('Failed to sync profile from cloud:', e);
    }
    return null;
  },

  syncUserData: async (userId: string) => {
    return await syncUserDataFromCloud(userId);
  },

  initialize: () => {
    // Flush any pending offline queue on start
    flushOfflineSyncQueue().catch(() => {});

    if (!isSupabaseConfigured) {
      set({ isLoading: false, isInitialized: true, isVerifyingUser: false });
      return () => {};
    }

    // 1. Check existing cached session from AsyncStorage
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          set({
            session,
            user: session.user,
            isAuthenticated: true,
            isVerifyingUser: false,
            isLoading: false,
            isInitialized: true,
          });

          // Sync cloud user data and flush offline queue in the background
          syncUserDataFromCloud(session.user.id)
            .then(() => flushOfflineSyncQueue())
            .catch((err) => {
              console.warn('Error syncing cloud user on start:', err);
            });
        } else {
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isVerifyingUser: false,
            isInitialized: true,
          });
        }
      })
      .catch((err) => {
        console.warn('Error reading stored session:', err);
        set({ isLoading: false, isInitialized: true, isVerifyingUser: false });
      });

    // 2. Subscribe to auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;

      if (event === 'SIGNED_IN' && user) {
        const alreadyAuth = get().isAuthenticated && get().user?.id === user.id && !get().isVerifyingUser;

        if (alreadyAuth) {
          set({ session, user });
          syncUserDataFromCloud(user.id).catch(() => {});
          return;
        }

        // Account switch without a SIGNED_OUT event (e.g. picking another
        // Google account while still signed in): never let the previous user's
        // local data leak into — or overwrite — the next account's cloud data.
        const previousUser = get().user;
        if (previousUser && previousUser.id !== user.id) {
          backupPlansForUser(previousUser.id, usePulse.getState().plans).catch(() => {});
          usePulse.getState().clearSessionCache();
          AsyncStorage.removeItem('@nextrep_offline_sync_queue').catch(() => {});
        }

        set({
          session,
          user,
          isAuthenticated: true,
          isVerifyingUser: true,
          isLoading: false,
        });

        try {
          // If logged in via Google OAuth, sync avatar and name if needed
          await syncGoogleProfile(user).catch(() => {});
          await Promise.race([
            syncUserDataFromCloud(user.id),
            new Promise((resolve) => setTimeout(resolve, 6000)),
          ]);
          await flushOfflineSyncQueue().catch(() => {});
        } catch (err) {
          console.warn('Error syncing cloud user on SIGNED_IN:', err);
        } finally {
          set({ isVerifyingUser: false, isInitialized: true });
        }
      } else if (event === 'SIGNED_OUT') {
        // Preserve the signing-out user's routine in the local per-user backup
        // before the cache is wiped, so it can be restored if the cloud copy is
        // ever unreachable.
        const signedOutUserId = get().user?.id;
        if (signedOutUserId) {
          backupPlansForUser(signedOutUserId, usePulse.getState().plans).catch(() => {});
        }
        dismissActiveWorkoutNotification().catch(() => {});
        usePulse.getState().clearSessionCache();
        // Clear offline sync queue and any pending deep-link invites so a
        // crafted invite stored before login cannot affect the next user.
        AsyncStorage.removeItem('@nextrep_offline_sync_queue').catch(() => {});
        AsyncStorage.removeItem('@nextrep_pending_invite').catch(() => {});
        set({
          session: null,
          user: null,
          isAuthenticated: false,
          isVerifyingUser: false,
          isLoading: false,
        });
      } else if (session) {
        set({
          session,
          user,
          isAuthenticated: Boolean(user),
          isLoading: false,
        });
      }
    });

    // Return cleanup function
    return () => {
      subscription.unsubscribe();
    };
  },

  signOut: async () => {
    set({ isLoading: true });
    // Capture the routine before the SIGNED_OUT handler clears the cache, and
    // store it in the per-user local backup.
    const signedOutUserId = get().user?.id;
    const plansAtSignOut = usePulse.getState().plans;
    try {
      await authSignOut();
    } finally {
      if (signedOutUserId) {
        backupPlansForUser(signedOutUserId, plansAtSignOut).catch(() => {});
      }
      // 1. Clear any active workout notification
      dismissActiveWorkoutNotification().catch(() => {});
      // 2. Clear all local user session state and profile cache so the next user starts completely fresh
      usePulse.getState().clearSessionCache();
      // 3. Clear offline sync queue and pending deep-link invites
      AsyncStorage.removeItem('@nextrep_offline_sync_queue').catch(() => {});
      AsyncStorage.removeItem('@nextrep_pending_invite').catch(() => {});
      // 4. Reset auth state
      set({
        session: null,
        user: null,
        isAuthenticated: false,
        isVerifyingUser: false,
        isLoading: false,
      });
    }
  },
}));
