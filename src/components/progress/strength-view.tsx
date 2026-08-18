import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { LineChart } from '../charts';
import { T } from '../Text';
import { Card, Chip, Icon, Row, Section } from '../ui';
import { EXERCISE_MAP } from '../../data/exercises';
import { bestForExercise, consistencyPct, e1rm, strengthProgression } from '../../lib/stats';
import { colors, spacing } from '../../theme';
import type { Workout } from '../../types';
import { progressStyles, SummaryCard } from './shared';

const TIMEFRAMES = ['7D', '1M', '3M', '6M', '1Y'] as const;
export type ProgressTimeframe = (typeof TIMEFRAMES)[number];

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
  const ex = EXERCISE_MAP[exerciseId];
  const prog = strengthProgression(workouts, exerciseId, weeks);
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
  const lastVal = prog.filter((p) => p.value > 0).slice(-1)[0]?.value ?? 0;
  const firstVal = prog.filter((p) => p.value > 0)[0]?.value ?? 0;
  const deltaPct = firstVal > 0 ? Math.round(((lastVal - firstVal) / firstVal) * 100) : 0;

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
        <SummaryCard label="Strength" value={`${deltaPct >= 0 ? '+' : ''}${deltaPct}%`} accent={deltaPct >= 0} icon="trending-up" flex1 />
        <SummaryCard label="Volume" value="+8%" accent icon="layers" flex1 />
        <SummaryCard label="Consistency" value={`${consistencyPct(workouts, 28)}%`} icon="checkmark-done" flex1 />
      </Row>

      <Pressable onPress={onOpenPicker} style={progressStyles.exercisePicker}>
        <View style={[progressStyles.pickerIcon, { backgroundColor: colors.accentSoft }]}>
          <Icon name="barbell-outline" size={18} color={colors.accent} />
        </View>
        <T variant="h3" style={{ flex: 1 }}>
          {ex?.name ?? 'Select exercise'}
        </T>
        <Ionicons name="chevron-down" size={18} color={colors.textDim} />
      </Pressable>

      <Row gap={8}>
        {TIMEFRAMES.map((t) => (
          <Chip key={t} label={t} selected={tf === t} onPress={() => onTimeframeChange(t)} />
        ))}
      </Row>

      <Card style={{ padding: spacing.lg }}>
        <Row align="space-between">
          <View>
            <T variant="label" dim>
              {repsMode ? 'Best reps' : 'Estimated 1RM'}
            </T>
            <Row gap={10} style={{ marginTop: 4 }}>
              <T variant="numLg" accent>
                {repsMode ? (bestReps > 0 ? `${bestReps} reps` : '—') : best ? `${best.maxE1rm.e1rm.toFixed(1)} kg` : '—'}
              </T>
              {deltaPct !== 0 ? (
                <View style={[progressStyles.deltaBadge, { backgroundColor: deltaPct > 0 ? colors.accentSoft : colors.dangerSoft }]}>
                  <T variant="micro" style={{ color: deltaPct > 0 ? colors.accent : colors.red }}>
                    {deltaPct > 0 ? '+' : ''}
                    {deltaPct}%
                  </T>
                </View>
              ) : null}
            </Row>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <T variant="micro" muted>
              Best set
            </T>
            <T variant="bodySemi" style={{ marginTop: 2 }}>
              {repsMode ? (bestReps > 0 ? `${bestReps} reps` : '—') : best ? `${best.maxWeight.weightKg} × ${best.maxWeight.reps}` : '—'}
            </T>
          </View>
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
                <Row key={s.exerciseId} align="space-between">
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
                        {s.weightKg} kg × {s.reps}
                      </T>
                    </View>
                  </Row>
                  <T variant="small" muted style={{ fontSize: 12 }}>
                    {new Date(s.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </T>
                </Row>
              );
            })
          )}
        </Card>
      </Section>
    </>
  );
}
