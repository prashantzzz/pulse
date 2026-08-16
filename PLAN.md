# PULSE — Architecture Plan

A premium, dark-mode fitness & gym tracking app for React Native (Expo SDK 57, expo-router,
TypeScript). Brand: **PULSE** — "Train smart. Get strong. Stay consistent."

Built to be scalable to a live app: the entire data layer is behind a typed, persisted
Zustand store that a backend API can replace without touching any screen.

---

## 1. Tech stack

| Layer       | Choice                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| Framework   | Expo SDK 57 · React Native 0.86 · React 19.2 · TypeScript (strict)      |
| Navigation  | expo-router (file-based) — 5-tab bottom bar with center FAB             |
| State       | Zustand + AsyncStorage persistence (`pulse-store-v1`)                   |
| Charts/UI   | react-native-svg (custom chart kit), expo-linear-gradient, expo-font    |
| Typography  | Space Grotesk (display) + Inter (body) via @expo-google-fonts           |
| Icons       | @expo/vector-icons (Ionicons)                                           |

---

## 2. Directory layout

```
src/
  app/                  # expo-router routes (screens)
    _layout.tsx         # root stack, fonts, hydration, dev warning filter
    index.tsx           # branded splash + onboarding/tabs redirect
    onboarding.tsx      # 7-step onboarding
    (tabs)/             # Home · Workouts · Log (FAB) · Progress · Profile
    library.tsx         # exercise library (search + multi-filter)
    exercise/[id]/      # detail + form guide (directory route)
    workout/[id]/       # active workout, set logger, rest timer, summary
    history.tsx         # workout history
    replay/[id].tsx     # workout replay + evolution comparison
    leaderboard.tsx     # balanced progress score leaderboard
    challenge.tsx       # friend challenges
    achievements.tsx    # gamification gallery
    settings.tsx        # profile, CSV export, demo data controls
    gym-mode.tsx        # distraction-free training UI
    measure.tsx         # body measurements
  components/           # design system (ui, Text, charts, ring, heatmap,
                        #   muscle-map, animation, misc, set-row, workout-card)
  theme/index.ts        # colors, gradients, typography, spacing, radius, shadows
  data/                 # exercise knowledge base, pose keyframes, seed data
  lib/                  # stats engine (volume/1RM/PRs/streaks/insights) + format
  store/useStore.ts     # persisted Zustand store + useNow tick hook
  lib/csv.ts            # CSV sync: export/import in the standard tracker format
  types.ts              # CSV-compatible data model
```

> Route-structure note: expo-router forbids a file and a directory sharing a segment,
> so dynamic routes with children use directories: `workout/[id]/index.tsx` +
> `workout/[id]/log.tsx`, `exercise/[id]/index.tsx` + `exercise/[id]/form.tsx`.

---

## 3. Data model (CSV-compatible)

Maps 1:1 to a workout-log CSV:

```
Workout title, Start time, End time, Description, Exercise title, Superset ID,
Exercise notes, Set index, Set type, Weight (kg), Repetitions, Distance (km),
Duration (sec), RPE, Notes
```

```ts
ExerciseSet { id, setIndex, setType, weightKg?, reps?, distanceKm?, durationSec?,
              rpe?, notes?, supersetId?, completed, completedAt }
WorkoutExercise { id, exerciseId, order, notes?, plannedSets, targetReps, sets[] }
Workout { id, title, description, startTime, endTime, exercises[], source? }
```

- Strength sets emphasize **weight + reps**; cardio sets use **distance + duration**;
  advanced users can add **RPE, notes, supersets** — the UI already supports all of it.
- The exercise knowledge base (`data/exercises.ts`) has 38 exercises with full coaching
  content: about, 4-step form guide, common mistakes, breathing, rep ranges, beginner /
  progression / safety tips, and equipment alternatives.

---

## 4. Stats engine (`lib/stats.ts`)

Pure functions over `Workout[]` — no dependencies, unit-testable:

- `workoutStats` — volume, sets, reps, duration, calories, muscles trained
- `e1rm` (Epley), `bestForExercise`, `detectPRs` (weight / reps / 1RM vs prior history)
- `currentStreak`, `longestStreak`, `consistencyPct`, `sessionsPerWeek`
- `volumeByMuscle`, `dailyVolume`, `weeklyVolumes`, `strengthProgression`,
  `volumePerSessionByWeek`
- `whatChanged` — volume/reps/avg-weight/duration delta vs previous equivalent workout
- `prRadar` — exercises approaching a personal record
- `generateInsights` — auto-written coaching insights from real logged data
- `progressScore` — balanced leaderboard score (strength + consistency + PRs + volume +
  streak + goals; deliberately not bodyweight)

