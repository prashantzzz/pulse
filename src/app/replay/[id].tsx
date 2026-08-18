import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { T } from '../../components/Text';
import { Button, Card, Row, Screen, ScreenHeader, Tag } from '../../components/ui';
import { EXERCISE_MAP } from '../../data/exercises';
import { formatClock, formatDate, formatDurationLabel } from '../../lib/format';
import { detectPRs, whatChanged, workoutRepeatSpecs, workoutStats } from '../../lib/stats';
import { usePulse } from '../../store/useStore';
import { colors, spacing, useAccent } from '../../theme';

export default function ReplayScreen() {
  useAccent();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const workouts = usePulse((s) => s.workouts);
  const startWorkout = usePulse((s) => s.startWorkout);
  const workout = workouts.find((w) => w.id === id);

  if (!workout) {
    return (
      <Screen>
        <ScreenHeader title="Replay" back />
        <View style={{ padding: spacing.lg }}>
          <T variant="body" dim>
            Workout not found.
          </T>
        </View>
      </Screen>
    );
  }

  const stats = workoutStats(workout);
  const prs = detectPRs(workout, workouts);
  const prev = [...workouts]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .find((w) => w.title === workout.title && w.id !== workout.id && new Date(w.startTime).getTime() < new Date(workout.startTime).getTime());
  const changed = prev ? whatChanged(workout, prev) : null;
  const prevStats = prev ? workoutStats(prev) : null;

  return (
    <Screen scroll>
      <ScreenHeader title="Workout Replay" subtitle={formatDate(workout.startTime)} back />

      <View style={{ paddingHorizontal: spacing.lg }}>
        <Card gradient="charcoal" style={{ padding: spacing.lg }}>
          <Row align="space-between">
            <View style={{ flex: 1 }}>
              <T variant="h2">{workout.title}</T>
              <T variant="small" dim style={{ marginTop: 4 }}>
                {formatDate(workout.startTime)} · {formatClock(workout.startTime)} – {formatClock(workout.endTime)}
              </T>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <T variant="numSm" accent>
                {stats.volumeKg.toLocaleString()} kg
              </T>
              <T variant="micro" muted>
                {formatDurationLabel(stats.durationMin)}
              </T>
            </View>
          </Row>
        </Card>

        {/* evolution */}
        {prev && changed && prevStats ? (
          <Card style={{ marginTop: spacing.md, padding: spacing.lg }}>
            <Row align="space-between" style={{ marginBottom: spacing.sm }}>
              <T variant="h3">How it evolved</T>
              <Tag label="vs previous" color={colors.accent} />
            </Row>
            <Row align="space-between">
              <EvoMetric label="Volume" value={`${changed.volumePct >= 0 ? '↑' : '↓'} ${Math.abs(changed.volumePct)}%`} good={changed.volumePct >= 0} />
              <EvoMetric label="Reps" value={`${changed.repsDelta >= 0 ? '↑' : '↓'} ${Math.abs(changed.repsDelta)}`} good={changed.repsDelta >= 0} />
              <EvoMetric label="Avg weight" value={`${changed.avgWeightDelta >= 0 ? '↑' : '↓'} ${Math.abs(changed.avgWeightDelta)} kg`} good={changed.avgWeightDelta >= 0} />
              <EvoMetric label="Duration" value={`${changed.durationDeltaMin <= 0 ? '↓' : '↑'} ${Math.abs(changed.durationDeltaMin)} min`} good={changed.durationDeltaMin <= 0} />
            </Row>
            <Row align="space-between" style={{ marginTop: spacing.md }}>
              <T variant="micro" muted>
                This: {stats.volumeKg.toLocaleString()} kg · {stats.reps} reps
              </T>
              <T variant="micro" muted>
                Last: {prevStats.volumeKg.toLocaleString()} kg · {prevStats.reps} reps
              </T>
            </Row>
          </Card>
        ) : null}

        {/* PRs in this workout */}
        {prs.length > 0 ? (
          <View style={{ marginTop: spacing.md }}>
            <Row gap={6} wrap>
              <Tag label={`🏆 ${prs.length} new PR${prs.length > 1 ? 's' : ''}`} color={colors.gold} bg={colors.goldSoft} />
            </Row>
          </View>
        ) : null}

        {/* exercises */}
        <T variant="h3" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
          The workout
        </T>
        <View style={{ gap: spacing.sm }}>
          {workout.exercises.map((we) => {
            const ex = EXERCISE_MAP[we.exerciseId];
            if (!ex) return null;
            return (
              <Card key={we.id} style={{ padding: spacing.md }}>
                <Pressable onPress={() => router.push(`/exercise/${we.exerciseId}` as never)}>
                  <Row align="space-between" style={{ marginBottom: spacing.xs }}>
                    <Row gap={6}>
                      <T variant="bodySemi">{ex.name}</T>
                      <Ionicons name="open-outline" size={13} color={colors.textMuted} />
                    </Row>
                    <T variant="micro" muted>
                      {we.sets.filter((s) => s.completed).length} sets · {ex.equipment}
                    </T>
                  </Row>
                </Pressable>
                <Row gap={8} wrap>
                  {we.sets.filter((s) => s.completed).map((s, i) => (
                    <View key={s.id} style={styles.setChip}>
                      <T variant="smallSemi" style={{ fontSize: 12 }}>
                        {s.weightKg != null ? `${s.weightKg} kg × ${s.reps ?? '—'}` : s.distanceKm != null ? `${s.distanceKm} km · ${Math.round((s.durationSec ?? 0) / 60)} min` : '✓'}
                      </T>
                      {s.setType !== 'working' ? (
                        <T variant="micro" muted style={{ fontSize: 9, marginLeft: 4 }}>
                          {s.setType}
                        </T>
                      ) : null}
                    </View>
                  ))}
                </Row>
                {we.notes ? (
                  <T variant="micro" muted style={{ marginTop: 6 }}>
                    📝 {we.notes}
                  </T>
                ) : null}
              </Card>
            );
          })}
        </View>

        {/* volume bars by exercise */}
        <T variant="h3" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
          Volume by exercise
        </T>
        <Card style={{ padding: spacing.lg, gap: spacing.sm }}>
          {workout.exercises.map((we) => {
            const ex = EXERCISE_MAP[we.exerciseId];
            if (!ex) return null;
            const vol = we.sets.reduce((s, st) => s + (st.weightKg ?? 0) * (st.reps ?? 0), 0);
            const maxVol = Math.max(...workout.exercises.map((w2) => w2.sets.reduce((s, st) => s + (st.weightKg ?? 0) * (st.reps ?? 0), 0)), 1);
            return (
              <View key={we.id} style={{ gap: 4 }}>
                <Row align="space-between">
                  <T variant="smallMedium" style={{ fontSize: 12 }}>
                    {ex.name}
                  </T>
                  <T variant="micro" muted>
                    {vol.toLocaleString()} kg
                  </T>
                </Row>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(vol / maxVol) * 100}%`, backgroundColor: colors.accent }]} />
                </View>
              </View>
            );
          })}
        </Card>

        {/* one clear action — run it back with the same structure and targets */}
        <Button
          label="Repeat Workout"
          icon="refresh"
          full
          size="lg"
          style={{ marginTop: spacing.lg }}
          onPress={() => {
            const w = startWorkout(workout.title, workoutRepeatSpecs(workout));
            router.push(`/workout/${w.id}`);
          }}
        />
      </View>
    </Screen>
  );
}

function EvoMetric({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <T variant="numSm" style={{ color: good ? colors.accent : colors.red }}>
        {value}
      </T>
      <T variant="micro" muted>
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  setChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surface3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
});
