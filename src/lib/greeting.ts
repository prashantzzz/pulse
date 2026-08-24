/**
 * Home-screen greeting — time-of-day heading plus a rotating motivational
 * subheading. The subheading is picked deterministically per day (not per
 * render) so it changes every day without flickering on re-render.
 */

export type DayPart = 'morning' | 'noon' | 'evening' | 'night';

/** Hour buckets: 5–10 morning, 11–15 noon, 16–20 evening, 21–4 night. */
export function dayPart(d: Date = new Date()): DayPart {
  const h = d.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 16) return 'noon';
  if (h >= 16 && h < 21) return 'evening';
  return 'night';
}

export const GREETINGS: Record<DayPart, { heading: string; lines: string[] }> = {
  morning: {
    heading: 'Morning',
    lines: [
      'Let\u2019s rise along with the sun',
      'Early bird gets the gains.',
      'Get up before doubt gets louder',
      'Snooze button is not for you',
      'You\u2019re getting better at it',
    ],
  },
  noon: {
    heading: 'Noon',
    lines: [
      'Midday reset \u2014 let\u2019s move.',
      'Lift break >> Lunch break',
      'Noon, hustle for the muscle.',
      'Effort >> Time of the day',
      'Be as hard as the sun outside',
    ],
  },
  evening: {
    heading: 'Evening',
    lines: [
      'Evening session is the best.',
      'Day\u2019s winding down, you ain\u2019t.',
      'Close the day strong.',
      'Finish the day better.',
    ],
  },
  night: {
    heading: 'Night',
    lines: [
      'Moonlight workouts, midnight gains',
      'Night owl mode. Respect.',
      'They sleep. You strive.',
      'While they rest, rise.',
      'The real night mode is now',
    ],
  },
};

/** Stable pseudo-random index for a given day (golden-ratio hash). */
function dailyIndex(dayNum: number, length: number): number {
  return Math.abs(Math.floor(dayNum * 2654435761)) % length;
}

export interface Greeting {
  heading: string;
  sub: string;
}

export function greetingFor(d: Date = new Date()): Greeting {
  const part = dayPart(d);
  const g = GREETINGS[part];
  const dayNum = Math.floor(d.getTime() / 86400000);
  return { heading: g.heading, sub: g.lines[dailyIndex(dayNum, g.lines.length)] };
}

/** Extracts the user's first name for a concise, personal home greeting. */
export function formatGreetingName(fullName?: string | null): string {
  if (!fullName) return 'Athlete';
  const trimmed = fullName.trim();
  if (!trimmed) return 'Athlete';
  return trimmed.split(/\s+/)[0];
}

