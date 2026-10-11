/**
 *
 * Consumed by the chart/ring/heatmap/muscle components (stage 4). Keeps chart
 * animation on the JS thread without React re-renders, with cancel-safe
 * handles for navigation/unmount.
 */
import { Platform } from 'react-native';
import { PROMO } from './config';
import { driveNumber } from './motion';

export { EASE } from './motion';

export interface StaggerDriveOptions {
  count: number;
  /** per-item duration (ms) */
  duration: number;
  /** ms between items (defaults to the base stagger token) */
  step?: number;
  /** delay before the first item */
  delay?: number;
  easing?: (t: number) => number;
  onItem: (index: number, eased: number) => void;
  onDone?: () => void;
}

/**
 * Drives N items with a left→right (index-ordered) stagger. Returns a cancel
 * function — always call it in the effect cleanup.
 */
export function staggerDrive(opts: StaggerDriveOptions): () => void {
  const { count } = opts;
  if (count <= 0) {
    opts.onDone?.();
    return () => {};
  }
  const step = opts.step ?? PROMO.stagger.base;
  const cancels: Array<() => void> = [];
  let pending = count;

  for (let i = 0; i < count; i += 1) {
    cancels.push(
      driveNumber({
        duration: opts.duration,
        delay: (opts.delay ?? 0) + i * step,
        easing: opts.easing,
        onUpdate: (t) => opts.onItem(i, t),
        onDone: () => {
          pending -= 1;
          if (pending === 0) opts.onDone?.();
        },
      }),
    );
  }

  return () => cancels.forEach((c) => c());
}

/**
 * Web-only helper: set a CSS transition on a DOM node
 * (`property duration ease delay`).
 */
export function setCssTransition(
  node: unknown,
  property: string,
  durationMs: number,
  delayMs = 0,
  easing = 'cubic-bezier(0.16, 1, 0.3, 1)',
): void {
  if (Platform.OS !== 'web') return;
  const el = node as HTMLElement | null;
  if (!el || typeof el.style === 'undefined') return;
  el.style.transition = delayMs > 0
    ? `${property} ${durationMs}ms ${easing} ${delayMs}ms`
    : `${property} ${durationMs}ms ${easing}`;
}

/** Web-only helper: clear any inline transition styles from a DOM node. */
export function clearCssTransition(node: unknown): void {
  if (Platform.OS !== 'web') return;
  const el = node as HTMLElement | null;
  if (!el || typeof el.style === 'undefined') return;
  el.style.transition = '';
}
