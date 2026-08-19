import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { accentTint, colors, gradients, radius, spacing } from '../theme';
import type { Workout, WorkoutPlan } from '../types';
import { T } from './Text';
import { Row, Tag } from './ui';
import { ExerciseThumb, planIcon } from './muscle-icon';
import { EXERCISE_MAP } from '../data/exercises';
import { useAnimatedValue } from '../lib/useAnimatedValue';
import { workoutStats } from '../lib/stats';

// ---------------------------------------------------------------------------
// Plan card (Workouts tab)
// ---------------------------------------------------------------------------

/**
 * A plan day card. Tapping the card expands/collapses the exercise list with a
 * smooth height animation; the Start button is independent and launches the
 * workout (and its timer) directly.
 */
export function PlanCard({
  plan,
  onStart,
  onEdit,
}: {
  plan: WorkoutPlan;
  onStart?: () => void;
  onEdit?: () => void;
}) {
  const totalSets = plan.exercises.reduce((s, e) => s + e.sets, 0);
  const duration = Math.round(plan.exercises.reduce((s, e) => s + e.sets * 3, 0) * 1.15 + 8);
  const [open, setOpen] = useState(false);
  const openAnim = useAnimatedValue(0);
  const [contentH, setContentH] = useState(0);

  useEffect(() => {
    Animated.timing(openAnim, {
      toValue: open ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [open, openAnim]);

  return (
    <View style={styles.planCard}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityLabel={`${plan.title}, ${plan.exercises.length} exercises`}
        accessibilityState={{ expanded: open }}
        // note: no accessibilityRole here — the Start button below is nested
        // inside this pressable, and two HTML <button> roles would be invalid
        style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
        <View style={styles.planCardInner}>
          <View style={{ flex: 1, gap: 6, paddingRight: 8 }}>
            <Row gap={8} align="center">
              <MaterialCommunityIcons name={planIcon(plan.emoji)} size={18} color={colors.text} />
              <T variant="h3" style={{ flex: 1 }} numberOfLines={1}>
                {plan.title}
              </T>
              <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
            </Row>
            <Row gap={4} wrap style={{ flexShrink: 1, marginTop: 1 }}>
              {plan.muscles.map((m) => (
                <Tag key={m} label={m} color={colors.textDim} bg={colors.surface3} />
              ))}
            </Row>
            <T variant="small" dim style={{ marginTop: 2 }}>
              {plan.exercises.length} exercises · {totalSets} sets · ~{duration} min
            </T>
          </View>
          <View style={styles.planCardActions}>
            {onEdit ? (
              <Pressable
                onPress={(e) => {
                  // @ts-ignore - prevent accordion toggle on edit click
                  e?.stopPropagation?.();
                  onEdit();
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${plan.title} plan`}
                style={({ pressed }) => [styles.editBtnTop, pressed && { opacity: 0.75 }]}>
                <Ionicons name="pencil" size={13} color={colors.textDim} />
              </Pressable>
            ) : <View style={{ height: 28 }} />}
            {onStart ? (
              <Pressable
                onPress={onStart}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`Start ${plan.title} workout`}
                style={({ pressed }) => [styles.startBtn, { backgroundColor: colors.accent, marginTop: 10 }, pressed && { opacity: 0.85 }]}>
                <T variant="smallSemi" style={{ color: colors.bg, fontSize: 12 }}>
                  Start
                </T>
                <Ionicons name="play" size={12} color={colors.bg} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </Pressable>

      {/* expandable exercise list — always rendered so height can be measured,
          clipped and animated by the wrapper */}
      <Animated.View
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
        aria-hidden={!open}
        style={{
          height: openAnim.interpolate({ inputRange: [0, 1], outputRange: [0, contentH] }),
          opacity: openAnim,
          overflow: 'hidden',
        }}>
        <View
          onLayout={(e) => setContentH(e.nativeEvent.layout.height)}
          style={styles.expandWrap}>
          <View style={styles.exDivider} />
          {plan.exercises.map((spec) => {
            const ex = EXERCISE_MAP[spec.exerciseId];
            if (!ex) return null;
            return (
              <View key={spec.exerciseId} style={styles.exRow}>
                <ExerciseThumb muscle={ex.muscleGroup} size={30} />
                <View style={{ flex: 1 }}>
                  <T variant="smallSemi" numberOfLines={1}>
                    {ex.name}
                  </T>
                  <T variant="micro" muted>
                    {ex.equipment} · {ex.muscleGroup}
                  </T>
                </View>
                <T variant="smallMedium" dim>
                  {spec.sets} × {spec.targetReps}
                </T>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// History card (History screen)
// ---------------------------------------------------------------------------

export function HistoryCard({
  workout,
  onPress,
  isPR,
  isVolumeUp,
}: {
  workout: Workout;
  onPress?: () => void;
  isPR?: boolean;
  isVolumeUp?: boolean;
}) {
  const stats = workoutStats(workout);
  const first = EXERCISE_MAP[workout.exercises[0]?.exerciseId];
  const date = new Date(workout.startTime);
  const dateLabel = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeLabel = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.historyCard, pressed && { opacity: 0.9 }]}>
      <View style={styles.historyLeft}>
        {first ? <ExerciseThumb muscle={first.muscleGroup} size={44} /> : null}
        <View style={{ flex: 1, gap: 3 }}>
          <T variant="bodySemi" numberOfLines={1}>
            {workout.title}
          </T>
          <T variant="small" muted style={{ fontSize: 12 }}>
            {dateLabel} · {timeLabel}
          </T>
          <Row gap={8} style={{ marginTop: 4 }}>
            <T variant="micro" style={{ color: colors.textDim }}>
              {stats.exercises} ex
            </T>
            <T variant="micro" style={{ color: colors.textDim }}>
              {stats.sets} sets
            </T>
            <T variant="micro" style={{ color: colors.accent }}>
              {stats.volumeKg.toLocaleString()} kg
            </T>
            {isPR ? <Ionicons name="trophy" size={12} color={colors.gold} /> : null}
            {isVolumeUp ? <Ionicons name="trending-up" size={12} color={colors.success} /> : null}
          </Row>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Hero "today's workout" card (Home)
// ---------------------------------------------------------------------------

export function TodayWorkoutCard({
  plan,
  prevWorkout,
  onStart,
}: {
  plan: WorkoutPlan;
  prevWorkout?: Workout | null;
  onStart: () => void;
}) {
  const totalSets = plan.exercises.reduce((s, e) => s + e.sets, 0);
  const duration = Math.round(plan.exercises.reduce((s, e) => s + e.sets * 3, 0) * 1.15 + 8);
  const first = EXERCISE_MAP[plan.exercises[0]?.exerciseId];

  return (
    <View style={[styles.heroCard, { borderColor: `${colors.accent}2E` }]}>
      <LinearGradient colors={[accentTint(colors.accent, 0.16), '#0E1410', colors.bg]} style={StyleSheet.absoluteFill} />
      <View style={[styles.heroGlow, { backgroundColor: `${colors.accent}1A` }]} />
      <View style={{ padding: spacing.lg, gap: 10 }}>
        <Row align="space-between">
          <Tag label="Today's Workout" />
          <T variant="micro" muted>
            Difficulty · {plan.exercises.reduce((s, e) => s + e.sets, 0) >= 15 ? 'High' : plan.exercises.length >= 5 ? 'Medium' : 'Low'}
          </T>
        </Row>
        <T variant="h1">{plan.title}</T>
        <Row gap={14} wrap>
          <StatPill icon="barbell-outline" text={`${plan.exercises.length} exercises`} />
          <StatPill icon="layers-outline" text={`${totalSets} sets`} />
          <StatPill icon="time-outline" text={`~${duration} min`} />
        </Row>
        <Row gap={6} wrap>
          {plan.muscles.map((m) => (
            <Tag key={m} label={m} color={colors.accent} bg={colors.accentSoft} />
          ))}
        </Row>
        {prevWorkout ? (
          <View style={styles.prevRow}>
            <Ionicons name="time-outline" size={14} color={colors.textDim} />
            <T variant="small" dim style={{ fontSize: 12 }}>
              Previous · {new Date(prevWorkout.startTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} ·{' '}
              {workoutStats(prevWorkout).volumeKg.toLocaleString()} kg
            </T>
          </View>
        ) : null}
        <Pressable onPress={onStart} style={({ pressed }) => [styles.heroCta, pressed && { opacity: 0.9 }]}>
          <LinearGradient colors={[...gradients.accent]} style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} />
          <T variant="bodySemi" style={{ color: colors.bg, fontSize: 16 }}>
            Start Workout
          </T>
          <Ionicons name="arrow-forward" size={18} color={colors.bg} />
        </Pressable>
      </View>
      {first ? (
        <View style={styles.heroArt}>
          <ExerciseThumb muscle={first.muscleGroup} size={110} rounded={28} />
        </View>
      ) : null}
    </View>
  );
}

function StatPill({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={13} color={colors.textDim} />
      <T variant="small" dim style={{ fontSize: 12 }}>
        {text}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  planCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  planCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  planCardActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  editBtnTop: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  expandWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 2,
  },
  exDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },

  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  historyLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },

  heroCard: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    minHeight: 260,
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  prevRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroCta: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 999,
  },
  heroArt: { position: 'absolute', right: -18, bottom: -14, opacity: 0.5, transform: [{ rotate: '-8deg' }] },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
