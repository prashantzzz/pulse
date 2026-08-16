import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { T } from '../components/Text';
import { BottomSheet, Stepper, toast } from '../components/misc';
import { ExerciseThumb } from '../components/muscle-icon';
import { Button, Icon, Row, Screen, ScreenHeader, Tag } from '../components/ui';
import { EXERCISE_MAP, EXERCISES, searchExercises } from '../data/exercises';
import { usePulse } from '../store/useStore';
import { colors, radius, spacing } from '../theme';

interface DraftExercise {
  exerciseId: string;
  sets: number;
  targetReps: string;
}

const REP_PRESETS = ['4-6', '6-10', '8-12', '10-15', '12-20'];

export default function BuilderScreen() {
  const router = useRouter();
  const { add } = useLocalSearchParams<{ add?: string }>();
  const saveBuiltWorkout = usePulse((s) => s.saveBuiltWorkout);
  const [title, setTitle] = useState('');
  const [drafts, setDrafts] = useState<DraftExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<number | null>(null);

  useEffect(() => {
    if (add && EXERCISE_MAP[add] && !drafts.some((d) => d.exerciseId === add)) {
      setDrafts((prev) => [...prev, { exerciseId: add, sets: 3, targetReps: '8-12' }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [add]);

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

  return (
    <View style={{ flex: 1 }}>
      <Screen scroll contentStyle={{ paddingBottom: 120 }}>
        <ScreenHeader title="New Workout" back right="checkmark" onRight={save} />

        <View style={{ paddingHorizontal: spacing.lg }}>
          <View style={styles.nameWrap}>
            <T variant="label" dim style={{ marginBottom: 6 }}>
              Workout Name
            </T>
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
                    <ExerciseThumb muscle={e.muscleGroup} size={46} />
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

      {/* exercise picker */}
      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Add exercise">
        <View style={styles.pickerSearch}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textMuted}
            style={styles.pickerInput}
          />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={{ gap: spacing.xs }}>
            {pickerResults.map((e) => (
              <Pressable key={e.id} onPress={() => addExercise(e.id)} style={styles.pickerRow}>
                <ExerciseThumb muscle={e.muscleGroup} size={38} />
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
          </View>
        </ScrollView>
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
                <Tag2 key={r} label={r} selected={edit.targetReps === r} onPress={() => setDrafts((prev) => prev.map((d, i) => (i === editing ? { ...d, targetReps: r } : d)))} />
              ))}
            </Row>
            <Button label="Done" full style={{ marginTop: spacing.xl }} onPress={() => setEditing(null)} />
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}

function Tag2({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
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
    marginBottom: spacing.sm,
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
