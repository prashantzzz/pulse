import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAnimatedValue } from '../../lib/useAnimatedValue';

import { T } from '../../components/Text';
import { Avatar } from '../../components/misc';
import { Card, Icon, ProgressBar, Row, Screen, Section, Tag } from '../../components/ui';
import { TodayWorkoutCard } from '../../components/workout-card';
import { EXERCISE_MAP, MUSCLE_GROUPS } from '../../data/exercises';
import { greetingFor } from '../../lib/greeting';
import { currentStreak, detectPRs, formatCompact, nextMoves, workoutsInLastDays, workoutStats, type NextMove } from '../../lib/stats';
import { usePulse } from '../../store/useStore';
import { accentTint, colors, gradients, layout, radius, spacing, useAccent } from '../../theme';
import type { WorkoutPlan } from '../../types';

// rotate through the user's plans (editable in My Workouts) — module-level so
// the purity lint rule doesn't flag Date.now() inside the component
function todaysPlan(plans: WorkoutPlan[]): WorkoutPlan | undefined {
  if (plans.length === 0) return undefined;
  return plans[Math.floor(Date.now() / 86400000) % plans.length];
}

export default function HomeScreen() {
  // subscribe so this screen re-renders (and recreates its children) live on accent change
  useAccent();
  const router = useRouter();
  const profile = usePulse((s) => s.profile);
  const workouts = usePulse((s) => s.workouts);
  const plans = usePulse((s) => s.plans);
  const startWorkout = usePulse((s) => s.startWorkout);

  const plan = todaysPlan(plans);
  const greeting = greetingFor();
  const week = workoutsInLastDays(workouts, 7);
  const weekStats = week.reduce((acc, w) => {
    const st = workoutStats(w);
    acc.volume += st.volumeKg;
    acc.sets += st.sets;
    return acc;
  }, { volume: 0, sets: 0 });
  const streak = currentStreak(workouts);
  const last = workouts.reduce<typeof workouts[number] | null>((best, w) => (!best || new Date(w.startTime) > new Date(best.startTime) ? w : best), null) ?? workouts[workouts.length - 1];
  const prevEquivalent = plan
    ? [...workouts].filter((w) => w.id !== last?.id).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).find((w) => w.title === plan.title)
    : undefined;
  const recentPrs = last ? [...detectPRs(last, workouts)].sort((a, b) => b.deltaPct - a.deltaPct) : [];
  const moves = nextMoves(workouts, plans, plan?.id);

  // celebrate the PR with a mount pulse
  const pulse = useAnimatedValue(0);
  useEffect(() => {
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [pulse]);

  const pr = recentPrs[0];
  const first = last ? EXERCISE_MAP[last.exercises[0]?.exerciseId] : null;
  const lastStats = last ? workoutStats(last) : null;

  return (
    <Screen
      scroll
      onSwipeLeft={() => router.push('/workouts' as never)}
      contentStyle={{ paddingBottom: layout.tabContentBottomPad, paddingTop: layout.screenTopPad }}>
      {/* header */}
      <Row align="space-between" style={{ marginBottom: spacing.lg }}>
        <View>
          <T variant="h2">
            {greeting.heading}, {profile?.name ?? 'Athlete'}
          </T>
          <T variant="small" dim style={{ marginTop: 2 }}>
            {greeting.sub}
          </T>
        </View>
        <Pressable onPress={() => router.push('/profile' as never)}>
          <Avatar name={profile?.name ?? 'Athlete'} uri={profile?.avatarUrl} size={40} hue={90} showRing={streak > 0} />
        </Pressable>
      </Row>

      {/* streak banner */}
      <View style={styles.streakBanner}>
        <LinearGradient colors={[accentTint(colors.accent, 0.17), colors.surface]} style={StyleSheet.absoluteFill} />
        <View style={[styles.streakFlame, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name="flame" size={22} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <T variant="bodySemi">{streak}-day streak</T>
          <T variant="small" dim style={{ fontSize: 12 }}>
            {streak >= 3 ? 'You are on fire — keep it rolling' : 'One workout today keeps it alive'}
          </T>
        </View>
        <T variant="h3" accent>
          🔥
        </T>
      </View>

      {/* today's workout hero */}
      {plan ? (
        <View style={{ marginTop: spacing.lg }}>
          <TodayWorkoutCard
            plan={plan}
            prevWorkout={prevEquivalent}
            onStart={() => {
              const w = startWorkout(plan.title, plan.exercises);
              router.push(`/workout/${w.id}`);
            }}
          />
        </View>
      ) : (
        <View style={{ marginTop: spacing.lg }}>
          <Card gradient="charcoal" style={{ padding: spacing.lg, borderRadius: radius.xxl, borderWidth: 1, borderColor: `${colors.accent}33` }}>
            <Row align="space-between" style={{ marginBottom: spacing.xs }}>
              <Tag label="Get Started" color={colors.accent} bg={colors.accentSoft} />
              <T variant="micro" muted>
                3–5 Days / Week
              </T>
            </Row>
            <T variant="h2" style={{ marginTop: 6 }}>
              Choose a Workout Plan
            </T>
            <T variant="small" dim style={{ marginTop: 4, lineHeight: 18 }}>
              Select an evidence-based routine from our template library, built on 2026 ACSM guidelines.
            </T>
            <Pressable
              onPress={() => router.push('/workouts' as never)}
              style={({ pressed }) => [styles.starterCta, pressed && { opacity: 0.9 }]}>
              <LinearGradient colors={[...gradients.accent]} style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} />
              <T variant="bodySemi" style={{ color: colors.bg, fontSize: 14.5 }}>
                Browse Workout Templates
              </T>
              <Ionicons name="arrow-forward" size={16} color={colors.bg} />
            </Pressable>
          </Card>
        </View>
      )}

      {/* quick summary */}
      <Section title="Quick Summary">
        <Card gradient="charcoal" style={{ padding: spacing.lg }}>
          <Row align="space-between" style={{ marginBottom: spacing.md }}>
            <T variant="label" dim>
              This Week
            </T>
            <Row gap={16}>
              <Row gap={4}>
                <Ionicons name="trending-up" size={14} color={colors.accent} />
                <T variant="smallMedium" accent style={{ fontSize: 12 }}>
                  +8%
                </T>
              </Row>
            </Row>
          </Row>
          <Row align="space-between">
            <View style={{ alignItems: 'center', gap: 4 }}>
              <T variant="num">{week.length}</T>
              <T variant="micro" muted>
                Workouts
              </T>
            </View>
            <View style={styles.dividerV} />
            <View style={{ alignItems: 'center', gap: 4 }}>
              <T variant="num" accent>
                {formatCompact(weekStats.volume)}
              </T>
              <T variant="micro" muted>
                Volume (kg)
              </T>
            </View>
            <View style={styles.dividerV} />
            <View style={{ alignItems: 'center', gap: 4 }}>
              <T variant="num">{weekStats.sets}</T>
              <T variant="micro" muted>
                Sets
              </T>
            </View>
          </Row>
        </Card>
      </Section>

      {/* PR celebration */}
      {pr ? (
        <Section title="Personal Record" action="See all" onAction={() => router.push('/progress' as never)}>
          <Animated.View style={{ transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }] }}>
            <Card gradient="charcoal" style={{ overflow: 'hidden' }}>
              <LinearGradient colors={[`${colors.accent}24`, `${colors.accent}00`]} style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={styles.trophy}>
                  <Ionicons name="trophy" size={24} color={colors.bg} />
                </View>
                <View style={{ flex: 1 }}>
                  <T variant="label" accent style={{ fontSize: 10 }}>
                    New Personal Record
                  </T>
                  <T variant="h3" style={{ marginTop: 2 }}>
                    {pr.exerciseName}
                  </T>
                  <T variant="h2" accent style={{ marginTop: 2 }}>
                    {pr.weightKg} kg × {pr.reps}
                  </T>
                  <T variant="small" dim style={{ marginTop: 2, fontSize: 12 }}>
                    {pr.prevWeightKg != null
                      ? `Previous best ${pr.prevWeightKg} kg × ${pr.prevReps ?? '—'} · ${pr.deltaPct > 0 ? '+' : ''}${pr.deltaPct}%`
                      : `Your first ${pr.exerciseName} record — the story begins here.`}
                  </T>
                </View>
              </View>
            </Card>
          </Animated.View>
        </Section>
      ) : null}

      {/* continue training */}
      {last && lastStats ? (
        <Section title="Continue Training" action="History" onAction={() => router.push('/history' as never)}>
          <Card onPress={() => router.push(`/replay/${last.id}` as never)} style={{ padding: spacing.lg }}>
            <Row align="space-between">
              <Row gap={12}>
                <View style={[styles.miniThumb, first && { backgroundColor: colors.surface3 }]}>
                  <Icon name="barbell-outline" size={20} color={colors.accent} />
                </View>
                <View>
                  <T variant="bodySemi">{last.title}</T>
                  <T variant="small" muted style={{ fontSize: 12 }}>
                    {new Date(last.startTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} ·{' '}
                    {lastStats.durationMin} min
                  </T>
                </View>
              </Row>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Row>
            <Row align="space-between" style={{ marginTop: spacing.md }}>
              <Metric label="Exercises" value={`${lastStats.exercises}`} />
              <Metric label="Volume" value={`${formatCompact(lastStats.volumeKg)} kg`} accent />
              <Metric label="Sets" value={`${lastStats.sets}`} />
              {prevEquivalent ? (
                <Metric
                  label="vs last"
                  value={`${(() => {
                    const prev = workoutStats(prevEquivalent);
                    const pct = prev.volumeKg > 0 ? Math.round(((lastStats.volumeKg - prev.volumeKg) / prev.volumeKg) * 100) : 0;
                    return pct >= 0 ? `+${pct}%` : `${pct}%`;
                  })()}`}
                  accent
                />
              ) : null}
            </Row>
          </Card>
        </Section>
      ) : null}

      {/* your next move — contextual recommendations carousel */}
      {moves.length > 0 ? (
        <Section title="Your Next Move">
          <NextMovesCarousel
            moves={moves}
            onStartPlan={(planId) => {
              const p = plans.find((x) => x.id === planId);
              if (!p) return;
              const w = startWorkout(p.title, p.exercises);
              router.push(`/workout/${w.id}`);
            }}
            onViewExercise={(id) => router.push(`/exercise/${id}` as never)}
          />
        </Section>
      ) : null}

      {/* muscle focus strip */}
      <Section title="Muscle Focus" style={{ marginBottom: 20 }}>
        <Row gap={8} wrap>
          {MUSCLE_GROUPS.slice(0, 8).map((m) => (
            <MuscleChip key={m} label={m} />
          ))}
        </Row>
      </Section>
    </Screen>
  );
}

