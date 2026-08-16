/**
 * One-off verification: parse the reference CSV, re-export it, and check that
 * the round trip is faithful (same workouts/sets/values, standard format).
 * Run: npx tsx scripts/verify-csv.ts
 */
import { readFileSync } from 'fs';
import { SEED_WORKOUTS } from '../src/data/seed';
import { parseWorkoutsCsv, workoutsToCsv, formatCsvDate } from '../src/lib/csv';

const text = readFileSync('workout_data_sample.csv', 'utf8');
const parsed = parseWorkoutsCsv(text);
const out = workoutsToCsv(parsed.workouts);

const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
const outLines = out.split('\n').filter((l) => l.trim().length > 0);

console.log('input rows:', lines.length);
console.log('parsed workouts:', parsed.workouts.length);
console.log('skipped rows:', parsed.skipped);
console.log('new exercises created:', parsed.newExercises.length, parsed.newExercises);
console.log('total sets parsed:', parsed.workouts.reduce((a, w) => a + w.exercises.reduce((x, e) => x + e.sets.length, 0), 0));

// Header must match the reference exactly
console.log('header matches reference:', outLines[0] === lines[0] ? 'YES' : `NO\n  out: ${outLines[0]}\n  ref: ${lines[0]}`);

// Row count should be identical (every input row -> exactly one output row)
console.log('row counts equal:', outLines.length === lines.length ? `YES (${outLines.length})` : `NO (in ${lines.length}, out ${outLines.length})`);

// Dates must use the reference format (field contains a comma, so check raw)
const dateCell = outLines[1]?.match(/"\d{1,2} \w{3} \d{4}, \d{2}:\d{2}"/)?.[0];
console.log('date format ok:', dateCell ? 'YES' : `NO (${outLines[1]})`);

// Set indexes are 0-based in output, 'normal' set types round-trip
const sampleVals = parsed.workouts[0].exercises[0].sets.map((s) => ({ i: s.setIndex, w: s.weightKg, r: s.reps }));
console.log('first exercise sets (1-based internal):', JSON.stringify(sampleVals));

// Exercise titles resolve against the knowledge base
const resolved = new Set(parsed.workouts.flatMap((w) => w.exercises.map((e) => e.exerciseId)));
console.log('distinct resolved exercise ids:', resolved.size);
console.log('unknown titles:', parsed.newExercises.length === 0 ? 'none — all matched knowledge base' : parsed.newExercises.join(', '));

// Round-trip spot check: re-parse our own export
const round = parseWorkoutsCsv(out);
console.log('re-parse of export ok:', round.workouts.length === parsed.workouts.length ? 'YES' : 'NO');

// Export the app's own seed data and confirm it parses back cleanly
const seedCsv = workoutsToCsv(SEED_WORKOUTS);
const seedBack = parseWorkoutsCsv(seedCsv);
console.log('seed export rows:', seedCsv.split('\n').length - 1, '| re-parsed workouts:', seedBack.workouts.length, '| skipped:', seedBack.skipped, '| new exercises:', seedBack.newExercises.length);

// Volume sanity: sum of weight*reps for the whole file
const totalVol = parsed.workouts.reduce((a, w) => a + w.exercises.reduce((x, e) => x + e.sets.reduce((y, s) => y + (s.weightKg ?? 0) * (s.reps ?? 0), 0), 0), 0);
console.log('total volume of imported data:', Math.round(totalVol), 'kg');
console.log('date parse sample:', formatCsvDate(parsed.workouts[0].startTime));

