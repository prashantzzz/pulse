import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { colors, gradients, radius } from '../theme';
import type { MuscleGroup } from '../types';

/**
 * Small original SVG glyphs per muscle group, used as exercise thumbnails.
 * Keeps the library visual without licensing photo assets.
 */

const GLYPHS: Record<MuscleGroup, React.ReactNode> = {
  Chest: (
    <>
      <Path d="M 5 8 Q 9 4 12 8 L 12 14 Q 9 16.5 5 14 Z" fill="currentColor" />
      <Path d="M 19 8 Q 15 4 12 8 L 12 14 Q 15 16.5 19 14 Z" fill="currentColor" />
    </>
  ),
  Back: (
    <>
      <Path d="M 12 4 L 19 6 L 20.5 13 L 12 16 Z" fill="currentColor" />
      <Path d="M 12 4 L 5 6 L 3.5 13 L 12 16 Z" fill="currentColor" />
      <Path d="M 12 16 L 8 21 L 16 21 Z" fill="currentColor" opacity="0.7" />
    </>
  ),
  Legs: (
    <>
      <Path d="M 6 6 Q 4 10 5 14 L 4 21 L 9 21 L 9 14 Q 9.5 8 10 6 Z" fill="currentColor" />
      <Path d="M 18 6 Q 20 10 19 14 L 20 21 L 15 21 L 15 14 Q 14.5 8 14 6 Z" fill="currentColor" />
    </>
  ),
  Shoulders: (
    <>
      <Circle cx={6} cy={8} r={3} fill="currentColor" />
      <Circle cx={18} cy={8} r={3} fill="currentColor" />
      <Rect x={3} y={11} width={18} height={3} rx={1.5} fill="currentColor" opacity="0.85" />
    </>
  ),
  Biceps: (
    <>
      <Path d="M 6 4 L 15 9 Q 17 10 17 12 L 13 15 Q 11 11 8 9 L 4 8 Z" fill="currentColor" />
      <Path d="M 15 4 L 6 9 Q 4 10 4 12 L 8 15 Q 10 11 13 9 L 17 8 Z" fill="currentColor" opacity="0.5" />
    </>
  ),
  Triceps: (
    <>
      <Path d="M 4 10 L 20 6 L 20 11 L 14 13 L 14 20 L 10 20 L 10 12 L 4 15 Z" fill="currentColor" />
    </>
  ),
  Core: (
    <>
      <Rect x={8} y={4} width={8} height={4} rx={1} fill="currentColor" />
      <Rect x={8} y={10} width={8} height={4} rx={1} fill="currentColor" />
      <Rect x={8} y={16} width={8} height={4} rx={1} fill="currentColor" />
    </>
  ),
  Calves: (
    <>
      <Path d="M 6 8 L 10 8 L 9 21 L 5 21 Z" fill="currentColor" />
      <Path d="M 18 8 L 14 8 L 15 21 L 19 21 Z" fill="currentColor" />
    </>
  ),
  Glutes: (
    <>
      <Path d="M 5 6 Q 10 5 11 9 L 10 17 Q 5 18 4 13 Z" fill="currentColor" />
      <Path d="M 19 6 Q 14 5 13 9 L 14 17 Q 19 18 20 13 Z" fill="currentColor" />
    </>
  ),
  Forearms: (
    <>
      <Path d="M 4 5 L 12 9 L 12 14 L 5 11 Z" fill="currentColor" />
      <Path d="M 20 5 L 12 9 L 12 14 L 19 11 Z" fill="currentColor" opacity="0.55" />
    </>
  ),
  Cardio: (
    <Path
      d="M 12 20 C 6 15 2 11 2 7.5 C 2 4.5 4.5 3 7 3 C 9 3 11 4.2 12 6 C 13 4.2 15 3 17 3 C 19.5 3 22 4.5 22 7.5 C 22 11 18 15 12 20 Z"
      fill="currentColor"
    />
  ),
};

const GROUP_GRADIENT: Record<MuscleGroup, keyof typeof gradients> = {
  Chest: 'accentVertical',
  Back: 'teal',
  Legs: 'emerald',
  Shoulders: 'cyan',
  Biceps: 'gold',
  Triceps: 'purple',
  Core: 'orange',
  Calves: 'emerald',
  Glutes: 'purple',
  Forearms: 'gold',
  Cardio: 'red',
};

export function MuscleGlyph({ muscle, size = 34, color = '#0A0B0D' }: { muscle: MuscleGroup; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill={color}>{GLYPHS[muscle]}</G>
    </Svg>
  );
}

export function ExerciseThumb({
  muscle,
  size = 56,
  icon,
  rounded = 14,
}: {
  muscle: MuscleGroup;
  size?: number;
  icon?: React.ReactNode;
  rounded?: number;
}) {
  const g = GROUP_GRADIENT[muscle] ?? 'accentVertical';
  return (
    <LinearGradient
      colors={[...gradients[g]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
      <View style={{ transform: [{ scale: 1.15 }] }}>
        <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24">
          <G fill="#0A0B0D">{icon ?? GLYPHS[muscle]}</G>
        </Svg>
      </View>
    </LinearGradient>
  );
}

export function gradientForMuscle(muscle: MuscleGroup) {
  return GROUP_GRADIENT[muscle] ?? 'accentVertical';
}

export { radius as thumbRadius, colors as thumbColors };
