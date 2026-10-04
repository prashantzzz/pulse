import type { Slug } from 'react-native-body-highlighter';

import { ANATOMY_LABEL_MAP } from '../data/exercises';

/**
 * Curated display names for the heatmap regions, used by the Body tab and the
 * muscle exercise list. Falls back to the generic `ANATOMY_LABEL_MAP` and then
 * to the raw slug.
 */
const ANATOMY_DISPLAY_LABELS: Partial<Record<Slug, string>> = {
  'upper-back': 'Lats & Upper Back',
  trapezius: 'Trapezius (Traps)',
  'lower-back': 'Lower Back (Lumbar)',
  deltoids: 'Shoulders (Deltoids)',
  chest: 'Chest',
  biceps: 'Biceps',
  triceps: 'Triceps',
  abs: 'Abs (Core)',
  obliques: 'Obliques',
  forearm: 'Forearms',
  quadriceps: 'Quadriceps',
  adductors: 'Adductors',
  hamstring: 'Hamstrings',
  gluteal: 'Glutes',
  calves: 'Calves',
};

/** Human-readable label for a muscle slug (e.g. 'upper-back' → 'Lats & Upper Back'). */
export function anatomyLabel(slug: string): string {
  return ANATOMY_DISPLAY_LABELS[slug as Slug] ?? ANATOMY_LABEL_MAP[slug] ?? slug;
}
