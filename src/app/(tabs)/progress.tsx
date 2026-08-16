import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { BarChart, DonutChart, LineChart } from '../../components/charts';
import { ProgressRing } from '../../components/ring';
import { CalendarHeatmap, type HeatDay } from '../../components/heatmap';
import { MuscleLegend, MuscleMap } from '../../components/muscle-map';
import { T } from '../../components/Text';
import { BottomSheet, EmptyState } from '../../components/misc';
import { Card, Chip, Icon, ProgressBar, Row, Screen, Section, Segmented } from '../../components/ui';
import { EXERCISE_MAP } from '../../data/exercises';
import {
  bestForExercise,
  consistencyPct,
  currentStreak,
  dailyVolume,
  e1rm,
  longestStreak,
  sessionsPerWeek,
  strengthProgression,
  totalVolume,
  volumeByMuscle,
  volumePerSessionByWeek,
  weeklyVolumes,
  workoutDayKeys,
  workoutsInLastDays,
} from '../../lib/stats';
import { usePulse } from '../../store/useStore';
import { colors, radius, spacing } from '../../theme';
import type { MuscleGroup } from '../../types';

type ProgressView = 'Strength' | 'Volume' | 'Consistency' | 'Body' | 'Records';
const VIEWS = ['Strength', 'Volume', 'Consistency', 'Body', 'Records'] as const;
const TIMEFRAMES = ['7D', '1M', '3M', '6M', '1Y'] as const;

const TF_WEEKS: Record<string, number> = { '7D': 1, '1M': 4, '3M': 12, '6M': 26, '1Y': 52 };

