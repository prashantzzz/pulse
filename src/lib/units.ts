/**
 * Unit conversion, calculation and formatting utilities.
 *
 * All internal database storage and persistent types store weight canonically in kg.
 * These utilities convert dynamically between kg and lbs for display, calculations,
 * and user inputs based on the active weightUnit setting.
 */

export const LBS_PER_KG = 2.20462262;
export const KG_PER_LB = 0.45359237;

export type WeightUnit = 'kg' | 'lbs';

/** Convert kilograms to pounds */
export function kgToLbs(kg: number): number {
  return kg * LBS_PER_KG;
}

/** Convert pounds to kilograms */
export function lbsToKg(lbs: number): number {
  return lbs * KG_PER_LB;
}

/**
 * Given stored weight (in kg), return user-facing weight in the active unit.
 * If unit is 'kg', returns weightKg rounded to 1 decimal place.
 * If unit is 'lbs', converts and rounds cleanly.
 */
export function toUserWeight(weightKg: number | null | undefined, unit: 'kg' | 'lbs' = 'kg'): number {
  if (weightKg == null) return 0;
  const raw = unit === 'lbs' ? kgToLbs(weightKg) : weightKg;
  return Math.round(raw * 10) / 10;
}

/**
 * Given user-entered weight in the active unit, return canonical weight in kg to store in state / DB.
 * If unit is 'kg', returns the weight rounded to 1 decimal place.
 * If unit is 'lbs', converts to kg with 2 decimal precision.
 */
export function fromUserWeight(weight: number, unit: 'kg' | 'lbs' = 'kg'): number {
  if (unit === 'lbs') {
    return Math.round(lbsToKg(weight) * 100) / 100;
  }
  return Math.round(weight * 10) / 10;
}

/**
 * Convert volume (tonnage lifted = sum of weight * reps) from kg to the user's unit.
 */
export function toUserVolume(volumeKg: number, unit: 'kg' | 'lbs' = 'kg'): number {
  if (unit === 'lbs') {
    return Math.round(kgToLbs(volumeKg));
  }
  return Math.round(volumeKg);
}

/**
 * Formats a weight number for display (without unit suffix).
 * Expects value to already be in user's unit (e.g. from toUserWeight).
 * e.g. 60 -> "60", 62.5 -> "62.5", 220.5 -> "220.5"
 */
export function formatWeight(n: number | null | undefined, _unit?: 'kg' | 'lbs'): string {
  if (n == null) return '—';
  const rounded = Math.round(n * 10) / 10;
  return rounded % 1 === 0 ? `${rounded}` : rounded.toFixed(1);
}

/**
 * Formats weight with unit suffix, e.g. "60 kg" or "132.3 lbs".
 * Expects value to already be in user's unit (e.g. from toUserWeight).
 */
export function formatWeightWithUnit(n: number | null | undefined, unit: 'kg' | 'lbs' = 'kg'): string {
  if (n == null) return '—';
  return `${formatWeight(n, unit)} ${unit}`;
}

/**
 * Formats stored canonical weight (in kg) into the active user unit as a number string.
 * e.g. 100 kg with unit='lbs' -> "220.5", with unit='kg' -> "100"
 */
export function formatUserWeight(weightKg: number | null | undefined, unit: 'kg' | 'lbs' = 'kg'): string {
  if (weightKg == null) return '—';
  return formatWeight(toUserWeight(weightKg, unit));
}

/**
 * Formats stored canonical weight (in kg) into the active user unit with unit suffix.
 * e.g. 100 kg with unit='lbs' -> "220.5 lbs", with unit='kg' -> "100 kg"
 */
export function formatUserWeightWithUnit(weightKg: number | null | undefined, unit: 'kg' | 'lbs' = 'kg'): string {
  if (weightKg == null) return '—';
  return `${formatUserWeight(weightKg, unit)} ${unit}`;
}

/**
 * Formats volume (large numbers) with compact notation, e.g. "25.2k lbs" or "11.4k kg".
 */
export function formatVolumeWithUnit(volumeKg: number, unit: 'kg' | 'lbs' = 'kg'): string {
  const vol = toUserVolume(volumeKg, unit);
  if (vol >= 1000) {
    return `${(vol / 1000).toFixed(1)}k ${unit}`;
  }
  return `${vol.toLocaleString()} ${unit}`;
}

/** Standard barbell weight (20 kg for metric, 45 lbs for imperial) */
export function getBarWeight(unit: 'kg' | 'lbs' = 'kg'): number {
  return unit === 'lbs' ? 45 : 20;
}

/** Standard stepper increment for weight input (2.5 kg for metric, 5 lbs for imperial) */
export function getWeightStep(unit: 'kg' | 'lbs' = 'kg'): number {
  return unit === 'lbs' ? 5 : 2.5;
}
