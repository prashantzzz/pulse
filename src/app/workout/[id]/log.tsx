import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { T } from '../../../components/Text';
import { BottomSheet, Stepper, toast } from '../../../components/misc';
import { Button, Card, Icon, Row, Screen, ScreenHeader } from '../../../components/ui';
import { EXERCISE_MAP } from '../../../data/exercises';
import { platesForTarget } from '../../../lib/plates';
import { previousSet, warmupSets } from '../../../lib/stats';
import { usePulse } from '../../../store/useStore';
import { colors, layout, radius, spacing, useAccent } from '../../../theme';
import { hapticsLight } from '../../../lib/haptics';

const RPE_OPTIONS = [6, 7, 8, 9, 10];

export default function LogSetScreen() {
  useAccent();
  const { id, exercise, set } = useLocalSearchParams<{ id: string; exercise: string; set: string }>();
  const router = useRouter();
  const activeWorkout = usePulse((s) => s.activeWorkout);
  const workouts = usePulse((s) => s.workouts);
  const patchSet = usePulse((s) => s.patchSet);
  const completeSet = usePulse((s) => s.completeSet);

  const workout = activeWorkout;
  const we = workout?.exercises.find((x) => x.exerciseId === exercise);
  const current = we?.sets.find((s) => s.id === set);
  const ex = exercise ? EXERCISE_MAP[exercise] : undefined;

  const [weight, setWeight] = useState<number>(current?.weightKg ?? previousSet(workouts, exercise ?? '', current?.setIndex ?? 1)?.weightKg ?? 20);
  const [reps, setReps] = useState<number>(current?.reps ?? previousSet(workouts, exercise ?? '', current?.setIndex ?? 1)?.reps ?? 10);
  const [rpe, setRpe] = useState<number | null>(current?.rpe ?? null);
  const [notes, setNotes] = useState(current?.notes ?? '');
  const [platesOpen, setPlatesOpen] = useState(false);
  const [barWeight, setBarWeight] = useState(20);
  const [platesTarget, setPlatesTarget] = useState(weight);

  useEffect(() => {
    const onBackPress = () => {
      if (platesOpen) {
        setPlatesOpen(false);
        return true;
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(`/workout/${id}` as never);
      }
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [platesOpen, router, id]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/workout/${id}` as never);
    }
  };

  if (!workout || !we || !current || !ex) {
    return (
      <Screen>
        <ScreenHeader title="Log Set" back onBack={handleBack} />
        <View style={{ padding: spacing.lg }}>
          <T variant="body" dim>
            This set is no longer available.
          </T>
        </View>
      </Screen>
    );
  }

  const totalInExercise = we.sets.length;
  const prev = previousSet(workouts, ex.id, current.setIndex);
  const suggestion = prev?.weightKg != null && prev.reps != null ? prev.weightKg + 2.5 : null;
  const suggestionReps = ex.repRange.match(/(\d+)\s*[-–]\s*(\d+)/);
  const suggestedRepLow = suggestionReps ? Number(suggestionReps[1]) : 8;
  const suggestedRepHigh = suggestionReps ? Number(suggestionReps[2]) : 12;

  const currentIndex = we.sets.findIndex((s) => s.id === current.id);
  const prevIncomplete = we.sets.slice(0, currentIndex).find((s) => !s.completed);

  const save = (complete: boolean, goNext: boolean) => {
    patchSet(ex.id, current.id, { weightKg: weight, reps, rpe, notes: notes.trim() || null });
    if (complete) {
      if (prevIncomplete) {
        hapticsLight();
        toast(`Please complete Set ${prevIncomplete.setIndex} first`);
        return;
      }
      completeSet(ex.id, current.id);
    }
    if (goNext) {
      const remaining = we.sets.filter((s) => !s.completed && s.id !== current.id);
      const nextSet = remaining[0];
      if (nextSet) {
        router.replace(`/workout/${workout.id}/log?exercise=${ex.id}&set=${nextSet.id}`);
      } else {
        const nextEx = workout.exercises.find((x) => x.order > we.order && x.sets.some((s) => !s.completed));
        const nextExSet = nextEx?.sets.find((s) => !s.completed);
        if (nextEx && nextExSet) {
          router.replace(`/workout/${workout.id}/log?exercise=${nextEx.exerciseId}&set=${nextExSet.id}`);
        } else {
          router.back();
        }
      }
    } else {
      router.back();
    }
  };

  // Save kg/reps/rpe/notes without marking the set as completed — useful for
  // pre-setting weight before starting the set or adjusting values mid-session.
  const saveOnly = () => {
    patchSet(ex.id, current.id, { weightKg: weight, reps, rpe, notes: notes.trim() || null });
    hapticsLight();
    toast('Values saved');
    router.back();
  };

  const finish = () => {
    if (prevIncomplete) {
      hapticsLight();
      toast(`Please complete Set ${prevIncomplete.setIndex} first`);
      return;
    }
    save(true, false);
    toast('Set complete');
    router.replace(`/workout/${workout.id}` as never);
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen scroll contentStyle={{ paddingBottom: 160, paddingTop: layout.screenTopPad }}>
        <ScreenHeader title={`Set ${current.setIndex} of ${totalInExercise}`} back onBack={handleBack} />

        <View>
          <Pressable
            onPress={() => router.push(`/exercise/${ex.id}` as never)}
            hitSlop={4}
            style={({ pressed }) => [pressed && { opacity: 0.8 }]}>
            <Card gradient="charcoal" style={{ padding: spacing.md }}>
              <Row align="space-between" style={{ width: '100%' }}>
                <Row gap={12} style={{ flex: 1 }}>
                  <Icon name="barbell-outline" size={20} color={colors.accent} />
                  <View style={{ flex: 1 }}>
                    <T variant="h3">{ex.name}</T>
                    <T variant="small" dim style={{ fontSize: 12 }}>
                      {ex.equipment} · {we.targetReps} target reps
                    </T>
                  </View>
                </Row>
                <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
              </Row>
            </Card>
          </Pressable>

          {/* last time — compact, same canonical exercise */}
          {prev ? (
            <Card style={{ marginTop: spacing.md, padding: spacing.md }}>
              <Row gap={10} align="flex-start">
                <View style={styles.bulb}>
                  <Ionicons name="time-outline" size={18} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <T variant="micro" muted style={{ fontSize: 9.5 }}>
                    LAST TIME
                  </T>
                  <T variant="bodySemi" style={{ marginTop: 2 }}>
                    {prev.weightKg} kg × {prev.reps}
                  </T>
                  {suggestion ? (
                    <T variant="smallMedium" accent style={{ marginTop: 4 }}>
                      Try {suggestion} kg × {suggestedRepLow}–{suggestedRepHigh} today
                    </T>
                  ) : null}
                </View>
              </Row>
            </Card>
          ) : null}

          <Card style={{ marginTop: spacing.md, padding: spacing.lg }}>
            <Row align="space-between" style={{ marginBottom: spacing.md }}>
              <T variant="label" dim center style={{ flex: 1 }}>
                Weight (kg)
              </T>
              <Pressable onPress={() => { setPlatesTarget(weight); setPlatesOpen(true); }} hitSlop={8} style={styles.platesBtn}>
                <Ionicons name="calculator-outline" size={14} color={colors.accent} />
                <T variant="smallSemi" accent style={{ fontSize: 12 }}>
                  Plates
                </T>
              </Pressable>
            </Row>
            <Stepper value={weight} onChange={setWeight} step={2.5} decimals={1} min={0} />

            {/* warm-up suggestion — only on the first working set of a strength lift */}
            {we.sets.find((s) => s.setType !== 'warmup')?.id === current.id && ex.movement !== 'Cardio' ? (() => {
              const wu = warmupSets(weight);
              if (wu.length === 0) return null;
              return (
                <View style={styles.warmupWrap}>
                  <Ionicons name="flame-outline" size={13} color={colors.textMuted} />
                  <T variant="micro" muted style={{ fontSize: 10.5, flex: 1 }}>
                    Warm-up: {wu.map((s) => `${s.kg} × ${s.reps}`).join(' · ')} → work sets
                  </T>
                </View>
              );
            })() : null}

            <View style={styles.divider} />
            <T variant="label" dim center style={{ marginBottom: spacing.md }}>
              Reps
            </T>
            <Stepper value={reps} onChange={setReps} step={1} min={0} max={100} />
          </Card>

          <Card style={{ marginTop: spacing.md, padding: spacing.md }}>
            <Row align="space-between" style={{ marginBottom: spacing.sm }}>
              <T variant="bodySemi">RPE</T>
              <T variant="micro" muted>
                Optional · rate the effort
              </T>
            </Row>
            <Row gap={8}>
              {RPE_OPTIONS.map((r) => (
                <Pressable key={r} onPress={() => setRpe(rpe === r ? null : r)} style={[styles.rpeBtn, rpe === r && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                  <T variant="smallSemi" style={{ color: rpe === r ? colors.bg : colors.textDim }}>
                    {r}
                  </T>
                </Pressable>
              ))}
            </Row>
            {rpe != null ? (
              <T variant="micro" muted style={{ marginTop: 8 }}>
                {rpe <= 6 ? 'Easy — could add weight' : rpe <= 8 ? 'Solid working effort' : 'Grinder — near failure'}
              </T>
            ) : null}
          </Card>

          <Card style={{ marginTop: spacing.md, padding: spacing.md }}>
            <T variant="bodySemi" style={{ marginBottom: spacing.xs }}>
              Notes
            </T>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="How did it feel?"
              placeholderTextColor={colors.textMuted}
              style={styles.notesInput}
              multiline
            />
          </Card>
        </View>
      </Screen>

      {/* plate calculator — compact utility inside the logging flow */}
      <BottomSheet visible={platesOpen} onClose={() => setPlatesOpen(false)} title="Plate Calculator">
        <View style={{ gap: spacing.lg }}>
          <View>
            <T variant="label" dim style={{ marginBottom: 10 }}>
              Target weight
            </T>
            <Stepper value={platesTarget} onChange={setPlatesTarget} step={2.5} decimals={1} min={0} size="lg" />
          </View>
          <View style={styles.plateCalcDivider} />
          <View>
            <T variant="label" dim style={{ marginBottom: 10 }}>
              Bar weight
            </T>
            <Stepper value={barWeight} onChange={setBarWeight} step={2.5} decimals={1} min={0} size="lg" />
          </View>
          <PlateResultView targetKg={platesTarget} barKg={barWeight} />
        </View>
      </BottomSheet>

      <View style={styles.bottomBar}>
        <Button label="Complete Set" icon="checkmark" full size="lg" onPress={finish} />
        <Pressable onPress={saveOnly} style={{ marginTop: spacing.sm }}>
          <T variant="smallMedium" dim center>
            Save
          </T>
        </Pressable>
      </View>
    </View>
  );
}

function PlateResultView({ targetKg, barKg }: { targetKg: number; barKg: number }) {
  const r = platesForTarget(targetKg, barKg);
  return (
    <View style={styles.plateResult}>
      <Row align="space-between" style={{ marginBottom: spacing.sm }}>
        <T variant="label" dim>
          Per side
        </T>
        <T variant="micro" muted>
          Bar {barKg} kg · Total {targetKg} kg
        </T>
      </Row>
      {r.barOnly ? (
        <T variant="small" dim>
          Bar only — no plates needed.
        </T>
      ) : r.plates.length === 0 ? null : (
        <Row gap={6} wrap>
          {r.plates.map((p, i) => (
            <View key={i} style={styles.plateChip}>
              <T variant="smallSemi" style={{ fontSize: 12.5 }}>
                {p} kg
              </T>
            </View>
          ))}
          {r.remainderKg > 0 ? (
            <T variant="micro" muted style={{ alignSelf: 'center' }}>
              + {r.remainderKg} kg per side (fractional plates)
            </T>
          ) : null}
        </Row>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
    bulb: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.goldSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    platesBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.accentSoft,
    },
    warmupWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.md,
      backgroundColor: colors.surface2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
    },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  rpeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },

  plateResult: {
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  plateCalcDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: -spacing.xs,
  },
  plateChip: {
    backgroundColor: colors.surface3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderBright,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  notesInput: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.text,
    fontSize: 14,
    minHeight: 60,
    fontFamily: 'Inter_400Regular',
    textAlignVertical: 'top',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 24,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
