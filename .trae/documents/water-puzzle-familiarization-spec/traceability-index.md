# Water Puzzle Star Traceability Index

## Runtime and UI Structure
- Script load order:
  - `levels.js` then `main.js` in `index.html`.
  - Reference: `index.html` script tags near end of file.
- UI surfaces:
  - Canvas and control bar: `index.html` game board section.
  - Win overlay and level menu overlay: `index.html` overlay sections.

## Lifecycle and Core Loop
- Startup bootstrap:
  - `DOMContentLoaded` handler with resize/init/RAF start.
  - Reference: `main.js` bootstrap block near file end.
- Continuous loop:
  - `frame()` schedules itself with `requestAnimationFrame(frame)`.
  - Reference: `main.js` frame function tail.

## Gameplay and State Mutation
- Move logic:
  - `pour(fromI, toI)` validates source/destination and mutates bottle amounts.
- Input dispatch:
  - `onTap(cx, cy)` resolves bottle hit and selection/transfer behavior.
- Win handling:
  - `showWin()` computes star score and updates progression.

## Solver and Hint
- Search algorithm:
  - `class GameSolver` with BFS-based `solve`.
- Hint trigger:
  - hint button listener calling solver and applying first step.

## Progression and Persistence
- Storage keys:
  - `water_puzzle_lvl`, `maxUnlockedLevel`, `water_puzzle_stars`,
    `water_puzzle_hints`, `water_puzzle_sound`, and per-level stars key.
- Menu lock/unlock:
  - page render logic in level menu builder.

## Level Pipeline
- Generation:
  - `generate_levels.js` (`solveForward`, scramble, dedupe, file write).
- Validation:
  - `validate_levels.js` sample dataset BFS solvability check.
- Runtime consumption:
  - `initLevel()` reads `LEVELS` entries from `levels.js`.
