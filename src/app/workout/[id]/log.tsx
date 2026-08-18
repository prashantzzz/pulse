import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { T } from '../../../components/Text';
import { Stepper, toast } from '../../../components/misc';
import { Button, Card, Icon, Row, Screen, ScreenHeader } from '../../../components/ui';
import { EXERCISE_MAP } from '../../../data/exercises';
import { previousSet } from '../../../lib/stats';
import { usePulse } from '../../../store/useStore';
import { colors, radius, spacing, useAccent } from '../../../theme';

const RPE_OPTIONS = [6, 7, 8, 9, 10];

export default function LogSetScreen() {
  useAccent();
  const { exercise, set } = useLocalSearchParams<{ id: string; exercise: string; set: string }>();
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

  if (!workout || !we || !current || !ex) {
    return (
      <Screen>
        <ScreenHeader title="Log Set" back />
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

  const save = (complete: boolean, goNext: boolean) => {
    patchSet(ex.id, current.id, { weightKg: weight, reps, rpe, notes: notes.trim() || null });
    if (complete) completeSet(ex.id, current.id);
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

  const finish = () => {
    save(true, false);
    toast('Set complete');
    router.replace(`/workout/${workout.id}/rest?sec=90`);
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen scroll contentStyle={{ paddingBottom: 160 }}>
        <ScreenHeader title={`Set ${current.setIndex} of ${totalInExercise}`} back />

        <View style={{ paddingHorizontal: spacing.lg }}>
          <Card gradient="charcoal" style={{ padding: spacing.md }}>
            <Row gap={12}>
              <Icon name="barbell-outline" size={20} color={colors.accent} />
              <View>
                <T variant="h3">{ex.name}</T>
                <T variant="small" dim style={{ fontSize: 12 }}>
                  {ex.equipment} · {we.targetReps} target reps
                </T>
              </View>
            </Row>
          </Card>

          {/* smart hint */}
          {prev ? (
            <Card style={{ marginTop: spacing.md, padding: spacing.md }}>
              <Row gap={10} align="flex-start">
                <View style={styles.bulb}>
                  <Ionicons name="bulb-outline" size={18} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <T variant="small" dim style={{ fontSize: 12 }}>
                    Last time: {prev.weightKg} kg × {prev.reps}
                  </T>
                  {suggestion ? (
                    <T variant="bodySemi" accent style={{ marginTop: 4 }}>
                      Try {suggestion} kg × {suggestedRepLow}–{suggestedRepHigh} today
                    </T>
                  ) : null}
                </View>
              </Row>
            </Card>
          ) : null}

          <Card style={{ marginTop: spacing.md, padding: spacing.lg }}>
            <T variant="label" dim center style={{ marginBottom: spacing.md }}>
              Weight (kg)
            </T>
            <Stepper value={weight} onChange={setWeight} step={2.5} decimals={1} min={0} />
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

      <View style={styles.bottomBar}>
        <Button label="Complete Set" icon="checkmark" full size="lg" onPress={finish} />
        <Pressable onPress={() => save(true, true)} style={{ marginTop: spacing.sm }}>
          <T variant="smallMedium" dim center>
            Save & Next Set
          </T>
        </Pressable>
      </View>
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
