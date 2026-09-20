# NextRep

A dark, premium React Native fitness and gym companion: teach, track, analyze, motivate, and sync seamlessly to the cloud.

NextRep is a **coach in your pocket**. It ships with a comprehensive exercise knowledge base (form guides, common mistakes, breathing cues, progression tips), bundled high-fidelity animated exercise media (HD clips), flexible workout templates, a custom workout builder, live workout notifications with quick actions, deep progress analytics (strength trends, volume, regularity streaks, personal records), body measurements, CSV import/export, and offline-first Supabase cloud synchronization.

---

## Key Features

- **Exercise Library & Detail Guides** — Coached exercises searchable by muscle, equipment, and difficulty, each with step-by-step form guides, animated media, and muscle target heatmaps.
- **Evidence-Based Templates & Recommendation System** — 9 curated resistance templates (3×3 matrix: Beginner/Intermediate/Advanced × 3/4/5 days, strictly 1–5 exercises/day) tailored by a pure, commutative goal-modifier engine (Muscle, Strength, Weight Loss, Endurance, Health) with dedicated cardio guidance add-ons, personalized hero recommendations, and safe active routine replacement that strictly preserves completed workout history. Curated reference templates remain strictly immutable.
- **Workout Customization & Weight/Reps Persistence** — Real-time persistence of customized weights and reps into the athlete's personal routine (`plans`) and global exercise memory (`exerciseDefaults`). When an athlete modifies weights or reps during a workout session, values forward-propagate to subsequent uncompleted sets, synchronize across all plans and workout days containing that exercise, and persist to the user's DB even if the session is later discarded. Target weights are fully customizable in the Workout Builder and synced with Supabase cloud (`workout_plan_exercises.target_weight`).
- **Smart Next-Workout Engine** — State-driven progression recommendations on Home that maintain routine continuity across rest gaps, celebrate same-day completed sessions with next-workout previews, auto-restart from Day 1 after long layoffs (>14d), resolve custom plan names via 3-tier matching, and offer 1-tap plan swapping.
- **Unified Workout Builder** — Build custom routines directly using the full exercise browser, inspect exercise details, and save routines to your plans and cloud storage (duplicate routine titles are blocked).
- **Active Workout & Live Notifications** — Start workouts with tactile set logging (primary 'Complete Set' and secondary 'Save' actions), integrated plate calculator, automated rest timers, and silent ongoing native notifications with live set/rest tracking and post-completion dismissal. An in-progress workout is restored automatically on cold start.
- **Progress Analytics & Heatmap** — All-time cumulative muscle development heatmap (with primary and secondary fractional volume crediting), estimated 1RM strength progression, volume by muscle group, regularity heatmap and streaks, body measurements, and automatic PR detection.
- **Friend Challenges & Social** *(coming soon — currently gated behind a feature flag)* — Challenge friends to weekly workout volume or streaks via share links (`nextrep://challenge`), with cloud friendship and challenge synchronization.
- **Supabase Cloud Sync & Account Isolation** — Authenticate with Google OAuth or Email/Password. Full verification guard ensuring smooth post-auth transitions without onboarding flashes, bidirectional synchronization for profiles, workouts, sets, body measurements, and plans, backed by a validated offline mutation queue and clean multi-account cache isolation.
- **CSV Import / Export** — Export and import workout logs in standard 14-column tracker format (`nextrep-workouts.csv`).
- **Dynamic Theming & Ambient Background** — 8 live accent color palettes (default: Mint) with real-time UI propagation across home cards, muscle graphics, and gradients.

---

## Tech Stack

