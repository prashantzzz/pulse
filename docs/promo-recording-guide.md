# NextRep Promo Recording Guide

Everything in this guide belongs to the **`promo/kinetic` branch only**. The
`main` branch (and therefore the shipped app) is untouched. When this branch is
merged nowhere, the promo layer dies with it.

## What this branch adds

- `src/promo/` — an isolated promo layer:
  - **reveal engine** (`reveal.tsx`) — every `Card`, `Section`, `ScreenHeader`
    and hand-picked hero block fades/slides/pops in on a top-down cascade on
    every screen entry, plus on scroll (web `IntersectionObserver`).
  - **count-up numbers** (`count-up.tsx`) — all `num` / `numLg` / `numSm`
    labels (volume, streaks, 1RM, BMI, sets…) count up from 0.
  - **chart draw-in** (`components/charts.tsx` hook) — line/sparkline wipe
    left→right, bars grow bottom-up, donut wipes in.
  - **mock data** (`state.ts`, `seed.generated.ts`) — the athlete's real
    tracker CSV, shifted so the newest session lands on "today". The most
    recent session is re-timed to finish ~75 min ago, so Home shows
    **COMPLETED TODAY** with a live PR.
  - **director** (`director.tsx`) — keyboard shortcuts, scene launcher,
    click ripple, confetti on workout summary, automation hooks.

## Run it

```bash
# 1. regenerate the embedded seed after changing scripts/promo/nextrep-workouts.csv
npm run promo:seed

# 2a. DEV (hot reload — good for rehearsal)
npm run web           # http://localhost:8081

# 2b. PRODUCTION (recommended for final takes: no dev overlay, fastest)
npm run build:web
npm run promo:serve   # http://localhost:8082
```

Use a **dedicated browser profile** (new Chrome/Edge profile) at **412×915**
(Pixel 7-ish), browser zoom 100% / DPR 2, fullscreen (F11). The promo installer
purges any leftover Supabase session, but a clean profile keeps localStorage
predictable.

## Motion modes

The promo build plays **full motion by default**, even on machines with the OS
"reduce motion" preference enabled (headless browsers report reduced motion by
default too). The HUD shows the active mode (`FULL` / `REDUCED`).

```
http://localhost:8082/                  # full motion (default — record with this)
http://localhost:8082/?motion=reduced   # force reduced motion (accessibility test)
http://localhost:8082/?motion=auto      # follow the OS preference
```

Reduced motion keeps every state change but drops staggers, sweeps and long
durations — good for sanity-checking accessibility without a second machine.

## Keyboard shortcuts (any screen)

| Key | Action |
| --- | --- |
| `R` | Replay the current screen's entrance choreography |
| `⇧R` | Reset demo data + replay (undo any logged sets, start fresh) |
| `S` | Toggle slow motion (1.6×) for smoother retakes |
| `H` | Hide/show the PROMO HUD (hide before real takes) |
| `1`–`0` | Jump to recording scenes (Home, Workouts, Log, Progress, Profile, Library, Exercise, History, Records, Awards) |

`window.__nextrepPromo` exposes `replay()`, `reset()`, `slowMo(bool)`, `go(route)`
and `scenes` if you ever want to automate takes (Playwright/Puppeteer).

## Suggested shooting order (core ~78s cut)

1. `0` fresh reload → **Splash** (3s) — record the cold open cleanly.
2. `1` **Home** — hover the hero, then `R`; scroll once for the lower sections.
3. `2` **Workouts** — expand "Upper A", collapse, then long-press drag "Lower B" to the top.
4. `2` → Templates tab — recommended hero, accordions, "Use This Template".
5. `5` **Library** — `R`, type "bench" in search, bookmark toggle.
6. `7` **Exercise** (bench-press) — let the video loop, scroll the form guide.
7. Start "Lower B" from the hero/plan → **workout screen**: `R`, expand an exercise,
   complete 2-3 sets (rest popup appears), optional gym-mode flash, Finish.
8. **Summary** — confetti fires ~0.5s after arrival; record the stat count-ups.
9. `3` **Progress** — `R` on each view: Strength line, Volume bars+donut, Consistency
   heatmap, Body heatmap, Records podium.
10. `4` **Profile** — `R`, then tap the accent (Settings → Appearance) for the live re-tint.

## Notes

- The dev server shows a React `<button>` nesting warning from the app's own
  hero card markup (pre-existing, dev overlay only). The **production build**
  (`npm run promo:serve`) is clean — that is why final takes should use it.
- Exercise videos need one click somewhere first (browser autoplay policy);
  the recording session naturally has clicks before the Exercise scene.
- Press `H` to hide the HUD, `R` to replay a botched take, `⇧R` to reset the
  demo data between scenes.
