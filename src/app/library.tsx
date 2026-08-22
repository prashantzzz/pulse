import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { T } from '../components/Text';
import { BottomSheet, EmptyState } from '../components/misc';
import { ExerciseThumb } from '../components/muscle-icon';
import { Chip, Icon, Row, Screen, ScreenHeader, Tag } from '../components/ui';
import { EQUIPMENT_OPTIONS, MUSCLE_GROUPS, searchExercises } from '../data/exercises';
import type { Exercise } from '../types';
import { usePulse } from '../store/useStore';
import { colors, radius, spacing, useAccent } from '../theme';

export default function LibraryScreen() {
  useAccent();
  const router = useRouter();
  const favorites = usePulse((s) => s.favorites);
  const toggleFavorite = usePulse((s) => s.toggleFavorite);
  const [query, setQuery] = useState('');
  const [muscles, setMuscles] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string[]>([]);

  const results = searchExercises({ query, muscles, equipment, difficulty });
  const activeFilters = muscles.length + equipment.length + difficulty.length;

  const clearAll = () => {
    setMuscles([]);
    setEquipment([]);
    setDifficulty([]);
  };

  const filterableEquipment = EQUIPMENT_OPTIONS.filter((eq) => eq.toLowerCase() !== 'cable');

  return (
    <Screen>
      <ScreenHeader title="Exercise Library" subtitle={`${results.length} exercises`} back right="options-outline" rightLabel="Filter exercises" onRight={() => setFilterOpen(true)} />

      <View style={styles.searchWrap}>
        <Icon name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises..."
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={[styles.pillRow, { alignItems: 'center' }]}>
        <Chip label="All" selected={muscles.length === 0} onPress={() => setMuscles([])} />
        {MUSCLE_GROUPS.map((m) => (
          <Chip
            key={m}
            label={m}
            selected={muscles.includes(m)}
            onPress={() => setMuscles((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [m]))}
          />
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40, gap: spacing.sm }}>
        {results.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No exercises found"
            body="Try removing a filter or searching for something else."
            cta="Clear filters"
            onCta={clearAll}
          />
        ) : (
          results.map((e) => <ExerciseRow key={e.id} exercise={e} fav={favorites.includes(e.id)} onFav={() => toggleFavorite(e.id)} onPress={() => router.push(`/exercise/${e.id}` as never)} />)
        )}
      </ScrollView>

      <BottomSheet visible={filterOpen} onClose={() => setFilterOpen(false)} title="Filter">
        <ScrollView showsVerticalScrollIndicator={false}>
          <T variant="label" dim style={{ marginBottom: 10 }}>
            Equipment
          </T>
          <View style={styles.filterChips}>
            {filterableEquipment.map((eq) => (
              <Chip key={eq} label={eq} selected={equipment.includes(eq)} onPress={() => setEquipment((prev) => (prev.includes(eq) ? prev.filter((x) => x !== eq) : [...prev, eq]))} />
            ))}
          </View>
          <T variant="label" dim style={{ marginTop: spacing.lg, marginBottom: 10 }}>
            Difficulty
          </T>
          <View style={styles.filterChips}>
            {['Beginner', 'Intermediate', 'Advanced'].map((d) => (
              <Chip key={d} label={d} selected={difficulty.includes(d)} onPress={() => setDifficulty((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))} />
            ))}
          </View>
          <Row style={{ marginTop: spacing.xl, gap: spacing.sm }}>
            <Pressable onPress={clearAll} style={styles.clearBtn}>
              <T variant="bodySemi" dim>
                Clear All
              </T>
            </Pressable>
            <Pressable onPress={() => setFilterOpen(false)} style={[styles.applyBtn, { backgroundColor: colors.accent }]}>
              <T variant="bodySemi" style={{ color: colors.bg }}>
                Apply Filters ({activeFilters})
              </T>
            </Pressable>
          </Row>
        </ScrollView>
      </BottomSheet>
    </Screen>
  );
}

function ExerciseRow({ exercise, fav, onFav, onPress }: { exercise: Exercise; fav: boolean; onFav: () => void; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
      <ExerciseThumb muscle={exercise.muscleGroup} size={54} />
      <View style={{ flex: 1, gap: 3 }}>
        <T variant="bodySemi" numberOfLines={1}>
          {exercise.name}
        </T>
        <Row gap={8}>
          <Tag label={exercise.equipment} color={colors.textDim} bg={colors.surface3} />
          <T variant="micro" muted>
            {exercise.muscleGroup} · {exercise.difficulty}
          </T>
        </Row>
      </View>
      <Pressable onPress={onFav} hitSlop={8}>
        <Ionicons name={fav ? 'bookmark' : 'bookmark-outline'} size={20} color={fav ? colors.accent : colors.textMuted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: 13, color: colors.text, fontSize: 15, fontFamily: 'Inter_400Regular' },
  pillRow: { paddingHorizontal: spacing.lg, gap: 8, paddingBottom: spacing.md },
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
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  clearBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 999,
    backgroundColor: colors.surface3,
  },
  applyBtn: {
    flex: 2,
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 999,
  },
});
