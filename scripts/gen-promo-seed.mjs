/**
 * Regenerates `src/promo/seed.generated.ts` from `scripts/promo/nextrep-workouts.csv`.
 *
 * The CSV is the athlete's real tracker export (promo fixture only — never
 * shipped to production). At runtime the generated module re-parses the
 * embedded text with the production CSV importer, so the promo history and the
 * real "Import CSV" flow always agree. Dates are shifted to "today" at seed
 * time by src/promo/state.ts — this file keeps the raw log.
 *
 * Run:  node scripts/gen-promo-seed.mjs   (or: npm run promo:seed)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const csvPath = join(root, 'scripts', 'promo', 'nextrep-workouts.csv');
const outPath = join(root, 'src', 'promo', 'seed.generated.ts');

const csv = readFileSync(csvPath, 'utf8');

// JSON.stringify handles every escape (quotes, backslashes, newlines, …).
const embedded = JSON.stringify(csv);

const out = `/**
 * AUTO-GENERATED from \`scripts/promo/nextrep-workouts.csv\` — do not edit by hand.
 * Regenerate with:  npm run promo:seed
 *
 * Promo-only training history (the athlete's real tracker export). Parsed at
 * runtime with the production CSV importer so the promo build and the real
 * "Import CSV" flow always agree. Dates are shifted to "today" at seed time
 * by src/promo/state.ts — this file keeps the raw log.
 */
/* eslint-disable */
import { parseWorkoutsCsv } from '../lib/csv';
import type { Workout } from '../types';

export const PROMO_CSV = ${embedded};

const { workouts } = parseWorkoutsCsv(PROMO_CSV);

// Map the log's session titles onto the app's friendly day names where a
// synonym exists, so session comparisons read naturally in the promo footage.
const TITLE_MAP: Record<string, string> = {
  Push: 'Push Day',
  Pull: 'Pull Day',
  Legs: 'Leg Day',
};

export const PROMO_SEED_WORKOUTS: Workout[] = workouts.map((w) => ({
  ...w,
  title: TITLE_MAP[w.title] ?? w.title,
  source: 'seed',
}));
`;

writeFileSync(outPath, out, 'utf8');
const rows = csv.trim().split(/\r?\n/).length - 1;
console.log(`Wrote ${outPath} (${rows} CSV rows — workouts parsed at runtime)`);
