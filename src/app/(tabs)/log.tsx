import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { T } from '../../components/Text';
import { BottomSheet } from '../../components/misc';
import { Button, Icon, Screen } from '../../components/ui';
import { planIcon } from '../../components/muscle-icon';
import { usePulse } from '../../store/useStore';
import { colors, gradients, layout, radius, spacing, useAccent } from '../../theme';
import type { IonName } from '../../components/ui';
import type { WorkoutPlan } from '../../types';

const ACTIONS: { icon: IonName; title: string; desc: string; route: string; grad: keyof typeof gradients }[] = [
  { icon: 'play-circle', title: 'Start Workout', desc: 'Begin a plan right now', route: 'start', grad: 'accent' },
  { icon: 'barbell-outline', title: 'Log Exercise', desc: 'Add a single exercise', route: '/library', grad: 'emerald' },
  { icon: 'body-outline', title: 'Body Measurement', desc: 'Track weight & waist', route: '/measure', grad: 'teal' },
  { icon: 'trophy-outline', title: 'Add Personal Record', desc: 'Log a new best', route: '/records', grad: 'gold' },
  { icon: 'people-outline', title: 'Create Challenge', desc: 'Compete with a friend', route: '/challenge', grad: 'purple' },
];

export default function LogScreen() {
  useAccent();
  const router = useRouter();
  const startWorkout = usePulse((s) => s.startWorkout);
  const plans = usePulse((s) => s.plans);
  const [planSheet, setPlanSheet] = useState(false);

  const begin = (plan: WorkoutPlan) => {
    setPlanSheet(false);
    const w = startWorkout(plan.title, plan.exercises);
    router.push(`/workout/${w.id}`);
  };

  return (
    <Screen scroll contentStyle={{ paddingBottom: layout.tabContentBottomPad, paddingTop: layout.screenTopPad }}>
      <View style={{ paddingHorizontal: spacing.md }}>
        <T variant="label" accent>
          Quick Log
        </T>
        <T variant="h2" style={{ marginTop: 4 }}>
          What are we doing?
        </T>
        <T variant="small" dim style={{ marginTop: 4 }}>
          Logging a set should take a few seconds — that&apos;s the whole point.
        </T>
      </View>

      <View style={{ marginTop: spacing.lg, gap: spacing.md, paddingHorizontal: spacing.md }}>
        {ACTIONS.map((a) => (
          <Pressable
            key={a.title}
            onPress={() => (a.route === 'start' ? setPlanSheet(true) : router.push(a.route as never))}
            style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }]}>
            <LinearGradient colors={[...gradients[a.grad]]} style={styles.actionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Icon name={a.icon} size={24} color={colors.bg} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <T variant="bodySemi">{a.title}</T>
              <T variant="small" muted style={{ fontSize: 12 }}>
                {a.desc}
              </T>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <BottomSheet visible={planSheet} onClose={() => setPlanSheet(false)} title="Start a workout">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ gap: spacing.sm }}>
            {plans.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => begin(p)}
                style={({ pressed }) => [styles.planRow, pressed && { opacity: 0.85 }]}>
                <View style={styles.planEmoji}>
                  <MaterialCommunityIcons name={planIcon(p.emoji)} size={22} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <T variant="bodySemi">{p.title}</T>
                  <T variant="small" muted style={{ fontSize: 12 }}>
                    {p.exercises.length} exercises · {p.muscles.join(' · ')}
                  </T>
                </View>
                <Button label="Start" size="sm" onPress={() => begin(p)} />
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                setPlanSheet(false);
                router.push('/workouts' as never);
              }}
              style={({ pressed }) => [styles.planRow, pressed && { opacity: 0.85 }]}>
              <View style={styles.planEmoji}>
                <Icon name="albums-outline" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <T variant="bodySemi">Browse Workout Templates</T>
                <T variant="small" muted style={{ fontSize: 12 }}>
                  Choose from 9 evidence-based programs
                </T>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
            <Pressable
              onPress={() => {
                setPlanSheet(false);
                router.push('/builder' as never);
              }}
              style={({ pressed }) => [styles.planRow, pressed && { opacity: 0.85 }]}>
              <View style={styles.planEmoji}>
                <Icon name="create-outline" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <T variant="bodySemi">Build a custom workout</T>
                <T variant="small" muted style={{ fontSize: 12 }}>
                  Pick exercises, sets and target reps
                </T>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </ScrollView>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  sessionGlow: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  sessionCta: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planEmoji: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
