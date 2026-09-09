import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';

import { T } from '../components/Text';
import { AchievementBadge } from '../components/misc';
import { Card, Screen, ScreenHeader } from '../components/ui';
import { computeAchievements } from '../lib/achievements';
import { usePulse } from '../store/useStore';
import { spacing, useAccent } from '../theme';

export default function AchievementsScreen() {
  useAccent();
  const router = useRouter();
  const workouts = usePulse((s) => s.workouts);
  const weightUnit = usePulse((s) => s.weightUnit);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile' as never);
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [router]);

  const all = computeAchievements(workouts, weightUnit);
  const cats = ['Strength', 'Consistency', 'Volume'];
  const earnedCount = all.filter((a) => a.earned).length;

  return (
    <Screen scroll>
      <ScreenHeader title="Achievements" subtitle={`${earnedCount} of ${all.length} unlocked`} back onBack={handleBack} />

      <View>
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
