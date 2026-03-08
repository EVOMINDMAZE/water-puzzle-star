# Water Puzzle Star Familiarization Plan

**Goal:** Build complete working knowledge of the game architecture, runtime flow, puzzle logic, and content pipeline, then produce a concise technical brief for future feature/debug work.

**Scope Assumption:** This pass is read-only and focuses on understanding, mapping, and verification through existing code and scripts.

## Step 1: Inventory the Project Surface
- Confirm all top-level game files and supporting scripts.
- Classify files by role: runtime, data, tooling, docs, assets.
- Output: a one-page file map with responsibilities.

## Step 2: Understand Boot and App Lifecycle
- Trace startup path from HTML loading order to first rendered frame.
- Follow initialization sequence in `main.js`:
  - canvas setup
  - level initialization
  - event listener registration
  - animation loop start
- Output: lifecycle timeline from page load to interactive play.

## Step 3: Map Core Gameplay State Model
- Document canonical in-memory state:
  - bottles, capacities, colors, selected bottle
  - moves/history/undo
  - animation and transient effect state
  - level index and progression state
- Identify which functions mutate each state region.
- Output: state map + mutator function index.

## Step 4: Trace Player Interaction and Move Resolution
- Follow click/touch input handling to hit-testing and bottle selection.
- Trace pour validation rules and legal-move constraints.
- Document update order after a move:
  - state mutation
  - history/move count updates
  - animation trigger
  - UI refresh
- Output: move-resolution sequence diagram in text form.

## Step 5: Analyze Frame Loop and Rendering Pipeline
- Walk `frame()` responsibilities and ordering:
  - animation interpolation
  - particle/stream effects
  - win-condition checks
  - final draw pass
- Identify performance-sensitive areas and frequent allocations.
- Output: render loop checklist and hotspots list.

## Step 6: Understand Solver and Hint System
- Read BFS solver implementation and serialization strategy.
- Verify how hint action selects and executes suggested move.
- Note computational limits, failure cases, and UX fallbacks.
- Output: solver behavior summary with constraints.

## Step 7: Review Level Data and Content Pipeline
- Inspect `levels.js` schema and invariants (`capacities`, `initial`, `target`, `par`).
- Read generation script to understand acceptance filters and solvability checks.
- Read validation script to understand what it verifies and what it does not.
- Output: level pipeline summary and trust boundaries.

## Step 8: Audit UI Flow and Progression UX
- Trace level menu, pagination, unlock logic, star scoring, and win overlay.
- Document persistence strategy and storage keys.
- Confirm restart/undo/hint/menu controls and side effects.
- Output: UI flow map and progression rules.

## Step 9: Verify Operational Runbook
- Define exact commands and contexts to:
  - run the game locally
  - regenerate levels
  - validate sample levels
- Record expected outputs and common failure points.
- Output: minimal developer runbook for onboarding.

## Step 10: Produce Final Familiarization Brief
- Consolidate architecture overview, gameplay loop, data flow, and risks.
- Add a “where to edit” guide for common tasks:
  - gameplay rules
  - visuals/effects
  - level generation
  - progression tuning
- Output: actionable brief for fast future iteration.

## Deliverables
- Project file-role map.
- Runtime lifecycle timeline.
- Game state and mutator index.
- Input-to-pour and frame-loop flow notes.
- Solver and level-pipeline summaries.
- UI/progression behavior notes.
- Local run/validation runbook.
- Final familiarization brief.

## Definition of Done
- Every major gameplay subsystem has an owner file and function map.
- End-to-end flow from input to win progression is documented.
- Level generation/validation boundaries are clear.
- A new contributor can locate change points without re-reading the entire codebase.
