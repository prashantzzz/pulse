import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressRing } from '../../../components/ring';
import { SetRow } from '../../../components/set-row';
import { T } from '../../../components/Text';
import { BottomSheet, toast } from '../../../components/misc';
import { Button, Row, Screen } from '../../../components/ui';
import { AnimatedChevron, CollapsibleContent } from '../../../components/collapsible';
import { EXERCISE_MAP } from '../../../data/exercises';
import { formatDuration } from '../../../lib/format';
import { bestForExercise, previousSet, exerciseInvolvesWeights, getDefaultSetValues } from '../../../lib/stats';
import { toUserWeight, formatWeight } from '../../../lib/units';
import type { ExerciseBest } from '../../../lib/stats';
import { useNow, usePulse } from '../../../store/useStore';
import { accentTint, colors, layout, radius, spacing, useAccent } from '../../../theme';
import { hapticsLight, hapticsMedium, hapticsSuccess } from '../../../lib/haptics';
import { syncActiveWorkoutNotification, dismissActiveWorkoutNotification } from '../../../lib/notifications';
import { playRestOverSound } from '../../../lib/sound';
import type { ActiveWorkout, Workout, WorkoutExercise } from '../../../types';

// ---------------------------------------------------------------------------
// Notification dedup helpers — MODULE LEVEL (persist across component remounts)
//
// The standard pattern for workout tracker apps: notifications are driven by
// actual store state mutations (via Zustand subscribe), never by React render
// cycles or component mount/unmount events. A module-level key prevents
// re-posting when the notification content hasn't changed (e.g. navigating
// back from the log screen, app foreground, screen remount via router.replace).
// ---------------------------------------------------------------------------

/** Opaque key of the last content posted to the live notification. */
let _lastNotifKey = '';

/** Build a string key from the fields that should trigger a notification update. */
function buildNotifKey(w: ActiveWorkout): string {
  const rt = w.restTimer;
  const isResting = !!rt && (rt.paused ? (rt.remainingSecWhenPaused ?? 0) : Math.max(0, Math.ceil((rt.targetEndTimeMs - Date.now()) / 1000))) > 0;
  const dSets = w.exercises.reduce((s, we) => s + we.sets.filter((x) => x.completed).length, 0);
  return `${w.id}|${w.title}|${w.paused}|${dSets}|${isResting}|${rt?.paused ?? false}`;
}

/** Compute and post the live workout notification. Only call when content has actually changed. */
function postWorkoutNotification(w: ActiveWorkout): void {
  syncActiveWorkoutNotification(w);
}

/**
 * Compact PR badge for an exercise card, e.g. "45kg × 4" — the heaviest
 * completed set on record. Bodyweight movements fall back to "12 reps".
 */
