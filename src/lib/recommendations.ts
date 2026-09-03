/**
 * Pure Recommendation & Goal Modifier Engine
 *
 * Responsibilities:
 * 1. Base template selection via 3x3 matrix (Experience x Days/Week) with safe fallbacks.
 * 2. Commutative (order-independent) evaluation of user onboarding goals (0 to 2 goals).
 * 3. Immutable goal modifiers that adjust compound rep ranges without mutating global templates.
 * 4. Distinct cardio & endurance guidance cards separated from the resistance WorkoutPlan.
 * 5. Educational coaching tips for progressive overload, recovery, and consistency.
 */

import { PROGRAM_TEMPLATES, type ProgramTemplate, type TemplateDay } from '../data/templates';
import type { Difficulty } from '../types';

export type CanonicalGoal = 'muscle' | 'strength' | 'fat_loss' | 'endurance' | 'health';

export interface CardioSession {
  name: string;
  activity: string;
  duration: string;
  intensity: string;
  notes: string;
}

export interface CardioGuidance {
  title: string;
  subtitle: string;
  weeklySessions: string;
  sessions: CardioSession[];
  coachingNotes: string[];
}

export interface CoachingTip {
  title: string;
  desc: string;
}

export interface GoalProfile {
  canonicalGoals: CanonicalGoal[];
  emphasisTitle: string;
  emphasisBadge: string;
  emphasisDescription: string;
  goalBadges: string[];
  strengthBias: boolean;
  cardioGuidance?: CardioGuidance;
  coachingTips: CoachingTip[];
}

export interface RecommendationInput {
  experienceLevel?: Difficulty | string | null;
  experience?: Difficulty | string | null;
  daysPerWeek?: number | null;
  frequencyPerWeek?: number | null;
  goals?: string[] | null;
  goal?: string[] | null;
}

export interface RecommendationResult {
  baseTemplate: ProgramTemplate;
  modifiedTemplate: ProgramTemplate;
  goalProfile: GoalProfile;
  emphasisTitle: string;
  emphasisBadge: string;
  emphasisDescription: string;
  goalBadges: string[];
  coachingTips: CoachingTip[];
  cardioGuidance?: CardioGuidance;
  repModifiersApplied: boolean;
}

/**
 * Normalizes any free-form or UI goal label into a canonical goal type.
 */
export function normalizeGoal(rawGoal: string | undefined | null): CanonicalGoal {
  if (!rawGoal) return 'muscle';
  const clean = rawGoal.trim().toLowerCase();

  if (clean.includes('muscle') || clean.includes('hypertrophy') || clean.includes('size')) {
    return 'muscle';
  }
  if (clean.includes('strong') || clean.includes('strength') || clean.includes('power')) {
    return 'strength';
  }
  if (clean.includes('weight') || clean.includes('fat') || clean.includes('lean') || clean.includes('cut')) {
    return 'fat_loss';
  }
  if (clean.includes('endurance') || clean.includes('cardio') || clean.includes('stamina')) {
    return 'endurance';
  }
  if (clean.includes('health') || clean.includes('maintain') || clean.includes('longevity') || clean.includes('wellness')) {
    return 'health';
  }

  return 'health';
}

/**
 * Normalizes raw experience input into a validated Difficulty with fallback to 'Beginner'.
 */
export function normalizeExperience(experience: string | undefined | null): Difficulty {
  if (!experience) return 'Beginner';
  const clean = experience.trim().toLowerCase();
  if (clean === 'advanced') return 'Advanced';
  if (clean === 'intermediate') return 'Intermediate';
  return 'Beginner';
}

/**
 * Normalizes raw days/week input into 3 | 4 | 5 with fallback to 3.
 */
export function normalizeDaysPerWeek(days: number | undefined | null): 3 | 4 | 5 {
  if (days === null || days === undefined || Number.isNaN(days)) return 3;
  if (days <= 3) return 3;
  if (days === 4) return 4;
  return 5;
}

/**
 * Deterministic selection of one of the 9 base resistance templates (3x3 matrix).
 */
export function selectBaseTemplate(
  experienceLevel?: Difficulty | string | null,
  daysPerWeek?: number | null,
): ProgramTemplate {
  const exp = normalizeExperience(experienceLevel);
  const days = normalizeDaysPerWeek(daysPerWeek);

  const matched = PROGRAM_TEMPLATES.find(
    (t) => t.experience === exp && t.daysPerWeek === days,
  );

  if (matched) return matched;

  // Fallback to beginner 3-day if somehow unmatched
  return PROGRAM_TEMPLATES[0];
}

