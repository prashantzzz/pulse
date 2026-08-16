import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ExerciseAnimation } from '../../../components/animation';
import { BottomSheet } from '../../../components/misc';
import { T } from '../../../components/Text';
import { Button, Card, Icon, Row, Screen, ScreenHeader, Tag } from '../../../components/ui';
import { EXERCISE_MAP } from '../../../data/exercises';
import { usePulse } from '../../../store/useStore';
import { colors, radius, spacing, useAccent } from '../../../theme';

export default function ExerciseDetailScreen() {
  useAccent();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const favorites = usePulse((s) => s.favorites);
  const toggleFavorite = usePulse((s) => s.toggleFavorite);
  const startWorkout = usePulse((s) => s.startWorkout);
  const [addSheet, setAddSheet] = useState(false);

  const exercise = id ? EXERCISE_MAP[id] : undefined;
  if (!exercise) {
    return (
      <Screen>
        <ScreenHeader title="Not found" back />
        <View style={{ padding: spacing.lg }}>
          <T variant="body" dim>
            This exercise doesn't exist.
          </T>
        </View>
      </Screen>
    );
  }

  const fav = favorites.includes(exercise.id);
  const attr = [
    { label: 'Difficulty', value: exercise.difficulty },
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
    <View style={{ flex: 1 }}>
      <Screen scroll contentStyle={{ paddingBottom: 120 }}>
        <ScreenHeader title={exercise.name} back right={fav ? 'bookmark' : 'bookmark-outline'} onRight={() => toggleFavorite(exercise.id)} />

        <View style={{ paddingHorizontal: spacing.lg }}>
          <ExerciseAnimation exercise={exercise} height={240} />

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
            <Tag label={exercise.movement} color={colors.teal} bg="rgba(47,216,208,0.12)" />
          </Row>

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

          <Section2 title="About">
            <T variant="body" dim>
              {exercise.about}
            </T>
          </Section2>

          <Section2 title="Perfect Your Form">
            <Card onPress={() => router.push(`/exercise/${exercise.id}/form` as never)} style={{ padding: spacing.md }}>
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
              <Row align="space-between" style={{ marginTop: spacing.md }}>
                <T variant="smallMedium" accent style={{ fontSize: 13 }}>
                  Open form guide
                </T>
                <Ionicons name="chevron-forward" size={16} color={colors.accent} />
              </Row>
            </Card>
          </Section2>

          <Section2 title="Common Mistakes">
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
          </Section2>

          <Section2 title="Coach's Notes">
            <Card style={{ padding: spacing.md, gap: spacing.sm }}>
              <NoteRow icon="repeat-outline" label="Recommended rep range" text={exercise.repRange} accent />
              <NoteRow icon="pulse-outline" label="Breathing" text={exercise.breathing} />
            </Card>
          </Section2>

          <Section2 title="Tips">
            <Card style={{ padding: spacing.md, gap: spacing.sm }}>
              <NoteRow icon="leaf-outline" label="Beginner" text={exercise.beginnerTips.join(' · ')} color={colors.success} />
              <NoteRow icon="trending-up-outline" label="Progression" text={exercise.progressionTips.join(' · ')} color={colors.accent} />
              <NoteRow icon="shield-checkmark-outline" label="Safety" text={exercise.safetyTips.join(' · ')} color={colors.orange} />
            </Card>
          </Section2>

          <Section2 title="Can't use this equipment?">
            <Row gap={8} wrap>
              {exercise.alternatives.map((altId) => {
                const alt = EXERCISE_MAP[altId];
                if (!alt) return null;
                return (
                  <Pressable key={altId} onPress={() => router.push(`/exercise/${altId}` as never)}>
                    <Tag label={alt.name} color={colors.cyan} bg="rgba(56,189,248,0.12)" />
                  </Pressable>
                );
              })}
            </Row>
          </Section2>
        </View>
      </Screen>

      {/* fixed bottom CTA */}
      <View style={styles.ctaBar}>
        <Button label="Add to Workout" icon="add" full size="lg" onPress={() => setAddSheet(true)} />
      </View>

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
          <Pressable onPress={() => router.push(`/exercise/${exercise.id}/form` as never)} style={styles.sheetOption}>
            <Icon name="walk-outline" size={22} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <T variant="bodySemi">Study the form guide</T>
              <T variant="small" dim style={{ fontSize: 12 }}>
                Setup · Movement · Contraction · Return
              </T>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}

function Section2({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing.xl }}>
      <T variant="h3" style={{ marginBottom: spacing.sm }}>
        {title}
      </T>
      {children}
    </View>
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
  noteIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
