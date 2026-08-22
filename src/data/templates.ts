import type { Difficulty, MuscleGroup, WorkoutPlan } from '../types';

export interface TemplateDay {
  id: string;
  title: string;
  emoji: string;
  muscles: MuscleGroup[];
  focusDescription?: string;
  exercises: {
    exerciseId: string;
    sets: number;
    targetReps: string;
  }[];
}

export interface ProgramTemplate {
  id: string;
  title: string;
  experience: Difficulty;
  daysPerWeek: 3 | 4 | 5;
  description: string;
  durationLabel: string;
  isRecommended?: boolean;
  scientificBadge?: string;
  days: TemplateDay[];
}

export interface ScientificCitation {
  id: string;
  title: string;
  summary: string;
  url: string;
  sourceName: string;
}

export const SCIENTIFIC_CITATIONS: ScientificCitation[] = [
  {
    id: 'acsm-2026',
    title: '2026 ACSM Position Stand',
    summary:
      'Synthesizes 137 systematic reviews (>30,000 participants) on resistance training prescription for muscle function, hypertrophy, and physical performance. Recommends training major muscle groups at least twice weekly with structured volume.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/41843416/',
    sourceName: 'PubMed 41843416',
  },
  {
    id: 'acsm-progression',
    title: 'Progression Models in Resistance Training',
    summary:
      'ACSM guideline on progressive overload: increase load (typically 2–10%) once a lifter comfortably exceeds the prescribed target rep range with proper form across sets.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/11828249/',
    sourceName: 'PubMed 11828249',
  },
  {
    id: 'freq-hypertrophy',
    title: 'Training Frequency & Hypertrophy Meta-Analysis',
    summary:
      'Systematic review demonstrating that distributing adequate weekly volume across multiple sessions per week optimizes recovery and makes high workloads manageable without excessive fatigue.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/30558493/',
    sourceName: 'PubMed 30558493',
  },
];

