import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

import { useAnimatedValue } from '../lib/useAnimatedValue';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '../theme';
import { T } from './Text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function formatCountdown(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

/** Circular progress ring (static value driven) */
export function ProgressRing({
  size = 120,
  strokeWidth = 10,
  progress = 0,
  color = colors.accent,
  trackColor = colors.surface3,
  children,
  style,
}: {
  size?: number;
  strokeWidth?: number;
  /** 0-100 */
  progress?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  style?: object;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = c - (clamped / 100) * c;

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

/**
 * Animated countdown ring for the rest timer.
 * `remainingSec` drives the visible label; an internal animation sweeps the ring
 * to zero over `totalSec`, firing `onComplete` when it finishes.
 */
export function CountdownRing({
  size = 230,
  strokeWidth = 12,
  totalSec,
  remainingSec,
  onComplete,
  children,
}: {
  size?: number;
  strokeWidth?: number;
  totalSec: number;
  remainingSec: number;
  onComplete?: () => void;
  children?: React.ReactNode;
}) {
  const anim = useAnimatedValue(0);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    doneRef.current = false;
    anim.setValue(0);
    if (totalSec <= 0) return;
    const listener = anim.addListener(({ value }) => {
      if (value >= 1 && !doneRef.current) {
        doneRef.current = true;
        onCompleteRef.current?.();
      }
    });
    Animated.timing(anim, {
      toValue: 1,
      duration: Math.max(100, totalSec * 1000),
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    return () => {
      anim.removeListener(listener);
      anim.stopAnimation();
    };
  }, [totalSec, anim]);

  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const frac = totalSec > 0 ? Math.max(0, remainingSec / totalSec) : 0;

  const offset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, c],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surface3} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <T variant="numLg" style={{ fontSize: 46, color: colors.text }}>
          {formatCountdown(frac * totalSec)}
        </T>
        <T variant="label" muted style={{ marginTop: 2 }}>
          Rest
        </T>
      </View>
      {children}
    </View>
  );
}

