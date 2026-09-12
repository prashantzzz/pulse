import { useState } from 'react';
import { View } from 'react-native';

import { CalendarHeatmap, type HeatDay } from '../heatmap';
import { ProgressRing } from '../ring';
import { T } from '../Text';
import { Card, Icon, ProgressBar, Row } from '../ui';
import { consistencyPct, currentStreak, dayKey, longestStreak, sessionsPerWeek, workoutDayKeys } from '../../lib/stats';
import { toUserVolume } from '../../lib/units';
import { usePulse } from '../../store/useStore';
import { colors, spacing } from '../../theme';
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
  const weightUnit = usePulse((s) => s.weightUnit);
  const [localTf, setLocalTf] = useState<ProgressTimeframe>('3M');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const rawTf = tf ?? localTf;
  const activeTf: ProgressTimeframe = rawTf === '7D' ? '1M' : rawTf;
  const handleTfChange = onTimeframeChange ?? setLocalTf;

  const heatWeeks = TF_HEAT_WEEKS[activeTf] ?? 12;

  // Track completed sessions and volume per day
  const keys = workoutDayKeys(workouts);
  const dayWorkouts = new Map<string, { titles: string[]; volumeKg: number }>();
  for (const w of workouts) {
    const d = new Date(w.startTime);
    const k = dayKey(d);
    const exVol = w.exercises.reduce(
      (s, we) => s + we.sets.filter((x) => x.completed).reduce((a, st) => a + (st.weightKg ?? 0) * (st.reps ?? 0), 0),
      0,
    );
    const cur = dayWorkouts.get(k) ?? { titles: [], volumeKg: 0 };
    if (!cur.titles.includes(w.title)) cur.titles.push(w.title);
    cur.volumeKg += exVol;
    dayWorkouts.set(k, cur);
  }

  const maxDay = Math.max(...[...dayWorkouts.values()].map((d) => d.volumeKg), 1);
  const weeksGrid: HeatDay[][] = [];
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // Mon=0 .. Sun=6
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);

  for (let wi = heatWeeks - 1; wi >= 0; wi -= 1) {
    const days: HeatDay[] = [];
    for (let di = 0; di < 7; di += 1) {
      // Calendar-safe local date construction immune to daylight saving time drift
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - wi * 7 + di);
      const k = dayKey(d);
      const hasWorkout = keys.has(k);
      let intensity = 0;
      if (hasWorkout) {
        const vol = dayWorkouts.get(k)?.volumeKg ?? 0;
        // Guaranteed minimum intensity floor (0.20 = Tier 1) so bodyweight/cardio workouts
        // are always visibly lit up, and square-root scaling so normal sessions aren't crushed.
        intensity = vol <= 0 ? 0.2 : Math.min(1, 0.25 + 0.75 * Math.sqrt(vol / maxDay));
      }
      days.push({ date: k, intensity });
    }
    weeksGrid.push(days);
  }

  const score = consistencyPct(workouts, 28);
  const selectedInfo = selectedDate ? dayWorkouts.get(selectedDate) : null;
  const isSelectedActive = selectedDate ? keys.has(selectedDate) : false;

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
          Last {heatWeeks} weeks · Tap any block to inspect details
        </T>
        <View style={{ overflow: 'hidden' }}>
          <CalendarHeatmap
            weeks={weeksGrid}
            timeframe={activeTf}
            cardWidth={chartW}
            selectedDate={selectedDate}
            onDayPress={(day) => setSelectedDate((prev) => (prev === day.date ? null : day.date))}
          />
        </View>

        {selectedDate ? (
          <View
            style={{
              marginTop: spacing.sm,
              padding: spacing.sm,
              backgroundColor: colors.surface3,
              borderRadius: 8,
              borderLeftWidth: 3,
              borderLeftColor: isSelectedActive ? colors.accent : colors.border,
            }}>
            <Row align="space-between">
              <Row gap={6}>
                <Icon
                  name={isSelectedActive ? 'flame' : 'calendar-outline'}
                  size={14}
                  color={isSelectedActive ? colors.accent : colors.textMuted}
                />
                <T variant="smallMedium" style={{ fontSize: 12 }}>
                  {(() => {
                    const [y, m, d] = selectedDate.split('-').map(Number);
                    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    });
                  })()}
                </T>
              </Row>
              <T variant="smallMedium" accent={isSelectedActive} dim={!isSelectedActive} style={{ fontSize: 12 }}>
                {isSelectedActive
                  ? `${selectedInfo?.titles.join(', ') || 'Workout'} · ${
                      selectedInfo && selectedInfo.volumeKg > 0
                        ? `${Math.round(toUserVolume(selectedInfo.volumeKg, weightUnit))} ${weightUnit}`
                        : 'Completed'
                    }`
                  : 'Rest day'}
              </T>
            </Row>
          </View>
        ) : null}
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

