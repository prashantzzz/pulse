import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { colors, radius, spacing } from '../theme';

/**
 * A lightweight horizontal pager. `pagingEnabled` works on native and web
 * (react-native-web maps it to CSS scroll-snap), so swiping feels native on
 * every platform, while the chevron buttons and dots provide an animated slide.
 *
 * One quirk handled here: after a swipe/animation the scroll position can
 * settle on a fractional offset (e.g. 417.6 instead of 418). That left a thin
 * sliver of the neighbouring card visible — most noticeably a white line at
 * the left of the dark body-model card. Every scroll end re-snaps to the exact
 * page edge, and the viewport clips with a dark background as a belt-and-braces
 * guard, so the sliver can never appear.
 */
export function MediaCarousel({ pages, labels = ['Media', 'Muscles'] }: { pages: React.ReactNode[]; labels?: string[] }) {
  const [w, setW] = useState(0);
  const [index, setIndex] = useState(0);
  const ref = useRef<ScrollView>(null);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Force the scroll to rest exactly on a page edge (fractional offsets show a sliver). */
  const snapExact = (next: number) => {
    ref.current?.scrollTo({ x: next * w, animated: false });
  };

  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(pages.length - 1, i));
    setIndex(next);
    ref.current?.scrollTo({ x: next * w, animated: true });
    // On web, programmatic smooth scrolls don't fire momentum/drag-end events
    // and can settle a fraction of a pixel off — correct it after the slide.
    if (snapTimer.current) clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => snapExact(next), 420);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (w <= 0) return;
    const next = Math.max(0, Math.min(pages.length - 1, Math.round(e.nativeEvent.contentOffset.x / w)));
    setIndex(next);
    if (snapTimer.current) clearTimeout(snapTimer.current);
    // snap exactly onto the page edge — kills the fractional-offset sliver
    snapExact(next);
  };

  // Pages are 1px wider than the measured viewport: browsers can render a
  // fractional physical width (e.g. 418.4px for a 418px viewport), which lets
  // the max scroll position fall a fraction short of the page edge and show a
  // hairline of the neighbouring card. Overlapping pages by 1px means each
  // page fully covers the viewport at every rest position — no white sliver.
  const pageW = w > 0 ? Math.ceil(w) + 1 : 0;

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
            snapToInterval={pageW}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            onScrollEndDrag={onScrollEnd}
            style={styles.clip}
            contentContainerStyle={styles.content}>
            {pages.map((p, i) => (
              <View key={i} style={{ width: pageW }}>
                {p}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={{ height: 240 }} />
        )}

        {pages.length > 1 ? (
          <>
            <Pressable
              onPress={() => goTo(index - 1)}
              disabled={index === 0}
              style={[styles.chevron, styles.chevronLeft, index === 0 && { opacity: 0.25 }]}
              hitSlop={8}
              accessibilityLabel="Previous card">
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={() => goTo(index + 1)}
              disabled={index === pages.length - 1}
              style={[styles.chevron, styles.chevronRight, index === pages.length - 1 && { opacity: 0.25 }]}
              hitSlop={8}
              accessibilityLabel="Next card">
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </Pressable>
          </>
        ) : null}
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
  chevron: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  chevronLeft: { left: 10 },
  chevronRight: { right: 10 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xs, gap: spacing.sm },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderBright },
});
