# Gamification Enhancement Plan

## Goal
Make Water Puzzle Star feel more rewarding, sticky, and progression-driven by adding layered gamification loops on top of existing levels, stars, achievements, daily challenges, and monetization foundations.

## Current Baseline (from codebase)
- Strong base loops already exist: stars/par scoring, level unlocks, achievements, daily streaks, rewarded utility, analytics events.
- Biggest opportunities:
  - Stars are mostly a source, not a spendable currency sink.
  - Social competition systems are mostly placeholders.
  - No multi-step mission/quest loop across sessions.
  - Reward grants are inconsistent across systems.
  - Daily constraints and challenge fail states are only partially enforced.

## Scope
Implement a cohesive gamification layer in 6 increments, each independently shippable behind feature flags.

## Increment 1 — Economy Consistency + Gamification Event Backbone
### Changes
1. Introduce a centralized reward grant API and route all reward writes through it.
   - Update: `monetization.js`, `achievements.js`, `daily.js`, `main.js`
2. Add a unified gamification event map for mission, combo, streak, shop spend, and league points.
   - Update: `analytics.js`, `main.js`, `daily.js`, `achievements.js`
3. Add feature flags for each new system to allow staged rollout.
   - Update: `launch.js`, `liveops-config.js`

### Acceptance Criteria
- No direct localStorage reward mutations remain outside the centralized grant API.
- All new loops emit measurable analytics events.
- Each subsystem can be toggled independently without breakage.

## Increment 2 — Missions System (Short-Term Goals)
### Changes
1. Add `missions.js` for rotating missions:
   - Daily missions (3 slots): complete level, beat par, no hint, use hard mode.
   - Weekly missions (3 slots): streak targets, star totals, challenge completions.
2. Integrate mission progress updates through existing window event flow.
   - Update: `main.js`, `daily.js`, `difficulty.js`, `achievements.js`
3. Add compact mission entry point + panel in top utility tray/HUD architecture.
   - Update: `index.html`, `styles in index.html`, `main.js` overlay wiring.

### Acceptance Criteria
- Mission progress updates automatically during normal play.
- Claiming mission rewards uses centralized reward API.
- Mission UI is singleton-safe and compatible with current overlay handling.

## Increment 3 — Star Sink + Reward Shop
### Changes
1. Add `rewards-shop.js` with spendable star items:
   - Hint packs, one-time level skip token, cosmetic badge unlocks.
2. Add price tables and anti-overflow guardrails.
   - Update: `liveops-config.js`
3. Add transaction analytics and fail-safe rollback.
   - Update: `analytics.js`, `monetization.js`
4. Add shop access from existing menu surfaces.
   - Update: `index.html`, `main.js`

### Acceptance Criteria
- Stars can be spent on at least 3 meaningful item types.
- Spending flow prevents negative balances and double-claim races.
- Purchase/deny/cancel outcomes are all tracked.

## Increment 4 — Mastery and Rank Loop
### Changes
1. Add `mastery.js` to compute player XP from performance quality:
   - XP sources: stars earned, par efficiency, streak consistency, challenge completions.
2. Add rank tiers (Bronze → Diamond) with visible progress bar and tier-up moments.
3. Add mastery rewards at milestone ranks (cosmetic tags, bonus hints, boosters).
4. Integrate tier context into existing completion and profile surfaces.
   - Update: `main.js`, `progress.js`, `social.js` (local profile presentation)

### Acceptance Criteria
- XP and rank progression persist and recover correctly after reload.
- Tier-up event triggers feedback, analytics, and optional reward grant.
- Rank progression does not block core level flow.

## Increment 5 — Competitive Layer (Async Leagues)
### Changes
1. Expand `social.js` into local-first weekly league groups (no backend required initially):
   - Division buckets by recent activity.
   - Weekly point scoring from level quality and consistency.
2. Add leaderboard panel with reset timer and promotion/relegation feedback.
3. Add anti-exploit checks for impossible score deltas and duplicate submissions.
4. Tie weekly league results to rewards and mission hooks.

### Acceptance Criteria
- Weekly league cycle resets predictably and assigns rewards once.
- Leaderboard can be viewed and understood in one glance.
- Exploit guardrails reject invalid point spikes.

## Increment 6 — Moment-to-Moment Juice (Combo and Clutch Bonuses)
### Changes
1. Add lightweight combo tracking for efficient play streaks:
   - Consecutive good-move windows, no-undo/no-hint bonuses.
2. Add clutch bonuses for near-par recoveries and perfect finishes.
3. Surface temporary multipliers in progress HUD without clutter.
   - Update: `progress.js`, `main.js`, `feedback.js` (or equivalent feedback module)
4. Emit combo/clutch analytics to measure engagement uplift.

### Acceptance Criteria
- Combo/clutch effects are clear, brief, and non-intrusive.
- UX remains readable on compact HUD layouts.
- Events are measurable and do not spam notifications.

## Implementation Order
1. Increment 1 (backbone)
2. Increment 2 (missions)
3. Increment 3 (shop/sinks)
4. Increment 4 (mastery)
5. Increment 5 (leagues)
6. Increment 6 (moment-to-moment juice)

## Verification Strategy
1. Unit/integration coverage for:
   - reward grants and spends
   - mission progression transitions
   - weekly reset and rank calculations
2. Playwright/UI checks for:
   - overlay singleton behavior
   - HUD readability in compact modes
   - successful claim/purchase flows
3. Telemetry validation:
   - every new loop emits expected analytics payloads
4. Regression checks:
   - existing level flow, daily challenge flow, achievements, and monetization remain functional.

## Success Metrics
- D1/D7 retention uplift.
- Session count per day uplift.
- More levels completed per session.
- Higher daily challenge participation.
- Positive star spend velocity without economy inflation.
