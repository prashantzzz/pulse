/* eslint-disable react-hooks/refs --
 * Promo motion code keeps Animated values, cascade slots and play keys in refs:
 * they are imperative animation state that must not trigger re-renders. Slot
 * assignment intentionally happens during render (parents before children) so
 * cascades order top-down. Same convention as draggable-plan-list.tsx.
 */
/**
 * Shared motion utilities: easing vocabulary, reduced-motion handling and a
 * cancel-safe JS-thread driver used by the data-viz reveal effects.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Easing, Platform } from 'react-native';
import { PROMO } from './config';

/** Easing vocabulary used across the whole motion system. */
export const EASE = {
  /** entrances — fast start, gentle settle (expo-out feel) */
  entrance: Easing.bezier(0.16, 1, 0.3, 1),
  /** generic state changes */
  standard: Easing.bezier(0.4, 0, 0.2, 1),
  /** overshoot for small interactive pops */
  pop: Easing.bezier(0.34, 1.56, 0.64, 1),
  /** exits */
  exit: Easing.bezier(0.76, 0, 0.24, 1),
  /** chart/ring sweeps — crisp, even motion */
  sweep: Easing.bezier(0.22, 0.61, 0.36, 1),
} as const;

/** Synchronous reduced-motion resolution (URL override > OS preference). */
export function prefersReducedMotionSync(): boolean {
  if (PROMO.motion === 'full') return false;
  if (PROMO.motion === 'reduced') return true;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Reactive reduced-motion flag.
 * - respects `?motion=full|reduced` overrides,
 * - otherwise follows the OS preference (web media query / native setting).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(prefersReducedMotionSync);

  useEffect(() => {
    if (PROMO.motion !== 'auto') return;

    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const onChange = () => setReduced(mq.matches);
      onChange();
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
      }
      // Safari < 14 fallback
      const legacy = mq as unknown as {
        addListener?: (cb: () => void) => void;
        removeListener?: (cb: () => void) => void;
      };
      legacy.addListener?.(onChange);
      return () => legacy.removeListener?.(onChange);
    }

    // Native: sync once + subscribe to changes.
    let sub: { remove?: () => void } | undefined;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => setReduced(Boolean(v)))
      .catch(() => {});
    const add = (
      AccessibilityInfo as unknown as {
        addEventListener?: (name: string, cb: (v: boolean) => void) => { remove?: () => void };
      }
    ).addEventListener;
    if (add) {
      sub = add('reduceMotionChanged', (v) => setReduced(Boolean(v)));
    }
    return () => sub?.remove?.();
  }, []);

  return reduced;
}

/**
 * Cancel-safe timed driver running on the JS thread.
 *
 * Used by web DOM writers and staggered data-viz reveals where Animated values
 * would force a React re-render per frame. Always returns a cancel function —
 * call it in effect cleanups.
 */
export function driveNumber(opts: {
  duration: number;
  delay?: number;
  easing?: (t: number) => number;
  onUpdate: (eased: number) => void;
  onDone?: () => void;
}): () => void {
  const ease = opts.easing ?? EASE.entrance;
  const delay = opts.delay ?? 0;
  let raf = 0;
  let startAt = 0;
  let cancelled = false;

  const step = (now: number) => {
    if (cancelled) return;
    if (!startAt) startAt = now + delay;
    const raw = opts.duration <= 0 ? 1 : Math.max(0, Math.min(1, (now - startAt) / opts.duration));
    opts.onUpdate(ease(raw));
    if (raw < 1) {
      raf = requestAnimationFrame(step);
    } else {
      opts.onDone?.();
    }
  };

  raf = requestAnimationFrame(step);
  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
  };
}
