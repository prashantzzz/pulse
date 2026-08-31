import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
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
 * Animated container that smoothly fades and slides children when opened.
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