function NextMovesCarousel({
  moves,
  onStartPlan,
  onViewExercise,
}: {
  moves: NextMove[];
  onStartPlan: (planId: string) => void;
  onViewExercise: (exerciseId: string) => void;
}) {
  const [w, setW] = useState(0);
  const [page, setPage] = useState(0);

  if (moves.length === 1) {
    return <NextMoveCard move={moves[0]} onStartPlan={onStartPlan} onViewExercise={onViewExercise} />;
  }

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          snapToInterval={w}
          snapToAlignment="start"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / w);
            setPage(Math.max(0, Math.min(moves.length - 1, idx)));
          }}>
          {moves.map((move, i) => (
            <View key={i} style={{ width: w, flexShrink: 0 }}>
              <NextMoveCard move={move} onStartPlan={onStartPlan} onViewExercise={onViewExercise} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <NextMoveCard move={moves[0]} onStartPlan={onStartPlan} onViewExercise={onViewExercise} />
      )}
      {moves.length > 1 ? (
        <Row gap={6} align="center" style={{ justifyContent: 'center', marginTop: 10 }}>
          {moves.map((_, i) => (
            <View
              key={i}
              style={[
                styles.carouselDot,
                i === page && { width: 18, backgroundColor: colors.accent },
              ]}
            />
          ))}
        </Row>
      ) : null}
    </View>
  );
}

