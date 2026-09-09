import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { T } from '../components/Text';
import { BottomSheet, EmptyState, Stepper, toast } from '../components/misc';
import { Button, Card, Icon, Row, Screen, ScreenHeader } from '../components/ui';
import { EXERCISES, EXERCISE_MAP } from '../data/exercises';
import { bestForExercise, e1rm } from '../lib/stats';
import { toUserWeight, fromUserWeight, formatWeightWithUnit, formatUserWeightWithUnit, getBarWeight, getWeightStep } from '../lib/units';
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
  const router = useRouter();
  const workouts = usePulse((s) => s.workouts);
  const manualPRs = usePulse((s) => s.manualPRs);
  const addManualPR = usePulse((s) => s.addManualPR);
  const removeManualPR = usePulse((s) => s.removeManualPR);
  const weightUnit = usePulse((s) => s.weightUnit);

  const [sheet, setSheet] = useState(false);
  const [query, setQuery] = useState('');
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [weight, setWeight] = useState(() => toUserWeight(20, weightUnit));
  const [reps, setReps] = useState(10);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/progress' as never);
    }
  }, [router]);

  // Dismiss bottom sheet or navigate back on phone back press
  useEffect(() => {
    const onBackPress = () => {
      if (sheet) {
        setSheet(false);
        return true;
      }
      handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [sheet, handleBack]);

  const historyBests = [...new Set(workouts.flatMap((w) => w.exercises.map((we) => we.exerciseId)))]
    .map((id) => ({ id, best: bestForExercise(workouts, id) }))
    .filter((r): r is { id: string; best: NonNullable<ReturnType<typeof bestForExercise>> } => !!r.best)
    .sort((a, b) => b.best.maxE1rm.e1rm - a.best.maxE1rm.e1rm)
    .slice(0, 5);

  const matches = query.trim()
    ? EXERCISES.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 12)
    : [];

  const weightStep = getWeightStep(weightUnit);

  const openSheet = () => {
    setQuery('');
    setExerciseId(null);
    setWeight(getBarWeight(weightUnit));
    setReps(10);
    setSheet(true);
  };

  const save = () => {
    if (!exerciseId) return;
    const ex = EXERCISE_MAP[exerciseId];
    const savedKg = fromUserWeight(weight, weightUnit);
    addManualPR({ exerciseId, weightKg: savedKg, reps, date: new Date().toISOString() });
    setSheet(false);
    toast(`New record saved — ${ex?.name ?? 'exercise'} ${formatWeightWithUnit(weight, weightUnit)} × ${reps}`);
  };

  return (
    <Screen scroll contentStyle={{ paddingBottom: layout.stackContentBottomPad, paddingTop: layout.screenTopPad }}>
      <ScreenHeader title="Personal Records" subtitle={`${manualPRs.length} manual · ${historyBests.length} from workouts`} back onBack={handleBack} />

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
                        {pr.weightKg > 0 ? `${formatUserWeightWithUnit(pr.weightKg, weightUnit)} × ${pr.reps}` : `${pr.reps} reps`}
                      </T>
                      <T variant="micro" muted>
                        {pr.weightKg > 0 ? `${formatUserWeightWithUnit(e1rm(pr.weightKg, pr.reps), weightUnit)} est. 1RM` : 'Bodyweight'}
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

        <View style={{ marginTop: spacing.xl, marginBottom: 10 }}>
          <T variant="label" dim>
            From workout history
          </T>
        </View>
        {historyBests.length === 0 ? (
          <Card style={{ padding: spacing.lg }}>
            <T variant="small" dim>
              No finished workouts yet. Completed exercises show their all-time heaviest load and best 1RM here automatically.
            </T>
          </Card>
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
                          {r.best.maxWeight.weightKg > 0
                            ? `${formatUserWeightWithUnit(r.best.maxWeight.weightKg, weightUnit)} × ${r.best.maxWeight.reps}`
                            : `${r.best.maxReps.reps} reps`}
                        </T>
                      </View>
                    </Row>
                    <T variant="numSm" accent>
                      {r.best.maxWeight.weightKg > 0
                        ? formatUserWeightWithUnit(r.best.maxE1rm.e1rm, weightUnit)
                        : `${r.best.maxReps.reps} reps`}
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
                        setWeight(toUserWeight(b.maxWeight.weightKg, weightUnit));
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
                  <Stepper value={weight} onChange={setWeight} step={weightStep} min={0} max={weightUnit === 'lbs' ? 1100 : 500} decimals={weightUnit === 'lbs' ? 0 : 1} unit={weightUnit} size="md" />
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
