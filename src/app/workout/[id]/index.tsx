import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  BackHandler,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressRing } from '../../../components/ring';
import { SetRow } from '../../../components/set-row';
import { T } from '../../../components/Text';
import { BottomSheet, toast } from '../../../components/misc';
import { Button, Row, Screen } from '../../../components/ui';
import { AnimatedChevron, CollapsibleContent, animateLayout } from '../../../components/collapsible';
import { EXERCISE_MAP } from '../../../data/exercises';
import { formatDuration } from '../../../lib/format';
import { getRecommendedRestSeconds, previousSet } from '../../../lib/stats';
import { useNow, usePulse } from '../../../store/useStore';
import { accentTint, colors, layout, radius, spacing, useAccent } from '../../../theme';
import { hapticsLight, hapticsMedium, hapticsSuccess } from '../../../lib/haptics';
import { presentActiveWorkoutNotification, dismissActiveWorkoutNotification } from '../../../lib/notifications';
import type { ActiveWorkout, Workout, WorkoutExercise } from '../../../types';

/**
 * Animated collapsible Exercise Card using global accordion animations.
 */
function ExerciseAccordionCard({
  we,
  workout,
  ex,
  isOpen,
  isNext,
  doneCount,
  totalCount,
  prevValues,
  nextExerciseId,
  nextIncompleteSetId,
  onToggleExpand,
  onOpenExercise,
  onQuickComplete,
}: {
  we: WorkoutExercise;
  workout: ActiveWorkout | Workout;
  ex: any;
  isOpen: boolean;
  isNext?: boolean;
  doneCount: number;
  totalCount: number;
  prevValues: Map<string, { weightKg: number | null; reps: number | null }>;
  nextExerciseId?: string;
  nextIncompleteSetId?: string;
  onToggleExpand: () => void;
  onOpenExercise: () => void;
  onQuickComplete: (exerciseId: string, setId: string) => void;
}) {
  const router = useRouter();

  return (
    <View style={[styles.exCard, isNext && { borderColor: `${colors.accent}66` }]}>
      <View style={styles.exHeader}>
        {/* Left zone: tapping opens exercise page when expanded, or expands when collapsed */}
        <Pressable
          onPress={() => {
            if (isOpen) {
              onOpenExercise();
            } else {
              onToggleExpand();
            }
          }}
          style={({ pressed }) => [styles.exHeaderLeft, pressed && { opacity: 0.75 }]}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={isOpen ? `View ${ex.name} details` : `Expand ${ex.name}`}>
          <View style={[styles.exNum, doneCount === totalCount && { backgroundColor: colors.accent }]}>
            <T variant="micro" style={{ color: doneCount === totalCount ? colors.bg : colors.accent }}>
              {doneCount}/{totalCount}
            </T>
          </View>
          <View style={{ flex: 1 }}>
            <T variant="bodySemi">{ex.name}</T>
            <T variant="micro" muted>
              {ex.equipment} · {we.targetReps} reps
            </T>
          </View>
        </Pressable>

        {/* Right zone: dedicated collapse/expand toggle */}
        <Pressable
          onPress={onToggleExpand}
          hitSlop={10}
          style={({ pressed }) => [styles.exHeaderRight, pressed && { opacity: 0.75 }]}
          accessibilityRole="button"
          accessibilityLabel={isOpen ? 'Collapse exercise' : 'Expand exercise'}>
          {isNext ? (
            <View style={[styles.nextTag, { backgroundColor: colors.accentSoft }]}>
              <T variant="micro" style={{ color: colors.accent, fontSize: 9 }}>
                NEXT
              </T>
            </View>
          ) : null}
          <View style={styles.chevronWrap}>
            <AnimatedChevron isOpen={isOpen} size={18} color={colors.textMuted} />
          </View>
        </Pressable>
      </View>

      <CollapsibleContent isOpen={isOpen} style={{ gap: 6, marginTop: spacing.sm }}>
        <Row align="space-between" style={{ paddingHorizontal: 12, marginBottom: 2 }}>
          <T variant="micro" muted style={{ fontSize: 10, width: 64 }}>
            SET
          </T>
          <T variant="micro" muted style={{ fontSize: 10, flex: 1, paddingHorizontal: 4 }}>
            LAST TIME
          </T>
          <T variant="micro" muted style={{ fontSize: 10, width: 106, textAlign: 'right' }}>
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
            isNext={!s.completed && we.id === nextExerciseId && s.id === nextIncompleteSetId}
            onTap={() => router.push(`/workout/${workout.id}/log?exercise=${we.exerciseId}&set=${s.id}` as never)}
            onToggle={() => onQuickComplete(we.exerciseId, s.id)}
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
      </CollapsibleContent>
    </View>
  );
}

