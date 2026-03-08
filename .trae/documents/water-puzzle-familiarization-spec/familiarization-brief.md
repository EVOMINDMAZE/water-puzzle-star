# Water Puzzle Star Familiarization Brief

## 1) Repository Surface Map
- Runtime:
  - `index.html`: UI structure, overlays, styling, script loading order.
  - `main.js`: gameplay loop, rendering, input, solver, progression, persistence.
  - `levels.js`: level dataset consumed by runtime.
- Tooling:
  - `generate_levels.js`: procedural generation + BFS solvability/par assignment + write to `levels.js`.
  - `validate_levels.js`: independent BFS validation over a hardcoded sample dataset.
- Documentation:
  - `DESIGN.md`: high-level design intent.
- Assets:
  - `assets/bg.png`: present, currently not part of active runtime path.

## 2) Boot and Runtime Lifecycle
1. Browser loads `levels.js` first, then `main.js`.
2. `DOMContentLoaded` triggers `resize()`, `initLevel(lvlIdx)`, then starts `requestAnimationFrame(frame)`.
3. Player interactions route through canvas click/touch handlers to `onTap()`.
4. Successful moves call `pour(from,to)` and start animation state.
5. `frame()` updates animation/physics/effects, evaluates win condition, draws full frame, re-queues itself.

## 3) State Model and Mutators
- Core persisted and runtime state includes:
  - Level/progression: `lvlIdx`, unlock state, stars, hints, sound flag.
  - Gameplay: `bottles`, `targetAmt`, `moves`, `history`, `selIdx`, `won`.
  - Animation/effects: `dispAmts`, `isAnimating`, `pourAnim`, `shakeAnim`, particles.
- Primary mutators:
  - `initLevel()`: resets level and transient runtime state.
  - `pour()`: validates and executes moves, increments move count, appends history, seeds animation.
  - `frame()`: advances animation/effects, syncs display amounts, triggers win transition.
  - `showWin()`: computes star result, updates progression persistence.
  - `onTap()`: updates selection or delegates to `pour()`.

## 4) Input-to-Pour and Render Flow
- Input resolution:
  - Hit-test bottle from pointer position.
  - First tap selects source bottle.
  - Second tap attempts transfer to destination.
- Move validity:
  - Source must contain liquid.
  - Destination must have remaining capacity.
  - Transfer amount is `min(source_current, destination_remaining)`.
- Render ordering in `frame()`:
  - Process animation interpolation and stream effects.
  - Update physics and display values.
  - Evaluate win condition after transfer completion.
  - Draw background, header, bottles, target line, particles.

## 5) Solver and Hint Behavior
- `GameSolver.solve()` performs BFS over serialized bottle states.
- Solver returns first move of shortest found path to any state where a bottle reaches target.
- Hint button:
  - Requires available hints and non-win state.
  - Computes solution from current state and applies first step as highlight/action guidance.
- Constraints:
  - Search cost grows with branching factor and state space size.
  - Runtime UX currently degrades by returning “No valid moves” when no path is found.

## 6) Level Data and Pipeline
- Runtime schema (`levels.js`):
  - `capacities: number[]`
  - `initial: number[]`
  - `target: number`
  - `par: number`
- Generation (`generate_levels.js`):
  - Builds random capacities (3–4 bottles), random target, scrambles forward, computes shortest solution via BFS, keeps puzzles with `par >= 3`, deduplicates, sorts by `par`, writes `levels.js`.
- Validation (`validate_levels.js`):
  - Uses separate inline sample levels and a different object schema.
  - Confirms solvability but does not validate generated `levels.js`.

## 7) UI, Progression, and Persistence
- UI surfaces:
  - Gameplay canvas and bottom action bar.
  - Win overlay with stars and next-level action.
  - Level menu overlay with pagination and lock states.
- Progression:
  - Current level persists and is restored on load.
  - Completing highest unlocked level unlocks the next level.
  - Star ratings are saved per level and accumulated globally.
- Local storage keys:
  - `water_puzzle_lvl`
  - `maxUnlockedLevel`
  - `water_puzzle_stars`
  - `water_puzzle_hints`
  - `water_puzzle_sound`
  - `level_${i}_stars`

## 8) Operational Runbook
- Play locally:
  - Open `index.html` in a browser.
- Generate level corpus:
  - Run `node generate_levels.js` from repository root.
  - Expected result: regenerated `levels.js` with 1000 levels.
- Validate sample levels:
  - Run `node validate_levels.js`.
  - Expected result: per-level solvability report and summary.

## 9) Trust Boundaries and Known Gaps
- `validate_levels.js` checks only hardcoded sample levels, not the generated production corpus.
- Level generator has no deterministic seed; outputs vary between runs.
- Difficulty ordering is primarily `par`-based and may not fully reflect perceived challenge.

## 10) Where to Edit
- Gameplay rules and move resolution: `main.js` (`pour()`, `onTap()`, win checks in `frame()`).
- Visuals/effects and feel: `main.js` drawing functions, particle/audio classes, and `index.html` styles.
- Level generation strategy and difficulty shape: `generate_levels.js`.
- Progression, stars, unlock policy, and menu behavior: `main.js` (`showWin()`, menu rendering/open logic).
