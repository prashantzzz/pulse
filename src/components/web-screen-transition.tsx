import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { colors } from '../theme';

const ENTER_MS = 220;
const EXIT_MS = 180;
const OFFSET = 32;

/**
 * Web-only enter/exit transition for pushed screens.
 *
 * Expo Router's web stack swaps screens instantly (no push/pop animation), so
 * these screens animate their own content in and out. Native is untouched: the
 * wrapper renders children directly and `runExit` runs the callback
 * immediately, leaving the platform's native stack animation in charge.
 *
 * Note: the exit animation runs when the user closes the screen from within
 * the app (header back / hardware back). Browser back pops instantly.
 */
export function useScreenTransition() {
  const [progress] = useState(() => new Animated.Value(Platform.OS === 'web' ? 0 : 1));
  const exitingRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    Animated.timing(progress, {
      toValue: 1,
      duration: ENTER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  /** Plays the exit animation, then runs `onDone` (navigation). */
  const runExit = useCallback(
    (onDone: () => void) => {
      if (Platform.OS !== 'web') {
        onDone();
        return;
      }
      // Guard against double taps popping two screens.
      if (exitingRef.current) return;
      exitingRef.current = true;
      Animated.timing(progress, {
        toValue: 0,
        duration: EXIT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDone();
        else exitingRef.current = false;
      });
    },
    [progress],
  );

  return { progress, runExit };
}

export function WebScreenTransition({
  progress,
  children,
}: {
  progress: Animated.Value;
  children: React.ReactNode;
}) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: progress,
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [OFFSET, 0],
                }),
              },
            ],
          },
        ]}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Opaque dark backdrop so the sliding content never exposes the page behind.
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
});
