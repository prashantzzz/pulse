/**
 * Promo reveal engine — choreographed entrance animations for the promo build.
 *
 * Every wrapped block fades/slides/pops in on a shared top-down cascade. On
 * web the reveal also waits for the element to actually be on screen, which
 * makes inactive tab scenes stay hidden until focused and turns scrolling into
 * a natural cascade. When `PROMO.enabled` is false this module is a pure
 * pass-through (no wrapper, no layout changes).
 */
import React, { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { PROMO } from './config';

export interface PromoPlayState {
  token: number;
  slowMo: boolean;
}

export const PromoPlayContext = createContext<PromoPlayState>({ token: 0, slowMo: false });
export const PromoPlayProvider = PromoPlayContext.Provider;

export function usePromoPlay(): PromoPlayState {
  return useContext(PromoPlayContext);
}

// --- global stagger pool -----------------------------------------------------
// Elements request a slot while rendering, so parents (rendered first) always
// come before their children in the sequence. The pool resets after a short
// quiet period, so each screen/burst starts its own cascade at 0.
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

type RevealVariant = 'rise' | 'hero' | 'pop' | 'row' | 'fade';

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_POP = Easing.bezier(0.34, 1.56, 0.64, 1);

const DURATION: Record<RevealVariant, number> = {
  rise: PROMO.durationMs.rise,
  hero: PROMO.durationMs.hero,
  pop: PROMO.durationMs.pop,
  row: PROMO.durationMs.row,
  fade: 360,
};

export function PromoReveal({
  children,
  style,
  variant = 'rise',
  delay,
  observe = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: RevealVariant;
  /** explicit delay in ms — skips the auto cascade */
  delay?: number;
  /** wait until the element scrolls into view (web only) */
  observe?: boolean;
}) {
  const enabled = PROMO.enabled;
  const { token, slowMo } = usePromoPlay();
  const progress = useRef(new Animated.Value(enabled ? 0 : 1)).current;
  const hostRef = useRef<unknown>(null);
  const state = useRef({ token: -1, delay: 0, at: 0, played: -1, disposed: false });

  // Slot assignment happens during render (parents render before children), so
  // delays cascade top-down even though effects fire bottom-up.
  if (enabled && state.current.token !== token) {
    state.current.token = token;
    state.current.delay = delay != null ? delay : nextSlot(PROMO.staggerMs);
    state.current.at = Date.now();
    state.current.disposed = false;
  }

  const play = (d: number) => {
    if (state.current.played === state.current.token) return;
    state.current.played = state.current.token;
    progress.stopAnimation();
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: DURATION[variant] * (slowMo ? PROMO.slowMoFactor : 1),
      delay: d,
      easing: variant === 'pop' ? EASE_POP : EASE_OUT,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  useEffect(() => {
    if (!enabled) return;
    const st = state.current;

    const start = () => {
      if (st.disposed) return;
      // Fresh batches keep their full cascade; elements revealed long after
      // mount (scrolled into view much later) collapse into a short wave.
      const stale = Date.now() - st.at > 900;
      play(stale ? Math.min(st.delay, 140) : st.delay);
    };

    // Safety net: nothing may stay invisible if the observer never fires
    // (e.g. screenshots, exotic embeds). Play late rather than never.
    const fallback = setTimeout(() => start(), 3000);

    if (observe && Platform.OS === 'web' && typeof IntersectionObserver !== 'undefined') {
      const node = hostRef.current as HTMLElement | null;
      if (node && typeof node.getBoundingClientRect === 'function') {
        const rect = node.getBoundingClientRect();
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
        if (rect.top < vh * 0.98 && rect.bottom > 0) {
          requestAnimationFrame(start);
        } else {
          const io = new IntersectionObserver(
            (entries) => {
              if (entries.some((e) => e.isIntersecting)) {
                io.disconnect();
                start();
              }
            },
            { threshold: 0.04 },
          );
          io.observe(node);
          return () => {
            st.disposed = true;
            clearTimeout(fallback);
            io.disconnect();
          };
        }
        return () => {
          st.disposed = true;
          clearTimeout(fallback);
        };
      }
    }

    requestAnimationFrame(start);
    return () => {
      st.disposed = true;
      clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, observe]);

  // Replay on token bump (R hotkey). Delays were recomputed during render.
  useEffect(() => {
    if (!enabled || token === 0) return;
    play(state.current.delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!enabled) return <>{children}</>;

  const animatedStyle: any = { opacity: progress, transform: [] as any[] };
  if (variant === 'rise') {
    animatedStyle.transform.push({ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) });
    animatedStyle.transform.push({ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) });
  } else if (variant === 'hero') {
    animatedStyle.transform.push({ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) });
    animatedStyle.transform.push({ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.965, 1] }) });
  } else if (variant === 'pop') {
    animatedStyle.transform.push({ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) });
  } else if (variant === 'row') {
    animatedStyle.transform.push({ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) });
  }

  return (
    <Animated.View ref={hostRef as never} style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