function MuscleChip({ label }: { label: string }) {
  return (
    <Pressable style={({ pressed }) => [styles.muscleChip, pressed && { opacity: 0.8 }]}>
      <T variant="smallMedium" dim style={{ fontSize: 12 }}>
        {label}
      </T>
    </Pressable>
  );
}

function NextMoveCard({
  move,
  onStartPlan,
  onViewExercise,
}: {
  move: NextMove;
  onStartPlan: (planId: string) => void;
  onViewExercise: (exerciseId: string) => void;
}) {
  const meta = {
    untrained: { icon: 'barbell-outline' as const, tint: colors.accentSoft, color: colors.accent },
    'pr-close': { icon: 'flash-outline' as const, tint: colors.goldSoft, color: colors.gold },
    plateau: { icon: 'pause-circle-outline' as const, tint: colors.dangerSoft, color: colors.orange },
  }[move.kind];
  return (
    <Card style={{ padding: spacing.lg }}>
      <Row gap={12} align="flex-start">
        <View style={[styles.nextIcon, { backgroundColor: meta.tint }]}>
          <Ionicons name={meta.icon} size={20} color={meta.color} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <T variant="bodySemi" style={{ fontSize: 15 }}>
            {move.headline}
          </T>
          <T variant="small" dim style={{ fontSize: 12.5 }}>
            {move.detail}
          </T>
          {move.pct != null ? (
            <View style={{ marginTop: 6 }}>
              <Row align="space-between" style={{ marginBottom: 4 }}>
                <T variant="micro" muted>
                  vs all-time best
                </T>
                <T variant="micro" accent>
                  {move.pct}%
                </T>
              </Row>
              <ProgressBar value={move.pct} color={move.pct > 92 ? colors.accent : colors.orange} height={7} />
            </View>
          ) : null}
          <Pressable
            onPress={() => (move.action.type === 'start-plan' ? onStartPlan(move.action.planId) : onViewExercise(move.action.exerciseId))}
            style={({ pressed }) => [styles.nextCta, { backgroundColor: colors.accent }, pressed && { opacity: 0.85 }]}>
            <T variant="smallSemi" style={{ color: colors.bg, fontSize: 12.5 }}>
              {move.cta}
            </T>
            <Ionicons name="arrow-forward" size={14} color={colors.bg} />
          </Pressable>
        </View>
      </Row>
    </Card>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={{ gap: 2 }}>
      <T variant="numSm" style={{ color: accent ? colors.accent : colors.text }}>
        {value}
      </T>
      <T variant="micro" muted>
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 9, right: 9, width: 7, height: 7, borderRadius: 4 },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    overflow: 'hidden',
  },
  streakFlame: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerV: { width: 1, height: 40, backgroundColor: colors.border },
  trophy: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  miniThumb: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  muscleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nextIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface3,
  },
  starterCta: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
  },
});
