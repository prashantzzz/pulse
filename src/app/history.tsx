import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet } from 'react-native';

import { EmptyState } from '../components/misc';
import { Chip, Screen, ScreenHeader } from '../components/ui';
import { HistoryCard } from '../components/workout-card';
import { PromoReveal } from '../promo/reveal';
import { classifyWorkout, detectPRs, whatChanged } from '../lib/stats';
import { usePulse } from '../store/useStore';
import { spacing, useAccent } from '../theme';

const FILTERS = ['All', 'Push', 'Pull', 'Legs', 'Upper', 'Full'];

export default function HistoryScreen() {
  useAccent();
  const router = useRouter();
  const workouts = usePulse((s) => s.workouts);
  const [filter, setFilter] = useState('All');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home' as never);
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

  // sort once for the list and reuse the order for per-card "previous workout"
  // lookups — sorting inside the render loop was O(n² log n) per render
  const sorted = [...workouts].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  // content-aware categorization: title hints ("Leg Day" → Legs, "Upper Body"
  // → Upper) with a movement/region fallback for arbitrary titles
  const filtered = sorted.filter((w) => filter === 'All' || classifyWorkout(w) === filter);

  return (
    <Screen>
      <ScreenHeader title="History" subtitle={`${workouts.length} workouts logged`} back onBack={handleBack} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={[styles.pillRow, { alignItems: 'center' }]}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 40, gap: spacing.sm }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No workouts yet"
            body="Start your first workout and your progress story begins here."
            cta="Start Workout"
            onCta={() => router.navigate('/(tabs)/log' as never)}
          />
        ) : (
          filtered.map((w, i) => {
            const prev = sorted.find((x) => x.title === w.title && x.id !== w.id && new Date(x.startTime).getTime() < new Date(w.startTime).getTime());
            const volUp = prev ? whatChanged(w, prev).volumePct > 0 : false;
            const hasPR = detectPRs(w, workouts).length > 0;
            return (
              <PromoReveal key={w.id} variant="row" delay={60 + Math.min(i, 7) * 55} observe={false}>
                <HistoryCard workout={w} isPR={hasPR} isVolumeUp={volUp} onPress={() => router.push(`/replay/${w.id}` as never)} />
              </PromoReveal>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pillRow: { paddingHorizontal: spacing.lg, gap: 8, paddingBottom: spacing.md },
});
