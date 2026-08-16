/**
 * CSV sync — export & import workout logs in the standard tracker format.
 *
 * Column layout (matches the reference `workout_data_sample.csv` exactly):
 *   title,start_time,end_time,description,exercise_title,superset_id,
 *   exercise_notes,set_index,set_type,weight_kg,reps,distance_km,
 *   duration_seconds,rpe
 *
 * - Dates are written as "14 Aug 2026, 20:15" and any of that / ISO / plain
 *   formats are accepted on import.
 * - Set index is written 0-based (as in the reference file) and normalized
 *   back to the app's 1-based indexing on import.
 * - set_type 'working' <-> 'normal' round-trips; warmup / failure / drop /
 *   cooldown / cardio pass through.
 * - Exercise titles are human-readable ("Bench Press (Dumbbell)"). On import
 *   they are matched against the knowledge base (fuzzy), and unknown ones are
 *   added as lightweight custom exercises so every screen keeps working.
 */

import { EXERCISES, EXERCISE_MAP } from '../data/exercises';
import type {
  Equipment,
  Exercise,
  ExerciseSet,
  MuscleGroup,
  SetType,
  Workout,
  WorkoutExercise,
} from '../types';

export const CSV_HEADER =
  'title,start_time,end_time,description,exercise_title,superset_id,exercise_notes,set_index,set_type,weight_kg,reps,distance_km,duration_seconds,rpe';

// ---------------------------------------------------------------------------
// CSV primitives
// ---------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** "2026-08-14T20:15:00.000Z" -> "14 Aug 2026, 20:15" (reference file format) */
export function formatCsvDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Accepts "14 Aug 2026, 20:15", "14 Aug 2026 20:15", ISO and Date.parse-able strings. */
export function parseCsvDate(raw: string): string | null {
  const s = (raw ?? '').trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})[, ]\s*(\d{1,2}):(\d{2})$/);
  if (m) {
    const month = MONTHS.findIndex((mn) => mn.toLowerCase().startsWith(m[2].toLowerCase().slice(0, 3)));
    if (month >= 0) {
      const d = new Date(Number(m[3]), month, Number(m[1]), Number(m[4]), Number(m[5]));
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
  }
  const iso = new Date(s);
  return Number.isNaN(iso.getTime()) ? null : iso.toISOString();
}

function csvEscape(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Splits CSV text into rows of raw fields, honoring quoted cells. */
export function splitCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(cur);
      cur = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur);
      cur = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      cur += c;
    }
  }
  row.push(cur);
  if (row.length > 1 || row[0] !== '') rows.push(row);
  return rows;
}

// ---------------------------------------------------------------------------
// Exercise title <-> knowledge base
// ---------------------------------------------------------------------------

const EQUIPMENT_SUFFIX: Partial<Record<Equipment, string>> = {
  Barbell: 'barbell',
  Dumbbell: 'dumbbell',
  Machine: 'machine',
  Cable: 'cable',
  Kettlebell: 'kettlebell',
  Band: 'band',
};

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function stripEquipmentSuffix(name: string): { base: string; equipment: Equipment | null } {
  const m = name.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (!m) return { base: name.trim(), equipment: null };
  const eq = (m[2].trim().toLowerCase() as string) || '';
  const known = (Object.entries(EQUIPMENT_SUFFIX) as [Equipment, string][]).find(
    ([, slug]) => eq === slug,
  );
  return { base: m[1].trim(), equipment: known ? known[0] : null };
}

/** Human display title for an exercise id, e.g. "Bench Press (Barbell)". */
export function exerciseDisplayTitle(exerciseId: string): string {
  const e = EXERCISE_MAP[exerciseId];
  if (!e) return exerciseId;
  const eq = EQUIPMENT_SUFFIX[e.equipment];
  const hasEq = eq && normalizeName(e.name).includes(normalizeName(eq));
  return eq && !hasEq && e.equipment !== 'Bodyweight' ? `${e.name} (${e.equipment})` : e.name;
}

