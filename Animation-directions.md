# NextRep — Production-Grade Motion & Animation Implementation

## Role and objective

Act as a senior React Native engineer, motion designer, and mobile performance specialist. Your task is to finish the motion and animation system for **NextRep: Gym Workout Tracker**.

The application already exists. You are working on a dedicated feature branch created specifically for this animation work. The current implementation has animations, but they are not yet properly designed or executed.

Your job is to inspect the existing codebase, understand the actual screens and components, implement a consistent, production-quality motion system, and validate it end-to-end.

**Do not stop after inspecting the codebase or writing a plan. Implement the changes, run the available checks, and fix the issues you introduce.**

The main use case is to screen-record the app's screens for a professional promotional video. Consequently, the animations must be visually polished, repeatable, smooth on real Android devices, and impressive when the screens are recorded. They must also remain appropriate for everyday users.

## 1. Non-negotiable engineering rules

Before changing any code:

1. Inspect the project structure, current Git branch, working-tree status, `package.json`, navigation architecture, existing animation utilities, charting libraries, SVG/graphic implementations, styling conventions, theme system, and relevant screen/component files.
2. Identify which animations already exist and determine why they feel incomplete, inconsistent, abrupt, incorrectly timed, or visually poor. Improve the existing implementation instead of blindly adding another animation layer.
3. Check which libraries are already installed. Prefer the current animation stack. Use React Native Reanimated if it is already installed and appropriately configured; otherwise, use the existing React Native `Animated` infrastructure where suitable.
4. Do not add dependencies unless a specific requirement cannot reasonably be implemented with the existing stack. If a new dependency is genuinely necessary, first verify compatibility with the project's React Native version, navigation setup, and native build configuration.
5. Preserve the current feature branch and all unrelated working-tree changes. Do not reset, revert, overwrite, or discard existing work. Do not merge into `main`, switch branches, or create commits unless explicitly requested.
6. Do not alter workout logic, analytics formulas, stored data, database schemas, authentication, Supabase synchronization, workout rotation, personal-record calculations, notification behavior, or exercise recommendations merely to implement animations.
7. Use actual application data. Never replace dynamic values with hard-coded demonstration values or fabricate workout history to make an animation look impressive.
8. Preserve existing layouts, spacing, typography, colors, content, component hierarchy, navigation behavior, and touch targets. Animation should enhance the current design rather than redesign it.
9. Avoid broad refactors. Keep changes scoped to motion, animation lifecycle management, and any minimal component integration required.
10. Do not ask me to manually implement code or finish incomplete steps. Investigate reasonable uncertainties from the existing codebase and make the best technically appropriate decisions.

## 2. Understand the supplied screenshots correctly

The supplied screenshots are visual references for the existing application. They represent different states and scroll positions, not a request to build duplicate screens.

### Screen A — Home

The screenshots show two scroll positions of the same Home screen.

The upper section includes:

* Greeting and user name.
* Branding/logo.
* Streak card and supporting message.
* Today's workout card, including difficulty, swap action, exercise count, set count, estimated duration, target muscles, previous-session details, and Start Workout CTA.
* Quick Summary statistics for workouts, volume, sets, and weekly change.
* Personal Record preview.

The lower section includes:

* Continue Training card with the previous workout's statistics.
* Your Next Move recommendation with a suggested workout and CTA.
* Muscle Focus section and associated content.

Treat these as one vertically scrollable screen. Animations must not require the whole page to finish animating before a user can scroll or interact.

### Screen B — My Workouts

The screenshots show different states of the same workout-plans screen:

* My Plans and Templates tabs.
* Four-day workout routines.
* Expanded and collapsed workout cards.
* Editable workout-plan controls.
* Exercise thumbnails, equipment labels, target muscles, sets, and repetitions.
* Start workout actions.
* Workout plan ordering and the existing interaction model.

One reference shows Upper B expanded with its exercises. Another shows the plans collapsed. These are the same screen in different states.

### Screen C — Exercise Templates

The Templates view contains:

* Experience-level filters.
* Training-frequency filters.
* Recommended-template labels.
* Workout split title and description.
* Muscle-group chips.
* Estimated duration, number of exercises, and weekly sets.
* Four expandable workout-day rows.
* Use This Template CTA.

The templates are interactive and filterable. Animate filter selection and content transitions without rebuilding or altering the existing recommendation logic.

### Screen D — Progress: Body

The Body analytics view includes:

