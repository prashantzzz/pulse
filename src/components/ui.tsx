import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, gradients, radius, shadows, spacing, type, useAccent } from '../theme';
import { T } from './Text';

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

export type IonName = React.ComponentProps<typeof Ionicons>['name'];

export function Icon({
  name,
  size = 22,
  color = colors.text,
  style,
}: {
  name: IonName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'dark';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  size = 'md',
  disabled,
  style,
  full,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IonName;
  iconRight?: IonName;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  full?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  const height = size === 'lg' ? 56 : size === 'sm' ? 38 : 48;
  const labelSize = size === 'lg' ? 17 : size === 'sm' ? 13 : 15;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, full && styles.full]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={({ pressed }) => [
          styles.button,
          { height, opacity: pressed ? 0.85 : disabled ? 0.4 : 1 },
          variant === 'primary' && { backgroundColor: colors.accent },
          variant === 'outline' && { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent },
          variant === 'ghost' && styles.btnGhost,
          variant === 'danger' && styles.btnDanger,
          variant === 'dark' && styles.btnDark,
          style,
        ]}>
        {variant === 'primary' ? (
          <LinearGradient
            colors={[...gradients.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]}
          />
        ) : null}
        {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 20} color={variant === 'primary' ? colors.bg : colors.text} /> : null}
        <T
          variant="bodySemi"
          style={{
            fontSize: labelSize,
            color: variant === 'primary' ? colors.bg : variant === 'ghost' ? colors.accent : colors.text,
          }}>
          {label}
        </T>
        {iconRight ? <Icon name={iconRight} size={size === 'sm' ? 16 : 20} color={variant === 'primary' ? colors.bg : colors.text} /> : null}
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Chip / pill
// ---------------------------------------------------------------------------

export function Chip({
  label,
  selected,
  onPress,
  icon,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IonName;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: colors.accent, borderColor: colors.accent },
        pressed && { opacity: 0.8 },
        style,
      ]}>
      {icon ? (
        <Icon name={icon} size={14} color={selected ? colors.bg : colors.textDim} />
      ) : null}
      <T
        variant="smallMedium"
        style={{ color: selected ? colors.bg : colors.textDim, fontSize: 13 }}>
        {label}
      </T>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Segmented control
// ---------------------------------------------------------------------------

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.segmented, style]}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.segment, active && { backgroundColor: colors.accent }]}>
            <T
              variant="smallSemi"
              style={{ color: active ? colors.bg : colors.textDim, fontSize: 12.5 }}>
              {opt}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export function Card({
  children,
  style,
  gradient,
  padded = true,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gradient?: keyof typeof gradients;
  padded?: boolean;
  onPress?: () => void;
}) {
  const inner = (
    <View style={[styles.card, padded && { padding: spacing.md }, gradient && styles.cardGradient, style]}>
      {gradient ? (
        <LinearGradient colors={[...gradients[gradient]]} style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]} />
      ) : null}
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}

// ---------------------------------------------------------------------------
// Screen scaffold + headers
// ---------------------------------------------------------------------------

export function Screen({
  children,
  scroll,
  style,
  contentStyle,
  edges = ['top'],
  scrollProps,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  scrollProps?: ScrollViewProps;
}) {
  // re-render this screen's whole subtree the moment the accent changes so
  // every `colors.*` / `gradients.*` read below picks up the new theme live
  useAccent();
  const insets = useSafeAreaInsets();
  const Wrapper = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={[styles.screen, style]} edges={edges}>
      <Wrapper
        {...(scrollProps ?? {})}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { paddingBottom: insets.bottom + 40 },
          scroll && styles.scrollContent,
          contentStyle,
        ]}>
        {children}
      </Wrapper>
    </SafeAreaView>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  back,
  right,
  onRight,
  titleColor,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: IonName;
  onRight?: () => void;
  titleColor?: string;
}) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>
        {back ? (
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
            <Icon name="chevron-back" size={22} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.headerCenter}>
        <T variant="h2" style={{ color: titleColor, textAlign: 'center' }} numberOfLines={1}>
          {title}
        </T>
        {subtitle ? (
          <T variant="small" dim center style={{ marginTop: 2 }}>
            {subtitle}
          </T>
        ) : null}
      </View>
      <View style={styles.headerSide}>
        {right ? (
          <Pressable onPress={onRight} hitSlop={10} style={styles.headerBtn}>
            <Icon name={right} size={22} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

export function Section({
  title,
  action,
  onAction,
  children,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.section, style]}>
      <View style={styles.sectionRow}>
        <T variant="h3">{title}</T>
        {action ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <T variant="smallMedium" accent>
              {action}
            </T>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

export function Tag({ label, color = colors.accent, bg }: { label: string; color?: string; bg?: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: bg ?? `${color}1F` }]}>
      <T variant="micro" style={{ color, fontSize: 11, fontWeight: '600' }}>
        {label}
      </T>
    </View>
  );
}

export function Stat({
  label,
  value,
  sub,
  icon,
  accent,
  big,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: IonName;
  accent?: boolean;
  big?: boolean;
}) {
  return (
    <View style={styles.stat}>
      {icon ? (
        <View style={styles.statIcon}>
          <Icon name={icon} size={16} color={accent ? colors.accent : colors.textDim} />
        </View>
      ) : null}
      <T variant={big ? 'num' : 'numSm'} style={{ color: accent ? colors.accent : colors.text }}>
        {value}
      </T>
      <T variant="micro" muted style={{ marginTop: 2, fontSize: 11 }}>
        {label}
      </T>
      {sub ? (
        <T variant="micro" style={{ color: accent ? colors.accent : colors.textMuted, fontSize: 10, marginTop: 1 }}>
          {sub}
        </T>
      ) : null}
    </View>
  );
}

export function ProgressBar({
  value,
  color = colors.accent,
  height = 6,
  style,
}: {
  value: number; // 0-100
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.progressTrack, { height }, style]}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

// ---------------------------------------------------------------------------
// Row helper
// ---------------------------------------------------------------------------

export function Row({
  children,
  gap = spacing.sm,
  align = 'center',
  style,
  wrap,
}: {
  children: React.ReactNode;
  gap?: number;
  align?: 'center' | 'flex-start' | 'flex-end' | 'space-between';
  style?: StyleProp<ViewStyle>;
  wrap?: boolean;
}) {
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap },
        align === 'space-between' && { justifyContent: 'space-between' },
        wrap && { flexWrap: 'wrap' },
        style,
      ]}>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch' },
  button: {
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  btnGhost: { backgroundColor: 'transparent' },
  btnDanger: { backgroundColor: colors.red },
  btnDark: { backgroundColor: colors.surface3 },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    padding: 4,
    gap: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.pill,
    alignItems: 'center',
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...(shadows.card as object),
  },
  cardGradient: { backgroundColor: 'transparent', borderColor: 'transparent' },

  screen: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  headerSide: { width: 44, alignItems: 'flex-start' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: { marginTop: spacing.xl },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },

  stat: { flex: 1 },
  statIcon: { marginBottom: 4 },

  progressTrack: {
    backgroundColor: colors.surface3,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.pill },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
});
