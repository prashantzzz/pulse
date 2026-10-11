import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { LineChart } from '../charts';
import { T } from '../Text';
import { Card, Icon, Row, Section } from '../ui';
import { EXERCISE_MAP } from '../../data/exercises';
import { bestForExercise, consistencyPct, e1rm, strengthProgression, workoutsInLastDays } from '../../lib/stats';
import { toUserVolume, formatUserWeightWithUnit } from '../../lib/units';
import { usePulse } from '../../store/useStore';
import { colors, spacing } from '../../theme';
import type { Workout } from '../../types';
import { progressStyles, SummaryCard, TimeframeChips, type ProgressTimeframe } from './shared';
import { PromoMetric } from '../../promo/metric';
import { PromoReveal } from '../../promo/reveal';

export type { ProgressTimeframe } from './shared';

/**
 * Strength tab: estimated 1RM trend for a chosen exercise, quick summary stats
 * and the top sets ever logged for the selected lift.
 */
export function StrengthView({
  workouts,
  exerciseId,
  weeks,
  tf,
  chartW,
  onExerciseChange,
  onTimeframeChange,
  onOpenPicker,
}: {
  workouts: Workout[];
  exerciseId: string;
  weeks: number;
  tf: ProgressTimeframe;
  chartW: number;
  onExerciseChange: (id: string) => void;
  onTimeframeChange: (tf: ProgressTimeframe) => void;
  onOpenPicker: () => void;
}) {
  const weightUnit = usePulse((s) => s.weightUnit);
  const ex = EXERCISE_MAP[exerciseId];
  const prog = strengthProgression(workouts, exerciseId, weeks, weightUnit);
  const best = bestForExercise(workouts, exerciseId);
  // Exercises logged without weight (e.g. cable machines by pin/plate position)
  // have no e1rm — the progression falls back to max reps per period, so the
  // whole card switches to a reps-based readout instead of a blank chart.
  const repsMode = prog.some((p) => p.unit === 'reps');
  const bestReps = repsMode
    ? workouts.reduce((max, w) => {
        for (const we of w.exercises) {
          if (we.exerciseId !== exerciseId) continue;
          for (const s of we.sets) {
            if (s.completed && s.reps != null) max = Math.max(max, s.reps);
          }
        }
        return max;
      }, 0)
    : 0;
  const validVals = prog.filter((p) => p.value > 0);
  const lastVal = validVals.slice(-1)[0]?.value ?? 0;
  const firstVal = validVals[0]?.value ?? 0;
  const hasStrengthDelta = validVals.length >= 2 && firstVal > 0;
  const deltaPct = hasStrengthDelta ? Math.round(((lastVal - firstVal) / firstVal) * 100) : null;

  // Calculate actual volume lifted for this exercise in the selected timeframe
  const recentExWorkouts = workoutsInLastDays(
    workouts.filter((w) => w.exercises.some((we) => we.exerciseId === exerciseId)),
    weeks * 7,
  );
  let exVolKg = 0;
  for (const w of recentExWorkouts) {
    for (const we of w.exercises) {
      if (we.exerciseId !== exerciseId) continue;
      for (const s of we.sets) {
        if (s.completed && s.weightKg != null && s.reps != null) {
          exVolKg += s.weightKg * s.reps;
        }
      }
    }
  }
  const exVolUser = toUserVolume(exVolKg, weightUnit);
  const exVolFormatted = exVolKg > 0
    ? (exVolUser >= 1000 ? `${(exVolUser / 1000).toFixed(1)}k` : `${Math.round(exVolUser)} ${weightUnit}`)
    : '—';

  const consistencyScore = workouts.length > 0 ? consistencyPct(workouts, 28) : null;

  // Top Sets is a personal best-board across every exercise: the single
  // strongest set (by estimated 1RM) per lift, ranked — so no exercise shows
  // the same set repeated four times, and the list stays diverse.
  const bestByExercise = new Map<string, { weightKg: number; reps: number; date: string }>();
  for (const w of workouts) {
    for (const we of w.exercises) {
      for (const s of we.sets) {
        if (!s.completed || s.weightKg == null || s.reps == null) continue;
        const cur = bestByExercise.get(we.exerciseId);
        const rm = e1rm(s.weightKg, s.reps);
        if (!cur || rm > e1rm(cur.weightKg, cur.reps)) {
          bestByExercise.set(we.exerciseId, { weightKg: s.weightKg, reps: s.reps, date: w.startTime });
        }
      }
    }
  }
  const topSets = [...bestByExercise.entries()]
    .map(([exerciseId, s]) => ({ exerciseId, ...s }))
    .sort((a, b) => e1rm(b.weightKg, b.reps) - e1rm(a.weightKg, a.reps))
    .slice(0, 4);

  return (
    <>
      <Row gap={spacing.sm}>
        <SummaryCard
          label="Strength"
          value={
            deltaPct != null
              ? `${deltaPct >= 0 ? '+' : ''}${deltaPct}%`
              : validVals.length === 1
              ? `${validVals[0].value} ${repsMode ? 'reps' : weightUnit}`
              : '—'
          }
          accent={deltaPct != null ? deltaPct >= 0 : validVals.length === 1}
          icon="trending-up"
          flex1
        />
        <SummaryCard label="Volume" value={exVolFormatted} accent={exVolKg > 0} icon="layers" flex1 />
        <SummaryCard label="Regularity" value={consistencyScore != null ? `${consistencyScore}%` : '—'} icon="checkmark-done" flex1 />
      </Row>

      <PromoReveal variant="fade" delay={60} observe={false}>
      <Pressable onPress={onOpenPicker} style={progressStyles.exercisePicker}>
        <View style={[progressStyles.pickerIcon, { backgroundColor: colors.accentSoft }]}>
          <Icon name="barbell-outline" size={18} color={colors.accent} />
        </View>
        <T variant="h3" style={{ flex: 1 }}>
          {ex?.name ?? 'Select exercise'}
        </T>
        <Ionicons name="chevron-down" size={18} color={colors.textDim} />
      </Pressable>
      </PromoReveal>

      <TimeframeChips tf={tf} onChange={onTimeframeChange} />

      <Card style={{ padding: spacing.lg }}>
        <Row align="space-between">
          <View>
            <T variant="label" dim>
              {repsMode ? 'Best reps' : 'Estimated 1RM'}
            </T>
            <PromoMetric
              value={repsMode ? (bestReps > 0 ? `${bestReps} reps` : '—') : best ? formatUserWeightWithUnit(best.maxE1rm.e1rm, weightUnit) : '—'}
              variant="numLg"
              style={{ color: colors.accent, marginTop: 4 }}
            />
          </View>
          {deltaPct != null && deltaPct !== 0 ? (
            <View style={[progressStyles.deltaBadge, { backgroundColor: deltaPct > 0 ? colors.accentSoft : colors.dangerSoft }]}>
              <PromoMetric
                value={`${deltaPct > 0 ? '+' : ''}${deltaPct}%`}
                variant="micro"
                style={{ color: deltaPct > 0 ? colors.accent : colors.red }}
              />
            </View>
          ) : null}
        </Row>
        <View style={{ marginTop: spacing.md }}>
          <LineChart data={prog.map((p) => p.value)} labels={prog.map((p) => p.label)} width={chartW} height={140} />
        </View>
        {repsMode ? (
          <T variant="micro" muted style={{ marginTop: spacing.sm, fontSize: 11 }}>
            Weight wasn&apos;t logged for this exercise — showing max reps per week.
          </T>
        ) : null}
      </Card>

      <Section title="Top Sets">
        <Card style={{ padding: spacing.md, gap: spacing.sm }}>
          {topSets.length === 0 ? (
            <T variant="small" dim style={{ padding: spacing.xs }}>
              Log some lifts and your best sets across all exercises will appear here.
            </T>
          ) : (
            topSets.map((s, i) => {
              const ex = EXERCISE_MAP[s.exerciseId];
              return (
                <PromoReveal key={s.exerciseId} variant="row" delay={Math.min(i, 8) * 45} observe={false}>
                <Row align="space-between">
                  <Row gap={10} style={{ flex: 1 }}>
                    <View style={[progressStyles.rankBadge, { backgroundColor: colors.accentSoft }]}>
                      <T variant="micro" accent>
                        #{i + 1}
                      </T>
                    </View>
                    <View style={{ flex: 1 }}>
                      <T variant="bodySemi" numberOfLines={1}>
                        {ex?.name ?? s.exerciseId}
                      </T>
                      <T variant="small" dim style={{ fontSize: 12 }}>
                        {formatUserWeightWithUnit(s.weightKg, weightUnit)} × {s.reps}
                      </T>
                    </View>
                  </Row>
                  <T variant="small" muted style={{ fontSize: 12 }}>
                    {new Date(s.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </T>
                </Row>
                </PromoReveal>
              );
            })
          )}
        </Card>
      </Section>
    </>
  );
}
