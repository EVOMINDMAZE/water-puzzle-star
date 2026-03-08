# UI/UX Improvement Plan for App Menu and Classic Mode

**Goal:** Improve usability, clarity, responsiveness, and accessibility of the level menu and classic gameplay flow without changing core puzzle rules.

## Scope
- In scope:
  - Level menu overlay UX and level-card readability.
  - Classic mode HUD readability and action-bar interaction feedback.
  - Hint visibility and reliability in classic mode.
  - Keyboard/accessibility improvements for controls and overlays.
- Out of scope:
  - New game modes.
  - Level-generation algorithm redesign.
  - Art style replacement.

## Primary Files
- [index.html](file:///Users/riad/Downloads/water-puzzle-star/index.html)
- [main.js](file:///Users/riad/Downloads/water-puzzle-star/main.js)
- Optional documentation updates:
  - [README.md](file:///Users/riad/Downloads/water-puzzle-star/README.md)
  - [docs/ARCHITECTURE.md](file:///Users/riad/Downloads/water-puzzle-star/docs/ARCHITECTURE.md)

## Implementation Phases

### Phase 1 — Stabilize Hint Flow (Blocker)
1. Fix solver parameter mismatch and undefined variables in `GameSolver.solve(...)`.
2. Keep the current public call shape from the hint button handler, or update both function signature and call site consistently.
3. Ensure return contract is explicit (`null` or `{from, to}`) and consumed safely.
4. Add visible hint guidance in classic mode:
   - highlight source and destination bottles;
   - clear highlight after move, restart, level change, or timeout.
5. Validate by triggering hint on multiple levels and confirming deterministic, visible guidance.

**Target areas**
- [main.js](file:///Users/riad/Downloads/water-puzzle-star/main.js) solver class section.
- [main.js](file:///Users/riad/Downloads/water-puzzle-star/main.js) hint button handler section.
- [main.js](file:///Users/riad/Downloads/water-puzzle-star/main.js) bottle rendering section.

### Phase 2 — Improve Menu Overlay UX
1. Add backdrop-click close behavior for level menu overlay.
2. Add Escape-key close behavior for level menu and win overlay.
3. Preserve existing close button behavior and prevent accidental close when clicking inside menu panel.
4. Improve locked tile readability:
   - raise opacity and reduce grayscale intensity;
   - keep clear locked icon and label contrast.
5. Clarify current playable level tile:
   - replace ambiguous placeholder text with explicit “Current” or “Play”.
6. Ensure page navigation buttons reflect disabled states with both visual and semantic attributes.

**Target areas**
- [index.html](file:///Users/riad/Downloads/water-puzzle-star/index.html) overlay and level-card styles.
- [main.js](file:///Users/riad/Downloads/water-puzzle-star/main.js) menu open/close and page-render logic.

### Phase 3 — Upgrade Classic Mode HUD and Controls
1. Move critical status from canvas-only drawing to DOM HUD (or mirror in DOM):
   - level/world;
   - moves vs par;
   - hints remaining;
   - total stars and target amount.
2. Keep canvas visuals, but make the DOM HUD the primary readable status layer for responsive and accessibility benefits.
3. Add control disabled states driven by runtime conditions:
   - Undo disabled when history is empty or animation is active or level is won.
   - Restart disabled during animation if needed.
   - Hint disabled when no hints remain, animation is active, or level is won.
4. Add consistent pressed/disabled/focus-visible styles for action buttons.

**Target areas**
- [index.html](file:///Users/riad/Downloads/water-puzzle-star/index.html) HUD markup and action button classes.
- [main.js](file:///Users/riad/Downloads/water-puzzle-star/main.js) `updateHUD`, game-state guards, and button state sync logic.

### Phase 4 — Accessibility and Input Consistency
1. Add `aria-label` for icon-only buttons and menu controls.
2. Ensure overlays expose proper semantics:
   - `role="dialog"`;
   - `aria-modal="true"`;
   - focus handoff on open and focus return on close.
3. Add keyboard support parity:
   - Escape closes overlays;
   - Enter/Space activates focused controls.
4. Ensure contrast and focus indicators meet practical accessibility standards.

**Target areas**
- [index.html](file:///Users/riad/Downloads/water-puzzle-star/index.html) button and overlay markup.
- [main.js](file:///Users/riad/Downloads/water-puzzle-star/main.js) keyboard and focus management handlers.

### Phase 5 — Visual Polish and Micro-Feedback
1. Add lightweight transitions for:
   - menu opening/closing;
   - level tile hover/active states;
   - hint highlight pulse.
2. Add subtle status feedback for blocked actions (for example, low-amplitude shake or toast text).
3. Ensure no animation interferes with gameplay responsiveness on low-end devices.

**Target areas**
- [index.html](file:///Users/riad/Downloads/water-puzzle-star/index.html) CSS transitions.
- [main.js](file:///Users/riad/Downloads/water-puzzle-star/main.js) non-blocking feedback triggers.

## Verification Plan
1. Manual scenario tests:
   - open/close level menu by button, backdrop, and Escape;
   - navigate pages at first/middle/last pages;
   - select locked/unlocked/current levels;
   - use undo/restart/hint across idle, animating, and won states;
   - verify hint highlight lifecycle.
2. Persistence checks:
   - reload and confirm level, stars, hints, unlock state persistence remains correct.
3. Responsive checks:
   - desktop and mobile viewport behavior for menu panel and action bar.
4. Accessibility checks:
   - keyboard-only traversal and overlay close behavior;
   - focus-visible indicators and labels.
5. Regression check:
   - run existing solvability validator script to ensure no accidental gameplay regression from UI changes.

## Delivery Order
1. Phase 1 (Hint flow blocker).
2. Phase 2 (Menu UX).
3. Phase 3 (Classic HUD/controls).
4. Phase 4 (Accessibility).
5. Phase 5 (Polish).
6. Verification and docs updates.

## Success Criteria
- Hint action is reliable and visibly guides the user.
- Menu is dismissible via close button, backdrop, and Escape.
- Current/locked/unlocked levels are immediately understandable.
- Bottom actions communicate availability through disabled states.
- Classic mode status is readable on all target viewport sizes.
- Keyboard and assistive semantics are present for menu and controls.
