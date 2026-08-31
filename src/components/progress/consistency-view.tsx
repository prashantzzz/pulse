import { useState } from 'react';
import { View } from 'react-native';

import { CalendarHeatmap, type HeatDay } from '../heatmap';
import { ProgressRing } from '../ring';
import { T } from '../Text';
import { Card, ProgressBar, Row } from '../ui';
import { consistencyPct, currentStreak, dayKey, longestStreak, sessionsPerWeek, workoutDayKeys } from '../../lib/stats';
import { spacing } from '../../theme';
import type { Workout } from '../../types';
import { SummaryCard, TF_LABELS, TimeframeChips, type ProgressTimeframe } from './shared';

const CONSISTENCY_TIMEFRAMES: ProgressTimeframe[] = ['1M', '3M', '6M', '1Y'];

const TF_HEAT_WEEKS: Record<string, number> = {
  '1M': 4,
  '3M': 12,
  '6M': 26,
  '1Y': 52,
};

/**
 * Consistency tab: streak stats plus a GitHub-style training heatmap where the
 * color intensity reflects daily volume, and a 28-day consistency score.
 */
export function ConsistencyView({
  workouts,
  chartW,
  tf,
  onTimeframeChange,
}: {
  workouts: Workout[];
  chartW?: number;
  tf?: ProgressTimeframe;
  onTimeframeChange?: (t: ProgressTimeframe) => void;
}) {
  const [localTf, setLocalTf] = useState<ProgressTimeframe>('3M');
  const rawTf = tf ?? localTf;
  const activeTf: ProgressTimeframe = rawTf === '7D' ? '1M' : rawTf;
  const handleTfChange = onTimeframeChange ?? setLocalTf;

  const heatWeeks = TF_HEAT_WEEKS[activeTf] ?? 12;

  // heatmap grid: Mon..Sun columns, intensity = daily volume
  const keys = workoutDayKeys(workouts);
  const dayVols = new Map<string, number>();
  for (const w of workouts) {
    const d = new Date(w.startTime);
    const k = dayKey(d);
    dayVols.set(
      k,
      (dayVols.get(k) ?? 0) +
        w.exercises.reduce(
          (s, we) => s + we.sets.filter((x) => x.completed).reduce((a, st) => a + (st.weightKg ?? 0) * (st.reps ?? 0), 0),
          0,
        ),
    );
  }
  const maxDay = Math.max(...[...dayVols.values()], 1);
  const weeksGrid: HeatDay[][] = [];
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  for (let wi = heatWeeks - 1; wi >= 0; wi -= 1) {
    const weekStart = new Date(monday.getTime() - wi * 7 * 86400000);
    const days: HeatDay[] = [];
    for (let di = 0; di < 7; di += 1) {
      const d = new Date(weekStart.getTime() + di * 86400000);
      const k = dayKey(d);
      days.push({ date: k, intensity: keys.has(k) ? Math.min(1, (dayVols.get(k) ?? 0) / maxDay) : 0 });
    }
    weeksGrid.push(days);
  }

  const score = consistencyPct(workouts, 28);

  return (
    <>
      <Row gap={spacing.sm}>
        <SummaryCard label="Current streak" value={`${currentStreak(workouts)}d`} accent icon="flame" flex1 />
        <SummaryCard label="Longest" value={`${longestStreak(workouts)}d`} icon="trophy" flex1 />
        <SummaryCard label="Sessions/wk" value={`${sessionsPerWeek(workouts)}`} icon="calendar" flex1 />
      </Row>

      <TimeframeChips tf={activeTf} onChange={handleTfChange} options={CONSISTENCY_TIMEFRAMES} />

      <Card style={{ padding: spacing.lg }}>
        <Row align="space-between">
          <T variant="h3">Training Streak Map</T>
          <T variant="micro" accent style={{ fontSize: 11 }}>
            {TF_LABELS[activeTf]}
          </T>
        </Row>
        <T variant="small" dim style={{ fontSize: 12, marginTop: 2, marginBottom: spacing.md }}>
          Last {heatWeeks} weeks · Theme intensity = workout volume
        </T>
        <View style={{ overflow: 'hidden' }}>
          <CalendarHeatmap weeks={weeksGrid} timeframe={activeTf} cardWidth={chartW} />
        </View>
      </Card>

      <Card style={{ padding: spacing.lg }}>
        <Row align="space-between">
          <View style={{ flex: 1 }}>
            <T variant="label" dim>
              Consistency score
            </T>
            <T variant="numLg" accent style={{ marginTop: 4 }}>
              {score}%
            </T>
            <T variant="small" dim style={{ fontSize: 12, marginTop: 4 }}>
              {workouts.length === 0
                ? 'Log workouts to build your 28-day consistency score'
                : 'Active days / 28 · one rest day between sessions counts'}
            </T>
          </View>
          <ProgressRing size={96} strokeWidth={9} progress={score}>
            <T variant="h3" accent>
              {score}%
            </T>
          </ProgressRing>
        </Row>
        <ProgressBar value={score} height={8} style={{ marginTop: spacing.md }} />
      </Card>
    </>
  );
}

