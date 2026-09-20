/**
 * Tiny out-of-band navigation intent for the Workouts tab.
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
