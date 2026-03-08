# Water Puzzle: Fun & Addictive Gameplay Plan

## Goal
Increase retention, session depth, and replay motivation without hurting the current casual experience.

## Product Outcomes
- Raise D1 replay intent through stronger short-term goals and reward feedback.
- Increase average moves-per-session by creating meaningful “one more level” motivation.
- Improve completion momentum with better near-win guidance and reduced dead-end frustration.

## Current-State Findings (Code-Backed)
- Core win loop works, but pressure/challenge variants are minimal and optional.
- Achievements and daily systems exist but appear only partially connected to runtime events.
- Difficulty and near-target feedback systems exist but are underused in the main gameplay loop.
- Hint economy is effectively infinite after depletion, reducing long-term mastery incentives.

## Implementation Strategy (Phased)

### Phase 1 — Fix Meta-Loop Wiring (Highest Impact, Lowest Risk)
1. Connect gameplay events to achievement tracking in `main.js`:
   - Dispatch `levelComplete`, `hintUsed`, and `undoUsed` from the actual gameplay handlers.
   - Ensure payload shape matches listeners in `achievements.js`.
2. Wire daily challenge completion:
   - Call daily completion flow at win-time when daily constraints are met.
   - Verify streak and reward updates appear in UI and persisted state.
3. Add event-safe guards:
   - Prevent duplicate reward dispatches on repeated modal interactions.
   - Keep save/load backward compatible for existing player data.

### Phase 2 — Add “Tension Without Frustration”
1. Introduce optional challenge modifiers:
   - Move limit mode and/or soft timer mode as opt-in challenge tracks.
   - Keep classic mode untouched as default.
2. Integrate difficulty profile into scoring/rewards:
   - Scale star thresholds and bonus rewards by selected challenge difficulty.
   - Add transparent UX copy so players understand reward multipliers.
3. Add graceful failure loops:
   - On challenge fail, offer quick retry, one strategic hint, and reduced-penalty continuation options.

### Phase 3 — Strengthen Reward Cadence
1. Rebalance hint/undo economy:
   - Replace fully unlimited hints with renewable sources (daily reward, streak milestone, ad/reward substitute if desired later).
   - Preserve “never hard-blocked” by keeping at least one fallback assistance path.
2. Add streak-based progression:
   - Daily streak milestones unlock cosmetic rewards/themes and small utility boosts.
3. Improve win-screen compulsion:
   - Add “next-level preview” and immediate progress-to-next-reward meter to promote continuation.

### Phase 4 — Boost Moment-to-Moment Delight
1. Activate near-target dopamine feedback:
   - Surface “almost there” prompts and subtle visual/audio reinforcement from `progress.js`.
2. Improve first-session flow:
   - Make tutorial trigger contextual (first mistake or idle delay) instead of immediate auto-start.
3. Improve invalid-move communication:
   - Keep current shake/haptic but add concise guidance copy tied to why the move failed.

## File-Level Execution Map
- `main.js`: event dispatch integration, challenge-mode branches, win/fail flow, hint economy hooks.
- `achievements.js`: verify listener compatibility, reward dedupe protection, notification cadence tuning.
- `daily.js`: completion trigger integration and streak/reward validation.
- `difficulty.js`: apply profile values to star logic, challenge constraints, reward multipliers.
- `progress.js`: near-target feedback activation and pacing.
- `tutorial.js`: contextual tutorial trigger strategy.
- `index.html` / relevant UI modules: challenge selectors, reward meter, fail-state options.

## Validation Plan
1. Functional validation:
   - Complete levels in classic and challenge modes; verify rewards, stars, unlocks, and streaks persist correctly.
   - Confirm achievements unlock exactly once per condition.
2. Regression validation:
   - Ensure default classic play remains unchanged in difficulty and accessibility.
   - Run existing UI/UX smoke scripts and resolve any menu/modal interaction regressions.
3. Telemetry/analytics checkpoints (lightweight, local-first if needed):
   - Track hint usage rate, retries per level, challenge mode adoption, and post-win next-level click-through.

## Rollout Plan
1. Ship Phase 1 first as a stability + retention foundation.
2. Gate Phase 2 challenge modes behind a simple feature flag for safe tuning.
3. Ship Phase 3 and Phase 4 polish after balancing with small playtest loops.
4. Tune parameters weekly using observed player behavior (especially hint depletion, fail frequency, and continuation rate).

## Success Criteria
- Higher next-level click-through after win screens.
- Increased daily return behavior through streak completion.
- Reduced abandonment after dead-end states.
- Stable or improved player sentiment on clarity and fairness.

## Assumptions
- Preserve casual accessibility as a non-negotiable baseline.
- No backend dependency is required for initial implementation; all systems remain client-side.
- Existing save schema can be extended with additive keys only.
