/**
 * Authentication and Profile Identity service for PULSE.
 *
 * Provides high-level methods for Email authentication, Google OAuth (via Expo WebBrowser
 * and custom URL scheme deep linking), session management, and profile synchronization.
 */

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import type { Database } from './database.types';
import { isSupabaseConfigured, supabase } from './supabase';
import type { UserProfile } from '../types';
import type { Session, User } from '@supabase/supabase-js';

// Configure Google Sign-In for native platforms
if (Platform.OS !== 'web') {
  GoogleSignin.configure({
    // Required: Get this from Google Cloud Console (Web Client ID)
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '', 
  });
}

// Complete any auth session on web if applicable
WebBrowser.maybeCompleteAuthSession();

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format using standard RFC-compatible pattern.
 */
export function isValidEmail(email: string): boolean {
  return Boolean(email && EMAIL_REGEX.test(email.trim()));
}

/**
 * Guard an async auth operation with a client-side timeout so hanging network calls don't freeze the UI.
 */
export function withAuthTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 15000,
  timeoutMessage = 'Connection timed out. Please check your internet connection and try again.'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Format raw error objects into clean, user-friendly messages.
 */
export function formatAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';
  if (typeof error === 'string') return error;

  const msg = (error as { message?: string }).message ?? '';
  const lower = msg.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant') || lower.includes('invalid email or password')) {
    return 'Invalid email or password.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists.';
  }
  if (lower.includes('password should be at least') || lower.includes('password is too short')) {
    return 'Password must be at least 6 characters.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please check your email to confirm your account.';
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch') || lower.includes('network request failed')) {
    return 'Network connection issue. Please check your internet connection.';
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'Connection timed out. Please check your internet connection and try again.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('over_email_send_rate_limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (lower.includes('user_banned') || lower.includes('banned') || lower.includes('account has been disabled')) {
    return 'This account has been suspended or disabled.';
  }
  if (lower.includes('code: 10') || lower.includes('developer_error') || lower.includes('code 10')) {
    return 'Google Sign-In configuration mismatch (Code 10). Please verify Google Cloud SHA-1 fingerprint and Web Client ID.';
  }
  if (lower.includes('play services') || lower.includes('play_services')) {
    return 'Google Play Services is unavailable or needs to be updated.';
  }
  if (lower.includes('unauthorized') || lower.includes('jwt')) {
    return 'Session expired. Please sign in again.';
  }
  if (lower.includes('cancel') || lower.includes('dismissed')) {
    return 'Sign in was cancelled.';
  }

  return msg || 'Authentication request failed. Please try again.';
}

/**
 * Extract query parameters and hash fragment parameters from a deep-link callback URL.
 */
export function extractParamsFromUrl(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!url) return params;

  try {
    // 1. Check query parameters (?foo=bar&baz=qux)
    const queryIndex = url.indexOf('?');
    const hashIndex = url.indexOf('#');

    let queryString = '';
    if (queryIndex !== -1) {
      queryString = hashIndex !== -1 && hashIndex > queryIndex
        ? url.slice(queryIndex + 1, hashIndex)
        : url.slice(queryIndex + 1);
    }

    if (queryString) {
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }

    // 2. Check hash fragment parameters (#access_token=...&refresh_token=...)
    let hashString = '';
    if (hashIndex !== -1) {
      hashString = url.slice(hashIndex + 1);
    }

    if (hashString) {
      const hashParams = new URLSearchParams(hashString);
      hashParams.forEach((value, key) => {
        params[key] = value;
      });
    }
  } catch {
    // URL parse fallback for malformed or custom schemes
    const matches = url.match(/[?&#]([^=#]+)=([^&#]*)/g);
    if (matches) {
      matches.forEach((match) => {
        const parts = match.slice(1).split('=');
        if (parts.length === 2) {
          params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
        }
      });
    }
  }

  return params;
}

/**
 * Parse an incoming callback URL (from deep linking or WebBrowser) and establish session.
 */
export async function handleAuthUrl(url: string): Promise<Session | null> {
  if (!url) return null;
  const params = extractParamsFromUrl(url);

  if (params.error_description || params.error) {
    throw new Error(params.error_description || params.error);
  }

  // PKCE code exchange
  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }

  // Token-based hash redirect
  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return data.session;
  }

  return null;
}

/**
 * Sign up with email and password.
 */
export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured yet. Please provide your Supabase credentials in .env.');
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  return await withAuthTimeout(
    (async () => {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: displayName?.trim() || cleanEmail.split('@')[0],
          },
        },
      });

      if (error) throw error;
      return data;
    })()
  );
}

/**
 * Sign in with email and password.
 */
export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured yet. Please provide your Supabase credentials in .env.');
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  return await withAuthTimeout(
    (async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;
      return data;
    })()
  );
}

/**
 * Initiate Google Sign-In using Supabase OAuth and Expo WebBrowser / deep link.
 */
