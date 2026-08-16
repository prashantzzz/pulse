import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { T } from '../../../components/Text';
import { toast } from '../../../components/misc';
import { Button, Card, Icon, Row } from '../../../components/ui';
import { EXERCISE_MAP } from '../../../data/exercises';
import { formatDurationLabel } from '../../../lib/format';
import { detectPRs, formatCompact, whatChanged, workoutStats } from '../../../lib/stats';
import { usePulse } from '../../../store/useStore';
import { accentTint, colors, gradients, radius, spacing, useAccent } from '../../../theme';

export default function SummaryScreen() {
  useAccent();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const workouts = usePulse((s) => s.workouts);
  const workout = workouts.find((w) => w.id === id);

  const confetti = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(confetti, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(confetti, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [confetti]);

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
  const volumePerMin = stats.durationMin > 0 ? stats.volumeKg / stats.durationMin : 0;

  // workout fingerprint
  const fingerprint = {
    volume: stats.volumeKg >= 14000 ? 'High volume' : stats.volumeKg >= 9000 ? 'Moderate volume' : 'Light volume',
    intensity: volumePerMin >= 240 ? 'High intensity' : volumePerMin >= 150 ? 'Moderate intensity' : 'Steady pace',
    duration: formatDurationLabel(stats.durationMin),
  };

  const shareText = `💪 ${workout.title} on PULSE\n${stats.exercises} exercises · ${stats.sets} sets · ${stats.volumeKg.toLocaleString()} kg volume · ${stats.calories} kcal\n${prs.length > 0 ? `🏆 PRs: ${prs.map((p) => `${p.exerciseName} ${p.weightKg}×${p.reps}`).join(', ')}\n` : ''}${changed ? `📈 ${changed.volumePct >= 0 ? '+' : ''}${changed.volumePct}% vs last session` : ''}\n— sent with PULSE`;

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
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* celebration header */}
      <LinearGradient colors={[accentTint(colors.accent, 0.17), '#0A0B0D']} style={styles.header}>
        <Animated.View style={{ opacity: confetti.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.9] }) }}>
          <View style={styles.celebrateIcon}>
            <Ionicons name="trophy" size={34} color={colors.bg} />
          </View>
        </Animated.View>
        <T variant="h1" center style={{ marginTop: spacing.md }}>
          Workout Complete!
        </T>
        <T variant="body" dim center style={{ marginTop: 4 }}>
          {workout.title} · {new Date(workout.startTime).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })} ·{' '}
          {formatDurationLabel(stats.durationMin)}
        </T>
      </LinearGradient>

      <View style={{ paddingHorizontal: spacing.lg }}>
        {/* metrics */}
        <Card gradient="charcoal" style={{ padding: spacing.lg }}>
          <Row align="space-between">
            <Metric value={`${stats.exercises}`} label="Exercises" />
            <Metric value={`${stats.sets}`} label="Sets" />
            <Metric value={formatCompact(stats.volumeKg)} label="Volume kg" accent />
            <Metric value={`${stats.calories}`} label="kcal" />
          </Row>
        </Card>

        {/* improvement */}
        {changed ? (
          <Card style={{ marginTop: spacing.md, padding: spacing.md }}>
            <Row gap={10}>
              <View style={[styles.upIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="trending-up" size={18} color={colors.accent} />
              </View>
              <T variant="bodySemi" style={{ flex: 1, fontSize: 14 }}>
                You improved by {changed.volumePct >= 0 ? '+' : ''}
                {changed.volumePct}% volume vs your previous {workout.title}.
              </T>
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
        <Button label="Done" variant="ghost" full size="lg" style={{ marginTop: spacing.sm }} onPress={() => router.replace('/(tabs)/home' as never)} />
      </View>
    </ScrollView>
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
  celebrateIcon: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
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
    backgroundColor: 'rgba(255,197,61,0.12)',
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
