# Water Puzzle Star Familiarization Tasks

## Task 1: Build Repository Surface Map
- Enumerate runtime, data, tooling, docs, and assets.
- Assign each file a primary responsibility.
- Output: repository surface map artifact.

## Task 2: Document Boot and Lifecycle
- Trace script load order and startup sequence.
- Map initialization steps through first render frame.
- Output: lifecycle timeline artifact.

## Task 3: Build Gameplay State Inventory
- List canonical state groups and ownership.
- Link each mutable state group to mutating functions.
- Output: state model + mutator index artifact.

## Task 4: Trace Interaction-to-Move Pipeline
- Follow pointer input path to hit-testing and selection.
- Document move validation constraints and pour resolution.
- Output: input-to-pour sequence artifact.

## Task 5: Map Frame Loop and Rendering
- Document `frame()` execution order and responsibilities.
- Identify high-frequency logic and potential hotspot zones.
- Output: frame-loop and rendering flow artifact.

## Task 6: Analyze Solver and Hint Path
- Document BFS state encoding and search behavior.
- Trace hint trigger behavior and invalid/failure outcomes.
- Output: solver/hint behavior artifact.

## Task 7: Document Level Content Pipeline
- Describe `levels.js` schema and field semantics.
- Analyze generation filters and validation coverage boundaries.
- Output: level pipeline artifact.

## Task 8: Document UI and Progression Rules
- Trace level menu, star scoring, unlock logic, and win overlay.
- Map persistence strategy and user-action side effects.
- Output: UI/progression rules artifact.

## Task 9: Produce Local Operations Runbook
- Define local execution and script usage workflow.
- Record expected outcomes and likely failure points.
- Output: onboarding runbook artifact.

## Task 10: Compile Final Familiarization Brief
- Merge all artifacts into a single practical reference.
- Add “where to edit” guidance by subsystem category.
- Output: final familiarization brief.

## Dependency Order
- Run tasks in strict order from Task 1 to Task 10.
- Allow consolidation edits after Task 10 only for consistency.
