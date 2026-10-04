/**
 * Tiny out-of-band navigation intents for tab segments.
 *
 * Deep-linking to a tab segment via a query string (`/workouts?tab=templates`)
 * proved unreliable on web (the tab switched then reverted). This lets a screen
 * request a specific segment right before navigating to the tab, without
 * putting state in the URL.
 */
export type WorkoutsTab = 'My Plans' | 'Templates';

let pendingTab: WorkoutsTab | null = null;

export function requestWorkoutsTab(tab: WorkoutsTab): void {
  pendingTab = tab;
}

export function consumeWorkoutsTab(): WorkoutsTab | null {
  const tab = pendingTab;
  pendingTab = null;
  return tab;
}

/** Segments of the Progress tab, in display order. */
export const PROGRESS_VIEWS = ['Body', 'Strength', 'Volume', 'Regularity', 'Records'] as const;

export type ProgressView = (typeof PROGRESS_VIEWS)[number];

let pendingProgressTab: ProgressView | null = null;

export function requestProgressTab(tab: ProgressView): void {
  pendingProgressTab = tab;
}

export function consumeProgressTab(): ProgressView | null {
  const tab = pendingProgressTab;
  pendingProgressTab = null;
  return tab;
}

/**
 * Normalizes an untrusted value (e.g. a `?tab=` query param) to a Progress
 * segment, or null when it is missing/unknown.
 */
export function toProgressView(value: string | null | undefined): ProgressView | null {
  if (!value) return null;
  return (PROGRESS_VIEWS as readonly string[]).includes(value) ? (value as ProgressView) : null;
}
