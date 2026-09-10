import { Platform } from 'react-native';

// Require the local rest chime asset
const REST_OVER_SOUND_ASSET = require('../../assets/sounds/rest_over.mp3');

let lastPlayedRestEndTimeMs = 0;
let audioPlayerInstance: any = null;

/**
 * Configure audio mode and play the rest_over.mp3 chime once.
 * Uses audio ducking (`interruptionMode: 'duckOthers'`) on mobile so that background
 * music from Spotify, YouTube Music, or podcasts does NOT pause — it smoothly dips
 * volume, plays the short chime, and immediately restores full volume.
 *
 * @param restEndTimeMs Optional timestamp of the rest timer's planned end to deduplicate
 *                      and ensure it plays strictly once per rest session.
 * @returns boolean indicating whether the sound was played.
 */
export async function playRestOverSound(restEndTimeMs?: number): Promise<boolean> {
  // Deduplication: do not play multiple times for the same rest period
  if (restEndTimeMs && restEndTimeMs === lastPlayedRestEndTimeMs) {
    return false;
  }
  if (restEndTimeMs) {
    lastPlayedRestEndTimeMs = restEndTimeMs;
  }

  if (Platform.OS === 'web') {
    try {
      if (typeof Audio !== 'undefined') {
        const audio = new Audio(REST_OVER_SOUND_ASSET);
        await audio.play();
        return true;
      }
    } catch {
      // Browser autoplay policy might block audio without user interaction
    }
    return false;
  }

  try {
    const { createAudioPlayer, setAudioModeAsync } = require('expo-audio');

    // Configure system audio session: duck other media without pausing it
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
      shouldPlayInBackground: false,
    });

    if (!audioPlayerInstance) {
      audioPlayerInstance = createAudioPlayer(REST_OVER_SOUND_ASSET);
    } else {
      if (typeof audioPlayerInstance.seekTo === 'function') {
        await audioPlayerInstance.seekTo(0);
      }
    }

    if (audioPlayerInstance) {
      audioPlayerInstance.volume = 1.0;
      if (typeof audioPlayerInstance.play === 'function') {
        audioPlayerInstance.play();
      }
      return true;
    }
  } catch (err) {
    console.warn('Could not play rest over sound:', err);
  }

  return false;
}

/**
 * Reset deduplication tracker (e.g. on workout start, skip rest, or test resets).
 */
export function resetRestSoundDeduplication(): void {
  lastPlayedRestEndTimeMs = 0;
}
