# NextRep

A dark, premium React Native fitness and gym companion: teach, track, analyze, motivate, and sync seamlessly to the cloud.

NextRep is a **coach in your pocket**. It comes with a comprehensive exercise knowledge base (form guides, common mistakes, breathing cues, progression tips), bundled high-fidelity animated exercise media (HD clips + GIFs), flexible workout template selection, custom workout builder, live workout notifications with quick actions, deep progress analytics (strength trends, volume, regularity streaks, records), body measurements, CSV import/export, and offline-first Supabase cloud synchronization.

---

## Key Features

- **Exercise Library & Detail Guides** — Coached exercises searchable by muscle, equipment, and difficulty, each with step-by-step form guides, animated media, and muscle target heatmaps.
- **Evidence-Based Templates & My Plans** — Select from structured workout routines (PPL, Upper/Lower, Full Body, Arnold Split) with expandable exercise previews, or edit and maintain your own routines in *My Plans*.
- **Unified Workout Builder** — Build custom routines directly using the full exercise browser, inspect exercise details, and save routines to your plans and cloud storage.
- **Active Workout & Live Notifications** — Start workouts with set logging (weight/reps/RPE/notes), automated rest timers, and sticky live notifications with `'Pause'` and `'Finish'` action buttons.
- **Progress Analytics & Streaks** — Estimated 1RM strength progression, volume by muscle group, regularity heatmap and streaks, body measurements, and automatic PR detection.
- **Friend Challenges & Social** — Challenge friends to weekly workout volume or streaks via share links (`nextrep://challenge`), with cloud friendship and challenge synchronization.
- **Supabase Cloud Sync & Account Isolation** — Authenticate with Google OAuth or Email/Password. Bidirectional synchronization for profiles, workouts, sets, body measurements, and plans, backed by an offline mutation queue and clean multi-account cache isolation.
- **CSV Import / Export** — Export and import workout logs in standard 14-column tracker format (`nextrep-workouts.csv`).
- **Dynamic Theming & Ambient Background** — 8 live accent color palettes (default: Mint) with atmospheric radial glow and uncrowded Lucide gym doodles (`Dumbbell`, `Footprints`, `Activity`, `Zap`, `Trophy`, `Apple`, `Flame`, `Weight`).

---

## Tech Stack

- **React Native 0.86** + **Expo SDK 57** (Android, iOS, and Web)
- **TypeScript** (strict mode)
- **expo-router** — File-based routing & navigation
- **Zustand** — Global state with `AsyncStorage` persistence & offline sync queue
- **Supabase (PostgreSQL + Auth + RLS + Storage)** — Cloud database, authentication, and avatar storage
- **react-native-svg** & **lucide-react-native** — Interactive charts, body heatmaps, and background doodle patterns
- **expo-notifications** — Live workout status notifications with interactive action buttons
- **expo-video / expo-image** — Bundled HD exercise clips (MP4) and animated GIFs
- **jest-expo** — Unit test suite for stats, notifications, csv, templates, and account isolation

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

- **Global (Zustand, persisted):** `workouts`, `plans`, `measurements`, `favorites`,
  `friends`, `profile`, `activeWorkout`, `accentKey`, and onboarding flags.
  Persisted to AsyncStorage under `nextrep-store-v1` (see `partialize`).
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
| `/(tabs)/home`, `workouts`, `log`, `progress`, `profile` | Bottom tabs with smooth animated swipe gestures |
| `/exercise/[id]` (+ `/form`) | Exercise detail / form guide |
| `/workout/[id]` (+ `/log`, `/rest`, `/summary`) | Active workout flow + live status notification |
| `/replay/[id]` | Past workout replay |
| `/library`, `/builder`, `/gym-mode`, `/leaderboard`, `/challenge`, `/history`, `/achievements`, `/measure`, `/onboarding`, `/settings` | Standalone screens |

Pass **ids, not objects**, between screens (e.g. `/exercise/${id}`,
`/workout/${id}`).

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

