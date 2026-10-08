import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';

import { ExerciseAnimation } from '../../../components/animation';
import { MediaCarousel } from '../../../components/media-carousel';
import { BottomSheet } from '../../../components/misc';
import { MuscleTargetMap } from '../../../components/muscle-map';
import { T } from '../../../components/Text';
import { Button, Card, Icon, Row, Screen, ScreenHeader, Section, Tag } from '../../../components/ui';
import { PromoReveal } from '../../../promo/reveal';
import { WebScreenTransition, useScreenTransition } from '../../../components/web-screen-transition';
import { getExerciseAnimation } from '../../../data/exercise-animations';
import { EXERCISE_MAP, swapOptions } from '../../../data/exercises';
import { plateauForExercise } from '../../../lib/stats';
import { usePulse } from '../../../store/useStore';
import { colors, layout, radius, spacing, useAccent } from '../../../theme';

export default function ExerciseDetailScreen() {
  useAccent();
  const { id, fromRunning } = useLocalSearchParams<{ id: string; fromRunning?: string }>();
  const router = useRouter();
  const favorites = usePulse((s) => s.favorites);
  const toggleFavorite = usePulse((s) => s.toggleFavorite);
  const startWorkout = usePulse((s) => s.startWorkout);
  const profile = usePulse((s) => s.profile);
  const workouts = usePulse((s) => s.workouts);
  const activeWorkout = usePulse((s) => s.activeWorkout);
  const isFromRunningWorkout = Boolean(fromRunning) && Boolean(activeWorkout) && !activeWorkout?.endTime;
  const [addSheet, setAddSheet] = useState(false);
  const { progress, runExit } = useScreenTransition();

  const goBack = useCallback(
    (fallback: string) => {
      runExit(() => {
        if (router.canGoBack()) {
          router.back();
        } else if (isFromRunningWorkout && activeWorkout) {
          router.replace(`/workout/${activeWorkout.id}` as never);
        } else {
          router.replace(fallback as never);
        }
      });
    },
    [runExit, router, isFromRunningWorkout, activeWorkout],
  );

  // Handle hardware back press cleanly when this screen is active
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (addSheet) {
          setAddSheet(false);
          return true;
        }
        goBack('/(tabs)/workouts');
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [addSheet, goBack])
  );

  const exercise = id ? EXERCISE_MAP[id] : undefined;
  if (!exercise) {
    return (
      <Screen>
        <ScreenHeader title="Not found" back />
        <View style={{ padding: spacing.lg }}>
          <T variant="body" dim>
            This exercise doesn&apos;t exist.
          </T>
        </View>
      </Screen>
    );
  }

  const fav = favorites.includes(exercise.id);
  const displayDifficulty = (d: string) => (d === 'Intermediate' ? 'Medium' : d);
  const attr = [
    { label: 'Difficulty', value: displayDifficulty(exercise.difficulty) },
    { label: 'Equipment', value: exercise.equipment },
    { label: 'Type', value: exercise.type },
    { label: 'Region', value: exercise.region },
  ];

  const quickStart = () => {
    setAddSheet(false);
    const w = startWorkout(exercise.name, [{ exerciseId: exercise.id, sets: 3, targetReps: exercise.repRange.split(' ')[0] }]);
    router.push(`/workout/${w.id}`);
  };

  return (
    <WebScreenTransition progress={progress}>
      <View style={{ flex: 1 }}>
        <Screen
          scroll
          contentStyle={{
            paddingBottom: isFromRunningWorkout ? spacing.xl : layout.stackContentBottomPad,
            paddingTop: layout.screenTopPad,
          }}>
        <ScreenHeader
          back
          onBack={() => goBack('/library')}
          right={fav ? 'bookmark' : 'bookmark-outline'}
          rightLabel="Toggle favorite"
          onRight={() => toggleFavorite(exercise.id)}
        />

        <View>
          <PromoReveal variant="hero" observe={false}>
          {getExerciseAnimation(exercise.id) ? (
            <MediaCarousel
              labels={['Animation', 'Muscles']}
              pages={[
                <ExerciseAnimation key="anim" exercise={exercise} height={240} gender={profile?.gender ?? 'male'} />,
                <View key="muscles" style={styles.muscleCard}>
                  <MuscleTargetMap exercise={exercise} primary={exercise.muscleGroup} secondary={exercise.secondaryMuscles} height={205} gender={profile?.gender ?? 'male'} />
                </View>,
              ]}
            />
          ) : (
            <View style={styles.muscleCard}>
              <MuscleTargetMap exercise={exercise} primary={exercise.muscleGroup} secondary={exercise.secondaryMuscles} height={205} gender={profile?.gender ?? 'male'} />
            </View>
          )}

          <View style={{ marginTop: spacing.md, gap: 4 }}>
            <T variant="h2">{exercise.name}</T>
            <T variant="body" dim>
              {exercise.equipment} · {exercise.muscleGroup}
            </T>
          </View>

          <Row gap={8} style={{ marginTop: spacing.sm }} wrap>
            <Tag label={exercise.muscleGroup} />
            {exercise.secondaryMuscles.map((m) => (
              <Tag key={m} label={m} color={colors.textDim} bg={colors.surface3} />
            ))}
            <Tag label={exercise.movement} color={colors.teal} bg={colors.tealSoft} />
          </Row>
        </PromoReveal>

          {/* lightweight plateau signal from the user's own history */}
          {plateauForExercise(workouts, exercise.id) ? (
            <Card style={{ marginTop: spacing.md, padding: spacing.md, borderColor: `${colors.orange}55` }}>
              <Row gap={10} align="flex-start">
                <View style={[styles.plateauIcon, { backgroundColor: colors.dangerSoft }]}>
                  <Ionicons name="pause-circle-outline" size={18} color={colors.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <T variant="bodySemi" style={{ fontSize: 14 }}>
                    {exercise.name} may be plateauing.
                  </T>
                  <T variant="small" dim style={{ fontSize: 12, marginTop: 1 }}>
                    Same load across your recent sessions. Try increasing reps before increasing weight.
                  </T>
                </View>
              </Row>
            </Card>
          ) : null}

          <Card style={{ marginTop: spacing.md, padding: spacing.md }}>
            <Row align="space-between">
              {attr.map((a) => (
                <View key={a.label} style={{ alignItems: 'center', flex: 1, gap: 3 }}>
                  <T variant="micro" muted>
                    {a.label}
                  </T>
                  <T variant="smallSemi" style={{ fontSize: 12.5 }}>
                    {a.value}
                  </T>
                </View>
              ))}
            </Row>
          </Card>

          <Section title="About">
            <T variant="body" dim>
              {exercise.about}
            </T>
          </Section>

          <Section title="Perfect Your Form">
            <Card style={{ padding: spacing.md }}>
              <View style={{ gap: spacing.sm }}>
                {exercise.steps.map((s, i) => (
                  <Row key={i} gap={12}>
                    <View style={[styles.stepNum, { backgroundColor: colors.accentSoft }]}>
                      <T variant="smallSemi" accent style={{ fontSize: 12 }}>
                        {i + 1}
                      </T>
                    </View>
                    <View style={{ flex: 1 }}>
                      <T variant="bodySemi" style={{ fontSize: 14 }}>
                        {s.title}
                      </T>
                      <T variant="small" dim style={{ fontSize: 12, marginTop: 1 }}>
                        {s.detail}
                      </T>
                    </View>
                  </Row>
                ))}
              </View>
            </Card>
          </Section>

          <Section title="Common Mistakes">
            <Card style={{ padding: spacing.md, gap: spacing.xs }}>
              {exercise.commonMistakes.map((m, i) => (
                <Row key={i} gap={10}>
                  <View style={styles.warnDot} />
                  <T variant="small" dim style={{ flex: 1, fontSize: 13 }}>
                    {m}
                  </T>
                </Row>
              ))}
            </Card>
          </Section>

          <Section title="Coach's Notes">
            <Card style={{ padding: spacing.md, gap: spacing.sm }}>
              <NoteRow icon="repeat-outline" label="Recommended rep range" text={exercise.repRange} accent />
              <NoteRow icon="pulse-outline" label="Breathing" text={exercise.breathing} />
            </Card>
          </Section>

          <Section title="Tips">
            <Card style={{ padding: spacing.md, gap: spacing.sm }}>
              <NoteRow icon="leaf-outline" label="Beginner" text={exercise.beginnerTips.join(' · ')} color={colors.success} />
              <NoteRow icon="trending-up-outline" label="Progression" text={exercise.progressionTips.join(' · ')} color={colors.accent} />
              <NoteRow icon="shield-checkmark-outline" label="Safety" text={exercise.safetyTips.join(' · ')} color={colors.orange} />
            </Card>
          </Section>

          {(() => {
            const options = swapOptions(exercise, 4);
            if (options.length === 0) return null;
            const [top, ...rest] = options;
            return (
              <Section title="Swap Exercise">
                <T variant="small" dim style={{ fontSize: 12, marginBottom: spacing.sm }}>
                  Same movement, different setup — one is clearly recommended.
                </T>
                <Card
                  onPress={() =>
                    router.push({
                      pathname: '/exercise/[id]',
                      params: { id: top.id, ...(fromRunning ? { fromRunning } : {}) },
                    } as never)
                  }
                  style={{ padding: spacing.md, marginBottom: spacing.sm }}>
                  <Row align="space-between">
                    <Row gap={12}>
                      <View style={[styles.swapRec, { backgroundColor: colors.accent }]}>
                        <Ionicons name="swap-horizontal" size={18} color={colors.bg} />
                      </View>
                      <View>
                        <T variant="bodySemi">{top.name}</T>
                        <T variant="small" dim style={{ fontSize: 12 }}>
                          {top.equipment} · {top.muscleGroup}
                        </T>
                      </View>
                    </Row>
                    <Tag label="Recommended" color={colors.accent} />
                  </Row>
                </Card>
                {rest.length > 0 ? (
                  <Row gap={8} wrap>
                    {rest.map((alt) => (
                      <Pressable
                        key={alt.id}
                        onPress={() =>
                          router.push({
                            pathname: '/exercise/[id]',
                            params: { id: alt.id, ...(fromRunning ? { fromRunning } : {}) },
                          } as never)
                        }>
                        <Tag label={alt.name} color={colors.cyan} bg={colors.cyanSoft} />
                      </Pressable>
                    ))}
                  </Row>
                ) : null}
              </Section>
            );
          })()}
        </View>
      </Screen>

      {/* fixed bottom CTA (hidden when opened from within an active running workout) */}
      {!isFromRunningWorkout && (
        <PromoReveal delay={180} observe={false}>
        <View style={styles.ctaBar}>
          <Button label="Add to Workout" icon="add" full size="lg" onPress={() => setAddSheet(true)} />
        </View>
        </PromoReveal>
      )}

      {!isFromRunningWorkout && (
        <BottomSheet visible={addSheet} onClose={() => setAddSheet(false)} title={exercise.name}>
          <View style={{ gap: spacing.sm }}>
            <Pressable onPress={quickStart} style={styles.sheetOption}>
              <Icon name="play-circle" size={22} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <T variant="bodySemi">Quick workout</T>
                <T variant="small" dim style={{ fontSize: 12 }}>
                  3 sets · {exercise.repRange}
                </T>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
            <Pressable
              onPress={() => {
                setAddSheet(false);
                router.push({ pathname: '/builder', params: { add: exercise.id } });
              }}
              style={styles.sheetOption}>
              <Icon name="create-outline" size={22} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <T variant="bodySemi">Add to a custom workout</T>
                <T variant="small" dim style={{ fontSize: 12 }}>
                  Open the builder with {exercise.name} pre-added
                </T>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </BottomSheet>
      )}
      </View>
    </WebScreenTransition>
  );
}

function NoteRow({ icon, label, text, accent, color }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; text: string; accent?: boolean; color?: string }) {
  const c = color ?? (accent ? colors.accent : colors.textDim);
  return (
    <Row gap={12} align="flex-start">
      <View style={[styles.noteIcon, { backgroundColor: `${c}1A` }]}>
        <Ionicons name={icon} size={16} color={c} />
      </View>
      <View style={{ flex: 1 }}>
        <T variant="micro" muted>
          {label}
        </T>
        <T variant="small" style={{ fontSize: 13, color: colors.textDim, marginTop: 1 }}>
          {text}
        </T>
      </View>
    </Row>
  );
}

const styles = StyleSheet.create({
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red, marginTop: 6 },
  plateauIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapRec: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Full-bleed dark panel: the carousel viewport clips + rounds the edges, so
  // this card must cover its whole page — its own rounded corners or border
  // would leave transparent/light pixels at the seam where the white video
  // card behind it could show through.
  muscleCard: {
    backgroundColor: '#0D0F12',
    padding: spacing.sm,
    height: 240,
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
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
