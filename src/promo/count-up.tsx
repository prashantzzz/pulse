/**
 * Promo count-up numbers — every numeric `num`/`numLg`/`numSm` label counts up
 * from 0 when it appears, like a kinetic promo stat. Prefix/suffix, decimals
 * and thousands separators are preserved exactly ("1,234 kg", "+5.2%", "18").
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing } from 'react-native';
import { PROMO } from './config';
import { usePromoPlay } from './reveal';

const NUMBER_RE = /-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?/;

interface ParsedNumber {
  prefix: string;
  value: number;
  decimals: number;
  grouped: boolean;
  suffix: string;
}

function parse(text: string): ParsedNumber | null {
  const m = NUMBER_RE.exec(text);
  if (!m) return null;
  const raw = m[0];
  const value = Number(raw.replace(/,/g, ''));
  if (!Number.isFinite(value) || value === 0) return null;
  const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
  return {
    prefix: text.slice(0, m.index),
    value,
    decimals,
    grouped: raw.includes(','),
    suffix: text.slice(m.index + raw.length),
  };
}

function format(v: number, p: ParsedNumber): string {
  const fixed = v.toFixed(p.decimals);
  const [int, dec] = fixed.split('.');
  const grouped = p.grouped ? Number(int).toLocaleString('en-US') : int;
  return `${p.prefix}${grouped}${dec ? `.${dec}` : ''}${p.suffix}`;
}

export function usePromoCountUp(children: ReactNode, enabled: boolean): ReactNode {
  const { token } = usePromoPlay();
  const active = PROMO.enabled && enabled && typeof children === 'string';
  const parsed = active ? parse(children as string) : null;
  const key = parsed
    ? `${parsed.prefix}|${parsed.value}|${parsed.decimals}|${parsed.grouped}|${parsed.suffix}`
    : '';
  const anim = useRef(new Animated.Value(0)).current;
  const playedKey = useRef('');
  const [display, setDisplay] = useState<string | null>(null);

  useEffect(() => {
    if (!parsed) return;
    const runKey = `${key}|${token}`;
    if (playedKey.current === runKey) return;
    playedKey.current = runKey;

    anim.setValue(0);
    setDisplay(format(0, parsed));
    const listener = anim.addListener(({ value }) => {
      const next = format(value, parsed);
      setDisplay((prev) => (prev === next ? prev : next));
    });
    const t = Animated.timing(anim, {
      toValue: parsed.value,
      duration: PROMO.countUpMs,
      delay: token === 0 ? PROMO.countUpDelayMs : 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    t.start(({ finished }) => {
      anim.removeListener(listener);
      if (finished) setDisplay(null);
    });
    return () => {
      t.stop();
      anim.removeListener(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, token]);

  if (!active || !parsed) return children;
  // First paint shows "0..." rather than flashing the final value for a frame.
  if (display == null && playedKey.current === '') return format(0, parsed);
  return display ?? children;
}