/**
 * Evaluates 0 to 2 user goals with strict commutativity (order independence).
 * E.g., ['Build Muscle', 'Get Stronger'] produces the exact same GoalProfile
 * as ['Get Stronger', 'Build Muscle'].
 */
export function getGoalProfile(
  rawGoals?: string[] | null,
  experience: Difficulty = 'Beginner',
): GoalProfile {
  const list = (rawGoals || []).filter(Boolean);

  // Normalize and deduplicate
  const uniqueCanonical = Array.from(new Set(list.map(normalizeGoal)));

  // If user selected no goals or only invalid strings, fallback to 'muscle'
  const activeGoals: CanonicalGoal[] =
    uniqueCanonical.length > 0 ? uniqueCanonical.slice(0, 2) : ['muscle'];

  // Sort canonical goals alphabetically so evaluation is strictly commutative
  activeGoals.sort();

  const isAdvanced = experience === 'Advanced';
  const isIntermediate = experience === 'Intermediate';

  // Standard coaching tips present across resistance programs
  const baseTips: CoachingTip[] = [
    {
      title: 'Progressive Overload',
      desc: 'Add reps within the target range before adding weight. Once you hit the top rep limit on all sets with good form, increase load by 2–5%.',
    },
    {
      title: 'Proximity to Failure',
      desc: 'Train with 1–3 Reps in Reserve (RIR). You do not need to take every set to complete failure to maximize muscle and strength adaptations.',
    },
    {
      title: 'Rest & Recovery',
      desc: 'Rest 2–3 minutes on heavy compound movements (squats, bench, deadlifts) and 60–90 seconds on accessory exercises.',
    },
    {
      title: 'Training Consistency',
      desc: 'Missing a single workout is completely normal. Never double up volume to compensate—simply resume at the next scheduled session.',
    },
  ];

  // Helper to build cardio guidance
  const makeCardio = (kind: 'endurance' | 'fat_loss'): CardioGuidance => {
    if (kind === 'endurance') {
      return {
        title: 'Endurance & Conditioning Add-On',
        subtitle: 'Cardiovascular training scheduled outside resistance workouts',
        weeklySessions: isAdvanced ? '3 sessions / week' : '2 sessions / week',
        sessions: [
          {
            name: 'Aerobic Base (Zone 2)',
            activity: 'Brisk incline walk, cycling, or rowing',
            duration: isAdvanced ? '30–45 min' : isIntermediate ? '25–35 min' : '20–30 min',
            intensity: 'Conversational pace (easy / moderate)',
            notes: 'Keep heart rate steady where you can speak full sentences without gasping.',
          },
          {
            name: 'Tempo / Aerobic Flush',
            activity: 'Stair climber, elliptical, or outdoor jog',
            duration: isAdvanced ? '30–40 min' : '20–30 min',
            intensity: 'Moderate steady pace',
            notes: 'Separated from lower body lifting days by at least 12–24 hours for optimal leg recovery.',
          },
          ...(isAdvanced
            ? [
                {
                  name: 'Work Capacity Intervals (Optional)',
                  activity: 'Rower or stationary bike sprints',
                  duration: '15–20 min',
                  intensity: 'Hard efforts with equal rest (e.g. 30s hard / 60s easy)',
                  notes: 'High intensity conditioning finisher.',
                },
              ]
            : []),
        ],
        coachingNotes: [
          'Resistance training builds functional strength; cardio expands your aerobic work capacity.',
          'Keep steady-state cardio easy enough to recover quickly between lifting days.',
        ],
      };
    }

    // Kind === 'fat_loss'
    return {
      title: 'Daily Activity & Cardio Guidance',
      subtitle: 'Activity recommendations supporting fat loss and recovery',
      weeklySessions: '2–3 sessions / week + daily walking',
      sessions: [
        {
          name: 'Low-Impact Cardio A',
          activity: 'Brisk treadmill incline walk, cycling, or elliptical',
          duration: '25–35 min',
          intensity: 'Zone 2 conversational pace',
          notes: 'Gentle aerobic exercise that enhances calorie expenditure without increasing joint fatigue.',
        },
        {
          name: 'Low-Impact Cardio B',
          activity: 'Outdoor walk or stationary bike',
          duration: '25–35 min',
          intensity: 'Zone 2 steady pace',
          notes: 'Promotes blood flow and speeds muscular recovery after tough lifting sessions.',
        },
      ],
      coachingNotes: [
        'Resistance training preserves lean muscle mass; overall energy balance determines fat loss.',
        'Prioritize daily steps (7,000–10,000) and consistency over exhausting sweat sessions.',
        'We do not guarantee or estimate specific calorie burn counts because individual expenditure varies greatly.',
      ],
    };
  };

  // ── Two-Goal Combinations (sorted alphabetically) ───────────────────────────
  if (activeGoals.length === 2) {
    const key = `${activeGoals[0]}+${activeGoals[1]}`;

    switch (key) {
      case 'muscle+strength':
        return {
          canonicalGoals: activeGoals,
          emphasisTitle: 'Muscle + Strength',
          emphasisBadge: 'Strength & Hypertrophy Focus',
          emphasisDescription:
            'Combines heavier loading on core compound lifts with optimal volume for muscle growth and neuromuscular power.',
          goalBadges: ['Strength Biased', 'Hypertrophy Volume'],
          strengthBias: true,
          coachingTips: [
            {
              title: 'Heavy Compounds First',
              desc: 'Prioritize mechanical tension on your primary squat, bench, deadlift, and row movements in the 4–6 rep range.',
            },
            ...baseTips,
          ],
        };

      case 'fat_loss+muscle':
        return {
          canonicalGoals: activeGoals,
          emphasisTitle: 'Fat Loss + Muscle Retention',
          emphasisBadge: 'Hypertrophy & Activity',
          emphasisDescription:
            'Resistance training protects lean muscle mass while consistent daily activity supports healthy fat loss.',
          goalBadges: ['Muscle Preservation', 'Active Cardio'],
          strengthBias: false,
          cardioGuidance: makeCardio('fat_loss'),
          coachingTips: [
            {
              title: 'Lifting for Muscle Retention',
              desc: 'Keep lifting with progressive intensity. Resistance training signals your body to retain muscle while dieting.',
            },
            ...baseTips,
          ],
        };

      case 'endurance+muscle':
        return {
          canonicalGoals: activeGoals,
          emphasisTitle: 'Hypertrophy + Endurance',
          emphasisBadge: 'Size & Aerobic Base',
          emphasisDescription:
            'Balances muscle-building volume with structured aerobic conditioning without overtaxing systemic recovery.',
          goalBadges: ['Hypertrophy Base', 'Cardio Guidance'],
          strengthBias: false,
          cardioGuidance: makeCardio('endurance'),
          coachingTips: [
            {
              title: 'Managing Cardio Interference',
              desc: 'Keep cardio sessions low impact (walking, cycling, rowing) to avoid interfering with lower body muscle growth.',
            },
            ...baseTips,
          ],
        };

      case 'endurance+strength':
        return {
          canonicalGoals: activeGoals,
          emphasisTitle: 'Strength + Endurance',
          emphasisBadge: 'Hybrid Strength & Stamina',
          emphasisDescription:
            'Maximizes compound force production while establishing a resilient cardiovascular engine.',
          goalBadges: ['Heavy Compounds', 'Cardio Guidance'],
          strengthBias: true,
          cardioGuidance: makeCardio('endurance'),
          coachingTips: [
            {
              title: 'Quality Over Fatigue',
              desc: 'Do your strength compounds when fresh. Avoid intense leg cardio on the day immediately preceding heavy squats.',
            },
            ...baseTips,
          ],
        };

      case 'endurance+fat_loss':
        return {
          canonicalGoals: activeGoals,
          emphasisTitle: 'Conditioning + Calorie Balance',
          emphasisBadge: 'Endurance & Fat Loss Focus',
          emphasisDescription:
            'Pairs structured resistance training for strength retention with aerobic cardio to optimize work capacity and energy balance.',
          goalBadges: ['Cardio Engine', 'Calorie Balance'],
          strengthBias: false,
          cardioGuidance: makeCardio('endurance'),
          coachingTips: [
            {
              title: 'Hydration & Nutrition',
              desc: 'Fuel your endurance sessions properly with carbohydrates and fluids so lifting performance remains high.',
            },
            ...baseTips,
          ],
        };

      case 'endurance+health':
        return {
          canonicalGoals: activeGoals,
          emphasisTitle: 'Balanced Health + Endurance',
          emphasisBadge: 'Cardiovascular & Functional Fitness',
          emphasisDescription:
            'Sustainable full-body strength paired with aerobic exercise to optimize cardiovascular health and longevity.',
          goalBadges: ['Balanced Fitness', 'Cardio Health'],
          strengthBias: false,
          cardioGuidance: makeCardio('endurance'),
          coachingTips: [
            {
              title: 'Heart Health & Longevity',
              desc: 'The combination of resistance training and regular aerobic activity is the gold standard for metabolic and cardiovascular vitality.',
            },
            ...baseTips,
          ],
        };

      case 'fat_loss+health':
        return {
          canonicalGoals: activeGoals,
          emphasisTitle: 'Healthy Weight Management',
          emphasisBadge: 'Sustainable Fitness & Activity',
          emphasisDescription:
            'Focuses on sustainable, joint-friendly resistance training and daily movement for long-term health and body composition.',
          goalBadges: ['Sustainable Habits', 'Active Recovery'],
          strengthBias: false,
          cardioGuidance: makeCardio('fat_loss'),
          coachingTips: [
            {
              title: 'Sustainable Habits',
              desc: 'Focus on consistency and habits you can maintain for years rather than aggressive short-term fat-loss tactics.',
            },
            ...baseTips,
          ],
        };

      case 'health+muscle':
        return {
          canonicalGoals: activeGoals,
          emphasisTitle: 'Balanced Muscle & Longevity',
          emphasisBadge: 'Sustainable Hypertrophy',
          emphasisDescription:
            'Progressive resistance training with joint-friendly volume that seamlessly fits long-term lifestyle habits.',
          goalBadges: ['Balanced Volume', 'Joint Longevity'],
          strengthBias: false,
          coachingTips: baseTips,
        };

      case 'health+strength':
        return {
          canonicalGoals: activeGoals,
          emphasisTitle: 'Functional Strength & Longevity',
          emphasisBadge: 'Strength for Daily Life',
          emphasisDescription:
            'Builds a reliable strength foundation across essential movement patterns with sustainable volume.',
          goalBadges: ['Functional Strength', 'Long-term Health'],
          strengthBias: true,
          coachingTips: baseTips,
        };

      case 'fat_loss+strength':
        return {
          canonicalGoals: activeGoals,
          emphasisTitle: 'Strength + Fat Loss',
          emphasisBadge: 'Power & Lean Recomposition',
          emphasisDescription:
            'Heavy compound lifts preserve peak force production while regular daily activity supports steady fat loss.',
          goalBadges: ['Heavy Compounds', 'Active Activity'],
          strengthBias: true,
          cardioGuidance: makeCardio('fat_loss'),
          coachingTips: [
            {
              title: 'Maintain Heavy Loading',
              desc: 'Strive to keep training weights high on your primary lifts even while in a mild caloric deficit.',
            },
            ...baseTips,
          ],
        };

      default:
        break;
    }
  }

  // ── Single Goal Selections ──────────────────────────────────────────────────
  const single = activeGoals[0];
  switch (single) {
    case 'strength':
      return {
        canonicalGoals: activeGoals,
        emphasisTitle: 'Pure Strength Focus',
        emphasisBadge: 'Heavy Compound Progression',
        emphasisDescription:
          'Emphasizes lower rep ranges on primary multi-joint lifts to maximize mechanical tension and neuromuscular power.',
        goalBadges: ['Strength Biased', 'Low Rep Targets'],
        strengthBias: true,
        coachingTips: baseTips,
      };

    case 'fat_loss':
      return {
        canonicalGoals: activeGoals,
        emphasisTitle: 'Fat Loss & Muscle Retention',
        emphasisBadge: 'Preserve Muscle · Active Living',
        emphasisDescription:
          'Consistent resistance training protects lean muscle while daily activity and nutrition support healthy fat loss.',
        goalBadges: ['Muscle Preservation', 'Activity Guidance'],
        strengthBias: false,
        cardioGuidance: makeCardio('fat_loss'),
        coachingTips: baseTips,
      };

    case 'endurance':
      return {
        canonicalGoals: activeGoals,
        emphasisTitle: 'Strength & Endurance Base',
        emphasisBadge: 'Aerobic Engine & Stamina',
        emphasisDescription:
          'Balanced resistance training paired with dedicated aerobic sessions to build stamina and work capacity.',
        goalBadges: ['Aerobic Conditioning', 'Full Body Fitness'],
        strengthBias: false,
        cardioGuidance: makeCardio('endurance'),
        coachingTips: baseTips,
      };

    case 'health':
      return {
        canonicalGoals: activeGoals,
        emphasisTitle: 'Balanced Fitness & Health',
        emphasisBadge: 'Consistency & Joint Health',
        emphasisDescription:
          'Sustainable, full-body resistance training that emphasizes balanced movement, joint integrity, and consistency.',
        goalBadges: ['General Fitness', 'Joint Friendly'],
        strengthBias: false,
        coachingTips: baseTips,
      };

    case 'muscle':
    default:
      return {
        canonicalGoals: activeGoals,
        emphasisTitle: 'Hypertrophy Focus',
        emphasisBadge: 'Muscle Growth & Volume',
        emphasisDescription:
          'Moderate rep ranges and structured weekly volume optimized for hypertrophy and progressive overload.',
        goalBadges: ['Hypertrophy Oriented', 'Moderate Volume'],
        strengthBias: false,
        coachingTips: baseTips,
      };
  }
}

