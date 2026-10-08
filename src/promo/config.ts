/**
 * Promo build configuration.
 *
 * This entire `src/promo/` layer exists only on the `promo/kinetic` branch to
 * produce the marketing screen recordings. When `enabled` is false every hook
 * in the app is a pure pass-through and the product behaves exactly like the
 * shipped app (useful for A/B checking a recording against normal mode).
 */
import { Platform } from 'react-native';

export const PROMO_ENABLED = true;

export const PROMO = {
  enabled: PROMO_ENABLED,

  /** Shift every seeded workout so the most recent session lands on today. */
  shiftToToday: true,
  /** Re-time the most recent session to "finished ~75 minutes ago". */
  clampLatestToNow: true,

  /** Web-only presentation extras. */
  hud: Platform.OS === 'web',
  clickRipple: Platform.OS === 'web',
  confettiOnSummary: Platform.OS === 'web',

  /** Entrance choreography tunables. */
  staggerMs: 55,
  staggerFastMs: 35,
  /** Auto-cascade resets after this much silence. */
  seqQuietMs: 160,
  /** Hard cap for a single element's cascade delay. */
  maxDelayMs: 1200,
  durationMs: {
    rise: 420,
    hero: 620,
    pop: 380,
    row: 320,
  },
  /** Press S to slow every entrance down for buttery retakes. */
  slowMoFactor: 1.6,
  /** Numbers count up for this long, this long after their card lands. */
  countUpMs: 720,
  countUpDelayMs: 140,
} as const;
