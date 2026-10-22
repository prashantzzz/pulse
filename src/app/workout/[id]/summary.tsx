import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, Share2, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T } from '../../../components/Text';
import { Button, Row } from '../../../components/ui';
import {
  WorkoutShareCard,
  type WorkoutShareCardHandle,
} from '../../../components/workout-share-card';
import { hapticsLight, hapticsMedium, hapticsSuccess } from '../../../lib/haptics';
import { useAnimatedValue } from '../../../lib/useAnimatedValue';
import { usePulse } from '../../../store/useStore';
import { colors, radius, spacing, useAccent } from '../../../theme';

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function SummaryScreen() {
  useAccent();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const workouts = usePulse((s) => s.workouts);
  const profile = usePulse((s) => s.profile);
  const workout = workouts.find((w) => w.id === id);

  const shareCardRef = useRef<WorkoutShareCardHandle>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [stageHeight, setStageHeight] = useState(0);
  const { width: windowWidth } = useWindowDimensions();
  const hasNavigatedRef = useRef(false);

  // A 9:16 canvas is tall. On short screens, constrain the width to the height
  // the stage actually offers so the entire artwork remains visible without
  // scrolling. The footer actions stay fixed outside the exportable card.
  const cardMaxWidth =
    stageHeight > 0
      ? Math.min(
          windowWidth - spacing.md * 2,
          375,
          Math.max(230, (stageHeight - 8) * (9 / 16)),
        )
      : Math.min(windowWidth - spacing.md * 2, 375);

  // Safely navigate back to the Workouts page without minimizing the app
  const handleBackToWorkouts = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    router.replace('/(tabs)/workouts' as never);
  }, [router]);

  // Pressing phone hardware back button on Android
  useEffect(() => {
    const onBackPress = () => {
      handleBackToWorkouts();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [handleBackToWorkouts]);

  // Phone back swipe gesture / screen removal (Android gesture navigation & iOS swipe)
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (hasNavigatedRef.current) {
        return;
      }
      e.preventDefault();
      handleBackToWorkouts();
    });
    return unsubscribe;
  }, [navigation, handleBackToWorkouts]);

  // Celebratory entrance choreography
  const cardScale = useAnimatedValue(0.96);
  const cardOpacity = useAnimatedValue(0);
  const footerRise = useAnimatedValue(20);
  const footerOpacity = useAnimatedValue(0);

  useEffect(() => {
    hapticsMedium();

    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        damping: 15,
        stiffness: 140,
        mass: 0.9,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      hapticsSuccess();
      Animated.parallel([
        Animated.spring(footerRise, {
          toValue: 0,
          damping: 16,
          stiffness: 130,
          useNativeDriver: true,
        }),
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }, 180);

    return () => clearTimeout(timer);
  }, [cardScale, cardOpacity, footerRise, footerOpacity]);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    hapticsLight();
    try {
      await shareCardRef.current?.share();
    } finally {
      setIsSharing(false);
    }
  };

  if (!workout) {
    return (
      <View style={styles.notFoundRoot}>
        <T variant="body" dim style={{ textAlign: 'center', marginTop: 120 }}>
          Workout not found.
        </T>
        <Button
          label="Home"
          onPress={() => {
            hasNavigatedRef.current = true;
            router.replace('/(tabs)/home' as never);
          }}
          style={{ marginTop: 20, alignSelf: 'center' }}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top + 4, 12),
          paddingBottom: Math.max(insets.bottom + 6, 12),
        },
      ]}>
      {/* A restrained atmospheric wash keeps the app chrome separate from the artwork */}
      <LinearGradient
        colors={[withAlpha(colors.accent, 0.1), 'transparent', withAlpha(colors.accent, 0.04)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Top Header Dismiss Bar */}
      <View style={styles.topHeaderBar}>
        <T style={styles.topHeaderTitle}>Workout Complete</T>
        <Pressable
          onPress={handleBackToWorkouts}
          hitSlop={12}
          accessibilityLabel="Close Summary"
          style={styles.closeBtn}>
          <X size={17} color="rgba(247, 248, 246, 0.58)" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
        onLayout={(event) => {
          const height = event.nativeEvent.layout.height;
          setStageHeight((current) => (Math.abs(current - height) > 0.5 ? height : current));
        }}>
        {/* Animated 9:16 Shareable Workout Summary Canvas */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              maxWidth: cardMaxWidth,
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}>
          <WorkoutShareCard
            ref={shareCardRef}
            workout={workout}
            allWorkouts={workouts}
            gender={profile?.gender ?? 'male'}
          />
        </Animated.View>
      </ScrollView>

      {/* Screen Footer Actions: Parallel Single-Word Buttons (Share & Home) */}
      <Animated.View
        style={[
          styles.footerWrapper,
          {
            opacity: footerOpacity,
            transform: [{ translateY: footerRise }],
          },
        ]}>
        <Row gap={12} align="center" style={styles.footerRow}>
          {/* Share Button */}
          <Pressable
            onPress={handleShare}
            disabled={isSharing}
            accessibilityRole="button"
            accessibilityLabel="Share"
            style={({ pressed }) => [
              styles.parallelBtn,
              styles.shareBtn,
              {
                backgroundColor: colors.accent,
                shadowColor: colors.accent,
              },
              pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] },
              isSharing && { opacity: 0.7 },
            ]}>
            {isSharing ? (
              <ActivityIndicator size="small" color="#07110C" />
            ) : (
              <Row gap={8} align="center">
                <Share2 size={17} color="#07110C" strokeWidth={2.4} />
                <T style={styles.shareBtnText}>Share</T>
              </Row>
            )}
          </Pressable>

          {/* Home Button */}
          <Pressable
            onPress={handleBackToWorkouts}
            accessibilityRole="button"
            accessibilityLabel="Home"
            style={({ pressed }) => [
              styles.parallelBtn,
              styles.homeBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}>
            <Row gap={8} align="center">
              <Home size={18} color="#E2E8F0" strokeWidth={2.2} />
              <T style={styles.homeBtnText}>Home</T>
            </Row>
          </Pressable>
        </Row>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#040706',
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  notFoundRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingBottom: 6,
    zIndex: 10,
  },
  topHeaderTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'rgba(247, 248, 246, 0.46)',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 375,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerWrapper: {
    width: '100%',
    maxWidth: 375,
    alignSelf: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },
  footerRow: {
    width: '100%',
  },
  parallelBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#07110C',
    letterSpacing: 0.2,
  },
  homeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.11)',
  },
  homeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(247, 248, 246, 0.86)',
    letterSpacing: 0.2,
  },
});