* Horizontally arranged analytics tabs.
* Muscle Heatmap card, front and back body illustrations, training-status colors, and workout-count badge.
* Body Measurements section.
* Weight value, change from starting weight, and visual history indicator.

### Screen E — Progress: Volume

The Volume analytics view includes:

* Date-range selection.
* Total-volume and weekly-volume metrics.
* Volume Trend bar chart.
* Volume by Muscle doughnut/ring chart, including legend, percentage breakdown, and center total.
* Volume per Session line chart.

Each chart must animate in its existing format without changing the underlying dataset or chart calculations.

### Screen F — Progress: Strength

The Strength analytics view includes:

* Strength, volume, and consistency summary metrics.
* Exercise selector.
* Date-range filters.
* Estimated 1RM metric and percentage change.
* Best-set details.
* Estimated-strength line chart.
* Top Sets list, including exercises, weights, repetitions, and dates.

### Screen G — Progress: Records

The Records view is another state of the same Progress area, not a separate navigation destination unless the existing architecture already treats it that way.

It includes:

* Total personal-record metric and recent change.
* Best 1RM metric and recent change.
* All Time Records section.
* Sorting/filtering control.
* Ranked exercise records containing thumbnails, weights, repetitions, dates, and estimated 1RM.

Preserve the existing tab-navigation architecture and animate the relevant state transitions.

### Screen H — Active Workout

The workout execution screen contains:

* Workout title and elapsed timer.
* Pause and fullscreen controls.
* Overall progress indicator.
* Exercise cards with set counts and expansion controls.
* Current exercise highlighting.
* Previous-session values.
* Editable weight and repetition values.
* Completed and incomplete set indicators.
* Bottom workout progress summary and Finish Workout CTA.

Interactions in this screen must feel immediate, tactile, and reliable. Never delay the completion of a set or a workout because an entrance animation is still running.

## 3. Establish one consistent motion language

Implement a small, reusable motion system, integrated with the existing code structure.

Avoid creating a separate, incompatible animation approach inside every screen.

### Motion principles

The desired personality is:

* Premium.
* Athletic.
* Precise.
* Modern.
* Confident.
* Smooth rather than bouncy.
* Visually expressive without being distracting.

The existing dark interface, mint/green accent palette, rounded cards, gradients, icons, charts, and typography should remain recognizable throughout the animation.

Prefer opacity, transforms, and drawing/progress properties over frequent layout changes.

### Motion tokens

Use these as initial targets, adjusting them to the actual components and existing design:

| Motion type                | Initial duration |
| -------------------------- | ---------------: |
| Small icon/button feedback |       120–200 ms |
| Filter/tab selection       |       180–260 ms |
| Standard content entrance  |       250–350 ms |
| Card entrance              |       300–420 ms |
| Counter animation          |     650–1,000 ms |
| Chart reveal               |     700–1,100 ms |
| Larger section transition  |       300–450 ms |

Use a consistent easing vocabulary, such as cubic ease-out for entrances and appropriate smooth easing for exits. Use spring physics selectively for direct manipulation and interactive responses, not for every element.

Stagger adjacent elements by approximately 35–70 ms where it improves readability.

Do not apply every effect to every component. Create a hierarchy: headers and section labels appear first, primary cards follow, and detailed analytics or list content enters afterward.

Avoid large travel distances. A translation of roughly 6–16 logical points is generally sufficient for subtle content entrance.

Never make an entire page flash, shake, zoom aggressively, or bounce excessively.

## 4. Reusable animation architecture

Create or refine reusable primitives based on the project's existing conventions. Suitable abstractions might include:

* Animated entrance wrapper.
* Staggered content group.
* Animated numeric value.
* Animated progress indicator.
* Reusable chart-reveal utilities.
* Shared tab/filter transition behavior.
* Expandable/collapsible content transition.

These are conceptual responsibilities, not mandatory component names or instructions to create unnecessary abstractions.

Keep the implementation maintainable and type-safe.

### Animation lifecycle requirements

The most important technical issue is controlling when animations play.

1. Animate when a screen becomes ready for presentation and its actual data is available.
2. On returning to a screen, allow its entrance animation to replay in a predictable way when appropriate.
3. Do not restart entrance animations on every React render.
4. Do not restart chart animations because an unrelated state variable changes.
5. Avoid repeated number count-ups whenever the user changes an unrelated filter or opens a modal.
6. When a dataset genuinely changes, animate the affected visualization from its previous state to the new state where practical.
7. Respect navigation focus and blur lifecycle events already used by the app.
8. Clean up listeners, timers, animation handles, and subscriptions correctly.
9. Cancel or safely ignore stale asynchronous animation callbacks after navigation or unmount.
10. If data loads asynchronously, do not animate placeholder zeros into unrelated final values or expose incorrect intermediate calculations.

