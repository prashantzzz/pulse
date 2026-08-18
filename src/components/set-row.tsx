import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius } from '../theme';
import type { SetType } from '../types';
import { T } from './Text';

export function SetTypeTag({ type }: { type: SetType }) {
  const colors2: Record<SetType, { label: string; color: string }> = {
    warmup: { label: 'Warm-up', color: colors.teal },
    working: { label: '', color: colors.accent },
    failure: { label: 'AMRAP', color: colors.orange },
    drop: { label: 'Drop', color: colors.purple },
    cooldown: { label: 'Cool', color: colors.cyan },
    cardio: { label: 'Cardio', color: colors.orange },
  };
  const c = colors2[type];
  if (type === 'working') return null;
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: `${c.color}22` }}>
      <T variant="micro" style={{ color: c.color, fontSize: 10 }}>
        {c.label}
      </T>
    </View>
  );
}

/**
 * One row in the active-workout exercise list.
 * Big touch targets; tap opens the set logger.
 */
export function SetRow({
  index,
  setType,
  weight,
  reps,
  prev,
  completed,
  onTap,
  onToggle,
  isNext,
}: {
  index: number;
  setType: SetType;
  weight: number | null;
  reps: number | null;
  prev?: { weightKg: number | null; reps: number | null };
  completed: boolean;
  onTap: () => void;
  onToggle?: () => void;
  isNext?: boolean;
}) {
  return (
    <Pressable
      onPress={onTap}
      style={({ pressed }) => [
        styles.row,
        completed && { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft2 },
        isNext && !completed && { borderColor: colors.accent, borderWidth: 1.2 },
        pressed && { opacity: 0.85 },
      ]}>
      <View style={{ width: 64, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <T variant="smallMedium" muted style={{ fontSize: 13 }}>
          {completed ? (
            <Ionicons name="checkmark" size={16} color={colors.accent} />
          ) : (
            `Set ${index}`
          )}
        </T>
        {/* warm-up already reads in the label below, so no pill (avoids overlap) */}
        {setType !== 'warmup' ? <SetTypeTag type={setType} /> : null}
      </View>

      <View style={{ flex: 1 }}>
        <T variant="small" dim style={{ fontSize: 12 }}>
          {setType === 'warmup' ? 'Warm-up' : 'Working set'}
        </T>
      </View>

      <Pressable onPress={onToggle} hitSlop={8} style={styles.toggle}>
        {completed ? (
          <View style={[styles.doneCircle, { backgroundColor: colors.accent }]}>
            <Ionicons name="checkmark" size={16} color={colors.bg} />
          </View>
        ) : (
          <View style={styles.openCircle}>
            {/* hollow tick — signals an incomplete set waiting to be logged */}
            <Ionicons name="checkmark-outline" size={16} color={colors.textDim} />
          </View>
        )}
      </Pressable>

      <View style={styles.values}>
        {/* unlogged sets preview the last workout's numbers as a dim target */}
        <T variant="numSm" style={{ color: completed ? colors.text : weight != null ? colors.text : colors.textMuted, minWidth: 34, textAlign: 'right' }}>
          {weight != null ? weight : prev?.weightKg ?? '–'}
        </T>
        <T variant="numSm" style={{ color: completed ? colors.accent : reps != null ? colors.text : colors.textMuted, minWidth: 22, textAlign: 'right' }}>
          {reps != null ? reps : prev?.reps ?? '–'}
        </T>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
  },
  toggle: { padding: 4 },
  doneCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  values: { flexDirection: 'row', alignItems: 'center', gap: 10, width: 84, justifyContent: 'flex-end' },
});
