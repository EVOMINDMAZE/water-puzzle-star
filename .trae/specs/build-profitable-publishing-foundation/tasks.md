# Tasks
- [x] Task 1: Add monetization service layer and UI entry points.
  - [x] SubTask 1.1: Create rewarded ad service abstraction with success, cancel, and fail outcomes.
  - [x] SubTask 1.2: Add utility offers in HUD/dialog flows for hints, retry assist, and bonus rewards.
  - [x] SubTask 1.3: Add entitlement check path for ad-free mode.

- [x] Task 2: Add purchase flow and persistent economy updates.
  - [x] SubTask 2.1: Implement product catalog for ad-free and hint bundles.
  - [x] SubTask 2.2: Implement purchase result handling with idempotent reward grants.
  - [x] SubTask 2.3: Persist and restore balances and entitlements across sessions.

- [x] Task 3: Expand retention loops and event-driven rewards.
  - [x] SubTask 3.1: Add configurable streak milestones and reward claims.
  - [x] SubTask 3.2: Add limited-time event model with active/inactive windows.
  - [x] SubTask 3.3: Integrate event rewards into existing progression and feedback systems.

- [x] Task 4: Instrument analytics and monetization funnels.
  - [x] SubTask 4.1: Define unified event schema for session, progression, ad, and purchase events.
  - [x] SubTask 4.2: Emit events at key interaction points and validate payload consistency.
  - [x] SubTask 4.3: Add lightweight diagnostics for invalid config and monetization failures.

- [x] Task 5: Prepare release readiness artifacts and verification flow.
  - [x] SubTask 5.1: Add release checklist content for store metadata, privacy, and rating inputs.
  - [x] SubTask 5.2: Validate monetization and retention UX flows via automated and manual checks.
  - [x] SubTask 5.3: Confirm no forced-ad-only progression gates remain.

# Task Dependencies
- Task 2 depends on Task 1.
- Task 3 depends on Task 1.
- Task 4 depends on Task 1.
- Task 5 depends on Tasks 2, 3, and 4.
