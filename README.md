# PULSE

A dark, premium React Native fitness/gym companion: teach, track, analyze and motivate.

PULSE is a **coach in your pocket**. It comes with a full exercise knowledge base
(form guides, common mistakes, breathing cues, progression tips), animated
exercise media (HD clips + GIFs), workout logging with a rest timer, deep
progress analytics (strength trends, volume, streaks, records), achievements,
a leaderboard with friends, CSV import/export, and a fully offline data model.

---

## Key Features

- **Exercise library** — 38 coached exercises searchable by muscle, equipment
  and difficulty, each with step-by-step form guides and animated media.
- **Workout logging** — start a plan, complete sets (weight/reps/RPE/notes),
  automatic rest timer, quick gym-mode logging, and a celebration summary with
  personal records.
- **Workout builder** — build custom workouts from the exercise library and
  save them to history.
- **Progress analytics** — estimated 1RM trends, volume by muscle, consistency
  heatmap and streaks, body measurements, and a personal-records leaderboard.
- **Social** — leaderboard scoring against seeded friends, friend challenges.
- **Achievements** — 17 live-computed achievement badges.
- **CSV sync** — export/import workout logs in a standard tracker format
  (see `src/lib/csv.ts`).
- **Accent theming** — the whole app re-themes live from 8 user-selectable
  accent colors.

---

## Tech Stack

- **React Native 0.86** + **Expo SDK 57** (works on iOS, Android and web)
- **TypeScript** (strict mode)
- **expo-router** — file-based routing & navigation
- **Zustand** — global state with `AsyncStorage` persistence
- **react-native-svg** — charts, rings, muscle maps, animated exercise figures
- **expo-video / expo-image** — looping exercise clips (mp4) and GIFs
- **react-native-reanimated** — (dependency of gesture-handler; the app uses
  the classic `Animated` API throughout)
- **jest-expo** — unit tests for the stats engine

No backend. All data lives on-device in AsyncStorage (seeded demo data on first
run).

---

## Project Structure

```
src/
├── app/                  # Screens — expo-router file-based routes
│   ├── _layout.tsx       # Root stack: fonts, hydration, accent, ToastHost
│   ├── (tabs)/           # The 5 bottom-tab screens
│   │   ├── _layout.tsx   # Custom tab bar with the center FAB
│   │   ├── home.tsx      # Today's plan, streak, PR celebration, radar
│   │   ├── workouts.tsx  # Plan list / templates
│   │   ├── log.tsx       # Quick-log hub (start workout, measure, challenge)
│   │   ├── progress.tsx  # Analytics shell — see components/progress/
│   │   └── profile.tsx   # Stats, favorites, achievements, social links
│   ├── exercise/[id]/    # Exercise detail + form guide
│   ├── workout/[id]/     # Active workout, set logger, rest timer, summary
│   ├── replay/[id].tsx   # Read-only replay of a past workout
│   └── ...               # builder, library, gym-mode, leaderboard,
│                         # challenge, history, achievements, measure,
│                         # onboarding, settings, splash (index)
│
├── components/           # Reusable UI
│   ├── ui.tsx            # Design-system primitives: Button, Card, Chip,
│   │                     # Screen, ScreenHeader, Section, Row, Icon, ...
│   ├── misc.tsx          # Avatar, BottomSheet, Stepper, EmptyState, Toast,
│   │                     # Skeleton, AchievementBadge, AnimatedNumber
│   ├── Text.tsx          # <T> text component bound to the type system
│   ├── charts.tsx        # Line / bar / donut / sparkline (svg)
│   ├── ring.tsx          # ProgressRing + animated CountdownRing
│   ├── heatmap.tsx       # GitHub-style training calendar
│   ├── muscle-map.tsx    # Tap-able human body heatmap
│   ├── muscle-icon.tsx   # Per-muscle icon + plan icons
│   ├── animation.tsx     # Exercise media renderer (video > gif > SVG figure)
│   ├── set-row.tsx       # One set row in the active workout
│   ├── workout-card.tsx  # PlanCard / HistoryCard / TodayWorkoutCard
│   ├── accent-preview.tsx# Theme preview mockup
│   └── progress/         # Progress screen tabs (split out of the old 570-line
│       │                 # screen — one file per tab + shared styles)
│
├── data/                 # Static knowledge base
│   ├── exercises.ts      # 38 coached exercises (EXERCISES + EXERCISE_MAP)
│   ├── exercise-animations.ts  # exercise-id → media asset mapping
│   ├── poses.ts          # SVG stick-figure poses for the fallback animation
│   ├── seed.ts           # Demo profile, plans, workouts, friends
│   └── vital-50.json     # (asset metadata)
│
├── lib/                  # Pure business logic (no React, fully unit-tested)
│   ├── stats.ts          # Volume, 1RM, PRs, streaks, analytics, insights,
│   │                     # leaderboard score — THE analytics engine
│   ├── csv.ts            # CSV export/import, fuzzy exercise resolution
│   ├── achievements.ts   # Live achievement computation
│   ├── format.ts         # kg/duration/date/percent formatters
│   └── __tests__/        # jest unit tests (npm test)
│
├── store/useStore.ts     # Zustand global store + persistence + useNow clock
├── theme/index.ts        # Design tokens: colors, gradients, fonts, type,
│                         # spacing, radius, shadows, layout + live accent
└── types.ts              # All domain models (Exercise, Workout, ExerciseSet,
                          # PR, Friend, ...)
```