/**
 * Exercise IDs for main compound lifts that receive strength bias modifications.
 * Isolation and accessory exercises (lateral raises, curls, pushdowns, calf raises, leg curls)
 * are deliberately NEVER modified to low rep ranges.
 */
const STRENGTH_COMPOUND_EXERCISES = new Set([
  'squat',
  'bench-press',
  'deadlift',
  'barbell-row',
  'shoulder-press',
]);

/**
 * Maps standard template rep ranges to strength-biased rep ranges on core compound movements.
 */
function getStrengthModifiedReps(exerciseId: string, currentTarget: string): string {
  if (!STRENGTH_COMPOUND_EXERCISES.has(exerciseId)) {
    return currentTarget;
  }

  // Squat & Bench Press: 6-8 or 5-8 -> 4-6
  if (exerciseId === 'squat' || exerciseId === 'bench-press') {
    if (currentTarget === '6-8' || currentTarget === '5-8') return '4-6';
    return currentTarget;
  }

  // Barbell Row: 6-10 -> 5-8
  if (exerciseId === 'barbell-row') {
    if (currentTarget === '6-10') return '5-8';
    return currentTarget;
  }

  // Deadlift: 4-6 -> 3-5
  if (exerciseId === 'deadlift') {
    if (currentTarget === '4-6') return '3-5';
    return currentTarget;
  }

  // Shoulder Press: 8-12 -> 5-8
  if (exerciseId === 'shoulder-press') {
    if (currentTarget === '8-12') return '5-8';
    return currentTarget;
  }

  return currentTarget;
}

