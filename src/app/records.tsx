import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { T } from '../components/Text';
import { BottomSheet, EmptyState, Stepper, toast } from '../components/misc';
import { Button, Card, Icon, Row, Screen, ScreenHeader } from '../components/ui';
import { EXERCISES, EXERCISE_MAP } from '../data/exercises';
import { bestForExercise, e1rm } from '../lib/stats';
import { usePulse } from '../store/useStore';
import { colors, layout, radius, spacing, useAccent } from '../theme';

/**
 * Personal Records hub — reachable from the Log tab's "Add Personal Record"
 * quick action. Lets you log a best lift outside a session (stored as a
 * manual PR) and shows your strongest lifts from workout history, so the
 * page doubles as a records overview.
 */
export default function RecordsScreen() {
  useAccent();
  const manualPRs = usePulse((s) => s.manualPRs);
  const addManualPR = usePulse((s) => s.addManualPR);
  const removeManualPR = usePulse((s) => s.removeManualPR);
  const workouts = usePulse((s) => s.workouts);

  const [sheet, setSheet] = useState(false);
  const [query, setQuery] = useState('');
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [weight, setWeight] = useState(20);
  const [reps, setReps] = useState(10);

  const historyBests = [...new Set(workouts.flatMap((w) => w.exercises.map((we) => we.exerciseId)))]
    .map((id) => ({ id, best: bestForExercise(workouts, id) }))
    .filter((r): r is { id: string; best: NonNullable<ReturnType<typeof bestForExercise>> } => !!r.best)
    .sort((a, b) => b.best.maxE1rm.e1rm - a.best.maxE1rm.e1rm)
    .slice(0, 5);

  const matches = query.trim()
    ? EXERCISES.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 12)
    : [];

  const openSheet = () => {
    setQuery('');
    setExerciseId(null);
    setWeight(20);
    setReps(10);
    setSheet(true);
  };

  const save = () => {
    if (!exerciseId) return;
    const ex = EXERCISE_MAP[exerciseId];
    addManualPR({ exerciseId, weightKg: weight, reps, date: new Date().toISOString() });
    setSheet(false);
    toast(`New record saved — ${ex?.name ?? 'exercise'} ${weight} kg × ${reps}`);
  };

  return (
    <Screen scroll contentStyle={{ paddingBottom: layout.stackContentBottomPad, paddingTop: layout.screenTopPad }}>
      <ScreenHeader title="Personal Records" subtitle={`${manualPRs.length} manual · ${historyBests.length} from workouts`} back />

      <View style={{ marginBottom: spacing.md }}>
        <Button label="Log a New Record" icon="trophy-outline" full size="lg" onPress={openSheet} />
      </View>

      <View>
        <T variant="label" dim style={{ marginBottom: 10 }}>
          Manual records
        </T>
        {manualPRs.length === 0 ? (
          <Card style={{ padding: spacing.lg }}>
            <T variant="small" dim>
              No manual records yet. Log a best lift from the button above — it lands here and in the Progress › Records tab.
            </T>
          </Card>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {manualPRs.map((pr) => {
              const ex = EXERCISE_MAP[pr.exerciseId];
              return (
                <Card key={pr.id} style={{ padding: spacing.md }}>
                  <Row align="space-between">
                    <Row gap={12} style={{ flex: 1 }}>
                      <View style={styles.trophyIcon}>
                        <Icon name="trophy" size={16} color={colors.gold} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <T variant="bodySemi">{ex?.name ?? pr.exerciseId}</T>
                        <T variant="small" dim style={{ fontSize: 12 }}>
                          {new Date(pr.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </T>
                      </View>
                    </Row>
                    <View style={{ alignItems: 'flex-end', marginRight: spacing.sm }}>
                      <T variant="numSm" accent>
                        {pr.weightKg} × {pr.reps}
                      </T>
                      <T variant="micro" muted>
                        {e1rm(pr.weightKg, pr.reps).toFixed(0)} kg est. 1RM
                      </T>
                    </View>
                    <Pressable onPress={() => removeManualPR(pr.id)} hitSlop={10} accessibilityLabel={`Delete ${ex?.name ?? 'record'}`}>
                      <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                    </Pressable>
                  </Row>
                </Card>
              );
            })}
          </View>
        )}

        <T variant="label" dim style={{ marginTop: spacing.xl, marginBottom: 10 }}>
          Strongest lifts from your workouts
        </T>
        {historyBests.length === 0 ? (
          <EmptyState icon="barbell-outline" title="No workouts yet" body="Log a few sessions and your strongest lifts will appear here." />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {historyBests.map((r) => {
              const ex = EXERCISE_MAP[r.id];
              return (
                <Card key={r.id} style={{ padding: spacing.md }}>
                  <Row align="space-between">
                    <Row gap={12}>
                      <View style={[styles.barbellIcon, { backgroundColor: colors.accentSoft }]}>
                        <Icon name="barbell-outline" size={16} color={colors.accent} />
                      </View>
                      <View>
                        <T variant="bodySemi">{ex?.name ?? r.id}</T>
                        <T variant="small" dim style={{ fontSize: 12 }}>
                          {r.best.maxWeight.weightKg} kg × {r.best.maxWeight.reps}
                        </T>
                      </View>
                    </Row>
                    <T variant="numSm" accent>
                      {r.best.maxE1rm.e1rm.toFixed(0)} kg
                    </T>
                  </Row>
                </Card>
              );
            })}
          </View>
        )}
      </View>

      {/* new record sheet */}
      <BottomSheet visible={sheet} onClose={() => setSheet(false)} title="Log a Personal Record">
        <ScrollView showsVerticalScrollIndicator={false}>
          <T variant="small" dim style={{ marginBottom: spacing.sm }}>
            Pick an exercise
          </T>
          <View style={styles.searchWrap}>
            <Icon name="search" size={16} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search exercises..."
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
            />
          </View>
          {query.trim() ? (
            <View style={{ gap: 6, marginTop: 8 }}>
              {matches.map((e) => {
                const sel = exerciseId === e.id;
                return (
                  <Pressable
                    key={e.id}
                    onPress={() => {
                      setExerciseId(e.id);
                      const b = bestForExercise(workouts, e.id);
                      if (b) {
                        setWeight(b.maxWeight.weightKg);
                        setReps(b.maxWeight.reps);
                      }
                    }}
                    style={[styles.exOption, sel && { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}>
                    <T variant="bodySemi" style={{ flex: 1, fontSize: 14 }}>
                      {e.name}
                    </T>
                    {sel ? <Ionicons name="checkmark-circle" size={18} color={colors.accent} /> : null}
                  </Pressable>
                );
              })}
              {matches.length === 0 ? (
                <T variant="small" dim>
                  No exercises match that search.
                </T>
              ) : null}
            </View>
          ) : (
            <T variant="micro" muted style={{ marginTop: 4 }}>
              {EXERCISES.length} exercises in the library
            </T>
          )}

          {exerciseId ? (
            <>
              <View style={styles.pickedRow}>
                <T variant="bodySemi" accent>
                  {EXERCISE_MAP[exerciseId]?.name}
                </T>
                <Pressable onPress={() => setExerciseId(null)} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
              <Row align="space-between" style={{ marginTop: spacing.md }}>
                <View>
                  <T variant="label" dim>
                    Weight
                  </T>
                  <Stepper value={weight} onChange={setWeight} step={2.5} min={0} max={500} decimals={1} unit="kg" size="md" />
                </View>
                <View>
                  <T variant="label" dim>
                    Reps
                  </T>
                  <Stepper value={reps} onChange={setReps} step={1} min={1} max={100} unit="reps" size="md" />
                </View>
              </Row>
              <Button label="Save Record" icon="trophy" full size="lg" style={{ marginTop: spacing.xl }} onPress={save} />
            </>
          ) : null}
        </ScrollView>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  trophyIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barbellIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: 10, color: colors.text, fontSize: 14, fontFamily: 'Inter_400Regular' },
  exOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  pickedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
});
