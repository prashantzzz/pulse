import { View } from 'react-native';

import { EmptyState } from '../misc';
import { T } from '../Text';
import { Card, Icon, Row } from '../ui';
import { EXERCISE_MAP } from '../../data/exercises';
import { bestForExercise, e1rm } from '../../lib/stats';
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

  const workoutRecords: RecordEntry[] = [...new Set(workouts.flatMap((w) => w.exercises.map((we) => we.exerciseId)))]
    .map((id) => {
      const best = bestForExercise(workouts, id);
      if (!best) return null;
      return {
        id,
        exerciseId: id,
        weightKg: best.maxWeight.weightKg,
        reps: best.maxWeight.reps,
        e1rmKg: best.maxE1rm.e1rm,
      };
    })
    .filter((r): r is RecordEntry => !!r);

  const manualRecords: RecordEntry[] = manualPRs.map((pr) => ({
    id: pr.id,
    exerciseId: pr.exerciseId,
    weightKg: pr.weightKg,
    reps: pr.reps,
    e1rmKg: e1rm(pr.weightKg, pr.reps),
    date: pr.date,
  }));

  const records = [...manualRecords, ...workoutRecords].sort((a, b) => b.e1rmKg - a.e1rmKg).slice(0, 8);

  return (
    <>
      <Row gap={spacing.sm}>
        <SummaryCard label="PRs (all)" value={`${records.length}`} accent icon="trophy" flex1 />
        <SummaryCard label="Best 1RM" value={`${Math.max(...records.map((r) => r.e1rmKg), 0).toFixed(0)} kg`} icon="flash" flex1 />
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
                      {r.weightKg} kg × {r.reps}
                      {r.date ? ` · ${new Date(r.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}` : ''}
                    </T>
                  </View>
                </Row>
                <View style={{ alignItems: 'flex-end' }}>
                  <T variant="numSm" accent>
                    {r.e1rmKg.toFixed(1)} kg
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
