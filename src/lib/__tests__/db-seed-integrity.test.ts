import * as fs from 'fs';
import * as path from 'path';

import { EXERCISES } from '../../data/exercises';

/**
 * Database seed integrity tests.
 *
 * These guard the Supabase migration files that seed `public.exercises`.
 * A mismatch there is not theoretical: the first version of
 * `20260929000001_seed_new_exercises.sql` was generated with one extra target
 * column (`about`), which made `supabase db push` fail with
 * "INSERT has more target columns than expressions". And whenever a catalog
 * exercise is missing from the seeds, pushing a plan that contains it fails
 * the `workout_plan_exercises.exercise_id` FK and the cloud plan loses all its
 * exercises (see plan-push-resilience.test.ts).
 */

interface ParsedInsert {
  file: string;
  table: string;
  columns: string[];
  values: string[];
}

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

function migrationFiles(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

/**
 * Minimal SQL value scanner: finds `INSERT INTO public.<table> (<cols>)
 * VALUES (<vals>)` and splits the value tuple on top-level commas, ignoring
 * commas inside quoted strings, ARRAY[...] literals and nested parentheses.
 */
function parseInserts(sql: string, file: string, table: string): ParsedInsert[] {
  const inserts: ParsedInsert[] = [];
  const header = new RegExp(
    `INSERT\\s+INTO\\s+public\\.${table}\\s*\\(([^)]*)\\)\\s*VALUES\\s*\\(`,
    'gi',
  );
  let match: RegExpExecArray | null;

  while ((match = header.exec(sql)) !== null) {
    const columns = match[1]
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    const values: string[] = [];
    let current = '';
    let parenDepth = 1;
    let bracketDepth = 0;
    let inString = false;
    let i = match.index + match[0].length;

    for (; i < sql.length; i += 1) {
      const ch = sql[i];
      if (inString) {
        current += ch;
        if (ch === '\\' && i + 1 < sql.length) {
          // E'...' escape sequences keep the escaped character inside the string
          current += sql[i + 1];
          i += 1;
        } else if (ch === "'") {
          if (sql[i + 1] === "'") {
            // doubled quote stays inside the string
            current += sql[i + 1];
            i += 1;
          } else {
            inString = false;
          }
        }
        continue;
      }
      if (ch === "'") {
        inString = true;
        current += ch;
        continue;
      }
      if (ch === '(') {
        parenDepth += 1;
        current += ch;
        continue;
      }
      if (ch === ')') {
        parenDepth -= 1;
        if (parenDepth === 0) break;
        current += ch;
        continue;
      }
      if (ch === '[') {
        bracketDepth += 1;
        current += ch;
        continue;
      }
      if (ch === ']') {
        bracketDepth -= 1;
        current += ch;
        continue;
      }
      if (ch === ',' && parenDepth === 1 && bracketDepth === 0) {
        values.push(current.trim());
        current = '';
        continue;
      }
      current += ch;
    }

    if (current.trim()) values.push(current.trim());
    inserts.push({ file, table, columns, values });
    header.lastIndex = i;
  }

  return inserts;
}

function parseAllExerciseInserts(): ParsedInsert[] {
  const inserts: ParsedInsert[] = [];
  for (const file of migrationFiles()) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    inserts.push(...parseInserts(sql, file, 'exercises'));
    inserts.push(...parseInserts(sql, file, 'exercise_aliases'));
  }
  return inserts;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  return trimmed;
}

describe('Supabase seed integrity (public.exercises)', () => {
  const inserts = parseAllExerciseInserts();

  it('parses the exercise seeds (sanity check on the parser)', () => {
    expect(inserts.filter((row) => row.table === 'exercises').length).toBeGreaterThan(90);
  });

  it('every exercise INSERT provides exactly one value per target column', () => {
    const mismatches = inserts
      .filter((row) => row.table === 'exercises' && row.values.length !== row.columns.length)
      .map((row) => `${row.file}: ${row.columns.length} columns vs ${row.values.length} values`);
    expect(mismatches).toEqual([]);
  });

  it('every alias INSERT provides both target columns', () => {
    const mismatches = inserts
      .filter((row) => row.table === 'exercise_aliases')
      .filter((row) => row.columns.length !== 2 || row.values.length !== 2)
      .map((row) => `${row.file}: ${row.columns.length} columns vs ${row.values.length} values`);
    expect(mismatches).toEqual([]);
  });

  it('seeds every exercise in the app catalog so plan-exercise FK inserts succeed', () => {
    const seededIds = new Set(
      inserts
        .filter((row) => row.table === 'exercises')
        .map((row) => unquote(row.values[0] ?? '')),
    );
    const missing = EXERCISES.map((exercise) => exercise.id).filter((id) => !seededIds.has(id));
    expect(missing).toEqual([]);
  });

  it('the app catalog itself has no duplicate exercise ids', () => {
    const ids = EXERCISES.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every seeded alias points at a seeded exercise', () => {
    const seededIds = new Set(
      inserts
        .filter((row) => row.table === 'exercises')
        .map((row) => unquote(row.values[0] ?? '')),
    );
    const orphaned = inserts
      .filter((row) => row.table === 'exercise_aliases')
      .map((row) => unquote(row.values[0] ?? ''))
      .filter((id) => !seededIds.has(id));
    expect(orphaned).toEqual([]);
  });
});
