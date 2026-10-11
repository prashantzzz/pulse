import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { PROMO } from '../promo/config';
import { EASE, useReducedMotion } from '../promo/motion';
import { colors, radius } from '../theme';
import type { SetType } from '../types';
import { T } from './Text';
import { usePulse } from '../store/useStore';
import { formatUserWeight, formatUserWeightWithUnit } from '../lib/units';


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
  isBodyweight = false,
  weightUnit: weightUnitProp,
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
  isBodyweight?: boolean;
  weightUnit?: 'kg' | 'lbs';
}) {
  const storeUnit = usePulse((s) => s.weightUnit);
  const userUnit = weightUnitProp ?? storeUnit;

  // Promo: completing a set pops the check indicator and flashes the row.
  const pop = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const wasCompleted = useRef(completed);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!PROMO.enabled || reduced) {
      wasCompleted.current = completed;
      return;
    }
    if (completed && !wasCompleted.current) {
      pop.setValue(0.5);
      flash.setValue(1);
      Animated.spring(pop, { toValue: 1, damping: 10, stiffness: 220, mass: 0.65, useNativeDriver: true }).start();
      Animated.timing(flash, { toValue: 0, duration: 460, easing: EASE.entrance, useNativeDriver: false }).start();
    }
    wasCompleted.current = completed;
  }, [completed, pop, flash, reduced]);

  const handleRowPress = () => {
    if (!completed && onToggle) {
      onToggle();
    } else {
      onTap();
    }
  };

  const prevDisplay =
    !isBodyweight && prev?.weightKg != null && prev.weightKg > 0 && prev?.reps != null
      ? `${formatUserWeightWithUnit(prev.weightKg, userUnit)} × ${prev.reps}`
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
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius.md,
            backgroundColor: colors.accent,
            opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16] }),
          },
        ]}
      />
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
        {weight != null && weight > 0 ? (
          <>
            <T
              variant="numSm"
              style={{
                color: completed ? colors.accent : colors.text,
                minWidth: 32,
                textAlign: 'right',
                fontSize: 13,
              }}>
              {formatUserWeight(weight, userUnit)}
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
          </>
        ) : (
          <T
            variant="numSm"
            style={{
              color: completed ? colors.accent : reps != null ? colors.text : colors.textMuted,
              minWidth: 40,
              textAlign: 'right',
              fontSize: 13,
            }}>
            {reps != null ? `${reps} reps` : '–'}
          </T>
        )}
      </Pressable>

      <Pressable onPress={onToggle ?? onTap} hitSlop={10} style={styles.toggle}>
        {completed ? (
          <Animated.View style={{ transform: [{ scale: pop }] }}>
            <View style={[styles.doneCircle, { backgroundColor: colors.accent }]}>
              <Ionicons name="checkmark" size={16} color={colors.bg} />
            </View>
          </Animated.View>
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
