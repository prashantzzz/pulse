import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Animated, BackHandler, Easing, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAnimatedValue } from '../../../lib/useAnimatedValue';

import { T } from '../../../components/Text';
import { toast } from '../../../components/misc';
import { Button, Card, Row } from '../../../components/ui';
import { formatDurationLabel } from '../../../lib/format';
import { detectPRs, formatCompact, whatChanged, workoutRepeatSpecs, workoutStats } from '../../../lib/stats';
import { usePulse } from '../../../store/useStore';
import { accentTint, colors, layout, radius, spacing, useAccent } from '../../../theme';
import { hapticsMedium, hapticsSuccess } from '../../../lib/haptics';

export default function SummaryScreen() {
  useAccent();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const workouts = usePulse((s) => s.workouts);
  const startWorkout = usePulse((s) => s.startWorkout);
  const workout = workouts.find((w) => w.id === id);

  // Pressing phone hardware back takes user safely to Home
  useEffect(() => {
    const onBackPress = () => {
      router.replace('/(tabs)/home' as never);
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [router]);

  // Mature celebration entrance animation
  const badgeScale = useAnimatedValue(0.3);
  const haloScale = useAnimatedValue(0.8);
  const haloOpacity = useAnimatedValue(0.8);
  const headerFade = useAnimatedValue(0);
  const statsRise = useAnimatedValue(25);
  const statsFade = useAnimatedValue(0);
  const detailsRise = useAnimatedValue(25);
  const detailsFade = useAnimatedValue(0);

  useEffect(() => {
    // 1. Initial crisp badge pop haptic
    hapticsMedium();

    // 2. Coordinated animation choreography
    Animated.parallel([
      // Badge pop with smooth spring physics
      Animated.spring(badgeScale, {
        toValue: 1,
        damping: 12,
        stiffness: 140,
        mass: 0.8,
        useNativeDriver: true,
      }),
      // Expanding soft halo glow
      Animated.timing(haloScale, {
        toValue: 1.6,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(haloOpacity, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // Header text fade
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Staggered stats card entrance with subtle confirmation haptic
    const timer1 = setTimeout(() => {
      hapticsSuccess();
      Animated.parallel([
        Animated.spring(statsRise, { toValue: 0, damping: 15, stiffness: 120, useNativeDriver: true }),
        Animated.timing(statsFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 220);

    // 4. Staggered details and actions reveal
    const timer2 = setTimeout(() => {
      Animated.parallel([
        Animated.spring(detailsRise, { toValue: 0, damping: 15, stiffness: 120, useNativeDriver: true }),
        Animated.timing(detailsFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 380);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [badgeScale, haloScale, haloOpacity, headerFade, statsRise, statsFade, detailsRise, detailsFade]);

  if (!workout) {
    return (
      <View style={styles.root}>
        <T variant="body" dim style={{ textAlign: 'center', marginTop: 120 }}>
          Workout not found.
        </T>
        <Button label="Home" onPress={() => router.replace('/(tabs)/home' as never)} style={{ marginTop: 20, alignSelf: 'center' }} />
      </View>
    );
  }

  const stats = workoutStats(workout);
  const prs = detectPRs(workout, workouts);
  const prevEquivalent = [...workouts].reverse().find((w) => w.title === workout.title && w.id !== workout.id);
  const changed = prevEquivalent ? whatChanged(workout, prevEquivalent) : null;
  // a previous session with no completed sets is not a meaningful baseline
  const prevStats = prevEquivalent ? workoutStats(prevEquivalent) : null;
  const hasBaseline = prevStats != null && prevStats.sets > 0;
  const volumePerMin = stats.durationMin > 0 ? stats.volumeKg / stats.durationMin : 0;

  // workout fingerprint
  const fingerprint = {
    volume: stats.volumeKg >= 14000 ? 'High volume' : stats.volumeKg >= 9000 ? 'Moderate volume' : 'Light volume',
    intensity: volumePerMin >= 240 ? 'High intensity' : volumePerMin >= 150 ? 'Moderate intensity' : 'Steady pace',
    duration: formatDurationLabel(stats.durationMin),
  };

  const shareText = `💪 ${workout.title} on NextRep\n${stats.exercises} exercises · ${stats.sets} sets · ${stats.volumeKg.toLocaleString()} kg volume · ~${stats.calories} kcal est.\n${prs.length > 0 ? `🏆 PRs: ${prs.map((p) => `${p.exerciseName} ${p.weightKg}×${p.reps}`).join(', ')}\n` : ''}${changed ? `📈 ${changed.volumePct >= 0 ? '+' : ''}${changed.volumePct}% vs last session` : ''}\n— sent with NextRep`;

  const copyShare = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }
      toast('Workout card copied — paste it anywhere');
    } catch {
      toast('Share card ready');
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      {/* celebration header */}
      <LinearGradient colors={[accentTint(colors.accent, 0.2), colors.bg]} style={[styles.header, { paddingTop: Math.max(insets.top + layout.screenTopPad, 45) }]}>
        <View style={styles.badgeContainer}>
          {/* Expanding accent halo */}
          <Animated.View
            style={[
              styles.haloRing,
              {
                borderColor: colors.accent,
                opacity: haloOpacity,
                transform: [{ scale: haloScale }],
              },
            ]}
          />
          {/* Spring entrance trophy badge */}
          <Animated.View style={{ transform: [{ scale: badgeScale }] }}>
            <LinearGradient colors={['#FFD700', '#F59E0B']} style={styles.celebrateIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="trophy" size={36} color="#1A1500" />
            </LinearGradient>
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: headerFade, alignItems: 'center' }}>
          <T variant="hero" center style={{ marginTop: spacing.md, fontSize: 28, letterSpacing: 0.5 }}>
            Workout Complete!
          </T>
          <T variant="body" dim center style={{ marginTop: 6 }}>
            {workout.title} · {new Date(workout.startTime).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })} ·{' '}
            {formatDurationLabel(stats.durationMin)}
          </T>
        </Animated.View>
      </LinearGradient>

      <View style={{ paddingHorizontal: spacing.lg }}>
        {/* headline metrics card */}
        <Animated.View
          style={{
            opacity: statsFade,
            transform: [{ translateY: statsRise }],
          }}>
          <Card gradient="charcoal" style={{ padding: spacing.lg }}>
            <Row align="space-between">
              <Metric value={`${stats.exercises}`} label="Exercises" />
              <Metric value={`${stats.sets}`} label="Sets" />
              <Metric value={formatCompact(stats.volumeKg)} label="Volume kg" accent />
              <Metric value={`~${stats.calories}`} label="est. kcal" />
            </Row>
          </Card>
        </Animated.View>

        {/* details and rest of summary */}
        <Animated.View
          style={{
            opacity: detailsFade,
            transform: [{ translateY: detailsRise }],
          }}>
          {/* what changed? — compact comparison vs the previous equivalent workout */}
          {changed && prevEquivalent && hasBaseline ? (
            <Card style={{ marginTop: spacing.md, padding: spacing.lg }}>
              <Row align="space-between" style={{ marginBottom: spacing.sm }}>
                <T variant="h3" style={{ fontSize: 16 }}>
                  What changed?
                </T>
                <T variant="micro" muted>
                  vs last {workout.title}
                </T>
              </Row>
              <Row align="space-between">
                <DeltaMetric
                  label="Volume"
                  value={`${changed.volumePct > 0 ? '+' : ''}${changed.volumePct}%`}
                  good={changed.volumePct >= 0}
                  neutral={changed.volumePct === 0}
                />
                <DeltaMetric label="Reps" value={`${changed.repsDelta > 0 ? '+' : ''}${changed.repsDelta}`} good={changed.repsDelta >= 0} neutral={changed.repsDelta === 0} />
                <DeltaMetric label="Avg weight" value={`${changed.avgWeightDelta > 0 ? '+' : ''}${changed.avgWeightDelta} kg`} good={changed.avgWeightDelta >= 0} neutral={changed.avgWeightDelta === 0} />
                <DeltaMetric label="Duration" value={`${changed.durationDeltaMin <= 0 ? '' : '+'}${changed.durationDeltaMin} min`} good={changed.durationDeltaMin <= 0} neutral={changed.durationDeltaMin === 0} />
              </Row>
            </Card>
          ) : null}

          {/* PRs */}
          {prs.length > 0 ? (
            <>
              <T variant="h3" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
                Personal Records
              </T>
              <View style={{ gap: spacing.sm }}>
                {prs.map((p, i) => (
                  <Card key={i} style={{ padding: spacing.md }}>
                    <Row align="space-between">
                      <Row gap={12}>
                        <View style={styles.trophy}>
                          <Ionicons name="trophy" size={18} color={colors.gold} />
                        </View>
                        <View>
                          <T variant="bodySemi">{p.exerciseName}</T>
                          <T variant="small" dim style={{ fontSize: 12 }}>
                            Previous: {p.prevWeightKg != null ? `${p.prevWeightKg} kg × ${p.prevReps ?? '—'}` : 'First time'}
                          </T>
                        </View>
                      </Row>
                      <View style={{ alignItems: 'flex-end' }}>
                        <T variant="numSm" accent>
                          {p.weightKg} × {p.reps}
                        </T>
                        <T variant="micro" muted>
                          {p.kind} PR
                        </T>
                      </View>
                    </Row>
                  </Card>
                ))}
              </View>
            </>
          ) : null}

          {/* workout fingerprint */}
          <T variant="h3" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
            Workout Fingerprint
          </T>
          <Card style={{ padding: spacing.lg }}>
            <View style={styles.fingerprintArt}>
              <SvgBars values={[0.55, 0.8, 0.45, 0.9, 0.65, 0.75, 0.6]} />
            </View>
            <Row align="space-between" style={{ marginTop: spacing.md }}>
              <FingerprintStat icon="layers-outline" value={fingerprint.volume} label="Volume" />
              <FingerprintStat icon="speedometer-outline" value={fingerprint.intensity} label="Intensity" />
              <FingerprintStat icon="time-outline" value={fingerprint.duration} label="Duration" />
            </Row>
            <T variant="micro" muted center style={{ marginTop: spacing.sm }}>
              {workout.title} — your signature
            </T>
          </Card>

          {/* share card */}
          <T variant="h3" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
            Share Your Card
          </T>
          <View style={[styles.shareCard, { borderColor: `${colors.accent}66` }]}>
            <View style={styles.shareCardTop}>
              <T variant="label" accent>
                PULSE
              </T>
              <T variant="micro" muted>
                {new Date(workout.startTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </T>
            </View>
            <T variant="h2" style={{ marginTop: spacing.sm }}>
              {workout.title}
            </T>
            <Row gap={14} style={{ marginTop: spacing.sm }}>
              <ShareStat value={`${stats.sets}`} label="sets" />
              <ShareStat value={formatCompact(stats.volumeKg)} label="kg volume" />
              <ShareStat value={formatDurationLabel(stats.durationMin)} label="time" />
            </Row>
            {prs.length > 0 ? (
              <T variant="small" accent style={{ marginTop: spacing.sm }}>
                🏆 {prs.length} new PR{prs.length > 1 ? 's' : ''}
              </T>
            ) : null}
          </View>
          <Button label="Share Workout Card" icon="share-outline" full size="lg" style={{ marginTop: spacing.md }} onPress={copyShare} />
          <Button
            label="Repeat Workout"
            icon="refresh"
            full
            size="lg"
            style={{ marginTop: spacing.sm }}
            onPress={() => {
              const w = startWorkout(workout.title, workoutRepeatSpecs(workout));
              router.replace(`/workout/${w.id}`);
            }}
          />
          <Button label="Done" variant="ghost" full size="lg" style={{ marginTop: spacing.sm }} onPress={() => router.replace('/(tabs)/home' as never)} />
        </Animated.View>
      </View>
    </ScrollView>
  );
}

function DeltaMetric({ label, value, good, neutral }: { label: string; value: string; good: boolean; neutral: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 3, flex: 1 }}>
      <T variant="numSm" style={{ color: neutral ? colors.textDim : good ? colors.accent : colors.red, fontSize: 16 }}>
        {value}
      </T>
      <T variant="micro" muted>
        {label}
      </T>
    </View>
  );
}

function Metric({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <T variant="numSm" style={{ color: accent ? colors.accent : colors.text }}>
        {value}
      </T>
      <T variant="micro" muted>
        {label}
      </T>
    </View>
  );
}

function FingerprintStat({ icon, value, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 3, flex: 1 }}>
      <Ionicons name={icon} size={18} color={colors.accent} />
      <T variant="smallSemi" style={{ fontSize: 12.5 }}>
        {value}
      </T>
      <T variant="micro" muted>
        {label}
      </T>
    </View>
  );
}

function ShareStat({ value, label }: { value: string; label: string }) {
  return (
    <View>
      <T variant="numSm" accent>
        {value}
      </T>
      <T variant="micro" muted>
        {label}
      </T>
    </View>
  );
}

function SvgBars({ values }: { values: number[] }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 56 }}>
      {values.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: `${v * 100}%`,
            borderRadius: 6,
            backgroundColor: i % 2 === 0 ? colors.accent : colors.emerald,
            opacity: 0.9,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: 'center', paddingTop: 50, paddingBottom: spacing.xl, borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl },
  badgeContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  haloRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
  },
  celebrateIcon: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  upIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophy: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerprintArt: { height: 56, marginTop: 4 },
  shareCard: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  shareCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
