import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Slug } from 'react-native-body-highlighter';

import { MuscleLegend, MuscleMap } from '../muscle-map';
import { T } from '../Text';
import { Button, Card, Row, Screen, Section } from '../ui';
import { resolveExercise } from '../../data/exercises';
import { anatomyLabel } from '../../lib/anatomy';
import { getTrainingEfficiency, GROUP_TO_SLUGS, volumeByMuscle, volumeBySlug } from '../../lib/stats';
import { toUserVolume, formatUserWeightWithUnit } from '../../lib/units';
import { usePulse } from '../../store/useStore';
import { colors, radius, spacing } from '../../theme';
import type { BodyMeasurement, MuscleGroup, MuscleSlug, UserProfile, Workout } from '../../types';
import { progressStyles } from './shared';

const ALL_MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Calves', 'Glutes', 'Forearms'];

function formatRecency(d?: Date): string {
  if (!d) return 'Not logged yet';
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays <= 0) return 'Trained today';
  if (diffDays === 1) return 'Trained yesterday';
  if (diffDays < 7) return `Trained ${diffDays} days ago`;
  if (diffDays < 30) return `Trained ${Math.max(1, Math.floor(diffDays / 7))}w ago`;
  return `Trained ${Math.max(1, Math.floor(diffDays / 30))}mo ago`;
}

/**
 * Body tab: all-time cumulative muscle heatmap from the day user started training
 * until today, providing actionable hypertrophy stimulus and volume metrics.
 */
