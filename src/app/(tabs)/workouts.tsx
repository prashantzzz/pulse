import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { T } from '../../components/Text';
import { EmptyState } from '../../components/misc';
import { Button, Row, Screen, Segmented } from '../../components/ui';
import { PlanCard } from '../../components/workout-card';
import { SEED_PLANS } from '../../data/seed';
import { usePulse } from '../../store/useStore';
import { colors, spacing, useAccent } from '../../theme';
import type { WorkoutPlan } from '../../types';

export default function WorkoutsScreen() {
  useAccent();
  const router = useRouter();
  const startWorkout = usePulse((s) => s.startWorkout);
  const [tab, setTab] = useState<'My Plans' | 'Templates'>('My Plans');

  const begin = (plan: WorkoutPlan) => {
    const w = startWorkout(plan.title, plan.exercises);
    router.push(`/workout/${w.id}`);
  };

  return (
    <Screen scroll contentStyle={{ paddingBottom: 130, paddingTop: 14 }}>
      <Row align="space-between" style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
        <View>
          <T variant="h2">My Workouts</T>
          <T variant="small" dim style={{ marginTop: 2 }}>
            {SEED_PLANS.length} plans · ready when you are
          </T>
        </View>
        <Row gap={8}>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/library' as never)}>
            <Ionicons name="search" size={20} color={colors.textDim} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/builder' as never)}>
            <Ionicons name="add" size={22} color={colors.accent} />
          </Pressable>
        </Row>
      </Row>

      <Segmented options={['My Plans', 'Templates']} value={tab} onChange={setTab} style={{ marginHorizontal: spacing.md }} />

      <View style={{ marginTop: spacing.lg, gap: spacing.md, paddingHorizontal: spacing.md }}>
        {tab === 'My Plans'
          ? SEED_PLANS.map((p) => (
              // Tapping the card expands its exercise list (see PlanCard); the
              // timer starts exclusively via the Start button inside the card.
              <PlanCard key={p.id} plan={p} onStart={() => begin(p)} />
            ))
          : (
            <View style={{ marginTop: 20 }}>
              <EmptyState
                icon="copy-outline"
                title="Templates from the community"
                body="Community workout templates land here soon. For now, build your own or start a plan."
                cta="Browse Exercise Library"
                onCta={() => router.push('/library' as never)}
              />
            </View>
          )}
      </View>

      <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.lg }}>
        <Button
          label="Build a New Workout"
          icon="create-outline"
          variant="outline"
          full
          onPress={() => router.push('/builder' as never)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
