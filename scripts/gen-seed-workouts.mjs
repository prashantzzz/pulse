/**
 * Regenerates `src/data/seed-workouts.ts` from `src/data/seed-workouts.csv`.
 *
 * The CSV is the app's standard tracker format (the same layout the app
 * exports). At runtime the generated module re-parses the embedded text with
 * the production CSV importer, so seed data and "Import CSV" always agree.
 *
 * Run:  node scripts/gen-seed-workouts.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const csvPath = join(root, 'src', 'data', 'seed-workouts.csv');
const outPath = join(root, 'src', 'data', 'seed-workouts.ts');

const csv = readFileSync(csvPath, 'utf8');

// JSON.stringify handles every escape (quotes, backslashes, newlines, …).
const embedded = JSON.stringify(csv);

const out = `/**
 * AUTO-GENERATED from \`src/data/seed-workouts.csv\` — do not edit by hand.
 * Regenerate with:  node scripts/gen-seed-workouts.mjs
 *
 * The user's real training history (imported from their tracker CSV) is the
 * app's demo/seed history, so charts, streaks, records and the leaderboard
 * reflect actual logged workouts.
 */
/* eslint-disable */
import { parseWorkoutsCsv } from '../lib/csv';
import type { Workout } from '../types';

const CSV = ${embedded};

const { workouts } = parseWorkoutsCsv(CSV);

// Map the log's session titles onto the plan titles so session comparisons
// ("vs your last Push Day") line up with the plans in SEED_PLANS.
const TITLE_MAP: Record<string, string> = {
  Push: 'Push Day',
  Pull: 'Pull Day',
  Legs: 'Leg Day',
};

export const SEED_WORKOUTS: Workout[] = workouts.map((w) => ({
  ...w,
  title: TITLE_MAP[w.title] ?? w.title,
  source: 'seed',
}));
`;

writeFileSync(outPath, out, 'utf8');
const rows = csv.trim().split(/\r?\n/).length - 1;
console.log(`Wrote ${outPath} (${rows} CSV rows — workouts parsed at runtime)`);
