/**
 *
 * This entire `src/promo/` layer exists only on the `promo/kinetic` branch to
 * produce the marketing screen recordings. When `enabled` is false every hook
 * in the app is a pure pass-through and the product behaves exactly like the
 * shipped app (useful for A/B checking a recording against normal mode).
 *
 * Motion intensity is intentionally "promo-max": strong choreography, real
 * data-viz reveals and interaction feedback — but with the doc's guardrails
 * (no bouncing, no flashing, interactions never blocked).
 */
import { Platform } from 'react-native';

export const PROMO_ENABLED = true;

export type PromoMotionMode = 'full' | 'reduced' | 'auto';

/**
 * `?motion=full|reduced|auto` URL override.
 *
 * The promo build defaults to FULL motion: its sole purpose is producing
 * full-fidelity footage, so it must animate even on machines with the OS
 * "reduce motion" preference enabled (which is also headless browsers'
 * default). `?motion=reduced` forces the accessible path for testing, and
 * `?motion=auto` restores following the OS preference.
 */
function resolveMotionOverride(): PromoMotionMode {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'full';
  try {
    const v = new URLSearchParams(window.location.search).get('motion');
    if (v === 'full' || v === 'reduced' || v === 'auto') return v;
  } catch {
    /* ignore malformed URLs */
  }
  return 'full';
}

export const PROMO = {
  enabled: PROMO_ENABLED,
  motion: resolveMotionOverride(),

  // ---- promo footage demo overrides (NEVER merge to main) -------------------
  /**
   * PROMO-ONLY DEMO OVERRIDE. Displays this fixed streak everywhere the
   * *current* streak is shown (Home chip, Consistency card) regardless of the
   * real training history. The store, stats and all logic keep using the true
   * values — only the rendered number is replaced, for footage purposes.
   * Set to null to show the real streak.
   */
  demoStreakDays: 61 as number | null,

  // ---- promo data -----------------------------------------------------------
  /** Shift every seeded workout so the most recent session lands on today. */
  shiftToToday: true,
  /** Re-time the most recent session to "finished ~75 minutes ago". */
  clampLatestToNow: true,

  // ---- web presentation extras ---------------------------------------------
  hud: Platform.OS === 'web',
  clickRipple: Platform.OS === 'web',
  confettiOnSummary: Platform.OS === 'web',

  // ---- sequencing -----------------------------------------------------------
  /** Auto-cascade resets after this much silence. */
  seqQuietMs: 160,
  /** Hard cap for a single element's cascade delay. */
  maxDelayMs: 1200,
  /** Elements revealed long after mount collapse into this short wave. */
  staleDelayMs: 130,

  /** Stagger between adjacent elements (ms). */
  stagger: {
    base: 45,
    fast: 35,
    slow: 70,
  },

  /** Duration vocabulary (ms). */
  duration: {
    /** small icon/button feedback */
    micro: 160,
    /** filter/tab selection */
    selection: 220,
    /** standard content entrance */
    content: 300,
    /** card entrance */
    card: 380,
    /** hero card entrance (blur + scale + rise) */
    hero: 520,
    /** larger section/panel transition */
    panel: 420,
    /** numeric count-up */
    counter: 850,
    /** delay after a card lands before its numbers count */
    counterDelayMs: 130,
    /** base chart reveal duration */
    chart: 950,
    /** pop (chips, badges, check marks) */
    pop: 260,
  },

  /** Translation distances (logical points) — deliberately small. */
  travel: {
    content: 10,
    card: 14,
    hero: 16,
    row: 10,
  },

  /** Web hero blur amount (px) that melts away during the entrance. */
  heroBlurPx: 8,

  /** Press S to slow every entrance down for buttery retakes. */
  slowMoFactor: 1.6,
} as const;
