# Menu + Classic UX/UI Improvement Specification

## 1) Objectives
- Improve usability and clarity of the level menu and classic mode flow without changing puzzle mechanics.
- Make core gameplay state easier to read across desktop/mobile through stronger HUD and action-state feedback.
- Improve input consistency (mouse + keyboard) and accessibility semantics for overlays and controls.
- Stabilize hint behavior so hints are reliable, visible, and lifecycle-safe across level transitions and actions.

## 2) Scope
### In Scope
- Level menu overlay interaction and level-card readability.
- Classic mode HUD readability and action-bar interaction feedback.
- Hint visibility/reliability in classic mode.
- Keyboard and accessibility improvements for overlays and controls.
- Lightweight visual polish that does not reduce gameplay responsiveness.

### Out of Scope
- New game modes.
- Level-generation algorithm redesign.
- Full art direction replacement.
- Rule changes to puzzle logic.

## 3) Constraints
- Preserve existing core gameplay behavior and level solvability.
- Keep performance responsive on low-end devices; avoid heavy animation or blocking UI effects.
- Keep public interactions coherent when changing function signatures (especially hint flow).
- Maintain persistence behavior (stars, unlocked levels, hints, current level) after reload.
- Avoid regressions in existing interactions: open/close controls, page navigation, win flow.

## 4) File Targets
- Primary implementation files:
  - `/Users/riad/Downloads/water-puzzle-star/index.html`
  - `/Users/riad/Downloads/water-puzzle-star/main.js`
- Optional update targets (if needed for alignment):
  - `/Users/riad/Downloads/water-puzzle-star/README.md`
  - `/Users/riad/Downloads/water-puzzle-star/docs/ARCHITECTURE.md`

## 5) Phased Implementation

### Phase 1 — Stabilize Hint Flow (Blocker)
- Resolve solver parameter/signature mismatch and undefined-variable risk in `GameSolver.solve(...)`.
- Keep hint invocation contract consistent between call site and solver interface.
- Standardize return shape to `null` or `{ from, to }` and guard consumers accordingly.
- Render visible hint guidance (source + destination highlight) in classic mode.
- Clear hint highlight on move, restart, level change, and timeout expiration.

### Phase 2 — Improve Menu Overlay UX
- Add backdrop-click close behavior for the level menu overlay.
- Add Escape close behavior for level menu and win overlay.
- Preserve close-button behavior and prevent close when clicking inside panel content.
- Improve locked tile readability (opacity/grayscale/contrast adjustments).
- Replace ambiguous current-level label with explicit copy such as “Current” or “Play”.
- Ensure page-nav disabled states are both visual and semantic.

### Phase 3 — Upgrade Classic HUD and Controls
- Move key status to DOM HUD (or mirror there) while preserving canvas visuals:
  - world/level
  - moves vs par
  - hints remaining
  - stars total and target
- Treat DOM HUD as primary readability layer for responsive/accessibility benefits.
- Add runtime-driven disabled states:
  - Undo disabled when history empty, animating, or won.
  - Restart disabled during animation when applicable.
  - Hint disabled when no hints remain, animating, or won.
- Add consistent pressed/disabled/focus-visible styles to action buttons.

### Phase 4 — Accessibility and Input Consistency
- Add `aria-label` values for icon-only buttons and menu controls.
- Apply overlay semantics (`role="dialog"`, `aria-modal="true"`).
- Implement focus handoff on open and focus return on close.
- Ensure keyboard parity:
  - Escape closes overlays.
  - Enter/Space activates focused controls.
- Validate practical contrast and focus indicator visibility.

### Phase 5 — Visual Polish and Micro-Feedback
- Add lightweight transitions for menu open/close and tile hover/active states.
- Add subtle hint-highlight pulse and low-amplitude blocked-action feedback.
- Ensure polish effects remain non-blocking and performant.

### Phase 6 — Verification and Regression Pass
- Run manual interaction scenarios for overlays, pages, level selection, and action states.
- Validate hint lifecycle across idle/animating/won states.
- Confirm persistence behaviors remain intact after reload.
- Check responsive behavior for menu panel and action bar on desktop/mobile viewports.
- Run keyboard-only traversal and accessibility semantics checks.
- Run solvability validation script to prevent gameplay regressions.

## 6) Risks and Mitigations
- Risk: Hint flow fixes alter solver behavior unexpectedly.  
  Mitigation: Enforce explicit return contract and test across multiple levels.
- Risk: Overlay close handlers conflict and close unintentionally.  
  Mitigation: Gate backdrop detection and stop propagation inside panel.
- Risk: Disabled-state logic drifts from runtime conditions.  
  Mitigation: Centralize state-sync in HUD/button update routine.
- Risk: Accessibility updates break focus flow.  
  Mitigation: Implement deterministic focus capture/restore and keyboard smoke tests.
- Risk: Added transitions hurt perceived responsiveness.  
  Mitigation: Keep transitions short, non-blocking, and easy to disable/tune.

## 7) Acceptance Criteria
- Hint action is reliable and always provides visible guidance when available.
- Menu and win overlays close correctly via close button, backdrop, and Escape.
- Level-card states (locked/current/unlocked) are immediately understandable.
- Undo/Restart/Hint actions clearly communicate availability via disabled states.
- Classic mode status remains readable at target viewport sizes.
- Keyboard operation and assistive semantics are present and functional for overlays/controls.
- No regressions to persistence or baseline puzzle solvability.

## 8) Source of Truth
- This specification is derived from the approved plan in:
  - `/Users/riad/Downloads/water-puzzle-star/.trae/documents/2026-03-06-ui-ux-menu-classic-improvement-plan.md`