export function BodyView({
  workouts,
  measurements,
  profile,
}: {
  workouts: Workout[];
  measurements: BodyMeasurement[];
  profile: UserProfile | null;
}) {
  const router = useRouter();
  const weightUnit = usePulse((s) => s.weightUnit);
  const [selMuscle, setSelMuscle] = useState<MuscleGroup | null>(null);
  const [selSlug, setSelSlug] = useState<Slug | null>(null);

  // Calculate training journey span from Day 1 to Today
  const sortedWorkoutsAsc = [...workouts].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
  const firstWorkoutTime =
    sortedWorkoutsAsc.length > 0
      ? new Date(sortedWorkoutsAsc[0].startTime).getTime()
      : Date.now();

  const daysSinceStart = Math.max(
    1,
    Math.ceil((Date.now() - firstWorkoutTime) / 86400000),
  );
  const weeksSinceStart = Math.max(1, daysSinceStart / 7);

  // Cumulative all-time volume and sets across entire history
  const volByMuscle = volumeByMuscle(workouts);
  const volBySlug = volumeBySlug(workouts);

  // Calculate last trained date for each slug and muscle group
  const lastTrainedSlugMap = new Map<string, Date>();
  const lastTrainedMuscleMap = new Map<string, Date>();

  const sortedWorkoutsDesc = [...workouts].sort(
    (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime(),
  );

  for (const w of sortedWorkoutsDesc) {
    const wDate = new Date(w.endTime);
    for (const we of w.exercises) {
      if (!we.sets.some((s) => s.completed)) continue;
      const ex = resolveExercise(we.exerciseId);
      if (!ex) continue;

      if (!lastTrainedMuscleMap.has(ex.muscleGroup)) {
        lastTrainedMuscleMap.set(ex.muscleGroup, wDate);
      }
      for (const sec of ex.secondaryMuscles) {
        if (!lastTrainedMuscleMap.has(sec)) {
          lastTrainedMuscleMap.set(sec, wDate);
        }
      }

      const targets: MuscleSlug[] =
        ex.targetSlugs && ex.targetSlugs.length > 0
          ? ex.targetSlugs
          : (GROUP_TO_SLUGS[ex.muscleGroup] || []);
      for (const slug of targets) {
        if (!lastTrainedSlugMap.has(slug)) {
          lastTrainedSlugMap.set(slug, wDate);
        }
      }
    }
  }

  // Intensity heatmap calculation based on average weekly volume rate across the journey
  const intensity: Record<string, number> = {};
  for (const v of volByMuscle) {
    const weeklySets = v.sets / weeksSinceStart;
    intensity[v.muscle] = weeklySets < 3 ? 0.25 : weeklySets < 6 ? 0.5 : 1;
  }
  for (const s of volBySlug) {
    const weeklySets = s.sets / weeksSinceStart;
    intensity[s.slug] = weeklySets < 3 ? 0.25 : weeklySets < 6 ? 0.5 : 1;
  }
  for (const m of ALL_MUSCLES) {
    if (workouts.length > 0 && intensity[m] == null) intensity[m] = 0.25; // never logged → undertrained baseline (only if user has workouts)
  }

  // Slug-level specific metrics with group-level fallback
  const slugDetail = selSlug ? volBySlug.find((v) => v.slug === (selSlug as MuscleSlug)) : null;
  const muscleDetail = selMuscle ? volByMuscle.find((v) => v.muscle === selMuscle) : null;

  const activeSets = selSlug && slugDetail ? slugDetail.sets : (muscleDetail?.sets ?? 0);
  const activeVolume = selSlug && slugDetail ? slugDetail.volume : (muscleDetail?.volume ?? 0);
  const avgWeeklySets = activeSets / weeksSinceStart;

  const efficiency = getTrainingEfficiency(avgWeeklySets);
  const efficiencyColor = efficiency.level === 3 ? colors.zoneWell : efficiency.level === 2 ? colors.zoneMod : colors.zoneLow;
  const efficiencyBg = efficiency.level === 3 ? 'rgba(34, 197, 94, 0.15)' : efficiency.level === 2 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)';

  const lastTrainedDate = selSlug
    ? lastTrainedSlugMap.get(String(selSlug))
    : selMuscle
    ? lastTrainedMuscleMap.get(selMuscle)
    : undefined;
  const recencyText = formatRecency(lastTrainedDate);

  const displayTitle = selSlug ? anatomyLabel(String(selSlug)) : selMuscle;
  const last = measurements[measurements.length - 1];

  // Button label for "exercises for this muscle"
  const exerciseBtnLabel = selSlug
    ? `Exercises for ${anatomyLabel(String(selSlug))}`
    : selMuscle
    ? `Exercises for ${selMuscle}`
    : null;

  const journeyBadgeText =
    workouts.length > 0
      ? `${workouts.length} workout${workouts.length !== 1 ? 's' : ''} logged`
      : 'No workouts yet';

  return (
    <>
      <Card style={{ padding: spacing.lg }}>
        <Row align="space-between">
          <View>
            <T variant="h3">Muscle Heatmap</T>
            <T variant="small" dim style={{ fontSize: 12, marginTop: 2 }}>
              All-time training breakdown
            </T>
          </View>
          <View style={[progressStyles.periodBadge, { backgroundColor: colors.accentSoft }]}>
            <T variant="smallMedium" accent style={{ fontSize: 12 }}>
              {journeyBadgeText}
            </T>
          </View>
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
            <View style={[progressStyles.deltaBadge, { backgroundColor: efficiencyBg, borderRadius: radius.pill }]}>
              <T variant="micro" style={{ color: efficiencyColor, fontWeight: '700' }}>
                {efficiency.status}
              </T>
            </View>
          </Row>

          <Row align="space-between" style={{ marginTop: spacing.md }}>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <T variant="numSm">{activeSets}</T>
              <T variant="micro" muted>
                Total sets
              </T>
            </View>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <T variant="numSm" accent>
                {Math.round(toUserVolume(activeVolume, weightUnit)).toLocaleString()}
              </T>
              <T variant="micro" muted>
                All-time volume {weightUnit}
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

          {/* Last trained info */}
          <View style={styles.recencyRow}>
            <Ionicons name="time-outline" size={13} color={colors.textDim} />
            <T variant="micro" dim style={{ fontSize: 11 }}>
              {recencyText}
            </T>
          </View>

          {/* "Exercises for <Muscle>" button */}
          {exerciseBtnLabel ? (
            <Pressable
              onPress={() => {
                const targetSlug = selSlug ? String(selSlug) : (selMuscle ? GROUP_TO_SLUGS[selMuscle]?.[0] : null);
                if (targetSlug) router.push(`/muscle/${targetSlug}` as never);
              }}
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
                  ? formatUserWeightWithUnit(last.weightKg, weightUnit)
                  : profile?.weightKg != null
                  ? formatUserWeightWithUnit(profile.weightKg, weightUnit)
                  : '—'}
              </T>
              <T variant="small" dim style={{ fontSize: 12, marginTop: 2 }}>
                {measurements.length > 1 && last
                  ? `${(last.weightKg - measurements[0].weightKg) >= 0 ? '+' : ''}${formatUserWeightWithUnit(last.weightKg - measurements[0].weightKg, weightUnit)} since start`
                  : 'Log your first measurement'}
              </T>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
              {measurements.slice(-10).map((m, i, arr) => {
                const minW = Math.min(...arr.map((x) => x.weightKg));
                return (
                  <View
                    key={m.id}
                    style={{
                      width: 14,
                      height: Math.min(50, 16 + (m.weightKg - minW) * 4),
                      borderRadius: 4,
                      backgroundColor: i === arr.length - 1 ? colors.accent : colors.surface4,
                    }}
                  />
                );
              })}
            </View>
          </Row>
        </Card>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  recencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
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
});
