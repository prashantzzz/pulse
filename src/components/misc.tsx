import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, gradients, radius, shadows, spacing } from '../theme';
import type { IonName } from './ui';
import { T } from './Text';

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

const AVATAR_GRADIENTS = ['accent', 'emerald', 'teal', 'cyan', 'purple', 'orange', 'gold'] as const;

export function Avatar({
  name,
  size = 44,
  hue,
  showRing,
}: {
  name: string;
  size?: number;
  hue?: number;
  showRing?: boolean;
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const g = AVATAR_GRADIENTS[(hue ?? name.length * 7) % AVATAR_GRADIENTS.length];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        padding: showRing ? 2 : 0,
        borderWidth: showRing ? 2 : 0,
        borderColor: colors.accent,
      }}>
      <LinearGradient
        colors={[...gradients[g]]}
        style={{
          flex: 1,
          borderRadius: (size - 4) / 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <T variant="bodySemi" style={{ color: '#0A0B0D', fontSize: size * 0.34, fontWeight: '700' }}>
          {initials}
        </T>
      </LinearGradient>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Bottom sheet
// ---------------------------------------------------------------------------

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  height,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: number;
}) {
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slide.setValue(0);
      Animated.spring(slide, { toValue: 1, useNativeDriver: true, damping: 20, stiffness: 260 }).start();
    }
  }, [visible, slide]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            height ? { height } : { maxHeight: '82%' },
            Platform.OS === 'web' && { boxShadow: `0 12px 32px rgba(0,0,0,0.55), 0 0 24px ${colors.accent}1F` },
            { transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }] },
          ]}>
          <View style={styles.sheetHandle} />
          {title ? (
            <T variant="h3" style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
              {title}
            </T>
          ) : null}
          <View style={{ padding: spacing.lg, flex: 1 }}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  decimals = 0,
  unit,
  size = 'lg',
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  decimals?: number;
  unit?: string;
  size?: 'md' | 'lg';
}) {
  const bump = (dir: 1 | -1) => {
    const next = Math.min(max, Math.max(min, Math.round((value + dir * step) * 10) / 10));
    onChange(next);
  };
  const btnSize = size === 'lg' ? 52 : 42;
  const fmt = (v: number) => (decimals ? v.toFixed(decimals) : `${v % 1 === 0 ? v : v.toFixed(1)}`);
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => bump(-1)}
        style={({ pressed }) => [styles.stepperBtn, { width: btnSize, height: btnSize }, pressed && { opacity: 0.7 }]}>
        <Ionicons name="remove" size={26} color={colors.text} />
      </Pressable>
      <View style={{ alignItems: 'center', minWidth: 90 }}>
        <T variant={size === 'lg' ? 'h1' : 'h3'} style={{ color: colors.accent }}>
          {fmt(value)}
        </T>
        {unit ? (
          <T variant="micro" muted>
            {unit}
          </T>
        ) : null}
      </View>
      <Pressable
        onPress={() => bump(1)}
        style={({ pressed }) => [styles.stepperBtn, { width: btnSize, height: btnSize }, pressed && { opacity: 0.7 }]}>
        <Ionicons name="add" size={26} color={colors.text} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function EmptyState({
  icon,
  title,
  body,
  cta,
  onCta,
}: {
  icon: IonName;
  title: string;
  body: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <LinearGradient
        colors={[...gradients.charcoal]}
        style={styles.emptyIconWrap}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={[styles.emptyIconInner, { borderColor: colors.accentSoft2 }]}>
          <Ionicons name={icon} size={34} color={colors.accent} />
        </View>
      </LinearGradient>
      <T variant="h3" center style={{ marginTop: spacing.md }}>
        {title}
      </T>
      <T variant="body" dim center style={{ marginTop: spacing.xs, maxWidth: 280 }}>
        {body}
      </T>
      {cta && onCta ? (
        <Pressable onPress={onCta} style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.85 }]}>
          <LinearGradient colors={[...gradients.accent]} style={styles.emptyCtaGrad}>
            <T variant="bodySemi" style={{ color: colors.bg }}>
              {cta}
            </T>
          </LinearGradient>
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

let toastListener: ((msg: string) => void) | null = null;

export function toast(msg: string) {
  toastListener?.(msg);
}

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    toastListener = (m) => {
      setMsg(m);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setMsg(null));
      }, 2200);
    };
    return () => {
      toastListener = null;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [opacity]);

  if (!msg) return null;
  return (
    <Animated.View style={[styles.toast, Platform.OS === 'web' && { boxShadow: `0 12px 32px rgba(0,0,0,0.55), 0 0 24px ${colors.accent}1F` }, { opacity, pointerEvents: 'none' }]}>
      <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
      <T variant="smallMedium" style={{ color: colors.text, flexShrink: 1 }}>
        {msg}
      </T>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function Skeleton({ width, height, radius = 10, style }: { width?: number | `${number}%`; height: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.9, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={[{ width: width ?? '100%', height, borderRadius: radius, backgroundColor: colors.surface3, opacity: pulse }, style]}
    />
  );
}

// ---------------------------------------------------------------------------
// Achievement badge
// ---------------------------------------------------------------------------

export function AchievementBadge({
  icon,
  title,
  desc,
  earned,
  progress,
  size = 72,
}: {
  icon: IonName;
  title: string;
  desc: string;
  earned?: boolean;
  progress?: number;
  size?: number;
}) {
  return (
    <View style={{ alignItems: 'center', width: size + 24 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: earned ? colors.accent : colors.border,
          opacity: earned ? 1 : 0.55,
        }}>
        {earned ? (
          <LinearGradient colors={[...gradients.charcoal]} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface2 }]} />
        )}
        <Ionicons name={icon} size={size * 0.42} color={earned ? colors.accent : colors.textMuted} />
        {earned ? (
          <View
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: size,
              backgroundColor: `${colors.accent}1F`,
            }}
          />
        ) : null}
      </View>
      <T variant="smallSemi" center style={{ marginTop: 8, fontSize: 12 }}>
        {title}
      </T>
      <T variant="micro" muted center style={{ marginTop: 2, fontSize: 10 }}>
        {desc}
      </T>
      {!earned && progress != null ? (
        <View style={[styles.badgeProgress, { width: size * 0.8 }]}>
          <View style={[styles.badgeProgressFill, { width: `${Math.min(100, progress * 100)}%`, backgroundColor: colors.accent }]} />
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Animated counter
// ---------------------------------------------------------------------------

export function AnimatedNumber({
  value,
  format,
  variant = 'num',
}: {
  value: number;
  format?: (v: number) => string;
  variant?: 'num' | 'numLg' | 'numSm';
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    anim.stopAnimation();
    const listener = anim.addListener(({ value: v }) => setDisplay(v));
    Animated.timing(anim, {
      toValue: value,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(listener);
  }, [value, anim]);

  return <T variant={variant}>{format ? format(display) : `${Math.round(display)}`}</T>;
}

// ---------------------------------------------------------------------------
// styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.surface2,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingBottom: 24,
    ...(shadows.float as object),
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderBright,
    alignSelf: 'center',
    marginTop: 10,
  },

  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  stepperBtn: {
    borderRadius: 18,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderBright,
  },

  empty: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emptyIconInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  emptyCta: { marginTop: spacing.lg, borderRadius: 999, overflow: 'hidden' },
  emptyCtaGrad: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 999 },

  toast: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface3,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderBright,
    maxWidth: 320,
    zIndex: 1000,
    ...(shadows.float as object),
  },

  badgeProgress: { height: 3, borderRadius: 2, backgroundColor: colors.surface3, marginTop: 6, overflow: 'hidden' },
  badgeProgressFill: { height: '100%' },
});