/**
 * Pure function: creates an immutable deep clone of the template with goal-adjusted rep ranges.
 * The original base template object is NEVER mutated.
 */
export function applyGoalModifiers(
  baseTemplate: ProgramTemplate,
  goalProfile: GoalProfile,
): ProgramTemplate {
  // Deep clone days and exercises so the global template remains pristine
  const clonedDays: TemplateDay[] = baseTemplate.days.map((day) => ({
    id: day.id,
    title: day.title,
    emoji: day.emoji,
    muscles: [...day.muscles],
    focusDescription: day.focusDescription,
    exercises: day.exercises.map((spec) => {
      const targetReps = goalProfile.strengthBias
        ? getStrengthModifiedReps(spec.exerciseId, spec.targetReps)
        : spec.targetReps;

      return {
        exerciseId: spec.exerciseId,
        sets: spec.sets,
        targetReps,
      };
    }),
  }));

  return {
    ...baseTemplate,
    days: clonedDays,
  };
}

/**
 * Main Pure Recommendation Function.
 *
 * Combines:
 * 1. Base template from 3x3 matrix
 * 2. Commutative goal profile
 * 3. Goal-modified clone of template
 * 4. Separate cardio guidance & coaching tips
 */
export function recommendTemplate(input: RecommendationInput): RecommendationResult {
  const exp = input.experience ?? input.experienceLevel;
  const days = input.frequencyPerWeek ?? input.daysPerWeek;
  const goals = input.goal ?? input.goals;

  const baseTemplate = selectBaseTemplate(exp, days);
  const goalProfile = getGoalProfile(goals, baseTemplate.experience);
  const modifiedTemplate = applyGoalModifiers(baseTemplate, goalProfile);

  // Check if any rep ranges were actually modified
  let repModifiersApplied = false;
  for (let d = 0; d < baseTemplate.days.length; d++) {
    const bDay = baseTemplate.days[d];
    const mDay = modifiedTemplate.days[d];
    for (let e = 0; e < bDay.exercises.length; e++) {
      if (bDay.exercises[e].targetReps !== mDay.exercises[e].targetReps) {
        repModifiersApplied = true;
        break;
      }
    }
    if (repModifiersApplied) break;
  }

  return {
    baseTemplate,
    modifiedTemplate,
    goalProfile,
    emphasisTitle: goalProfile.emphasisTitle,
    emphasisBadge: goalProfile.emphasisBadge,
    emphasisDescription: goalProfile.emphasisDescription,
    goalBadges: goalProfile.goalBadges,
    coachingTips: goalProfile.coachingTips,
    cardioGuidance: goalProfile.cardioGuidance,
    repModifiersApplied,
  };
}