function inferFromName(name: string): {
  muscleGroup: MuscleGroup;
  movement: Exercise['movement'];
  animation: Exercise['animation'];
  type: Exercise['type'];
  region: Exercise['region'];
  equipment: Equipment;
} {
  const n = normalizeName(name);
  let muscleGroup: MuscleGroup = 'Chest';
  let movement: Exercise['movement'] = 'Push';
  let animation: Exercise['animation'] = 'press';
  let type: Exercise['type'] = 'Compound';
  let region: Exercise['region'] = 'Upper';

  const eqMatch = (Object.entries(EQUIPMENT_SUFFIX) as [Equipment, string][]).find(
    ([, slug]) => n.includes(normalizeName(slug)),
  );
  const equipment = eqMatch ? eqMatch[0] : 'Bodyweight';

  if (/(squat|legpress|lunge)/.test(n)) {
    muscleGroup = 'Legs'; movement = 'Legs'; region = 'Lower';
    animation = n.includes('lunge') ? 'lunge' : n.includes('legpress') ? 'squat' : 'squat';
  } else if (/(deadlift|rdl|hipthrust|glute)/.test(n)) {
    muscleGroup = n.includes('glute') ? 'Glutes' : 'Legs';
    movement = 'Legs'; region = 'Lower'; animation = 'deadlift';
  } else if (/(calf|raise|heel)/.test(n)) {
    muscleGroup = 'Calves'; movement = 'Legs'; region = 'Lower'; animation = 'calf'; type = 'Isolation';
  } else if (/(row|pulldown|pullup|chinup|lat)/.test(n)) {
    muscleGroup = 'Back'; movement = 'Pull'; animation = n.includes('pulldown') ? 'pulldown' : 'row';
  } else if (/(curl)/.test(n)) {
    muscleGroup = 'Biceps'; movement = 'Pull'; animation = 'curl'; type = 'Isolation';
  } else if (/(pushdown|tricep|extension)/.test(n)) {
    muscleGroup = 'Triceps'; movement = 'Push'; animation = 'pushdown'; type = 'Isolation';
  } else if (/(press|bench|dip|pushup|fly)/.test(n)) {
    muscleGroup = 'Chest'; movement = 'Push'; animation = n.includes('bench') ? 'bench' : n.includes('fly') ? 'fly' : 'press';
  } else if (/(raise|delt|shoulder|shrug)/.test(n)) {
    muscleGroup = 'Shoulders'; movement = 'Push'; animation = 'raise'; type = n.includes('shrug') ? 'Compound' : 'Isolation';
  } else if (/(crunch|plank|ab|core|situp)/.test(n)) {
    muscleGroup = 'Core'; movement = 'Core'; region = 'Core'; animation = n.includes('plank') ? 'plank' : 'crunch';
  } else if (/(run|jog|treadmill|bike|cycle|rower|rowing|stair|elliptical)/.test(n)) {
    muscleGroup = 'Cardio'; movement = 'Cardio'; region = 'Full Body'; animation = 'run'; type = 'Compound';
  }
  return { muscleGroup, movement, animation, type, region, equipment };
}

let customCounter = 0;

