import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useAnimatedValue } from '../lib/useAnimatedValue';

import { T } from '../components/Text';
import { accentTint, colors, gradients, type, useAccent } from '../theme';
import { useAuth } from '../store/useAuth';
import { usePulse } from '../store/useStore';

export default function SplashScreen() {
  useAccent();
  const router = useRouter();
  const onboarded = usePulse((s) => s.onboarded);
  const hydrated = usePulse((s) => s.hydrated);
  const isInitialized = useAuth((s) => s.isInitialized);
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const fade = useAnimatedValue(0);
  const rise = useAnimatedValue(24);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, useNativeDriver: true, damping: 16, stiffness: 120 }),
    ]).start();
  }, [fade, rise]);

  useEffect(() => {
    if (!hydrated || !isInitialized) return;

    const t = setTimeout(() => {
      if (!isAuthenticated) {
        // User must create account or sign in first
        router.replace('/auth/login' as never);
      } else if (onboarded) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/onboarding');
      }
    }, 1800);

    return () => clearTimeout(t);
  }, [hydrated, isInitialized, isAuthenticated, onboarded, router]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={[accentTint(colors.accent, 0.1), colors.bg, colors.bg]} style={StyleSheet.absoluteFill} />
      <View style={[styles.glowTop, { backgroundColor: `${colors.accent}12` }]} />
      <View style={[styles.glowBottom, { backgroundColor: `${colors.accent}12` }]} />
      <Animated.View style={[styles.center, { opacity: fade, transform: [{ translateY: rise }] }]}>
        {/* NextRep mark */}
        <View style={styles.logoWrap}>
          <LinearGradient colors={[...gradients.accent]} style={[StyleSheet.absoluteFill, { borderRadius: 30 }]} />
          <T variant="hero" style={{ color: colors.bg, fontSize: 34, lineHeight: 40 }}>
            N
          </T>
        </View>
        <T variant="hero" style={{ marginTop: 24, letterSpacing: 4, fontSize: 36 }}>
          NextRep
        </T>
        <T variant="body" dim style={{ marginTop: 10, letterSpacing: 0.4 }}>
          Train smart. Get strong. Stay consistent.
        </T>
      </Animated.View>
      <View style={styles.footer}>
        <View style={styles.loaderTrack}>
          <Animated.View
            style={[
              styles.loaderFill,
              { backgroundColor: colors.accent },
              {
                transform: [
                  {
                    scaleX: fade.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
                  },
                ],
              },
            ]}
          />
        </View>
        <T variant="micro" muted style={{ marginTop: 12 }}>
          Your personal training companion
        </T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glowTop: {
    position: 'absolute',
    top: -120,
    width: 420,
    height: 420,
    borderRadius: 210,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -160,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(43,210,126,0.06)',
  },
  center: { alignItems: 'center' },
  logoWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...type.h1,
  },
  footer: { position: 'absolute', bottom: 70, alignItems: 'center' },
  loaderTrack: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface3,
    overflow: 'hidden',
  },
  loaderFill: { width: '100%', height: '100%', borderRadius: 2 },
});
