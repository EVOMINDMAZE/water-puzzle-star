# Menu + Classic UX/UI Implementation Checklist

## How to Use
- Use this checklist as the execution gate for implementation work defined in:
  - `/Users/riad/Downloads/water-puzzle-star/.trae/documents/ui-ux-menu-classic-spec/spec.md`
  - `/Users/riad/Downloads/water-puzzle-star/.trae/documents/ui-ux-menu-classic-spec/tasks.md`
- Complete phases in strict order (Phase 1 → Phase 6).
- Do not start a phase until the previous phase gate is fully checked.
- If any regression appears in a phase, resolve it before proceeding.

## Traceability Map (Spec ↔ Tasks ↔ Checklist)
- [ ] Phase 1 checklist items map to **spec: Phase 1 — Stabilize Hint Flow** and **tasks: Phase 1**.
- [ ] Phase 2 checklist items map to **spec: Phase 2 — Improve Menu Overlay UX** and **tasks: Phase 2**.
- [ ] Phase 3 checklist items map to **spec: Phase 3 — Upgrade Classic HUD and Controls** and **tasks: Phase 3**.
- [ ] Phase 4 checklist items map to **spec: Phase 4 — Accessibility and Input Consistency** and **tasks: Phase 4**.
- [ ] Phase 5 checklist items map to **spec: Phase 5 — Visual Polish and Micro-Feedback** and **tasks: Phase 5**.
- [ ] Phase 6 checklist items map to **spec: Phase 6 — Verification and Regression Pass** and **tasks: Phase 6**.

## Phase 1 Gate — Stabilize Hint Flow (Blocker)
### Implementation
- [ ] `GameSolver.solve(...)` signature and all call sites use one consistent contract.
- [ ] Solver internals do not reference undefined variables/state.
- [ ] Solver return shape is enforced as `null` or `{ from, to }`.
- [ ] All hint consumers guard against `null` and invalid payloads.
- [ ] Visible hint guidance (source + destination) renders in classic mode.
- [ ] Hint guidance clears on move, undo, restart, level change, and timeout expiration.

### Verification
- [ ] Hint produces deterministic visible guidance on multiple solvable levels.
- [ ] Hint invocation in invalid states (won/animating) is safe and non-disruptive.
- [ ] Hint count persistence remains correct after reload (`water_puzzle_hints`).

### Phase Gate Decision
- [ ] **Phase 1 Gate Passed** (all implementation + verification items complete).

## Phase 2 Gate — Improve Menu Overlay UX
### Implementation
- [ ] Backdrop click closes level menu overlay.
- [ ] Inner panel interactions do not close the overlay.
- [ ] Escape closes level menu and win overlay.
- [ ] Close-button behavior remains deterministic.
- [ ] Locked level tiles have improved readability/contrast.
- [ ] Current level marker uses explicit label (no ambiguous marker).
- [ ] Pagination disabled state is both visual and semantic (`disabled`, optional `aria-disabled`).

### Verification
- [ ] Open/close works via menu button, close button, backdrop click, and Escape.
- [ ] Clicks inside header/content/footer/grid do not trigger overlay close.
- [ ] First/last page nav controls correctly reflect disabled state in UI + attributes.
- [ ] Locked/current/passed/unlocked visual states are distinguishable at a glance.

### Phase Gate Decision
- [ ] **Phase 2 Gate Passed**.

## Phase 3 Gate — Upgrade Classic HUD and Controls
### Implementation
- [ ] DOM HUD is the primary readability layer for world/level.
- [ ] DOM HUD shows moves vs par.
- [ ] DOM HUD shows hints remaining.
- [ ] DOM HUD shows stars total and target.
- [ ] Disabled-state logic is centralized and runtime-driven.
- [ ] Undo disabled when history empty, animating, or won.
- [ ] Restart disabled during animation when applicable.
- [ ] Hint disabled when no hints remain, animating, or won.
- [ ] Buttons have consistent pressed, disabled, and focus-visible states.

### Verification
- [ ] Button disabled states update correctly across idle/animating/won states.
- [ ] Undo/restart/hint flows keep HUD values synchronized with runtime state.
- [ ] HUD remains readable at target mobile and desktop widths.

### Phase Gate Decision
- [ ] **Phase 3 Gate Passed**.

## Phase 4 Gate — Accessibility and Input Consistency
### Implementation
- [ ] Icon-only controls include meaningful `aria-label` values.
- [ ] Overlays include dialog semantics (`role="dialog"`, `aria-modal="true"`).
- [ ] Focus is handed off deterministically when overlays open.
- [ ] Focus returns to the invoking control when overlays close.
- [ ] Keyboard parity is implemented for overlay close and control activation.
- [ ] Focus-visible indicators are visually obvious across controls.

### Accessibility Checks
- [ ] Keyboard-only traversal reaches all actionable controls in logical order.
- [ ] Escape closes the correct topmost overlay.
- [ ] Enter activates focused controls.
- [ ] Space activates focused controls.
- [ ] Overlay semantics are announced correctly by assistive technologies.
- [ ] Contrast is practical for controls, labels, and state indicators.

### Phase Gate Decision
- [ ] **Phase 4 Gate Passed**.

## Phase 5 Gate — Visual Polish and Micro-Feedback
### Implementation
- [ ] Menu open/close transitions are short and non-blocking.
- [ ] Level tile hover/active/focus-visible motion is subtle and consistent.
- [ ] Active hint guidance includes subtle pulse feedback.
- [ ] Blocked-action feedback is low-amplitude and non-interruptive.
- [ ] Motion effects are easy to tune/disable.

### Verification
- [ ] Interactions remain responsive during animations on low-end/mobile profile.
- [ ] Visual polish does not block input handling or state progression.
- [ ] Hint pulse stops as soon as hint lifecycle ends.

### Phase Gate Decision
- [ ] **Phase 5 Gate Passed**.

## Phase 6 Gate — Verification and Regression
### Regression Checks
- [ ] Manual interaction matrix passes for: menu open/close, paging, selection states, action buttons, and win flow.
- [ ] Persistence regression passes for level index, stars, hints, and unlock state after reload.
- [ ] Responsive regression passes for menu panel and bottom action/HUD area.
- [ ] Accessibility regression passes for labels, dialog semantics, focus flow, and keyboard operation.
- [ ] Hint lifecycle regression passes across idle, animating, and won states.
- [ ] Disabled-state regression passes for Undo/Restart/Hint under all runtime conditions.
- [ ] Solvability regression script passes:
  - `node /Users/riad/Downloads/water-puzzle-star/validate_levels.js`
- [ ] Optional docs updated only if public behavior/contract changed.

### Phase Gate Decision
- [ ] **Phase 6 Gate Passed**.

## Final Acceptance Checklist (from Spec Acceptance Criteria)
- [ ] Hint action is reliable and always shows visible guidance when available.
- [ ] Menu and win overlays close correctly via close button, backdrop, and Escape.
- [ ] Locked/current/unlocked level-card states are immediately understandable.
- [ ] Undo/Restart/Hint availability is clearly communicated through disabled states.
- [ ] Classic mode status is readable at target viewport sizes.
- [ ] Keyboard operation and assistive semantics are functional for overlays and controls.
- [ ] Persistence behavior remains intact after reload.
- [ ] Baseline puzzle solvability remains valid.
- [ ] **Implementation accepted for Menu + Classic UX/UI scope.**
