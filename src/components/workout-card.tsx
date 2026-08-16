import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, gradients, radius, spacing } from '../theme';
import type { WorkoutPlan } from '../types';
import { T } from './Text';
import { Row, Tag } from './ui';
import { ExerciseThumb } from './muscle-icon';
import { EXERCISE_MAP } from '../data/exercises';
import { workoutStats } from '../lib/stats';
import type { Workout } from '../types';

// ---------------------------------------------------------------------------
// Plan card (Workouts tab)
// ---------------------------------------------------------------------------

export function PlanCard({
  plan,
  onPress,
  onStart,
}: {
  plan: WorkoutPlan;
  onPress?: () => void;
  onStart?: () => void;
}) {
  const first = EXERCISE_MAP[plan.exercises[0]?.exerciseId];
  const totalSets = plan.exercises.reduce((s, e) => s + e.sets, 0);
  const duration = Math.round(plan.exercises.reduce((s, e) => s + e.sets * 3, 0) * 1.15 + 8);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.planCard, pressed && { opacity: 0.9 }]}>
      <View style={styles.planCardInner}>
        <View style={{ flex: 1, gap: 6 }}>
          <Row gap={8}>
            <T variant="h3">{plan.emoji} {plan.title}</T>
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
          </Row>
          <Row gap={6} wrap>
            {plan.muscles.map((m) => (
              <Tag key={m} label={m} color={colors.textDim} bg={colors.surface3} />
            ))}
          </Row>
          <T variant="small" dim style={{ marginTop: 4 }}>
            {plan.exercises.length} exercises · {totalSets} sets · ~{duration} min
          </T>
        </View>
        {first ? (
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <ExerciseThumb muscle={first.muscleGroup} size={52} />
            <Pressable onPress={onStart} hitSlop={6} style={[styles.startBtn, { backgroundColor: colors.accent }]}>
              <T variant="smallSemi" style={{ color: colors.bg, fontSize: 12 }}>
                Start
              </T>
              <Ionicons name="play" size={12} color={colors.bg} />
            </Pressable>
          </View>
        ) : null}
      </View>
    </Pressable>
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
      <LinearGradient colors={['#1A2A10', '#0E1410', '#0A0B0D']} style={StyleSheet.absoluteFill} />
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
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
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
