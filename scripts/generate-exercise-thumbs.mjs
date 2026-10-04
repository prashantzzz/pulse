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

// 1. Asset key -> video file (ANIMATION_ASSETS).
const assetRe = /'([^']+)':\s*\{\s*source:\s*require\('([^']+\.mp4)'\)/g;
const assetVideos = new Map();
let match;
while ((match = assetRe.exec(source))) {
  assetVideos.set(match[1], match[2]);
}

// 2. Exercise id -> asset key (EXERCISE_ANIMATIONS).
const exerciseBlock = source.slice(source.indexOf('const EXERCISE_ANIMATIONS'));
const exerciseRe = /'([^']+)':\s*'([^']+)'/g;
const entries = [];
while ((match = exerciseRe.exec(exerciseBlock))) {
  const exerciseId = match[1];
  const video = assetVideos.get(match[2]);
  if (!video) {
    throw new Error(`Animation asset "${match[2]}" for exercise "${exerciseId}" was not found.`);
  }
  entries.push({ exerciseId, video });
}
if (entries.length === 0) {
  throw new Error('No exercise animation entries found — check the exercise-animations.ts format.');
}
console.log(`Found ${entries.length} exercise→video mappings (${assetVideos.size} video assets).`);

mkdirSync(thumbsDir, { recursive: true });

const mapLines = [];
const failed = [];
const generatedVideos = new Set();
let totalBytes = 0;

for (const { exerciseId, video } of entries) {
  const videoPath = path.resolve(path.join(root, 'src', 'data'), video);
  const base = path.basename(video).replace(/\.mp4$/i, '');
  const outPath = path.join(thumbsDir, `${base}.jpg`);

  // Several exercises can share one video asset — encode each file once.
  if (!generatedVideos.has(videoPath)) {
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
    generatedVideos.add(videoPath);
    totalBytes += statSync(outPath).size;
  }

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

console.log(
  `Generated ${generatedVideos.size} thumbnails (${(totalBytes / 1024).toFixed(0)} KB) for ${mapLines.length} exercise mappings.`,
);
console.log(`Wrote ${path.relative(root, outMapPath)}.`);
if (failed.length > 0) {
  console.warn(`Failed for ${failed.length} video(s): ${failed.join(', ')}`);
}
