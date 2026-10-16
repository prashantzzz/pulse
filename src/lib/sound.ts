import { Platform } from 'react-native';

// Require the local rest chime asset
const REST_OVER_SOUND_ASSET = require('../../assets/sounds/rest_over.mp3');

// rest_over.mp3 is ~1.15s long — release the player well after its tail so a
// slow start can never clip it, but soon enough that we never look like an
// active media session for longer than a moment.
const CHIME_RELEASE_DELAY_MS = 3000;

let lastPlayedRestEndTimeMs = 0;
// The most recent chime player awaiting release. expo-audio builds a native
// MediaSession for every player, and the OS routes headset play-button presses
// to the most recently active session — so a never-released player keeps OUR
// session on top forever, and tapping play replays the ting instead of
// resuming the user's own media (Spotify, podcasts, ...).
let lingeringChimePlayer: any = null;

function releaseChimePlayer(player: any): void {
  try {
    if (!player) return;
    if (typeof player.remove === 'function') player.remove();
    else if (typeof player.release === 'function') player.release();
  } catch {
    // Already released — nothing to do.
  }
}

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

    // Fresh player per chime, released right after playback. Reusing one
    // player forever (the old singleton) kept its MediaSession alive
    // indefinitely, so the OS kept routing headset play-button presses to us.
    // Release any previous chime first: if its delayed release never ran (the
    // OS can suspend our timers while backgrounded), it would otherwise leak
    // its session until the next foreground.
    releaseChimePlayer(lingeringChimePlayer);
    lingeringChimePlayer = null;

    const player = createAudioPlayer(REST_OVER_SOUND_ASSET);
    lingeringChimePlayer = player;
    player.volume = 1.0;
    if (typeof player.play === 'function') {
      player.play();
    }
    setTimeout(() => {
      if (lingeringChimePlayer === player) {
        lingeringChimePlayer = null;
        releaseChimePlayer(player);
      }
    }, CHIME_RELEASE_DELAY_MS);
    return true;
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