export async function signInWithGoogle(): Promise<{ cancelled?: boolean; session?: Session | null }> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured yet. Please provide your Supabase credentials in .env.');
  }

  // Native Android / iOS implementation using @react-native-google-signin/google-signin
  if (Platform.OS !== 'web') {
    return await withAuthTimeout(
      (async () => {
        try {
          const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
          if (!webClientId) {
            throw new Error('Google Web Client ID is not configured in the app build. Please check EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
          }

          GoogleSignin.configure({
            webClientId,
          });

          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
          const response = await GoogleSignin.signIn();

          if (isSuccessResponse(response)) {
            const idToken = response.data?.idToken;

            if (!idToken) {
              throw new Error('Google did not return an ID token. Verify that your Web Client ID is valid and configured.');
            }

            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: idToken,
            });

            if (error) throw error;
            if (!data?.session) {
              throw new Error('Authentication succeeded with Google but Supabase did not create a session. Please check your Supabase Google provider settings.');
            }

            return { session: data.session };
          } else {
            // sign in was cancelled by user
            return { cancelled: true };
          }
        } catch (error: any) {
          if (isErrorWithCode(error)) {
            switch (error.code) {
              case statusCodes.IN_PROGRESS:
                return { cancelled: true };
              case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                throw new Error('Google Play Services is unavailable or needs to be updated.');
              case statusCodes.SIGN_IN_CANCELLED:
                return { cancelled: true };
              default:
                throw new Error(error.message || 'Google sign-in failed (Code: ' + error.code + ')');
            }
          } else {
            throw error;
          }
        }
      })(),
      30000,
      'Google sign-in timed out. Please try again.'
    );
  }

  // Web fallback using OAuth (redirects to Supabase)
  const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        prompt: 'select_account', // Forces Google to show the account chooser on the web
      },
    },
  });
  if (error) throw error;
  return {};
}

/**
 * Send password reset email.
 */
export async function sendPasswordResetEmail(email: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured yet. Please provide your Supabase credentials in .env.');
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  const redirectUrl = Platform.OS === 'web'
    ? (typeof window !== 'undefined' ? `${window.location.origin}/auth/reset-password` : undefined)
    : Linking.createURL('auth/reset-password', { scheme: 'nextrep' });

  return await withAuthTimeout(
    (async () => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;
      return data;
    })()
  );
}

/**
 * Update password for currently authenticated session.
 */
export async function updatePassword(newPassword: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured yet. Please provide your Supabase credentials in .env.');
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out of current Supabase session.
 */
export async function signOut() {
  if (!isSupabaseConfigured) return;

  // Sign out of native Google session to force account picker on next login
  if (Platform.OS !== 'web') {
    try {
      await GoogleSignin.signOut();
    } catch (err) {
      // User might not have signed in with Google natively; safe to ignore
    }
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    // Ignore offline error when signing out locally
    console.warn('Sign out warning:', error.message);
  }
}

/**
 * Fetch profile row from `profiles` table.
 */
export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  if (!isSupabaseConfigured || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Failed to fetch user profile:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Network error while fetching profile:', err);
    return null;
  }
}

/**
 * Idempotently create or update user profile row.
 */
export async function upsertProfile(
  userId: string,
  profile: Partial<UserProfile> & { display_name?: string; avatar_url?: string },
): Promise<ProfileRow | null> {
  if (!isSupabaseConfigured || !userId) return null;

  try {
    const payload: Database['public']['Tables']['profiles']['Insert'] = {
      id: userId,
      display_name: profile.display_name ?? profile.name ?? 'Athlete',
      avatar_url: profile.avatarUrl ?? profile.avatar_url ?? null,
      gender: profile.gender ?? 'male',
      goal: profile.goal ?? [],
      experience_level: profile.experience ?? 'Beginner',
      training_frequency: profile.frequencyPerWeek ?? 3,
      preferred_training_style: profile.style ?? [],
      training_age_months: profile.trainingAgeMonths ?? 0,
      equipment: profile.equipment ?? [],
      onboarded: profile.onboarded ?? false,
      height_cm: profile.heightCm ?? null,
      weight_kg: profile.weightKg ?? null,
      weight_unit: profile.weightUnit ?? null,
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload as never)
      .select('*')
      .maybeSingle();

    if (error) {
      console.warn('Failed to upsert user profile:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Network error while upserting profile:', err);
    return null;
  }
}

/**
 * Ensure a profile row exists after Google login without overwriting existing custom settings.
 */
export async function syncGoogleProfile(user: User): Promise<ProfileRow | null> {
  if (!isSupabaseConfigured || !user?.id) return null;

  try {
    const existing = await fetchProfile(user.id);
    if (existing) {
      return existing;
    }

    const metadata = user.user_metadata ?? {};
    const displayName = metadata.full_name ?? metadata.name ?? metadata.display_name ?? user.email?.split('@')[0] ?? 'Athlete';
    const avatarUrl = metadata.avatar_url ?? metadata.picture ?? null;

    return await upsertProfile(user.id, {
      name: displayName,
      display_name: displayName,
      avatar_url: avatarUrl,
      onboarded: false,
    });
  } catch (err) {
    console.warn('Failed to sync Google profile:', err);
    return null;
  }
}
