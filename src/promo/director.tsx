/**
 * PromoRoot — the promo director (no visible UI).
 *
 * Wraps the app with the reveal engine. Every screen animates on entry and
 * replays deterministically on navigation, so there is no control panel to
 * operate during recording — just use the app. Also provides:
 *  - R replays the current screen, ⇧R restores the pristine demo snapshot,
 *    S toggles slow motion, digits 1-0 jump between scenes (desktop keys),
 *  - a click ripple so taps read clearly on video,
 *  - confetti on the workout summary,
 *  - `window.__nextrepPromo` automation hooks.
 *
 * When PROMO.enabled is false the component renders its children untouched.
 */
import { usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { colors } from '../theme';
import { PROMO } from './config';
import { burstConfetti } from './confetti';
import { resetPromoData } from './install';
import { PromoPlayProvider, resetPromoSequence } from './reveal';
import { requestProgressTab, type ProgressView } from '../lib/nav-intent';
import { usePulse } from '../store/useStore';
import { useAuth } from '../store/useAuth';

const SCENES: { key: string; label: string; route: string }[] = [
  { key: '1', label: 'Home', route: '/(tabs)/home' },
  { key: '2', label: 'Workouts', route: '/(tabs)/workouts' },
  { key: '3', label: 'Log', route: '/(tabs)/log' },
  { key: '4', label: 'Progress', route: '/(tabs)/progress' },
  { key: '5', label: 'Profile', route: '/(tabs)/profile' },
  { key: '6', label: 'Library', route: '/library' },
  { key: '7', label: 'Exercise', route: '/exercise/bench-press' },
  { key: '8', label: 'History', route: '/history' },
  { key: '9', label: 'Records', route: '/records' },
  { key: '0', label: 'Awards', route: '/achievements' },
];

export function PromoRoot({ children }: { children: React.ReactNode }) {
  if (!PROMO.enabled) return <>{children}</>;
  return <PromoSession>{children}</PromoSession>;
}

/** Progress analytics tabs, in display order — one HUD button each. */
const PROGRESS_SCENES: { view: ProgressView; label: string }[] = [
  { view: 'Body', label: 'Body' },
  { view: 'Records', label: 'Rec' },
  { view: 'Strength', label: 'Str' },
  { view: 'Volume', label: 'Vol' },
  { view: 'Regularity', label: 'Reg' },
];

function PromoSession({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState(0);
  const [slowMo, setSlowMo] = useState(false);

  const replay = useCallback(() => {
    resetPromoSequence();
    setToken((t) => t + 1);
  }, []);

  // Every navigation restarts the shared cascade pool, so freshly mounted
  // screens (stack pushes) always begin their cascade at slot 0.
  const lastRoute = useRef(pathname);
  useEffect(() => {
    if (lastRoute.current !== pathname) {
      lastRoute.current = pathname;
      resetPromoSequence();
    }
  }, [pathname]);

  const resetAll = useCallback(() => {
    resetPromoData();
    replay();
    router.replace('/(tabs)/home' as never);
  }, [replay, router]);

  // Keyboard shortcuts (web only).
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (typing && e.key.toLowerCase() !== 'r') return;
      if (e.key === 'r' || e.key === 'R') {
        if (e.shiftKey) resetAll();
        else replay();
      } else if (e.key === 's' || e.key === 'S') {
        setSlowMo((v) => !v);
      } else if (/^[0-9]$/.test(e.key)) {
        const scene = SCENES.find((s) => s.key === e.key);
        if (scene) router.navigate(scene.route as never);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [replay, resetAll, router]);

  // Confetti when the workout summary appears.
  useEffect(() => {
    if (Platform.OS !== 'web' || !PROMO.confettiOnSummary) return;
    if (!/\/workout\/[^/]+\/summary\/?$/.test(pathname)) return;
    const t = setTimeout(() => burstConfetti(), 480);
    return () => clearTimeout(t);
  }, [pathname]);

  // Click ripple so taps read on video.
  useEffect(() => {
    if (Platform.OS !== 'web' || !PROMO.clickRipple || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.textContent = `
      .nextrep-promo-ripple { position: fixed; z-index: 2147483646; width: 36px; height: 36px; margin: -18px 0 0 -18px; border-radius: 50%; border: 2px solid ${colors.accent}; background: ${colors.accent}22; pointer-events: none; animation: nextrepPromoRipple 0.55s ease-out forwards; }
      @keyframes nextrepPromoRipple { 0% { transform: scale(0.25); opacity: 0.95; } 100% { transform: scale(1.5); opacity: 0; } }
    `;
    document.head.appendChild(style);
    const onDown = (e: PointerEvent) => {
      const el = document.createElement('div');
      el.className = 'nextrep-promo-ripple';
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 650);
    };
    window.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      style.remove();
    };
  }, []);

  // Automation hooks (e.g. Playwright): window.__nextrepPromo.replay() etc.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    (window as any).__nextrepPromo = {
      replay,
      reset: resetAll,
      slowMo: (v: boolean) => setSlowMo(v),
      go: (route: string) => router.navigate(route as never),
      goProgress: (view: ProgressView) => {
        requestProgressTab(view);
        replay();
        router.navigate(`/(tabs)/progress?tab=${view}` as never);
      },
      scenes: SCENES,
      progressScenes: PROGRESS_SCENES,
      // Automation surface for scripted takes / verification.
      pulse: usePulse,
      auth: useAuth,
    };
  }, [replay, resetAll, router]);

  const playValue = useMemo(
    () => ({ token, slowMo, route: pathname, replay }),
    [token, slowMo, pathname, replay],
  );

  return (
    <PromoPlayProvider value={playValue}>
      {children}
    </PromoPlayProvider>
  );
}
