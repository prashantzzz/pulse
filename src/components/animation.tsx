import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { AppState, Image, Platform, StyleSheet, View } from 'react-native';

import { getExerciseAnimation } from '../data/exercise-animations';
import { MuscleTargetMap } from './muscle-map';
import { radius, shadows } from '../theme';
import type { Exercise } from '../types';

/**
 * Looping HD exercise video (Vital Animations, original footage). The clips are
 * shot on a light studio background, so they play on a matching light card —
 * no chroma-keying, no blend modes — and the whole frame is visible.
 */
function ExerciseVideo({ source, assetAspectRatio }: { source: number; assetAspectRatio?: number }) {
  const [aspectRatio, setAspectRatio] = useState<number>(() => {
    if (assetAspectRatio && assetAspectRatio > 0) {
      return assetAspectRatio;
    }
    try {
      const res = Image.resolveAssetSource(source);
      if (res?.width && res?.height && res.height > 0) {
        return res.width / res.height;
      }
    } catch {}
    return 1;
  });

  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.staysActiveInBackground = true;
  });

  // Track video aspect ratio dynamically when video source loads
  useEffect(() => {
    const subLoad = player.addListener('sourceLoad', (payload) => {
      const track = payload?.availableVideoTracks?.[0];
      if (track?.size?.width && track?.size?.height && track.size.height > 0) {
        setAspectRatio(track.size.width / track.size.height);
      }
    });
    const subTrack = player.addListener('videoTrackChange', (payload) => {
      const track = payload?.videoTrack;
      if (track?.size?.width && track?.size?.height && track.size.height > 0) {
        setAspectRatio(track.size.width / track.size.height);
      }
    });
    return () => {
      subLoad.remove();
      subTrack.remove();
    };
  }, [player]);

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

  // Important: On Android and iOS native, wrap in a height: 100% container with
  // the video's exact aspect ratio so both top and bottom edges strictly touch
  // the card boundaries without letterbox gaps, with left and right adjusting automatically.
  // On web we use the canvas overlay for universal compatibility.
  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.videoContainer, { aspectRatio }]}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
        />
      </View>
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
          <ExerciseVideo source={asset.source} assetAspectRatio={asset.aspectRatio} />
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
  videoContainer: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
