# Water Puzzle Star Familiarization Implementation Artifacts

## Artifact A: Repository Surface Map
- Runtime:
  - `index.html`: page structure, overlays, UI controls, and script ordering.
  - `main.js`: gameplay state, input, physics/rendering, solver, progression, persistence.
  - `levels.js`: browser-global `LEVELS` dataset.
- Tooling:
  - `generate_levels.js`: random generation, solvability/par scoring, dedupe, write pipeline.
  - `validate_levels.js`: standalone sample-level solvability validator.
- Documentation:
  - `DESIGN.md`: design intent and theme notes.
- Assets:
  - `assets/bg.png`: present in repo, not used by current runtime code path.

## Artifact B: Boot and Lifecycle Timeline
1. Browser loads `levels.js` then `main.js` via script tags.
2. On `DOMContentLoaded`, runtime executes:
   - `resize()`
   - `initLevel(lvlIdx)`
   - `requestAnimationFrame(frame)`
3. Pointer/click events are attached to canvas and window listeners.
4. Every frame executes update + render + next RAF scheduling.

## Artifact C: State Model and Mutator Index
- Core globals:
  - Gameplay: `bottles`, `targetAmt`, `moves`, `history`, `selIdx`, `won`.
  - Animation/effects: `dispAmts`, `isAnimating`, `pourAnim`, `shakeAnim`.
  - Progression/persistence: `lvlIdx`, hints, stars, unlock state.
- Mutator index:
  - `initLevel()`: initializes all per-level and transient state.
  - `pour(from,to)`: validates and mutates source/destination, move count, history, animation.
  - `frame()`: updates physics/animation and evaluates win.
  - `showWin()`: persists star score and unlock progression.
  - `onTap()`: updates selected bottle or triggers pour.

## Artifact D: Input-to-Pour Flow Notes
1. Canvas click/touch translates pointer into bottle hit-test.
2. If no prior selection, tapped bottle becomes selected source.
3. If source already selected, second tap attempts transfer:
   - source must have liquid
   - destination must have remaining capacity
   - transfer amount = `min(source, destination_remaining)`
4. Success triggers move bookkeeping and transfer animation.
5. Invalid transfer triggers shake/error feedback.

## Artifact E: Frame Loop and Rendering Notes
- Frame loop responsibilities:
  - update bottle squash/physics values
  - interpolate active pour animation
  - update particles/effects
  - check win condition when pour completes
  - draw background, HUD, bottles, target line, stream/effects
- Hotspot candidates:
  - per-frame bottle drawing path
  - repeated particle updates/draws
  - full-canvas redraw every frame

## Artifact F: Solver and Hint Summary
- Solver uses BFS over serialized bottle states.
- Goal condition is any bottle reaching level target amount.
- Hint button:
  - checks available hints and non-win state
  - calls solver from current state
  - applies first move from shortest discovered path
- Failure mode:
  - no solution path from current state returns fallback UX.

## Artifact G: Level Pipeline Summary
- Runtime level schema:
  - `capacities: number[]`
  - `initial: number[]`
  - `target: number`
  - `par: number`
- Generation:
  - random capacities and target
  - scramble from canonical start
  - BFS solve for `par`
  - filter (`par >= 3`), dedupe, sort by par
  - write `levels.js`
- Validation:
  - independent BFS on hardcoded sample list
  - does not validate generated `levels.js` corpus directly.

## Artifact H: UI and Progression Rules
- UI surfaces:
  - main canvas
  - bottom action bar
  - level menu overlay with pagination
  - win overlay with star result and next action
- Progression:
  - current level stored and restored from local storage
  - completing highest unlocked level unlocks next level
  - per-level stars persist and total stars accumulate
- Persistence keys:
  - `water_puzzle_lvl`
  - `maxUnlockedLevel`
  - `water_puzzle_stars`
  - `water_puzzle_hints`
  - `water_puzzle_sound`
  - `level_${i}_stars`

## Artifact I: Local Runbook
- Run game:
  - Open `index.html` in a browser.
- Regenerate levels:
  - `node generate_levels.js`
  - Expected: writes new `levels.js` with generated level array.
- Validate sample levels:
  - `node validate_levels.js`
  - Expected: per-level solvability output and success summary.

## Artifact J: Where-to-Edit Guide
- Gameplay rules and transfers:
  - `main.js` in `pour()`, `onTap()`, and win checks inside `frame()`.
- UI and visual polish:
  - `index.html` styles and overlay markup, plus draw functions in `main.js`.
- Puzzle generation and difficulty shaping:
  - `generate_levels.js`.
- Progression, unlocking, and star policy:
  - `main.js` in menu rendering and `showWin()`.
