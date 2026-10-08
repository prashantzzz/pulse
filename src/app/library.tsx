import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { T } from '../components/Text';
import { BottomSheet, EmptyState } from '../components/misc';
import { ExerciseThumb } from '../components/muscle-icon';
import { Chip, Icon, Row, Screen, ScreenHeader, Tag } from '../components/ui';
import { PromoReveal } from '../promo/reveal';
import {
  ANATOMY_LABEL_MAP,
  ANATOMY_SLUGS,
  EQUIPMENT_OPTIONS,
  searchExercises,
} from '../data/exercises';
import type { Exercise } from '../types';
import { usePulse } from '../store/useStore';
import { colors, radius, spacing, useAccent } from '../theme';

export default function LibraryScreen() {
  useAccent();
  const router = useRouter();
  const favorites = usePulse((s) => s.favorites);
  const toggleFavorite = usePulse((s) => s.toggleFavorite);
  const [query, setQuery] = useState('');
  const [slugs, setSlugs] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string[]>([]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/workouts' as never);
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      if (filterOpen) {
        setFilterOpen(false);
        return true;
      }
      handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [filterOpen, router]);

  const results = searchExercises({ query, slugs, equipment, difficulty });
  const activeFilters = slugs.length + equipment.length + difficulty.length;

  const clearAll = () => {
    setSlugs([]);
    setEquipment([]);
    setDifficulty([]);
  };

  const filterableEquipment = EQUIPMENT_OPTIONS.filter((eq) => eq.toLowerCase() !== 'cable');

  const toggleSlug = (slug: string) =>
    setSlugs((prev) => (prev.includes(slug) ? prev.filter((x) => x !== slug) : [slug]));

  return (
    <Screen>
      <ScreenHeader
        title="Exercise Library"
        subtitle={`${results.length} exercises`}
        back
        onBack={handleBack}
        right="options-outline"
        rightLabel="Filter exercises"
        onRight={() => setFilterOpen(true)}
      />

      {/* Search bar */}
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

      {/* Anatomical muscle slug filter chips (same as body-map clickable muscles) */}
      <PromoReveal variant="fade" delay={60} observe={false}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={[styles.pillRow, { alignItems: 'center' }]}
        {...({ 'data-horizontal-scroll': 'true' } as any)}>
        <Chip label="All" selected={slugs.length === 0} onPress={() => setSlugs([])} />
        {ANATOMY_SLUGS.map((slug) => (
          <Chip
            key={slug}
            label={ANATOMY_LABEL_MAP[slug] ?? slug}
            selected={slugs.includes(slug)}
            onPress={() => toggleSlug(slug)}
          />
        ))}
      </ScrollView>
      </PromoReveal>

      {/* Exercise list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40, gap: spacing.sm }}>
        {results.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No exercises found"
            body="Try removing a filter or searching for something else."
            cta="Clear filters"
            onCta={clearAll}
          />
        ) : (
          results.map((e, i) => (
            <PromoReveal key={e.id} variant="row" delay={70 + Math.min(i, 9) * 42} observe={false}>
            <ExerciseRow
              exercise={e}
              fav={favorites.includes(e.id)}
              onFav={() => toggleFavorite(e.id)}
              onPress={() => router.push(`/exercise/${e.id}` as never)}
            />
            </PromoReveal>
          ))
        )}
      </ScrollView>

      {/* Filter bottom sheet (equipment + difficulty) */}
      <BottomSheet visible={filterOpen} onClose={() => setFilterOpen(false)} title="Filter">
        <ScrollView showsVerticalScrollIndicator={false}>
          <T variant="label" dim style={{ marginBottom: 10 }}>
            Equipment
          </T>
          <View style={styles.filterChips}>
            {filterableEquipment.map((eq) => (
              <Chip
                key={eq}
                label={eq}
                selected={equipment.includes(eq)}
                onPress={() =>
                  setEquipment((prev) => (prev.includes(eq) ? prev.filter((x) => x !== eq) : [...prev, eq]))
                }
              />
            ))}
          </View>
          <T variant="label" dim style={{ marginTop: spacing.lg, marginBottom: 10 }}>
            Difficulty
          </T>
          <View style={styles.filterChips}>
            {['Beginner', 'Intermediate', 'Advanced'].map((d) => (
              <Chip
                key={d}
                label={d}
                selected={difficulty.includes(d)}
                onPress={() =>
                  setDifficulty((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
                }
              />
            ))}
          </View>
          <Row style={{ marginTop: spacing.xl, gap: spacing.sm }}>
            <Pressable onPress={clearAll} style={styles.clearBtn}>
              <T variant="bodySemi" dim>
                Clear All
              </T>
            </Pressable>
            <Pressable
              onPress={() => setFilterOpen(false)}
              style={[styles.applyBtn, { backgroundColor: colors.accent }]}>
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

function ExerciseRow({
  exercise,
  fav,
  onFav,
  onPress,
}: {
  exercise: Exercise;
  fav: boolean;
  onFav: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
      <ExerciseThumb exerciseId={exercise.id} muscle={exercise.muscleGroup} size={54} />
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
        <Ionicons
          name={fav ? 'bookmark' : 'bookmark-outline'}
          size={20}
          color={fav ? colors.accent : colors.textMuted}
        />
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
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
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
