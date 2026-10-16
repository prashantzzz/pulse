/* eslint-disable react-hooks/refs --
 * Promo motion code keeps Animated values, cascade slots and play keys in refs:
 * they are imperative animation state that must not trigger re-renders. Slot
 * assignment intentionally happens during render (parents before children) so
 * cascades order top-down. Same convention as draggable-plan-list.tsx.
 */
/**
 * Promo reveal engine v2 — choreographed entrance animations for the promo build.
 *
 * Lifecycle rules (from the motion spec):
 *  - plays when an element first becomes visible (web: IntersectionObserver),
 *  - replays when the screen is re-entered (route-aware play keys),
 *  - replays on the director's `R` hotkey (token bump) — including elements
 *    that are still below the fold, which then play as they scroll into view,
 *  - never restarts because of unrelated re-renders or state updates,
 *  - renders instantly (final state) when reduced motion is requested.
 *
 * When `PROMO.enabled` is false this module is a pure pass-through.
 */
import React, { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { Animated, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { PROMO } from './config';
import { EASE, useReducedMotion } from './motion';

// ---------------------------------------------------------------------------
// Play context
// ---------------------------------------------------------------------------

export interface PromoPlayState {
  /** manual replay token (R hotkey) */
  token: number;
  /** slow-motion capture mode */
  slowMo: boolean;
  /** current route — replays entrances when the screen is re-entered */
  route: string;
  /** replay the current screen's choreography (same as R) */
  replay: () => void;
}

export const PromoPlayContext = createContext<PromoPlayState>({ token: 0, slowMo: false, route: '', replay: () => {} });
export const PromoPlayProvider = PromoPlayContext.Provider;

export function usePromoPlay(): PromoPlayState {
  return useContext(PromoPlayContext);
}

/**
 * Compact mode: used by screens that swap content in place (analytics tabs).
 * Shorter durations/delays so a tab change is a quick fade/slide rather than a
 * full-screen cascade.
 */
export const PromoCompactContext = createContext(false);
export const PromoCompactProvider = PromoCompactContext.Provider;

export function usePromoCompact(): boolean {
  return useContext(PromoCompactContext);
}

/**
 * Per-screen sequencing: every persistently-mounted screen (the tab scenes in
 * particular) gets its own stagger pool, so navigating to a screen always
 * starts its cascade at 0 — no cross-screen slot stealing, no late pop-ins.
 *
 * The pool resets whenever the global route or replay token changes, in the
 * wrapper's render body, which always runs before its children's (React
 * renders parents before children). Stack screens don't need a wrapper:
 * they're fresh mounts, so the global pool is already clean for them.
 */
const PromoScreenSeqContext = createContext<{ next: (stepMs: number) => number } | null>(null);

export function PromoScreen({ children }: { children: ReactNode }) {
  const { token, route } = usePromoPlay();
  const state = useRef({ key: '', seq: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const key = `${route}#${token}`;
  if (state.current.key !== key) {
    state.current.key = key;
    state.current.seq = 0;
  }

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    },
    [],
  );

  const value = useRef<{ next: (stepMs: number) => number } | null>(null);
  if (!value.current) {
    value.current = {
      next: (stepMs: number) => {
        const slot = state.current.seq;
        state.current.seq += 1;
        // Quiet-reset (mirrors the global pool): in-app tab switches reuse
        // the same route+token, so without this the slots would accumulate
        // across switches until every card saturates at the max delay while
        // time-based chart drivers run invisibly behind them.
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          state.current.seq = 0;
          timer.current = null;
        }, PROMO.seqQuietMs);
        return Math.min(slot * stepMs, PROMO.maxDelayMs);
      },
    };
  }

  return <PromoScreenSeqContext.Provider value={value.current}>{children}</PromoScreenSeqContext.Provider>;
}

function nextCascadeSlot(screen: { next: (stepMs: number) => number } | null, stepMs: number): number {
  if (screen) return screen.next(stepMs);
  return nextSlot(stepMs);
}

// ---------------------------------------------------------------------------
// Global stagger pool (fallback for surfaces outside a PromoScreen)
// ---------------------------------------------------------------------------

let seq = 0;
let seqTimer: ReturnType<typeof setTimeout> | null = null;

function nextSlot(stepMs: number): number {
  const slot = seq;
  seq += 1;
  if (seqTimer) clearTimeout(seqTimer);
  seqTimer = setTimeout(() => {
    seq = 0;
    seqTimer = null;
  }, PROMO.seqQuietMs);
  return Math.min(slot * stepMs, PROMO.maxDelayMs);
}

export function resetPromoSequence(): void {
  seq = 0;
  if (seqTimer) {
    clearTimeout(seqTimer);
    seqTimer = null;
  }
}

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

export type RevealVariant = 'hero' | 'card' | 'row' | 'pop' | 'fade' | 'panel' | 'none';

const DURATION: Record<RevealVariant, number> = {
  hero: PROMO.duration.hero,
  card: PROMO.duration.card,
  row: PROMO.duration.content,
  pop: PROMO.duration.pop,
  fade: PROMO.duration.content,
  panel: PROMO.duration.panel,
  none: 0,
};

