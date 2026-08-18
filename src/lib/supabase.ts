/**
 * Supabase client for PULSE.
 *
 * Configure via environment variables:
 *   EXPO_PUBLIC_SUPABASE_URL   — project URL (e.g. https://xyz.supabase.co)
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY — anon/public key
 *
 * Persists user session to AsyncStorage for mobile/offline support.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { Database } from './database.types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Type-safe Supabase client configured with AsyncStorage persistence.
 */
export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  },
);

/** Whether Supabase credentials are configured */
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('placeholder.supabase.co') &&
    SUPABASE_ANON_KEY !== 'placeholder-key',
);
