import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { Slug } from 'react-native-body-highlighter';

import { MuscleLegend, MuscleMap } from '../muscle-map';
import { T } from '../Text';
import { ExerciseThumb } from '../muscle-icon';
import { Button, Card, Row, Screen, Section, Tag } from '../ui';
import { ANATOMY_LABEL_MAP, exercisesForSlug } from '../../data/exercises';
import { getTrainingEfficiency, volumeByMuscle, volumeBySlug, workoutsInLastDays } from '../../lib/stats';
import { colors, radius, spacing } from '../../theme';
import type { BodyMeasurement, MuscleGroup, MuscleSlug, UserProfile, Workout } from '../../types';
import type { Exercise } from '../../types';
import { progressStyles, TF_LABELS, TimeframeChips, type ProgressTimeframe } from './shared';

const ALL_MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Calves', 'Glutes', 'Forearms'];

const ANATOMY_LABELS: Partial<Record<Slug, string>> = {
  'upper-back': 'Lats & Upper Back',
  trapezius: 'Trapezius (Traps)',
  'lower-back': 'Lower Back (Lumbar)',
  deltoids: 'Shoulders (Deltoids)',
  chest: 'Chest',
  biceps: 'Biceps',
  triceps: 'Triceps',
  abs: 'Abs (Core)',
  obliques: 'Obliques',
  forearm: 'Forearms',
  quadriceps: 'Quadriceps',
  adductors: 'Adductors',
  hamstring: 'Hamstrings',
  gluteal: 'Glutes',
  calves: 'Calves',
};

const DAYS: Record<ProgressTimeframe, number> = { '7D': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };

/**
 * Body tab: muscle heatmap (tap a muscle for training volume detail) with
 * its own timeframe control and the latest body measurements.
 */
