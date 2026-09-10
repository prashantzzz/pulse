import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Home, Share2, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
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
  const hasNavigatedRef = useRef(false);

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
      {/* Top Header Dismiss Bar */}
      <View style={styles.topHeaderBar}>
        <T style={styles.topHeaderTitle}>Workout Complete</T>
        <Pressable
          onPress={handleBackToWorkouts}
          hitSlop={12}
          accessibilityLabel="Close Summary"
          style={styles.closeBtn}>
          <X size={18} color={colors.textDim} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Animated 9:16 Shareable Workout Summary Canvas */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
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
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              isSharing && { opacity: 0.7 },
            ]}>
            {isSharing ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Row gap={8} align="center">
                <Share2 size={18} color="#000000" strokeWidth={2.4} />
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
    backgroundColor: '#05070A',
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
  },
  notFoundRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingBottom: 4,
    zIndex: 10,
  },
  topHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
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
    paddingTop: 8,
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
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.2,
  },
  homeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  homeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.2,
  },
});
