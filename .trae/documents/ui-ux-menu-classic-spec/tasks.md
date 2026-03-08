# Menu + Classic UX/UI Implementation Tasks

## Execution Model
- Complete phases in strict order because each phase unlocks assumptions used by later UI/state work.
- Treat **Phase 1** as a hard blocker for all later phases.
- Keep puzzle rules and progression behavior unchanged while improving UX/UI behavior.
- Re-run verification after every phase, then run full regression in Phase 6.

## Phase 1 — Stabilize Hint Flow (Blocker)
### Dependencies
- None (first phase).

### Exact File Touchpoints
- `/Users/riad/Downloads/water-puzzle-star/main.js`
  - `class GameSolver`, especially `GameSolver.solve(...)`.
  - Hint trigger handler: `document.getElementById('hint-btn').addEventListener('click', ...)`.
  - Hint lifecycle reset points: `initLevel(...)`, `pour(...)`, undo handler, restart handler, and any timeout-based hint feedback.
  - Bottle rendering path where `activeHint` can be drawn as visible source/destination guidance.

### Tasks
- Align `GameSolver.solve(...)` signature and call sites to one consistent contract.
- Remove undefined-variable/state references in solver internals and use passed/current state consistently.
- Enforce explicit return contract: `null` or `{ from, to }`.
- Guard all consumers of solver output against null and invalid move payloads.
- Render visible hint guidance (source + destination) and clear it on move/restart/level change/expiration.

### Verification
- Trigger hint on multiple solvable levels; verify a deterministic visible suggestion appears.
- Trigger hint during invalid runtime states (won/animating); verify no unsafe transition occurs.
- Confirm hint highlight clears after: successful move, undo, restart, level switch, and timeout.
- Confirm hint count persistence still works across reload (`localStorage` key: `water_puzzle_hints`).

## Phase 2 — Improve Menu Overlay UX
### Dependencies
- Requires Phase 1 complete (stable action-state behavior for shared controls).

### Exact File Touchpoints
- `/Users/riad/Downloads/water-puzzle-star/index.html`
  - Overlay container: `#level-menu-overlay`.
  - Menu panel structure: `.lm-header`, `.lm-content`, `.lm-footer`, `.lm-grid`.
  - Level card styles: `.lm-btn`, `.lm-btn.locked`, `.lm-stars`.
  - Menu controls: `#lm-close`, `#lm-prev-btn`, `#lm-next-btn`.
- `/Users/riad/Downloads/water-puzzle-star/main.js`
  - Menu open/close: `openLevelMenu()`, `closeLevelMenu()`.
  - Page render and level card labeling/state logic: `renderLevelPage(...)`.
  - Overlay listeners: menu button + close + page nav listeners.

### Tasks
- Add backdrop-click close for level menu while preventing close on inner panel clicks.
- Add Escape close behavior for both level menu and win overlay.
- Keep close-button behavior unchanged and deterministic.
- Improve locked tile readability (contrast/opacity/grayscale adjustments).
- Replace ambiguous current-level marker (`'---'`) with explicit current action label.
- Ensure page nav disabled state is visual and semantic (`disabled`, optional `aria-disabled` sync).

### Verification
- Open/close level menu via menu button, close button, backdrop click, and Escape.
- Click inside panel (grid/header/footer) and confirm overlay stays open.
- Verify first/last page nav buttons are correctly disabled in both UI and attributes.
- Validate locked/current/passed/unlocked states are distinguishable at a glance.

## Phase 3 — Upgrade Classic HUD and Controls
### Dependencies
- Requires Phase 2 complete (overlay/input behavior baseline in place).

### Exact File Touchpoints
- `/Users/riad/Downloads/water-puzzle-star/index.html`
  - Bottom action bar `#bottom-banner`.
  - Action buttons: `#undo-btn`, `#restart-btn`, `#hint-btn`, `#menu-btn`.
  - New or expanded DOM HUD region for level/moves/hints/stars status.
  - Button visual states: base, `:disabled`, pressed, focus-visible.
- `/Users/riad/Downloads/water-puzzle-star/main.js`
  - `updateHUD()` as centralized HUD + button-state synchronization.
  - Runtime state sources: `history`, `isAnimating`, `won`, `moves`, `hintCount`, `lvlIdx`, stars/persistence state.
  - Action handlers for undo/restart/hint/menu to ensure state sync after each event.

### Tasks
- Promote DOM HUD to primary readable status (keep canvas visuals as complementary).
- Show world/level, moves vs par, hints remaining, total stars and target in DOM.
- Centralize and apply disabled-state logic:
  - Undo disabled when no history, animating, or won.
  - Restart disabled during animation if interaction should be blocked.
  - Hint disabled when no hints remain, animating, or won.
