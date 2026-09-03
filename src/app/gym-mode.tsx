import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T } from '../components/Text';
import { toast } from '../components/misc';
import { EXERCISE_MAP } from '../data/exercises';
import { useNow, usePulse } from '../store/useStore';
import { accentTint, colors, gradients, layout, radius, spacing, useAccent } from '../theme';

export default function GymModeScreen() {
  useAccent();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const activeWorkout = usePulse((s) => s.activeWorkout);
  const completeSet = usePulse((s) => s.completeSet);
  const [weight, setWeight] = useState(20);
  const [reps, setReps] = useState(10);
  const [restLeft, setRestLeft] = useState(0);
  const now = useNow(1000);

  const workout = activeWorkout;
  const currentEx = workout?.exercises.find((we) => we.sets.some((s) => !s.completed));
  const currentSet = currentEx?.sets.find((s) => !s.completed);
  const ex = currentEx ? EXERCISE_MAP[currentEx.exerciseId] : undefined;

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (workout?.id) {
      router.replace(`/workout/${workout.id}` as never);
    } else {
      router.replace('/(tabs)/home' as never);
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      handleClose();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [router, workout?.id]);

  // Seed the steppers with the current set's stored values when moving to a
  // new set. Track the last-synced set id and adjust state during render (the
  // React-recommended pattern) instead of calling setState inside an effect.
  // Start at undefined so the very first render syncs too (matching the old
  // mount effect).
  const [syncedSetId, setSyncedSetId] = useState<string | undefined>(undefined);
  if (currentSet?.id !== syncedSetId) {
    setSyncedSetId(currentSet?.id);
    if (currentSet?.weightKg != null) setWeight(currentSet.weightKg);
    if (currentSet?.reps != null) setReps(currentSet.reps);
  }

  useEffect(() => {
    if (restLeft <= 0) return;
    const t = setTimeout(() => setRestLeft((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [restLeft, now]);

  if (!workout || !currentEx || !currentSet || !ex) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="checkmark-done-circle" size={60} color={colors.accent} />
        <T variant="h2" style={{ marginTop: spacing.md }}>
          Workout complete!
        </T>
        <Pressable onPress={() => router.replace('/(tabs)/home' as never)} style={[styles.exitCta, { backgroundColor: colors.accent }]}>
          <T variant="bodySemi" style={{ color: colors.bg }}>
            Back to Home
          </T>
        </Pressable>
      </View>
    );
  }

  const doneCount = workout.exercises.reduce((s, we) => s + we.sets.filter((x) => x.completed).length, 0);
  const totalCount = workout.exercises.reduce((s, we) => s + we.sets.length, 0);

  const complete = () => {
    completeSet(ex.id, currentSet.id);
    setRestLeft(60);
    toast('💪');
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[accentTint(colors.accent, 0.12), colors.bg]} style={StyleSheet.absoluteFill} />

      {/* minimal top bar */}
      <View style={[styles.top, { paddingTop: Math.max(insets.top + layout.screenTopPad, spacing.xl) }]}>
        <Pressable onPress={handleClose} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.textDim} />
        </Pressable>
        <T variant="small" dim>
          {workout.title} · {doneCount}/{totalCount}
        </T>
        <View style={{ width: 26 }} />
      </View>

      {/* current exercise */}
      <View style={styles.exercise}>
        <T variant="label" accent style={{ fontSize: 12 }}>
          Current exercise
        </T>
        <T variant="hero" style={{ marginTop: 8, fontSize: 40 }}>
          {ex.name}
        </T>
        <T variant="small" dim style={{ marginTop: 4 }}>
          Set {currentSet.setIndex} of {currentEx.sets.length} · {currentEx.targetReps} reps · {ex.equipment}
        </T>
      </View>

      {/* big numbers */}
      <View style={styles.numbers}>
        <View style={styles.numberCol}>
          <Pressable onPress={() => setWeight((w) => Math.max(0, w + 2.5))} style={styles.bigBtn}>
            <Ionicons name="add" size={34} color={colors.text} />
          </Pressable>
          <View style={{ alignItems: 'center', marginVertical: spacing.sm }}>
            <T variant="hero" accent style={{ fontSize: 64 }}>
              {weight}
            </T>
            <T variant="small" dim>
              kg
            </T>
          </View>
          <Pressable onPress={() => setWeight((w) => Math.max(0, w - 2.5))} style={styles.bigBtn}>
            <Ionicons name="remove" size={34} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.vDivider} />

        <View style={styles.numberCol}>
          <Pressable onPress={() => setReps((r) => Math.min(50, r + 1))} style={styles.bigBtn}>
            <Ionicons name="add" size={34} color={colors.text} />
          </Pressable>
          <View style={{ alignItems: 'center', marginVertical: spacing.sm }}>
            <T variant="hero" style={{ fontSize: 64 }}>
              {reps}
            </T>
            <T variant="small" dim>
              reps
            </T>
          </View>
          <Pressable onPress={() => setReps((r) => Math.max(0, r - 1))} style={styles.bigBtn}>
            <Ionicons name="remove" size={34} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* rest timer */}
      {restLeft > 0 ? (
        <View style={[styles.restBanner, { borderColor: `${colors.accent}4D` }]}>
          <T variant="num" accent>
            {restLeft}s
          </T>
          <T variant="small" dim>
            Resting — next set in a bit
          </T>
        </View>
      ) : null}

      {/* giant complete button */}
      <Pressable onPress={complete} style={({ pressed }) => [styles.complete, pressed && { opacity: 0.85 }]}>
        <LinearGradient colors={[...gradients.accent]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <Ionicons name="checkmark" size={26} color={colors.bg} />
        <T variant="h2" style={{ color: colors.bg }}>
          Complete Set
        </T>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.xl },
  exercise: { marginTop: spacing.xl },
  numbers: { flexDirection: 'row', marginTop: spacing.xxl, justifyContent: 'center', gap: spacing.xl },
  numberCol: { alignItems: 'center', flex: 1 },
  bigBtn: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vDivider: { width: 1, backgroundColor: colors.border },
  restBanner: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  complete: {
    position: 'absolute',
    bottom: 48,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 22,
    borderRadius: 999,
    overflow: 'hidden',
  },
  exitCta: {
    marginTop: spacing.lg,
    borderRadius: 999,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
});
