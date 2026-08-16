import { ScrollView, StyleSheet, View } from 'react-native';

import { T } from '../components/Text';
import { AchievementBadge } from '../components/misc';
import { Card, Screen, ScreenHeader } from '../components/ui';
import { detectPRs, longestStreak, totalVolume, workoutStats } from '../lib/stats';
import { usePulse } from '../store/useStore';
import { spacing } from '../theme';
import type { IonName } from '../components/ui';

export default function AchievementsScreen() {
  const workouts = usePulse((s) => s.workouts);
  const volume = totalVolume(workouts);
  const sets = workouts.reduce((s, w) => s + workoutStats(w).sets, 0);
  const prCount = workouts.reduce((n, w) => n + detectPRs(w, workouts).length, 0);
  const exercisesUsed = new Set(workouts.flatMap((w) => w.exercises.map((we) => we.exerciseId))).size;

  const all: { icon: IonName; title: string; desc: string; earned: boolean; progress?: number; cat: string }[] = [
    { icon: 'trophy', title: 'First PR', desc: 'Break your first record', earned: prCount > 0, cat: 'Strength' },
    { icon: 'star', title: '5 PRs', desc: 'Set 5 personal records', earned: prCount >= 5, progress: Math.min(1, prCount / 5), cat: 'Strength' },
    { icon: 'flash', title: 'Heavy Hitter', desc: 'Move 60+ kg on a lift', earned: workouts.some((w) => w.exercises.some((we) => we.sets.some((s) => (s.weightKg ?? 0) >= 60))), cat: 'Strength' },
    { icon: 'barbell', title: '10 Workouts', desc: 'Complete 10 sessions', earned: workouts.length >= 10, progress: Math.min(1, workouts.length / 10), cat: 'Consistency' },
    { icon: 'calendar', title: '50 Workouts', desc: 'A serious training block', earned: workouts.length >= 50, progress: Math.min(1, workouts.length / 50), cat: 'Consistency' },
    { icon: 'layers', title: '100 Sets', desc: 'Log 100 working sets', earned: sets >= 100, progress: Math.min(1, sets / 100), cat: 'Volume' },
    { icon: 'scale', title: '100K kg Lifted', desc: 'Move 100,000 kg total', earned: volume >= 100000, progress: Math.min(1, volume / 100000), cat: 'Volume' },
    { icon: 'git-network', title: 'Exercise Variety', desc: 'Train with 12+ exercises', earned: exercisesUsed >= 12, progress: Math.min(1, exercisesUsed / 12), cat: 'Volume' },
    { icon: 'flame', title: '30 Day Streak', desc: 'Train 30 days in a row', earned: longestStreak(workouts) >= 30, progress: Math.min(1, longestStreak(workouts) / 30), cat: 'Consistency' },
    { icon: 'shield-checkmark', title: 'Consistency Master', desc: '4+ sessions/week for a month', earned: workouts.length >= 16, progress: Math.min(1, workouts.length / 16), cat: 'Consistency' },
  ];

  const cats = ['Strength', 'Consistency', 'Volume'];
  const earnedCount = all.filter((a) => a.earned).length;

  return (
    <Screen scroll>
      <ScreenHeader title="Achievements" subtitle={`${earnedCount} of ${all.length} unlocked`} back />

      <View style={{ paddingHorizontal: spacing.lg }}>
        <Card style={{ padding: spacing.md }}>
          <T variant="h3" style={{ marginBottom: 2 }}>
            {earnedCount}/{all.length}
          </T>
          <T variant="small" dim style={{ fontSize: 12 }}>
            Every record, streak and kilo counts. Keep collecting.
          </T>
        </Card>

        {cats.map((cat) => (
          <View key={cat} style={{ marginTop: spacing.xl }}>
            <T variant="label" accent style={{ marginBottom: spacing.md }}>
              {cat}
            </T>
            <View style={styles.grid}>
              {all.filter((a) => a.cat === cat).map((a) => (
                <AchievementBadge key={a.title} icon={a.icon} title={a.title} desc={a.desc} earned={a.earned} progress={a.progress} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'flex-start' },
});
