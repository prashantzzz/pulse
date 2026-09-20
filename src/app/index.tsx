import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

import { useAnimatedValue } from '../lib/useAnimatedValue';
import { resolveLaunchRoute } from '../lib/launch';

import { T } from '../components/Text';
import { accentTint, colors, type, useAccent } from '../theme';
import { useAuth } from '../store/useAuth';
import { usePulse } from '../store/useStore';

export default function SplashScreen() {
  useAccent();
  const router = useRouter();
  const onboarded = usePulse((s) => s.onboarded);
  const hydrated = usePulse((s) => s.hydrated);
  const isInitialized = useAuth((s) => s.isInitialized);
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const isVerifyingUser = useAuth((s) => s.isVerifyingUser);

  // Animation values
  const logoScale = useAnimatedValue(0.7);
  const logoOpacity = useAnimatedValue(0);
  const logoTranslateY = useAnimatedValue(24);

  const glowScale = useAnimatedValue(0.6);
  const glowOpacity = useAnimatedValue(0);
  const glowPulse = useAnimatedValue(0);

  const titleOpacity = useAnimatedValue(0);
  const titleTranslateY = useAnimatedValue(16);

  const subtitleOpacity = useAnimatedValue(0);
  const subtitleTranslateY = useAnimatedValue(12);

  const progress = useAnimatedValue(0);
  const exitOpacity = useAnimatedValue(1);

  useEffect(() => {
    // 1. Entrance orchestration
    Animated.parallel([
      // Glow expansion & fade-in
      Animated.timing(glowOpacity, { toValue: 0.6, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(glowScale, { toValue: 1, damping: 14, stiffness: 100, useNativeDriver: true }),

      // Logo pop & float up
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, damping: 12, stiffness: 120, useNativeDriver: true }),
      Animated.spring(logoTranslateY, { toValue: 0, damping: 14, stiffness: 110, useNativeDriver: true }),

      // Title staggered reveal (180ms delay)
      Animated.sequence([
        Animated.delay(180),
        Animated.parallel([
          Animated.timing(titleOpacity, { toValue: 1, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.spring(titleTranslateY, { toValue: 0, damping: 14, stiffness: 120, useNativeDriver: true }),
        ]),
      ]),

      // Subtitle tagline staggered reveal (340ms delay)
      Animated.sequence([
        Animated.delay(340),
        Animated.parallel([
          Animated.timing(subtitleOpacity, { toValue: 1, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.spring(subtitleTranslateY, { toValue: 0, damping: 14, stiffness: 120, useNativeDriver: true }),
        ]),
      ]),

      // Progress bar fill
      Animated.timing(progress, {
        toValue: 1,
        duration: 1700,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Gentle ambient breathing loop behind the logo
    const ambientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    ambientLoop.start();

    return () => ambientLoop.stop();
  }, [
    glowOpacity,
    glowScale,
    glowPulse,
    logoOpacity,
    logoScale,
    logoTranslateY,
    titleOpacity,
    titleTranslateY,
    subtitleOpacity,
    subtitleTranslateY,
    progress,
  ]);

  useEffect(() => {
    if (!hydrated || !isInitialized || isVerifyingUser) return;

    const route = resolveLaunchRoute({
      isAuthenticated,
      onboarded,
      activeWorkoutId: usePulse.getState().activeWorkout?.id ?? null,
    });
    router.replace(route as never);
  }, [hydrated, isInitialized, isAuthenticated, isVerifyingUser, onboarded, router]);

  const ambientScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });

  const ambientOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.65],
  });

  return (
    <Animated.View style={[styles.root, { opacity: exitOpacity }]}>
      <Head>
        <title>NextRep</title>
        <meta name="google-site-verification" content="vVBrobRRHCqwVUdK0Df9oFh0m0JRvcul6E8HRZrxwrE" />
      </Head>
      <LinearGradient colors={[accentTint(colors.accent, 0.12), colors.bg, colors.bg]} style={StyleSheet.absoluteFill} />

      {/* Ambient background glows */}
      <View style={[styles.glowTop, { backgroundColor: `${colors.accent}14` }]} />
      <View style={[styles.glowBottom, { backgroundColor: `${colors.accent}10` }]} />

      {/* Central hero unit with breathing ambient halo */}
      <View style={styles.center}>
        {/* Dynamic breathing halo behind logo */}
        <Animated.View
          style={[
            styles.haloGlow,
            {
              backgroundColor: colors.accent,
              opacity: Animated.multiply(glowOpacity, ambientOpacity),
              transform: [{ scale: Animated.multiply(glowScale, ambientScale) }],
            },
          ]}
        />

        {/* NextRep logo with smooth spring entrance */}
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { translateY: logoTranslateY }],
          }}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={{ width: 92, height: 92, borderRadius: 24 }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Staggered brand title */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
            alignItems: 'center',
          }}>
          <T variant="hero" style={{ marginTop: 22, letterSpacing: 3, fontSize: 34 }}>
            NextRep
          </T>
        </Animated.View>

        {/* Staggered tagline */}
        <Animated.View
          style={{
            opacity: subtitleOpacity,
            transform: [{ translateY: subtitleTranslateY }],
            alignItems: 'center',
          }}>
          <T variant="body" dim style={{ marginTop: 10, letterSpacing: 0.4 }}>
            Train smart. Get strong. Stay consistent.
          </T>
        </Animated.View>
      </View>

      {/* Footer loading indicator with sleek progress bar */}
      <View style={styles.footer}>
        <View style={styles.loaderTrack}>
          <Animated.View
            style={[
              styles.loaderFill,
              { backgroundColor: colors.accent },
              {
                transform: [
                  {
                    scaleX: progress,
                  },
                ],
              },
            ]}
          />
        </View>
        <T variant="micro" muted style={{ marginTop: 14 }}>
          Your personal training companion
        </T>
      </View>
    </Animated.View>
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
  center: { alignItems: 'center', position: 'relative' },
  haloGlow: {
    position: 'absolute',
    top: -24,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
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
    width: 140,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface3,
    overflow: 'hidden',
  },
  loaderFill: { width: '100%', height: '100%', borderRadius: 2 },
});
