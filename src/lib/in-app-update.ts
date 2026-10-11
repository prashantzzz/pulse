import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const PROMPT_KEY = '@nextrep_update_prompt';
const DAY_MS = 24 * 60 * 60 * 1000;
const CHECK_DELAY_MS = 5000;

interface PromptRecord {
  version: string;
  at: number;
}

/**
 * The prompt is allowed when this published version has not been shown in the
 * last 24 hours (a newly published version always prompts).
 */
export function shouldPromptForUpdate(
  stored: PromptRecord | null,
  storeVersion: string,
  now: number,
): boolean {
  if (!stored || stored.version !== storeVersion) return true;
  return now - stored.at >= DAY_MS;
}

let scheduled = false;

/**
 * Android-only Play Store in-app update prompt (immediate flow).
 *
 * - Release Android builds only: dev builds, iOS and web are no-ops. The
 *   native module is imported lazily so it can never affect app startup.
 * - Deferred and fire-and-forget; every failure is swallowed.
 * - Never prompts while a workout is active.
 * - Asks at most once per day per published version.
 */
export function schedulePlayStoreUpdateCheck(getHasActiveWorkout: () => boolean): void {
  if (Platform.OS !== 'android' || __DEV__ || scheduled) return;
  scheduled = true;
  setTimeout(() => {
    void runUpdateCheck(getHasActiveWorkout).finally(() => {
      scheduled = false;
    });
  }, CHECK_DELAY_MS);
}

async function runUpdateCheck(getHasActiveWorkout: () => boolean): Promise<void> {
  try {
    if (getHasActiveWorkout()) return;

    const updates = await import('expo-in-app-updates');
    const info = await updates.checkForUpdate();
    if (!info.updateAvailable || !info.immediateAllowed) return;

    let stored: PromptRecord | null = null;
    try {
      const raw = await AsyncStorage.getItem(PROMPT_KEY);
      stored = raw ? (JSON.parse(raw) as PromptRecord) : null;
    } catch {
      stored = null;
    }
    if (!shouldPromptForUpdate(stored, info.storeVersion, Date.now())) return;

    await AsyncStorage.setItem(
      PROMPT_KEY,
      JSON.stringify({ version: info.storeVersion, at: Date.now() }),
    ).catch(() => {});
    await updates.startUpdate(true);
  } catch {
    // An update check must never affect the app.
  }
}