export function PromoReveal({
  children,
  style,
  variant = 'card',
  delay,
  observe = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: RevealVariant;
  /** explicit delay in ms — skips the automatic cascade */
  delay?: number;
  /** wait until the element scrolls into view (web only) */
  observe?: boolean;
}) {
  const enabled = PROMO.enabled && variant !== 'none';
  const { token, slowMo, route } = usePromoPlay();
  const compact = usePromoCompact();
  const screenSeq = useContext(PromoScreenSeqContext);
  const reduced = useReducedMotion();

  const progress = useRef(new Animated.Value(enabled ? 0 : 1)).current;
  const hostRef = useRef<unknown>(null);
  const aliveRef = useRef(true);
  const st = useRef({ playKey: '', playedKey: '', delay: 0, at: 0 });

  const playKey = `${route}#${token}`;

  // Slot assignment happens during render (parents render before children), so
  // delays cascade top-down even though effects fire bottom-up. Inside a
  // PromoScreen the slots come from the screen-local pool (always 0-based on
  // navigation); otherwise the shared global pool is used.
  if (enabled && st.current.playKey !== playKey) {
    st.current.playKey = playKey;
    st.current.delay =
      delay != null ? delay : nextCascadeSlot(screenSeq, compact ? PROMO.stagger.fast : PROMO.stagger.base);
    st.current.at = Date.now();
  }

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const play = () => {
    const s = st.current;
    if (!aliveRef.current || s.playedKey === s.playKey) return;
    s.playedKey = s.playKey;

    if (reduced || !enabled) {
      progress.setValue(1);
      return;
    }

    // Fresh batches keep their full cascade; elements revealed long after the
    // batch started collapse into a short wave.
    const stale = Date.now() - s.at > 900;
    const delayMs = stale ? Math.min(s.delay, PROMO.staleDelayMs) : s.delay;
    const slow = slowMo ? PROMO.slowMoFactor : 1;

    progress.stopAnimation();
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: DURATION[variant] * slow * (compact ? 0.6 : 1),
      delay: delayMs * slow,
      easing: variant === 'pop' ? EASE.pop : EASE.entrance,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };
  const playRef = useRef(play);
  playRef.current = play;

  // --- visibility-gated playback -------------------------------------------
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const tryStart = () => {
      if (aliveRef.current) playRef.current();
    };
    // Safety net: nothing may stay invisible if the observer never fires.
    const fallback = setTimeout(tryStart, 3000);

    let io: IntersectionObserver | null = null;
    if (observe && Platform.OS === 'web' && typeof IntersectionObserver !== 'undefined') {
      const node = hostRef.current as HTMLElement | null;
      if (node && typeof node.getBoundingClientRect === 'function') {
        const rect = node.getBoundingClientRect();
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
        if (rect.top < vh * 0.98 && rect.bottom > 0) {
          raf = requestAnimationFrame(tryStart);
        } else {
          io = new IntersectionObserver(
            (entries) => {
              if (entries.some((e) => e.isIntersecting)) {
                io?.disconnect();
                io = null;
                tryStart();
              }
            },
            { threshold: 0.04 },
          );
          io.observe(node);
        }
        return () => {
          clearTimeout(fallback);
          if (raf) cancelAnimationFrame(raf);
          io?.disconnect();
        };
      }
    }

    raf = requestAnimationFrame(tryStart);
    return () => {
      clearTimeout(fallback);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, observe, playKey]);

  // --- web hero blur (melts away as the card settles) -----------------------
  useEffect(() => {
    if (!enabled || variant !== 'hero' || Platform.OS !== 'web' || reduced || compact) return;
    const node = hostRef.current as HTMLElement | null;
    if (!node || typeof node.style === 'undefined') return;
    const listener = progress.addListener(({ value }) => {
      const blur = (1 - value) * PROMO.heroBlurPx;
      node.style.filter = blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : '';
    });
    return () => {
      progress.removeListener(listener);
      node.style.filter = '';
    };
  }, [enabled, variant, reduced, compact, progress]);

  if (!enabled) return <>{children}</>;

  const t = PROMO.travel;
  const animatedStyle: { opacity: Animated.Value; transform: unknown[] } = {
    opacity: progress,
    transform: [],
  };

  if (variant === 'hero') {
    animatedStyle.transform.push({ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [t.hero, 0] }) });
    animatedStyle.transform.push({ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) });
  } else if (variant === 'card') {
    animatedStyle.transform.push({ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [t.card, 0] }) });
    animatedStyle.transform.push({ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) });
  } else if (variant === 'panel') {
    animatedStyle.transform.push({ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [t.content, 0] }) });
    animatedStyle.transform.push({ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.99, 1] }) });
  } else if (variant === 'row') {
    animatedStyle.transform.push({ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [t.row, 0] }) });
  } else if (variant === 'pop') {
    animatedStyle.transform.push({ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) });
  }

  return (
    <Animated.View ref={hostRef as never} style={[style, animatedStyle as never]}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Group helper
// ---------------------------------------------------------------------------

/**
 * Wraps a list of children in staggered reveals (used for chips, rows and
 * list items). Children keep their own keys.
 */
export function PromoStagger({
  children,
  base = 0,
  step,
  variant = 'row',
  cap = 8,
  observe = true,
}: {
  children: ReactNode;
  /** delay before the first item */
  base?: number;
  /** ms between items — defaults to the base stagger token */
  step?: number;
  variant?: RevealVariant;
  /** items beyond this index share the last delay (long lists stay quick) */
  cap?: number;
  observe?: boolean;
}) {
  const items = React.Children.toArray(children);
  const stepMs = step ?? PROMO.stagger.base;
  return (
    <>
      {items.map((child, i) => {
        const key = (child as { key?: string | number } | null)?.key ?? i;
        return (
          <PromoReveal key={key} variant={variant} delay={base + Math.min(i, cap) * stepMs} observe={observe}>
            {child}
          </PromoReveal>
        );
      })}
    </>
  );
}
