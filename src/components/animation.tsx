import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { EXERCISE_VIDEOS } from '../data/exercise-videos';
import { FIGURE_ANIMS, PULSE_MOTIF, type FigureAnim, type Point, type Pose } from '../data/poses';
import { accentTint, colors, radius, shadows } from '../theme';
import type { Exercise } from '../types';
import { T } from './Text';

const ALine = Animated.createAnimatedComponent(Line);
const ACircle = Animated.createAnimatedComponent(Circle);
const ARect = Animated.createAnimatedComponent(Rect);

type Interp = Animated.AnimatedInterpolation<number>;
type JointMap = Record<string, { x: Interp; y: Interp }>;

/** Interpolate every joint between pose A and pose B on progress t (0..1) */
function buildJoints(anim: FigureAnim, t: Animated.Value): JointMap {
  const all = new Set([...Object.keys(anim.a.joints), ...Object.keys(anim.b.joints)]);
  const out: JointMap = {};
  for (const j of all) {
    const a = anim.a.joints[j] ?? anim.b.joints[j];
    const b = anim.b.joints[j] ?? anim.a.joints[j];
    out[j] = {
      x: t.interpolate({ inputRange: [0, 1], outputRange: [a.x, b.x] }),
      y: t.interpolate({ inputRange: [0, 1], outputRange: [a.y, b.y] }),
    };
  }
  // torso midpoint for front view
  if (anim.a.joints.hipL && anim.a.joints.hipR && anim.b.joints.hipL && anim.b.joints.hipR) {
    const mid = (p: Pose, k: 'x' | 'y') => (p.joints.hipL[k] + p.joints.hipR[k]) / 2;
    out.hipMid = {
      x: t.interpolate({ inputRange: [0, 1], outputRange: [mid(anim.a, 'x'), mid(anim.b, 'x')] }),
      y: t.interpolate({ inputRange: [0, 1], outputRange: [mid(anim.a, 'y'), mid(anim.b, 'y')] }),
    };
  }
  return out;
}

function barProps(anim: FigureAnim, t: Animated.Value) {
  if (!anim.a.bar && !anim.b.bar) return null;
  const a1 = anim.a.bar?.[0] ?? anim.b.bar![0];
  const a2 = anim.a.bar?.[1] ?? anim.b.bar![1];
  const b1 = anim.b.bar?.[0] ?? anim.a.bar![0];
  const b2 = anim.b.bar?.[1] ?? anim.a.bar![1];
  const interp = (a: Point, b: Point) => t.interpolate({ inputRange: [0, 1], outputRange: [a.x, b.x] });
  return {
    x1: t.interpolate({ inputRange: [0, 1], outputRange: [a1.x, b1.x] }),
    y1: t.interpolate({ inputRange: [0, 1], outputRange: [a1.y, b1.y] }),
    x2: t.interpolate({ inputRange: [0, 1], outputRange: [a2.x, b2.x] }),
    y2: t.interpolate({ inputRange: [0, 1], outputRange: [a2.y, b2.y] }),
  };
}

const BODY = '#2B3139';

function useLoop(anim: FigureAnim): Animated.Value {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const cycle = (anim.duration ?? 2600) / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: cycle, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(t, { toValue: 0, duration: cycle, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, anim]);
  return t;
}