Avoid race conditions when multiple sections become ready together.

For the promotional recording use case, screen-level entrance animations and chart reveals should replay deterministically when navigating away and back. If the project already has a developer-only configuration mechanism, you may add a minimal animation-replay option to it. Do not introduce a new settings screen, hidden gesture, or complicated demo framework.

## 5. Numeric count-up animation

Apply a consistent count-up treatment to meaningful numeric metrics, not to every number in the interface.

Good candidates include:

* Workouts completed.
* Total and weekly training volume.
* Total sets.
* Workout duration estimates where appropriate.
* Personal-record weights.
* Estimated 1RM.
* Strength improvement percentages.
* Consistency percentages.
* Body measurements and weight.
* Total personal records.
* Workout progress counts.

### Required behavior

* Animate smoothly from a visually appropriate starting value to the real final value.
* Use easing so motion is quick to start and settles smoothly.
* Ensure the final displayed value is exactly consistent with the existing data and formatting.
* Preserve decimal precision, signs, units, percentage formatting, locale formatting, and compact notation.
* For values represented as `6.2k`, animate numeric content while retaining appropriate compact formatting.
* For percentages, use the proper sign and existing interpretation.
* Avoid unnecessary precision or rapidly changing text widths.
* Keep associated labels stable while the number changes.
* Do not force counters to start at zero if doing so creates an unnecessarily misleading or visually jarring transition.
* Avoid counter animation on repeated renders.
* Ensure accessibility labels expose the correct final value rather than a stream of intermediate numbers.

For example, a volume metric may count smoothly toward `6.2k kg`, while an estimated 1RM metric settles on its actual value, such as `85.5 kg`. These are illustrative examples from the visual references, not values to hard-code.

For workout timers and elapsed-duration displays, preserve real clock behavior. Do not use decorative counting animations that desynchronize the timer from the actual session.

## 6. Home screen animation choreography

Build a coordinated but restrained entrance.

### Initial visible area

1. The existing background and ambient decorative elements should appear without a distracting flash.
2. Greeting text and logo fade in with a small upward translation.
3. The streak card follows with a subtle opacity/translation entrance.
4. The Today's Workout card enters as the primary visual element.
5. Its workout title, difficulty badge, swap control, metadata chips, target-muscle chips, and previous-session details reveal in a short, coordinated sequence.
6. The Start Workout CTA receives a restrained entrance after its parent card has appeared.
7. The Quick Summary card follows, with its headline and metrics entering in an orderly sequence.
8. Individual summary values count up to their real values.

Avoid animating all the chips separately with long delays. The total sequence should feel continuous rather than theatrical.

### Lower sections

* Personal Record card: subtle card entrance, trophy/icon reveal, and weight/rep count-up.
* Continue Training card: smooth entrance with its stored workout metrics.
* Your Next Move card: reveal the recommendation and CTA with clear visual hierarchy.
* Muscle Focus section: animate focus indicators only if doing so remains performant.

The lower sections must animate appropriately as they enter the viewport on scroll. Do not force users to wait for offscreen content to animate before interacting with the visible area.

For the promotional sequence, the first Home viewport should feel polished in approximately 1–2 seconds, without requiring a long chain of delayed animations.

## 7. My Workouts and Templates animations

### Workout plan cards

* Stagger the initial appearance of the workout cards.
* Keep icons, names, muscle chips, exercise counts, set counts, duration, edit controls, and Start actions visually synchronized.
* Use consistent card entrance timing and movement.
* Avoid individual child animations that make the text jump around.
* If a list can be long, animate only the initially relevant visible items rather than mounting hundreds of animated rows.

### Expanding a plan

When a workout-plan card expands:

* Animate the content container's expansion and collapse.
* Reveal exercise rows with a restrained stagger.
* Let exercise thumbnails and text appear naturally without distorting their aspect ratio.
* Keep edit/start buttons responsive while the animation is in progress.
* Avoid abrupt content jumps caused by competing animated and measured heights.

If animating height is expensive with the current stack, use a suitable existing layout-transition API or another implementation that preserves performance and content clipping.

When a card collapses, remove its detailed content cleanly and preserve the correct state. Do not reset stored plan data or completed-session history.

