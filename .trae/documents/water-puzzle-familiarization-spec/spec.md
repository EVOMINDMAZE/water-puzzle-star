# Water Puzzle Star Familiarization Specification

## Objective
- Build end-to-end technical understanding of the game so future feature work and debugging can start with minimal rediscovery.
- Produce stable reference artifacts that explain architecture, gameplay execution, level content pipeline, and operational runbook.

## Project Context
- Runtime is a static web game with `index.html`, `main.js`, and `levels.js`.
- Tooling uses Node scripts for level generation and validation (`generate_levels.js`, `validate_levels.js`).
- No package manager scripts or formal automated test framework are currently present.

## In Scope
- Systematically review all gameplay-relevant files and classify responsibilities.
- Document lifecycle from page load to frame loop and win progression.
- Map state model and mutating functions for gameplay, UI, animation, and persistence.
- Trace full player interaction path from tap/click to validated pour and post-move updates.
- Analyze solver and hint behavior, including limits and fallback conditions.
- Review level schema and generation/validation trust boundaries.
- Document UI/progression behavior and local run/validation procedures.

## Out of Scope
- Any gameplay behavior changes, balancing changes, or UI redesign.
- Refactoring, performance optimization, or code cleanup.
- Adding new tests, new tools, or new build systems.

## Source Files to Analyze
- `index.html`
- `main.js`
- `levels.js`
- `generate_levels.js`
- `validate_levels.js`
- `DESIGN.md`
- `assets/*` (usage verification only)

## Required Deliverables
- File responsibility map.
- Startup and runtime lifecycle timeline.
- State model and mutator index.
- Input-to-pour sequence and frame-loop flow notes.
- Solver/hint behavior summary.
- Level data pipeline summary.
- UI/progression flow summary.
- Local runbook and common failure points.
- Final familiarization brief with “where to edit” guidance.

## Quality Requirements
- Every major subsystem must map to explicit owner file(s) and function(s).
- All findings must be traceable to observed code, not assumptions.
- Documentation must distinguish facts, inferred behavior, and unknowns.
- Final brief must be actionable for a new contributor.

## Execution Constraints
- Perform this work in read-only analysis mode.
- Keep terminology consistent across all artifacts.
- Avoid introducing speculative architecture not present in current code.

## Acceptance Criteria
- End-to-end flow from input handling to win overlay is documented.
- Persistence and progression rules are documented.
- Level generation and validation boundaries are documented.
- A contributor can identify edit locations for gameplay rules, effects, level generation, and progression tuning without scanning the whole repository.
