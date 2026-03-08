# Replace Pour Animation with Elegant Feedback Spec

## Why
The current bottle lift-and-pour animation feels visually busy and can reduce clarity during fast play. Replacing it with cleaner feedback can improve readability, responsiveness, and overall UX/UI quality.

## What Changes
- Remove bottle lift-and-pour motion from classic gameplay interactions.
- Replace it with a beautiful low-latency feedback set:
  - instant amount transfer in bottle levels;
  - short pulse/glow on source and destination bottles;
  - subtle transfer streak or ripple effect between bottles;
  - brief satisfying sound/haptic cue (when enabled).
- Improve gameplay UI hierarchy so move result is clearer than decorative effects.
- Tune timing/easing of new effects for quick readability on mobile and desktop.
- No breaking gameplay-rule changes.

## Impact
- Affected specs: core move feedback, classic mode visual language, interaction clarity.
- Affected code: `main.js` (pour state machine, frame updates, drawing/effects), `index.html` (UI style refinements).

## ADDED Requirements
### Requirement: Instant Transfer Interaction
The system SHALL complete bottle volume transfer without lift-and-pour positional animation.

#### Scenario: Valid transfer
- **WHEN** the player performs a valid pour action
- **THEN** source and destination volumes update immediately
- **AND** move count/history update correctly
- **AND** no bottle lift or tilt travel animation is shown.

### Requirement: Elegant Replacement Feedback
The system SHALL provide a short visual feedback sequence that communicates transfer direction and completion.

#### Scenario: Feedback sequence on valid transfer
- **WHEN** a valid transfer occurs
- **THEN** source bottle receives a short source-state highlight
- **AND** destination bottle receives a short destination-state highlight
- **AND** a subtle connecting transfer cue appears and fades quickly.

### Requirement: Invalid Action Clarity
The system SHALL preserve clear blocked-action feedback for invalid moves.

#### Scenario: Invalid transfer attempt
- **WHEN** the player attempts an invalid pour
- **THEN** invalid feedback appears without initiating transfer
- **AND** no replacement transfer cue is shown.

### Requirement: Performance and Readability
The system SHALL keep feedback lightweight and readable across viewport sizes.

#### Scenario: Compact/mobile viewport
- **WHEN** the game runs on narrow screens
- **THEN** feedback effects remain visible but non-overlapping with HUD and controls
- **AND** frame pacing remains responsive.

## MODIFIED Requirements
### Requirement: Classic Move Animation Behavior
Classic mode SHALL use immediate state transition with micro-feedback instead of bottle lift-and-pour animation.

### Requirement: UX/UI Priority in Classic Mode
Classic mode SHALL prioritize result readability (what changed) over prolonged decorative animation.

## REMOVED Requirements
### Requirement: Lift-and-Pour Bottle Motion
**Reason**: The current lift/tilt/travel sequence contributes to visual clutter and delays move comprehension.
**Migration**: Replace with pulse/glow + transfer cue micro-feedback while keeping existing move logic and outcomes unchanged.
