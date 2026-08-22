import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressRing } from '../../../components/ring';
import { SetRow } from '../../../components/set-row';
import { T } from '../../../components/Text';
import { BottomSheet, toast } from '../../../components/misc';
import { Button, Row, Screen } from '../../../components/ui';
import { EXERCISE_MAP } from '../../../data/exercises';
import { formatDuration } from '../../../lib/format';
import { previousSet } from '../../../lib/stats';
import { useNow, usePulse } from '../../../store/useStore';
import { colors, layout, radius, spacing, useAccent } from '../../../theme';
import { hapticsLight, hapticsMedium, hapticsSuccess } from '../../../lib/haptics';
import { presentActiveWorkoutNotification, dismissActiveWorkoutNotification } from '../../../lib/notifications';

export default function ActiveWorkoutScreen() {
  useAccent();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const activeWorkout = usePulse((s) => s.activeWorkout);
  const workouts = usePulse((s) => s.workouts);
  const completeSet = usePulse((s) => s.completeSet);
  const patchSet = usePulse((s) => s.patchSet);
  const finishWorkout = usePulse((s) => s.finishWorkout);
  const cancelActiveWorkout = usePulse((s) => s.cancelActiveWorkout);
  const pauseActiveWorkout = usePulse((s) => s.pauseActiveWorkout);
  const resumeActiveWorkout = usePulse((s) => s.resumeActiveWorkout);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const now = useNow(1000);

  // Intercept phone hardware back button to show workout options sheet (Save/Pause/Discard)
  useEffect(() => {
    const onBackPress = () => {
      if (menuOpen) {
        setMenuOpen(false);
        return true;
      }
      setMenuOpen(true);
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [menuOpen]);

  const workout = activeWorkout ?? workouts.find((w) => w.id === id);

  // while paused the elapsed timer is frozen at the pause moment
  const elapsedSec = workout
    ? workout.paused
      ? Math.max(0, Math.floor((new Date(workout.pausedAt ?? workout.startTime).getTime() - new Date(workout.startTime).getTime()) / 1000))
      : Math.max(0, Math.floor((now - new Date(workout.startTime).getTime()) / 1000))
    : 0;
  const totalSets = workout ? workout.exercises.reduce((s, we) => s + we.sets.length, 0) : 0;
  const doneSets = workout ? workout.exercises.reduce((s, we) => s + we.sets.filter((x) => x.completed).length, 0) : 0;
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  const elapsedInterval = Math.floor(elapsedSec / 15);

  // Keep live notification synced with current exercise, sets progress, and duration
  useEffect(() => {
    if (!workout) {
      dismissActiveWorkoutNotification();
      return;
    }

    const currentEx = workout.exercises.find((we) => we.sets.some((s) => !s.completed)) ?? workout.exercises[workout.exercises.length - 1];
    const currentExName = currentEx ? EXERCISE_MAP[currentEx.exerciseId]?.name ?? 'Exercise' : 'Workout';
    const currentSetInfo = totalSets > 0 ? `Set ${doneSets + 1}/${totalSets} · ${currentExName}` : 'Workout in progress';

    presentActiveWorkoutNotification({
      workoutTitle: workout.title,
      currentSetInfo,
      durationText: formatDuration(elapsedSec),
      isPaused: workout.paused,
      workoutId: workout.id,
    });
  }, [workout, doneSets, totalSets, elapsedSec, elapsedInterval]);

  // Clean up notification on unmount if workout has completed or been discarded
  useEffect(() => {
    return () => {
      if (!usePulse.getState().activeWorkout) {
        dismissActiveWorkoutNotification();
      }
    };
  }, []);

  if (!workout) {
    return (
      <Screen>
        <View style={{ padding: spacing.lg, alignItems: 'center', gap: spacing.md, marginTop: 60 }}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
          <T variant="body" dim center>
            No active workout found.
          </T>
          <Button label="Go Home" onPress={() => router.replace('/(tabs)/home' as never)} />
        </View>
      </Screen>
    );
  }

  // expand first incomplete exercise by default
  const expandedId = expanded ?? workout.exercises.find((we) => we.sets.some((s) => !s.completed))?.id ?? workout.exercises[0]?.id;

  // historical values per exercise+set — same lookup as the set logger, so the
  // "LAST TIME" previews never disagree with what the logger pre-fills
  const prevValues = new Map<string, { weightKg: number | null; reps: number | null }>();
  for (const we of workout.exercises) {
    for (const s of we.sets) {
      const p = previousSet(workouts, we.exerciseId, s.setIndex, workout.id);
      if (p) prevValues.set(`${we.exerciseId}:${s.setIndex}`, { weightKg: p.weightKg, reps: p.reps });
    }
  }

  const lastDoneSet = [...workout.exercises].reverse().find((we) => we.sets.some((s) => s.completed));
  const nextExercise = workout.exercises.find((we) => we.sets.some((s) => !s.completed));

  // The plus button toggles completion so an accidental tap can be undone.
  const quickComplete = (exerciseId: string, setId: string) => {
    const we = workout.exercises.find((w) => w.exerciseId === exerciseId);
    const set = we?.sets.find((s) => s.id === setId);
    if (set?.completed) {
      patchSet(exerciseId, setId, { completed: false, completedAt: null });
      toast('Set marked incomplete');
    } else {
      hapticsMedium();
      completeSet(exerciseId, setId);
      toast('Set complete');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => setMenuOpen(true)}
          style={styles.headerBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Workout options">
          <Ionicons name="close" size={20} color={colors.textDim} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T variant="bodySemi">{workout.title}</T>
          <Row gap={6}>
            <T variant="numSm" accent style={{ fontVariant: ['tabular-nums'] }}>
              {formatDuration(elapsedSec)}
            </T>
            {workout.paused ? (
              <View style={[styles.pausedBadge, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="pause" size={10} color={colors.accent} />
                <T variant="micro" style={{ color: colors.accent, fontSize: 9 }}>
                  PAUSED
                </T>
              </View>
            ) : null}
          </Row>
        </View>
        <Row gap={8}>
          <Pressable
            onPress={() => {
              hapticsLight();
              if (workout.paused) resumeActiveWorkout();
              else pauseActiveWorkout();
            }}
            style={({ pressed }) => [
              styles.headerBtn,
              workout.paused && { backgroundColor: colors.accentSoft, borderColor: colors.accent },
              pressed && { opacity: 0.8 },
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={workout.paused ? 'Resume workout timer' : 'Pause workout timer'}>
            <Ionicons
              name={workout.paused ? 'play' : 'pause'}
              size={18}
              color={workout.paused ? colors.accent : colors.textDim}
            />
          </Pressable>
          <Pressable onPress={() => router.push('/gym-mode' as never)} style={styles.headerBtn} hitSlop={8}>
            <Ionicons name="scan-outline" size={20} color={colors.textDim} />
          </Pressable>
        </Row>
      </View>

      {/* progress */}
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors.accent }]} />
        </View>
        <T variant="micro" muted style={{ fontSize: 10 }}>
          {pct}%
        </T>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: layout.screenPad, paddingBottom: 150, paddingTop: layout.screenTopPad }}>
        {workout.exercises.map((we) => {
          const ex = EXERCISE_MAP[we.exerciseId];
          if (!ex) return null;
          const done = we.sets.filter((s) => s.completed).length;
          const isOpen = expandedId === we.id;
          const isNext = nextExercise?.id === we.id;
          return (
            <View key={we.id} style={[styles.exCard, isNext && { borderColor: `${colors.accent}66` }]}>
              <Pressable onPress={() => setExpanded(isOpen ? null : we.id)} style={styles.exHeader}>
                <View style={styles.exHeaderLeft}>
                  <View style={[styles.exNum, done === we.sets.length && { backgroundColor: colors.accent }]}>
                    <T variant="micro" style={{ color: done === we.sets.length ? colors.bg : colors.accent }}>
                      {done}/{we.sets.length}
                    </T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T variant="bodySemi">{ex.name}</T>
                    <T variant="micro" muted>
                      {ex.equipment} · {we.targetReps} reps
                    </T>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Pressable
                    onPress={() => router.push(`/exercise/${we.exerciseId}` as never)}
                    hitSlop={8}
                    style={styles.formLink}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
                  </Pressable>
                  {isNext ? (
                    <View style={[styles.nextTag, { backgroundColor: colors.accentSoft }]}>
                      <T variant="micro" style={{ color: colors.accent, fontSize: 9 }}>
                        NEXT
                      </T>
                    </View>
                  ) : null}
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                </View>
              </Pressable>

              {isOpen ? (
                <View style={{ gap: 6, marginTop: spacing.sm }}>
                  <Row align="space-between" style={{ paddingHorizontal: 4, marginBottom: 2 }}>
                    <T variant="micro" muted style={{ fontSize: 10, width: 64 }}>
                      SET
                    </T>
                    <T variant="micro" muted style={{ fontSize: 10, flex: 1 }}>
                      LAST TIME
                    </T>
                    <T variant="micro" muted style={{ fontSize: 10, width: 84, textAlign: 'right' }}>
                      KG × REPS
                    </T>
                  </Row>
                  {we.sets.map((s) => (
                    <SetRow
                      key={s.id}
                      index={s.setIndex}
                      setType={s.setType}
                      weight={s.weightKg}
                      reps={s.reps}
                      prev={prevValues.get(`${we.exerciseId}:${s.setIndex}`)}
                      completed={s.completed}
                      isNext={!s.completed && we.id === nextExercise?.id && we.sets.find((x) => !x.completed)?.id === s.id}
                      onTap={() => router.push(`/workout/${workout.id}/log?exercise=${we.exerciseId}&set=${s.id}` as never)}
                      onToggle={() => quickComplete(we.exerciseId, s.id)}
                    />
                  ))}
                  {we.notes ? (
                    <Row gap={6} style={{ marginTop: 4 }}>
                      <Ionicons name="document-text-outline" size={13} color={colors.textMuted} />
                      <T variant="micro" muted style={{ flex: 1 }}>
                        {we.notes}
                      </T>
                    </Row>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}

        {/* last-set rest CTA */}
        {lastDoneSet ? (
          <View style={[styles.restCta, { borderColor: `${colors.accent}40` }]}>
            <Row align="space-between">
              <Row gap={10}>
                <View style={[styles.restIcon, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name="timer-outline" size={18} color={colors.accent} />
                </View>
                <View>
                  <T variant="bodySemi" style={{ fontSize: 14 }}>
                    Rest between sets
                  </T>
                  <T variant="small" dim style={{ fontSize: 12 }}>
                    Breathe, then hit the next one.
                  </T>
                </View>
              </Row>
              <Button
                label="Start Rest"
                size="sm"
                onPress={() => {
                  const next = nextExercise;
                  router.push(`/workout/${workout.id}/rest?sec=90${next ? `&next=${encodeURIComponent(EXERCISE_MAP[next.exerciseId]?.name ?? '')}` : ''}` as never);
                }}
              />
            </Row>
          </View>
        ) : null}
      </ScrollView>

      {/* bottom bar */}
      <View style={styles.bottomBar}>
        <ProgressRing size={44} strokeWidth={5} progress={pct} color={pct === 100 ? colors.success : colors.accent}>
          <T variant="micro" style={{ fontSize: 9, color: pct === 100 ? colors.success : colors.text }}>
            {pct}%
          </T>
        </ProgressRing>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <T variant="bodySemi" style={{ fontSize: 14 }}>
            {doneSets} of {totalSets} sets
          </T>
          <T variant="micro" muted style={{ marginTop: 2 }}>
            {workout.paused ? 'Paused' : `${formatDuration(elapsedSec)} elapsed`}
          </T>
        </View>
        <Button
          label={pct === 100 ? 'Complete' : 'Finish Workout'}
          size="md"
          onPress={() => {
            dismissActiveWorkoutNotification();
            const finished = finishWorkout();
            if (finished) {
              hapticsSuccess();
              router.replace(`/workout/${finished.id}/summary`);
            }
          }}
        />
      </View>

      {/* back / menu sheet — pausing, saving, or discarding is always explicit */}
      <BottomSheet visible={menuOpen} onClose={() => setMenuOpen(false)} title={workout.paused ? 'Workout paused' : 'Workout options'}>
        <View style={{ gap: spacing.sm }}>
          <Button
            label={workout.paused ? 'Resume Workout' : 'Pause Workout'}
            icon={workout.paused ? 'play' : 'pause'}
            variant="outline"
            full
            onPress={() => {
              setMenuOpen(false);
              if (workout.paused) resumeActiveWorkout();
              else pauseActiveWorkout();
            }}
          />
          <Button
            label="Save & Finish"
            icon="checkmark"
            full
            onPress={() => {
              setMenuOpen(false);
              dismissActiveWorkoutNotification();
              const finished = finishWorkout();
              if (finished) {
                hapticsSuccess();
                router.replace(`/workout/${finished.id}/summary`);
              }
            }}
          />
          <Pressable
            onPress={() => {
              setMenuOpen(false);
              dismissActiveWorkoutNotification();
              cancelActiveWorkout();
              router.replace('/(tabs)/home' as never);
            }}
            hitSlop={6}
            style={{ paddingVertical: spacing.sm, alignItems: 'center' }}>
            <T variant="smallMedium" center style={{ color: colors.red }}>
              Discard workout
            </T>
          </Pressable>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  formLink: { padding: 4, marginRight: -2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pauseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surface3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  exCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  exHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  exNum: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  restCta: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  restIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 22,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
