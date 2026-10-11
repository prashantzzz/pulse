/**
 *
 * Wraps the app with the reveal engine and provides:
 *  - a replay token so pressing R re-runs every entrance animation,
 *  - S slow-motion for buttery capture, H to hide the HUD,
 *  - digits 1-0 to jump between recording scenes,
 *  - ⇧R to restore the pristine demo snapshot mid-session,
 *  - a click ripple so taps read clearly on video,
 *  - confetti on the workout summary,
 *  - `window.__nextrepPromo` automation hooks.
 *
 * When PROMO.enabled is false the component renders its children untouched.
 */
import { usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { T } from '../components/Text';
import { colors, radius } from '../theme';
import { PROMO } from './config';
import { burstConfetti } from './confetti';
import { resetPromoData } from './install';
import { useReducedMotion } from './motion';
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
  const reducedMotion = useReducedMotion();
  const [token, setToken] = useState(0);
  const [slowMo, setSlowMo] = useState(false);
  const [hud, setHud] = useState(true);

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
      } else if (e.key === 'h' || e.key === 'H') {
        setHud((v) => !v);
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
      {PROMO.hud && hud ? (
        <PromoHud
          token={token}
          slowMo={slowMo}
          reducedMotion={reducedMotion}
          onReplay={replay}
          onReset={resetAll}
          onToggleSlow={() => setSlowMo((v) => !v)}
          onHide={() => setHud(false)}
          onGo={(route) => {
            // Same-route clicks replay instead of no-op'ing, so every HUD
            // jump performs the choreography regardless of where you are.
            if (pathname === route) replay();
            else router.navigate(route as never);
          }}
          onGoProgress={(view) => {
            requestProgressTab(view);
            // Always replay: same-view re-clicks re-run the charts, and
            // cross-view jumps replay on arrival.
            replay();
            router.navigate(`/(tabs)/progress?tab=${view}` as never);
          }}
        />
      ) : null}
    </PromoPlayProvider>
  );
}

function PromoHud({
  token,
  slowMo,
  reducedMotion,
  onReplay,
  onReset,
  onToggleSlow,
  onHide,
  onGo,
  onGoProgress,
}: {
  token: number;
  slowMo: boolean;
  reducedMotion: boolean;
  onReplay: () => void;
  onReset: () => void;
  onToggleSlow: () => void;
  onHide: () => void;
  onGo: (route: string) => void;
  onGoProgress: (view: ProgressView) => void;
}) {
  return (
    <View style={styles.hudRoot} pointerEvents="box-none">
      <View style={styles.panel}>
        <View style={styles.row}>
          <T variant="micro" style={styles.brand}>
            PROMO
          </T>
          <HudBtn label="Replay R" onPress={onReplay} active />
          <HudBtn label="Reset ⇧R" onPress={onReset} />
          <HudBtn label="Slow S" onPress={onToggleSlow} active={slowMo} />
          <HudBtn label="Hide H" onPress={onHide} />
          <T variant="micro" muted>
            #{token}
          </T>
          <T
            variant="micro"
            style={{ color: reducedMotion ? colors.gold : colors.accent, fontWeight: '700' }}>
            {reducedMotion ? 'REDUCED' : 'FULL'}
          </T>
        </View>
        <View style={[styles.row, styles.sceneRow]}>
          {SCENES.map((s) => (
            <HudBtn key={s.key} label={`${s.key} ${s.label}`} onPress={() => onGo(s.route)} />
          ))}
        </View>
        <View style={[styles.row, styles.sceneRow]}>
          <T variant="micro" style={styles.brand}>
            PRG
          </T>
          {PROGRESS_SCENES.map((s) => (
            <HudBtn key={s.view} label={s.label} onPress={() => onGoProgress(s.view)} />
          ))}
        </View>
      </View>
    </View>
  );
}

function HudBtn({ label, onPress, active }: { label: string; onPress: () => void; active?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, active && styles.btnActive]}>
      <T variant="micro" style={{ color: active ? colors.bg : colors.textDim, fontWeight: '600' }}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hudRoot: {
    position: 'absolute',
    top: 44,
    left: 8,
    zIndex: 99999,
  },
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 6,
    paddingHorizontal: 8,
    opacity: 0.94,
    maxWidth: 340,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  sceneRow: {
    marginTop: 6,
  },
  brand: {
    color: colors.accent,
    fontWeight: '700',
    letterSpacing: 1,
  },
  btn: {
    borderWidth: 1,
    borderColor: colors.borderBright,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.surface2,
  },
  btnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
