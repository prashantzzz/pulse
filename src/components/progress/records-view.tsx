import { View } from 'react-native';

import { EmptyState } from '../misc';
import { T } from '../Text';
import { Card, Icon, Row } from '../ui';
import { EXERCISE_MAP } from '../../data/exercises';
import { bestForExercise, e1rm } from '../../lib/stats';
import { formatUserWeightWithUnit } from '../../lib/units';
import { usePulse } from '../../store/useStore';
import { colors, spacing } from '../../theme';
import type { Workout } from '../../types';
import { progressStyles, SummaryCard } from './shared';

interface RecordEntry {
  id: string;
  exerciseId: string;
  weightKg: number;
  reps: number;
  e1rmKg: number;
  /** manual PRs carry their own date; workout PRs show '—' */
  date?: string;
}

/** Records tab: the user's strongest lifts — manual PRs + workout bests, ranked by estimated 1RM. */
export function RecordsView({ workouts }: { workouts: Workout[] }) {
  const manualPRs = usePulse((s) => s.manualPRs);
  const weightUnit = usePulse((s) => s.weightUnit);

  const workoutRecords: RecordEntry[] = [...new Set(workouts.flatMap((w) => w.exercises.map((we) => we.exerciseId)))]
    .map((id): RecordEntry | null => {
      const best = bestForExercise(workouts, id);
      if (!best) return null;
      return {
        id,
        exerciseId: id,
        weightKg: best.maxWeight.weightKg,
        reps: best.maxWeight.reps,
        e1rmKg: best.maxE1rm.e1rm,
        date: best.maxE1rm.date ?? best.maxWeight.date,
      };
    })
    .filter((r): r is RecordEntry => r !== null);

  const manualRecords: RecordEntry[] = manualPRs.map((pr) => ({
    id: pr.id,
    exerciseId: pr.exerciseId,
    weightKg: pr.weightKg,
    reps: pr.reps,
    e1rmKg: e1rm(pr.weightKg, pr.reps),
    date: pr.date,
  }));

  // Dedupe records by exercise so an exercise doesn't appear twice (pick highest 1RM)
  const byExercise = new Map<string, RecordEntry>();
  for (const r of [...manualRecords, ...workoutRecords]) {
    const cur = byExercise.get(r.exerciseId);
    if (!cur || r.e1rmKg > cur.e1rmKg) {
      byExercise.set(r.exerciseId, r);
    }
  }

  const records = [...byExercise.values()].sort((a, b) => b.e1rmKg - a.e1rmKg).slice(0, 8);
  const bestE1rmKg = Math.max(...records.map((r) => r.e1rmKg), 0);

  return (
    <>
      <Row gap={spacing.sm}>
        <SummaryCard label="PRs (all)" value={`${records.length}`} accent icon="trophy" flex1 />
        <SummaryCard label="Best 1RM" value={bestE1rmKg > 0 ? formatUserWeightWithUnit(bestE1rmKg, weightUnit) : '—'} icon="flash" flex1 />
      </Row>

      {records.length === 0 ? (
        <EmptyState
          icon="trophy-outline"
          title="No records yet"
          body="Log a few workouts and your strongest lifts will show up here as trophies."
        />
      ) : (
        records.map((r) => {
          const ex = EXERCISE_MAP[r.exerciseId];
          return (
            <Card key={r.id} style={{ padding: spacing.md }}>
              <Row align="space-between">
                <Row gap={12}>
                  <View style={progressStyles.recordTrophy}>
                    <Icon name="trophy" size={18} color={colors.gold} />
                  </View>
                  <View>
                    <T variant="bodySemi">{ex?.name ?? r.exerciseId}</T>
                    <T variant="small" dim style={{ fontSize: 12 }}>
                      {formatUserWeightWithUnit(r.weightKg, weightUnit)} × {r.reps}
                      {r.date ? ` · ${new Date(r.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}` : ''}
                    </T>
                  </View>
                </Row>
                <View style={{ alignItems: 'flex-end' }}>
                  <T variant="numSm" accent>
                    {formatUserWeightWithUnit(r.e1rmKg, weightUnit)}
                  </T>
                  <T variant="micro" muted>
                    est. 1RM
                  </T>
                </View>
              </Row>
            </Card>
          );
        })
      )}
    </>
  );
}
