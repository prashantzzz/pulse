import { useState } from 'react';
import { Animated } from 'react-native';

/**
 * Returns a stable `Animated.Value` for the lifetime of the calling component.
 *
 * React Native exports `useAnimatedValue` natively, but react-native-web (as
 * of 0.21) does not — so this app-local hook provides one implementation that
 * works on every platform. It is the lint-approved replacement for the classic
 * `useRef(new Animated.Value(x)).current` pattern: the value is created once
 * via lazy state initialization and never recreated on re-renders.
 */
export function useAnimatedValue(initialValue: number): Animated.Value {
  const [value] = useState(() => new Animated.Value(initialValue));
  return value;
}
