import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ExerciseAnimation } from '../../../components/animation';
import { MuscleMap } from '../../../components/muscle-map';
import { T } from '../../../components/Text';
import { Card, Row, Screen, ScreenHeader, Segmented } from '../../../components/ui';
import { EXERCISE_MAP } from '../../../data/exercises';
import { usePulse } from '../../../store/useStore';
import { colors, radius, spacing, useAccent } from '../../../theme';

export default function FormGuideScreen() {
  useAccent();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = usePulse((s) => s.profile);
  const [tab, setTab] = useState<'Form Guide' | 'Muscles'>('Form Guide');
  const exercise = id ? EXERCISE_MAP[id] : undefined;

  if (!exercise) {
    return (
      <Screen>
        <ScreenHeader title="Not found" back />
      </Screen>
    );
  }

  const intensity: Record<string, number> = {};
  intensity[exercise.muscleGroup] = 1;
  for (const m of exercise.secondaryMuscles) intensity[m] = 0.55;
  for (const m of ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Core', 'Calves', 'Glutes', 'Forearms']) {
    if (intensity[m] == null) intensity[m] = 0;
  }

  const phases = ['Setup', 'Movement', 'Peak Contraction', 'Return'];

  return (
    <Screen scroll>
      <ScreenHeader title={exercise.name} back />
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Segmented options={['Form Guide', 'Muscles']} value={tab} onChange={setTab} />
      </View>

      {tab === 'Form Guide' ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <View style={{ marginTop: spacing.md }}>
            <ExerciseAnimation exercise={exercise} height={210} gender={profile?.gender ?? 'male'} />
          </View>

          <T variant="h3" style={{ marginTop: spacing.xl }}>
            Perfect Your Form
          </T>
          <T variant="small" dim style={{ marginTop: 2 }}>
            Follow the {exercise.steps.length}-phase movement. Quality beats speed — every rep.
          </T>

          {exercise.steps.map((s, i) => (
            <Card key={i} style={{ marginTop: spacing.sm, padding: spacing.md }}>
              <Row gap={12} align="flex-start">
                <View style={[styles.phaseBadge, { backgroundColor: colors.accentSoft }]}>
                  <T variant="micro" accent style={{ fontSize: 10 }}>
                    {i + 1}
                  </T>
                </View>
                <View style={{ flex: 1 }}>
                  <Row align="space-between">
                    <T variant="bodySemi">{s.title}</T>
                    <T variant="micro" muted style={{ fontSize: 10 }}>
                      Phase · {phases[i] ?? 'Finish'}
                    </T>
                  </Row>
                  <T variant="small" dim style={{ fontSize: 13, marginTop: 4 }}>
                    {s.detail}
                  </T>
                </View>
              </Row>
            </Card>
          ))}

          <View style={styles.warnCard}>
            <Row gap={10} align="flex-start">
              <View style={styles.warnIcon}>
                <Ionicons name="warning" size={18} color={colors.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <T variant="bodySemi" style={{ color: colors.orange }}>
                  Common Mistakes
                </T>
                <View style={{ gap: 4, marginTop: 6 }}>
                  {exercise.commonMistakes.map((m, i) => (
                    <Row key={i} gap={8} align="flex-start">
                      <View style={styles.bullet} />
                      <T variant="small" dim style={{ flex: 1, fontSize: 13 }}>
                        {m}
                      </T>
                    </Row>
                  ))}
                </View>
              </View>
            </Row>
          </View>

          <Card style={{ marginTop: spacing.md, padding: spacing.md }}>
            <Row gap={12} align="flex-start">
              <View style={styles.breathIcon}>
                <Ionicons name="pulse-outline" size={18} color={colors.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <T variant="bodySemi">Breathing</T>
                <T variant="small" dim style={{ fontSize: 13, marginTop: 3 }}>
                  {exercise.breathing}
                </T>
              </View>
            </Row>
          </Card>
        </View>
      ) : (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          <Card style={{ padding: spacing.md }}>
            <T variant="h3">{exercise.name}</T>
            <T variant="small" dim style={{ marginTop: 2 }}>
              Primary: {exercise.muscleGroup} · Secondary: {exercise.secondaryMuscles.join(', ') || '—'}
            </T>
            <View style={{ marginTop: spacing.md }}>
              <MuscleMap intensity={intensity} selected={exercise.muscleGroup} height={250} gender={profile?.gender ?? 'male'} />
            </View>
          </Card>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  phaseBadge: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnCard: {
    marginTop: spacing.xl,
    backgroundColor: 'rgba(255,159,67,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,159,67,0.25)',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  warnIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,159,67,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.orange, marginTop: 7 },
  breathIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