---

## 5. Signature visual features

- **Exercise animations** (`components/animation.tsx`) — 30 of the 38 exercises play a
  real looping animation GIF bundled from the free open-source **exercises-dataset**
  (github.com/hasaneyldrm/exercises-dataset, 1,324 exercises, MIT code/data; media
  © Gym visual — see NOTICE.md) via `expo-image`. Exercises without a GIF fall back to
  the built-in **animated SVG figure** (`data/poses.ts`), whose joints interpolate
  between pose keyframes; cardio exercises get an ECG pulse motif instead.
  Every exercise page shows the animation above the form guide, breathing, and tips.
  Free alternatives checked but not used: Mixamo/FBX + 3D engine (heavy for RN),
  LottieFiles JSONs (scattered, no bulk download), stock video (network-dependent).
- **Muscle heatmap** (`components/muscle-map.tsx`) — tap-able front/back body silhouettes
  colored by training volume (green = well trained → red = undertrained).
- **Custom SVG chart kit** (`components/charts.tsx`) — smooth line charts with gradient
  fills, rounded bar charts, donut charts, sparklines; `components/ring.tsx` progress +
  countdown rings; `components/heatmap.tsx` GitHub-style streak calendar.
- **Workout Fingerprint** — per-workout signature card (volume / intensity / duration).
- **Workout Replay** — any historical workout with "how it evolved" vs the previous
  equivalent session.
- **PR Radar** — "92% of PR" progress bars that give a reason to return.

---

## 6. Design system

- **Colors**: near-black `#0A0B0D` background, graphite surfaces, neon-lime `#B8FF20`
  accent used only for CTAs / active states / records / charts, emerald/teal/cyan
  supporting accents, warm orange/red for warnings.
- **Typography**: Space Grotesk for headings and big numbers, Inter for body.
- **Components** (`components/ui.tsx` + `misc.tsx`): Button (primary/outline/ghost/danger),
  Chip, Segmented control, Card, Screen + ScreenHeader + Section, Stat, ProgressBar,
  Stepper, BottomSheet, EmptyState, Toast, Skeleton, Avatar, AchievementBadge, AnimatedNumber.
- **Critical rule**: the `T` text component defaults every text node to the light
  `colors.text` color so nothing can ever render invisible on a dark surface; dark text
  is only used deliberately on bright (lime/gold) surfaces.

---

## 7. The core UX principle

**Logging a set takes a few seconds.** The active workout screen shows collapsible
exercise cards with large-touch set rows pre-filled with "last time" values; the set
logger offers weight/reps steppers, RPE, notes, a smart "try X × Y–Z today" suggestion,
and one-tap completion that flows straight into the rest timer. Gym Mode strips the UI
to huge numbers and a single giant "Complete Set" button.

---

## 8. CSV sync (export / import)

`lib/csv.ts` implements sync in the **standard tracker format** (matches the
reference `workout_data_sample.csv` column-for-column):

```
title,start_time,end_time,description,exercise_title,superset_id,exercise_notes,
set_index,set_type,weight_kg,reps,distance_km,duration_seconds,rpe
```

- **Export** (Settings → Export CSV): every logged workout → one row per set.
  Dates use the reference `"14 Aug 2026, 20:15"` style, `set_index` is 0-based,
  `working` sets are written as `normal`, exercise titles are human-readable
  (`Bench Press (Barbell)`). Web downloads a file (and copies to clipboard);
  iOS/Android writes the file and opens the system share sheet.
- **Import** (Settings → Import CSV): parses the reference format plus common
  variants (ISO dates, `Start time`/`Weight (kg)`-style headers, 1-based or
  0-based set indexes), groups rows into workouts by title + start time, maps
  exercise titles onto the knowledge base (fuzzy, equipment-aware) and adds
  lightweight *custom* exercises for anything unknown so every screen works.
  A preview sheet confirms the count before merging (deduped by title+start).
- Verified with a round-trip script (`scripts/verify-csv.ts`): the attached
  160-row sample imports as 12 workouts / 159 sets with zero unknown exercises.

## 9. Roadmap to a live app

1. Replace the persisted Zustand store's internals with an API client (same interface).
2. Add auth + real phone-contacts leaderboard (balanced score already computed server-free).
3. Wire notifications (streak reminders, challenge results, PR radar pings).
4. Replace the bundled exercise GIFs with licensed HD video loops (same component API) once the Gym visual media terms are reviewed for commercial use.
5. Back up / restore the whole store (workouts + measurements + profile) to iCloud/Drive.
