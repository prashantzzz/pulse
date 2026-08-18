import { useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { useAnimatedValue } from '../lib/useAnimatedValue';
import { colors, radius, spacing } from '../theme';

/**
 * A lightweight horizontal pager for the exercise media + muscle cards.
 * Swiping slides between cards natively (pagingEnabled). Tapping a dot jumps
 * the scroll to the destination and then slides the content visually with a
 * translateX transform — so the transition always animates, even on devices
 * where the OS reduces motion (which makes CSS smooth-scrolling jump) and on
 * web where the container's CSS scroll-snap would otherwise snap every
 * intermediate scroll frame straight to a page boundary.
 *
 * The seam stays clean because the scroll always rests exactly on a page edge:
 * pages are exactly viewport-width and the destination is `index * width`
 * (measured from the same layout that sizes the pages). Overlapping pages by a
 * pixel sounds safe but backfires — pagingEnabled snaps to multiples of the
 * *viewport* width, so a wider page would rest showing the previous card's
 * tail at its edge (that was the white line at the left of the dark muscle
 * card).
 */
export function MediaCarousel({ pages, labels = ['Media', 'Muscles'] }: { pages: React.ReactNode[]; labels?: string[] }) {
  const [w, setW] = useState(0);
  const [index, setIndex] = useState(0);
  const ref = useRef<ScrollView>(null);
  // current scroll offset — the tween's starting point
  const offset = useRef(0);
  // slide progress in px: negative while the content sits behind its target
  const slide = useAnimatedValue(0);

  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(pages.length - 1, i));
    const to = next * w;
    const delta = to - offset.current;
    if (Math.abs(delta) < 0.5) return;
    setIndex(next);
    // 1) place the scroll at the destination instantly (exact page edge), then
    // 2) slide the content from where it was to where it is — a transform
    //    animation, immune to scroll-snap and reduced-motion settings
    ref.current?.scrollTo({ x: to, animated: false });
    slide.setValue(-delta);
    Animated.timing(slide, {
      toValue: 0,
      duration: 320,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = e.nativeEvent.contentOffset.x;
  };

  // A swipe takes over from any in-flight slide.
  const onScrollBeginDrag = () => {
    slide.setValue(0);
  };

  // User swipes settle here (momentum end / drag end) — lock onto the page edge.
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (w <= 0) return;
    const next = Math.max(0, Math.min(pages.length - 1, Math.round(e.nativeEvent.contentOffset.x / w)));
    setIndex(next);
    ref.current?.scrollTo({ x: next * w, animated: false });
  };

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <View style={styles.viewport}>
        {/* Pages are rendered only once the width is measured, and each page
            gets an explicit pixel width — percentage widths don't resolve
            reliably inside a horizontal scroll container on web. */}
        {w > 0 ? (
          <ScrollView
            ref={ref}
            horizontal
            pagingEnabled
            snapToInterval={w}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onScrollBeginDrag={onScrollBeginDrag}
            onMomentumScrollEnd={onScrollEnd}
            onScrollEndDrag={onScrollEnd}
            style={styles.clip}
            contentContainerStyle={styles.content}>
            <Animated.View style={[styles.pages, { transform: [{ translateX: slide }] }]}>
              {pages.map((p, i) => (
                <View key={i} style={{ width: w }}>
                  {p}
                </View>
              ))}
            </Animated.View>
          </ScrollView>
        ) : (
          <View style={{ height: 240 }} />
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {pages.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => goTo(i)}
              hitSlop={6}
              accessibilityLabel={`Show ${labels[i] ?? `card ${i + 1}`}`}
              style={[styles.dot, i === index && { backgroundColor: colors.accent, width: 18 }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { position: 'relative' },
  // rounded + clipped with a dark background: any sub-pixel edge at rest shows
  // as dark, never as a raw white line from the neighbouring card
  clip: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.bg,
  },
  // dark content backdrop behind the pages — a hairline gap at the seam shows
  // as dark, never as a raw white line
  content: { backgroundColor: colors.bg },
  pages: { flexDirection: 'row' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xs, gap: spacing.sm },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderBright },
});
