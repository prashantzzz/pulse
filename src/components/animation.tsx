import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';

import { getExerciseAnimation } from '../data/exercise-animations';
import { MuscleTargetMap } from './muscle-map';
import { radius, shadows } from '../theme';
import type { Exercise } from '../types';

/**
 * Looping HD exercise video (Vital Animations, original footage). The clips are
 * shot on a light studio background, so they play on a matching light card —
 * no chroma-keying, no blend modes — and the whole frame is visible.
 */
function ExerciseVideo({ source }: { source: number }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.staysActiveInBackground = true;
  });

  // Start playback as soon as the source is ready. Calling play() before the
  // <video> element is attached (or before media has loaded) is a silent no-op
  // that leaves the card blank — so we retry whenever the player reports
  // readyToPlay, and also fire play() from the mount effect as a fallback.
  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay' && !player.playing) {
        player.play();
      }
    });
    player.play();
    return () => sub.remove();
  }, [player]);

  // Keep playback running seamlessly when switching between apps or web tabs
  useEffect(() => {
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        player.play();
      }
    });

    let handleVisibility: (() => void) | undefined;
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      handleVisibility = () => {
        if (!document.hidden) {
          player.play();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      appSub.remove();
      if (handleVisibility) {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [player]);

  // Important: give the view an explicit 100%×100% box. On web, a replaced
  // element (<video>) with `auto` dimensions keeps its intrinsic size (the
  // clips are 1080×1080) even when absolutely positioned with all insets 0,
  // so it overflows the card and gets cropped by `overflow: hidden`. With an
  // explicit box, `contentFit="contain"` scales the footage to fit the card
  // and the white background shows through the letterbox bars.
  // Some embedded webviews (e.g. the Freebuff preview pane) don't composite
  // <video> surfaces: the clip plays but the card stays blank white. On web we
  // keep the VideoView as the playback driver (it mounts the <video> element)
  // but paint every frame onto an overlay <canvas>, which composites reliably
  // everywhere. Native keeps the regular VideoView.
  if (Platform.OS !== 'web') {
    return (
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
      />
    );
  }
  return <WebExerciseVideo player={player} />;
}

/**
 * Web-only video surface: a hidden VideoView drives playback while a canvas
 * overlay paints every frame. Scaled strictly by height so both upper and
 * bottom ends of square and landscape footage are fully visible, with left
 * and right adjusting automatically over the matching studio background.
 */
function WebExerciseVideo({ player }: { player: ReturnType<typeof useVideoPlayer> }) {
  const hostRef = useRef<View>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const hostEl = host as unknown as HTMLElement;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    hostEl.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const video = hostEl.querySelector('video');
      if (!ctx || !video) return;
      const cw = canvas.clientWidth || 300;
      const ch = canvas.clientHeight || 240;
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, cw, ch);
      if (!video.videoWidth || !video.videoHeight) return;
      // Fit strictly by height: both upper and bottom ends of the video are fully
      // visible and aligned (height = ch), with width adjusting automatically
      const s = ch / video.videoHeight;
      const w = video.videoWidth * s;
      const h = ch;
      ctx.drawImage(video, (cw - w) / 2, 0, w, h);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      canvas.remove();
    };
  }, [player]);

  return (
    <View ref={hostRef} style={styles.video}>
      {/* playback driver only — hidden behind the canvas */}
      <VideoView player={player} style={styles.webVideoOffscreen} contentFit="contain" nativeControls={false} />
    </View>
  );
}

/**
 * Fallback card for exercises that have no bundled animation: the anatomical
 * muscle-highlight figure (same view the Muscles tab shows) on the dark card,
 * so the exercise page never renders a blank/white surface. Drop a real
 * animation into assets/vital + one line in exercise-animations.ts and
 * this branch is replaced automatically.
 */
function MuscleFallback({ exercise, height, gender }: { exercise: Exercise; height: number; gender: 'male' | 'female' }) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.muscleFallbackCard]}>
      <MuscleTargetMap exercise={exercise} primary={exercise.muscleGroup} secondary={exercise.secondaryMuscles} height={height - 28} gender={gender} />
    </View>
  );
}

export function ExerciseAnimation({
  exercise,
  height = 230,
  gender = 'male',
}: {
  exercise: Exercise;
  height?: number;
  gender?: 'male' | 'female';
}) {
  const asset = getExerciseAnimation(exercise.id);

  return (
    <View style={[styles.wrap, { height }]}>
      {asset?.type === 'video' ? (
        <>
          {/* light studio background matches the footage — the full frame shows */}
          <View style={[StyleSheet.absoluteFill, styles.videoCardBg]} />
          <ExerciseVideo source={asset.source} />
        </>
      ) : (
        <MuscleFallback exercise={exercise} height={height} gender={gender} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...(shadows.card as object),
  },
  muscleFallbackCard: {
    backgroundColor: '#0D0F12',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingTop: 8,
  },
  videoCardBg: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E3DF',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  webVideoOffscreen: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
});