---

## Application Architecture

```
Screens (src/app)
      │  present + handle user interaction
      ▼
Hooks / Zustand store (src/store/useStore.ts)
      │  global state, persisted to AsyncStorage
      ▼
Business logic (src/lib/*) — pure, testable functions
      │
      ▼
Static knowledge base (src/data/*)
```

Key principle: **screens stay thin**. Anything that computes a number from
workout data lives in `src/lib/stats.ts` (or `achievements.ts` / `csv.ts`) as a
pure function — no component contains volume/PR/streak math. The global store
(`usePulse`) holds the persisted data; screens read slices via selectors and
call actions (e.g. `completeSet`, `finishWorkout`).

---

## Data Flow

**Exercise data** (static):
```
src/data/exercises.ts ──► EXERCISE_MAP[id] ──► screens / components / stats
```

**Workout data** (the active session):
```
Plan (SEED_PLANS) ──► startWorkout() ──► activeWorkout (store)
      ──► set logger (patchSet/completeSet) ──► finishWorkout()
      ──► workouts[] (persisted history)
      ──► lib/stats.ts ──► Progress / Profile / Replay / Home
```

**Everything analytics** derives from the same `workouts[]` array:
`workoutStats`, `bestForExercise`, `detectPRs`, `currentStreak`,
`volumeByMuscle`, `progressScore`, etc. — see `src/lib/stats.ts`.

**Theme/accent**: `applyAccent()` mutates the shared `colors` object and bumps
a subscription; screens call `useAccent()` so they re-render with fresh colors
the moment the user switches accents.

---

## State Management

- **Global (Zustand, persisted):** `workouts`, `measurements`, `favorites`,
  `friends`, `profile`, `activeWorkout`, `accentKey`, onboarding flags.
  Persisted to AsyncStorage under `pulse-store-v1` (see `partialize`).
- **Local (useState):** UI state that belongs to one screen — filters,
  sheets, tabs, form drafts.
- **Derived values are never stored.** Volume, PRs, streaks, progress
  percentages are recomputed from `workouts` on demand by `lib/stats.ts`.

The store also exposes `useNow(intervalMs)` — a `useSyncExternalStore`-based
ticking clock used by the workout timer.

---

## Navigation

File-based routing via `expo-router` (root `Stack` in `src/app/_layout.tsx`,
tabs in `src/app/(tabs)/_layout.tsx`).

| Route | Screen |
| --- | --- |
| `/` | Splash → onboarding or home |
| `/(tabs)/home`, `workouts`, `log`, `progress`, `profile` | Bottom tabs |
| `/exercise/[id]` (+ `/form`) | Exercise detail / form guide |
| `/workout/[id]` (+ `/log`, `/rest`, `/summary`) | Active workout flow |
| `/replay/[id]` | Past workout replay |
| `/library`, `/builder`, `/gym-mode`, `/leaderboard`, `/challenge`, `/history`, `/achievements`, `/measure`, `/onboarding`, `/settings` | Standalone screens |

Pass **ids, not objects**, between screens (e.g. `/exercise/${id}`,
`/workout/${id}`). The exercise picker and builder communicate via query params
(`?add=<exerciseId>`).

---

## Core Domain Models

Defined in `src/types.ts`:

- **Exercise** — knowledge-base entry: muscles, equipment, difficulty,
  animation key, coaching content.
- **Workout / WorkoutExercise / ExerciseSet** — a logged session and its
  nested structure. Sets carry weight/reps/distance/duration/RPE and
  completion state.
- **WorkoutPlan** — a template (`{ exerciseId, sets, targetReps }[]`) used to
  start a session.
- **PR** — a personal record detected in a workout (weight/reps/1RM/volume,
  delta vs previous best).
- **Friend / LeaderboardEntry** — social model with a balanced 0-100 score.
- **BodyMeasurement / UserProfile** — measurements and onboarding profile.

---

## Important Business Logic (`src/lib/stats.ts`)

