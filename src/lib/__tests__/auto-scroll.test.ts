import {
  AUTO_SCROLL_BOTTOM_EDGE,
  AUTO_SCROLL_MAX_STEP,
  AUTO_SCROLL_MIN_STEP,
  AUTO_SCROLL_TOP_EDGE,
  autoScrollStep,
  computeAutoScrollZone,
  contentDragDy,
} from '../auto-scroll';

describe('computeAutoScrollZone (edge detection)', () => {
  const HEIGHT = 800; // top zone: < 110, bottom zone: > 630

  it('returns a neutral zone in the middle of the viewport', () => {
    expect(computeAutoScrollZone(400, HEIGHT)).toEqual({ direction: 0, intensity: 0 });
  });

  it('scrolls up when the pointer enters the top zone', () => {
    const shallow = computeAutoScrollZone(AUTO_SCROLL_TOP_EDGE - 1, HEIGHT);
    expect(shallow.direction).toBe(-1);
    expect(shallow.intensity).toBeGreaterThan(0);
    expect(shallow.intensity).toBeLessThan(0.05);

    const atEdge = computeAutoScrollZone(0, HEIGHT);
    expect(atEdge.direction).toBe(-1);
    expect(atEdge.intensity).toBe(1);
  });

  it('scrolls down when the pointer enters the bottom zone', () => {
    const bottomStart = HEIGHT - AUTO_SCROLL_BOTTOM_EDGE;
    const shallow = computeAutoScrollZone(bottomStart + 1, HEIGHT);
    expect(shallow.direction).toBe(1);
    expect(shallow.intensity).toBeGreaterThan(0);
    expect(shallow.intensity).toBeLessThan(0.05);

    const atEdge = computeAutoScrollZone(HEIGHT, HEIGHT);
    expect(atEdge.direction).toBe(1);
    expect(atEdge.intensity).toBe(1);
  });

  it('clamps intensity when the pointer is dragged past the screen edges', () => {
    expect(computeAutoScrollZone(-50, HEIGHT)).toEqual({ direction: -1, intensity: 1 });
    expect(computeAutoScrollZone(HEIGHT + 120, HEIGHT)).toEqual({ direction: 1, intensity: 1 });
  });

  it('treats both zone boundaries as neutral', () => {
    expect(computeAutoScrollZone(AUTO_SCROLL_TOP_EDGE, HEIGHT).direction).toBe(0);
    expect(computeAutoScrollZone(HEIGHT - AUTO_SCROLL_BOTTOM_EDGE, HEIGHT).direction).toBe(0);
  });

  it('scales the zones down on very short viewports so they never overlap', () => {
    // height 100 -> both zones are capped at 50px.
    expect(computeAutoScrollZone(25, 100).direction).toBe(-1);
    expect(computeAutoScrollZone(75, 100).direction).toBe(1);
    expect(computeAutoScrollZone(50, 100)).toEqual({ direction: 0, intensity: 0 });
  });

  it('supports custom edge sizes', () => {
    expect(computeAutoScrollZone(30, HEIGHT, 40, 40).direction).toBe(-1);
    expect(computeAutoScrollZone(770, HEIGHT, 40, 40).direction).toBe(1);
    expect(computeAutoScrollZone(400, HEIGHT, 40, 40).direction).toBe(0);
  });

  it('stays neutral for invalid geometry', () => {
    expect(computeAutoScrollZone(NaN, HEIGHT)).toEqual({ direction: 0, intensity: 0 });
    expect(computeAutoScrollZone(400, 0)).toEqual({ direction: 0, intensity: 0 });
    expect(computeAutoScrollZone(400, -100)).toEqual({ direction: 0, intensity: 0 });
    expect(computeAutoScrollZone(400, Infinity)).toEqual({ direction: 0, intensity: 0 });
  });
});

describe('autoScrollStep (speed)', () => {
  it('maps intensity onto the min..max step range', () => {
    expect(autoScrollStep(0)).toBe(AUTO_SCROLL_MIN_STEP);
    expect(autoScrollStep(1)).toBe(AUTO_SCROLL_MAX_STEP);
    expect(autoScrollStep(0.5)).toBe((AUTO_SCROLL_MIN_STEP + AUTO_SCROLL_MAX_STEP) / 2);
  });

  it('clamps out-of-range and invalid intensities', () => {
    expect(autoScrollStep(-2)).toBe(AUTO_SCROLL_MIN_STEP);
    expect(autoScrollStep(5)).toBe(AUTO_SCROLL_MAX_STEP);
    expect(autoScrollStep(NaN)).toBe(AUTO_SCROLL_MIN_STEP);
  });
});

describe('contentDragDy (screen-space → content-space)', () => {
  it('equals the screen dy when the page did not scroll', () => {
    expect(contentDragDy(42, 120, 120)).toBe(42);
  });

  it('adds the scroll delta so the card keeps following the finger', () => {
    // Page auto-scrolled down 200px: the content moves with it.
    expect(contentDragDy(10, 200, 0)).toBe(210);
    // Page auto-scrolled back up: the content delta is negative.
    expect(contentDragDy(-100, 0, 100)).toBe(-200);
  });

  it('guards against non-finite inputs', () => {
    expect(contentDragDy(NaN, 100, 50)).toBe(50);
    expect(contentDragDy(10, NaN, 50)).toBe(-40);
  });
});
