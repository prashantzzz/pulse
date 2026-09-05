import { genUuid } from '../lib/uuid';
import type { Difficulty, MuscleGroup, WorkoutPlan } from '../types';
import { EXERCISE_MAP } from './exercises';

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
  // 1. BEGINNER — 3 DAYS (Full Body A/B/C) — Strongly Recommended
  // -------------------------------------------------------------------------
  {
    id: 'beginner-3day',
    title: 'Full Body A/B/C',
    experience: 'Beginner',
    daysPerWeek: 3,
    isRecommended: true,
    scientificBadge: 'Best for Beginners',
    description:
      'The highest value starting routine. Trains nearly the entire body across 3 focused sessions with ~12 working sets per workout, maximizing frequency and technique without junk volume.',
    durationLabel: '~45–55 min',
    days: [
      {
        id: 'b3-day-a',
        title: 'Full Body A',
        emoji: '🔥',
        muscles: ['Quads', 'Chest', 'Back', 'Hamstrings', 'Shoulders'],
        focusDescription: 'Squat, Bench Press, Lat Pulldown & RDL',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '6-8' },
          { exerciseId: 'bench-press', sets: 3, targetReps: '6-8' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'romanian-deadlift', sets: 2, targetReps: '8-10' },
          { exerciseId: 'lateral-raise', sets: 2, targetReps: '12-15' },
        ],
      },
      {
        id: 'b3-day-b',
        title: 'Full Body B',
        emoji: '⚡',
        muscles: ['Quads', 'Chest', 'Back', 'Shoulders', 'Biceps'],
        focusDescription: 'Leg Press, Incline DB Press, Cable Row & Arms',
        exercises: [
          { exerciseId: 'leg-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'shoulder-press', sets: 2, targetReps: '8-12' },
          { exerciseId: 'bicep-curl', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'b3-day-c',
        title: 'Full Body C',
        emoji: '💪',
        muscles: ['Quads', 'Chest', 'Back', 'Hamstrings', 'Triceps'],
        focusDescription: 'Goblet Squat, DB Bench Press & Triceps',
        exercises: [
          { exerciseId: 'goblet-squat', sets: 3, targetReps: '8-12' },
          { exerciseId: 'dumbbell-bench-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'leg-curl', sets: 2, targetReps: '10-15' },
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
      'A clean, highly structured 4-day split with 10–12 working sets per session. Balances compound lifts and recovery with dedicated upper and lower body days.',
    durationLabel: '~45–55 min',
    days: [
      {
        id: 'b4-upper-a',
        title: 'Upper A',
        emoji: '🏹',
        muscles: ['Chest', 'Back', 'Shoulders', 'Biceps'],
        focusDescription: 'Bench Press, Pulldown, Row & Arms',
        exercises: [
          { exerciseId: 'bench-press', sets: 3, targetReps: '6-8' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 2, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 2, targetReps: '12-15' },
          { exerciseId: 'bicep-curl', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'b4-lower-a',
        title: 'Lower A',
        emoji: '🦵',
        muscles: ['Quads', 'Hamstrings', 'Calves'],
        focusDescription: 'Squat, RDL, Leg Press & Calves',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '6-8' },
          { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '8-10' },
          { exerciseId: 'leg-press', sets: 2, targetReps: '10-12' },
          { exerciseId: 'leg-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 2, targetReps: '12-15' },
        ],
      },
      {
        id: 'b4-upper-b',
        title: 'Upper B',
        emoji: '⚡',
        muscles: ['Chest', 'Back', 'Shoulders', 'Triceps'],
        focusDescription: 'Incline Press, Pulldown, Cable Row & Triceps',
        exercises: [
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-10' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 2, targetReps: '8-12' },
          { exerciseId: 'shoulder-press', sets: 2, targetReps: '8-12' },
          { exerciseId: 'triceps-pushdown', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'b4-lower-b',
        title: 'Lower B',
        emoji: '🔥',
        muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focusDescription: 'Leg Press, RDL, Bulgarian Split Squats & Leg Curl',
        exercises: [
          { exerciseId: 'leg-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '8-10' },
          { exerciseId: 'bulgarian-split-squat', sets: 2, targetReps: '8-12' },
          { exerciseId: 'leg-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 2, targetReps: '12-15' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 3. BEGINNER — 5 DAYS (Upper / Lower + Full Body)
  // -------------------------------------------------------------------------
  {
    id: 'beginner-5day',
    title: 'Upper / Lower + Full Body',
    experience: 'Beginner',
    daysPerWeek: 5,
    description:
      'Distributes weekly volume across 5 short, highly manageable workouts (8–12 sets) without overloading single-session recovery.',
    durationLabel: '~40–50 min',
    days: [
      {
        id: 'b5-upper-a',
        title: 'Upper A',
        emoji: '🏹',
        muscles: ['Chest', 'Back', 'Shoulders', 'Biceps'],
        focusDescription: 'Bench Press, Pulldown, Row & Arms',
        exercises: [
          { exerciseId: 'bench-press', sets: 3, targetReps: '6-8' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 2, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 2, targetReps: '12-15' },
          { exerciseId: 'bicep-curl', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'b5-lower-a',
        title: 'Lower A',
        emoji: '🦵',
        muscles: ['Quads', 'Hamstrings', 'Calves'],
        focusDescription: 'Squat, RDL, Leg Press & Calves',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '6-8' },
          { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '8-10' },
          { exerciseId: 'leg-press', sets: 2, targetReps: '10-12' },
          { exerciseId: 'leg-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 2, targetReps: '12-15' },
        ],
      },
      {
        id: 'b5-full-body',
        title: 'Full Body',
        emoji: '🔥',
        muscles: ['Quads', 'Chest', 'Back', 'Hamstrings', 'Shoulders'],
        focusDescription: 'Goblet Squat, Incline Press, Pulldown & RDL',
        exercises: [
          { exerciseId: 'goblet-squat', sets: 2, targetReps: '8-12' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 2, targetReps: '8-12' },
          { exerciseId: 'lat-pulldown', sets: 2, targetReps: '8-12' },
          { exerciseId: 'romanian-deadlift', sets: 2, targetReps: '10-12' },
          { exerciseId: 'lateral-raise', sets: 2, targetReps: '12-15' },
        ],
      },
      {
        id: 'b5-upper-b',
        title: 'Upper B',
        emoji: '⚡',
        muscles: ['Chest', 'Back', 'Shoulders', 'Triceps'],
        focusDescription: 'Incline Press, Cable Row, Pulldown & Triceps',
        exercises: [
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-10' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lat-pulldown', sets: 2, targetReps: '8-12' },
          { exerciseId: 'shoulder-press', sets: 2, targetReps: '8-12' },
          { exerciseId: 'triceps-pushdown', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'b5-lower-b',
        title: 'Lower B',
        emoji: '💪',
        muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focusDescription: 'Leg Press, RDL, Bulgarian Split Squats & Leg Curl',
        exercises: [
          { exerciseId: 'leg-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '8-10' },
          { exerciseId: 'bulgarian-split-squat', sets: 2, targetReps: '8-12' },
          { exerciseId: 'leg-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 2, targetReps: '12-15' },
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
      'High-efficiency full-body split for intermediate lifters. Combines heavy barbell compounds with targeted accessory work across 3 alternating days.',
    durationLabel: '~50–60 min',
    days: [
      {
        id: 'i3-day-a',
        title: 'Full Body A',
        emoji: '🔥',
        muscles: ['Quads', 'Chest', 'Back', 'Hamstrings', 'Shoulders'],
        focusDescription: 'Heavy Squat, Bench Press, Pulldown & RDL',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '5-8' },
          { exerciseId: 'bench-press', sets: 3, targetReps: '6-8' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'romanian-deadlift', sets: 2, targetReps: '8-10' },
          { exerciseId: 'lateral-raise', sets: 2, targetReps: '12-20' },
        ],
      },
      {
        id: 'i3-day-b',
        title: 'Full Body B',
        emoji: '⚡',
        muscles: ['Quads', 'Chest', 'Back', 'Shoulders', 'Biceps'],
        focusDescription: 'Leg Press, Incline Press, Barbell Row & Arms',
        exercises: [
          { exerciseId: 'leg-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'barbell-row', sets: 3, targetReps: '6-10' },
          { exerciseId: 'shoulder-press', sets: 2, targetReps: '8-12' },
          { exerciseId: 'bicep-curl', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'i3-day-c',
        title: 'Full Body C',
        emoji: '💪',
        muscles: ['Quads', 'Chest', 'Back', 'Hamstrings', 'Triceps'],
        focusDescription: 'Squat, DB Bench Press, Cable Row & Arms',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '6-8' },
          { exerciseId: 'dumbbell-bench-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'leg-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'triceps-pushdown', sets: 2, targetReps: '10-15' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 5. INTERMEDIATE — 4 DAYS (Upper / Lower) — Recommended Default
  // -------------------------------------------------------------------------
  {
    id: 'intermediate-4day',
    title: 'Upper / Lower',
    experience: 'Intermediate',
    daysPerWeek: 4,
    isRecommended: true,
    scientificBadge: 'Recommended Default',
    description:
      'The premier evidence-based hypertrophy and strength routine for intermediate trainees. Pairs heavy compounds with isolated deadlift management.',
    durationLabel: '~50–60 min',
    days: [
      {
        id: 'i4-upper-a',
        title: 'Upper A',
        emoji: '🏹',
        muscles: ['Chest', 'Back', 'Shoulders'],
        focusDescription: 'Bench Press, Barbell Row, Incline DB & Pulldown',
        exercises: [
          { exerciseId: 'bench-press', sets: 3, targetReps: '5-8' },
          { exerciseId: 'barbell-row', sets: 3, targetReps: '6-10' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 2, targetReps: '8-12' },
          { exerciseId: 'lat-pulldown', sets: 2, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
        ],
      },
      {
        id: 'i4-lower-a',
        title: 'Lower A',
        emoji: '🦵',
        muscles: ['Quads', 'Hamstrings', 'Calves'],
        focusDescription: 'Heavy Squat, RDL, Leg Press & Calves',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '5-8' },
          { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '6-10' },
          { exerciseId: 'leg-press', sets: 3, targetReps: '10-12' },
          { exerciseId: 'leg-curl', sets: 2, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 2, targetReps: '12-15' },
        ],
      },
      {
        id: 'i4-upper-b',
        title: 'Upper B',
        emoji: '⚡',
        muscles: ['Chest', 'Back', 'Shoulders'],
        focusDescription: 'Incline Press, Lat Pulldown, Cable Row & Delts',
        exercises: [
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-10' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'shoulder-press', sets: 2, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
        ],
      },
      {
        id: 'i4-lower-b',
        title: 'Lower B',
        emoji: '🔥',
        muscles: ['Hamstrings', 'Quads', 'Glutes', 'Calves'],
        focusDescription: 'Deadlift, Bulgarian Split Squats & Leg Press',
        exercises: [
          { exerciseId: 'deadlift', sets: 2, targetReps: '4-6' },
          { exerciseId: 'bulgarian-split-squat', sets: 3, targetReps: '8-12' },
          { exerciseId: 'leg-press', sets: 3, targetReps: '10-15' },
          { exerciseId: 'leg-curl', sets: 3, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 3, targetReps: '12-20' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 6. INTERMEDIATE — 5 DAYS (Push / Pull / Legs + Upper / Lower)
  // -------------------------------------------------------------------------
  {
    id: 'intermediate-5day',
    title: 'Push / Pull / Legs + Upper / Lower',
    experience: 'Intermediate',
    daysPerWeek: 5,
    description:
      'High-frequency hybrid split that builds significant weekly volume without making any individual workout excessively long or fatiguing.',
    durationLabel: '~50–60 min',
    days: [
      {
        id: 'i5-push',
        title: 'Push',
        emoji: '🏹',
        muscles: ['Chest', 'Shoulders', 'Triceps'],
        focusDescription: 'Bench Press, Incline DB, Shoulder Press & Triceps',
        exercises: [
          { exerciseId: 'bench-press', sets: 3, targetReps: '5-8' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'shoulder-press', sets: 2, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
          { exerciseId: 'triceps-pushdown', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'i5-pull',
        title: 'Pull',
        emoji: '🔥',
        muscles: ['Back', 'Shoulders', 'Biceps'],
        focusDescription: 'Deadlift, Lat Pulldown, Cable Row, Face Pull & Biceps',
        exercises: [
          { exerciseId: 'deadlift', sets: 2, targetReps: '4-6' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'face-pull', sets: 2, targetReps: '12-20' },
          { exerciseId: 'bicep-curl', sets: 3, targetReps: '10-15' },
        ],
      },
      {
        id: 'i5-legs',
        title: 'Legs',
        emoji: '🦵',
        muscles: ['Quads', 'Hamstrings', 'Calves'],
        focusDescription: 'Squat, Romanian Deadlift, Leg Press & Calves',
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
        emoji: '⚡',
        muscles: ['Chest', 'Back', 'Shoulders', 'Biceps'],
        focusDescription: 'Incline Press, Barbell Row, Lat Pulldown & Arms',
        exercises: [
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-10' },
          { exerciseId: 'barbell-row', sets: 3, targetReps: '6-10' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '10-12' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
          { exerciseId: 'hammer-curl', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'i5-lower',
        title: 'Lower',
        emoji: '💪',
        muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focusDescription: 'Squat, RDL, Bulgarian Split Squat & Calves',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '6-8' },
          { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '8-10' },
          { exerciseId: 'bulgarian-split-squat', sets: 2, targetReps: '8-12' },
          { exerciseId: 'leg-curl', sets: 3, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 3, targetReps: '12-20' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 7. ADVANCED — 3 DAYS (Full Body)
  // -------------------------------------------------------------------------
  {
    id: 'advanced-3day',
    title: 'Full Body',
    experience: 'Advanced',
    daysPerWeek: 3,
    description:
      'Concentrated full-body loading for advanced trainees. Uses higher working sets per compound lift to drive maximal mechanical tension with efficient scheduling.',
    durationLabel: '~55–65 min',
    days: [
      {
        id: 'a3-day-a',
        title: 'Full Body A',
        emoji: '🔥',
        muscles: ['Quads', 'Chest', 'Back', 'Hamstrings', 'Shoulders'],
        focusDescription: 'Heavy Squat (4x), Bench Press (4x), Row & RDL',
        exercises: [
          { exerciseId: 'squat', sets: 4, targetReps: '4-6' },
          { exerciseId: 'bench-press', sets: 4, targetReps: '5-8' },
          { exerciseId: 'barbell-row', sets: 3, targetReps: '6-10' },
          { exerciseId: 'romanian-deadlift', sets: 2, targetReps: '6-10' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
        ],
      },
      {
        id: 'a3-day-b',
        title: 'Full Body B',
        emoji: '⚡',
        muscles: ['Hamstrings', 'Chest', 'Back', 'Quads', 'Shoulders'],
        focusDescription: 'Deadlift (3x), Incline DB Press (4x), Pulldown & Split Squat',
        exercises: [
          { exerciseId: 'deadlift', sets: 3, targetReps: '3-5' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 4, targetReps: '6-10' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'bulgarian-split-squat', sets: 3, targetReps: '8-12' },
          { exerciseId: 'shoulder-press', sets: 3, targetReps: '8-12' },
        ],
      },
      {
        id: 'a3-day-c',
        title: 'Full Body C',
        emoji: '💪',
        muscles: ['Quads', 'Chest', 'Back', 'Hamstrings', 'Shoulders'],
        focusDescription: 'Squat, DB Bench Press (4x), Seated Row & Leg Curl',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '5-8' },
          { exerciseId: 'dumbbell-bench-press', sets: 4, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'leg-curl', sets: 3, targetReps: '10-15' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 8. ADVANCED — 4 DAYS (Upper / Lower)
  // -------------------------------------------------------------------------
  {
    id: 'advanced-4day',
    title: 'Upper / Lower',
    experience: 'Advanced',
    daysPerWeek: 4,
    description:
      'High-volume 4-day power and hypertrophy split for seasoned lifters. Emphasizes heavy strength blocks followed by dense accessory volume.',
    durationLabel: '~55–65 min',
    days: [
      {
        id: 'a4-upper-a',
        title: 'Upper A',
        emoji: '🏹',
        muscles: ['Chest', 'Back', 'Shoulders'],
        focusDescription: 'Heavy Bench Press (4x), Heavy Barbell Row (4x) & Incline Press',
        exercises: [
          { exerciseId: 'bench-press', sets: 4, targetReps: '4-6' },
          { exerciseId: 'barbell-row', sets: 4, targetReps: '5-8' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-10' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
        ],
      },
      {
        id: 'a4-lower-a',
        title: 'Lower A',
        emoji: '🦵',
        muscles: ['Quads', 'Hamstrings', 'Calves'],
        focusDescription: 'Heavy Squat (4x), RDL (3x), Leg Press & Calves',
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
        title: 'Upper B',
        emoji: '⚡',
        muscles: ['Chest', 'Back', 'Shoulders'],
        focusDescription: 'Incline Press (4x), Lat Pulldown (4x), Seated Row & Delts',
        exercises: [
          { exerciseId: 'incline-dumbbell-bench-press', sets: 4, targetReps: '6-10' },
          { exerciseId: 'lat-pulldown', sets: 4, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'shoulder-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
        ],
      },
      {
        id: 'a4-lower-b',
        title: 'Lower B',
        emoji: '🔥',
        muscles: ['Hamstrings', 'Quads', 'Glutes', 'Calves'],
        focusDescription: 'Heavy Deadlift (3x), Bulgarian Split Squat & Leg Press',
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
  // 9. ADVANCED — 5 DAYS (PPL + Upper / Lower) — Recommended for Advanced
  // -------------------------------------------------------------------------
  {
    id: 'advanced-5day',
    title: 'Push / Pull / Legs + Upper / Lower',
    experience: 'Advanced',
    daysPerWeek: 5,
    isRecommended: true,
    scientificBadge: 'Peak Stimulus',
    description:
      'The ultimate 5-day hybrid routine for advanced athletes. Delivers high weekly stimulus with dedicated strength and hypertrophy exposure across 5 structured training sessions.',
    durationLabel: '~55–65 min',
    days: [
      {
        id: 'a5-push',
        title: 'Push',
        emoji: '🏹',
        muscles: ['Chest', 'Shoulders', 'Triceps'],
        focusDescription: 'Heavy Bench Press (4x), Incline Press, Shoulder Press & Triceps',
        exercises: [
          { exerciseId: 'bench-press', sets: 4, targetReps: '4-6' },
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '6-10' },
          { exerciseId: 'shoulder-press', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
          { exerciseId: 'triceps-pushdown', sets: 3, targetReps: '10-15' },
        ],
      },
      {
        id: 'a5-pull',
        title: 'Pull',
        emoji: '🔥',
        muscles: ['Back', 'Biceps'],
        focusDescription: 'Heavy Deadlift (3x), Barbell Row, Lat Pulldown & Arms',
        exercises: [
          { exerciseId: 'deadlift', sets: 3, targetReps: '3-5' },
          { exerciseId: 'barbell-row', sets: 3, targetReps: '6-10' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'bicep-curl', sets: 3, targetReps: '8-12' },
        ],
      },
      {
        id: 'a5-legs',
        title: 'Legs',
        emoji: '🦵',
        muscles: ['Quads', 'Hamstrings', 'Calves'],
        focusDescription: 'Heavy Squat (4x), Romanian Deadlift, Leg Press & Calves',
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
        title: 'Upper',
        emoji: '⚡',
        muscles: ['Chest', 'Back', 'Shoulders', 'Biceps'],
        focusDescription: 'Incline Press, Lat Pulldown, Cable Row, Lateral Raise & Arms',
        exercises: [
          { exerciseId: 'incline-dumbbell-bench-press', sets: 3, targetReps: '8-10' },
          { exerciseId: 'lat-pulldown', sets: 3, targetReps: '8-12' },
          { exerciseId: 'seated-cable-row', sets: 3, targetReps: '8-12' },
          { exerciseId: 'lateral-raise', sets: 3, targetReps: '12-20' },
          { exerciseId: 'hammer-curl', sets: 2, targetReps: '10-15' },
        ],
      },
      {
        id: 'a5-lower',
        title: 'Lower',
        emoji: '💪',
        muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        focusDescription: 'Squat, Romanian Deadlift, Bulgarian Split Squats & Calves',
        exercises: [
          { exerciseId: 'squat', sets: 3, targetReps: '6-8' },
          { exerciseId: 'romanian-deadlift', sets: 3, targetReps: '8-10' },
          { exerciseId: 'bulgarian-split-squat', sets: 3, targetReps: '8-12' },
          { exerciseId: 'leg-curl', sets: 3, targetReps: '10-15' },
          { exerciseId: 'calf-raise', sets: 4, targetReps: '12-20' },
        ],
      },
    ],
  },
];

/**
 * Converts a ProgramTemplate's days to WorkoutPlan format for saving into `plans`.
 * If exerciseDefaults are supplied, pre-fills the user's remembered working weights and reps.
 */
export function templateToPlans(
  template: ProgramTemplate,
  exerciseDefaults?: Record<string, { weightKg: number; reps: number }>,
): WorkoutPlan[] {
  return template.days.map((d) => ({
    id: genUuid(),
    title: d.title,
    emoji: d.emoji,
    muscles: [...d.muscles],
    exercises: d.exercises.map((e) => {
      const def = exerciseDefaults?.[e.exerciseId];
      return {
        exerciseId: e.exerciseId,
        sets: e.sets,
        targetReps: def?.reps != null ? String(def.reps) : e.targetReps,
        targetWeightKg: def?.weightKg ?? null,
      };
    }),
  }));
}

export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Development-time and test-time validation specifically for curated resistance templates.
 * Enforces data quality, canonical exercise references, and the <= 5 exercises/day rule
 * without placing artificial constraints on user-created custom builder routines.
 */
export function validateCuratedTemplates(
  templates: ProgramTemplate[] = PROGRAM_TEMPLATES,
): TemplateValidationResult {
  const errors: string[] = [];
  const seenTemplateIds = new Set<string>();

  for (const t of templates) {
    if (!t.id || seenTemplateIds.has(t.id)) {
      errors.push(`Duplicate or missing template id: "${t.id}"`);
    }
    seenTemplateIds.add(t.id);

    if (!['Beginner', 'Intermediate', 'Advanced'].includes(t.experience)) {
      errors.push(`Template "${t.id}" has invalid experience: "${t.experience}"`);
    }

    if (![3, 4, 5].includes(t.daysPerWeek)) {
      errors.push(`Template "${t.id}" has invalid daysPerWeek: ${t.daysPerWeek}`);
    }

    if (t.days.length !== t.daysPerWeek) {
      errors.push(
        `Template "${t.id}" days length (${t.days.length}) does not match daysPerWeek (${t.daysPerWeek})`,
      );
    }

    const seenDayIds = new Set<string>();
    for (let dIdx = 0; dIdx < t.days.length; dIdx++) {
      const day = t.days[dIdx];
      if (!day.id || seenDayIds.has(day.id)) {
        errors.push(`Template "${t.id}" has duplicate/missing day id: "${day.id}"`);
      }
      seenDayIds.add(day.id);

      if (day.exercises.length === 0 || day.exercises.length > 5) {
        errors.push(
          `Template "${t.id}" day "${day.title}" has ${day.exercises.length} exercises (must be 1–5)`,
        );
      }

      const seenExIds = new Set<string>();
      for (let eIdx = 0; eIdx < day.exercises.length; eIdx++) {
        const spec = day.exercises[eIdx];
        if (!spec.exerciseId || !EXERCISE_MAP[spec.exerciseId]) {
          errors.push(
            `Template "${t.id}" day "${day.title}" has unknown exercise id: "${spec.exerciseId}"`,
          );
        }
        if (seenExIds.has(spec.exerciseId)) {
          errors.push(
            `Template "${t.id}" day "${day.title}" has duplicate exercise slot: "${spec.exerciseId}"`,
          );
        }
        seenExIds.add(spec.exerciseId);

        if (!spec.sets || spec.sets <= 0) {
          errors.push(
            `Template "${t.id}" day "${day.title}" exercise "${spec.exerciseId}" has invalid sets: ${spec.sets}`,
          );
        }

        if (!spec.targetReps || !/^\d+[-–]\d+$/.test(spec.targetReps)) {
          errors.push(
            `Template "${t.id}" day "${day.title}" exercise "${spec.exerciseId}" has invalid targetReps: "${spec.targetReps}"`,
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