| Function | What it does |
| --- | --- |
| `setVolume` / `workoutStats` | Per-set and per-workout metrics (kg, sets, reps, kcal) |
| `e1rm` | Epley estimated 1RM |
| `bestForExercise` / `detectPRs` | All-time bests and PR detection with deltas |
| `currentStreak` / `longestStreak` | Consecutive-day streaks (uses padded `dayKey`) |
| `volumeByMuscle` / `dailyVolume` / `weeklyVolumes` | Volume analytics |
| `strengthProgression` / `volumePerSessionByWeek` | Chart data series |
| `progressScore` | Balanced leaderboard score (0-100) |
| `generateInsights` / `prRadar` | Auto-generated coaching insights |

`lib/achievements.ts` computes all 17 badges; `lib/csv.ts` handles the
tracker-format CSV round-trip, including fuzzy matching of imported exercise
titles to the knowledge base.

---

## Asset / Exercise Animation System

- **Media lives in `assets/vital/`** (HD mp4 clips) **and `assets/gifs/`**.
- **`src/data/exercise-animations.ts` is the single source of truth**: it maps
  every exercise id to a media file and declares its type (`video` | `gif`).
- **`src/components/animation.tsx` renders it** with a priority of
  video > gif > built-in animated SVG stick figure (from `data/poses.ts`).

**To add a new exercise animation:** drop the file into `assets/vital/`
(mp4) or `assets/gifs/`, add one line to `ANIMATION_ASSETS` and one line to
`EXERCISE_ANIMATIONS` in `src/data/exercise-animations.ts`. Nothing else
changes.

---

## Environment Setup

```bash
npm install        # install dependencies
npm start          # expo start (Metro dev server on :8081)
npm run android    # start on Android emulator/device
npm run ios        # start on iOS simulator
npm run web        # start in the browser
```

Quality gates:

```bash
npm run typecheck  # tsc --noEmit (strict)
npm run lint       # expo lint (must be 0 errors, 0 warnings)
npm test           # jest — unit tests for lib/stats
```

No `.env` files are required — the app is fully offline with seeded demo data.

---

## Development Guidelines

1. **Screens are thin.** No business math in components — put it in
   `src/lib/*` as a pure function and unit-test it.
2. **Use the design system.** Import tokens from `src/theme` and primitives
   from `components/ui.tsx` / `misc.tsx`. Never hardcode colors, spacing,
   radii or font families.
3. **Type everything.** Domain models live in `src/types.ts`; type screen
   params and component props. No `any`.
4. **`Animated.Value` creation** — use `useAnimatedValue(x)` from
   `react-native`, not `useRef(new Animated.Value(x)).current` (the latter
   fails the React Compiler lint rules).
5. **Keep it simple.** Prefer a small local component over an abstraction.
   Don't add global state for data that belongs to one screen.
6. **Derive, don't store.** Recompute volume/PRs/streaks from `workouts[]`.

---

## Adding a New Feature

1. Add any domain types to `src/types.ts`.
2. Add the business logic as a pure function in the matching `src/lib/*` file
   (e.g. a new stat in `stats.ts`) and cover it with a focused unit test in
   `src/lib/__tests__/`.
3. Wire state through the store (`src/store/useStore.ts`) only if the data is
   shared across screens; otherwise use local state.
4. Create the screen under `src/app/` (file-based route) or add it to an
   existing screen, composing the UI from `components/ui.tsx` primitives and
   theme tokens.
5. Run `npm run typecheck && npm run lint && npm test`.

---

## Performance Considerations

- **Per-tab computation:** the Progress screen only mounts the active tab's
  view component, so heavy analytics run only for what's visible.
- **Animation assets** are loaded on demand (`expo-image`/`expo-video`
  lazy-load); the exercise library list shows lightweight muscle icons, not
  full media.
- **Lists** use plain `ScrollView`/`map` because data sets are small
  (dozens of workouts / 38 exercises). If history grows large, switch the
  big lists to `FlatList` with stable keys.
- The ticking clock (`useNow`) stops its interval when no timer is mounted.
- The React Compiler is enabled (`app.json` → `reactCompiler`), so prefer
  idiomatic hooks over manual `useMemo`/`useCallback` micro-optimizations.

---

## Known Limitations

- Demo friends/leaderboard are static seed data — no real networking/backend.
- Some analytics thresholds (e.g. calorie estimates) are rough heuristics.
- Long workout histories render with `ScrollView` (fine at current data
  sizes; see Performance Considerations).

---

## Troubleshooting

- **`npm install` fails on native modules** — use `npx expo install` for any
  new Expo SDK packages so versions stay compatible.
- **Web dev console noise about `collapsable` / SVG responder props** — these
  are filtered in `src/app/_layout.tsx`; they are harmless RNW dev warnings.
- **Exercise card shows a blank white box on some embedded webviews** — the
  web renderer falls back to a canvas composite of the video
  (`WebExerciseVideo` in `components/animation.tsx`); native is unaffected.
- **First web load is slow** — Metro bundles on the first request; later
  loads are cached.
