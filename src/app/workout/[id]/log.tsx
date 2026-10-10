import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Keyboard, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { T } from '../../../components/Text';
import { BottomSheet, Stepper, toast } from '../../../components/misc';
import { Button, Card, Icon, Row, Screen, ScreenHeader } from '../../../components/ui';
import { EXERCISE_MAP } from '../../../data/exercises';
import { platesForTarget } from '../../../lib/plates';
import { previousSet, warmupSets, exerciseInvolvesWeights } from '../../../lib/stats';
import { toUserWeight, fromUserWeight, formatWeightWithUnit, getBarWeight, getWeightStep, WeightUnit } from '../../../lib/units';
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
  const exerciseDefaults = usePulse((s) => s.exerciseDefaults);
  const weightUnit = usePulse((s) => s.weightUnit);

  const workout = activeWorkout;
  const we = workout?.exercises.find((x) => x.exerciseId === exercise);
  const current = we?.sets.find((s) => s.id === set);
  const ex = exercise ? EXERCISE_MAP[exercise] : undefined;
  const isBodyweight = !exerciseInvolvesWeights(exercise ?? '');
  const remembered = exercise ? exerciseDefaults?.[exercise] : undefined;

  const rawKg = current?.weightKg ?? (isBodyweight ? 0 : (remembered?.weightKg ?? previousSet(workouts, exercise ?? '', current?.setIndex ?? 1)?.weightKg ?? null));
  const [weight, setWeight] = useState<number>(() => rawKg != null ? toUserWeight(rawKg, weightUnit) : getBarWeight(weightUnit));
  const [reps, setReps] = useState<number>(
    current?.reps ?? remembered?.reps ?? previousSet(workouts, exercise ?? '', current?.setIndex ?? 1)?.reps ?? 10,
  );
  const [rpe, setRpe] = useState<number | null>(current?.rpe ?? null);
  const [notes, setNotes] = useState(current?.notes ?? '');
  const [platesOpen, setPlatesOpen] = useState(false);
  const [barWeight, setBarWeight] = useState(() => getBarWeight(weightUnit));
  const [platesTarget, setPlatesTarget] = useState(weight);

  // ── Notes field ↔ keyboard handling ────────────────────────────────────────
  // The notes card is the last block on the screen. When the keyboard opens
  // (Android window resize / iOS keyboard inset) or the multiline field grows,
  // scroll it into view so typed letters are never hidden under the keyboard.
  const scrollRef = useRef<ScrollView>(null);
  const notesFocusedRef = useRef(false);

  const scrollNotesIntoView = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated });
    });
  }, []);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      if (!notesFocusedRef.current) return;
      // Give the window resize (Android) / keyboard inset (iOS) a beat to
      // settle before scrolling the notes card above the keyboard.
      setTimeout(() => scrollNotesIntoView(true), 80);
    });
    return () => sub.remove();
  }, [scrollNotesIntoView]);

  const handleBack = () => {
    const savedWeightKg = fromUserWeight(weight, weightUnit);
    if (current && ex && (savedWeightKg !== current.weightKg || reps !== current.reps)) {
      patchSet(ex.id, current.id, { weightKg: savedWeightKg, reps, rpe, notes: notes.trim() || null });
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/workout/${id}` as never);
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      if (platesOpen) {
        setPlatesOpen(false);
        return true;
      }
      handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  });

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
  const prevUserWeight = prev?.weightKg != null && prev.weightKg > 0 ? toUserWeight(prev.weightKg, weightUnit) : null;
  const weightStep = getWeightStep(weightUnit);
  const suggestion =
    prevUserWeight != null && prevUserWeight > 0 && prev?.reps != null && ex.movement !== 'Cardio'
      ? prevUserWeight + weightStep
      : null;
  const suggestionReps = ex.repRange.match(/(\d+)\s*[-–]\s*(\d+)/);
  const suggestedRepLow = suggestionReps ? Number(suggestionReps[1]) : 8;
  const suggestedRepHigh = suggestionReps ? Number(suggestionReps[2]) : 12;

  // Return to the running workout screen. Popping preserves the existing
  // workout route (and its unsaved-workout guard); the replace fallback only
  // matters when the log was opened without a back stack (deep link).
  const exitToWorkout = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/workout/${workout.id}` as never);
    }
  };

  // Save kg/reps/rpe/notes without marking the set as completed — useful for
  // pre-setting weight before starting the set or adjusting values mid-session.
  const saveOnly = () => {
    const savedWeightKg = fromUserWeight(weight, weightUnit);
    patchSet(ex.id, current.id, { weightKg: savedWeightKg, reps, rpe, notes: notes.trim() || null });
    hapticsLight();
    toast('Values saved to workout');
    exitToWorkout();
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen
        scroll
        scrollRef={scrollRef}
        scrollProps={{
          keyboardShouldPersistTaps: 'handled',
          keyboardDismissMode: 'on-drag',
          // iOS-only: pads the scroll content when the keyboard appears.
          ...(Platform.OS === 'ios' ? { automaticallyAdjustKeyboardInsets: true } : {}),
        }}
        contentStyle={{ paddingBottom: 160, paddingTop: layout.screenTopPad }}>
        <ScreenHeader title={`Set ${current.setIndex} of ${totalInExercise}`} back onBack={handleBack} />

        <View>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/exercise/[id]',
                params: { id: ex.id, fromRunning: '1' },
              } as never)
            }
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
                    {!isBodyweight && prevUserWeight != null && prevUserWeight > 0 ? `${formatWeightWithUnit(prevUserWeight, weightUnit)} × ${prev.reps}` : `${prev.reps} reps`}
                  </T>
                  {suggestion ? (
                    <T variant="smallMedium" accent style={{ marginTop: 4 }}>
                      Try {formatWeightWithUnit(suggestion, weightUnit)} × {suggestedRepLow}–{suggestedRepHigh} today
                    </T>
                  ) : null}
                </View>
              </Row>
            </Card>
          ) : null}

          <Card style={{ marginTop: spacing.md, padding: spacing.lg }}>
            <Row align="space-between" style={{ marginBottom: spacing.md }}>
              <T variant="label" dim center style={{ flex: 1 }}>
                Weight ({weightUnit})
              </T>
              <Pressable onPress={() => { setPlatesTarget(weight); setPlatesOpen(true); }} hitSlop={8} style={styles.platesBtn}>
                <Ionicons name="calculator-outline" size={14} color={colors.accent} />
                <T variant="smallSemi" accent style={{ fontSize: 12 }}>
                  Plates
                </T>
              </Pressable>
            </Row>
            <Stepper value={weight} onChange={setWeight} step={weightStep} decimals={weightUnit === 'lbs' ? 0 : 1} min={0} />

            {/* warm-up suggestion — only on the first working set of a strength lift */}
            {we.sets.find((s) => s.setType !== 'warmup')?.id === current.id && ex.movement !== 'Cardio' ? (() => {
              const wu = warmupSets(weight, weightUnit);
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
              onFocus={() => {
                notesFocusedRef.current = true;
                scrollNotesIntoView(true);
              }}
              onBlur={() => {
                notesFocusedRef.current = false;
              }}
              onContentSizeChange={() => {
                // Keep the growing multiline field visible while typing.
                if (notesFocusedRef.current) scrollNotesIntoView(false);
              }}
            />
          </Card>
        </View>
      </Screen>

      {/* plate calculator — compact utility inside the logging flow */}
      <BottomSheet visible={platesOpen} onClose={() => setPlatesOpen(false)} title="Plate Calculator">
        <View style={{ gap: spacing.lg }}>
          <View>
            <T variant="label" dim style={{ marginBottom: 10 }}>
              Target weight ({weightUnit})
            </T>
            <Stepper value={platesTarget} onChange={setPlatesTarget} step={weightStep} decimals={weightUnit === 'lbs' ? 0 : 1} min={0} size="lg" />
          </View>
          <View style={styles.plateCalcDivider} />
          <View>
            <T variant="label" dim style={{ marginBottom: 10 }}>
              Bar weight ({weightUnit})
            </T>
            <Stepper value={barWeight} onChange={setBarWeight} step={weightStep} decimals={weightUnit === 'lbs' ? 0 : 1} min={0} size="lg" />
          </View>
          <PlateResultView targetWeight={platesTarget} barWeight={barWeight} unit={weightUnit} />
        </View>
      </BottomSheet>

      <View style={styles.bottomBar}>
        <Button
          label="Save"
          variant="dark"
          icon="save-outline"
          full
          size="md"
          onPress={saveOnly}
          style={styles.saveBtn}
        />
      </View>
    </View>
  );
}

function PlateResultView({ targetWeight, barWeight, unit }: { targetWeight: number; barWeight: number; unit: WeightUnit }) {
  const r = platesForTarget(targetWeight, barWeight, unit);
  return (
    <View style={styles.plateResult}>
      <Row align="space-between" style={{ marginBottom: spacing.sm }}>
        <T variant="label" dim>
          Per side
        </T>
        <T variant="micro" muted>
          Bar {barWeight} {unit} · Total {targetWeight} {unit}
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
                {p} {unit}
              </T>
            </View>
          ))}
          {r.remainderKg > 0 ? (
            <T variant="micro" muted style={{ alignSelf: 'center' }}>
              + {r.remainderKg} {unit} per side (fractional plates)
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
    gap: 8,
  },
  saveBtn: {
    height: 44,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderBright,
    borderRadius: radius.md,
  },
});
