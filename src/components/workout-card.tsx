import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { accentTint, colors, gradients, radius, spacing, useAccent } from '../theme';
import type { Workout, WorkoutPlan } from '../types';
import { T } from './Text';
import { Row, Tag } from './ui';
import { ExerciseThumb, planIcon } from './muscle-icon';
import { EXERCISE_MAP } from '../data/exercises';
import { useAnimatedValue } from '../lib/useAnimatedValue';
import { workoutStats } from '../lib/stats';
import { AnimatedChevron, CollapsibleContent, animateLayout } from './collapsible';

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
  const duration = Math.round(totalSets * 2.8 + plan.exercises.length * 3 + 8);
  const [open, setOpen] = useState(false);

  const toggleOpen = () => {
    animateLayout();
    setOpen((o) => !o);
  };

  return (
    <View style={styles.planCard}>
      <Pressable
        onPress={toggleOpen}
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
              <AnimatedChevron isOpen={open} size={18} color={colors.textMuted} />
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

      {/* expandable exercise list */}
      <CollapsibleContent isOpen={open}>
        <View style={styles.expandWrap}>
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
      </CollapsibleContent>
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
  plans = [],
  onSelectPlan,
  completedWorkout,
  activeWorkout,
  isLongLayoff,
  onResume,
}: {
  plan?: WorkoutPlan;
  prevWorkout?: Workout | null;
  onStart: (p?: WorkoutPlan) => void;
  plans?: WorkoutPlan[];
  onSelectPlan?: (p: WorkoutPlan) => void;
  completedWorkout?: Workout | null;
  activeWorkout?: Workout | null;
  isLongLayoff?: boolean;
  onResume?: () => void;
}) {
  useAccent();
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // ── IN PROGRESS ACTIVE WORKOUT HERO ───────────────────────────────────────
  if (activeWorkout) {
    const totalSets = activeWorkout.exercises.reduce((s, e) => s + e.sets.length, 0);
    const completedSets = activeWorkout.exercises.reduce(
      (s, e) => s + e.sets.filter((x) => x.completed).length,
      0,
    );

    return (
      <View style={[styles.heroCard, { borderColor: `${colors.accent}66` }]}>
        <LinearGradient colors={[accentTint(colors.accent, 0.22), colors.bg]} style={StyleSheet.absoluteFill} />
        <View style={[styles.heroGlow, { backgroundColor: `${colors.accent}2E` }]} />
        <View style={{ padding: spacing.lg, gap: 10 }}>
          <Row align="space-between">
            <Tag label="🔥 WORKOUT IN PROGRESS" color={colors.accent} bg={colors.accentSoft} />
            <T variant="micro" accent style={{ fontWeight: '700' }}>
              LIVE
            </T>
          </Row>
          <T variant="h1">{activeWorkout.title}</T>
          <Row gap={14} wrap>
            <StatPill icon="barbell-outline" text={`${activeWorkout.exercises.length} exercises`} />
            <StatPill icon="layers-outline" text={`${completedSets}/${totalSets} sets done`} />
          </Row>
          <Pressable onPress={onResume} style={({ pressed }) => [styles.heroCta, pressed && { opacity: 0.9 }]}>
            <LinearGradient colors={[...gradients.accent]} style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} />
            <T variant="bodySemi" style={{ color: colors.bg, fontSize: 16 }}>
              Resume Workout
            </T>
            <Ionicons name="arrow-forward" size={18} color={colors.bg} />
          </Pressable>
        </View>
      </View>
    );
  }

  // ── COMPLETED TODAY HERO (OPTION A: RECOVERY & SUBTLE PREVIEW) ─────────────
  if (completedWorkout) {
    const st = workoutStats(completedWorkout);
    return (
      <>
        <View style={[styles.heroCard, { borderColor: `${colors.emerald}4D` }]}>
          <LinearGradient colors={[accentTint(colors.emerald, 0.18), colors.bg]} style={StyleSheet.absoluteFill} />
          <View style={[styles.heroGlow, { backgroundColor: `${colors.emerald}1A` }]} />
          <View style={{ padding: spacing.lg, gap: 12 }}>
            <Row align="space-between">
              <Tag label="COMPLETED TODAY 🎉" color={colors.emerald} bg={`${colors.emerald}1F`} />
              <T variant="micro" muted>
                Time to recover
              </T>
            </Row>
            <T variant="h1">{completedWorkout.title}</T>
            <Row gap={14} wrap>
              <StatPill icon="barbell-outline" text={`${st.volumeKg.toLocaleString()} kg lifted`} />
              <StatPill icon="layers-outline" text={`${st.sets} sets completed`} />
              <StatPill icon="time-outline" text={`${st.durationMin} min`} />
            </Row>

            {plan ? (
              <Pressable
                onPress={() => setShowPreviewModal(true)}
                style={({ pressed }) => [styles.nextUpPreviewBtn, pressed && { opacity: 0.85 }]}>
                <Row align="space-between" style={{ width: '100%' }}>
                  <Row gap={8} align="center">
                    <View style={styles.previewSparkle}>
                      <Ionicons name="sparkles" size={12} color={colors.accent} />
                    </View>
                    <View>
                      <T variant="micro" muted style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Up Next (Tomorrow)
                      </T>
                      <T variant="bodySemi" style={{ fontSize: 14 }}>
                        {plan.title}
                      </T>
                    </View>
                  </Row>
                  <Row gap={4} align="center">
                    <T variant="micro" accent style={{ fontWeight: '600' }}>
                      Preview
                    </T>
                    <Ionicons name="chevron-forward" size={14} color={colors.accent} />
                  </Row>
                </Row>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Up Next Preview Modal */}
        {plan ? (
          <Modal
            visible={showPreviewModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowPreviewModal(false)}>
            <Pressable style={styles.modalBackdrop} onPress={() => setShowPreviewModal(false)}>
              <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                <Row align="space-between" style={{ marginBottom: spacing.md }}>
                  <T variant="h2">
                    {plan.emoji ? `${plan.emoji} ` : ''}{plan.title}
                  </T>
                  <Pressable onPress={() => setShowPreviewModal(false)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={20} color={colors.textDim} />
                  </Pressable>
                </Row>
                <Row gap={6} wrap style={{ marginBottom: spacing.md }}>
                  <Tag label="Tomorrow's Split" color={colors.accent} bg={colors.accentSoft} />
                  {plan.muscles.map((m) => (
                    <Tag key={m} label={m} />
                  ))}
                </Row>
                <T variant="small" dim style={{ marginBottom: spacing.sm }}>
                  Exercises scheduled for this routine:
                </T>
                <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                  <View style={{ gap: spacing.xs }}>
                    {plan.exercises.map((pe, idx) => {
                      const ex = EXERCISE_MAP[pe.exerciseId];
                      return (
                        <View key={`${pe.exerciseId}-${idx}`} style={styles.previewExerciseRow}>
                          <T variant="bodySemi" style={{ flex: 1, fontSize: 13 }} numberOfLines={1}>
                            {ex?.name ?? pe.exerciseId}
                          </T>
                          <T variant="micro" muted>
                            {pe.sets} sets · {pe.targetReps} reps
                          </T>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
                <Pressable
                  onPress={() => {
                    setShowPreviewModal(false);
                    onStart(plan);
                  }}
                  style={({ pressed }) => [styles.heroCta, { marginTop: spacing.md }, pressed && { opacity: 0.9 }]}>
                  <LinearGradient colors={[...gradients.accent]} style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} />
                  <T variant="bodySemi" style={{ color: colors.bg, fontSize: 15 }}>
                    Start Workout Early
                  </T>
                  <Ionicons name="arrow-forward" size={16} color={colors.bg} />
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>
        ) : null}
      </>
    );
  }

  // ── READY TO START HERO ───────────────────────────────────────────────────
  if (!plan) return null;

  const totalSets = plan.exercises.reduce((s, e) => s + e.sets, 0);
  const duration = Math.round(plan.exercises.reduce((s, e) => s + e.sets * 3, 0) * 1.15 + 8);
  const first = EXERCISE_MAP[plan.exercises[0]?.exerciseId];

  return (
    <>
      <View style={[styles.heroCard, { borderColor: `${colors.accent}2E` }]}>
        <LinearGradient colors={[accentTint(colors.accent, 0.16), colors.bg]} style={StyleSheet.absoluteFill} />
        <View style={[styles.heroGlow, { backgroundColor: `${colors.accent}1A` }]} />
        <View style={{ padding: spacing.lg, gap: 10 }}>
          <Row align="space-between">
            <Tag label={isLongLayoff ? 'Fresh Start · Day 1' : "Today's Workout"} />
            <Row gap={8} align="center">
              {plans.length > 1 ? (
                <Pressable
                  onPress={() => setShowSwapModal(true)}
                  style={({ pressed }) => [styles.swapPlanBtn, pressed && { opacity: 0.8 }]}>
                  <Ionicons name="swap-horizontal" size={12} color={colors.accent} />
                  <T variant="micro" accent style={{ fontWeight: '700' }}>
                    Swap
                  </T>
                </Pressable>
              ) : null}
              <T variant="micro" muted>
                Difficulty · {totalSets >= 15 ? 'High' : plan.exercises.length >= 5 ? 'Medium' : 'Low'}
              </T>
            </Row>
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
          <Pressable onPress={() => onStart(plan)} style={({ pressed }) => [styles.heroCta, pressed && { opacity: 0.9 }]}>
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

      {/* Swap Plan Modal */}
      <Modal visible={showSwapModal} transparent animationType="fade" onRequestClose={() => setShowSwapModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowSwapModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Row align="space-between" style={{ marginBottom: spacing.md }}>
              <T variant="h2">Select Workout</T>
              <Pressable onPress={() => setShowSwapModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.textDim} />
              </Pressable>
            </Row>
            <T variant="small" dim style={{ marginBottom: spacing.md }}>
              Choose which routine to perform for today&apos;s session:
            </T>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: spacing.sm }}>
                {plans.map((p) => {
                  const isSelected = p.id === plan.id;
                  const pSets = p.exercises.reduce((s, e) => s + e.sets, 0);
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => {
                        onSelectPlan?.(p);
                        setShowSwapModal(false);
                      }}
                      style={[
                        styles.planOptionRow,
                        isSelected && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
                      ]}>
                      <View style={[styles.planOptionEmoji, isSelected && { backgroundColor: `${colors.accent}33` }]}>
                        <T variant="h2">{p.emoji || '⚡'}</T>
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <T variant="bodySemi" numberOfLines={1}>
                          {p.title}
                        </T>
                        <T variant="micro" muted numberOfLines={1}>
                          {p.exercises.length} exercises · {pSets} sets · {p.muscles.join(', ')}
                        </T>
                      </View>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                      ) : (
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  nextUpPreviewBtn: {
    backgroundColor: `${colors.accent}12`,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  previewSparkle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: `${colors.accent}2E`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroCtaSecondary: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nextUpPreviewBox: {
    backgroundColor: `${colors.accent}14`,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    marginTop: 2,
  },
  swapPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    elevation: 8,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  planOptionEmoji: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