### Drag and drop

Preserve the existing drag-and-drop routine ordering.

* Give the dragged item a subtle lift/elevation and restrained scale treatment.
* Animate surrounding cards into their new positions.
* Maintain automatic edge scrolling and accessible Move up/Move down actions.
* Do not allow entrance animations to interfere with gesture recognition.
* Prevent drag gestures from triggering accidental card expansion or exercise actions.

### Template filters

For experience level and training frequency:

* Animate selection color/background/indicator transitions.
* Transition between filtered content without a disruptive full-screen flash.
* Keep selected filters and template results synchronized.
* Preserve the actual recommendation/filter logic.
* Animate template information and workout-day rows after a new filter result has been resolved.

### Template selection

Give the Use This Template action clear press feedback and a smooth response. Preserve the existing active-routine replacement rules and workout-history protection.

## 8. Progress analytics animation system

This area is a major selling point of NextRep and deserves particular attention.

Use a consistent chart animation style across Body, Strength, Volume, Regularity, and Records. Inspect the actual chart implementation and use its supported drawing APIs instead of overlaying unrelated graphics or rebuilding working charts from scratch.

### A. Body and muscle heatmap

* Reveal the heatmap/card with a smooth entrance.
* Fade or subtly scale the front and back body illustrations into place.
* Animate highlighted muscle regions only if the illustration representation supports this cleanly.
* If regions are separately rendered shapes, animate their fill opacity or color transition in a controlled sequence.
* If the illustration is one static image, do not try to animate nonexistent independent muscle regions or introduce fake anatomy.
* Reveal the legend and training-status indicators after the illustrations become visible.
* Count up the all-time workout total.
* Animate body measurement values and any existing trend indicators.

The animation must preserve the actual color meanings and muscle-volume classification.

### B. Volume trend bar chart

* Reveal the chart container first.
* Animate each bar from its baseline to its actual data-derived height, with a small left-to-right stagger.
* Anchor bars to the correct baseline.
* Use the chart's actual plotted values, spacing, and scaling.
* Reveal date labels without moving them into the bars.
* Keep axis labels and text crisp.
* Do not animate bars to arbitrary values for visual drama.

The visual should look as though the chart is drawing itself from left to right.

### C. Volume by Muscle doughnut/ring chart

* Reveal the center total using the numeric count-up utility.
* Animate the actual ring segments progressively around the chart.
* If using SVG, draw segments using supported stroke-dash techniques or another efficient existing mechanism.
* Respect real segment proportions, segment order, gaps, start angle, and center geometry.
* Reveal the legend rows and actual percentages in a coordinated stagger.
* Make sure the finished chart totals and percentages remain consistent with the underlying dataset.

Avoid rotation or scaling that makes the finished segment data misleading.

### D. Volume per Session line chart

* Reveal the plotting area.
* Draw/reveal the line from left to right.
* Reveal data points in sync with the line only where separate point elements already exist or can be added simply.
* Animate the area fill opacity, if present, after the line becomes visible.
* Keep date labels stable.
* Preserve gaps or missing data correctly.

Prefer an actual path-reveal animation rather than independently translating every data point in a way that changes the chart's apparent meaning.

### E. Strength analytics chart

* Animate the summary metrics.
* Reveal the estimated 1RM number and improvement badge.
* Draw the historical strength line progressively.
* Animate the area fill if the existing chart includes one.
* Preserve the original y-scale, dates, data points, and trend calculation.
* Reveal the selected exercise and best-set information in the correct hierarchy.
* Stagger the Top Sets entries as they enter the screen.

Exercise-selector changes and date-range changes should transition smoothly between actual datasets. Do not replay every initial card animation whenever a new chart filter is selected.

### F. Records analytics

* Count up the all-time PR and best 1RM summary metrics.
* Animate the small metric indicators without distracting from the values.
* Reveal ranked records from the top down with a slight stagger.
* Use subtle emphasis for top rankings, trophy indicators, and genuinely new PRs.
* Allow the record sorting control to animate its selected state and update the displayed order correctly.
* Preserve accurate weights, repetitions, dates, and estimated 1RM values.

### G. Analytics tabs and date-range controls

Across all Progress tabs:

* Animate the selected tab indicator or pill.
* Maintain horizontal scrolling and correct selected-tab visibility.
* Use a small, controlled fade/translation when changing the content area.
* Avoid performing a dramatic full-screen transition for an ordinary tab change.
* Preserve scroll behavior unless the existing screen deliberately resets it.
* Avoid simultaneous entrance animations, chart redraws, and layout measurements that cause visible flicker.

