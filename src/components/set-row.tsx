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
    <View style={{ paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 6, backgroundColor: `${c.color}22` }}>
      <T variant="micro" style={{ color: c.color, fontSize: 9 }}>
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
  const handleRowPress = () => {
    if (!completed && onToggle) {
      onToggle();
    } else {
      onTap();
    }
  };

  const prevDisplay =
    prev?.weightKg != null && prev.weightKg > 0 && prev?.reps != null
      ? `${prev.weightKg} kg × ${prev.reps}`
      : prev?.reps != null
        ? `${prev.reps} reps`
        : '—';

  return (
    <Pressable
      onPress={handleRowPress}
      style={({ pressed }) => [
        styles.row,
        completed && { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft2 },
        isNext && !completed && { borderColor: colors.accent, borderWidth: 1.2 },
        pressed && { opacity: 0.85 },
      ]}>
      <View style={{ width: 46, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <T variant="smallMedium" muted style={{ fontSize: 12.5 }} numberOfLines={1}>
          {completed ? (
            <Ionicons name="checkmark" size={16} color={colors.accent} />
          ) : (
            `Set ${index}`
          )}
        </T>
        {setType !== 'warmup' ? <SetTypeTag type={setType} /> : null}
      </View>

      <View style={{ flex: 1, paddingHorizontal: 4 }}>
        <T
          variant="small"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ fontSize: 12, color: prev ? colors.textDim : colors.textMuted }}>
          {prevDisplay}
        </T>
      </View>

      <Pressable onPress={onTap} hitSlop={8} style={styles.values}>
        <T
          variant="numSm"
          style={{
            color: completed ? colors.accent : weight != null ? colors.text : colors.textMuted,
            minWidth: 32,
            textAlign: 'right',
            fontSize: 13,
          }}>
          {weight != null ? `${weight}k` : '–'}
        </T>
        <T variant="micro" muted style={{ fontSize: 11 }}>
          ×
        </T>
        <T
          variant="numSm"
          style={{
            color: completed ? colors.accent : reps != null ? colors.text : colors.textMuted,
            minWidth: 20,
            textAlign: 'right',
            fontSize: 13,
          }}>
          {reps != null ? reps : '–'}
        </T>
      </Pressable>

      <Pressable onPress={onToggle ?? onTap} hitSlop={10} style={styles.toggle}>
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
