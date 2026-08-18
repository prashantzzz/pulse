import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { EmptyState } from '../components/misc';
import { Chip, Screen, ScreenHeader } from '../components/ui';
import { HistoryCard } from '../components/workout-card';
import { detectPRs, whatChanged } from '../lib/stats';
import { usePulse } from '../store/useStore';
import { spacing, useAccent } from '../theme';

const FILTERS = ['All', 'Push', 'Pull', 'Legs', 'Upper', 'Full'];

export default function HistoryScreen() {
  useAccent();
  const router = useRouter();
  const workouts = usePulse((s) => s.workouts);
  const [filter, setFilter] = useState('All');

  const filtered = [...workouts]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .filter((w) => filter === 'All' || w.title.includes(filter));

  return (
    <Screen>
      <ScreenHeader title="History" subtitle={`${workouts.length} workouts logged`} back />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={[styles.pillRow, { alignItems: 'center' }]}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40, gap: spacing.sm }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No workouts yet"
            body="Start your first workout and your progress story begins here."
            cta="Start Workout"
            onCta={() => router.push('/log' as never)}
          />
        ) : (
          filtered.map((w) => {
            const prev = [...workouts].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).find((x) => x.title === w.title && x.id !== w.id && new Date(x.startTime).getTime() < new Date(w.startTime).getTime());
            const volUp = prev ? whatChanged(w, prev).volumePct > 0 : false;
            const hasPR = detectPRs(w, workouts).length > 0;
            return (
              <HistoryCard key={w.id} workout={w} isPR={hasPR} isVolumeUp={volUp} onPress={() => router.push(`/replay/${w.id}` as never)} />
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