function formatPRBadge(best: ExerciseBest | null, unit: 'kg' | 'lbs'): string | null {
  if (!best) return null;
  if (best.maxWeight.weightKg <= 0) {
    return best.maxReps.reps > 0 ? `${best.maxReps.reps} reps` : null;
  }
  const userWeight = toUserWeight(best.maxWeight.weightKg, unit);
  return `${formatWeight(userWeight)}${unit} × ${best.maxWeight.reps}`;
}

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
  prLabel,
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
  /** Compact all-time PR for this exercise, e.g. "45kg × 4" */
  prLabel?: string | null;
  nextExerciseId?: string;
  nextIncompleteSetId?: string;
  onToggleExpand: () => void;
  onOpenExercise: () => void;
  onQuickComplete: (exerciseId: string, setId: string) => void;
}) {
  const router = useRouter();
  const weightUnit = usePulse((s) => s.weightUnit);

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
          {prLabel ? (
            <View style={[styles.prTag, { backgroundColor: colors.goldSoft }]}>
              <Ionicons name="trophy" size={9} color={colors.gold} />
              <T
                variant="micro"
                numberOfLines={1}
                style={{ color: colors.gold, fontSize: 9, maxWidth: 92 }}>
                {prLabel}
              </T>
            </View>
          ) : null}
          <View style={styles.chevronWrap}>
            <AnimatedChevron isOpen={isOpen} size={18} color={colors.textMuted} />
          </View>
        </Pressable>
      </View>

      <CollapsibleContent isOpen={isOpen} style={{ gap: 6, marginTop: spacing.sm }}>
        {(() => {
          const isBodyweight = !exerciseInvolvesWeights(we.exerciseId);
          return (
            <>
              <Row align="space-between" style={{ paddingHorizontal: 12, marginBottom: 2 }}>
                <T variant="micro" muted style={{ fontSize: 10, width: 46 }}>
                  SET
                </T>
                <T variant="micro" muted style={{ fontSize: 10, flex: 1, paddingHorizontal: 4 }}>
                  LAST TIME
                </T>
                <T variant="micro" muted style={{ fontSize: 10, width: 106, textAlign: 'right' }}>
                  {isBodyweight ? 'REPS' : `${weightUnit.toUpperCase()} × REPS`}
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
                  isBodyweight={isBodyweight}
                  weightUnit={weightUnit}
                  onTap={() => router.push(`/workout/${workout.id}/log?exercise=${we.exerciseId}&set=${s.id}` as never)}
                  onToggle={() => onQuickComplete(we.exerciseId, s.id)}
                />
              ))}
            </>
          );
        })()}
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
  const [scale] = useState(() => new Animated.Value(0.92));
  const [opacity] = useState(() => new Animated.Value(0));

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
  }, [visible, timer, scale, opacity]);

  if (!visible || !timer) return null;

  const pct = timer.totalSeconds > 0 ? Math.round((timer.secondsLeft / timer.totalSeconds) * 100) : 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onSkip}>
      <View style={styles.restModalOverlay}>
        {/* Dimmed Backdrop — intentionally non-interactive so accidental taps don't skip rest */}
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.restModalBackdrop,
            Platform.OS === 'web' && ({ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any),
          ]}
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

          {/* Circular Countdown Timer flanked on the left by stacked Pause and +30s buttons */}
          <Row align="center" gap={spacing.lg} style={{ justifyContent: 'center', marginVertical: spacing.md }}>
            {/* Left Action Column: Pause button & +30s button stacked vertically */}
            <View style={{ gap: spacing.sm, alignItems: 'center' }}>
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

              {/* +30s Add Time Button (placed directly below Pause button) */}
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
            </View>

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
  const profile = usePulse((s) => s.profile);
  const exerciseDefaults = usePulse((s) => s.exerciseDefaults);
  const weightUnit = usePulse((s) => s.weightUnit);
  const completeSet = usePulse((s) => s.completeSet);
  const patchSet = usePulse((s) => s.patchSet);
  const finishWorkout = usePulse((s) => s.finishWorkout);
  const cancelActiveWorkout = usePulse((s) => s.cancelActiveWorkout);
  const pauseActiveWorkout = usePulse((s) => s.pauseActiveWorkout);
  const resumeActiveWorkout = usePulse((s) => s.resumeActiveWorkout);
  const pauseRestTimer = usePulse((s) => s.pauseRestTimer);
  const resumeRestTimer = usePulse((s) => s.resumeRestTimer);
  const addRestSeconds = usePulse((s) => s.addRestSeconds);
  const clearRestTimer = usePulse((s) => s.clearRestTimer);
  const [expanded, setExpanded] = useState<string | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const now = useNow(1000);
  const isCompletingWorkoutRef = useRef(false);
  const navigation = useNavigation();

  // Show the workout options popup when the user tries to go back
  const handleBack = useCallback(() => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    setMenuOpen(true);
  }, [menuOpen]);

  // Handle hardware back press on Android (crucial for 3-button navigation on budget/older devices)
  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [handleBack]);

  // Handle gesture navigation / screen pop (Android edge-swipe & iOS swipe)
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Allow navigation when explicitly finishing or discarding the workout
      if (isCompletingWorkoutRef.current) return;
      // Otherwise intercept and show the options popup
      e.preventDefault();
      setMenuOpen(true);
    });
    return unsubscribe;
  }, [navigation]);

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

  // All-time PR badge per exercise, recomputed only when history/unit changes.
  const prLabels = useMemo(() => {
    const map = new Map<string, string | null>();
    if (!workout) return map;
    for (const we of workout.exercises) {
      if (map.has(we.exerciseId)) continue;
      map.set(we.exerciseId, formatPRBadge(bestForExercise(workouts, we.exerciseId), weightUnit));
    }
    return map;
  }, [workout, workouts, weightUnit]);

  // In-screen automatic adaptive rest timer derived from persistent store
  const storeRestTimer = workout?.restTimer ?? null;
  const secondsLeft = storeRestTimer
    ? storeRestTimer.paused
      ? (storeRestTimer.remainingSecWhenPaused ?? 0)
      : Math.max(0, Math.ceil((storeRestTimer.targetEndTimeMs - now) / 1000))
    : 0;

  // Auto-clear rest timer, play rest_over.mp3 chime once, and provide haptic feedback when it reaches 0
  const prevSecondsLeftRef = useRef(secondsLeft);
  useEffect(() => {
    if (storeRestTimer && !storeRestTimer.paused && secondsLeft <= 0 && prevSecondsLeftRef.current > 0) {
      playRestOverSound(storeRestTimer.targetEndTimeMs).catch(() => {});
      clearRestTimer();
      hapticsSuccess();
      // Don't tell the user to get ready for a next set if there are none left
      if (doneSets < totalSets) {
        toast('Rest complete — ready for next set!');
      }
    }
    prevSecondsLeftRef.current = secondsLeft;
  }, [secondsLeft, storeRestTimer, clearRestTimer, doneSets, totalSets]);

  // ---------------------------------------------------------------------------
  // Notification sync — Zustand subscribe + module-level dedup
  //
  // We subscribe to the store rather than using a useEffect with deps.
  // This fires ONLY on actual state mutations (set completed, pause, rest start)
  // — never on React renders, component remounts, or app foreground events.
  // The module-level _lastNotifKey prevents re-posting when nothing changed
  // (e.g. router.replace remounting this screen from the log screen, or the
  // user switching between apps without completing a set).
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Subscribe to Zustand store — fires on state mutations only, not renders
    const unsub = usePulse.subscribe((state) => {
      const curr = state.activeWorkout;
      if (!curr || curr.id !== id) return;
      const key = buildNotifKey(curr);
      if (key === _lastNotifKey) return; // Content unchanged — skip
      _lastNotifKey = key;
      postWorkoutNotification(curr);
    });

    // AppState: ensure notification is in the shade when user minimizes.
    // Only fires on 'background' — never on 'active' (app foreground) which
    // previously caused a redundant pop on every app open.
    const appStateSub = AppState.addEventListener('change', (state) => {
      const curr = usePulse.getState().activeWorkout;
      if (!curr || curr.id !== id) {
        dismissActiveWorkoutNotification();
        return;
      }
      if (state === 'background') {
        // Always post when going to background to guarantee the notification
        // exists in the shade. Reset the key so the next foreground transition
        // (which correctly does nothing) doesn't see a stale key.
        _lastNotifKey = buildNotifKey(curr);
        postWorkoutNotification(curr);
      }
    });

    return () => {
      unsub();
      appStateSub.remove();
      // Only dismiss if the workout is fully done or cancelled
      if (!usePulse.getState().activeWorkout) {
        _lastNotifKey = '';
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
  // "LAST TIME" previews never disagree with what the logger pre-fills.
  // Fills every set evenly across the exercise with fallback to remembered/plan defaults.
  const prevValues = new Map<string, { weightKg: number | null; reps: number | null }>();
  const userExperience = profile?.experience ?? 'Beginner';

  for (const we of workout.exercises) {
    const isWeighted = exerciseInvolvesWeights(we.exerciseId);
    const remembered = exerciseDefaults?.[we.exerciseId];

    for (const s of we.sets) {
      let p = previousSet(workouts, we.exerciseId, s.setIndex, workout.id);

      if (!p) {
        // Fallback cascade to guarantee all sets are populated and even:
        // 1. First set's resolved value in this exercise
        // 2. User's remembered defaults
        // 3. Current set's target / intelligent defaults
        const firstSetPrev = prevValues.get(`${we.exerciseId}:1`);
        if (firstSetPrev) {
          p = { weightKg: firstSetPrev.weightKg, reps: firstSetPrev.reps, date: '' };
        } else if (remembered) {
          p = {
            weightKg: isWeighted ? (remembered.weightKg ?? getDefaultSetValues(we.exerciseId, s.setIndex, userExperience, we.targetReps).weightKg) : null,
            reps: remembered.reps ?? 10,
            date: '',
          };
        } else {
          const defaults = getDefaultSetValues(we.exerciseId, s.setIndex, userExperience, we.targetReps);
          p = {
            weightKg: isWeighted ? (s.weightKg ?? defaults.weightKg) : null,
            reps: s.reps ?? defaults.reps,
            date: '',
          };
        }
      }

      let weightKg = p.weightKg;
      if (isWeighted && (weightKg == null || weightKg <= 0)) {
        weightKg = remembered?.weightKg ?? s.weightKg ?? getDefaultSetValues(we.exerciseId, s.setIndex, userExperience, we.targetReps).weightKg;
        if (weightKg == null || weightKg <= 0) {
          weightKg = 10;
        }
      } else if (!isWeighted) {
        weightKg = null;
      }

      prevValues.set(`${we.exerciseId}:${s.setIndex}`, {
        weightKg,
        reps: (p.reps != null && p.reps > 0) ? p.reps : (s.reps ?? 10),
      });
    }
  }

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
      clearRestTimer();
    } else {
      // Restriction: set N cannot be completed unless all prior sets in this exercise are complete
      const prevIncomplete = we.sets.slice(0, setIndex).find((s) => !s.completed);
      if (prevIncomplete) {
        hapticsLight();
        toast(`Please complete Set ${prevIncomplete.setIndex} first`);
        return;
      }

      // Check if all sets in the entire workout are now completed
      const remainingIncomplete = workout.exercises
        .flatMap((x) => x.sets)
        .filter((s) => !s.completed && s.id !== setId);

      if (remainingIncomplete.length === 0) {
        if (isCompletingWorkoutRef.current) return;
        isCompletingWorkoutRef.current = true;
        completeSet(exerciseId, setId);
        dismissActiveWorkoutNotification();
        const finished = finishWorkout();
        if (finished) {
          hapticsSuccess();
          setTimeout(() => {
            router.replace(`/workout/${finished.id}/summary`);
          }, 250);
          return;
        }
      }

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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: layout.screenPad,
          paddingBottom: storeRestTimer && secondsLeft > 0 ? 180 : 120,
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
              prLabel={prLabels.get(we.exerciseId) ?? null}
              nextExerciseId={nextExercise?.id}
              nextIncompleteSetId={nextIncompleteSet?.id}
              onToggleExpand={() => toggleExpanded(isOpen ? null : we.id)}
              onOpenExercise={() =>
                router.push({
                  pathname: '/exercise/[id]',
                  params: { id: we.exerciseId, fromRunning: '1' },
                } as never)
              }
              onQuickComplete={quickComplete}
            />
          );
        })}
      </ScrollView>

      {/* Animated Rest Popup Modal — Blocks touches to underlying sets with blurred backdrop */}
      <RestPopupModal
        visible={!!storeRestTimer && secondsLeft > 0}
        timer={storeRestTimer ? { ...storeRestTimer, secondsLeft } : null}
        onAddSeconds={(sec) => {
          hapticsLight();
          addRestSeconds(sec);
        }}
        onTogglePause={() => {
          hapticsLight();
          if (storeRestTimer?.paused) {
            resumeRestTimer();
          } else {
            pauseRestTimer();
          }
        }}
        onSkip={() => {
          hapticsMedium();
          clearRestTimer();
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
            if (isCompletingWorkoutRef.current) return;
            isCompletingWorkoutRef.current = true;
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
                isCompletingWorkoutRef.current = true;
                router.replace(`/workout/${finished.id}/summary`);
              }
            }}
          />
          <Pressable
            onPress={() => {
              setMenuOpen(false);
              dismissActiveWorkoutNotification();
              cancelActiveWorkout();
              isCompletingWorkoutRef.current = true;
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
  prTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: 112,
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