export function BodyView({
  workouts,
  measurements,
  profile,
  tf = '3M',
  onTimeframeChange,
}: {
  workouts: Workout[];
  measurements: BodyMeasurement[];
  profile: UserProfile | null;
  tf?: ProgressTimeframe;
  onTimeframeChange?: (t: ProgressTimeframe) => void;
}) {
  const router = useRouter();
  const [localTf, setLocalTf] = useState<ProgressTimeframe>('3M');
  const [selMuscle, setSelMuscle] = useState<MuscleGroup | null>(null);
  const [selSlug, setSelSlug] = useState<Slug | null>(null);
  const [exerciseModalSlug, setExerciseModalSlug] = useState<string | null>(null);

  const activeTf = tf ?? localTf;
  const handleTfChange = onTimeframeChange ?? setLocalTf;

  const days = DAYS[activeTf];
  const weeks = Math.max(1, Math.round(days / 7));

  // Current timeframe volume and sets
  const volByMuscle = volumeByMuscle(workouts, days);
  const volBySlug = volumeBySlug(workouts, days);

  // Previous timeframe of same length for truthful delta comparison
  const cutoffCurrent = Date.now() - days * 86400000;
  const cutoffPrev = Date.now() - days * 2 * 86400000;
  const prevWorkouts = workouts.filter((w) => {
    const t = new Date(w.endTime).getTime();
    return t >= cutoffPrev && t < cutoffCurrent;
  });
  const prevByMuscle = volumeByMuscle(prevWorkouts);
  const prevBySlug = volumeBySlug(prevWorkouts);

  // Intensity heatmap calculation based on weekly volume rate over the chosen timeframe
  const intensity: Record<string, number> = {};
  for (const v of volByMuscle) {
    const weeklySets = v.sets / weeks;
    intensity[v.muscle] = weeklySets < 3 ? 0.25 : weeklySets < 6 ? 0.5 : 1;
  }
  for (const s of volBySlug) {
    const weeklySets = s.sets / weeks;
    intensity[s.slug] = weeklySets < 3 ? 0.25 : weeklySets < 6 ? 0.5 : 1;
  }
  for (const m of ALL_MUSCLES) {
    if (intensity[m] == null) intensity[m] = 0.25; // never logged → undertrained
  }

  // Slug-level specific metrics with group-level fallback
  const slugDetail = selSlug ? volBySlug.find((v) => v.slug === (selSlug as MuscleSlug)) : null;
  const slugPrev = selSlug ? prevBySlug.find((v) => v.slug === (selSlug as MuscleSlug)) : null;

  const muscleDetail = selMuscle ? volByMuscle.find((v) => v.muscle === selMuscle) : null;
  const musclePrev = selMuscle ? prevByMuscle.find((v) => v.muscle === selMuscle) : null;

  const activeSets = selSlug && slugDetail ? slugDetail.sets : (muscleDetail?.sets ?? 0);
  const activeVolume = selSlug && slugDetail ? slugDetail.volume : (muscleDetail?.volume ?? 0);
  const avgWeeklySets = activeSets / weeks;

  const efficiency = getTrainingEfficiency(avgWeeklySets);
  const efficiencyColor = efficiency.level === 3 ? colors.zoneWell : efficiency.level === 2 ? colors.zoneMod : colors.zoneLow;
  const efficiencyBg = efficiency.level === 3 ? 'rgba(34, 197, 94, 0.15)' : efficiency.level === 2 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)';

  const prevVol = selSlug && slugPrev ? slugPrev.volume : (musclePrev?.volume ?? 0);
  const musclePct =
    activeVolume > 0 && prevVol > 0
      ? Math.round(((activeVolume - prevVol) / prevVol) * 100)
      : 0;

  const displayTitle = selSlug && ANATOMY_LABELS[selSlug] ? ANATOMY_LABELS[selSlug] : selMuscle;
  const last = measurements[measurements.length - 1];

  const setsLabel = activeTf === '7D' ? 'Sets this week' : activeTf === '1M' ? 'Sets this month' : `Sets (${activeTf})`;

  // Exercises for the muscle exercise modal
  const modalExercises: Exercise[] = exerciseModalSlug
    ? exercisesForSlug(exerciseModalSlug).sort((a, b) => {
        const aPrimary = (a.targetSlugs ?? []).includes(exerciseModalSlug as any) ? 0 : 1;
        const bPrimary = (b.targetSlugs ?? []).includes(exerciseModalSlug as any) ? 0 : 1;
        return aPrimary - bPrimary;
      })
    : [];
  const modalTitle = exerciseModalSlug
    ? `Exercises for ${ANATOMY_LABELS[exerciseModalSlug as Slug] ?? ANATOMY_LABEL_MAP[exerciseModalSlug] ?? exerciseModalSlug}`
    : '';

  // Button label for "exercises for this muscle"
  const exerciseBtnLabel = selSlug
    ? `Exercises for ${ANATOMY_LABELS[selSlug] ?? ANATOMY_LABEL_MAP[selSlug as string] ?? selSlug}`
    : selMuscle
    ? `Exercises for ${selMuscle}`
    : null;

  return (
    <>
      <TimeframeChips tf={activeTf} onChange={handleTfChange} />

      <Card style={{ padding: spacing.lg }}>
        <Row align="space-between">
          <View>
            <T variant="h3">Muscle Heatmap</T>
            <T variant="small" dim style={{ fontSize: 12, marginTop: 2 }}>
              Tap a muscle for details
            </T>
          </View>
          <T variant="small" dim style={{ fontSize: 12 }}>
            {TF_LABELS[activeTf]}
          </T>
        </Row>
        <View style={{ marginTop: spacing.md }}>
          <MuscleMap
            intensity={intensity}
            selected={selMuscle}
            selectedSlug={selSlug}
            onSelect={setSelMuscle}
            onSelectSlug={(slug, group) => {
              setSelSlug(slug);
              setSelMuscle(group);
            }}
            height={280}
            gender={profile?.gender ?? 'male'}
          />
        </View>
        <View style={{ marginTop: spacing.md, alignItems: 'center' }}>
          <MuscleLegend />
        </View>
      </Card>

      {selMuscle ? (
        <Card gradient="charcoal" style={{ padding: spacing.lg }}>
          <Row align="space-between">
            <T variant="h3">{displayTitle}</T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[progressStyles.deltaBadge, { backgroundColor: efficiencyBg, borderRadius: radius.pill }]}>
                <T variant="micro" style={{ color: efficiencyColor, fontWeight: '700' }}>
                  {efficiency.status}
                </T>
              </View>
              {musclePct !== 0 ? (
                <View style={[progressStyles.deltaBadge, { backgroundColor: musclePct > 0 ? colors.accentSoft : colors.dangerSoft }]}>
                  <T variant="micro" style={{ color: musclePct > 0 ? colors.accent : colors.red }}>
                    {musclePct > 0 ? '+' : ''}
                    {musclePct}%
                  </T>
                </View>
              ) : null}
            </View>
          </Row>
          <Row align="space-between" style={{ marginTop: spacing.md }}>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <T variant="numSm">{activeSets}</T>
              <T variant="micro" muted>
                {setsLabel}
              </T>
            </View>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <T variant="numSm" accent>
                {activeVolume.toLocaleString()}
              </T>
              <T variant="micro" muted>
                Volume kg
              </T>
            </View>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <T variant="numSm" style={{ color: efficiencyColor }}>
                {avgWeeklySets.toFixed(1)}
              </T>
              <T variant="micro" muted>
                Avg sets/wk
              </T>
            </View>
          </Row>

          {/* "Exercises for <Muscle>" button */}
          {exerciseBtnLabel ? (
            <Pressable
              onPress={() => setExerciseModalSlug(selSlug ? String(selSlug) : null)}
              style={styles.exercisesBtn}>
              <Ionicons name="barbell-outline" size={16} color={colors.accent} />
              <T variant="smallSemi" style={{ color: colors.accent, flex: 1 }} numberOfLines={1}>
                {exerciseBtnLabel}
              </T>
              <Ionicons name="chevron-forward" size={14} color={colors.accent} />
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      <Section title="Body Measurements" action="Add" onAction={() => router.push('/measure' as never)}>
        <Card style={{ padding: spacing.lg }}>
          <Row align="space-between">
            <View>
              <T variant="label" dim>
                Weight
              </T>
              <T variant="numLg" accent style={{ marginTop: 4 }}>
                {last?.weightKg != null
                  ? `${last.weightKg.toFixed(1)} kg`
                  : profile?.weightKg != null
                  ? `${profile.weightKg.toFixed(1)} kg`
                  : '—'}
              </T>
              <T variant="small" dim style={{ fontSize: 12, marginTop: 2 }}>
                {measurements.length > 1 && last
                  ? `${(last.weightKg - measurements[0].weightKg) >= 0 ? '+' : ''}${(last.weightKg - measurements[0].weightKg).toFixed(1)} kg since start`
                  : 'Log your first measurement'}
              </T>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
              {measurements.map((m, i) => (
                <View
                  key={m.id}
                  style={{
                    width: 16,
                    height: 24 + (m.weightKg - Math.min(...measurements.map((x) => x.weightKg))) * 6,
                    borderRadius: 4,
                    backgroundColor: i === measurements.length - 1 ? colors.accent : colors.surface4,
                  }}
                />
              ))}
            </View>
          </Row>
        </Card>
      </Section>

      {/* Exercises for Muscle — Full-screen modal popup */}
      <Modal
        visible={!!exerciseModalSlug}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setExerciseModalSlug(null)}>
        <View style={styles.modalRoot}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <T variant="h3" numberOfLines={2}>
                {modalTitle}
              </T>
              <T variant="small" dim style={{ marginTop: 2 }}>
                {modalExercises.length} exercise{modalExercises.length !== 1 ? 's' : ''}
              </T>
            </View>
            <Pressable onPress={() => setExerciseModalSlug(null)} style={styles.modalClose}>
              <Ionicons name="close" size={20} color={colors.textDim} />
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Exercise list */}
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 60, gap: spacing.sm }}
            showsVerticalScrollIndicator={false}>
            {modalExercises.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                <Ionicons name="fitness-outline" size={48} color={colors.textMuted} />
                <T variant="bodySemi" dim style={{ marginTop: spacing.md }}>
                  No exercises found
                </T>
                <T variant="small" muted style={{ marginTop: 4, textAlign: 'center' }}>
                  No exercises in the library target this specific muscle
                </T>
              </View>
            ) : (
              modalExercises.map((ex) => (
                <Pressable
                  key={ex.id}
                  onPress={() => {
                    setExerciseModalSlug(null);
                    router.push(`/exercise/${ex.id}` as never);
                  }}
                  style={({ pressed }) => [styles.modalRow, pressed && { opacity: 0.82 }]}>
                  <ExerciseThumb muscle={ex.muscleGroup} size={48} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <T variant="bodySemi" numberOfLines={1}>
                      {ex.name}
                    </T>
                    <Row gap={8}>
                      <Tag label={ex.equipment} color={colors.textDim} bg={colors.surface3} />
                      <T variant="micro" muted>
                        {ex.difficulty}
                      </T>
                      <T variant="micro" muted>
                        ·
                      </T>
                      <T variant="micro" muted>
                        {ex.type}
                      </T>
                    </Row>
                    {/* Show if it's primary or secondary for this slug */}
                    {exerciseModalSlug ? (
                      <T
                        variant="micro"
                        style={{
                          color: (ex.targetSlugs ?? []).includes(exerciseModalSlug as any)
                            ? colors.accent
                            : colors.textMuted,
                        }}>
                        {(ex.targetSlugs ?? []).includes(exerciseModalSlug as any) ? '● Primary target' : '○ Secondary muscle'}
                      </T>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  exercisesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: `${colors.accent}30`,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 56,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
});
