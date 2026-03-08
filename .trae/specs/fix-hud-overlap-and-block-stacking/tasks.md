# Tasks
- [x] Task 1: Baseline the overlap failures and define layout constants.
  - [x] SubTask 1.1: Capture current overlap cases for desktop and mobile viewports.
  - [x] SubTask 1.2: Add top/bottom/side safe-area constants in shared layout computation.
  - [x] SubTask 1.3: Add minimum bottle spacing and height clamp constants.

- [x] Task 2: Implement HUD non-overlap behavior.
  - [x] SubTask 2.1: Update HUD container styles to support responsive wrapping and fixed gaps.
  - [x] SubTask 2.2: Ensure HUD row height contributes to layout safe area used by canvas rendering.
  - [x] SubTask 2.3: Verify no HUD-to-HUD or HUD-to-gameplay overlap at target breakpoints.

- [x] Task 3: Implement bottle layout collision prevention.
  - [x] SubTask 3.1: Refactor `getLayout()` to include explicit safe-area offsets.
  - [x] SubTask 3.2: Recompute bottle x positions with enforced minimum spacing.
  - [x] SubTask 3.3: Clamp bottle heights and baseline for short viewports.

- [x] Task 4: Stabilize target line and label placement.
  - [x] SubTask 4.1: Clamp target line label y-position away from HUD rows.
  - [x] SubTask 4.2: Preserve full label visibility within canvas bounds.
  - [x] SubTask 4.3: Verify readability against bottles and background.

- [x] Task 5: Run regression verification.
  - [x] SubTask 5.1: Validate menu/classic interactions still function.
  - [x] SubTask 5.2: Run UX regression script and confirm no new failures.
  - [x] SubTask 5.3: Perform manual viewport checks (portrait and landscape).

# Task Dependencies
- Task 2 depends on Task 1.
- Task 3 depends on Task 1.
- Task 4 depends on Task 2 and Task 3.
- Task 5 depends on Task 2, Task 3, and Task 4.
