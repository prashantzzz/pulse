import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { getExerciseThumb } from '../data/exercise-thumbnails';
import { colors, gradients, radius, useAccent } from '../theme';
import type { MuscleGroup } from '../types';

type MciName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * Production icon per muscle group (MaterialCommunityIcons — bundled with
 * @expo/vector-icons), used as exercise thumbnails. Replaces the old hand-drawn
 * SVG glyphs so every icon is a real, recognizable glyph.
 */
const MUSCLE_ICONS: Record<MuscleGroup, MciName> = {
  Chest: 'human-handsup',
  Back: 'human-male',
  Shoulders: 'weight-lifter',
  Biceps: 'arm-flex-outline',
  Triceps: 'arm-flex',
  Quads: 'human',
  Hamstrings: 'human-female',
  Glutes: 'gymnastics',
  Calves: 'run-fast',
  Core: 'ab-testing',
  Forearms: 'dumbbell',
  Cardio: 'heart-pulse',
};

/** Icon for a plan card, keyed by its legacy emoji, so plans keep their vibe */
const PLAN_EMOJI_ICONS: Record<string, MciName> = {
  '🔥': 'fire',
  '🏹': 'bow-arrow',
  '🦵': 'run',
  '💪': 'arm-flex',
  '⚡': 'lightning-bolt',
};

export function muscleIcon(muscle: MuscleGroup): MciName {
  return MUSCLE_ICONS[muscle] ?? 'dumbbell';
}

export function planIcon(emoji: string): MciName {
  return PLAN_EMOJI_ICONS[emoji] ?? 'dumbbell';
}

const GROUP_GRADIENT: Record<MuscleGroup, keyof typeof gradients> = {
  Chest: 'accentVertical',
  Back: 'teal',
  Shoulders: 'cyan',
  Biceps: 'gold',
  Triceps: 'purple',
  Quads: 'emerald',
  Hamstrings: 'cyan',
  Glutes: 'purple',
  Calves: 'emerald',
  Core: 'orange',
  Forearms: 'gold',
  Cardio: 'red',
};

export function MuscleGlyph({ muscle, size = 34, color = colors.bg }: { muscle: MuscleGroup; size?: number; color?: string }) {
  return <MaterialCommunityIcons name={muscleIcon(muscle)} size={size} color={color} />;
}

export function ExerciseThumb({
  exerciseId,
  muscle,
  size = 56,
  icon,
  rounded = 14,
  useThemeAccent = false,
  blurred = false,
}: {
  /** When the exercise has a video, its first-frame thumbnail is shown */
  exerciseId?: string;
  muscle: MuscleGroup;
  size?: number;
  icon?: React.ReactNode;
  rounded?: number;
  useThemeAccent?: boolean;
  /** Frost the photo (static GPU blur — cheap, no per-frame cost) */
  blurred?: boolean;
}) {
  const accentKey = useAccent();
  const g = GROUP_GRADIENT[muscle] ?? 'accentVertical';
  const colorsList: [string, string] = useThemeAccent
    ? [gradients.accent[0], gradients.accent[1]]
    : [gradients[g][0], gradients[g][1]];
  const thumb = exerciseId ? getExerciseThumb(exerciseId) : undefined;
  return (
    <LinearGradient
      key={`${accentKey}-${useThemeAccent}`}
      colors={colorsList}
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
      {/* Icon underneath: instant placeholder while the photo decodes, and the
          permanent fallback for exercises without a video. */}
      <View style={{ transform: [{ scale: 1.08 }] }}>
        {icon ?? <MaterialCommunityIcons name={muscleIcon(muscle)} size={size * 0.55} color="#0A0B0D" />}
      </View>
      {thumb != null ? (
        <Image
          source={thumb}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={140}
          cachePolicy="memory-disk"
          recyclingKey={exerciseId}
          blurRadius={blurred ? 10 : 0}
        />
      ) : null}
    </LinearGradient>
  );
}

export function gradientForMuscle(muscle: MuscleGroup) {
  return GROUP_GRADIENT[muscle] ?? 'accentVertical';
}

export { radius as thumbRadius, colors as thumbColors };