- **React Native 0.86** + **Expo SDK 57** (Android, iOS, and Web)
- **TypeScript** (strict mode)
- **expo-router** — File-based routing & navigation
- **Zustand** — Global state with `AsyncStorage` persistence & offline sync queue
- **Supabase (PostgreSQL + Auth + RLS + Storage)** — Cloud database, authentication, and avatar storage
- **react-native-svg** & **lucide-react-native** — Interactive charts, body heatmaps, and background doodle patterns
- **expo-notifications** — Live workout status notifications with interactive action buttons
- **expo-video / expo-image** — Bundled HD exercise clips (MP4)
- **jest-expo** — Unit test suite for stats, notifications, csv, templates, account isolation, and security regression

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
│   ├── auth/             # Login, signup, forgot/reset-password, OAuth callback
│   ├── exercise/[id]/    # Exercise detail + form guide
│   ├── workout/[id]/     # Active workout, set logger, rest timer, summary
│   └── ...               # builder, library, gym-mode, leaderboard,
│                         # challenge, history, achievements, measure,
│                         # onboarding, settings, splash (index)
│
├── components/           # Reusable UI
│   ├── ui.tsx            # Design-system primitives: Button, Card, Chip,
│   │                     # Screen, ScreenHeader, Section, Row, Icon, ...
│   ├── misc.tsx          # Avatar, BottomSheet, Stepper, EmptyState, Toast
│   ├── workout-card.tsx  # TodayWorkoutCard & split preview components
│   ├── muscle-icon.tsx   # Exercise thumbnails & muscle glyphs
│   ├── auth-loading.tsx  # Native-feel auth verification splash/loader
│   ├── Text.tsx          # <T> text component bound to the type system
│   ├── charts.tsx        # Line / bar / donut / sparkline (svg)
│   └── progress/         # Progress screen tabs (one file per tab)
│
├── data/                 # Static knowledge base
│   ├── exercises.ts      # Coached exercises (EXERCISES + EXERCISE_MAP)
│   ├── exercise-animations.ts  # exercise-id → media asset mapping
│   └── seed.ts           # Demo profile, plans, workouts, friends
│
├── lib/                  # Pure business logic (no React, fully unit-tested)
│   ├── recommendations.ts # Pure recommendation & goal modifier engine, cardio guidance
│   ├── stats.ts          # Volume, 1RM, PRs, streaks, analytics engine
│   ├── csv.ts            # CSV export/import, fuzzy exercise resolution
│   ├── sync.ts           # Supabase cloud sync + validated offline queue
│   ├── auth.ts           # Authentication helpers (email, Google OAuth)
│   ├── social.ts         # Friends, challenges, deep-link invite handling
│   ├── storage.ts        # Avatar pick, crop, and Supabase Storage upload
│   ├── notifications.ts  # Workout notifications management
│   ├── achievements.ts   # Live achievement computation
│   └── __tests__/        # Jest unit tests (npm test)
│
├── store/useStore.ts     # Zustand global store + persistence
├── store/useAuth.ts      # Auth state, session lifecycle, sign-out cleanup
├── theme/index.ts        # Design tokens: colors, gradients, type, spacing
└── types.ts              # All domain models (Exercise, Workout, ExerciseSet, ...)
```

---

## Application Architecture

```
Screens (src/app)
      │  present + handle user interaction
      ▼
Hooks / Zustand store (src/store/)
      │  global state, persisted to AsyncStorage
      ▼
