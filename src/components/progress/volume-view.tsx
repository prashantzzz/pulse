import { View } from 'react-native';

import { BarChart, DonutChart, LineChart } from '../charts';
import { T } from '../Text';
import { Card, Row } from '../ui';
import { dailyVolume, totalVolume, volumeByMuscle, volumePerSessionByWeek, workoutsInLastDays } from '../../lib/stats';
import { colors, spacing } from '../../theme';
import type { Workout } from '../../types';
import { chartColor, SummaryCard } from './shared';

/** Volume tab: total/weekly volume, the 7-day trend, muscle split and per-session density. */
export function VolumeView({ workouts, chartW }: { workouts: Workout[]; chartW: number }) {
  const volByMuscle = volumeByMuscle(workouts, 30);
  const daily = dailyVolume(workouts, 7);
  const perSession = volumePerSessionByWeek(workouts, 8);
  const topVol = volByMuscle.slice(0, 6).reduce((s, v) => s + v.volume, 0);

  return (
    <>
      <Row gap={spacing.sm}>
        <SummaryCard label="Total volume" value={`${(totalVolume(workoutsInLastDays(workouts, 30)) / 1000).toFixed(1)}k`} accent icon="layers" flex1 />
        <SummaryCard label="This week" value={`${(totalVolume(workoutsInLastDays(workouts, 7)) / 1000).toFixed(1)}k`} icon="trending-up" flex1 />
      </Row>

      <Card style={{ padding: spacing.lg }}>
        <Row align="space-between">
          <T variant="h3">Volume Trend</T>
          <T variant="small" dim style={{ fontSize: 12 }}>
            Last 7 days
          </T>
        </Row>
        <View style={{ marginTop: spacing.md }}>
          <BarChart
            data={daily.map((d) => ({ label: d.label, value: d.volume }))}
            width={chartW}
            height={140}
            highlight={daily.findIndex((d) => d.label === new Date().toLocaleDateString('en-US', { weekday: 'short' })) >= 0 ? 6 : undefined}
          />
        </View>
      </Card>

      <Card style={{ padding: spacing.lg }}>
        <T variant="h3">Volume by Muscle</T>
        <T variant="small" dim style={{ fontSize: 12, marginTop: 2 }}>
          Last 30 days
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md }}>
          <DonutChart
            segments={volByMuscle.slice(0, 6).map((v, i) => ({ label: v.muscle, value: v.volume, color: chartColor(i) }))}
            size={150}
            centerValue={`${(topVol / 1000).toFixed(1)}k`}
            centerLabel="Total kg"
          />
          <View style={{ flex: 1, gap: 8 }}>
            {volByMuscle.slice(0, 6).map((v, i) => (
              <Row key={v.muscle} align="space-between">
                <Row gap={8}>
                  <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: chartColor(i) }} />
                  <T variant="smallMedium" style={{ fontSize: 13 }}>
                    {v.muscle}
                  </T>
                </Row>
                <T variant="smallMedium" dim style={{ fontSize: 13 }}>
                  {Math.round((v.volume / Math.max(1, topVol)) * 100)}%
                </T>
              </Row>
            ))}
          </View>
        </View>
      </Card>

      <Card style={{ padding: spacing.lg }}>
        <T variant="h3">Volume per Session</T>
        <T variant="small" dim style={{ fontSize: 12, marginTop: 2 }}>
          Average weekly — getting denser?
        </T>
        <View style={{ marginTop: spacing.md }}>
          <LineChart data={perSession.map((p) => p.value)} labels={perSession.map((p) => p.label)} width={chartW} height={130} color={colors.emerald} fillColor={colors.emerald} />
        </View>
      </Card>
    </>
  );
}
