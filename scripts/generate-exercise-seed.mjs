/**
 * Generates SQL INSERT statements from the existing exercise knowledge base.
 * Run: node scripts/generate-exercise-seed.mjs
 * Output: supabase/migrations/20260818000010_seed_exercises.sql (head) + stdout
 */
import { EXERCISES } from '../src/data/exercises.ts';

function esc(str) {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'boolean') return str ? 'true' : 'false';
  if (typeof str === 'number') return String(str);
  // Escape single quotes and wrap in quotes
  return `'${String(str).replace(/'/g, "''")}'`;
}

function arrToSql(arr) {
  if (!arr || arr.length === 0) return "'{}'";
  return `ARRAY[${arr.map(esc).join(', ')}]`;
}

const lines = [];
lines.push('-- ============================================================');
lines.push('-- Migration 010: seed exercise catalog');
lines.push('-- Auto-generated from src/data/exercises.ts');
lines.push('-- ============================================================');
lines.push('');

for (const ex of EXERCISES) {
  const stepsJson = JSON.stringify(
    ex.steps.map(s => ({ title: s.title, detail: s.detail }))
  ).replace(/'/g, "''");

  const vals = [
    esc(ex.id),
    esc(ex.name),
    esc(ex.about),
    esc(ex.type),
    esc(ex.difficulty),
    esc(ex.movement),
    esc(ex.region),
    esc(ex.muscleGroup),
    arrToSql(ex.secondaryMuscles),
    esc(ex.equipment),
    esc(ex.location),
    esc(ex.beginnerFriendly),
    esc(ex.animation),
    `E'${stepsJson.replace(/'/g, "\\'")}'::jsonb`,
    arrToSql(ex.commonMistakes),
    esc(ex.breathing),
    esc(ex.repRange),
    arrToSql(ex.beginnerTips),
    arrToSql(ex.progressionTips),
    arrToSql(ex.safetyTips),
    arrToSql(ex.alternatives),
  ];

  lines.push(`INSERT INTO public.exercises (id, canonical_name, description, exercise_type, difficulty, movement_pattern, body_region, primary_muscle, secondary_muscles, equipment, location, beginner_friendly, animation_key, about, steps, common_mistakes, breathing, rep_range, beginner_tips, progression_tips, safety_tips, alternatives) VALUES`);
  lines.push(`  (${vals.join(',\n    ')})`);
  lines.push(`ON CONFLICT (id) DO NOTHING;`);

  // Aliases
  if (ex.aliases && ex.aliases.length > 0) {
    lines.push('');
    for (const alias of ex.aliases) {
      lines.push(`INSERT INTO public.exercise_aliases (exercise_id, alias) VALUES (${esc(ex.id)}, ${esc(alias)}) ON CONFLICT DO NOTHING;`);
    }
  }
  lines.push('');
}

console.log(lines.join('\n'));