export default function ProgressScreen() {
  const { width } = useWindowDimensions();
  const workouts = usePulse((s) => s.workouts);
  const measurements = usePulse((s) => s.measurements);
  const profile = usePulse((s) => s.profile);
  const [view, setView] = useState<ProgressView>('Strength');
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]>('3M');
  const [exerciseId, setExerciseId] = useState<string>('bench-press');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selMuscle, setSelMuscle] = useState<MuscleGroup | null>(null);

  const chartW = Math.min(width - 40, 600) - 40;

  // frequent exercises
  const freq = new Map<string, number>();
  for (const w of workouts) for (const we of w.exercises) freq.set(we.exerciseId, (freq.get(we.exerciseId) ?? 0) + 1);
  const freqExercises = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id]) => id);
  const ex = EXERCISE_MAP[exerciseId];

  const weeks = TF_WEEKS[tf];
  const prog = strengthProgression(workouts, exerciseId, weeks);
  const best = bestForExercise(workouts, exerciseId);
  const lastVal = prog.filter((p) => p.value > 0).slice(-1)[0]?.value ?? 0;
  const firstVal = prog.filter((p) => p.value > 0)[0]?.value ?? 0;
  const deltaPct = firstVal > 0 ? Math.round(((lastVal - firstVal) / firstVal) * 100) : 0;

  const volByMuscle = volumeByMuscle(workouts, 30);
  const maxMuscle = Math.max(...volByMuscle.map((v) => v.volume), 1);
  const intensity: Record<string, number> = {};
  for (const v of volByMuscle) intensity[v.muscle] = v.volume / maxMuscle;
  for (const m of ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Calves', 'Glutes', 'Forearms']) {
    if (intensity[m] == null) intensity[m] = 0;
  }

  // consistency heatmap: last 12 weeks
  const heatWeeks = 12;
  const keys = workoutDayKeys(workouts);
  const dayVols = new Map<string, number>();
  for (const w of workouts) {
    const d = new Date(w.startTime);
    const k = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    dayVols.set(k, (dayVols.get(k) ?? 0) + w.exercises.reduce((s, we) => s + we.sets.filter((x) => x.completed).reduce((a, st) => a + (st.weightKg ?? 0) * (st.reps ?? 0), 0), 0));
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
      const k = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      days.push({ date: k, intensity: keys.has(k) ? Math.min(1, (dayVols.get(k) ?? 0) / maxDay) : 0 });
    }
    weeksGrid.push(days);
  }

  const weekLabels = weeksGrid.map((w) => w[0].date);
  const monthLabels = weekLabels.map((d) => new Date(d).toLocaleDateString('en-US', { month: 'short' }));

  const daily = dailyVolume(workouts, 7);
  const weekly = weeklyVolumes(workouts, 8);
  const perSession = volumePerSessionByWeek(workouts, 8);

  const muscleDetail = selMuscle ? volByMuscle.find((v) => v.muscle === selMuscle) : null;
  const muscleWeek = selMuscle ? volumeByMuscle(workouts, 7).find((v) => v.muscle === selMuscle) : null;
  const musclePrev = selMuscle ? volumeByMuscle(workouts, 14).find((v) => v.muscle === selMuscle) : null;
  const musclePct = selMuscle && muscleWeek && musclePrev && musclePrev.volume > 0 ? Math.round(((muscleWeek.volume - musclePrev.volume) / musclePrev.volume) * 100) : 0;

  const records = [...new Set(workouts.flatMap((w) => w.exercises.map((we) => we.exerciseId)))]
    .map((id) => ({ id, best: bestForExercise(workouts, id) }))
    .filter((r): r is { id: string; best: NonNullable<typeof r.best> } => !!r.best)
    .sort((a, b) => b.best.maxE1rm.e1rm - a.best.maxE1rm.e1rm)
    .slice(0, 8);

  const topSets = workouts
    .flatMap((w) =>
      w.exercises.filter((we) => we.exerciseId === exerciseId).flatMap((we) => we.sets.filter((s) => s.completed && s.weightKg != null && s.reps != null).map((s) => ({ ...s, date: w.startTime }))),
    )
    .sort((a, b) => e1rm(b.weightKg!, b.reps!) - e1rm(a.weightKg!, a.reps!))
    .slice(0, 4);

  return (
    <Screen scroll contentStyle={{ paddingBottom: 130, paddingTop: 14 }}>
      <Row align="space-between" style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
        <View>
          <T variant="h2">Progress</T>
          <T variant="small" dim style={{ marginTop: 2 }}>
            Am I getting stronger? Here's the answer.
          </T>
        </View>
        <View style={[styles.periodBadge, { backgroundColor: colors.accentSoft }]}>
          <T variant="smallMedium" accent style={{ fontSize: 12 }}>
            This Month
          </T>
        </View>
      </Row>

      <Segmented options={VIEWS} value={view} onChange={setView} style={{ marginHorizontal: spacing.md }} />

      <View style={{ marginTop: spacing.lg, paddingHorizontal: spacing.md, gap: spacing.md }}>
        {/* ---------------------------------------------------------- STRENGTH */}
        {view === 'Strength' ? (
          <>
            <Row gap={spacing.sm}>
              <SummaryCard label="Strength" value={`${deltaPct >= 0 ? '+' : ''}${deltaPct}%`} accent={deltaPct >= 0} icon="trending-up" flex1 />
              <SummaryCard label="Volume" value="+8%" accent icon="layers" flex1 />
              <SummaryCard label="Consistency" value={`${consistencyPct(workouts, 28)}%`} icon="checkmark-done" flex1 />
            </Row>

            <Pressable onPress={() => setPickerOpen(true)} style={styles.exercisePicker}>
              <View style={[styles.pickerIcon, { backgroundColor: colors.accentSoft }]}>
                <Icon name="barbell-outline" size={18} color={colors.accent} />
              </View>
              <T variant="h3" style={{ flex: 1 }}>
                {ex?.name ?? 'Select exercise'}
              </T>
              <Ionicons name="chevron-down" size={18} color={colors.textDim} />
            </Pressable>

            <Row gap={8}>
              {TIMEFRAMES.map((t) => (
                <Chip key={t} label={t} selected={tf === t} onPress={() => setTf(t)} />
              ))}
            </Row>

            <Card style={{ padding: spacing.lg }}>
              <Row align="space-between">
                <View>
                  <T variant="label" dim>
                    Estimated 1RM
                  </T>
                  <Row gap={10} style={{ marginTop: 4 }}>
                    <T variant="numLg" accent>
                      {best ? `${best.maxE1rm.e1rm.toFixed(1)} kg` : '—'}
                    </T>
                    {deltaPct !== 0 ? (
                      <View style={[styles.deltaBadge, { backgroundColor: deltaPct > 0 ? colors.accentSoft : 'rgba(255,91,102,0.15)' }]}>
                        <T variant="micro" style={{ color: deltaPct > 0 ? colors.accent : colors.red }}>
                          {deltaPct > 0 ? '+' : ''}{deltaPct}%
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
                    {best ? `${best.maxWeight.weightKg} × ${best.maxWeight.reps}` : '—'}
                  </T>
                </View>
              </Row>
              <View style={{ marginTop: spacing.md }}>
                <LineChart data={prog.map((p) => p.value)} labels={prog.map((p) => p.label)} width={chartW} height={140} />
              </View>
            </Card>

            <Section title="Top Sets">
              <Card style={{ padding: spacing.md, gap: spacing.sm }}>
                {topSets.map((s, i) => (
                  <Row key={i} align="space-between">
                    <Row gap={10}>
                      <View style={[styles.rankBadge, { backgroundColor: colors.accentSoft }]}>
                        <T variant="micro" accent>
                          #{i + 1}
                        </T>
                      </View>
                      <T variant="bodySemi">
                        {s.weightKg} kg × {s.reps}
                      </T>
                    </Row>
                    <T variant="small" muted style={{ fontSize: 12 }}>
                      {new Date(s.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </T>
                  </Row>
                ))}
              </Card>
            </Section>
          </>
        ) : null}

        {/* ---------------------------------------------------------- VOLUME */}
        {view === 'Volume' ? (
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
                <BarChart data={daily.map((d) => ({ label: d.label, value: d.volume }))} width={chartW} height={140} highlight={daily.findIndex((d) => d.label === new Date().toLocaleDateString('en-US', { weekday: 'short' })) >= 0 ? 6 : undefined} />
              </View>
            </Card>

            <Card style={{ padding: spacing.lg }}>
              <T variant="h3">Volume by Muscle</T>
              <T variant="small" dim style={{ fontSize: 12, marginTop: 2 }}>
                Last 30 days
              </T>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md }}>
                <DonutChart
                  segments={volByMuscle.slice(0, 6).map((v, i) => ({ label: v.muscle, value: v.volume, color: colors.chart[i % colors.chart.length] }))}
                  size={150}
                  centerValue={`${(volByMuscle.slice(0, 6).reduce((s, v) => s + v.volume, 0) / 1000).toFixed(1)}k`}
                  centerLabel="Total kg"
                />
                <View style={{ flex: 1, gap: 8 }}>
                  {volByMuscle.slice(0, 6).map((v, i) => (
                    <Row key={v.muscle} align="space-between">
                      <Row gap={8}>
                        <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: colors.chart[i % colors.chart.length] }} />
                        <T variant="smallMedium" style={{ fontSize: 13 }}>
                          {v.muscle}
                        </T>
                      </Row>
                      <T variant="smallMedium" dim style={{ fontSize: 13 }}>
                        {Math.round((v.volume / Math.max(1, volByMuscle.slice(0, 6).reduce((s, x) => s + x.volume, 0))) * 100)}%
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
        ) : null}

        {/* ------------------------------------------------------- CONSISTENCY */}
        {view === 'Consistency' ? (
          <>
            <Row gap={spacing.sm}>
              <SummaryCard label="Current streak" value={`${currentStreak(workouts)}d`} accent icon="flame" flex1 />
              <SummaryCard label="Longest" value={`${longestStreak(workouts)}d`} icon="trophy" flex1 />
              <SummaryCard label="Sessions/wk" value={`${sessionsPerWeek(workouts)}`} icon="calendar" flex1 />
            </Row>

            <Card style={{ padding: spacing.lg }}>
              <T variant="h3">Training Streak Map</T>
              <T variant="small" dim style={{ fontSize: 12, marginTop: 2 }}>
                Last {heatWeeks} weeks — intensity = daily volume
              </T>
              <View style={{ marginTop: spacing.md, overflow: 'hidden' }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <CalendarHeatmap weeks={weeksGrid} weekLabels={monthLabels} />
                </ScrollView>
              </View>
            </Card>

            <Card style={{ padding: spacing.lg }}>
              <Row align="space-between">
                <View style={{ flex: 1 }}>
                  <T variant="label" dim>
                    Consistency score
                  </T>
                  <T variant="numLg" accent style={{ marginTop: 4 }}>
                    {consistencyPct(workouts, 28)}%
                  </T>
                  <T variant="small" dim style={{ fontSize: 12, marginTop: 4 }}>
                    Days trained / 28 days
                  </T>
                </View>
                <ProgressRing size={96} strokeWidth={9} progress={consistencyPct(workouts, 28)}>
                  <T variant="h3" accent>
                    {consistencyPct(workouts, 28)}%
                  </T>
                </ProgressRing>
              </Row>
              <ProgressBar value={consistencyPct(workouts, 28)} height={8} style={{ marginTop: spacing.md }} />
            </Card>
          </>
        ) : null}

        {/* ------------------------------------------------------------ BODY */}
        {view === 'Body' ? (
          <>
            <Card style={{ padding: spacing.lg }}>
              <Row align="space-between">
                <View>
                  <T variant="h3">Muscle Heatmap</T>
                  <T variant="small" dim style={{ fontSize: 12, marginTop: 2 }}>
                    Tap a muscle for details
                  </T>
                </View>
                <MuscleLegend />
              </Row>
              <View style={{ marginTop: spacing.md }}>
                <MuscleMap intensity={intensity} selected={selMuscle} onSelect={setSelMuscle} height={280} gender={profile?.gender ?? 'male'} />
              </View>
            </Card>

            {selMuscle ? (
              <Card gradient="charcoal" style={{ padding: spacing.lg }}>
                <Row align="space-between">
                  <T variant="h3">{selMuscle}</T>
                  <View style={[styles.deltaBadge, { backgroundColor: musclePct >= 0 ? colors.accentSoft : 'rgba(255,91,102,0.15)' }]}>
                    <T variant="micro" style={{ color: musclePct >= 0 ? colors.accent : colors.red }}>
                      {musclePct >= 0 ? '+' : ''}{musclePct}% volume
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

            <Section title="Body Measurements" action="Add" onAction={() => undefined}>
              <Card style={{ padding: spacing.lg }}>
                <Row align="space-between">
                  <View>
                    <T variant="label" dim>
                      Weight
                    </T>
                    <T variant="numLg" accent style={{ marginTop: 4 }}>
                      {measurements[measurements.length - 1]?.weightKg.toFixed(1)} kg
                    </T>
                    <T variant="small" dim style={{ fontSize: 12, marginTop: 2 }}>
                      {measurements.length > 1
                        ? `-${(measurements[0].weightKg - measurements[measurements.length - 1].weightKg).toFixed(1)} kg since start`
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
        ) : null}

        {/* --------------------------------------------------------- RECORDS */}
        {view === 'Records' ? (
          <>
            <Row gap={spacing.sm}>
              <SummaryCard label="PRs (all)" value={`${records.length}`} accent icon="trophy" flex1 />
              <SummaryCard label="Best 1RM" value={`${Math.max(...records.map((r) => r.best.maxE1rm.e1rm), 0).toFixed(0)} kg`} icon="flash" flex1 />
            </Row>
            {records.length === 0 ? (
              <EmptyState
                icon="trophy-outline"
                title="No records yet"
                body="Log a few workouts and your strongest lifts will show up here as trophies."
              />
            ) : (
              records.map((r) => {
                const ex2 = EXERCISE_MAP[r.id];
                return (
                  <Card key={r.id} style={{ padding: spacing.md }}>
                    <Row align="space-between">
                      <Row gap={12}>
                        <View style={styles.recordTrophy}>
                          <Icon name="trophy" size={18} color={colors.gold} />
                        </View>
                        <View>
                          <T variant="bodySemi">{ex2?.name ?? r.id}</T>
                          <T variant="small" dim style={{ fontSize: 12 }}>
                            {r.best.maxWeight.weightKg} kg × {r.best.maxWeight.reps}
                          </T>
                        </View>
                      </Row>
                      <View style={{ alignItems: 'flex-end' }}>
                        <T variant="numSm" accent>
                          {r.best.maxE1rm.e1rm.toFixed(1)} kg
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
        ) : null}
      </View>

      {/* exercise picker */}
      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Choose exercise">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ gap: spacing.xs }}>
            {freqExercises.map((id) => {
              const e = EXERCISE_MAP[id];
              const active = id === exerciseId;
              return (
                <Pressable
                  key={id}
                  onPress={() => {
                    setExerciseId(id);
                    setPickerOpen(false);
                  }}
                  style={[styles.exerciseOption, active && { backgroundColor: colors.accentSoft }]}>
                  <Icon name="barbell-outline" size={18} color={active ? colors.accent : colors.textDim} />
                  <T variant="bodySemi" style={{ flex: 1 }}>
                    {e?.name}
                  </T>
                  {active ? <Ionicons name="checkmark-circle" size={18} color={colors.accent} /> : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </BottomSheet>
    </Screen>
  );
}

function SummaryCard({ label, value, accent, icon, flex1 }: { label: string; value: string; accent?: boolean; icon: React.ComponentProps<typeof Ionicons>['name']; flex1?: boolean }) {
  return (
    <View style={[styles.summaryCard, flex1 && { flex: 1 }]}>
      <Icon name={icon} size={16} color={accent ? colors.accent : colors.textDim} />
      <T variant="h3" style={{ color: accent ? colors.accent : colors.text, marginTop: 6 }}>
        {value}
      </T>
      <T variant="micro" muted style={{ marginTop: 2 }}>
        {label}
      </T>
    </View>
  );
}



const styles = StyleSheet.create({
  periodBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  exercisePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderBright,
    padding: spacing.sm,
  },
  pickerIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deltaBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  rankBadge: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  recordTrophy: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,197,61,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
});