Business logic (src/lib/*) — pure, testable functions
      │
      ▼
Static knowledge base (src/data/*)
```

Key principle: **screens stay thin**. Anything that computes a number from workout data lives in `src/lib/stats.ts` (or `achievements.ts` / `csv.ts`) as a pure function. The global store (`usePulse`) holds the persisted data; screens read slices via selectors and call actions (e.g. `completeSet`, `finishWorkout`).

---

## Data Flow

**Exercise data** (static):
```
src/data/exercises.ts ──► EXERCISE_MAP[id] ──► screens / components / stats
```

**Workout data** (the active session & routine persistence):
```
Plan ──► startWorkout() ──► activeWorkout (store)
      ──► set logger (patchSet / completeSet)
            ├─► updates activeWorkout sets & auto-fills subsequent sets
            ├─► updates exerciseDefaults (global memory per exercise)
            ├─► synchronizes all user plans containing the exercise in plans[] (targetWeightKg, targetReps)
            └─► queues/pushes cloud sync to Supabase (workout_plans & workout_plan_exercises)
      ──► cancelActiveWorkout() [Discard]
            └─► leaves workout history clean, but preserves customized weights/reps across all plans & exerciseDefaults
      ──► finishWorkout() [Save & Finish]
            └─► persists to workouts[] (history) + updates stats/PRs
```

**Everything analytics** derives from the same `workouts[]` array: `workoutStats`, `bestForExercise`, `detectPRs`, `currentStreak`, `volumeByMuscle`, `progressScore`, etc.

### Smart Next-Workout Recommendation Algorithm
Home's **Today's Workout** hero is driven by `getSmartTodayPlan(workouts, plans, activeWorkout)`:
1. **Live Priority:** If an active workout is in progress, displays a live resume card with completed set count and live duration.
2. **Same-Day Celebration:** If the athlete already completed a session today, presents a celebratory summary (`COMPLETED TODAY 🎉`) with volume/sets and a button previewing the next upcoming routine.
3. **Sequential State Continuity:** Recommends the next plan in sequence based on the last completed workout rather than naive calendar day modulo, preserving the split progression across multi-day rest gaps.
4. **Long Layoff Auto-Reset:** Inactivity gaps $> 14\text{ days}$ automatically restart from Day 1 of the user's split.
5. **3-Tier Plan Matching Engine:** Resolves custom and ad-hoc workouts (e.g. *"My Upper"*, *"Session Alpha"*) to the user's saved plans via:
   - **Tier 1:** Exact Title / Plan ID Match
   - **Tier 2:** Exercise ID Jaccard Set Overlap ($\ge 50\%$)
   - **Tier 3:** Muscle Group & Movement Pattern Load Distribution Vector
6. **1-Tap Plan Swap:** Interactive `⇄ Swap` button allowing athletes to easily switch to any other day in their routine without cluttering the card.

---

## State Management

- **Global (Zustand, persisted):** `workouts`, `plans`, `exerciseDefaults`, `measurements`, `favorites`, `friends`, `profile`, `activeWorkout`, `accentKey`, `weightUnit`, `autoRestTimer`, `hapticsEnabled`, and onboarding flags. Persisted to AsyncStorage under `nextrep-store-v1`.
- **Local (useState):** UI state that belongs to one screen — filters, sheets, tabs, form drafts.
- **Derived values are never stored.** Volume, PRs, streaks, progress percentages are recomputed from `workouts` on demand by `lib/stats.ts`.

---

## Navigation

File-based routing via `expo-router` (root `Stack` in `src/app/_layout.tsx`, tabs in `src/app/(tabs)/_layout.tsx`).

| Route | Screen |
| --- | --- |
| `/` | Splash → onboarding or home |
| `/(tabs)/home`, `workouts`, `log`, `progress`, `profile` | Bottom tabs |
| `/exercise/[id]` | Exercise detail / form guide |
| `/workout/[id]` (+ `/log`, `/rest`, `/summary`) | Active workout flow, set logger, rest timer + live status notification |
| `/auth/login`, `/signup`, `/forgot-password`, `/reset-password`, `/callback` | Auth screens |
| `/library`, `/builder`, `/gym-mode`, `/leaderboard`, `/challenge`, `/history`, `/achievements`, `/records`, `/replay/[id]`, `/measure`, `/onboarding`, `/settings` | Standalone screens |

Pass **ids, not objects**, between screens (e.g. `/exercise/${id}`, `/workout/${id}`).

---

## Database & Cloud Synchronization

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

- **Offline Mutation Queue** — changes made offline are queued in `@nextrep_offline_sync_queue` and flushed on next sign-in. The queue validates that each mutation belongs to the currently authenticated user before executing.
- **Account Isolation** — signing out immediately clears all local session state (`clearSessionCache()`), removes notifications, clears the mutation queue, and clears any pending deep-link invites.
- **Clear All Data** — clears local and cloud workouts, active plans, routines, defaults, and measurements, resetting the app to a fresh-start state at `/onboarding`.
- **Instant App Startup** — cached user sessions launch immediately from local state without blocking verification loaders; cloud sync and offline queues resolve non-blockingly in the background.
- **Derived data** — metrics like volume, PRs, streaks, 1RM, and progress scores are computed on-the-fly by `src/lib/stats.ts`, keeping the database normalized.

### Authentication Flows

**Email / Password:**
- Sign Up → creates `auth.users` record, auto-creates `profiles` row via DB trigger.
- Password Reset → recovery link sent to email, redirects to `/auth/reset-password`.
- Sign Out → clears the cloud session and the local cache; data remains in the cloud and is restored on next sign-in.

**Google OAuth:**
- Native (Android/iOS) uses `@react-native-google-signin/google-signin`, then exchanges the Google token with Supabase.
- Web uses `expo-web-browser`; the custom deep-link scheme is `nextrep://auth/callback`, and web redirects to `${window.location.origin}/auth/callback`.

---

## Required Supabase Configuration

Configure your project in the [Supabase Dashboard](https://supabase.com/dashboard):

### 1. Enable Email Provider
1. Go to **Authentication** → **Providers** → **Email**.
2. Ensure **Email provider** is toggled **ON**.
3. Enable **Confirm email** (recommended for production).
4. Set minimum password length to **8** characters.

### 2. Configure Redirect URLs
1. Go to **Authentication** → **URL Configuration**.
2. Set **Site URL** to `http://localhost:8081` (dev) or your production domain.
3. In **Redirect URLs**, add:
   - `nextrep://auth/callback`
   - `nextrep://auth/reset-password`
   - `http://localhost:8081/auth/callback`
   - `http://localhost:8081/auth/reset-password`

### 3. Google OAuth Setup
1. In [Google Cloud Console](https://console.cloud.google.com/), create an OAuth 2.0 Web Client.
2. Set **Authorized redirect URI** to `https://<your-project-ref>.supabase.co/auth/v1/callback`.
3. In **Supabase Dashboard** → **Authentication** → **Providers** → **Google**, paste your Client ID and Secret.

---

## Environment Setup

Created a `.env` file at the project root (never commit this file):

```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<your-google-web-client-id>
```

For EAS builds, configure credentials via EAS Secrets rather than hardcoding them in `eas.json`:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "<url>"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<key>"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "<google-web-client-id>"
```

Install and run:

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
npm run lint       # expo lint (pre-existing React-Compiler warnings remain)
npm test           # jest — 28 consolidated test suites (370 tests)
```

### Database Migrations

```bash
npx supabase db push   # apply all pending migrations to the remote project
```

Migrations live in `supabase/migrations/` and are applied in timestamp order. The CLI records each applied version, so `db push` only runs new migrations (already-applied ones are never re-run).

### Android Build & Release

```bash
# Preview build (internal APK testing)
eas build --platform android --profile preview

# Production build (AAB release for Google Play with auto next version bump)
eas build --platform android --profile production

# Local Android execution
npx expo run:android
```

