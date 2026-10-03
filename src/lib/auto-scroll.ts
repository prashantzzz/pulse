/**
 * Edge auto-scroll math for drag-and-drop lists inside a ScrollView.
 *
 * While a card is being dragged, the pointer position decides whether the
 * page should scroll towards the top or bottom edge, and how fast. Positions
 * are in window (screen) coordinates; `contentDragDy` then converts the raw
 * gesture movement into content coordinates once the scroll offset changes,
 * so the lifted card keeps following the finger while the page scrolls.
 */

export type AutoScrollDirection = -1 | 0 | 1;

export interface AutoScrollZone {
  direction: AutoScrollDirection;
  /** 0..1 — how deep the pointer is inside the edge zone */
  intensity: number;
}

/** Pixels from the top/bottom of the viewport where auto-scroll kicks in. */
export const AUTO_SCROLL_TOP_EDGE = 110;
export const AUTO_SCROLL_BOTTOM_EDGE = 170;
/** Scroll speed at the shallowest / deepest edge contact, per frame. */
export const AUTO_SCROLL_MIN_STEP = 3;
export const AUTO_SCROLL_MAX_STEP = 10;

/**
 * Classifies the pointer position into a neutral middle or a top/bottom
 * auto-scroll zone. Intensity scales with how far into the zone the pointer
 * has travelled (0 at the zone boundary, 1 at the screen edge and beyond).
 */
export function computeAutoScrollZone(
  pointerY: number,
  viewportHeight: number,
  topEdge: number = AUTO_SCROLL_TOP_EDGE,
  bottomEdge: number = AUTO_SCROLL_BOTTOM_EDGE,
): AutoScrollZone {
  if (!Number.isFinite(pointerY) || !Number.isFinite(viewportHeight) || viewportHeight <= 0) {
    return { direction: 0, intensity: 0 };
  }

  // Never let the two zones overlap on very short viewports.
  const top = Math.max(0, Math.min(topEdge, viewportHeight / 2));
  const bottom = Math.max(0, Math.min(bottomEdge, viewportHeight / 2));

  if (top > 0 && pointerY < top) {
    return { direction: -1, intensity: Math.min(1, (top - pointerY) / top) };
  }

  const bottomStart = viewportHeight - bottom;
  if (bottom > 0 && pointerY > bottomStart) {
    return { direction: 1, intensity: Math.min(1, (pointerY - bottomStart) / bottom) };
  }

  return { direction: 0, intensity: 0 };
}

/** Frame step for a given zone intensity (linear between min and max). */
export function autoScrollStep(intensity: number): number {
  const clamped = Number.isFinite(intensity) ? Math.min(1, Math.max(0, intensity)) : 0;
  return AUTO_SCROLL_MIN_STEP + (AUTO_SCROLL_MAX_STEP - AUTO_SCROLL_MIN_STEP) * clamped;
}

/**
 * Converts the raw screen-space gesture `dy` into content-space `dy`.
 *
 * While the page scrolls under the finger, the content moves by
 * `scrollOffset - scrollOffsetAtDragStart`, so the card's translate must add
 * that delta to keep following the finger.
 */
export function contentDragDy(
  screenDy: number,
  scrollOffset: number,
  scrollOffsetAtDragStart: number,
): number {
  const dy = Number.isFinite(screenDy) ? screenDy : 0;
  const offset = Number.isFinite(scrollOffset) ? scrollOffset : 0;
  const start = Number.isFinite(scrollOffsetAtDragStart) ? scrollOffsetAtDragStart : 0;
  return dy + (offset - start);
}
