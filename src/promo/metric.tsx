/* eslint-disable react-hooks/refs --
 * Promo motion code keeps Animated values, cascade slots and play keys in refs:
 * they are imperative animation state that must not trigger re-renders. Slot
 * assignment intentionally happens during render (parents before children) so
 * cascades order top-down. Same convention as draggable-plan-list.tsx.
 */
/**
 * Promo metrics — the numeric count-up system.
 *
 * Two entry points share one engine:
 *  - `usePromoCountUp` (consumed by `Text.tsx` for `num*` variants),
 *  - `<PromoMetric>` (drop-in animated text for any style/context).
 *
 * Behavior:
 *  - counts up from 0 on mount and on manual replay (`R`),
 *  - counts from the previously settled value when the underlying data
 *    changes (timeframe/exercise/session swaps) — never restarts at zero,
 *  - preserves prefix/suffix, decimals, thousands separators and compact
 *    notation exactly ("6.2k", "+33.3%", "1,234 kg"),
 *  - on web, waits until the number is actually on screen before counting
 *    (hidden tabs / below-the-fold sections animate when reached),
 *  - exposes the real final value to assistive tech instead of intermediate
 *    frame values,
 *  - respects reduced motion (renders the final value instantly),
 *  - the scheduler is idempotent: React re-invoking setup→cleanup→setup with
 *    unchanged inputs can never leave a counter frozen at its initial state.
 */
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Animated, Platform, Text as RNText, type TextProps as RNTextProps } from 'react-native';
import * as theme from '../theme';
import { PROMO } from './config';
import { EASE, useReducedMotion } from './motion';
import { usePromoPlay } from './reveal';

export type TextVariant = keyof typeof theme.type;

// ---------------------------------------------------------------------------
// Parsing / formatting
// ---------------------------------------------------------------------------

const NUMBER_RE = /-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?/;

export interface ParsedNumber {
  prefix: string;
  value: number;
  decimals: number;
  grouped: boolean;
  suffix: string;
}

export function parseMetric(text: string): ParsedNumber | null {
  const m = NUMBER_RE.exec(text);
  if (!m) return null;
  const raw = m[0];
  const value = Number(raw.replace(/,/g, ''));
  if (!Number.isFinite(value)) return null;
  const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
  return {
    prefix: text.slice(0, m.index),
    value,
    decimals,
    grouped: raw.includes(','),
    suffix: text.slice(m.index + raw.length),
  };
}

