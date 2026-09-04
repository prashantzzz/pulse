import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { T } from '../components/Text';
import { BottomSheet, Stepper, toast } from '../components/misc';
import { ExerciseThumb } from '../components/muscle-icon';
import { Button, Card, Chip, Icon, Row, Screen, ScreenHeader, Tag } from '../components/ui';
import {
  EQUIPMENT_OPTIONS,
  EXERCISE_MAP,
  MUSCLE_GROUPS,
  searchExercises,
  swapOptions,
} from '../data/exercises';
import { usePulse } from '../store/useStore';
import { colors, radius, spacing, useAccent } from '../theme';
import { genUuid } from '../lib/uuid';
import type { MuscleGroup, WorkoutPlan } from '../types';

interface DraftExercise {
  exerciseId: string;
  sets: number;
  targetReps: string;
  targetWeightKg?: number | null;
}

const REP_PRESETS = ['4-6', '6-10', '8-12', '10-15', '12-20'];

export default function BuilderScreen() {
  useAccent();
  const router = useRouter();
  const { add, plan: planParam } = useLocalSearchParams<{ add?: string; plan?: string }>();

  const plans = usePulse((s) => s.plans);
  const addPlan = usePulse((s) => s.addPlan);
  const updatePlan = usePulse((s) => s.updatePlan);
  const removePlan = usePulse((s) => s.removePlan);

  const plan = planParam ? plans.find((p) => p.id === planParam) : undefined;

  // Form states with lazy initialization
  const [title, setTitle] = useState(() => (plan ? plan.title : ''));
  const [drafts, setDrafts] = useState<DraftExercise[]>(() => {
    if (plan) {
      return plan.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        sets: e.sets,
        targetReps: e.targetReps,
        targetWeightKg: e.targetWeightKg ?? null,
      }));
    }
    if (add && EXERCISE_MAP[add]) {
      return [{ exerciseId: add, sets: 3, targetReps: '8-12', targetWeightKg: null }];
    }
    return [];
  });

  const [initialTitle] = useState(() => (plan ? plan.title : ''));
  const [initialDraftsJson] = useState(() => {
    if (plan) {
      return JSON.stringify(
        plan.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          sets: e.sets,
          targetReps: e.targetReps,
          targetWeightKg: e.targetWeightKg ?? null,
        })),
      );
    }
    if (add && EXERCISE_MAP[add]) {
      return JSON.stringify([{ exerciseId: add, sets: 3, targetReps: '8-12', targetWeightKg: null }]);
    }
    return '[]';
  });

  // Library browser filter states
  const [query, setQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);

  // Modal states
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);

  // Track if any changes have been made
  const isDirty = useMemo(() => {
    return title !== initialTitle || JSON.stringify(drafts) !== initialDraftsJson;
  }, [title, drafts, initialTitle, initialDraftsJson]);

  // Handle in-app and hardware back press
  const handleBack = () => {
    if (filterOpen) {
      setFilterOpen(false);
      return true;
    }
    if (swapIndex != null) {
      setSwapIndex(null);
      return true;
    }
    if (confirmDelete) {
      setConfirmDelete(false);
      return true;
    }
    if (editingIndex != null) {
      setEditingIndex(null);
      return true;
    }
    if (discardModalOpen) {
      setDiscardModalOpen(false);
      return true;
    }

    if (isDirty) {
      setDiscardModalOpen(true);
      return true;
    }

    router.back();
    return true;
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => sub.remove();
  });

  const toggleExercise = (exerciseId: string) => {
    const existingIdx = drafts.findIndex((d) => d.exerciseId === exerciseId);
    if (existingIdx >= 0) {
      setDrafts((prev) => prev.filter((_, idx) => idx !== existingIdx));
      if (editingIndex === existingIdx) setEditingIndex(null);
      toast('Exercise removed from workout');
    } else {
      setDrafts((prev) => [...prev, { exerciseId, sets: 3, targetReps: '8-12' }]);
      toast('Exercise added to workout');
    }
  };

  const removeExercise = (index: number) => {
    setDrafts((prev) => prev.filter((_, idx) => idx !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  // Filter exercises (excluding cable and beginner-only as requested)
  const filterableEquipment = useMemo(
    () => EQUIPMENT_OPTIONS.filter((eq) => eq.toLowerCase() !== 'cable'),
    [],
  );

  const libraryResults = useMemo(() => {
    return searchExercises({
      query,
      muscles: selectedMuscle === 'All' ? undefined : [selectedMuscle],
      equipment: selectedEquipment.length > 0 ? selectedEquipment : undefined,
      difficulty: selectedDifficulty.length > 0 ? selectedDifficulty : undefined,
    });
  }, [query, selectedMuscle, selectedEquipment, selectedDifficulty]);

  const activeFiltersCount =
    (selectedMuscle !== 'All' ? 1 : 0) + selectedEquipment.length + selectedDifficulty.length;

  const clearLibraryFilters = () => {
    setSelectedMuscle('All');
    setSelectedEquipment([]);
    setSelectedDifficulty([]);
    setQuery('');
  };

  const save = () => {
    if (drafts.length === 0) {
      toast('Add at least one exercise to your plan');
      return;
    }

    const uniqueMuscles = [
      ...new Set(
        drafts
          .map((d) => EXERCISE_MAP[d.exerciseId]?.muscleGroup)
          .filter((m): m is MuscleGroup => Boolean(m)),
      ),
    ];

    if (plan) {
      // Update existing plan
      const updatedPlan: WorkoutPlan = {
        ...plan,
        title: title.trim() || plan.title,
        muscles: uniqueMuscles.length > 0 ? uniqueMuscles : plan.muscles,
        exercises: drafts.map((d) => ({
          exerciseId: d.exerciseId,
          sets: d.sets,
          targetReps: d.targetReps,
          targetWeightKg: d.targetWeightKg ?? null,
        })),
      };
      updatePlan(plan.id, updatedPlan);
      toast('Workout plan updated!');
      router.back();
      return;
    }

    // Append as a new plan day to 'My Plans'
    const newPlan: WorkoutPlan = {
      id: genUuid(),
      title: title.trim() || 'Custom Workout',
      emoji: '💪',
      muscles: uniqueMuscles.length > 0 ? uniqueMuscles : ['Chest', 'Back'],
      exercises: drafts.map((d) => ({
        exerciseId: d.exerciseId,
        sets: d.sets,
        targetReps: d.targetReps,
        targetWeightKg: d.targetWeightKg ?? null,
      })),
    };

    addPlan(newPlan);
    toast('Workout plan added to My Plans!');
    router.back();
  };

  const editingDraft = editingIndex != null ? drafts[editingIndex] : undefined;
  const swapEx = swapIndex != null ? EXERCISE_MAP[drafts[swapIndex]?.exerciseId] : undefined;

  return (
    <View style={{ flex: 1 }}>
      <Screen scroll contentStyle={{ paddingBottom: 60, paddingTop: spacing.sm }}>
        {/* Header */}
        <ScreenHeader
          title={plan ? 'Edit Plan' : 'Build Workout Plan'}
          subtitle={plan ? `${drafts.length} exercises` : 'Add exercises & customize'}
          back
          onBack={handleBack}
          right="checkmark"
          rightLabel="Save workout plan"
          onRight={save}
        />

        {/* Workout Details Card */}
        <View style={styles.topSection}>
          <View style={styles.nameHeader}>
            <Row align="space-between">
              <T variant="label" dim>
                WORKOUT NAME
              </T>
              {plan ? (
                <Pressable
                  onPress={() => setConfirmDelete(true)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${plan.title} plan`}>
                  <Row gap={4} align="center">
                    <Ionicons name="trash-outline" size={13} color={colors.red} />
                    <T variant="micro" style={{ color: colors.red, fontWeight: '600' }}>
                      Delete Plan
                    </T>
                  </Row>
                </Pressable>
              ) : null}
            </Row>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={plan ? plan.title : 'e.g. Upper Body Power'}
              placeholderTextColor={colors.textMuted}
              style={styles.nameInput}
            />
          </View>

          {/* Added Exercises List */}
          <View style={{ marginTop: spacing.md }}>
            <Row align="space-between" style={{ marginBottom: 6 }}>
              <T variant="label" accent>
                ADDED EXERCISES ({drafts.length})
              </T>
              {drafts.length > 0 ? (
                <T variant="micro" muted>
                  Tap sets to edit
                </T>
              ) : null}
            </Row>

            {drafts.length === 0 ? (
              <View style={styles.emptyDraftBox}>
                <Ionicons name="barbell-outline" size={28} color={colors.textMuted} />
                <T variant="small" dim center style={{ marginTop: 6 }}>
                  No exercises added yet. Tap <T variant="smallSemi" accent>+ Add</T> on any exercise below.
                </T>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {drafts.map((d, i) => {
                  const e = EXERCISE_MAP[d.exerciseId];
                  if (!e) return null;
                  return (
                    <View key={`${d.exerciseId}-${i}`} style={styles.draftRow}>
                      <ExerciseThumb muscle={e.muscleGroup} size={40} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Pressable
                          onPress={() => router.push(`/exercise/${d.exerciseId}` as never)}
                          hitSlop={4}>
                          <Row gap={4} align="center">
                            <T variant="bodySemi" numberOfLines={1} style={{ flex: 1, fontSize: 14 }}>
                              {i + 1}. {e.name}
                            </T>
                            <Ionicons name="information-circle-outline" size={14} color={colors.textDim} />
                          </Row>
                        </Pressable>
                        <Pressable onPress={() => setEditingIndex(i)} hitSlop={4}>
                          <Row gap={6} align="center">
                            <View style={styles.setsPill}>
                              <T variant="micro" accent style={{ fontWeight: '700' }}>
                                {d.sets} sets × {d.targetReps} reps{d.targetWeightKg != null ? ` · ${d.targetWeightKg} kg` : ''}
                              </T>
                              <Ionicons name="pencil" size={10} color={colors.accent} style={{ marginLeft: 3 }} />
                            </View>
                          </Row>
                        </Pressable>
                      </View>

                      <Pressable
                        onPress={() => setSwapIndex(i)}
                        hitSlop={8}
                        style={styles.iconActionBtn}
                        accessibilityLabel={`Swap ${e.name}`}>
                        <Ionicons name="swap-horizontal" size={18} color={colors.textDim} />
                      </Pressable>

                      <Pressable
                        onPress={() => removeExercise(i)}
                        hitSlop={8}
                        style={styles.iconActionBtn}
                        accessibilityLabel={`Remove ${e.name}`}>
                        <Ionicons name="close" size={18} color={colors.textMuted} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* Exercise Library Browser Section */}
        <View style={{ marginTop: spacing.md }}>
          <Row align="space-between" style={{ marginBottom: spacing.xs }}>
            <View>
              <T variant="h3">Exercise Library</T>
              <T variant="micro" dim style={{ marginTop: 1 }}>
                Tap row for exercise detail
              </T>
            </View>
            <Pressable
              onPress={() => setFilterOpen(true)}
              style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.8 }]}>
              <Ionicons name="options-outline" size={16} color={activeFiltersCount > 0 ? colors.accent : colors.textDim} />
              <T variant="micro" style={{ color: activeFiltersCount > 0 ? colors.accent : colors.textDim, fontWeight: '600' }}>
                Filter{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
              </T>
            </Pressable>
          </Row>

          {/* Search bar */}
          <View style={styles.searchWrap}>
            <Icon name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search exercise by name or muscle..."
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {/* Muscle category pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginVertical: spacing.xs }}
            contentContainerStyle={styles.pillRow}>
            <Chip
              label="All"
              selected={selectedMuscle === 'All'}
              onPress={() => setSelectedMuscle('All')}
            />
            {MUSCLE_GROUPS.map((m) => (
              <Chip
                key={m}
                label={m}
                selected={selectedMuscle === m}
                onPress={() => setSelectedMuscle(m)}
              />
            ))}
          </ScrollView>

          {/* Exercise Items List */}
          <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
            {libraryResults.map((ex) => {
              const isAdded = drafts.some((d) => d.exerciseId === ex.id);
              return (
                <View key={ex.id} style={styles.libraryRow}>
                  {/* Tapping the info section opens /exercise/${id} */}
                  <Pressable
                    onPress={() => router.push(`/exercise/${ex.id}` as never)}
                    style={styles.libraryRowInfo}>
                    <ExerciseThumb muscle={ex.muscleGroup} size={48} />
                    <View style={{ flex: 1, gap: 3 }}>
                      <T variant="bodySemi" numberOfLines={1}>
                        {ex.name}
                      </T>
                      <Row gap={6} align="center">
                        <Tag label={ex.equipment} color={colors.textDim} bg={colors.surface3} />
                        <T variant="micro" muted>
                          {ex.muscleGroup} · {ex.difficulty}
                        </T>
                      </Row>
                    </View>
                  </Pressable>

                  {/* Add / Added toggle button */}
                  <Pressable
                    onPress={() => toggleExercise(ex.id)}
                    style={({ pressed }) => [
                      styles.addToggleBtn,
                      isAdded ? styles.addToggleBtnActive : styles.addToggleBtnInactive,
                      pressed && { opacity: 0.8 },
                    ]}>
                    <Ionicons
                      name={isAdded ? 'checkmark-circle' : 'add'}
                      size={16}
                      color={isAdded ? colors.accent : colors.bg}
                    />
                    <T
                      variant="smallSemi"
                      style={{
                        color: isAdded ? colors.accent : colors.bg,
                        fontSize: 12,
                      }}>
                      {isAdded ? 'Added' : 'Add'}
                    </T>
                  </Pressable>
                </View>
              );
            })}

            {libraryResults.length === 0 ? (
              <Card style={{ padding: spacing.xl, alignItems: 'center', marginTop: spacing.md }}>
                <Ionicons name="search-outline" size={30} color={colors.textMuted} />
                <T variant="body" dim center style={{ marginTop: 8 }}>
                  No exercises matched your search or filters.
                </T>
                <Button
                  label="Clear Filters"
                  variant="outline"
                  size="sm"
                  style={{ marginTop: 12 }}
                  onPress={clearLibraryFilters}
                />
              </Card>
            ) : null}
          </View>
        </View>
      </Screen>

      {/* Filter BottomSheet */}
      <BottomSheet visible={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Exercises">
        <ScrollView showsVerticalScrollIndicator={false}>
          <T variant="label" dim style={{ marginBottom: 10 }}>
            Equipment
          </T>
          <View style={styles.filterChips}>
            {filterableEquipment.map((eq) => (
              <Chip
                key={eq}
                label={eq}
                selected={selectedEquipment.includes(eq)}
                onPress={() =>
                  setSelectedEquipment((prev) =>
                    prev.includes(eq) ? prev.filter((x) => x !== eq) : [...prev, eq],
                  )
                }
              />
            ))}
          </View>

          <T variant="label" dim style={{ marginTop: spacing.lg, marginBottom: 10 }}>
            Difficulty
          </T>
          <View style={styles.filterChips}>
            {['Beginner', 'Intermediate', 'Advanced'].map((d) => (
              <Chip
                key={d}
                label={d}
                selected={selectedDifficulty.includes(d)}
                onPress={() =>
                  setSelectedDifficulty((prev) =>
                    prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
                  )
                }
              />
            ))}
          </View>

          <Row style={{ marginTop: spacing.xl, gap: spacing.sm }}>
            <Pressable onPress={clearLibraryFilters} style={styles.clearBtn}>
              <T variant="bodySemi" dim>
                Clear All
              </T>
            </Pressable>
            <Pressable
              onPress={() => setFilterOpen(false)}
              style={[styles.applyBtn, { backgroundColor: colors.accent }]}>
              <T variant="bodySemi" style={{ color: colors.bg }}>
                Apply Filters ({activeFiltersCount})
              </T>
            </Pressable>
          </Row>
        </ScrollView>
      </BottomSheet>

      {/* Edit Sets & Reps BottomSheet */}
      <BottomSheet
        visible={editingIndex != null}
        onClose={() => setEditingIndex(null)}
        title={editingDraft ? EXERCISE_MAP[editingDraft.exerciseId]?.name : 'Edit Sets'}>
        {editingDraft ? (
          <View style={{ gap: spacing.md }}>
            <Row align="space-between">
              <View>
                <T variant="bodySemi">Target Sets</T>
                <T variant="micro" dim>
                  Number of working sets
                </T>
              </View>
              <Stepper
                value={editingDraft.sets}
                onChange={(v) =>
                  setDrafts((prev) =>
                    prev.map((d, i) => (i === editingIndex ? { ...d, sets: v } : d)),
                  )
                }
                min={1}
                max={8}
                size="md"
              />
            </Row>

            <Row align="space-between" style={{ paddingVertical: 4 }}>
              <View>
                <T variant="bodySemi">Target Weight</T>
                <T variant="micro" dim>
                  Optional starting weight (kg)
                </T>
              </View>
              <Stepper
                value={editingDraft.targetWeightKg ?? 0}
                onChange={(v) =>
                  setDrafts((prev) =>
                    prev.map((d, i) => (i === editingIndex ? { ...d, targetWeightKg: v > 0 ? v : null } : d)),
                  )
                }
                min={0}
                max={400}
                step={2.5}
                decimals={1}
                size="md"
              />
            </Row>

            <View>
              <T variant="label" dim style={{ marginBottom: 8 }}>
                TARGET REPETITIONS PRESETS
              </T>
              <Row gap={8} wrap>
                {REP_PRESETS.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() =>
                      setDrafts((prev) =>
                        prev.map((d, i) => (i === editingIndex ? { ...d, targetReps: r } : d)),
                      )
                    }
                    style={[
                      styles.repChip,
                      editingDraft.targetReps === r && {
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                      },
                    ]}>
                    <T
                      variant="smallSemi"
                      style={{
                        color: editingDraft.targetReps === r ? colors.bg : colors.textDim,
                      }}>
                      {r} reps
                    </T>
                  </Pressable>
                ))}
              </Row>
            </View>

            <Button
              label="Done"
              full
              style={{ marginTop: spacing.md }}
              onPress={() => setEditingIndex(null)}
            />
          </View>
        ) : null}
      </BottomSheet>

      {/* Swap Exercise Sheet */}
      <BottomSheet
        visible={swapIndex != null}
        onClose={() => setSwapIndex(null)}
        title={swapEx ? `Swap ${swapEx.name}` : 'Swap Exercise'}>
        <T variant="small" dim style={{ marginBottom: spacing.md }}>
          Replace with a similar exercise — sets and target reps stay preserved.
        </T>
        <View style={{ gap: spacing.xs }}>
          {swapEx
            ? swapOptions(swapEx, 5).map((alt) => (
                <Pressable
                  key={alt.id}
                  onPress={() => {
                    if (swapIndex != null) {
                      setDrafts((prev) =>
                        prev.map((d, i) =>
                          i === swapIndex ? { ...d, exerciseId: alt.id } : d,
                        ),
                      );
                    }
                    setSwapIndex(null);
                    toast(`Swapped to ${alt.name}`);
                  }}
                  style={styles.swapRow}>
                  <ExerciseThumb muscle={alt.muscleGroup} size={36} />
                  <View style={{ flex: 1 }}>
                    <T variant="bodySemi" style={{ fontSize: 14 }}>
                      {alt.name}
                    </T>
                    <T variant="micro" muted>
                      {alt.equipment} · {alt.muscleGroup}
                    </T>
                  </View>
                  <Ionicons name="swap-horizontal" size={18} color={colors.accent} />
                </Pressable>
              ))
            : null}
          {swapEx && swapOptions(swapEx, 5).length === 0 ? (
            <T variant="small" dim center style={{ paddingVertical: spacing.md }}>
              No similar exercise found.
            </T>
          ) : null}
        </View>
      </BottomSheet>

      {/* Delete Plan Confirm BottomSheet */}
      <BottomSheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={plan ? `Delete ${plan.title}?` : 'Delete plan?'}>
        <T variant="small" dim style={{ fontSize: 13, marginBottom: spacing.lg }}>
          This only removes the plan from My Workouts — your logged workout history is untouched.
        </T>
        <Row gap={spacing.sm}>
          <Button
            label="Cancel"
            variant="outline"
            style={{ flex: 1 }}
            onPress={() => setConfirmDelete(false)}
          />
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

      {/* Discard Draft Warning BottomSheet */}
      <BottomSheet
        visible={discardModalOpen}
        onClose={() => setDiscardModalOpen(false)}
        title="Discard workout draft?">
        <View style={{ gap: spacing.md }}>
          <T variant="small" dim style={{ lineHeight: 20 }}>
            You have unsaved changes in this workout plan. Discarding will lose all unsaved edits.
          </T>
          <Row gap={10} style={{ marginTop: spacing.sm }}>
            <Button
              label="Keep Editing"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => setDiscardModalOpen(false)}
            />
            <Button
              label="Discard"
              variant="danger"
              style={{ flex: 1 }}
              onPress={() => {
                setDiscardModalOpen(false);
                router.back();
              }}
            />
          </Row>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  topSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  nameHeader: {
    gap: 6,
  },
  nameInput: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderBright,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  emptyDraftBox: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  setsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 14.5,
    fontFamily: 'Inter_400Regular',
  },
  pillRow: {
    gap: 6,
    paddingVertical: 4,
  },
  libraryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  libraryRowInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  addToggleBtnActive: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  addToggleBtnInactive: {
    backgroundColor: colors.accent,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clearBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surface3,
  },
  applyBtn: {
    flex: 2,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: radius.pill,
  },
  repChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
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
});
