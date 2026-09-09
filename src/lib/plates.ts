/**
 * Plate calculator — the fewest standard plates per side for a target load.
 *
 * Pure and deterministic: given the total weight on the bar (target) and the
 * bar weight itself, it splits the remainder in two and greedily builds each
 * side from the largest standard plates down. Values that don't land exactly
 * on a plate step are reported as a remainder so the UI can say "add 1.25 kg
 * per side" instead of silently rounding up.
 */

export const PLATE_STEPS = [2.5, 1.25] as const;

/** Standard plate denominations, largest first (kg, per plate). */
export const PLATE_DENOMINATIONS = [25, 20, 15, 10, 5, 2.5, 1.25] as const;

/** Standard imperial plate denominations, largest first (lbs, per plate). */
export const LBS_PLATE_DENOMINATIONS = [45, 35, 25, 10, 5, 2.5] as const;

/** Round a per-side load down to the nearest plate step (never overshoot). */
export function roundToPlateStep(val: number, step: number = PLATE_STEPS[0]): number {
  if (val <= 0) return 0;
  const steps = Math.floor(val / step + 1e-9);
  return Math.round(steps * step * 100) / 100;
}

export interface PlateResult {
  /** weight loaded on each side (rounded down to the plate step) */
  perSideKg: number;
  /** plate denominations per side, largest first (one entry per plate) */
  plates: number[];
  /** leftover weight per side that no standard plate covers (0 when exact) */
  remainderKg: number;
  /** true when the target is just the bar (or lighter) */
  barOnly: boolean;
}

export function platesForTarget(
  targetWeight: number,
  barWeight?: number,
  unit: 'kg' | 'lbs' = 'kg',
): PlateResult {
  const bar = barWeight ?? (unit === 'lbs' ? 45 : 20);
  const perSide = Math.round(((targetWeight - bar) / 2) * 100) / 100;
  if (perSide <= 0) {
    return { perSideKg: 0, plates: [], remainderKg: 0, barOnly: true };
  }

  const denominations = unit === 'lbs' ? LBS_PLATE_DENOMINATIONS : PLATE_DENOMINATIONS;
  const step = PLATE_STEPS[0];
  const loaded = roundToPlateStep(perSide, step);
  let remaining = loaded;
  const plates: number[] = [];
  for (const d of denominations) {
    while (remaining >= d - 1e-9) {
      plates.push(d);
      remaining = Math.round((remaining - d) * 100) / 100;
    }
  }
  const remainder = Math.round((perSide - loaded) * 100) / 100;
  return {
    perSideKg: loaded,
    plates,
    remainderKg: remainder,
    barOnly: false,
  };
}

