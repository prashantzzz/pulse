import {
  PROGRESS_VIEWS,
  consumeProgressTab,
  consumeWorkoutsTab,
  requestProgressTab,
  requestWorkoutsTab,
  toProgressView,
} from '../nav-intent';

describe('nav-intent — single-use tab requests', () => {
  it('delivers a requested workouts tab exactly once', () => {
    requestWorkoutsTab('Templates');
    expect(consumeWorkoutsTab()).toBe('Templates');
    // A second consume must not re-apply a stale intent.
    expect(consumeWorkoutsTab()).toBeNull();
  });

  it('delivers a requested progress view exactly once', () => {
    requestProgressTab('Records');
    expect(consumeProgressTab()).toBe('Records');
    expect(consumeProgressTab()).toBeNull();
  });

  it('only accepts known progress view values from query params', () => {
    for (const view of PROGRESS_VIEWS) {
      expect(toProgressView(view)).toBe(view);
    }
    expect(toProgressView('records')).toBeNull();
    expect(toProgressView('nope')).toBeNull();
    expect(toProgressView(undefined)).toBeNull();
    expect(toProgressView(null)).toBeNull();
    expect(toProgressView('')).toBeNull();
  });

  it('a newer request replaces an unconsumed older one', () => {
    requestProgressTab('Strength');
    requestProgressTab('Volume');
    expect(consumeProgressTab()).toBe('Volume');
  });
});