/** Resolve a CSV exercise title to a knowledge-base exercise, creating a custom one if unknown. */
export function resolveExercise(title: string): Exercise {
  const clean = (title ?? '').trim();
  const { base, equipment } = stripEquipmentSuffix(clean);
  const baseNorm = normalizeName(base);

  const direct = EXERCISES.find((e) => normalizeName(e.name) === baseNorm);
  if (direct) {
    if (equipment && direct.equipment !== equipment) {
      const sameEquip = EXERCISES.find(
        (e) => normalizeName(e.name) === baseNorm && e.equipment === equipment,
      );
      if (sameEquip) return sameEquip;
    }
    return direct;
  }
  const fuzzy = EXERCISES.find((e) => {
    const n = normalizeName(e.name);
    return baseNorm.includes(n) || n.includes(baseNorm);
  });
  if (fuzzy) {
    if (equipment && fuzzy.equipment !== equipment) {
      const sameEquip = EXERCISES.find(
        (e) => (normalizeName(e.name).includes(baseNorm) || baseNorm.includes(normalizeName(e.name))) && e.equipment === equipment,
      );
      if (sameEquip) return sameEquip;
    }
    return fuzzy;
  }

  // Unknown exercise — register a lightweight custom entry so all screens work.
  const { muscleGroup, movement, animation, type, region, equipment: eq } = inferFromName(clean);
  customCounter += 1;
  const id = `custom-${normalizeName(clean).slice(0, 24) || 'exercise'}-${customCounter}`;
  const custom: Exercise = {
    id,
    name: clean,
    muscleGroup,
    secondaryMuscles: [],
    equipment: equipment ?? eq,
    difficulty: 'Beginner',
    type,
    movement,
    region,
    location: 'Both',
    beginnerFriendly: true,
    animation,
    about: `${clean} imported from your workout log. Coaching content for this movement is generated automatically — pick the closest knowledge-base exercise to see full form guidance.`,
    steps: [
      { title: 'Setup', detail: 'Get into a stable starting position with your core braced.' },
      { title: 'Movement', detail: 'Perform the rep through a full, controlled range of motion.' },
      { title: 'Peak', detail: 'Pause briefly at the hardest point of the movement.' },
      { title: 'Return', detail: 'Lower under control back to the start position.' },
    ],
    commonMistakes: ['Using momentum instead of control', 'Cutting the range of motion short'],
    breathing: 'Exhale on the effort, inhale on the way back down.',
    repRange: '8–12 reps',
    beginnerTips: ['Start lighter than you think and groove the movement', 'Film a set to check your form'],
    progressionTips: ['Add weight in small steps each session', 'Slow down the lowering phase'],
    safetyTips: ['Stop if you feel sharp pain', 'Use equipment you are comfortable with'],
    alternatives: [],
  };
  EXERCISES.push(custom);
  EXERCISE_MAP[id] = custom;
  return custom;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const SET_TYPE_TO_CSV: Record<SetType, string> = {
  warmup: 'warmup',
  working: 'normal',
  failure: 'failure',
  drop: 'drop',
  cooldown: 'cooldown',
  cardio: 'cardio',
};

/** Serialize workouts into the reference CSV format. */
export function workoutsToCsv(workouts: Workout[]): string {
  const rows: string[] = [CSV_HEADER];
  for (const w of workouts) {
    const start = formatCsvDate(w.startTime);
    const end = formatCsvDate(w.endTime);
    for (const we of w.exercises) {
      const title = exerciseDisplayTitle(we.exerciseId);
      const notes = we.notes ?? '';
      for (const s of [...we.sets].sort((a, b) => a.setIndex - b.setIndex)) {
        rows.push(
          [
            csvEscape(w.title),
            csvEscape(start),
            csvEscape(end),
            csvEscape(w.description),
            csvEscape(title),
            csvEscape(s.supersetId ?? ''),
            csvEscape(notes),
            csvEscape(s.setIndex - 1), // 0-based in the reference format
            csvEscape(SET_TYPE_TO_CSV[s.setType] ?? s.setType),
            csvEscape(s.weightKg),
            csvEscape(s.reps),
            csvEscape(s.distanceKm),
            csvEscape(s.durationSec),
            csvEscape(s.rpe),
          ].join(','),
        );
      }
    }
  }
  return rows.join('\n');
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

const SET_TYPE_FROM_CSV: Record<string, SetType> = {
  normal: 'working',
  warmup: 'warmup',
  working: 'working',
  failure: 'failure',
  drop: 'drop',
  dropset: 'drop',
  cooldown: 'cooldown',
  cardio: 'cardio',
};

function num(v: string): number | null {
  const t = (v ?? '').trim();
  if (t === '') return null;
  const n = Number(t.replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}

function headerToIndex(row: string[]): Record<string, number> {
  const idx: Record<string, number> = {};
  row.forEach((h, i) => {
    const norm = h.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    idx[norm] = i;
  });
  return idx;
}

export interface CsvImportResult {
  workouts: Workout[];
  /** rows that could not be parsed */
  skipped: number;
  /** exercises created on the fly because they were not in the knowledge base */
  newExercises: string[];
}

let idCounter = 0;
function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** Parse a tracker CSV into PULSE workouts. */
export function parseWorkoutsCsv(text: string): CsvImportResult {
  const rows = splitCsv(text);
  if (rows.length < 2) return { workouts: [], skipped: rows.length, newExercises: [] };
  const idx = headerToIndex(rows[0]);
  const get = (row: string[], keys: string[]): string => {
    for (const k of keys) {
      const i = idx[k];
      if (i !== undefined && row[i] !== undefined) return row[i].trim();
    }
    return '';
  };

  const newExercises = new Set<string>();
  const workouts: Workout[] = [];
  const orderMap = new Map<string, number>();
  let skipped = 0;

  for (const row of rows.slice(1)) {
    const title = get(row, ['title', 'workout_title']);
    const startRaw = get(row, ['start_time', 'start']);
    const endRaw = get(row, ['end_time', 'end']);
    const start = parseCsvDate(startRaw);
    const end = parseCsvDate(endRaw);
    const exerciseTitle = get(row, ['exercise_title', 'exercise', 'exercise_name', 'name']);
    const setTypeRaw = get(row, ['set_type', 'type']);
    const setType = SET_TYPE_FROM_CSV[setTypeRaw.toLowerCase()] ?? 'working';
    const weight = num(get(row, ['weight_kg', 'weight']));
    const reps = num(get(row, ['reps', 'repetitions', 'rep']));
    const distance = num(get(row, ['distance_km', 'distance']));
    const duration = num(get(row, ['duration_seconds', 'duration_sec', 'duration']));
    const rpe = num(get(row, ['rpe', 'rpe_optional']));
    const setNotes = get(row, ['notes', 'set_notes']);
    const exerciseNotes = get(row, ['exercise_notes']);
    const supersetRaw = get(row, ['superset_id', 'superset']);

    if (!title || !start) {
      skipped++;
      continue;
    }

    const wKey = `${title}|${start}`;
    let w = workouts.find((x) => `${x.title}|${x.startTime}` === wKey);
    if (!w) {
      w = {
        id: genId('w'),
        title,
        description: get(row, ['description', 'desc']),
        startTime: start,
        endTime: end ?? start,
        exercises: [],
        source: 'user',
      };
      workouts.push(w);
    }

    const exercise = resolveExercise(exerciseTitle);
    if (!EXERCISES.includes(exercise)) newExercises.add(exercise.name);

    let we = w.exercises.find((x) => x.exerciseId === exercise.id);
    if (!we) {
      we = {
        id: genId('we'),
        exerciseId: exercise.id,
        order: orderMap.get(wKey) ?? 0,
        notes: exerciseNotes || null,
        plannedSets: 0,
        targetReps: '',
        sets: [],
      };
      orderMap.set(wKey, (orderMap.get(wKey) ?? 0) + 1);
      w.exercises.push(we);
    }

    // Reference files use 0-based set_index; tolerate 1-based too.
    let setIndex = num(get(row, ['set_index', 'set']));
    if (setIndex === null) {
      setIndex = we.sets.length + 1;
    } else if (setIndex <= 0) {
      setIndex += 1;
    }
    const exists = we.sets.some((s) => s.setIndex === setIndex);
    const completed = weight !== null || reps !== null || distance !== null || duration !== null;
    const set: ExerciseSet = {
      id: genId('s'),
      setIndex: exists ? we.sets.length + 1 : setIndex,
      setType,
      weightKg: weight,
      reps,
      distanceKm: distance,
      durationSec: duration,
      rpe,
      notes: setNotes || null,
      supersetId: supersetRaw ? `${w.id}-${supersetRaw}` : null,
      completed,
      completedAt: completed ? (end ?? start) : null,
    };
    we.sets.push(set);
    we.plannedSets = we.sets.length;
  }

  // Normalize 1-based indexes and re-sort sets per exercise.
  for (const w of workouts) {
    for (const we of w.exercises) {
      we.sets.sort((a, b) => a.setIndex - b.setIndex);
      we.sets.forEach((s, i) => {
        s.setIndex = i + 1;
      });
    }
  }

  return { workouts, skipped, newExercises: [...newExercises] };
}
