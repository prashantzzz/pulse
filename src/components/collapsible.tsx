import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { PROMO } from '../promo/config';
import { EASE, useReducedMotion } from '../promo/motion';
import { colors, radius, spacing } from '../theme';
import { T } from './Text';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Hardware-accelerated layout animation trigger for smooth accordion expand/collapse.
 */
export function animateLayout(duration = 240) {
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
  LayoutAnimation.configureNext({
    duration,
    create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    update: { type: LayoutAnimation.Types.easeInEaseOut },
    delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  });
}

/**
 * Custom hook providing smooth rotation and fade/slide interpolations for accordions.
 */
export function useAccordionAnimation(isOpen: boolean, duration = 220) {
  const anim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isOpen ? 1 : 0,
      duration,
      useNativeDriver: true,
    }).start();
  }, [isOpen, duration, anim]);

  const chevronRotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const contentOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const contentTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 0],
  });

  return { anim, chevronRotate, contentOpacity, contentTranslateY };
}

/**
 * Smoothly rotating chevron icon component for collapsible headers.
 */
export function AnimatedChevron({
  isOpen,
  size = 18,
  color = colors.textMuted,
  style,
}: {
  isOpen: boolean;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { chevronRotate } = useAccordionAnimation(isOpen);

  return (
    <Animated.View style={[{ transform: [{ rotate: chevronRotate }] }, style]}>
      <Ionicons name="chevron-down" size={size} color={color} />
    </Animated.View>
  );
}

/**
 * Animated container that smoothly fades, slides and expands children.
 *
 * Web (promo build): animates an explicit measured height, so expand/collapse
 * is a real accordion — LayoutAnimation is a no-op on web. The caller's
 * `style` (gaps/paddings) is applied inside the height container so it
 * animates together with the content.
 * Native / promo off: the original mount + LayoutAnimation behavior.
 */
export function CollapsibleContent({
  isOpen,
  children,
  style,
}: {
  isOpen: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  if (PROMO.enabled && Platform.OS === 'web') {
    return (
      <PromoCollapsibleContent isOpen={isOpen} style={style}>
        {children}
      </PromoCollapsibleContent>
    );
  }
  return (
    <LegacyCollapsibleContent isOpen={isOpen} style={style}>
      {children}
    </LegacyCollapsibleContent>
  );
}

function LegacyCollapsibleContent({
  isOpen,
  children,
  style,
}: {
  isOpen: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { contentOpacity, contentTranslateY } = useAccordionAnimation(isOpen);

  if (!isOpen) return null;

  return (
    <Animated.View
      style={[
        {
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslateY }],
        },
        style,
      ]}>
      {children}
    </Animated.View>
  );
}

/**
 * Web promo implementation: measured-height accordion. Expands from 0 to the
 * content's natural height, then hands height back to the layout (`auto`) so
 * content can grow freely; collapses animate back down before unmounting.
 */
function PromoCollapsibleContent({
  isOpen,
  children,
  style,
}: {
  isOpen: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const [mounted, setMounted] = useState(isOpen);
  const [measured, setMeasured] = useState(0);
  const [settled, setSettled] = useState(isOpen);
  const progress = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  const firstRef = useRef(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    // Initial state already matches the requested open/closed state.
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }

    // Reduced motion: jump straight to the end state.
    if (reduced) {
      if (isOpen) {
        setMounted(true);
        setSettled(true);
        progress.setValue(1);
      } else {
        setSettled(false);
        progress.setValue(0);
        setMounted(false);
        setMeasured(0);
      }
      return;
    }

    if (isOpen) {
      setMounted(true);
      setSettled(false);
      progress.stopAnimation();
      Animated.timing(progress, {
        toValue: 1,
        duration: PROMO.duration.content,
        easing: EASE.entrance,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) setSettled(true);
      });
      return;
    }

    setSettled(false);
    progress.stopAnimation();
    Animated.timing(progress, {
      toValue: 0,
      duration: Math.round(PROMO.duration.content * 0.8),
      easing: EASE.exit,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setMounted(false);
        setMeasured(0);
      }
    });
  }, [isOpen, progress, reduced]);

  useEffect(() => () => progress.stopAnimation(), [progress]);

  if (!mounted) return null;

  return (
    <Animated.View
      style={{
        overflow: 'hidden',
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }),
          },
        ],
        ...(settled
          ? null
          : {
              height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, measured] }),
            }),
      }}>
      <View
        style={style}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - measured) > 0.5) setMeasured(h);
        }}>
        {children}
      </View>
    </Animated.View>
  );
}

/**
 * Global reusable Collapsible Card component with smooth header interactions and content transitions.
 */
export function CollapsibleCard({
  isOpen,
  onToggle,
  headerLeft,
  headerRight,
  children,
  style,
  headerStyle,
}: {
  isOpen: boolean;
  onToggle: () => void;
  headerLeft: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
}) {
  const handleToggle = () => {
    animateLayout();
    onToggle();
  };

  return (
    <View style={[styles.card, style]}>
      <Pressable
        onPress={handleToggle}
        hitSlop={6}
        style={({ pressed }) => [styles.header, headerStyle, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}>
        <View style={{ flex: 1 }}>{headerLeft}</View>
        <View style={styles.headerRight}>
          {headerRight}
          <AnimatedChevron isOpen={isOpen} />
        </View>
      </Pressable>

      <CollapsibleContent isOpen={isOpen} style={{ marginTop: spacing.sm }}>
        {children}
      </CollapsibleContent>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
