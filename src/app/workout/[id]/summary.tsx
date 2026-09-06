import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Share2 } from 'lucide-react-native';
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
    <View style={[styles.root, { paddingTop: Math.max(insets.top + 8, 20), paddingBottom: Math.max(insets.bottom + 12, 24) }]}>
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

      {/* Screen Footer: Primary "Finish/Go Home" and Secondary Icon-only "Share" */}
      <Animated.View
        style={[
          styles.footerWrapper,
          {
            opacity: footerOpacity,
            transform: [{ translateY: footerRise }],
          },
        ]}>
        <Row gap={12} align="center" style={styles.footerRow}>
          <Button
            label="Finish / Go Home"
            icon="checkmark"
            full
            size="lg"
            style={styles.primaryFinishBtn}
            onPress={handleBackToWorkouts}
          />
          <Pressable
            onPress={handleShare}
            disabled={isSharing}
            accessibilityRole="button"
            accessibilityLabel="Share Workout Summary"
            style={({ pressed }) => [
              styles.shareIconBtn,
              pressed && { opacity: 0.8 },
              isSharing && { opacity: 0.6 },
            ]}>
            {isSharing ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Share2 size={22} color={colors.text} strokeWidth={2} />
            )}
          </Pressable>
        </Row>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  notFoundRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerWrapper: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    paddingTop: spacing.sm,
  },
  footerRow: {
    width: '100%',
  },
  primaryFinishBtn: {
    flex: 1,
  },
  shareIconBtn: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