export function formatMetric(v: number, p: ParsedNumber): string {
  const fixed = v.toFixed(p.decimals);
  const [int, dec] = fixed.split('.');
  const grouped = p.grouped ? Number(int).toLocaleString('en-US') : int;
  return `${p.prefix}${grouped}${dec ? `.${dec}` : ''}${p.suffix}`;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

function useCountUp(value: ReactNode, enabled: boolean, nodeRef?: RefObject<unknown>): ReactNode {
  const { token, slowMo, route } = usePromoPlay();
  const reduced = useReducedMotion();

  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value : null;
  const active = PROMO.enabled && enabled && text != null;
  const parsed = active ? parseMetric(text) : null;
  const valueKey = parsed
    ? `${parsed.prefix}|${parsed.value}|${parsed.decimals}|${parsed.grouped}|${parsed.suffix}`
    : '';
  const playKey = `${route}#${token}`;

  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState<string | null>(null);
  const st = useRef({ playKey: '', valueKey: '', runKey: '', settled: null as number | null, last: 0 });

  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const slowRef = useRef(slowMo);
  slowRef.current = slowMo;

  // Stop any in-flight animation only on unmount.
  useEffect(
    () => () => {
      anim.stopAnimation();
    },
    [anim],
  );

  useEffect(() => {
    if (!parsed) return;
    const s = st.current;
    const isReplay = s.playKey !== playKey;
    const isValueChange = s.valueKey !== valueKey;
    s.playKey = playKey;
    s.valueKey = valueKey;

    // Idempotent scheduler: one claim per (play, value) pair. If React tears
    // down and re-runs this effect with unchanged inputs, the cleanup below
    // releases the claim so the re-run reschedules the animation.
    const runKey = `${playKey}|${valueKey}`;
    if (s.runKey === runKey) return;
    s.runKey = runKey;

    // Manual replay counts from zero for the movement; genuine data changes
    // continue from the previously settled value.
    const from = isReplay ? 0 : s.settled ?? s.last ?? 0;
    s.settled = null;

    if (reducedRef.current) {
      s.settled = parsed.value;
      setDisplay(null);
      return;
    }

    let raf = 0;
    let io: IntersectionObserver | null = null;
    let dead = false;

    const start = () => {
      if (dead) return;
      if (from === parsed.value) {
        s.settled = parsed.value;
        setDisplay(null);
        return;
      }

      anim.stopAnimation();
      anim.setValue(from);
      setDisplay(formatMetric(from, parsed));
      const listener = anim.addListener(({ value: v }) => {
        s.last = v;
        const next = formatMetric(v, parsed);
        setDisplay((prev) => (prev === next ? prev : next));
      });
      const timing = Animated.timing(anim, {
        toValue: parsed.value,
        duration: PROMO.duration.counter * (slowRef.current ? PROMO.slowMoFactor : 1),
        delay: isReplay ? PROMO.duration.counterDelayMs : 60,
        easing: EASE.entrance,
        useNativeDriver: false,
      });
      timing.start(({ finished }) => {
        anim.removeListener(listener);
        if (finished) {
          s.settled = parsed.value;
          setDisplay(null);
        }
      });
    };

    const fallback = setTimeout(start, 3000);

    if (nodeRef && Platform.OS === 'web' && typeof IntersectionObserver !== 'undefined') {
      const node = nodeRef.current as HTMLElement | null;
      if (node && typeof node.getBoundingClientRect === 'function') {
        const rect = node.getBoundingClientRect();
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
        if (rect.top < vh * 0.98 && rect.bottom > 0) {
          raf = requestAnimationFrame(start);
        } else {
          io = new IntersectionObserver(
            (entries) => {
              if (entries.some((e) => e.isIntersecting)) {
                io?.disconnect();
                io = null;
                start();
              }
            },
            { threshold: 0.02 },
          );
          io.observe(node);
        }
      } else {
        raf = requestAnimationFrame(start);
      }
    } else {
      raf = requestAnimationFrame(start);
    }

    return () => {
      dead = true;
      if (s.runKey === runKey) s.runKey = '';
      clearTimeout(fallback);
      if (raf) cancelAnimationFrame(raf);
      io?.disconnect();
      // A running animation is intentionally NOT stopped here: a superseding
      // run stops it itself (anim.stopAnimation) and unmount stops it above.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueKey, playKey, nodeRef, anim]);

  if (!active || !parsed) return value;
  if (reduced || st.current.settled != null) return value;
  return display ?? formatMetric(0, parsed);
}

/** Count-up hook for the `Text.tsx` numeric variants. */
export function usePromoCountUp(children: ReactNode, enabled: boolean, nodeRef?: RefObject<unknown>): ReactNode {
  return useCountUp(children, enabled, nodeRef);
}

// ---------------------------------------------------------------------------
// PromoMetric — drop-in animated text
// ---------------------------------------------------------------------------

/**
 * Renders `value` with the app's type system and counts up on appear.
 * Use it for the meaningful metrics that are not already `num*` text.
 */
export function PromoMetric({
  value,
  variant = 'body',
  style,
  ...rest
}: { value: string; variant?: TextVariant } & RNTextProps) {
  const ref = useRef<unknown>(null);
  const shown = useCountUp(value, true, ref);
  return (
    <RNText
      ref={ref as never}
      style={[theme.type[variant], { color: theme.colors.text, fontVariant: ['tabular-nums'] }, style]}
      accessibilityLabel={rest.accessibilityLabel ?? value}
      {...rest}>
      {shown}
    </RNText>
  );
}
