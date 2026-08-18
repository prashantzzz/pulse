import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { MuscleLegend, MuscleMap } from '../muscle-map';
import { T } from '../Text';
import { Card, Row, Section } from '../ui';
import { volumeByMuscle } from '../../lib/stats';
import { colors, spacing } from '../../theme';
import type { BodyMeasurement, MuscleGroup, UserProfile, Workout } from '../../types';
import { progressStyles } from './shared';

const ALL_MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Calves', 'Glutes', 'Forearms'];

/**
 * Body tab: muscle heatmap (tap a muscle for weekly volume detail) and the
 * latest body measurements with a mini weight trend.
 */
export function BodyView({
  workouts,
  measurements,
  profile,
}: {
  workouts: Workout[];
  measurements: BodyMeasurement[];
  profile: UserProfile | null;
}) {
  const router = useRouter();
  const [selMuscle, setSelMuscle] = useState<MuscleGroup | null>(null);

  const volByMuscle = volumeByMuscle(workouts, 30);
  // Classification is based on average weekly training sets per muscle (last 28
  // days) against typical 3–4×/week program volume, so the legend labels are
  // truthful: ≥ 6 sets/wk = well trained, 3–6 = moderate, < 3 = undertrained.
  // Muscles with zero sets still show as undertrained (red) — an untrained
  // muscle has no status otherwise, which is exactly why calves looked missing.
  const weeklyByMuscle = volumeByMuscle(workouts, 28);
  const intensity: Record<string, number> = {};
  for (const v of weeklyByMuscle) {
    const weeklySets = v.sets / 4;
    intensity[v.muscle] = weeklySets < 3 ? 0.25 : weeklySets < 6 ? 0.5 : 1;
  }
  for (const m of ALL_MUSCLES) {
    if (intensity[m] == null) intensity[m] = 0.25; // never logged → undertrained
  }

  const muscleDetail = selMuscle ? volByMuscle.find((v) => v.muscle === selMuscle) : null;
  const muscleWeek = selMuscle ? volumeByMuscle(workouts, 7).find((v) => v.muscle === selMuscle) : null;
  const musclePrev = selMuscle ? volumeByMuscle(workouts, 14).find((v) => v.muscle === selMuscle) : null;
  const musclePct =
    selMuscle && muscleWeek && musclePrev && musclePrev.volume > 0
      ? Math.round(((muscleWeek.volume - musclePrev.volume) / musclePrev.volume) * 100)
      : 0;

  const last = measurements[measurements.length - 1];

  return (
    <>
      <Card style={{ padding: spacing.lg }}>
        <View>
          <T variant="h3">Muscle Heatmap</T>
          <T variant="small" dim style={{ fontSize: 12, marginTop: 2 }}>
            Tap a muscle for details
          </T>
        </View>
        <View style={{ marginTop: spacing.md }}>
          <MuscleMap intensity={intensity} selected={selMuscle} onSelect={setSelMuscle} height={280} gender={profile?.gender ?? 'male'} />
        </View>
        <View style={{ marginTop: spacing.md, alignItems: 'center' }}>
          <MuscleLegend />
        </View>
      </Card>

      {selMuscle ? (
        <Card gradient="charcoal" style={{ padding: spacing.lg }}>
          <Row align="space-between">
            <T variant="h3">{selMuscle}</T>
            <View style={[progressStyles.deltaBadge, { backgroundColor: musclePct >= 0 ? colors.accentSoft : colors.dangerSoft }]}>
              <T variant="micro" style={{ color: musclePct >= 0 ? colors.accent : colors.red }}>
                {musclePct >= 0 ? '+' : ''}
                {musclePct}% volume
              </T>
            </View>
          </Row>
          <Row align="space-between" style={{ marginTop: spacing.md }}>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <T variant="numSm">{muscleWeek?.sets ?? 0}</T>
              <T variant="micro" muted>
                Sets this week
              </T>
            </View>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <T variant="numSm" accent>
                {(muscleWeek?.volume ?? 0).toLocaleString()}
              </T>
              <T variant="micro" muted>
                Volume kg
              </T>
            </View>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <T variant="numSm">{muscleDetail?.sets ?? 0}</T>
              <T variant="micro" muted>
                Sets (30d)
              </T>
            </View>
          </Row>
        </Card>
      ) : null}

      <Section title="Body Measurements" action="Add" onAction={() => router.push('/measure' as never)}>
        <Card style={{ padding: spacing.lg }}>
          <Row align="space-between">
            <View>
              <T variant="label" dim>
                Weight
              </T>
              <T variant="numLg" accent style={{ marginTop: 4 }}>
                {last?.weightKg.toFixed(1)} kg
              </T>
              <T variant="small" dim style={{ fontSize: 12, marginTop: 2 }}>
                {measurements.length > 1
                  ? `${(last!.weightKg - measurements[0].weightKg) >= 0 ? '+' : ''}${(last!.weightKg - measurements[0].weightKg).toFixed(1)} kg since start`
                  : 'Log your first measurement'}
              </T>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
              {measurements.map((m, i) => (
                <View
                  key={m.id}
                  style={{
                    width: 16,
                    height: 24 + (m.weightKg - Math.min(...measurements.map((x) => x.weightKg))) * 6,
                    borderRadius: 4,
                    backgroundColor: i === measurements.length - 1 ? colors.accent : colors.surface4,
                  }}
                />
              ))}
            </View>
          </Row>
        </Card>
      </Section>
    </>
  );
}