/**
 * Adaptive Rest Timer Animated Popup Modal.
 * Renders an animated card with a deeply blurred backdrop, blocking touches to the underlying sets.
 * 100% synchronized on Web & Android.
 */
function RestPopupModal({
  visible,
  timer,
  onAddSeconds,
  onTogglePause,
  onSkip,
}: {
  visible: boolean;
  timer: {
    secondsLeft: number;
    totalSeconds: number;
    exerciseName: string;
    reason: string;
    paused: boolean;
    completedSetInfo?: string;
    nextSetInfo?: string;
  } | null;
  onAddSeconds: (sec: number) => void;
  onTogglePause: () => void;
  onSkip: () => void;
}) {
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && timer) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          damping: 20,
          stiffness: 260,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(0.92);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!visible || !timer) return null;

  const pct = timer.totalSeconds > 0 ? Math.round((timer.secondsLeft / timer.totalSeconds) * 100) : 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onSkip}>
      <View style={styles.restModalOverlay}>
        {/* Blurred & Dimmed Backdrop — Tap backdrop or button to dismiss */}
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            styles.restModalBackdrop,
            Platform.OS === 'web' && ({ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any),
          ]}
          onPress={onSkip}
        />

        {/* Animated Rest Popup Card */}
        <Animated.View
          style={[
            styles.restModalCard,
            Platform.OS === 'web' && ({ boxShadow: `0 20px 48px rgba(0,0,0,0.85), 0 0 32px ${colors.accent}33` } as any),
            {
              opacity,
              transform: [{ scale }],
            },
          ]}>
          <LinearGradient
            colors={[accentTint(colors.accent, 0.22), colors.surface2, colors.surface]}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />

          {/* Top Pill / Badge */}
          <Row align="space-between" style={{ marginBottom: spacing.md }}>
            <View style={[styles.restTag, { backgroundColor: colors.accentSoft }]}>
              <Row gap={5} align="center">
                <Ionicons name="timer" size={13} color={colors.accent} />
                <T variant="micro" style={{ color: colors.accent, fontWeight: '700', letterSpacing: 0.5 }}>
                  REST & RECOVERY
                </T>
              </Row>
            </View>
            <View style={[styles.restTierTag, { borderColor: `${colors.accent}40` }]}>
              <T variant="micro" muted style={{ fontSize: 10 }}>
                {timer.reason}
              </T>
            </View>
          </Row>

          {/* Header Info */}
          <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
            <T variant="h3" center numberOfLines={1}>
              {timer.exerciseName}
            </T>
            {timer.completedSetInfo ? (
              <T variant="small" dim center style={{ marginTop: 2, fontSize: 12 }}>
                Completed {timer.completedSetInfo}
              </T>
            ) : null}
          </View>

          {/* Hero Circular Countdown Timer flanked parallel by Pause and +30s buttons */}
          <Row align="center" style={{ justifyContent: 'space-between', marginVertical: spacing.md, paddingHorizontal: spacing.xs }}>
            {/* Pause / Resume Button */}
            <Pressable
              onPress={onTogglePause}
              style={({ pressed }) => [
                styles.restSideBtn,
                timer.paused && { backgroundColor: colors.accentSoft, borderColor: colors.accent },
                pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] },
              ]}
              hitSlop={8}>
              <Ionicons
                name={timer.paused ? 'play' : 'pause'}
                size={22}
                color={timer.paused ? colors.accent : colors.text}
              />
              <T variant="micro" muted style={{ fontSize: 10, marginTop: 2 }}>
                {timer.paused ? 'Resume' : 'Pause'}
              </T>
            </Pressable>

            {/* Circular Timer Ring */}
            <ProgressRing size={146} strokeWidth={8} progress={pct} color={colors.accent}>
              <View style={{ alignItems: 'center' }}>
                <T variant="numLg" accent style={{ fontSize: 34, fontVariant: ['tabular-nums'] }}>
                  {formatDuration(timer.secondsLeft)}
                </T>
                <T variant="micro" muted style={{ fontSize: 10, marginTop: -2 }}>
                  {timer.paused ? 'PAUSED' : 'REMAINING'}
                </T>
              </View>
            </ProgressRing>

            {/* +30s Add Time Button */}
            <Pressable
              onPress={() => onAddSeconds(30)}
              style={({ pressed }) => [
                styles.restSideBtn,
                { borderColor: `${colors.accent}4D` },
                pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] },
              ]}
              hitSlop={8}>
              <T variant="bodySemi" accent style={{ fontSize: 15 }}>
                +30s
              </T>
              <T variant="micro" muted style={{ fontSize: 10, marginTop: 1 }}>
                Add
              </T>
            </Pressable>
          </Row>

          {/* Up Next Preview Card */}
          {timer.nextSetInfo ? (
            <View style={styles.nextSetPreview}>
              <Row gap={8} align="center">
                <View style={[styles.nextDot, { backgroundColor: colors.accent }]} />
                <View style={{ flex: 1 }}>
                  <T variant="micro" muted style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Up Next
                  </T>
                  <T variant="smallSemi" numberOfLines={1} style={{ marginTop: 1, fontSize: 12.5 }}>
                    {timer.nextSetInfo}
                  </T>
                </View>
              </Row>
            </View>
          ) : null}

          {/* Primary CTA to Skip & Start Next Set */}
          <Button
            label="Skip Rest & Start Next Set"
            icon="play-forward"
            full
            size="md"
            onPress={onSkip}
            style={{ marginTop: spacing.md }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

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
  const [expanded, setExpanded] = useState<string | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const now = useNow(1000);

  // In-screen automatic adaptive rest timer state
  const [restTimer, setRestTimer] = useState<{
    secondsLeft: number;
    totalSeconds: number;
    exerciseName: string;
    reason: string;
    paused: boolean;
    completedSetInfo?: string;
    nextSetInfo?: string;
  } | null>(null);

  // Intercept phone hardware back button to show workout options sheet (Save/Pause/Discard) ONLY when focused
  useFocusEffect(
    useCallback(() => {
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
    }, [menuOpen])
  );

  const workout = activeWorkout && activeWorkout.id === id ? activeWorkout : workouts.find((w) => w.id === id);

  // while paused the elapsed timer is frozen at the pause moment
  const elapsedSec = workout
    ? workout.paused
      ? Math.max(0, Math.floor((new Date(workout.pausedAt ?? workout.startTime).getTime() - new Date(workout.startTime).getTime()) / 1000))
      : Math.max(0, Math.floor((now - new Date(workout.startTime).getTime()) / 1000))
    : 0;
  const totalSets = workout ? workout.exercises.reduce((s, we) => s + we.sets.length, 0) : 0;
  const doneSets = workout ? workout.exercises.reduce((s, we) => s + we.sets.filter((x) => x.completed).length, 0) : 0;
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  // Track completed sets count to detect when a new set was logged externally (e.g. from log.tsx)
  const prevDoneSetsRef = useRef(doneSets);
  useEffect(() => {
    if (doneSets > prevDoneSetsRef.current && totalSets > 0 && doneSets < totalSets) {
      // Find the last completed exercise to compute adaptive rest
      const lastEx = [...(workout?.exercises ?? [])].reverse().find((we) => we.sets.some((s) => s.completed));
      if (lastEx) {
        const ex = EXERCISE_MAP[lastEx.exerciseId];
        const rec = getRecommendedRestSeconds(lastEx.exerciseId);
        const lastSet = [...lastEx.sets].reverse().find((s) => s.completed);

        let nextInfo = '';
        for (const e of (workout?.exercises ?? [])) {
          const nextS = e.sets.find((s) => !s.completed);
          if (nextS) {
            const nextEx = EXERCISE_MAP[e.exerciseId];
            const p = previousSet(workouts, e.exerciseId, nextS.setIndex, workout?.id);
            const wVal = nextS.weightKg ?? p?.weightKg;
            const rVal = nextS.reps ?? p?.reps ?? e.targetReps;
            nextInfo = `Set ${nextS.setIndex} · ${nextEx?.name ?? 'Exercise'} (${wVal != null ? `${wVal} kg × ` : ''}${rVal} reps)`;
            break;
          }
        }

        setRestTimer({
          secondsLeft: rec.seconds,
          totalSeconds: rec.seconds,
          exerciseName: ex?.name ?? 'Exercise',
          reason: rec.label,
          paused: false,
          completedSetInfo: `Set ${lastSet?.setIndex ?? 1} (${lastSet?.weightKg != null ? `${lastSet.weightKg} kg × ` : ''}${lastSet?.reps ?? lastEx.targetReps ?? '–'} reps)`,
          nextSetInfo: nextInfo,
        });
      }
    } else if (doneSets >= totalSets && totalSets > 0) {
      setRestTimer(null);
    }
    prevDoneSetsRef.current = doneSets;
  }, [doneSets, totalSets]);

  // Live second-by-second countdown for the in-screen rest timer
  useEffect(() => {
    if (!restTimer || restTimer.paused || restTimer.secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setRestTimer((prev) => {
        if (!prev || prev.paused) return prev;
        if (prev.secondsLeft <= 1) {
          hapticsSuccess();
          toast('Rest complete — ready for next set!');
          return null;
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [Boolean(restTimer), restTimer?.paused]);

  // Keep live notification synced with current exercise and sets progress
  // ONLY for the active running workout (updates silently on set completion or pause/resume)
  useEffect(() => {
    if (!activeWorkout || activeWorkout.id !== id) {
      dismissActiveWorkoutNotification();
      return;
    }

    const currentEx = activeWorkout.exercises.find((we) => we.sets.some((s) => !s.completed)) ?? activeWorkout.exercises[activeWorkout.exercises.length - 1];
    const currentExName = currentEx ? EXERCISE_MAP[currentEx.exerciseId]?.name ?? 'Exercise' : 'Workout';
    const currentSetInfo = totalSets > 0 ? `Set ${doneSets + 1}/${totalSets} · ${currentExName}` : 'Workout in progress';

    presentActiveWorkoutNotification({
      workoutTitle: activeWorkout.title,
      currentSetInfo,
      isPaused: activeWorkout.paused,
      workoutId: activeWorkout.id,
    });
  }, [activeWorkout?.id, activeWorkout?.paused, activeWorkout?.title, doneSets, totalSets]);

  // Clean up notification on unmount if workout has completed or been discarded
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const curr = usePulse.getState().activeWorkout;
      if (!curr || curr.id !== id) {
        dismissActiveWorkoutNotification();
        return;
      }
      if (state === 'background' || state === 'active') {
        const cEx = curr.exercises.find((we) => we.sets.some((s) => !s.completed)) ?? curr.exercises[curr.exercises.length - 1];
        const cExName = cEx ? EXERCISE_MAP[cEx.exerciseId]?.name ?? 'Exercise' : 'Workout';
        const dSets = curr.exercises.reduce((s, we) => s + we.sets.filter((x) => x.completed).length, 0);
        const tSets = curr.exercises.reduce((s, we) => s + we.sets.length, 0);
        const cInfo = tSets > 0 ? `Set ${dSets + 1}/${tSets} · ${cExName}` : 'Workout in progress';

        presentActiveWorkoutNotification({
          workoutTitle: curr.title,
          currentSetInfo: cInfo,
          isPaused: curr.paused,
          workoutId: curr.id,
        });
      }
    });

    return () => {
      sub.remove();
      if (!usePulse.getState().activeWorkout) {
        dismissActiveWorkoutNotification();
      }
    };
  }, [id]);

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

  // expand first incomplete exercise by default on initial mount (when expanded is undefined)
  const defaultExpandedId = workout.exercises.find((we) => we.sets.some((s) => !s.completed))?.id ?? workout.exercises[0]?.id ?? null;
  const expandedId = expanded !== undefined ? expanded : defaultExpandedId;

  const toggleExpanded = (exerciseId: string | null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(exerciseId);
  };

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
    if (!we) return;
    const setIndex = we.sets.findIndex((s) => s.id === setId);
    if (setIndex === -1) return;
    const set = we.sets[setIndex];

    if (set?.completed) {
      // Unmarking a completed set: also unmark any subsequent sets in this exercise
      for (let i = setIndex; i < we.sets.length; i++) {
        if (we.sets[i].completed) {
          patchSet(exerciseId, we.sets[i].id, { completed: false, completedAt: null });
        }
      }
      toast('Set marked incomplete');
      setRestTimer(null);
    } else {
      // Restriction: set N cannot be completed unless all prior sets in this exercise are complete
      const prevIncomplete = we.sets.slice(0, setIndex).find((s) => !s.completed);
      if (prevIncomplete) {
        hapticsLight();
        toast(`Please complete Set ${prevIncomplete.setIndex} first`);
        return;
      }

      hapticsMedium();
      completeSet(exerciseId, setId);
      toast('Set complete');

      // Check if any incomplete sets remain in the workout
      const allDone = workout.exercises.every((e) =>
        e.sets.every((s) => (s.id === setId ? true : s.completed))
      );

      if (!allDone) {
        const ex = EXERCISE_MAP[exerciseId];
        const rec = getRecommendedRestSeconds(exerciseId);

        let nextInfo = '';
        for (const e of workout.exercises) {
          const nextS = e.sets.find((s) => (s.id === setId ? false : !s.completed));
          if (nextS) {
            const nextEx = EXERCISE_MAP[e.exerciseId];
            const p = previousSet(workouts, e.exerciseId, nextS.setIndex, workout.id);
            const wVal = nextS.weightKg ?? p?.weightKg;
            const rVal = nextS.reps ?? p?.reps ?? e.targetReps;
            nextInfo = `Set ${nextS.setIndex} · ${nextEx?.name ?? 'Exercise'} (${wVal != null ? `${wVal} kg × ` : ''}${rVal} reps)`;
            break;
          }
        }

        setRestTimer({
          secondsLeft: rec.seconds,
          totalSeconds: rec.seconds,
          exerciseName: ex?.name ?? 'Exercise',
          reason: rec.label,
          paused: false,
          completedSetInfo: `Set ${set?.setIndex ?? 1} (${set?.weightKg != null ? `${set.weightKg} kg × ` : ''}${set?.reps ?? we?.targetReps ?? '–'} reps)`,
          nextSetInfo: nextInfo,
        });
      } else {
        setRestTimer(null);
      }
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: layout.screenPad,
          paddingBottom: restTimer && restTimer.secondsLeft > 0 ? 180 : 120,
          paddingTop: layout.screenTopPad,
        }}>
        {workout.exercises.map((we) => {
          const ex = EXERCISE_MAP[we.exerciseId];
          if (!ex) return null;
          const done = we.sets.filter((s) => s.completed).length;
          const isOpen = expandedId === we.id;
          const isNext = nextExercise?.id === we.id;
          const nextIncompleteSet = we.sets.find((x) => !x.completed);

          return (
            <ExerciseAccordionCard
              key={we.id}
              we={we}
              workout={workout}
              ex={ex}
              isOpen={isOpen}
              isNext={isNext}
              doneCount={done}
              totalCount={we.sets.length}
              prevValues={prevValues}
              nextExerciseId={nextExercise?.id}
              nextIncompleteSetId={nextIncompleteSet?.id}
              onToggleExpand={() => toggleExpanded(isOpen ? null : we.id)}
              onOpenExercise={() => router.push(`/exercise/${we.exerciseId}` as never)}
              onQuickComplete={quickComplete}
            />
          );
        })}
      </ScrollView>

      {/* Animated Rest Popup Modal — Blocks touches to underlying sets with blurred backdrop */}
      <RestPopupModal
        visible={!!restTimer && restTimer.secondsLeft > 0}
        timer={restTimer}
        onAddSeconds={(sec) => {
          hapticsLight();
          setRestTimer((prev) =>
            prev
              ? {
                  ...prev,
                  secondsLeft: Math.max(5, prev.secondsLeft + sec),
                  totalSeconds: Math.max(5, prev.totalSeconds + (sec > 0 ? sec : 0)),
                }
              : null
          );
        }}
        onTogglePause={() => {
          hapticsLight();
          setRestTimer((prev) => (prev ? { ...prev, paused: !prev.paused } : null));
        }}
        onSkip={() => {
          hapticsMedium();
          setRestTimer(null);
          toast('Rest skipped — ready for next set!');
        }}
      />

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
  exHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  exHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  exHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2, paddingLeft: 6 },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  restModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  restModalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
  },
  restModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: `${colors.accent}4D`,
    padding: spacing.lg,
    backgroundColor: colors.surface2,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    overflow: 'hidden',
  },
  restTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  restTierTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: colors.surface3,
  },
  nextSetPreview: {
    backgroundColor: `${colors.surface3}B3`,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  nextDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  restSideBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface3,
    borderWidth: 1.5,
    borderColor: colors.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
