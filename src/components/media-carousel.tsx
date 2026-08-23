import { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { T } from './Text';
import { horizontalSwipeLockProps } from './ui';
import { colors, radius, spacing } from '../theme';

/**
 * Pager for exercise media and muscle cards.
 * Enforces clean full-card snapping on both native and web with zero halfway halts.
 */
export function MediaCarousel({
  pages,
  labels = ['Animation', 'Muscles'],
}: {
  pages: React.ReactNode[];
  labels?: string[];
}) {
  const [w, setW] = useState(0);
  const [index, setIndex] = useState(0);
  const ref = useRef<ScrollView>(null);
  const isProgrammatic = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartX = useRef(0);

  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(pages.length - 1, i));
    isProgrammatic.current = true;
    setIndex(next);
    ref.current?.scrollTo({ x: next * w, animated: true });
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isProgrammatic.current = false;
    }, 400);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (w <= 0 || isProgrammatic.current) return;
    const offsetX = e.nativeEvent.contentOffset.x;
    const next = Math.max(0, Math.min(pages.length - 1, Math.round(offsetX / w)));
    if (next !== index) {
      setIndex(next);
    }
  };

  const handleScrollBeginDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isProgrammatic.current = false;
    dragStartX.current = e.nativeEvent.contentOffset.x;
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (w <= 0) return;
    isProgrammatic.current = false;
    const offsetX = e.nativeEvent.contentOffset.x;
    const next = Math.max(0, Math.min(pages.length - 1, Math.round(offsetX / w)));
    setIndex(next);
  };

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      {...({ 'data-horizontal-scroll': 'true' } as any)}>
      <View style={styles.viewport}>
        {w > 0 ? (
          <ScrollView
            ref={ref}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            snapToInterval={w}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            showsHorizontalScrollIndicator={false}
            {...(horizontalSwipeLockProps as any)}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onScrollBeginDrag={handleScrollBeginDrag}
            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEnd}
            style={[
              styles.clip,
              Platform.OS === 'web' ? ({ scrollSnapType: 'x mandatory' } as object) : null,
            ]}
            contentContainerStyle={styles.content}>
            {pages.map((p, i) => (
              <View
                key={i}
                style={[
                  { width: w, flexShrink: 0 },
                  Platform.OS === 'web'
                    ? ({ scrollSnapAlign: 'start', scrollSnapStop: 'always' } as object)
                    : null,
                ]}>
                {p}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={{ height: 240 }} />
        )}
      </View>

      {/* Segmented Card Selector & Dots */}
      <View style={styles.footer}>
        <View style={styles.tabContainer}>
          {pages.map((_, i) => {
            const active = i === index;
            return (
              <Pressable
                key={i}
                onPress={() => goTo(i)}
                style={[styles.tabButton, active && styles.tabButtonActive]}>
                <T
                  variant="smallSemi"
                  style={{
                    fontSize: 12,
                    color: active ? colors.bg : colors.textDim,
                  }}>
                  {labels[i] ?? `Card ${i + 1}`}
                </T>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { position: 'relative' },
  clip: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.bg,
  },
  content: {
    backgroundColor: colors.bg,
    flexDirection: 'row',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 999,
    padding: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tabButtonActive: {
    backgroundColor: colors.accent,
  },
});
