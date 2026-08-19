# NEXTREP

A dark, premium React Native fitness/gym companion: teach, track, analyze, motivate, and sync to the cloud.

NextRep is a **coach in your pocket**. It comes with a comprehensive exercise knowledge base
(form guides, common mistakes, breathing cues, progression tips), bundled high-fidelity animated
exercise media (HD clips + GIFs), workout logging with rest timers, deep
progress analytics (strength trends, volume, regularity streaks, records), body measurements,
CSV import/export, and seamless Supabase cloud synchronization.

---

## Key Features

- **Exercise library** — Coached exercises searchable by muscle, equipment
  and difficulty, each with step-by-step form guides, animated media, and muscle target heatmaps.
- **Workout logging** — Start a plan or custom workout, log sets (weight/reps/RPE/notes),
  automatic rest timers, quick gym-mode logging, and celebration summaries with PR detection.
- **Workout builder** — Build custom workouts from the exercise library and save them to history & cloud.
- **Progress analytics** — Estimated 1RM strength trends, volume by muscle, Regularity
  heatmap and streaks, body measurements, BMI classification gauge, and a personal-records board.
- **Friend Challenges & Leaderboards** — Challenge friends to weekly workout volume, streaks, or lift improvements via SMS/WhatsApp share links (`nextrep://challenge`), with live duels and cloud friendship sync.
- **Supabase Cloud Sync** — Authenticate with Google OAuth or Email/Password, with automatic bidirectional synchronization for profiles, workouts, granular set logs, body measurements, and friend challenges.
- **Offline-First Resilience** — Instant local state with Zustand and AsyncStorage; syncs to Supabase whenever online.
- **CSV import / export** — Export/import workout logs in standard 14-column tracker format (`nextrep-workouts.csv`).
- **Accent theming** — The whole app re-themes live from 8 user-selectable accent colors (default: Mint).

---

## Tech Stack

- **React Native 0.86** + **Expo SDK 57** (iOS, Android, and web)
- **TypeScript** (strict mode)
- **expo-router** — File-based routing & navigation
- **Zustand** — Global state with `AsyncStorage` persistence & Supabase cloud sync
- **Supabase (PostgreSQL + Auth + RLS)** — Cloud database and authentication
- **react-native-svg** — Charts, rings, anatomical muscle heatmaps, and figures
- **expo-video / expo-image** — Bundled HD exercise clips (MP4) and animated GIFs
- **jest-expo** — Unit tests for stats, csv, and auth engines

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
Uses eas to build the APK
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

---

## Database Architecture

PULSE uses **Supabase (PostgreSQL)** as the durable cloud data layer while
remaining fully offline-friendly. The current app stores everything locally
via Zustand + AsyncStorage; the cloud schema is designed for future sync,
real accounts, social features and multi-device access.

### Design Principles

- **Authoritative data** — things the user explicitly created/logged go to
  the database (workouts, measurements, plans, goals).
- **Derived data** — things calculated from authoritative records (volume,
  PRs, streaks, 1RM, progress scores) are computed at read time by
  `src/lib/stats.ts`, **never stored in the DB**.
- **UI-only state** — filters, sheet states, timer positions stay local.
- **Append-oriented** — finished workouts are immutable; editable records
  use last-write-wins.

### Schema Overview

```
auth.users
  └─ profiles (1:1)
       ├─ workouts ── workout_exercises ── workout_sets
       ├─ workout_plans ── workout_plan_exercises
       ├─ body_measurements
       ├─ user_favorite_exercises ── exercises (global)
       ├─ manual_prs ── exercises (global)
       ├─ user_goals
       ├─ friendships (requester ↔ addressee)
       └─ challenges ── challenge_participants

exercises (global catalog, 83 entries)
  └─ exercise_aliases (CSV import matching)
```

### Tables

