import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ExerciseThumb } from '../../components/muscle-icon';
import { T } from '../../components/Text';
import { Row, Screen, ScreenHeader, Tag } from '../../components/ui';
import { WebScreenTransition, useScreenTransition } from '../../components/web-screen-transition';
import { exercisesForSlug } from '../../data/exercises';
import { anatomyLabel } from '../../lib/anatomy';
import { colors, radius, spacing, useAccent } from '../../theme';

/**
 * Exercises for one muscle slug, reached from the Progress → Body tab.
 *
 * Rendered as a regular stack route (not a modal) so pressing back from an
 * exercise detail returns to this list, and back again returns to the Body tab.
 */
export default function MuscleExercisesScreen() {
  useAccent();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const muscleSlug = typeof slug === 'string' ? slug : '';
  const { progress, runExit } = useScreenTransition();

  // Primary movers first, then secondary — mirrors the ordering used before.
  const exercises = useMemo(
    () =>
      exercisesForSlug(muscleSlug)
        .slice()
        .sort((a, b) => {
          const aPrimary = (a.targetSlugs ?? []).includes(muscleSlug as any) ? 0 : 1;
          const bPrimary = (b.targetSlugs ?? []).includes(muscleSlug as any) ? 0 : 1;
          return aPrimary - bPrimary;
        }),
    [muscleSlug],
  );

  const handleBack = () => {
    runExit(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/progress' as never);
      }
    });
  };

  return (
    <WebScreenTransition progress={progress}>
      <Screen>
        <ScreenHeader
          title={`Exercises for ${anatomyLabel(muscleSlug)}`}
          subtitle={`${exercises.length} exercise${exercises.length !== 1 ? 's' : ''}`}
          back
          onBack={handleBack}
        />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}>
        {exercises.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="fitness-outline" size={48} color={colors.textMuted} />
            <T variant="bodySemi" dim style={{ marginTop: spacing.md }}>
              No exercises found
            </T>
            <T variant="small" muted style={{ marginTop: 4, textAlign: 'center' }}>
              No exercises in the library target this specific muscle
            </T>
          </View>
        ) : (
          exercises.map((ex) => {
            const isPrimary = (ex.targetSlugs ?? []).includes(muscleSlug as any);
            return (
              <Pressable
                key={ex.id}
                onPress={() => router.push(`/exercise/${ex.id}` as never)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${ex.name}`}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.82 }]}>
                <ExerciseThumb exerciseId={ex.id} muscle={ex.muscleGroup} size={48} />
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
                  <T variant="micro" style={{ color: isPrimary ? colors.accent : colors.textMuted }}>
                    {isPrimary ? '● Primary target' : '○ Secondary muscle'}
                  </T>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
      </Screen>
    </WebScreenTransition>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 60,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
});
