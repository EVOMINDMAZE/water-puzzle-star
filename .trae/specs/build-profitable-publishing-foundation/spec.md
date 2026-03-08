# Profitable Publishing Foundation Spec

## Why
The game needs a practical path from playable prototype to sustainable revenue product. We need a clear implementation scope for retention, monetization, analytics, and release readiness.

## What Changes
- Add a monetization foundation with rewarded ads, optional ad-free purchase, and consumable hint packs.
- Add economy and retention loops for daily engagement and long-term progression.
- Add analytics instrumentation for retention and monetization funnels.
- Add live events configuration to support recurring challenges without code changes.
- Add release-readiness requirements for store publishing assets and compliance.
- **BREAKING** Replace any forced-ad-only logic with user-value-first rewarded placement rules.

## Impact
- Affected specs: HUD utility interactions, progression, daily systems, achievements, difficulty, feedback messaging, release pipeline.
- Affected code: `main.js`, `index.html`, `daily.js`, `achievements.js`, `progress.js`, `feedback.js`, `dialogs.js`, plus new monetization and analytics modules.

## ADDED Requirements
### Requirement: Rewarded Ad Utility Flow
The system SHALL provide rewarded ads for optional utility actions (hint refill, retry assist, and bonus reward) without blocking core gameplay.

#### Scenario: Rewarded hint refill success
- **WHEN** a player selects “Watch ad for hints”
- **THEN** the ad flow completes and hints are granted immediately
- **AND** an analytics event records offer shown, started, completed, and reward granted

#### Scenario: Rewarded flow canceled
- **WHEN** a player closes or fails the ad
- **THEN** no reward is granted
- **AND** gameplay state remains unchanged

### Requirement: Purchase Options
The system SHALL offer optional purchases for ad removal and consumable hint bundles.

#### Scenario: Ad-free entitlement active
- **WHEN** a player purchases ad removal
- **THEN** forced/interstitial placements are disabled
- **AND** rewarded ads remain available as optional

#### Scenario: Hint bundle purchased
- **WHEN** a player completes a hint bundle purchase
- **THEN** hint balance is incremented exactly once
- **AND** the balance persists across sessions

### Requirement: Retention Economy Loop
The system SHALL provide a repeatable loop using daily streaks, limited-time goals, and claimable rewards.

#### Scenario: Daily streak progression
- **WHEN** a player completes a daily challenge on consecutive days
- **THEN** streak value increases and milestone rewards unlock at configured thresholds

#### Scenario: Missed day handling
- **WHEN** a player misses a day
- **THEN** streak reset behavior follows configured rules and is clearly communicated

### Requirement: Analytics and Funnel Tracking
The system SHALL emit analytics events for onboarding, level progression, ad interactions, purchases, and retention milestones.

#### Scenario: Session and progression tracking
- **WHEN** a gameplay session starts, levels are attempted/completed, and rewards are claimed
- **THEN** structured events are emitted with consistent schema and timestamps

#### Scenario: Monetization funnel visibility
- **WHEN** ad and purchase offers are shown or acted on
- **THEN** conversion funnel events are emitted for offer, click, complete, and failure states

### Requirement: Live Events Configuration
The system SHALL load event definitions from a configuration source so challenge schedules and rewards can be updated without gameplay code edits.

#### Scenario: Event activation by date window
- **WHEN** the current date falls inside an event window
- **THEN** event UI and rewards activate automatically

#### Scenario: Event fallback
- **WHEN** configuration is missing or invalid
- **THEN** the game continues with safe defaults and records a non-fatal diagnostics event

### Requirement: Store Release Readiness
The system SHALL provide release artifacts and compliance checklist inputs for Android and iOS publishing.

#### Scenario: Release package readiness
- **WHEN** release validation runs
- **THEN** required app metadata, content rating inputs, privacy disclosures, and store visuals are present

## MODIFIED Requirements
### Requirement: Utility Controls and Assistance
The utility layer SHALL prioritize player-choice assistance; optional rewarded actions are available, while core puzzle completion remains possible without payment.

## REMOVED Requirements
### Requirement: Forced-Ad-Only Progression Gates
**Reason**: Forced gating harms retention and reduces long-term monetization.
**Migration**: Replace hard gates with optional rewarded value exchanges and balanced free progression pacing.
