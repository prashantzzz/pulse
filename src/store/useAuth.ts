import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { fetchProfile, signOut as authSignOut, syncGoogleProfile, type ProfileRow } from '../lib/auth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { usePulse } from './useStore';
import type { UserProfile } from '../types';
import { syncUserDataFromCloud, flushOfflineSyncQueue } from '../lib/sync';
import { dismissActiveWorkoutNotification } from '../lib/notifications';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;

  setSession: (session: Session | null) => void;
  initialize: () => () => void;
  signOut: () => Promise<void>;
  syncProfileFromCloud: (userId: string) => Promise<ProfileRow | null>;
  syncUserData: (userId: string) => Promise<boolean>;
}

function mapRowToUserProfile(row: ProfileRow): UserProfile {
  return {
    name: row.display_name ?? 'Athlete',
    gender: (row.gender as 'male' | 'female') ?? 'male',
    goal: row.goal ?? ['Build Muscle'],
    experience: (row.experience_level as 'Beginner' | 'Intermediate' | 'Advanced') ?? 'Beginner',
    frequencyPerWeek: row.training_frequency ?? 3,
    equipment: row.equipment ?? [],
    style: row.preferred_training_style ?? [],
    trainingAgeMonths: row.training_age_months ?? 0,
    onboarded: row.onboarded ?? false,
    avatarUrl: row.avatar_url ? `${row.avatar_url}?t=${Date.now()}` : undefined,
  };
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  isInitialized: false,
  isAuthenticated: false,

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.user),
    });
  },

  syncProfileFromCloud: async (userId: string) => {
    try {
      const row = await fetchProfile(userId);
      if (row) {
        const localProfile = mapRowToUserProfile(row);
        usePulse.setState({
          profile: localProfile,
          onboarded: row.onboarded ?? false,
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
      set({ isLoading: false, isInitialized: true });
      return () => {};
    }

    // 1. Check existing cached session from AsyncStorage
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        set({
          session,
          user: session?.user ?? null,
          isAuthenticated: Boolean(session?.user),
          isLoading: false,
          isInitialized: true,
        });

        if (session?.user) {
          await syncUserDataFromCloud(session.user.id);
          await flushOfflineSyncQueue();
        }
      })
      .catch((err) => {
        console.warn('Error reading stored session:', err);
        set({ isLoading: false, isInitialized: true });
      });

    // 2. Subscribe to auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      set({
        session,
        user,
        isAuthenticated: Boolean(user),
        isLoading: false,
      });

      if (event === 'SIGNED_IN' && user) {
        // If logged in via Google OAuth, sync avatar and name if needed
        await syncGoogleProfile(user);
        await syncUserDataFromCloud(user.id);
        await flushOfflineSyncQueue();
      } else if (event === 'SIGNED_OUT') {
        dismissActiveWorkoutNotification().catch(() => {});
        usePulse.getState().clearSessionCache();
        AsyncStorage.removeItem('@nextrep_offline_sync_queue').catch(() => {});
      }
    });

    // Return cleanup function
    return () => {
      subscription.unsubscribe();
    };
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await authSignOut();
    } finally {
      // 1. Clear any active workout notification
      dismissActiveWorkoutNotification().catch(() => {});
      // 2. Clear all local user session state and profile cache so the next user starts completely fresh
      usePulse.getState().clearSessionCache();
      // 3. Clear offline sync queue
      AsyncStorage.removeItem('@nextrep_offline_sync_queue').catch(() => {});
      // 4. Reset auth state
      set({
        session: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
