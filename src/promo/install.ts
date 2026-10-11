/* eslint-disable react-hooks/refs --
 * Promo motion code keeps Animated values, cascade slots and play keys in refs:
 * they are imperative animation state that must not trigger re-renders. Slot
 * assignment intentionally happens during render (parents before children) so
 * cascades order top-down. Same convention as draggable-plan-list.tsx.
 */
/**
 * Promo installer — a side-effect module imported at the very top of the root
 * layout. It fabricates an authenticated session and seeds the live Zustand
 * store with the promo snapshot, so the app boots straight into Home with the
 * athlete's data and never touches Supabase.
 *
 * Both stores are driven from the outside via `setState`/`subscribe`, so no
 * store file is modified.
 */
import { useAuth } from '../store/useAuth';
import { usePulse } from '../store/useStore';
import { PROMO } from './config';
import { buildPromoPulseState } from './state';

const PROMO_USER = {
  id: 'promo-user-0001',
  email: 'alex@nextrep.app',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { full_name: 'Alex' },
} as const;

let hydrationHandled = false;

/**
 * Remove any persisted Supabase session (raw localStorage keys on web) before
 * the client initializes, so a leftover real account in the recording browser
 * profile can never hydrate and overwrite the promo snapshot with cloud data.
 */
function purgeSupabaseSessions(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && /^sb-.*-auth-token/.test(key)) doomed.push(key);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* storage unavailable — nothing to purge */
  }
}

/** Re-apply the entire promo data snapshot (also used by the ⇧R hotkey). */
export function applyPromoData(): void {
  usePulse.setState(buildPromoPulseState() as never);
}

/** Keep the promo profile "signed in" without a Supabase session. */
export function forcePromoAuth(): void {
  const user = { ...PROMO_USER, email_confirmed_at: new Date().toISOString(), created_at: new Date().toISOString() } as never;
  useAuth.setState({
    session: {
      access_token: 'promo',
      refresh_token: 'promo',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user,
    } as never,
    user,
    isAuthenticated: true,
    isInitialized: true,
    isLoading: false,
    isVerifyingUser: false,
  });
}

/** Retake helper: restore the pristine snapshot (drops any logged sets). */
export function resetPromoData(): void {
  applyPromoData();
  forcePromoAuth();
}

if (PROMO.enabled) {
  purgeSupabaseSessions();
  applyPromoData();
  forcePromoAuth();

  // Persisted storage hydrates shortly after this module runs. The stored
  // snapshot (possibly a real account in the same browser profile) must never
  // win — re-apply the promo data the moment hydration completes.
  const checkHydration = () => {
    if (hydrationHandled || !usePulse.getState().hydrated) return;
    hydrationHandled = true;
    applyPromoData();
  };
  usePulse.subscribe(checkHydration);
  checkHydration();

  // `useAuth.initialize()` resolves after boot and writes `isAuthenticated:
  // false` when no real Supabase session exists. Keep the promo athlete
  // signed in regardless — and if a real account somehow slips through, kick
  // it out and restore the promo snapshot.
  useAuth.subscribe((s) => {
    const foreignUser = s.user != null && s.user.id !== PROMO_USER.id;
    if (!s.isAuthenticated || !s.isInitialized || foreignUser) {
      forcePromoAuth();
      if (foreignUser) applyPromoData();
    }
  });
}