The tabs must continue to behave as real interactive controls, not just animated promotional elements.

## 9. Active Workout interaction animation

The live workout screen is more interactive than the analytics screens. Prioritize immediate feedback and usability.

### Screen entrance

* Reveal the workout heading and actual timer.
* Animate the progress bar or ring toward the real current completion percentage.
* Reveal exercise cards in order.
* Keep the current exercise visually distinct with a restrained border, background, or opacity transition.
* Preserve the real expanded exercise and completed-set states.
* Keep the bottom progress summary and Finish Workout button visually anchored.

### Completing a set

When a user genuinely completes a set:

* Provide immediate press feedback.
* Animate the completion/check indicator into its completed state.
* Update actual progress with a short smooth transition.
* Provide restrained visual emphasis for the completed set.
* Avoid exaggerated celebrations that slow repeated use.
* Keep the rest timer and existing session state correct.

### Editing values

* Support the existing weight/repetition editing behavior without focus loss.
* Do not animate text-input values in a way that interferes with typing.
* Do not let component remounting clear the keyboard, cursor, or pending edits.
* Preserve all current-set and subsequent-set persistence behavior.
* Preserve the actual plate calculator and rest-timer functions.

### Pause, resume, finish, and restoration

* Add restrained feedback to pause/resume controls.
* Preserve the actual elapsed timer and workout-restoration logic.
* Keep the Finish Workout action responsive.
* Do not make a set completion or workout completion depend on an animation finishing.
* Ensure backgrounding and reopening a workout do not cause stale animations or incorrect progress.

## 10. Navigation and shared interaction micro-animations

Apply consistent feedback across the app without altering navigation semantics.

### Bottom navigation

For Home, Workouts, Log, Progress, and Profile:

* Use restrained active-state color and opacity transitions.
* Preserve the existing selected-state treatment.
* Keep the central Log button prominent, with subtle press feedback.
* Do not create an oversized bounce or have neighboring icons jump around.
* Preserve the existing navigation actions, long-press behavior, and accessibility labels.

### Buttons

Use a consistent, restrained press response for:

* Start Workout.
* Start a workout from a plan.
* Swap.
* Use This Template.
* Finish Workout.
* Relevant Add and Save actions.
* Search and edit controls.

The press animation should be quick, reversible, and never prevent the intended action.

### Chips, segmented controls, and dropdowns

Animate the selected state and content transition, not just the color of individual text labels.

### Icons and visual indicators

Use animation only where it communicates state or adds clear polish. Do not continuously pulse every icon, animate all decorative graphics, or introduce unnecessary loops.

## 11. Performance and implementation quality

The app is intended for real Android phones as well as promotional screen recordings.

Enforce the following:

* Prefer transform and opacity animations for content entrances.
* Use native-driven animations when supported by the existing implementation.
* Use Reanimated worklets/shared values where appropriate and already available.
* Ensure chart animation work does not cause scrolling or touch interactions to stutter.
* Avoid animating every item in a large list simultaneously.
* Do not run duplicate animation loops after navigation.
* Clean up animated values, timers, focus listeners, subscriptions, and SVG animation resources appropriately.
* Avoid repeated expensive measurement/layout passes.
* Avoid forcing React re-renders for every animation frame.
* Keep animations scoped to the elements that need them.
* Avoid layout jumps when a count changes digit width.
* Avoid clipping shadows, badges, or text during transforms.
* Maintain compatible stacking order and `zIndex` behavior.
* Verify that animated cards do not obstruct the bottom navigation, central Log button, or anchored workout controls.
* Respect Android system font scaling and different screen dimensions.

### Reduced motion and accessibility

Respect the operating system's reduced-motion/accessibility preference using the capabilities already available in the project.

When reduced motion is enabled:

* Prefer immediate final states or simple opacity transitions.
* Disable long staggers, large translations, and decorative movement.
* Preserve all state changes and useful feedback.

Do not sacrifice touch-target sizes or accessibility semantics for animation. Screen-reader users must receive meaningful values and state changes without having to wait for a visual animation.

## 12. Avoid these anti-patterns

Do not implement any of the following:

* Every card independently bouncing into place.
* Repeated zooming of entire screens.
* Counters restarting every few seconds.
* Charts briefly showing false values.
* Animated skeletons remaining after real data is available.
* Random timing or random motion paths.
* Flashing between placeholder and final screens.
* Animations replaying on every React render.
* Staggering so long that a screen takes several seconds to become usable.
* Infinite decorative animations that waste battery.
* Interactions that become unresponsive while an entrance animation runs.
* Hard-coded sample metrics or special-case animation values tied to the example screenshots.
* Duplicate implementations of the same animation in multiple components.
* Replacing working chart implementations without a clear technical reason.
* Introducing excessive dependencies or unrelated architectural changes.
* Breaking navigation, authentication, drag-and-drop, workout timers, or persistence to obtain a visual effect.

## 13. Implementation and validation workflow

Work in these stages.

### Stage 1 — Audit

Inspect the current implementation and identify:

* Screens and components represented in the screenshots.
* Existing animation dependencies and animation code.
* Chart/illustration implementation details.
* Navigation lifecycle.
* Data loading and state management.
* Current animation bugs or inconsistencies.

Use this audit to choose the smallest effective implementation strategy.

### Stage 2 — Shared motion foundation

Implement reusable entrance transitions, stagger behavior, numeric count-up, chart reveal utilities, selection transitions, and lifecycle handling as appropriate to the codebase.

Use a consistent set of timing/easing conventions.

### Stage 3 — Screen integration

Apply the motion system to Home, My Workouts, Templates, all Progress analytics states, Records, and Active Workout.

Do not treat alternate scroll positions, expanded cards, or selected analytics tabs as separate screens requiring duplicate implementations.

### Stage 4 — Interactions

Verify real interactions:

* Tabs and date filters.
* Expanding/collapsing plans.
* Reordering plans.
* Selecting templates.
* Opening/closing workout details.
* Completing sets.
* Editing weight/repetitions.
* Pausing/resuming workouts.
* Scrolling long screens.

Ensure animation lifecycle is correct both when navigating forward and returning to a previous screen.

### Stage 5 — Verification

Use the existing package scripts and available tooling to run the appropriate:

* TypeScript/type checks.
* Lint checks.
* Unit tests.
* Relevant component or integration tests.
* Android build or other available build verification, when practical.

Inspect the diffs to ensure the change set stays scoped to motion and supporting infrastructure.

Fix errors introduced by your modifications. Do not claim that an Android build, device test, or screenshot validation succeeded unless it was actually run.

If automated UI testing or a connected Android device is available, test the actual animation behavior. If neither is available, perform the strongest static/build/test verification possible and explicitly identify any remaining visual verification that could not be performed.

## 14. Final acceptance criteria

The work is complete only when the following conditions are met:

1. The Home screen has a coherent entrance sequence, genuine numeric count-ups, and smooth section reveals.
2. Home's below-the-fold sections animate as appropriate without delaying scrolling.
3. Workout-plan expansion/collapse and drag-and-drop interactions remain correct.
4. Template filters and selection transitions are smooth and data-driven.
5. Body, Volume, Strength, and Records analytics each animate their appropriate data visualizations.
6. Bar charts grow from the correct baseline.
7. Line charts draw progressively without changing the underlying plotted values.
8. Ring charts reveal actual proportional segments.
9. Important metrics count up smoothly and settle on their correct final values.
10. Active Workout retains immediate, reliable interactions and accurate timer/progress behavior.
11. Screen entrances and chart reveals are predictable and replay correctly when revisiting screens.
12. Animations do not continuously restart because of unrelated state updates.
13. The interface remains usable throughout the animations and under reduced-motion settings.
14. Existing business logic, Supabase synchronization, persistence, data calculations, and navigation remain intact.
15. No unnecessary dependencies, hard-coded demonstration data, or unrelated refactors have been introduced.
16. The relevant checks pass, or any pre-existing failures or environmental limitations are clearly identified.

## 15. Final response after implementation

After completing the work, report:

* The shared motion utilities created or improved.
* The screens and interactions animated.
* How number, bar-chart, line-chart, and ring-chart animation were implemented.
* Any animation-specific dependencies added, with reasons.
* The checks/builds that actually passed.
* Any limitations or remaining visual/device validation.
* The principal files changed.

Do not merely tell me how you would implement the work. Implement it in the existing feature branch and provide a concise, factual completion report.

**Overall visual target:** NextRep should feel like a polished, premium fitness product in a professional promotional screen recording: metrics count up, charts reveal their stories, cards arrive with deliberate hierarchy, and interactions respond instantly. Every animation must reinforce the design and the real data—not distract from them.