`lib/achievements.ts` computes all badges; `lib/csv.ts` handles the
tracker-format CSV round-trip, including fuzzy matching of imported exercise
titles to the knowledge base; `lib/notifications.ts` manages interactive workout notifications.

---

## Asset / Exercise Animation System

- **Media lives in `assets/vital/`** (HD mp4 clips) **and `assets/gifs/`**.
- **`src/data/exercise-animations.ts` is the single source of truth**: it maps
  every exercise id to a media file and declares its type (`video` | `gif`).
- **`src/components/animation.tsx` renders it** with a priority of
  video > gif > built-in animated SVG stick figure (from `data/poses.ts`).

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
npm run lint       # expo lint (must be 0 errors)
npm test           # jest — unit tests
```

---

## Database & Cloud Synchronization Architecture

NextRep uses **Supabase (PostgreSQL + Auth + Storage)** as its durable cloud backend while remaining completely offline-capable:

```
UI (Screens) ──► Zustand Store (usePulse / useAuth)
                        │
       ┌────────────────┴────────────────┐
       ▼                                 ▼
Local Cache (AsyncStorage)     Supabase Cloud Layer
  ├─ nextrep-store-v1            ├─ profiles & avatar storage
  └─ offline_sync_queue          ├─ workouts, exercises, sets
                                 ├─ workout_plans & plan_exercises
                                 └─ body_measurements & social
```

### Key Principles

- **Authoritative data** — explicitly logged workouts, sets, measurements, plans, and profiles sync bidirectionally to Supabase.
- **Derived data** — metrics like volume, PRs, streaks, 1RM, and progress scores are computed on-the-fly by `src/lib/stats.ts`, keeping the database normalized and lightweight.
- **Offline Mutation Queue** — changes made offline are automatically queued in `@nextrep_offline_sync_queue` and flushed whenever network connectivity is re-established.
- **Account Isolation** — signing out immediately clears local session state (`clearSessionCache()`), removes notifications, and clears the mutation queue, ensuring absolute privacy when switching accounts.

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
- Uses Expo `WebBrowser.openAuthSessionAsync` with custom deep-link scheme `nextrep://auth/callback`.
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
   - Mobile: `nextrep://`
3. In **Redirect URLs**, add:
   - `nextrep://auth/callback`
   - `nextrep://auth/reset-password`
   - `http://localhost:8081/auth/callback`
   - `http://localhost:8081/auth/reset-password`

---

## Google OAuth Setup

### 1. Google Cloud Console Configuration
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Go to **APIs & Services** > **OAuth consent screen**:
   - User Type: **External**
   - Fill in App name ("NextRep"), user support email, and developer contact info.
   - Add scope: `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
4. Go to **APIs & Services** > **Credentials**:
   - Click **Create Credentials** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `NextRep Supabase Web Client`.
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
## Exercies missing animations:
Machine Chest Press (machine-press)
Decline Bench Press (decline-bench-press)
Cable Chest Fly (cable-fly)
Chest Dips (dips)
Lat Pulldown (lat-pulldown)
Resistance Band Pulldown (band-pulldown)
Seated Cable Row (seated-cable-row)
Face Pull (face-pull)
Assisted Pull-Up (assisted-pullup)
Straight-Arm Pulldown (straight-arm-pulldown)
Back Extension (hyperextension)
Machine Shoulder Press (machine-shoulder-press)
Cable Lateral Raise (cable-lateral-raise)
Upright Row (upright-row)
Cable Curl (cable-curl)
Concentration Curl (concentration-curl)
Skull Crusher (skull-crusher)
Close-Grip Bench Press (close-grip-bench-press)
Triceps Kickback (triceps-kickback)
Bulgarian Split Squat (bulgarian-split-squat)
Calf Raise (calf-raise)
Standing Calf Raise (standing-calf-raise)
Seated Calf Raise (seated-calf-raise)
Ab Wheel Rollout (ab-wheel)
Cable Woodchopper (cable-woodchopper)
Dead Bug (dead-bug)
Jump Rope (jump-rope)
Stair Climber (stair-climber)