function FigureBody({ anim, height }: { anim: FigureAnim; height: number }) {
  const t = useLoop(anim);
  const J = buildJoints(anim, t);
  const bar = barProps(anim, t);
  const width = height * (100 / 140);

  const seg = (a: string, b: string, w: number) =>
    J[a] && J[b] ? (
      <ALine key={`${a}${b}`} x1={J[a].x} y1={J[a].y} x2={J[b].x} y2={J[b].y} stroke={BODY} strokeWidth={w} strokeLinecap="round" />
    ) : null;

  const dumbbell = (wrist: string, a: Point, b: Point) =>
    J[wrist] ? (
      <ARect
        x={t.interpolate({ inputRange: [0, 1], outputRange: [a.x - 4, b.x - 4] })}
        y={t.interpolate({ inputRange: [0, 1], outputRange: [a.y - 3, b.y - 3] })}
        width={8}
        height={6}
        rx={2.5}
        fill={colors.accent}
      />
    ) : null;

  return (
    <Svg width={width} height={height} viewBox="0 0 100 140">
      {/* static props */}
      {anim.bench ? <Rect x={8} y={90} width={58} height={6} rx={3} fill="#0E1114" /> : null}
      {anim.platform ? <Rect x={30} y={126} width={40} height={4} rx={2} fill="#1A1E24" /> : null}
      {anim.floor ? <Line x1={8} y1={128} x2={92} y2={128} stroke="#1A1E24" strokeWidth={3} strokeLinecap="round" /> : null}

      {/* torso */}
      {J.neck && J.hipMid ? <ALine x1={J.neck.x} y1={J.neck.y} x2={J.hipMid.x} y2={J.hipMid.y} stroke={BODY} strokeWidth={13} strokeLinecap="round" /> : null}
      {J.neck && J.hip ? <ALine x1={J.neck.x} y1={J.neck.y} x2={J.hip.x} y2={J.hip.y} stroke={BODY} strokeWidth={13} strokeLinecap="round" /> : null}

      {/* head */}
      {J.head ? <ACircle cx={J.head.x} cy={J.head.y} r={7.5} fill={BODY} /> : null}

      {/* limbs */}
      {seg('shoulderL', 'elbowL', 8.5)}
      {seg('shoulderR', 'elbowR', 8.5)}
      {seg('shoulder', 'elbow', 8.5)}
      {seg('elbowL', 'wristL', 7)}
      {seg('elbowR', 'wristR', 7)}
      {seg('elbow', 'wrist', 7)}
      {seg('hipL', 'kneeL', 10)}
      {seg('hipR', 'kneeR', 10)}
      {seg('hip', 'knee', 10)}
      {seg('kneeL', 'ankleL', 9)}
      {seg('kneeR', 'ankleR', 9)}
      {seg('knee', 'ankle', 9)}
      {seg('ankle', 'foot', 6)}

      {/* moving bar */}
      {bar ? (
        <ALine x1={bar.x1} y1={bar.y1} x2={bar.x2} y2={bar.y2} stroke={colors.accent} strokeWidth={4} strokeLinecap="round" />
      ) : null}

      {/* dumbbells */}
      {anim.dumbbells && J.wristL && anim.a.joints.wristL ? dumbbell('wristL', anim.a.joints.wristL, anim.b.joints.wristL) : null}
      {anim.dumbbells && J.wristR && anim.a.joints.wristR ? dumbbell('wristR', anim.a.joints.wristR, anim.b.joints.wristR) : null}
      {anim.dumbbells && J.wrist && anim.a.joints.wrist ? dumbbell('wrist', anim.a.joints.wrist, anim.b.joints.wrist) : null}
    </Svg>
  );
}

/** Cardio motif — sweeping ECG line */
function PulseMotif({ height }: { height: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
        Animated.timing(t, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  const dash = 260;
  const offset = t.interpolate({ inputRange: [0, 1], outputRange: [dash, 0] });
  const ecg = 'M 10 50 L 30 50 L 38 38 L 46 62 L 54 44 L 58 50 L 90 50';

  return (
    <Svg width={height * 0.6} height={height * 0.6} viewBox="0 0 100 100">
      <Path
        d={ecg}
        stroke={colors.accent}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={`${dash} ${dash}`}
        strokeDashoffset={offset as never}
      />
    </Svg>
  );
}

/**
 * Looping HD exercise video (Vital Animations, original footage). The clips are
 * shot on a light studio background, so they play on a matching light card —
 * no chroma-keying, no blend modes — and the whole frame is visible.
 */
function ExerciseVideo({ source }: { source: number }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Start playback only after the VideoView has mounted — on web the player's
  // play() is a no-op until its <video> element is attached, so calling it in
  // the setup callback leaves the clip paused ("not loaded"). An effect runs
  // after mount on every platform and keeps the loop smooth.
  useEffect(() => {
    player.play();
  }, [player]);

  // Important: give the view an explicit 100%×100% box. On web, a replaced
  // element (<video>) with `auto` dimensions keeps its intrinsic size (the
  // clips are 1080×1080) even when absolutely positioned with all insets 0,
  // so it overflows the card and gets cropped by `overflow: hidden`. With an
  // explicit box, `contentFit="contain"` scales the footage to fit the card
  // and the white background shows through the letterbox bars.
  return (
    <VideoView
      player={player}
      style={styles.video}
      contentFit="contain"
      nativeControls={false}
    />
  );
}

export function ExerciseAnimation({
  exercise,
  height = 230,
  showBadge = true,
}: {
  exercise: Exercise;
  height?: number;
  showBadge?: boolean;
}) {
  const video = EXERCISE_VIDEOS[exercise.id];
  const anim = FIGURE_ANIMS[exercise.animation];
  const isPulse = PULSE_MOTIF.has(exercise.animation) || !anim;

  return (
    <View style={[styles.wrap, { height }]}>
      {video ? (
        <>
          {/* light studio background matches the footage — the full frame shows */}
          <View style={[StyleSheet.absoluteFill, styles.videoCardBg]} />
          <ExerciseVideo source={video} />
          {showBadge ? (
            <View style={styles.videoBadge}>
              <T variant="micro" style={{ color: colors.white, fontWeight: '600' }}>
                ● HD animation
              </T>
            </View>
          ) : null}
        </>
      ) : (
        <>
          <LinearGradient
            colors={[accentTint(colors.accent, 0.16), '#0D0F12']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]}
          />
          <View style={[styles.glow, { backgroundColor: `${colors.accent}12` }]} />
          {isPulse ? <PulseMotif height={height} /> : <FigureBody anim={anim} height={height} />}
          {showBadge ? (
            <View style={styles.badge}>
              <T variant="micro" style={{ color: colors.accent }}>
                ● Looping animation
              </T>
            </View>
          ) : null}
        </>
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
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
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
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(10, 11, 13, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  videoBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(10, 11, 13, 0.68)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
});