| Table | Owner | Purpose |
| --- | --- | --- |
| `profiles` | auth.users | Display name, avatar, goals, experience level |
| `exercises` | global | Canonical exercise catalog (stable IDs for references) |
| `exercise_aliases` | global | Alternative names for CSV import matching |
| `workout_plans` | user | Reusable workout templates |
| `workout_plan_exercises` | user | Exercises within a plan (ordered slots) |
| `workouts` | user | Completed workout sessions (the historical record) |
| `workout_exercises` | user | Exercises within a performed workout |
| `workout_sets` | user | Individual sets: weight/reps/distance/duration/RPE |
| `body_measurements` | user | Physical measurements over time |
| `user_favorite_exercises` | user | Favorited exercise IDs |
| `manual_prs` | user | Explicitly logged personal records |
| `friendships` | social | Bidirectional friend relationships |
| `challenges` | social | Multi-user challenges with start/end dates |
| `challenge_participants` | social | Challenge membership |
| `user_goals` | user | Personalized training goals |

### What Is NOT Stored

- **PRs** — detected from workout history by `detectPRs()` in `lib/stats.ts`
- **Streaks** — computed by `currentStreak()` / `longestStreak()`
- **Volume / 1RM** — computed by `workoutStats()` / `e1rm()`
- **Leaderboard scores** — computed by `progressScore()` from workout data
- **Achievement progress** — computed by `computeAchievements()`
- **Insights** — computed by `generateInsights()`

### Row Level Security (RLS)

Every user-owned table enforces RLS:

- **Private tables** (workouts, plans, measurements, goals, favorites, PRs):
  users can only SELECT/INSERT/UPDATE/DELETE their own rows.
- **Social tables** (friendships, challenge_participants): visible to both
  parties. Challenge metadata is publicly readable for discovery.
- **Global tables** (exercises, aliases): readable by all authenticated
  users.
- **Profiles**: readable by all (for leaderboard/social), updatable only by
  the owner.

### Indexes

Key indexes support the primary query patterns:

- `workouts(user_id, started_at DESC)` — user workout history
- `workout_exercises(workout_id, order_index)` — exercises in a session
- `workout_exercises(exercise_id)` — find sessions by exercise (PR detection)
- `workout_sets(workout_exercise_id, set_index)` — sets in an exercise
- `body_measurements(user_id, measured_at DESC)` — measurement history
- `friendships(requester_id/addressee_id, status)` — social lookups
- `challenge_participants(challenge_id)` — challenge members

---

## Database Migrations

All schema changes are managed via **Supabase CLI migrations** in the
`supabase/migrations/` directory.

### Migration Files

| File | Description |
| --- | --- |
| `001_profiles` | Profile table + auth trigger |
| `002_exercises` | Exercise catalog + enums + aliases |
| `003_workout_plans` | Plans + plan exercises |
| `004_workouts` | Workouts + exercises + sets |
| `005_measurements` | Body measurements |
| `006_favorites_prs` | Favorites + manual PRs |
| `007_social` | Friendships + challenges |
| `008_goals` | User goals |
| `009_security_indexes` | RLS policies + indexes |
| `010_seed_exercises` | Seed 83 exercises + 123 aliases |

### Commands

```bash
# Create a new migration
npx supabase migration new <migration_name>

# Apply all pending migrations to a local database
npx supabase db reset

# Apply migrations to a linked remote project
npx supabase db push

# Inspect the local database
npx supabase db diff

# Generate TypeScript types from the schema
npx supabase gen types typescript --local > src/lib/database.types.ts
```

### TypeScript Types

Type-safe query definitions live in `src/lib/database.types.ts`.
Regenerate after any schema change:

```bash
npx supabase gen types typescript --local > src/lib/database.types.ts
```

---

## Local-First Integration Strategy

The cloud schema is designed to enable a gradual transition:

```
Current (offline + identity):
  UI → Zustand store / useAuth → AsyncStorage (offline-first)
                                      └→ Supabase Auth & Profiles (cloud)

Future (full cloud sync):
  UI → Zustand store → Repository layer
                         ├→ Local cache (AsyncStorage)
                         └→ Supabase (cloud workouts/measurements)
```

1. **Phase 1** (Completed): Database schema, RLS policies, migrations, and TypeScript types.
2. **Phase 2** (Completed): Supabase Authentication, Google OAuth, session persistence via AsyncStorage, and profile identity sync.
3. **Phase 3** (Upcoming): Workout history sync (append-only, conflict-free).
4. **Phase 4** (Upcoming): Real friends, challenges, and live cloud leaderboard.

---

## Authentication Architecture

PULSE uses Supabase Auth for user identity while maintaining an offline-first foundation:

```
Auth Provider (Email / Google)
       │
       ▼
Supabase Session (persisted in AsyncStorage)
       │
       ▼
Authenticated User ID (auth.users.id)
       │
       ▼
Database Profile (public.profiles row)
       │
       ▼
Local Zustand Store (usePulse / useAuth)
```

### Key Principles

- **Single Identity Source**: `auth.users.id` maps 1:1 to `profiles.id`.
- **Persistent Sessions**: Sessions are automatically persisted on-device using `@react-native-async-storage/async-storage` via `@supabase/supabase-js`.
- **Offline Resilience**: If the user has signed in, cached session credentials and local workout data load immediately without requiring active internet connectivity.
- **Idempotent Profile Sync**: Google Sign-In and Email Sign-Up safely ensure a `profiles` row exists without overwriting custom local training parameters.

---

## Authentication Flows

### 1. Email / Password Flow
- **Sign Up**: Email, password (minimum 6 characters), and confirm password. Creates `auth.users` record and triggers automatic `profiles` row creation.
- **Sign In**: Email and password authentication with user-friendly error formatting.
- **Password Reset**: Generates a secure recovery link sent to user email redirecting back to `/auth/reset-password`.
- **Sign Out**: Clears cloud session while keeping local workouts intact.

### 2. Google OAuth Flow
- Uses Expo `WebBrowser.openAuthSessionAsync` with custom deep-link scheme `pulse://auth/callback`.
- On web, redirects to `${window.location.origin}/auth/callback`.
- Extracts authorization code / session tokens, exchanges with Supabase, and hydrates the user's profile.

---

## Required Supabase Configuration

To enable Authentication with Supabase, configure your project in the [Supabase Dashboard](https://supabase.com/dashboard):

### 1. Enable Email Provider
1. Go to **Authentication** > **Providers** > **Email**.
2. Ensure **Email provider** is toggled **ON**.
3. (Optional for testing) Toggle **Confirm email** OFF if you want immediate signup without email verification.

### 2. Configure Redirect URLs
1. Go to **Authentication** > **URL Configuration**.
2. Set **Site URL** to:
   - Web development: `http://localhost:8081`
   - Mobile: `pulse://`
3. In **Redirect URLs**, add:
   - `pulse://auth/callback`
   - `pulse://auth/reset-password`
   - `http://localhost:8081/auth/callback`
   - `http://localhost:8081/auth/reset-password`

---

## Google OAuth Setup

### 1. Google Cloud Console Configuration
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Go to **APIs & Services** > **OAuth consent screen**:
   - User Type: **External**
   - Fill in App name ("PULSE"), user support email, and developer contact info.
   - Add scope: `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
4. Go to **APIs & Services** > **Credentials**:
   - Click **Create Credentials** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `PULSE Supabase Web Client`.
   - **Authorized redirect URIs**: Add your Supabase project callback URL:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
   - Click **Create** and copy the **Client ID** and **Client Secret**.

### 2. Configure Supabase Google Provider
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** > **Providers** > **Google**.
3. Toggle **Google provider** to **ON**.
4. Paste your **Client ID** and **Client Secret** from Google Cloud Console.
5. Save changes.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase project keys:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

