import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Body, { type ExtendedBodyPart, type Slug } from 'react-native-body-highlighter';
import { resolveExercise } from '../data/exercises';
import { GROUP_TO_SLUGS } from '../lib/stats';
import type { MuscleSlug, Workout } from '../types';

type Side = 'front' | 'back';

const VIEW_H = 400;
const VIEW_W = 200;

/** Base uncolored body fill and outline matching dark mode */
const UNWORKED_FILL = '#1B2129';
const UNWORKED_STROKE = 'rgba(255, 255, 255, 0.12)';

/** Vibrant neon green for worked muscles */
const WORKED_FILL = '#22C55E';
const WORKED_STROKE = '#4ADE80';

const SIDE_SLUGS: Record<Side, Slug[]> = {
  front: [
    'abs',
    'adductors',
    'ankles',
    'biceps',
    'calves',
    'chest',
    'deltoids',
    'feet',
    'forearm',
    'hair',
    'hands',
    'head',
    'knees',
    'neck',
    'obliques',
    'quadriceps',
    'tibialis',
    'trapezius',
    'triceps',
  ],
  back: [
    'adductors',
    'ankles',
    'calves',
    'deltoids',
    'feet',
    'forearm',
    'gluteal',
    'hair',
    'hamstring',
    'hands',
    'head',
    'lower-back',
    'neck',
    'trapezius',
    'triceps',
    'upper-back',
  ],
};

/**
 * Extracts all unique anatomical slugs stimulated during this workout session.
 */
export function getWorkedSlugsForWorkout(workout: Workout): Set<Slug> {
  const worked = new Set<Slug>();
  for (const we of workout.exercises) {
    if (!we.sets.some((s) => s.completed)) continue;
    const ex = resolveExercise(we.exerciseId);
    if (!ex) continue;

    const targets: MuscleSlug[] =
      ex.targetSlugs && ex.targetSlugs.length > 0
        ? ex.targetSlugs
        : (GROUP_TO_SLUGS[ex.muscleGroup] || []);

    const secondaries: MuscleSlug[] =
      ex.secondarySlugs && ex.secondarySlugs.length > 0
        ? ex.secondarySlugs
        : (ex.secondaryMuscles.flatMap((m) => GROUP_TO_SLUGS[m] || []));

    for (const slug of targets) worked.add(slug as Slug);
    for (const slug of secondaries) worked.add(slug as Slug);
  }
  return worked;
}

function buildSideData(side: Side, workedSlugs: Set<Slug>): ExtendedBodyPart[] {
  const data: ExtendedBodyPart[] = [];
  for (const slug of SIDE_SLUGS[side]) {
    if (workedSlugs.has(slug)) {
      data.push({
        slug,
        styles: {
          fill: WORKED_FILL,
          stroke: WORKED_STROKE,
          strokeWidth: 1.2,
        },
      });
    } else {
      data.push({ slug });
    }
  }
  return data;
}

export interface WorkoutMuscleHeroProps {
  workout: Workout;
  gender?: 'male' | 'female';
  height?: number;
}

/**
 * Modern, minimalist 2D anatomical muscle model showing Front and Back views side-by-side.
 * Strictly no text labels and no pointer lines.
 * Highlights worked muscles in vibrant green, with unworked muscles in subtle dark slate outline.
 */
export function WorkoutMuscleHero({
  workout,
  gender = 'male',
  height = 200,
}: WorkoutMuscleHeroProps) {
  const scale = height / VIEW_H;
  const figureWidth = VIEW_W * scale;

  const workedSlugs = useMemo(() => getWorkedSlugsForWorkout(workout), [workout]);
  const frontData = useMemo(() => buildSideData('front', workedSlugs), [workedSlugs]);
  const backData = useMemo(() => buildSideData('back', workedSlugs), [workedSlugs]);

  return (
    <View style={[styles.container, { height }]}>
      {/* Dual intersecting ambient circular backdrops behind models */}
      <View style={[styles.ambientCircle, { left: '14%' }]} pointerEvents="none" />
      <View style={[styles.ambientCircle, { right: '14%' }]} pointerEvents="none" />

      {/* Front View */}
      <View style={[styles.figureWrapper, { width: figureWidth, height }]}>
        <Body
          data={frontData}
          side="front"
          scale={scale}
          gender={gender}
          border="transparent"
          defaultFill={UNWORKED_FILL}
          defaultStroke={UNWORKED_STROKE}
          defaultStrokeWidth={1}
        />
      </View>

      {/* Back View */}
      <View style={[styles.figureWrapper, { width: figureWidth, height }]}>
        <Body
          data={backData}
          side="back"
          scale={scale}
          gender={gender}
          border="transparent"
          defaultFill={UNWORKED_FILL}
          defaultStroke={UNWORKED_STROKE}
          defaultStrokeWidth={1}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    position: 'relative',
    marginVertical: 4,
  },
  figureWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ambientCircle: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.12)',
    alignSelf: 'center',
  },
});
