/**
 * Generates first-frame thumbnails for every exercise video and the
 * exercise-id → thumbnail map used by `ExerciseThumb`.
 *
 * Run once (requires ffmpeg in PATH):
 *   node scripts/generate-exercise-thumbs.mjs
 *
 * Outputs:
 *   - assets/thumbs/<video-name>.jpg   (128×128 cover-cropped JPEG)
 *   - src/data/exercise-thumbnails.ts  (generated map, do not edit by hand)
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const animationsPath = path.join(root, 'src', 'data', 'exercise-animations.ts');
const thumbsDir = path.join(root, 'assets', 'thumbs');
const outMapPath = path.join(root, 'src', 'data', 'exercise-thumbnails.ts');

const source = readFileSync(animationsPath, 'utf8');
const entryRe = /'([^']+)':\s*\{\s*source:\s*require\('([^']+\.mp4)'\)/g;

const entries = [];
let match;
while ((match = entryRe.exec(source))) {
  entries.push({ exerciseId: match[1], video: match[2] });
}
if (entries.length === 0) {
  throw new Error('No animation entries found — check the exercise-animations.ts format.');
}
console.log(`Found ${entries.length} exercise videos.`);

mkdirSync(thumbsDir, { recursive: true });

const mapLines = [];
const failed = [];
let totalBytes = 0;

for (const { exerciseId, video } of entries) {
  const videoPath = path.resolve(path.join(root, 'src', 'data'), video);
  const base = path.basename(video).replace(/\.mp4$/i, '');
  const outPath = path.join(thumbsDir, `${base}.jpg`);

  // Sample slightly into the clip to skip black/lead-in frames; fall back to
  // the very first frame for clips shorter than the seek point.
  let ok = false;
  for (const seek of ['0.3', '0']) {
    try {
      execFileSync(
        'ffmpeg',
        [
          '-y',
          '-loglevel', 'error',
          '-ss', seek,
          '-i', videoPath,
          '-frames:v', '1',
          '-vf', 'scale=128:128:force_original_aspect_ratio=increase,crop=128:128',
          '-q:v', '4',
          outPath,
        ],
        { stdio: 'pipe' },
      );
      ok = true;
      break;
    } catch {
      // retry with the other seek point
    }
  }

  if (!ok) {
    failed.push(base);
    continue;
  }
  totalBytes += statSync(outPath).size;
  mapLines.push(`  '${exerciseId}': require('../../assets/thumbs/${base}.jpg'),`);
}

const generatedMap = `/**
 * GENERATED FILE — do not edit by hand.
 * Run \`node scripts/generate-exercise-thumbs.mjs\` to regenerate.
 *
 * First-frame thumbnails (assets/thumbs) for exercises that have a video.
 * Exercises without an entry keep the muscle icon fallback.
 */

const EXERCISE_THUMBS: Record<string, number> = {
${mapLines.join('\n')}
};

/** First-frame thumbnail for an exercise, or undefined when it has no video. */
export function getExerciseThumb(exerciseId: string): number | undefined {
  return EXERCISE_THUMBS[exerciseId];
}
`;
writeFileSync(outMapPath, generatedMap, 'utf8');

console.log(`Generated ${mapLines.length} thumbnails (${(totalBytes / 1024).toFixed(0)} KB total).`);
console.log(`Wrote ${path.relative(root, outMapPath)}.`);
if (failed.length > 0) {
  console.warn(`Failed for ${failed.length} video(s): ${failed.join(', ')}`);
}