export const SCIENTIFIC_PRINCIPLES = [
  {
    title: 'Rep Ranges as Progression Targets',
    desc: 'Prescribed ranges (e.g. 3 × 8–12) guide load progression. Start at a challenging weight within the range and add weight once you hit the top rep limit.',
  },
  {
    title: 'Proximity to Failure (RIR)',
    desc: 'Training with 1–3 Reps in Reserve (RIR) yields equal muscle growth to complete muscular failure while significantly reducing joint strain and recovery time.',
  },
  {
    title: 'Optimal Frequency & Recovery',
    desc: 'Each muscle group is hit 2–3 times weekly across balanced multi-day splits for continuous stimulus and sustainable recovery.',
  },
];

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  // -------------------------------------------------------------------------
  // 1. BEGINNER — 3 DAYS (Full Body A/B/C) — Recommended Default
  // -------------------------------------------------------------------------
  {
    id: 'beginner-3day',
    title: 'Full Body A/B/C',
    experience: 'Beginner',
    daysPerWeek: 3,
    isRecommended: true,
    scientificBadge: 'Best for Beginners',
    description:
      'The gold standard starting point. Teaches major movement patterns with multiple weekly exposures per muscle group at manageable session volume.',
    durationLabel: '~40–55 min',
    days: [
      {
        id: 'b3-day-a',
        title: 'Full Body A',
        emoji: '🔥',
        muscles: ['Chest', 'Back', 'Quads', 'Shoulders', 'Triceps', 'Calves'],
        focusDescription: 'Horizontal Push & Pull + Quad Compound',
        exercises: [
          { exerciseId: 'bench-press', sets: 3, targetReps: '6-8' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'leg-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 2, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 2, targetReps: '12-15' },
          { exerciseId: 'triceps-pushdown', sets: 2, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 2, targetReps: '12-15' },
        ],
      },
      {
        id: 'b3-day-b',
        title: 'Full Body B',
        emoji: '⚡',
        muscles: ['Quads', 'Chest', 'Back', 'Hamstrings', 'Shoulders', 'Biceps', 'Calves'],
        focusDescription: 'Squat & Incline Press + Posterior Chain Hinge',
        exercises: [
          { exerciseId: 'goblet-squat', sets: 3, targetReps: '8-12' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'romanian-deadlift', sets: 2, targetReps: '8-10' },
          { exerciseId: 'shoulder-press', sets: 2, targetReps: '8-12' },
          { exerciseId: 'bicep-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 2, targetReps: '12-15' },
        ],
      },
      {
        id: 'b3-day-c',
        title: 'Full Body C',
        emoji: '💪',
        muscles: ['Quads', 'Back', 'Chest', 'Hamstrings', 'Shoulders', 'Biceps', 'Triceps'],
        focusDescription: 'Barbell Squat + Upper Isolation Finisher',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '6-8' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'dumbbell-bench-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'leg-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'lateral-raise', sets: 2, targetReps: '12-15' },
          { exerciseId: 'hammer-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'triceps-pushdown', sets: 2, targetReps: '10-15' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 2. BEGINNER — 4 DAYS (Upper / Lower)
  // -------------------------------------------------------------------------
  {
    id: 'beginner-4day',
    title: 'Upper / Lower',
    experience: 'Beginner',
    daysPerWeek: 4,
    description:
      'Balanced 4-day split alternating upper and lower body movements for solid foundational strength and recovery.',
    durationLabel: '~45–60 min',
    days: [
      {
        id: 'b4-upper-a',
        title: 'Upper A',
        emoji: '💪',
        muscles: ['Chest', 'Back', 'Shoulders', 'Triceps', 'Biceps'],
        focusDescription: 'Bench Press, Lat Pulldown & Shoulder Focus',
        exercises: [
          { exerciseId: 'bench-press', sets: 3, targetReps: '6-8' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 2, targetReps: '8-12' },
          { exerciseId: 'shoulder-press', sets: 2, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 2, targetReps: '12-15' },
          { exerciseId: 'triceps-pushdown', sets: 2, targetReps: '10-15' },
          { exerciseId: 'bicep-curl', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'b4-lower-a',
        title: 'Lower A',
        emoji: '🦵',
        muscles: ['Quads', 'Hamstrings', 'Calves'],
        focusDescription: 'Squat & RDL Foundation',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '6-8' },
          { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '8-10' },
          { exerciseId: 'leg-press', sets: 2, targetReps: '10-12' },
          { exerciseId: 'leg-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 3, targetReps: '12-15' },
        ],
      },
      {
        id: 'b4-upper-b',
        title: 'Upper B',
        emoji: '🏹',
        muscles: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
        focusDescription: 'Incline DB Press & Row Emphasis',
        exercises: [
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-10' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lat-pulldown', sets: 2, targetReps: '8-12' },
          { exerciseId: 'shoulder-press', sets: 2, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 2, targetReps: '12-15' },
          { exerciseId: 'hammer-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'triceps-pushdown', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'b4-lower-b',
        title: 'Lower B',
        emoji: '🦵',
        muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focusDescription: 'Leg Press & Bulgarian Split Squat Unilateral Work',
        exercises: [
          { exerciseId: 'leg-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '8-10' },
          { exerciseId: 'bulgarian-split-squat', sets: 2, targetReps: '8-12' },
          { exerciseId: 'leg-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 3, targetReps: '12-15' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 3. BEGINNER — 5 DAYS (Low-Volume Full Body Rotation)
  // -------------------------------------------------------------------------
  {
    id: 'beginner-5day',
    title: 'Full Body Rotation',
    experience: 'Beginner',
    daysPerWeek: 5,
    description:
      'Deliberately low volume per session across 5 days using rotating Full Body A/B/C routines to prevent beginner burnout.',
    durationLabel: '~35–50 min',
    days: [
      {
        id: 'b5-rot-a1',
        title: 'Full Body A (Day 1)',
        emoji: '🔥',
        muscles: ['Chest', 'Quads', 'Back', 'Shoulders', 'Triceps'],
        focusDescription: 'Bench Press, Leg Press & Lat Pulldown',
        exercises: [
          { exerciseId: 'bench-press', sets: 3, targetReps: '6-8' },
          { exerciseId: 'leg-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 2, targetReps: '12-15' },
          { exerciseId: 'triceps-pushdown', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'b5-rot-b1',
        title: 'Full Body B (Day 2)',
        emoji: '⚡',
        muscles: ['Quads', 'Chest', 'Back', 'Hamstrings', 'Biceps'],
        focusDescription: 'Goblet Squat & Incline DB Press',
        exercises: [
          { exerciseId: 'goblet-squat', sets: 3, targetReps: '8-12' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'romanian-deadlift', sets: 2, targetReps: '8-10' },
          { exerciseId: 'bicep-curl', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'b5-rot-c',
        title: 'Full Body C (Day 3)',
        emoji: '💪',
        muscles: ['Quads', 'Chest', 'Back', 'Hamstrings', 'Shoulders'],
        focusDescription: 'Barbell Squat, DB Press & Lat Pulldown',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '6-8' },
          { exerciseId: 'dumbbell-bench-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'leg-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'lateral-raise', sets: 2, targetReps: '12-15' },
        ],
      },
      {
        id: 'b5-rot-a2',
        title: 'Full Body A (Day 4)',
        emoji: '🔥',
        muscles: ['Chest', 'Quads', 'Back', 'Shoulders', 'Triceps'],
        focusDescription: 'Rotational Exposure: Bench Press & Leg Press',
        exercises: [
          { exerciseId: 'bench-press', sets: 3, targetReps: '6-8' },
          { exerciseId: 'leg-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 2, targetReps: '12-15' },
          { exerciseId: 'triceps-pushdown', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'b5-rot-b2',
        title: 'Full Body B (Day 5)',
        emoji: '⚡',
        muscles: ['Quads', 'Chest', 'Back', 'Hamstrings', 'Biceps'],
        focusDescription: 'Rotational Exposure: Goblet Squat & Rows',
        exercises: [
          { exerciseId: 'goblet-squat', sets: 3, targetReps: '8-12' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'romanian-deadlift', sets: 2, targetReps: '8-10' },
          { exerciseId: 'bicep-curl', sets: 2, targetReps: '10-15' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 4. INTERMEDIATE — 3 DAYS (Full Body A/B/C)
  // -------------------------------------------------------------------------
  {
    id: 'intermediate-3day',
    title: 'Full Body A/B/C',
    experience: 'Intermediate',
    daysPerWeek: 3,
    description:
      'Higher session volume with direct arm work and compound progression across 3 focused workouts.',
    durationLabel: '~50–65 min',
    days: [
      {
        id: 'i3-day-a',
        title: 'Day A',
        emoji: '🔥',
        muscles: ['Quads', 'Chest', 'Back', 'Hamstrings', 'Shoulders', 'Triceps', 'Biceps'],
        focusDescription: 'Squat, Bench Press & Lat Pulldown Volume',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '5-8' },
          { exerciseId: 'bench-press', sets: 3, targetReps: '6-8' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'romanian-deadlift', sets: 2, targetReps: '8-10' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-15' },
          { exerciseId: 'triceps-pushdown', sets: 2, targetReps: '10-15' },
          { exerciseId: 'bicep-curl', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'i3-day-b',
        title: 'Day B',
        emoji: '⚡',
        muscles: ['Hamstrings', 'Chest', 'Back', 'Quads', 'Shoulders', 'Biceps', 'Calves'],
        focusDescription: 'Heavy RDL, Incline Press & Leg Press',
        exercises: [
          { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '6-8' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-10' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'leg-press', sets: 3, targetReps: '10-12' },
          { exerciseId: 'shoulder-press', sets: 2, targetReps: '8-12' },
          { exerciseId: 'hammer-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 3, targetReps: '12-15' },
        ],
      },
      {
        id: 'i3-day-c',
        title: 'Day C',
        emoji: '💪',
        muscles: ['Quads', 'Chest', 'Back', 'Glutes', 'Shoulders', 'Triceps', 'Biceps'],
        focusDescription: 'Squat, DB Press, Bulgarian Split Squat & Finisher',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '6-8' },
          { exerciseId: 'dumbbell-bench-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'bulgarian-split-squat', sets: 2, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
          { exerciseId: 'triceps-pushdown', sets: 2, targetReps: '10-15' },
          { exerciseId: 'hammer-curl', sets: 2, targetReps: '10-15' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 5. INTERMEDIATE — 4 DAYS (Upper / Lower ×2) — Recommended Default
  // -------------------------------------------------------------------------
  {
    id: 'intermediate-4day',
    title: 'Upper / Lower ×2',
    experience: 'Intermediate',
    daysPerWeek: 4,
    isRecommended: true,
    scientificBadge: 'Best for Intermediates',
    description:
      'The ideal overall template for intermediate lifters. Combines compound progression with optimal twice-weekly frequency and muscle specialization.',
    durationLabel: '~50–65 min',
    days: [
      {
        id: 'i4-upper-a',
        title: 'Upper A',
        emoji: '💪',
        muscles: ['Chest', 'Back', 'Shoulders', 'Triceps', 'Biceps'],
        focusDescription: 'Bench Press, Barbell Row & Incline Work',
        exercises: [
          { exerciseId: 'bench-press', sets: 3, targetReps: '5-8' },
          { exerciseId: 'barbell-row', sets: 3, targetReps: '6-10' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
          { exerciseId: 'triceps-pushdown', sets: 2, targetReps: '10-15' },
          { exerciseId: 'bicep-curl', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'i4-lower-a',
        title: 'Lower A',
        emoji: '🦵',
        muscles: ['Quads', 'Hamstrings', 'Calves'],
        focusDescription: 'Squat, Romanian Deadlift & Leg Press',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '5-8' },
          { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '6-10' },
          { exerciseId: 'leg-press', sets: 3, targetReps: '10-12' },
          { exerciseId: 'leg-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 3, targetReps: '10-15' },
        ],
      },
      {
        id: 'i4-upper-b',
        title: 'Upper B',
        emoji: '🏹',
        muscles: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
        focusDescription: 'Incline DB Press, Rows & Overhead Triceps',
        exercises: [
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '6-10' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'shoulder-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
          { exerciseId: 'hammer-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'overhead-extension', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'i4-lower-b',
        title: 'Lower B',
        emoji: '🦵',
        muscles: ['Back', 'Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focusDescription: 'Conventional Deadlift & Split Squats',
        exercises: [
          { exerciseId: 'deadlift', sets: 2, targetReps: '4-6' },
          { exerciseId: 'bulgarian-split-squat', sets: 3, targetReps: '8-12' },
          { exerciseId: 'leg-press', sets: 3, targetReps: '10-15' },
          { exerciseId: 'leg-curl', sets: 3, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 3, targetReps: '12-15' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 6. INTERMEDIATE — 5 DAYS (Push / Pull / Legs + Upper / Lower)
  // -------------------------------------------------------------------------
  {
    id: 'intermediate-5day',
    title: 'PPL + Upper / Lower',
    experience: 'Intermediate',
    daysPerWeek: 5,
    description:
      'High-frequency hybrid split blending dedicated Push, Pull, and Legs sessions with Upper/Lower volume days.',
    durationLabel: '~50–65 min',
    days: [
      {
        id: 'i5-push',
        title: 'Push',
        emoji: '🔥',
        muscles: ['Chest', 'Shoulders', 'Triceps'],
        focusDescription: 'Bench Press, Incline DB & Shoulder Press',
        exercises: [
          { exerciseId: 'bench-press', sets: 3, targetReps: '5-8' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'shoulder-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
          { exerciseId: 'triceps-pushdown', sets: 3, targetReps: '10-15' },
        ],
      },
      {
        id: 'i5-pull',
        title: 'Pull',
        emoji: '🏹',
        muscles: ['Back', 'Shoulders', 'Biceps'],
        focusDescription: 'Deadlift, Lat Pulldown, Cable Row & Face Pull',
        exercises: [
          { exerciseId: 'deadlift', sets: 2, targetReps: '4-6' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'face-pull', sets: 2, targetReps: '12-15' },
          { exerciseId: 'bicep-curl', sets: 3, targetReps: '8-12' },
          { exerciseId: 'hammer-curl', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'i5-legs',
        title: 'Legs',
        emoji: '🦵',
        muscles: ['Quads', 'Hamstrings', 'Calves'],
        focusDescription: 'Barbell Squat, RDL, Leg Press & Leg Curl',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '5-8' },
          { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '8-10' },
          { exerciseId: 'leg-press', sets: 3, targetReps: '10-12' },
          { exerciseId: 'leg-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 3, targetReps: '12-15' },
        ],
      },
      {
        id: 'i5-upper',
        title: 'Upper',
        emoji: '💪',
        muscles: ['Chest', 'Back', 'Shoulders', 'Triceps', 'Biceps'],
        focusDescription: 'Incline DB Press, Barbell Row & Lat Pulldown',
        exercises: [
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-10' },
          { exerciseId: 'barbell-row', sets: 3, targetReps: '8-10' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '10-12' },
          { exerciseId: 'shoulder-press', sets: 2, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
          { exerciseId: 'triceps-pushdown', sets: 2, targetReps: '10-15' },
          { exerciseId: 'hammer-curl', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'i5-lower',
        title: 'Lower',
        emoji: '🦵',
        muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focusDescription: 'Squat, RDL, Bulgarian Split Squat & Press',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '6-8' },
          { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '8-10' },
          { exerciseId: 'bulgarian-split-squat', sets: 2, targetReps: '8-12' },
          { exerciseId: 'leg-press', sets: 2, targetReps: '10-15' },
          { exerciseId: 'leg-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 3, targetReps: '12-15' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 7. ADVANCED — 3 DAYS (High-Efficiency Full Body)
  // -------------------------------------------------------------------------
  {
    id: 'advanced-3day',
    title: 'High-Efficiency Full Body',
    experience: 'Advanced',
    daysPerWeek: 3,
    description:
      'Demanding, high-intensity compound sessions tailored for advanced lifters maximizing strength and hypertrophy in 3 days.',
    durationLabel: '~55–70 min',
    days: [
      {
        id: 'a3-day-a',
        title: 'Day A',
        emoji: '🔥',
        muscles: ['Quads', 'Chest', 'Back', 'Hamstrings', 'Shoulders', 'Triceps'],
        focusDescription: 'Heavy Squat (4x4-6), Bench Press (4x5-8) & Barbell Row',
        exercises: [
          { exerciseId: 'squat', sets: 4, targetReps: '4-6' },
          { exerciseId: 'bench-press', sets: 4, targetReps: '5-8' },
          { exerciseId: 'barbell-row', sets: 3, targetReps: '6-10' },
          { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '6-10' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
          { exerciseId: 'triceps-pushdown', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'a3-day-b',
        title: 'Day B',
        emoji: '⚡',
        muscles: ['Back', 'Chest', 'Quads', 'Shoulders', 'Biceps'],
        focusDescription: 'Heavy Deadlift (3x3-5), Incline DB & Split Squats',
        exercises: [
          { exerciseId: 'deadlift', sets: 3, targetReps: '3-5' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 4, targetReps: '6-10' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'bulgarian-split-squat', sets: 3, targetReps: '8-12' },
          { exerciseId: 'shoulder-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'bicep-curl', sets: 3, targetReps: '8-12' },
        ],
      },
      {
        id: 'a3-day-c',
        title: 'Day C',
        emoji: '💪',
        muscles: ['Quads', 'Chest', 'Back', 'Hamstrings', 'Shoulders', 'Biceps', 'Triceps'],
        focusDescription: 'Squat, DB Bench, Cable Row, Leg Press & Finisher',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '5-8' },
          { exerciseId: 'dumbbell-bench-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'leg-press', sets: 3, targetReps: '10-15' },
          { exerciseId: 'leg-curl', sets: 3, targetReps: '10-15' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
          { exerciseId: 'hammer-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'triceps-pushdown', sets: 2, targetReps: '10-15' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 8. ADVANCED — 4 DAYS (Upper / Lower ×2 — Strength + Hypertrophy)
  // -------------------------------------------------------------------------
  {
    id: 'advanced-4day',
    title: 'Upper / Lower ×2',
    experience: 'Advanced',
    daysPerWeek: 4,
    description:
      'Periodized strength + hypertrophy program: heavy 4x4-6 compound sessions alternated with high-volume accessory days.',
    durationLabel: '~55–70 min',
    days: [
      {
        id: 'a4-upper-a',
        title: 'Upper A (Strength Bias)',
        emoji: '💪',
        muscles: ['Chest', 'Back', 'Shoulders', 'Triceps', 'Biceps'],
        focusDescription: 'Heavy Bench Press (4x4-6) & Barbell Row (4x5-8)',
        exercises: [
          { exerciseId: 'bench-press', sets: 4, targetReps: '4-6' },
          { exerciseId: 'barbell-row', sets: 4, targetReps: '5-8' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-10' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
          { exerciseId: 'triceps-pushdown', sets: 3, targetReps: '10-15' },
          { exerciseId: 'bicep-curl', sets: 3, targetReps: '8-12' },
        ],
      },
      {
        id: 'a4-lower-a',
        title: 'Lower A (Strength Bias)',
        emoji: '🦵',
        muscles: ['Quads', 'Hamstrings', 'Calves'],
        focusDescription: 'Heavy Squat (4x4-6) & Romanian Deadlift (3x6-8)',
        exercises: [
          { exerciseId: 'squat', sets: 4, targetReps: '4-6' },
          { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '6-8' },
          { exerciseId: 'leg-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'leg-curl', sets: 3, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 3, targetReps: '10-15' },
        ],
      },
      {
        id: 'a4-upper-b',
        title: 'Upper B (Hypertrophy Bias)',
        emoji: '🏹',
        muscles: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
        focusDescription: 'Incline DB Bench (4x6-10) & High-Volume Lat Pulldown',
        exercises: [
          { exerciseId: 'incline-dumbbell-bench-press', sets: 4, targetReps: '6-10' },
          { exerciseId: 'lat-pulldown', sets: 4, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'shoulder-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
          { exerciseId: 'hammer-curl', sets: 3, targetReps: '10-15' },
          { exerciseId: 'overhead-extension', sets: 3, targetReps: '10-15' },
        ],
      },
      {
        id: 'a4-lower-b',
        title: 'Lower B (Hypertrophy Bias)',
        emoji: '🦵',
        muscles: ['Back', 'Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focusDescription: 'Deadlift (3x3-5) & High-Rep Leg Work',
        exercises: [
          { exerciseId: 'deadlift', sets: 3, targetReps: '3-5' },
          { exerciseId: 'bulgarian-split-squat', sets: 3, targetReps: '8-12' },
          { exerciseId: 'leg-press', sets: 3, targetReps: '10-15' },
          { exerciseId: 'leg-curl', sets: 3, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 4, targetReps: '12-20' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 9. ADVANCED — 5 DAYS (PPL + Upper / Lower) — Recommended Default
  // -------------------------------------------------------------------------
  {
    id: 'advanced-5day',
    title: 'PPL + Upper / Lower',
    experience: 'Advanced',
    daysPerWeek: 5,
    isRecommended: true,
    scientificBadge: 'Best for Advanced',
    description:
      'The highest-volume program. Combines full Push/Pull/Legs specialization with high-frequency Upper/Lower hypertrophy rounds.',
    durationLabel: '~60–75 min',
    days: [
      {
        id: 'a5-push',
        title: 'Day 1 — Push',
        emoji: '🔥',
        muscles: ['Chest', 'Shoulders', 'Triceps'],
        focusDescription: 'Heavy Bench Press (4x4-6), Incline & Triceps Extensions',
        exercises: [
          { exerciseId: 'bench-press', sets: 4, targetReps: '4-6' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '6-10' },
          { exerciseId: 'shoulder-press', sets: 3, targetReps: '8-10' },
          { exerciseId: 'lateral-raise', sets: 4, targetReps: '12-20' },
          { exerciseId: 'triceps-pushdown', sets: 3, targetReps: '10-15' },
          { exerciseId: 'overhead-extension', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'a5-pull',
        title: 'Day 2 — Pull',
        emoji: '🏹',
        muscles: ['Back', 'Shoulders', 'Biceps'],
        focusDescription: 'Deadlift (3x3-5), Barbell Row (3x6-10) & Face Pulls',
        exercises: [
          { exerciseId: 'deadlift', sets: 3, targetReps: '3-5' },
          { exerciseId: 'barbell-row', sets: 3, targetReps: '6-10' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'face-pull', sets: 2, targetReps: '12-20' },
          { exerciseId: 'bicep-curl', sets: 3, targetReps: '8-12' },
          { exerciseId: 'hammer-curl', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'a5-legs',
        title: 'Day 3 — Legs',
        emoji: '🦵',
        muscles: ['Quads', 'Hamstrings', 'Calves'],
        focusDescription: 'Heavy Squat (4x4-6), RDL & Standing Calf Work',
        exercises: [
          { exerciseId: 'squat', sets: 4, targetReps: '4-6' },
          { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '6-10' },
          { exerciseId: 'leg-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'leg-curl', sets: 3, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 4, targetReps: '10-15' },
        ],
      },
      {
        id: 'a5-upper',
        title: 'Day 4 — Upper',
        emoji: '💪',
        muscles: ['Chest', 'Back', 'Shoulders', 'Triceps', 'Biceps'],
        focusDescription: 'Incline DB Press (3x8-10), Lat Pulldown & Seated Row',
        exercises: [
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-10' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'shoulder-press', sets: 2, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
          { exerciseId: 'triceps-pushdown', sets: 2, targetReps: '10-15' },
          { exerciseId: 'bicep-curl', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'a5-lower',
        title: 'Day 5 — Lower',
        emoji: '🦵',
        muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focusDescription: 'Squat (3x6-8), RDL, Bulgarian Split Squats & Finisher',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '6-8' },
          { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '8-10' },
          { exerciseId: 'bulgarian-split-squat', sets: 3, targetReps: '8-12' },
          { exerciseId: 'leg-press', sets: 2, targetReps: '10-15' },
          { exerciseId: 'leg-curl', sets: 3, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 4, targetReps: '12-20' },
        ],
      },
    ],
  },
];

/**
 * Converts a ProgramTemplate's days to WorkoutPlan format for saving into `plans`
 */
export function templateToPlans(template: ProgramTemplate): WorkoutPlan[] {
  return template.days.map((d) => ({
    id: `plan-${d.id}-${Date.now().toString(36)}`,
    title: d.title,
    emoji: d.emoji,
    muscles: d.muscles,
    exercises: d.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      sets: e.sets,
      targetReps: e.targetReps,
    })),
  }));
}
