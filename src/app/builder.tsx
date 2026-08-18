import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ExerciseThumb } from '../components/muscle-icon';
import { T } from '../components/Text';
import { BottomSheet, Stepper, toast } from '../components/misc';
import { Button, Icon, Row, Screen, ScreenHeader } from '../components/ui';
import { EXERCISE_MAP, searchExercises, swapOptions } from '../data/exercises';
import { usePulse } from '../store/useStore';
import { colors, radius, spacing, useAccent } from '../theme';

interface DraftExercise {
  exerciseId: string;
  sets: number;
  targetReps: string;
}

const REP_PRESETS = ['4-6', '6-10', '8-12', '10-15', '12-20'];

export default function BuilderScreen() {
  useAccent();
  const router = useRouter();
  // ?plan=<planId> opens the builder as a plan editor instead of a workout
  // creator — same exercise picker, sets and target-rep controls, but saving
  // updates the plan instead of logging a workout
  const { add, plan: planParam } = useLocalSearchParams<{ add?: string; plan?: string }>();
  const plans = usePulse((s) => s.plans);
  const updatePlan = usePulse((s) => s.updatePlan);
  const removePlan = usePulse((s) => s.removePlan);
  const saveBuiltWorkout = usePulse((s) => s.saveBuiltWorkout);
  const plan = planParam ? plans.find((p) => p.id === planParam) : undefined;
  const [title, setTitle] = useState('');
  const [drafts, setDrafts] = useState<DraftExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Add exercises passed via the ?add=<exerciseId> param. The param can arrive
  // after the first render (e.g. on web), so track the last applied value and
  // adjust state during render — the React-recommended alternative to calling
  // setState inside an effect. Start at undefined so a param present on the
  // first render is applied too (matching the old mount effect).
  const [appliedAdd, setAppliedAdd] = useState<string | undefined>(undefined);
  if (add !== appliedAdd) {
    setAppliedAdd(add);
    if (add && EXERCISE_MAP[add] && !drafts.some((d) => d.exerciseId === add)) {
      setDrafts((prev) => [...prev, { exerciseId: add, sets: 3, targetReps: '8-12' }]);
    }
  }
  // Seed the drafts from the plan being edited (render-time adjustment, same
  // pattern as the ?add param above).
  const [appliedEdit, setAppliedEdit] = useState<string | undefined>(undefined);
  if (planParam && plan && appliedEdit !== planParam) {
    setAppliedEdit(planParam);
    setTitle(plan.title);
    setDrafts(plan.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets, targetReps: e.targetReps })));
  }

  const addExercise = (exerciseId: string) => {
    if (!drafts.some((d) => d.exerciseId === exerciseId)) {
      setDrafts((prev) => [...prev, { exerciseId, sets: 3, targetReps: '8-12' }]);
      toast('Exercise added');
    } else {
      toast('Already in your workout');
    }
  };

  const removeExercise = (i: number) => {
    setDrafts((prev) => prev.filter((_, idx) => idx !== i));
    if (editing === i) setEditing(null);
  };

  const pickerResults = searchExercises({ query });

  const save = () => {
    if (drafts.length === 0) {
      toast('Add at least one exercise');
      return;
    }
    if (plan) {
      updatePlan(plan.id, { ...plan, title: title.trim() || plan.title, exercises: drafts });
      toast('Plan updated');
      router.back();
      return;
    }
    const now = new Date();
    const end = new Date(now.getTime() + Math.max(15, drafts.length * 6) * 60000);
    const exercises = drafts.map((d, i) => {
      const weId = `bwe${Date.now()}-${i}`;
      return {
        id: weId,
        exerciseId: d.exerciseId,
        order: i + 1,
        notes: null,
        plannedSets: d.sets,
        targetReps: d.targetReps,
        sets: Array.from({ length: d.sets }, (_, si) => ({
          id: `${weId}-s${si + 1}`,
          setIndex: si + 1,
          setType: (si === 0 && d.sets > 3 ? 'warmup' : 'working') as 'warmup' | 'working',
          weightKg: null,
          reps: null,
          distanceKm: null,
          durationSec: null,
          rpe: null,
          notes: null,
          supersetId: null,
          completed: false,
          completedAt: null,
        })),
      };
    });
    saveBuiltWorkout(title.trim() || 'My Workout', exercises, now.toISOString(), end.toISOString());
    toast('Workout saved');
    router.back();
  };

  const edit = editing != null ? drafts[editing] : undefined;
  const swapEx = swapIndex != null ? EXERCISE_MAP[drafts[swapIndex]?.exerciseId] : undefined;

  return (
    <View style={{ flex: 1 }}>
      <Screen scroll contentStyle={{ paddingBottom: 120 }}>
        <ScreenHeader title={plan ? 'Edit Plan' : 'New Workout'} back right="checkmark" onRight={save} />

        <View style={{ gap: spacing.md }}>
          <View style={styles.nameWrap}>
            <Row align="space-between" style={{ marginBottom: 6 }}>
              <T variant="label" dim>
                Workout Name
              </T>
              {plan ? (
                <Pressable onPress={() => setConfirmDelete(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Delete ${plan.title} plan`}>
                  <Row gap={5}>
                    <Ionicons name="trash-outline" size={14} color={colors.red} />
                    <T variant="smallMedium" style={{ color: colors.red, fontSize: 12 }}>
                      Delete Plan
                    </T>
                  </Row>
                </Pressable>
              ) : null}
            </Row>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Chest & Triceps"
              placeholderTextColor={colors.textMuted}
              style={styles.nameInput}
            />
          </View>

          <Pressable onPress={() => setPickerOpen(true)} style={styles.addSearch}>
            <Icon name="search" size={18} color={colors.textMuted} />
            <T variant="body" dim style={{ flex: 1 }}>
              Add exercises...
            </T>
            <View style={[styles.addSearchBtn, { backgroundColor: colors.accent }]}>
              <Icon name="add" size={18} color={colors.bg} />
            </View>
          </Pressable>

          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            {drafts.length === 0 ? (
              <View style={styles.emptyDraft}>
                <Ionicons name="barbell-outline" size={34} color={colors.textMuted} />
                <T variant="body" dim center style={{ marginTop: 8 }}>
                  Your workout is empty. Add exercises to build your plan.
                </T>
              </View>
            ) : (
              drafts.map((d, i) => {
                const e = EXERCISE_MAP[d.exerciseId];
                if (!e) return null;
                return (
                  <View key={i} style={styles.draftCard}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Pressable onPress={() => router.push(`/exercise/${d.exerciseId}` as never)}>
                        <T variant="bodySemi" numberOfLines={1}>
                          {i + 1}. {e.name}
                        </T>
                      </Pressable>
                      <Pressable onPress={() => setEditing(i)}>
                        <T variant="small" accent style={{ fontSize: 12 }}>
                          {d.sets} sets · {d.targetReps} reps
                        </T>
                      </Pressable>
                    </View>
                    <Pressable onPress={() => setSwapIndex(i)} hitSlop={8} style={styles.swapBtn} accessibilityLabel={`Swap ${e.name}`}>
                      <Ionicons name="swap-horizontal" size={18} color={colors.textDim} />
                    </Pressable>
                    <Pressable onPress={() => removeExercise(i)} hitSlop={8}>
                      <Ionicons name="close" size={20} color={colors.textMuted} />
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </Screen>

      <View style={styles.ctaBar}>
        <Button label="+ Add Exercise" variant="outline" full size="lg" onPress={() => setPickerOpen(true)} />
      </View>

      {/* exercise picker — results scroll above a search bar pinned to the
          bottom so typing never resizes the list and the field stays above
          the keyboard on phones */}
      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Add exercise">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: spacing.sm, gap: spacing.xs }}>
              {pickerResults.map((e) => (
                <Pressable key={e.id} onPress={() => addExercise(e.id)} style={styles.pickerRow}>
                  <View style={{ flex: 1 }}>
                    <T variant="bodySemi" style={{ fontSize: 14 }}>
                      {e.name}
                    </T>
                    <T variant="micro" muted>
                      {e.muscleGroup} · {e.equipment}
                    </T>
                  </View>
                  {drafts.some((d) => d.exerciseId === e.id) ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                  ) : (
                    <View style={[styles.pickerAdd, { backgroundColor: colors.accentSoft }]}>
                      <Ionicons name="add" size={16} color={colors.accent} />
                    </View>
                  )}
                </Pressable>
              ))}
              {pickerResults.length === 0 ? (
                <T variant="small" dim center style={{ paddingVertical: 20 }}>
                  No matches
                </T>
              ) : null}
            </ScrollView>

            <View style={styles.pickerSearch}>
              <Icon name="search" size={18} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search exercises..."
                placeholderTextColor={colors.textMuted}
                style={styles.pickerInput}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* swap exercise sheet — curated alternatives keep sets & target reps */}
      <BottomSheet visible={swapIndex != null} onClose={() => setSwapIndex(null)} title={swapEx ? `Swap ${swapEx.name}` : 'Swap Exercise'}>
        <T variant="small" dim style={{ marginBottom: spacing.md }}>
          Replace with a similar exercise — sets and target reps stay the same.
        </T>
        <View style={{ gap: spacing.xs }}>
          {swapEx
            ? swapOptions(swapEx, 4).map((alt) => (
                <Pressable
                  key={alt.id}
                  onPress={() => {
                    if (swapIndex != null) {
                      setDrafts((prev) => prev.map((d, i) => (i === swapIndex ? { ...d, exerciseId: alt.id } : d)));
                    }
                    setSwapIndex(null);
                    toast(`Swapped to ${alt.name}`);
                  }}
                  style={styles.swapRow}>
                  <ExerciseThumb muscle={alt.muscleGroup} size={34} />
                  <View style={{ flex: 1 }}>
                    <T variant="bodySemi" style={{ fontSize: 14 }}>
                      {alt.name}
                    </T>
                    <T variant="micro" muted>
                      {alt.equipment} · {alt.muscleGroup}
                    </T>
                  </View>
                  <Ionicons name="swap-horizontal" size={16} color={colors.accent} />
                </Pressable>
              ))
            : null}
          {swapEx && swapOptions(swapEx, 4).length === 0 ? (
            <T variant="small" dim center style={{ paddingVertical: spacing.md }}>
              No similar exercise found.
            </T>
          ) : null}
        </View>
      </BottomSheet>

      {/* delete plan confirm — only the template is removed, history stays */}
      <BottomSheet visible={confirmDelete} onClose={() => setConfirmDelete(false)} title={plan ? `Delete ${plan.title}?` : 'Delete plan?'}>
        <T variant="small" dim style={{ fontSize: 13, marginBottom: spacing.lg }}>
          This only removes the plan from My Workouts — your logged workout history is untouched.
        </T>
        <Row gap={spacing.sm}>
          <Button label="Cancel" variant="outline" style={{ flex: 1 }} onPress={() => setConfirmDelete(false)} />
          <Button
            label="Delete"
            variant="danger"
            style={{ flex: 1 }}
            onPress={() => {
              if (plan) removePlan(plan.id);
              setConfirmDelete(false);
              toast('Plan deleted');
              router.back();
            }}
          />
        </Row>
      </BottomSheet>

      {/* edit sets sheet */}
      <BottomSheet visible={editing != null} onClose={() => setEditing(null)} title={edit ? EXERCISE_MAP[edit.exerciseId]?.name : ''}>
        {edit ? (
          <View>
            <Row align="space-between">
              <T variant="body" dim>
                Sets
              </T>
              <Stepper value={edit.sets} onChange={(v) => setDrafts((prev) => prev.map((d, i) => (i === editing ? { ...d, sets: v } : d)))} min={1} max={8} size="md" />
            </Row>
            <T variant="label" dim style={{ marginTop: spacing.lg, marginBottom: 10 }}>
              Target reps
            </T>
            <Row gap={8} wrap>
              {REP_PRESETS.map((r) => (
                <RepChip key={r} label={r} selected={edit.targetReps === r} onPress={() => setDrafts((prev) => prev.map((d, i) => (i === editing ? { ...d, targetReps: r } : d)))} />
              ))}
            </Row>
            <Button label="Done" full style={{ marginTop: spacing.xl }} onPress={() => setEditing(null)} />
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}

function RepChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.repChip, selected && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
      <T variant="smallSemi" style={{ color: selected ? colors.bg : colors.textDim }}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nameWrap: { marginTop: spacing.md },
  nameInput: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  addSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderBright,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginTop: spacing.lg,
  },
  addSearchBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDraft: { alignItems: 'center', paddingVertical: spacing.xxl },
  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  swapBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  ctaBar: {
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
  pickerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    flexShrink: 0,
  },
  pickerInput: { flex: 1, paddingVertical: 12, color: colors.text, fontSize: 15, fontFamily: 'Inter_400Regular' },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xs,
    borderRadius: radius.md,
  },
  pickerAdd: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