- Add consistent interaction feedback styles (pressed, disabled, focus-visible).

### Verification
- During idle/animating/won states, confirm button disabled states update instantly and correctly.
- Execute undo/restart/hint flows and verify HUD values remain in sync with game state.
- Verify readable HUD layout at mobile and desktop widths.

## Phase 4 — Accessibility and Input Consistency
### Dependencies
- Requires Phase 3 complete (finalized DOM controls/HUD structure).

### Exact File Touchpoints
- `/Users/riad/Downloads/water-puzzle-star/index.html`
  - Icon-only buttons (`#menu-btn`, `#undo-btn`, `#restart-btn`, `#hint-btn`, `#sound-btn`) for `aria-label`.
  - Overlays (`#level-menu-overlay`, `#win-overlay`) for dialog semantics (`role`, `aria-modal`, labels).
- `/Users/riad/Downloads/water-puzzle-star/main.js`
  - Global keyboard handlers for Escape and Enter/Space activation parity.
  - Focus capture/restore logic when opening/closing overlays.

### Tasks
- Add meaningful `aria-label` text for icon-only controls.
- Add/validate dialog semantics on overlays.
- Implement deterministic focus handoff on open and focus return on close.
- Ensure keyboard parity for close/activate interactions.
- Ensure focus-visible indicators and contrast remain practical and visible.

### Verification
- Run keyboard-only traversal through all actionable controls and overlays.
- Confirm Escape closes the correct topmost overlay.
- Confirm Enter/Space activates focused controls without requiring pointer input.
- Confirm focus returns to invoking trigger after overlay close.

## Phase 5 — Visual Polish and Micro-Feedback
### Dependencies
- Requires Phase 4 complete (final semantics/input behavior should not be destabilized by polish).

### Exact File Touchpoints
- `/Users/riad/Downloads/water-puzzle-star/index.html`
  - Overlay transitions (`#level-menu-overlay`, panel elements).
  - Level tile interaction states (`.lm-btn`, hover/active/focus-visible).
  - Hint/highlight animation classes or keyframes.
- `/Users/riad/Downloads/water-puzzle-star/main.js`
  - Non-blocking triggers for blocked-action feedback and hint pulse lifecycle.

### Tasks
- Add short, non-blocking transitions for menu open/close and tile interactions.
- Add subtle hint pulse treatment for active hint guidance.
- Add low-amplitude blocked-action feedback that does not interrupt gameplay loop.
- Keep all motion effects lightweight and easy to tune/remove.

### Verification
- Confirm interactions remain responsive during animations on low-end/mobile profile.
- Confirm polish feedback never blocks input handling or state progression.
- Confirm hint pulse stops when hint lifecycle ends.

## Phase 6 — Verification and Regression Pass
### Dependencies
- Requires Phases 1–5 complete.

### Exact File Touchpoints
- `/Users/riad/Downloads/water-puzzle-star/main.js` (runtime behaviors under test).
- `/Users/riad/Downloads/water-puzzle-star/index.html` (overlay/HUD/accessibility semantics under test).
- `/Users/riad/Downloads/water-puzzle-star/validate_levels.js` (solvability regression script).
- Optional docs if behavior/contracts changed:
  - `/Users/riad/Downloads/water-puzzle-star/README.md`
  - `/Users/riad/Downloads/water-puzzle-star/docs/ARCHITECTURE.md`

### Tasks
- Execute full manual interaction matrix (menu, pages, selection states, action buttons, win flow).
- Execute persistence checks (reload retains level, stars, hints, unlock state).
- Execute responsive checks for menu panel and control area.
- Execute accessibility checks (labels, dialog semantics, focus flow, keyboard operation).
- Run solvability regression script to ensure gameplay logic remains valid.
- Update optional docs only if public behavior/contract changed.

### Verification
- Run:
  - `node /Users/riad/Downloads/water-puzzle-star/validate_levels.js`
- Record pass/fail outcomes for:
  - Overlay close paths.
  - Hint lifecycle and reliability.
  - Disabled-state correctness.
  - Persistence correctness.
  - Keyboard/accessibility behavior.
  - Solvability script status.

## Completion Order (Strict)
- 1) Phase 1 — Hint Flow Blocker
- 2) Phase 2 — Menu Overlay UX
- 3) Phase 3 — Classic HUD + Controls
- 4) Phase 4 — Accessibility + Input Consistency
- 5) Phase 5 — Visual Polish + Micro-Feedback
- 6) Phase 6 — Verification + Regression + Optional Doc Sync

## Phase Gate Criteria
- Do not start the next phase until all verification bullets in the current phase pass.
- If any regression appears, fix in the same phase before proceeding.
- Keep one source of truth for runtime state sync (`updateHUD()` + centralized control-state updater).
