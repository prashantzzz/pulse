import { View } from 'react-native';

import { BarChart, DonutChart, LineChart } from '../charts';
import { T } from '../Text';
import { Card, Row } from '../ui';
import {
  dailyVolume,
  totalVolume,
  volumeByMuscle,
  volumePerSessionByWeek,
  weeklyVolumes,
  workoutsInLastDays,
} from '../../lib/stats';
import { toUserVolume } from '../../lib/units';
import { usePulse } from '../../store/useStore';
import { colors, spacing } from '../../theme';
import type { Workout } from '../../types';
import { chartColor, SummaryCard, TF_LABELS, TimeframeChips, type ProgressTimeframe } from './shared';

/** Selected timeframe → analysis window in days. */
const DAYS: Record<ProgressTimeframe, number> = { '7D': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };

/**
 * Volume tab: total volume, the trend, muscle split and per-session density —
 * every chart follows the same date-range control as the Strength tab.
 */
export function VolumeView({
  workouts,
  chartW,
  tf,
  onTimeframeChange,
}: {
  workouts: Workout[];
  chartW: number;
  tf: ProgressTimeframe;
  onTimeframeChange: (t: ProgressTimeframe) => void;
}) {
  const weightUnit = usePulse((s) => s.weightUnit);
  const days = DAYS[tf];
  const weeks = Math.max(1, Math.round(days / 7));
  const volByMuscle = volumeByMuscle(workouts, days);
  const topVol = volByMuscle.slice(0, 6).reduce((s, v) => s + v.volume, 0);
  const userTopVol = toUserVolume(topVol, weightUnit);
  const total = totalVolume(workoutsInLastDays(workouts, days));
  const userTotal = toUserVolume(total, weightUnit);
  const thisWeekTotal = totalVolume(workoutsInLastDays(workouts, 7));
  const userThisWeekTotal = toUserVolume(thisWeekTotal, weightUnit);
  // The trend is daily over a week (readable at that density) and weekly for
  // every longer range, so a 1Y window stays a sensible bar count.
  const trend =
    tf === '7D'
      ? dailyVolume(workouts, 7).map((d) => ({ label: d.label, value: toUserVolume(d.volume, weightUnit) }))
      : weeklyVolumes(workouts, weeks).map((w) => ({ label: w.label, value: toUserVolume(w.volume, weightUnit) }));
  const perSession = volumePerSessionByWeek(workouts, weeks);

  const formatSummaryVol = (val: number) =>
    val <= 0 ? '0' : val < 1000 ? `${Math.round(val)} ${weightUnit}` : `${(val / 1000).toFixed(1)}k`;

  return (
    <>
      <Row gap={spacing.sm}>
        <SummaryCard label={`Total · ${TF_LABELS[tf]}`} value={formatSummaryVol(userTotal)} accent={userTotal > 0} icon="layers" flex1 />
        <SummaryCard label="This week" value={formatSummaryVol(userThisWeekTotal)} accent={userThisWeekTotal > 0} icon="trending-up" flex1 />
      </Row>

      <TimeframeChips tf={tf} onChange={onTimeframeChange} />

      <Card style={{ padding: spacing.lg }}>
        <Row align="space-between">
          <T variant="h3">Volume Trend</T>
          <T variant="small" dim style={{ fontSize: 12 }}>
            {TF_LABELS[tf]}
          </T>
        </Row>
        <View style={{ marginTop: spacing.md }}>
          <BarChart
            data={trend}
            width={chartW}
            height={140}
            highlight={tf === '7D' ? 6 : undefined}
          />
        </View>
      </Card>

      <Card style={{ padding: spacing.lg }}>
        <T variant="h3">Volume by Muscle</T>
        <T variant="small" dim style={{ fontSize: 12, marginTop: 2 }}>
          {TF_LABELS[tf]}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md }}>
          <DonutChart
            segments={volByMuscle.slice(0, 6).map((v, i) => ({ label: v.muscle, value: toUserVolume(v.volume, weightUnit), color: chartColor(i) }))}
            size={150}
            centerValue={`${(userTopVol / 1000).toFixed(1)}k`}
            centerLabel={`Total ${weightUnit}`}
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
          Average weekly · {TF_LABELS[tf]}
        </T>
        <View style={{ marginTop: spacing.md }}>
          <LineChart data={perSession.map((p) => toUserVolume(p.value, weightUnit))} labels={perSession.map((p) => p.label)} width={chartW} height={130} color={colors.emerald} fillColor={colors.emerald} />
        </View>
      </Card>
    </>
  );
}
