# Water Puzzle Star - Architecture Documentation

## Overview

Water Puzzle Star is a vanilla JavaScript game with a canvas playfield plus DOM-based UI overlays.  
Runtime code lives in `main.js`; static shell/layout lives in `index.html`; level content lives in `levels.js`.

## Runtime Architecture

### Boot Sequence
1. **Load order**: `index.html` loads `levels.js` (global `LEVELS`) then `main.js`.
2. **Initialize**: `DOMContentLoaded` triggers resize, `initLevel(lvlIdx)`, and `requestAnimationFrame(frame)`.
3. **Run loop**: `frame()` updates animation state and draws background, bottles, target line, feedback, and particles.

### UI Composition

#### Canvas Layer
- Renders bottles, pours, particles, target line, blocked feedback, and decorative header text.
- Handles pointer gameplay input via `onTap()` and bottle hit-testing.

#### DOM Layer
- **Top HUD** (`#top-hud`): live counters for world/level, moves/par, target, hints, and stars.
- **Bottom action bar**: menu, undo, restart, hint, and sound controls.
- **Overlays**:
  - `#level-menu-overlay`: paged world/level selector (`20` levels per page).
  - `#win-overlay`: post-win dialog and next-level action.

### Overlay Behavior

- Overlay visibility is centralized by `setOverlayOpenState(overlay, isOpen)` which toggles `.active` and `aria-hidden`.
- Level menu supports close via close button, backdrop click, and `Escape`.
- Win overlay supports close via backdrop click and `Escape`.
- Focus is preserved/restored (`levelMenuReturnFocus`, `winReturnFocus`) so keyboard users return to prior context.

### Hint Workflow & Highlights

- Hint button runs `GameSolver.solve(...)` (BFS) for the current bottle state.
- Valid hint sets `activeHint = { from, to }`, decrements stored hints when available, and updates HUD.
- Source and destination bottles receive distinct pulsing highlight strokes.
- Hint guidance auto-clears after `HINT_DISPLAY_MS` (~2800ms), and is also cleared on restart, undo, level init, or successful pour.

### Accessibility & Keyboard Support

- Controls include semantic attributes: `aria-label`, `aria-disabled`, `aria-pressed`.
- Overlays use `role="dialog"`, `aria-modal`, and dynamic `aria-hidden`.
- Visible keyboard focus styles are applied via `:focus-visible`.
- Keyboard behavior:
  - `Escape` closes the topmost open overlay.
  - Native button activation (`Enter`/`Space`) works across controls.
  - When win overlay is open and focus is not on another interactive control, `Enter`/`Space` triggers the primary next action.

## State Management & Persistence

Primary mutable runtime state in `main.js` includes:
- `bottles`: `{ capacity, current, colorIdx, entryScale }[]`
- `lvlIdx`, `moves`, `history`, `dispAmts`
- `won`, `isAnimating`, `pourAnim`, `shakeAnim`
- `activeHint`, `hintCount`, `totalStars`

Persisted `localStorage` keys:
- `water_puzzle_lvl`
- `maxUnlockedLevel`
- `water_puzzle_stars`
- `level_${i}_stars`
- `water_puzzle_hints`
- `water_puzzle_sound`

## Level Data & Validation Pipeline

### Level Schema (`levels.js`)

```javascript
{
  capacities: [17, 6, 5], // Bottle capacities
  initial: [11, 1, 5],    // Starting fill amounts
  target: 7,              // Win if any bottle reaches this amount
  par: 3                  // BFS-derived optimal move count
}
```

### Generation (`generate_levels.js`)
1. Builds candidate bottle/target setups.
2. Uses BFS solvability checks.
3. Filters low-quality/duplicate candidates.
4. Emits `levels.js`.

### Validation Workflow
- `validate_levels.js`: CLI BFS sanity check over a fixed 30-level sample set.
- `test-artifacts/ux-regression-test.js`: Playwright regression for menu/win overlays, hint state behavior, keyboard paths, and console health; writes timestamped screenshots + JSON report under `test-artifacts/run-<timestamp>/`.

## Key Files

| File | Responsibility |
|------|----------------|
| `index.html` | DOM shell, HUD, controls, overlays, styling |
| `main.js` | Runtime state, game loop, rendering, input, overlays, solver integration |
| `levels.js` | Generated level data (`LEVELS`) |
| `generate_levels.js` | Level generation + solvability-driven curation |
| `validate_levels.js` | Solver validation script |
| `test-artifacts/ux-regression-test.js` | Automated UI/keyboard regression checks |