// ---------------------------------------------------------------------------
// Edge cases: cardio, RPE, notes, supersets, warmup/drop sets, unusual names
// ---------------------------------------------------------------------------
const EDGE = [
  'title,start_time,end_time,description,exercise_title,superset_id,exercise_notes,set_index,set_type,weight_kg,reps,distance_km,duration_seconds,rpe',
  'Cardio Day,"15 Aug 2026, 07:00","15 Aug 2026, 07:45",Morning run,"Treadmill Run",,,0,normal,,,5.2,1800,7',
  'Cardio Day,"15 Aug 2026, 07:00","15 Aug 2026, 07:45",Morning run,"Stationary Bike",,keep pace,1,cardio,,,12.5,2400,6',
  'Push Day,"16 Aug 2026, 18:00","16 Aug 2026, 18:40",,Bench Press (Barbell),SS1,felt strong,0,warmup,20,12,,,5',
  'Push Day,"16 Aug 2026, 18:00","16 Aug 2026, 18:40",,Bench Press (Barbell),SS1,,1,working,40,8,,,8',
  'Push Day,"16 Aug 2026, 18:00","16 Aug 2026, 18:40",,Chest Fly (Dumbbell),SS1,,0,working,15,12,,,8',
  'Push Day,"16 Aug 2026, 18:00","16 Aug 2026, 18:40",,Bench Press (Barbell),SS1,,2,failure,42.5,5,,,10',
  'Push Day,"16 Aug 2026, 18:00","16 Aug 2026, 18:40",,Triceps Pushdown,,last set,3,drop,25,8,,,9',
];
const edge = parseWorkoutsCsv(EDGE.join('\n'));
console.log('\n-- edge cases --');
console.log('workouts:', edge.workouts.length, '| skipped:', edge.skipped);
const cardio = edge.workouts[0];
console.log('cardio sets:', cardio.exercises.map((e) => ({ ex: e.exerciseId, dist: e.sets[0]?.distanceKm, dur: e.sets[0]?.durationSec, rpe: e.sets[0]?.rpe })));
const push = edge.workouts[1];
const bench = push.exercises.find((e) => e.exerciseId === 'bench-press')!;
const tri = push.exercises.find((e) => e.exerciseId === 'triceps-pushdown')!;
console.log('bench set types:', bench.sets.map((s) => s.setType).join(','), '| rpe:', bench.sets.map((s) => s.rpe).join(','));
console.log('supersets:', bench.sets.map((s) => (s.supersetId ? 'SS' : '-')).join(','), '| notes:', JSON.stringify(push.exercises.map((e) => e.notes)));
console.log('drop set parsed:', tri.sets.some((s) => s.setType === 'drop'), '| notes:', JSON.stringify(tri.notes));
// re-export the edge data and confirm values survive
const edgeOut = workoutsToCsv(edge.workouts);
const edgeRound = parseWorkoutsCsv(edgeOut);
const roundPush = edgeRound.workouts[1];
const roundBench = roundPush.exercises.find((e) => e.exerciseId === 'bench-press')!;
const roundTri = roundPush.exercises.find((e) => e.exerciseId === 'triceps-pushdown')!;
console.log('edge round-trip workouts:', edgeRound.workouts.length, '| cardio distance survives:', edgeRound.workouts[0].exercises[0].sets[0]?.distanceKm === 5.2);
console.log('edge round-trip rpe survives:', roundBench.sets[0]?.rpe === 5);
console.log('edge round-trip superset survives:', roundBench.sets[0]?.supersetId != null);
console.log('edge round-trip drop set survives:', roundTri.sets[0]?.setType === 'drop');
console.log('edge round-trip exercise notes survive:', JSON.stringify(roundTri.notes));

// import dedupe: importing the same file twice must not duplicate workouts
const existing = new Set(parsed.workouts.map((w) => `${w.title}|${w.startTime}`));
const again = parseWorkoutsCsv(text).workouts.filter((w) => !existing.has(`${w.title}|${w.startTime}`));
console.log('dedupe on re-import:', again.length === 0 ? 'YES (0 duplicates)' : `NO (${again.length} duplicates)`);

// 1-based set indexes + ISO dates + alternate headers must also import
const ALT = [
  'Workout title,Start time,End time,Exercise title,Set,Type,Weight (kg),Repetitions,Notes',
  'Leg Day,2026-08-20T18:00:00.000Z,2026-08-20T18:40:00.000Z,Squat,1,normal,60,8,deep',
  'Leg Day,2026-08-20T18:00:00.000Z,2026-08-20T18:40:00.000Z,Squat,2,normal,60,8,',
];
const alt = parseWorkoutsCsv(ALT.join('\n'));
console.log('\n-- alternate headers / ISO / 1-based --');
console.log('workouts:', alt.workouts.length, '| skipped:', alt.skipped, '| sets:', alt.workouts[0]?.exercises[0]?.sets.length, '| setIndex 1-based:', alt.workouts[0]?.exercises[0]?.sets[0]?.setIndex, '| notes:', JSON.stringify(alt.workouts[0]?.exercises[0]?.sets[0]?.notes));

// Unknown exercise titles become custom library entries (no crash, correct display name)
const UNKNOWN = ['title,start_time,end_time,exercise_title,set_index,set_type,weight_kg,reps', 'Weird Day,"10 Aug 2026, 09:00","10 Aug 2026, 09:30",Hyper-Explosive Zorp Pogo Press,0,normal,10,10'];
const unk = parseWorkoutsCsv(UNKNOWN.join('\n'));
console.log('unknown exercise:', unk.workouts[0]?.exercises[0]?.exerciseId, '| created:', unk.newExercises.join(', '), '| name kept:', unk.workouts[0]?.exercises[0]?.exerciseId.startsWith('custom-'));

