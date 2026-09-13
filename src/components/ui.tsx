import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Activity,
  Apple,
  Dumbbell,
  Flame,
  Footprints,
  Trophy,
  Weight,
  Zap,
} from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { hapticsLight, hapticsWarning } from '../lib/haptics';
import { useAnimatedValue } from '../lib/useAnimatedValue';
import { accentTint, colors, gradients, layout, radius, shadows, spacing, useAccent } from '../theme';
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
  const scale = useAnimatedValue(1);
  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  const height = size === 'lg' ? 56 : size === 'sm' ? 38 : 48;
  const labelSize = size === 'lg' ? 17 : size === 'sm' ? 13 : 15;

  const handlePress = () => {
    if (disabled) return;
    if (variant === 'primary') {
      hapticsLight();
    } else if (variant === 'danger') {
      hapticsWarning();
    }
    onPress?.();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, full && styles.full]}>
      <Pressable
        onPress={handlePress}
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
// Horizontal gesture lock for nested carousels and horizontal scrollables
// Prevents screen-level tab swipe responders from intercepting inner carousel swipes
// ---------------------------------------------------------------------------

let isInnerHorizontalActive = false;

export function setInnerHorizontalActive(active: boolean) {
  isInnerHorizontalActive = active;
}

export function isInnerHorizontalSwiping() {
  return isInnerHorizontalActive;
}

export const horizontalSwipeLockProps = {
  onTouchStart: () => setInnerHorizontalActive(true),
  onTouchEnd: () => setInnerHorizontalActive(false),
  onTouchCancel: () => setInnerHorizontalActive(false),
  onScrollBeginDrag: () => setInnerHorizontalActive(true),
  onScrollEndDrag: () => setInnerHorizontalActive(false),
  onMomentumScrollBegin: () => setInnerHorizontalActive(true),
  onMomentumScrollEnd: () => setInnerHorizontalActive(false),
  'data-horizontal-scroll': 'true',
};

