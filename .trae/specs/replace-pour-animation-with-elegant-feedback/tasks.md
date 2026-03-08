# Tasks
- [x] Task 1: Remove lift-and-pour animation pipeline.
  - [x] SubTask 1.1: Identify and disable lift/tilt/travel animation state transitions used for valid pours.
  - [x] SubTask 1.2: Keep move history, win checks, and transfer math unchanged.
  - [x] SubTask 1.3: Ensure frame loop no longer depends on removed pour-motion state.

- [x] Task 2: Implement elegant replacement feedback.
  - [x] SubTask 2.1: Add short source highlight feedback for transfer start.
  - [x] SubTask 2.2: Add short destination highlight feedback for transfer completion.
  - [x] SubTask 2.3: Add subtle transfer streak/ripple cue with quick fade timing.
  - [x] SubTask 2.4: Reuse existing sound/haptic toggles without adding heavy effects.

- [x] Task 3: Improve classic mode UX/UI clarity.
  - [x] SubTask 3.1: Tune effect durations and opacity so result state is always primary.
  - [x] SubTask 3.2: Ensure cues do not collide with HUD, target line, or bottom controls.
  - [x] SubTask 3.3: Adjust relevant style values for clearer visual hierarchy.

- [x] Task 4: Validate interaction behavior and regressions.
  - [x] SubTask 4.1: Verify valid transfer is instant and consistent across levels.
  - [x] SubTask 4.2: Verify invalid action feedback still behaves correctly.
  - [x] SubTask 4.3: Run UX regression tests and confirm no menu/hint/win-flow regressions.
  - [x] SubTask 4.4: Perform manual checks on portrait and landscape viewports.

# Task Dependencies
- Task 2 depends on Task 1.
- Task 3 depends on Task 2.
- Task 4 depends on Task 1, Task 2, and Task 3.