// ---------------------------------------------------------------------------
// Segmented control
// ---------------------------------------------------------------------------

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
  scrollable,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
  scrollable?: boolean;
}) {
  if (scrollable || options.length > 4) {
    return (
      <View
        style={{ marginHorizontal: -spacing.md, paddingHorizontal: spacing.md }}
        {...({ 'data-horizontal-scroll': 'true' } as any)}>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          {...(horizontalSwipeLockProps as any)}
          contentContainerStyle={[styles.segmentedScroll, style]}>
          {options.map((opt) => {
            const active = opt === value;
            return (
              <Pressable
                key={opt}
                onPress={() => onChange(opt)}
                style={[styles.segmentScrollItem, active && { backgroundColor: colors.accent }]}>
                <T
                  variant="smallSemi"
                  numberOfLines={1}
                  style={{ color: active ? colors.bg : colors.textDim, fontSize: 13 }}>
                  {opt}
                </T>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

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
              numberOfLines={1}
              style={{ color: active ? colors.bg : colors.textDim, fontSize: 13 }}>
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

/**
 * Modern Ambient Top Light Glow — subtle, refined theme-reactive halo
 * concentrated at the top-center of the screen. 100% pixel-synchronized across Native & Web.
 */
export function AmbientTopGlow({ height = 240 }: { height?: number }) {
  const accentKey = useAccent();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Concentrated Top-Center Linear Gradient Wash */}
      <LinearGradient
        colors={[accentTint(colors.accent, 0.16), accentTint(colors.accent, 0.03), 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.ambientTopWash, { height }]}
      />
      {/* Concentrated Top-Center Radial Glow Orb */}
      <Svg width="100%" height={height} style={styles.ambientTopSvg}>
        <Defs>
          <RadialGradient
            id={`pulse-radial-glow-${accentKey}`}
            cx="50%"
            cy="0%"
            rx="45%"
            ry="80%"
            fx="50%"
            fy="0%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.22" />
            <Stop offset="35%" stopColor={colors.accent} stopOpacity="0.08" />
            <Stop offset="70%" stopColor={colors.accent} stopOpacity="0.015" />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#pulse-radial-glow-${accentKey})`} />
      </Svg>
    </View>
  );
}

export function Screen({
  children,
  scroll,
  style,
  contentStyle,
  edges = ['top'],
  scrollProps,
  onSwipeLeft,
  onSwipeRight,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  scrollProps?: ScrollViewProps;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}) {
  // re-render on accent change; the screen component itself also subscribes
  // (see useAccent) so its `children` elements are recreated with fresh colors
  const accentKey = useAccent();
  const insets = useSafeAreaInsets();
  const Wrapper = scroll ? ScrollView : View;

  // Swipe gesture detection (Native + Web)
  // Configured to NEVER hijack touches from nested horizontal scrollviews or vertical scrolls
  const swipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        if (isInnerHorizontalActive) return false;
        if (!onSwipeLeft && !onSwipeRight) return false;
        // Flexible horizontal motion (>25px, 1.25x greater than dy, noticeable velocity)
        // allows comfortable thumb arc/diagonal gestures without triggering on vertical scrolls
        const isHorizontal = Math.abs(g.dx) > 25 && Math.abs(g.dx) > Math.abs(g.dy) * 1.25;
        const hasVelocity = Math.abs(g.vx) > 0.15 || Math.abs(g.dx) > 40;
        return isHorizontal && hasVelocity;
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: (_, g) => {
        if (isInnerHorizontalActive) return;
        const dx = g.dx;
        const dy = g.dy;
        const vx = g.vx;
        const isHorizontal = Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.2;
        if (isHorizontal) {
          if (dx < -35 && (vx < -0.15 || dx < -55)) {
            if (onSwipeLeft) {
              hapticsLight();
              onSwipeLeft();
            }
          } else if (dx > 35 && (vx > 0.15 || dx > 55)) {
            if (onSwipeRight) {
              hapticsLight();
              onSwipeRight();
            }
          }
        }
      },
    })
  ).current;

  // Web-specific touch event handlers with DOM tree hierarchy inspection
  const touchStartRef = useRef<{ x: number; y: number; t: number; isHorizontalChild: boolean } | null>(null);

  const isInsideHorizontalElement = (target: HTMLElement | null): boolean => {
    let el: HTMLElement | null = target;
    while (el) {
      if (
        el.getAttribute?.('data-horizontal-scroll') === 'true' ||
        el.classList?.contains?.('horizontal-scroll') ||
        el.getAttribute?.('role') === 'tablist' ||
        (el.scrollWidth > el.clientWidth &&
          typeof window !== 'undefined' &&
          (window.getComputedStyle(el).overflowX === 'scroll' || window.getComputedStyle(el).overflowX === 'auto'))
      ) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  };

  const handleWebTouchStart = (e: any) => {
    if (Platform.OS !== 'web' || (!onSwipeLeft && !onSwipeRight)) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    const target = e.target as HTMLElement;
    const isHorizontalChild = isInnerHorizontalActive || isInsideHorizontalElement(target);
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now(), isHorizontalChild };
  };

  const handleWebTouchEnd = (e: any) => {
    if (Platform.OS !== 'web' || (!onSwipeLeft && !onSwipeRight)) return;
    const start = touchStartRef.current;
    if (!start || start.isHorizontalChild || isInnerHorizontalActive) return;
    const touch = e.changedTouches?.[0];
    if (!touch) return;
    const target = e.target as HTMLElement;
    if (isInsideHorizontalElement(target)) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const dt = Date.now() - start.t;
    touchStartRef.current = null;

    if (dt < 700 && Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      if (dx < 0 && onSwipeLeft) {
        hapticsLight();
        onSwipeLeft();
      } else if (dx > 0 && onSwipeRight) {
        hapticsLight();
        onSwipeRight();
      }
    }
  };

  const panHandlers = onSwipeLeft || onSwipeRight ? swipeResponder.panHandlers : {};

  return (
    <SafeAreaView
      style={[styles.screen, style]}
      edges={edges}
      {...panHandlers}
      {...(Platform.OS === 'web' && (onSwipeLeft || onSwipeRight)
        ? {
            onTouchStart: handleWebTouchStart,
            onTouchEnd: handleWebTouchEnd,
          }
        : {})}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Subtle, concentrated Ambient Top Light Glow in selected Theme Color */}
        <AmbientTopGlow />

        {/* Scattered mini Lucide gym doodles in a tasteful polka-dot scatter */}
        <View style={styles.doodleOverlay}>
          {/* Row 1 */}
          <View style={[styles.doodleItem, { top: '3%', left: '8%', transform: [{ rotate: '-15deg' }] }]}>
            <Dumbbell size={20} color={colors.accent} strokeWidth={1.6} />
          </View>
          <View style={[styles.doodleItem, { top: '3%', left: '48%', transform: [{ rotate: '10deg' }] }]}>
            <Zap size={19} color={colors.accent} strokeWidth={1.6} />
          </View>
          <View style={[styles.doodleItem, { top: '3%', left: '88%', transform: [{ rotate: '-10deg' }] }]}>
            <Flame size={20} color={colors.accent} strokeWidth={1.6} />
          </View>

          {/* Row 2 (staggered) */}
          <View style={[styles.doodleItem, { top: '14%', left: '28%', transform: [{ rotate: '15deg' }] }]}>
            <Activity size={20} color={colors.accent} strokeWidth={1.6} />
          </View>
          <View style={[styles.doodleItem, { top: '14%', left: '72%', transform: [{ rotate: '-12deg' }] }]}>
            <Trophy size={20} color={colors.accent} strokeWidth={1.6} />
          </View>

          {/* Row 3 */}
          <View style={[styles.doodleItem, { top: '25%', left: '10%', transform: [{ rotate: '12deg' }] }]}>
            <Weight size={20} color={colors.accent} strokeWidth={1.6} />
          </View>
          <View style={[styles.doodleItem, { top: '25%', left: '50%', transform: [{ rotate: '-18deg' }] }]}>
            <Dumbbell size={20} color={colors.accent} strokeWidth={1.6} />
          </View>
          <View style={[styles.doodleItem, { top: '25%', left: '90%', transform: [{ rotate: '14deg' }] }]}>
            <Footprints size={21} color={colors.accent} strokeWidth={1.6} />
          </View>

          {/* Row 4 (staggered) */}
          <View style={[styles.doodleItem, { top: '36%', left: '30%', transform: [{ rotate: '-10deg' }] }]}>
            <Apple size={19} color={colors.accent} strokeWidth={1.6} />
          </View>
          <View style={[styles.doodleItem, { top: '36%', left: '70%', transform: [{ rotate: '15deg' }] }]}>
            <Zap size={19} color={colors.accent} strokeWidth={1.6} />
          </View>

          {/* Row 5 */}
          <View style={[styles.doodleItem, { top: '47%', left: '12%', transform: [{ rotate: '12deg' }] }]}>
            <Flame size={20} color={colors.accent} strokeWidth={1.6} />
          </View>
          <View style={[styles.doodleItem, { top: '47%', left: '52%', transform: [{ rotate: '-15deg' }] }]}>
            <Activity size={20} color={colors.accent} strokeWidth={1.6} />
          </View>
          <View style={[styles.doodleItem, { top: '47%', left: '88%', transform: [{ rotate: '10deg' }] }]}>
            <Weight size={20} color={colors.accent} strokeWidth={1.6} />
          </View>

          {/* Row 6 (staggered) */}
          <View style={[styles.doodleItem, { top: '58%', left: '28%', transform: [{ rotate: '-12deg' }] }]}>
            <Trophy size={20} color={colors.accent} strokeWidth={1.6} />
          </View>
          <View style={[styles.doodleItem, { top: '58%', left: '72%', transform: [{ rotate: '18deg' }] }]}>
            <Dumbbell size={20} color={colors.accent} strokeWidth={1.6} />
          </View>

          {/* Row 7 */}
          <View style={[styles.doodleItem, { top: '69%', left: '10%', transform: [{ rotate: '-10deg' }] }]}>
            <Footprints size={21} color={colors.accent} strokeWidth={1.6} />
          </View>
          <View style={[styles.doodleItem, { top: '69%', left: '50%', transform: [{ rotate: '12deg' }] }]}>
            <Apple size={19} color={colors.accent} strokeWidth={1.6} />
          </View>
          <View style={[styles.doodleItem, { top: '69%', left: '90%', transform: [{ rotate: '-15deg' }] }]}>
            <Zap size={19} color={colors.accent} strokeWidth={1.6} />
          </View>

          {/* Row 8 (staggered) */}
          <View style={[styles.doodleItem, { top: '80%', left: '30%', transform: [{ rotate: '14deg' }] }]}>
            <Flame size={20} color={colors.accent} strokeWidth={1.6} />
          </View>
          <View style={[styles.doodleItem, { top: '80%', left: '70%', transform: [{ rotate: '-12deg' }] }]}>
            <Activity size={20} color={colors.accent} strokeWidth={1.6} />
          </View>

          {/* Row 9 */}
          <View style={[styles.doodleItem, { top: '91%', left: '12%', transform: [{ rotate: '12deg' }] }]}>
            <Weight size={20} color={colors.accent} strokeWidth={1.6} />
          </View>
          <View style={[styles.doodleItem, { top: '91%', left: '52%', transform: [{ rotate: '-15deg' }] }]}>
            <Trophy size={20} color={colors.accent} strokeWidth={1.6} />
          </View>
          <View style={[styles.doodleItem, { top: '91%', left: '88%', transform: [{ rotate: '10deg' }] }]}>
            <Dumbbell size={20} color={colors.accent} strokeWidth={1.6} />
          </View>
        </View>
      </View>
      <Wrapper
        {...(scrollProps ?? {})}
        style={scroll ? undefined : styles.screenBody}
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
  onBack,
  right,
  rightLabel = 'Action',
  onRight,
  titleColor,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  right?: IonName;
  /** accessibility label for the right-hand icon button */
  rightLabel?: string;
  onRight?: () => void;
  titleColor?: string;
}) {
  const router = useRouter();
  const handleBackPress = onBack ?? (() => router.back());
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>
        {back ? (
          <Pressable onPress={handleBackPress} hitSlop={10} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Go back">
            <Icon name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.headerCenter}>
        {title ? (
          <T variant="h2" style={{ color: titleColor ?? colors.text, textAlign: 'center' }} numberOfLines={1}>
            {title}
          </T>
        ) : null}
        {subtitle ? (
          <T variant="small" dim center style={{ marginTop: 2 }}>
            {subtitle}
          </T>
        ) : null}
      </View>
      <View style={styles.headerSide}>
        {right ? (
          <Pressable onPress={onRight} hitSlop={10} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel={rightLabel}>
            <Icon name={right} size={22} color={colors.text} />
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
// Toggle (Theme-Specific Switch)
// ---------------------------------------------------------------------------

export interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  thumbActiveColor?: string;
  thumbInactiveColor?: string;
  size?: 'sm' | 'md';
  accessibilityLabel?: string;
}

export function Toggle({
  value,
  onValueChange,
  disabled = false,
  activeColor,
  inactiveColor,
  thumbActiveColor,
  thumbInactiveColor,
  size = 'md',
  accessibilityLabel,
}: ToggleProps) {
  useAccent();
  const isSm = size === 'sm';
  const trackWidth = isSm ? 42 : 50;
  const trackHeight = isSm ? 24 : 28;
  const thumbSize = isSm ? 18 : 22;
  const padding = 3;
  const travelDistance = trackWidth - thumbSize - padding * 2;

  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      bounciness: 2,
      speed: 24,
    }).start();
  }, [value, anim]);

  const handlePress = () => {
    if (disabled) return;
    hapticsLight();
    onValueChange(!value);
  };

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, travelDistance],
  });

  const bgActive = activeColor || colors.accent;
  const bgInactive = inactiveColor || colors.surface4;
  const knobActive = thumbActiveColor || colors.bg;
  const knobInactive = thumbInactiveColor || colors.textMuted;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.toggleTrack,
        {
          width: trackWidth,
          height: trackHeight,
          borderRadius: trackHeight / 2,
          padding,
          backgroundColor: value ? bgActive : bgInactive,
          borderColor: value ? bgActive : colors.borderBright,
          opacity: disabled ? 0.5 : 1,
        },
      ]}>
      <Animated.View
        style={[
          styles.toggleThumb,
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: value ? knobActive : knobInactive,
            transform: [{ translateX }],
          },
        ]}
      />
    </Pressable>
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
  segmentedScroll: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentScrollItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
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
  // non-scroll screens that own an inner ScrollView need a bounded height
  screenBody: { flex: 1 },
  scrollContent: { paddingHorizontal: layout.screenPad, paddingTop: layout.screenTopPad },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPad,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
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
    paddingHorizontal: 7,
    paddingVertical: 3,
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
  doodleOverlay: {
    ...(StyleSheet.absoluteFill as object),
    overflow: 'hidden',
  },
  doodleItem: {
    position: 'absolute',
    opacity: 0.12,
  },
  ambientTopWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  ambientTopSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  toggleTrack: {
    justifyContent: 'center',
    borderWidth: 1,
  },
  toggleThumb: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
});

export {
  animateLayout,
  useAccordionAnimation,
  AnimatedChevron,
  CollapsibleContent,
  CollapsibleCard,
} from './collapsible';
