# HUD and Block Layout Stability Spec

## Why
The game UI currently shows overlapping information elements and bottle blocks stacking too close or above each other, reducing readability and playability. This change defines a stable layout contract so HUD and gameplay objects keep clear visual separation across viewport sizes.

## What Changes
- Define a non-overlap layout contract between top HUD, target line label, and bottle drawing area.
- Define minimum vertical and horizontal spacing rules for bottle columns to prevent block stacking collisions.
- Introduce responsive breakpoints for compact screens to reflow HUD rows before they overlap gameplay.
- Add deterministic clamping rules for bottle height and baseline to keep all bottle tops and labels inside safe bounds.
- Add validation steps for multiple device sizes and orientations.
- No breaking API changes.

## Impact
- Affected specs: gameplay HUD readability, bottle layout rendering, responsive UI behavior.
- Affected code: `index.html` (HUD structure/CSS), `main.js` (`getLayout()`, `drawHeader()`, `drawTargetLine()`, bottle positioning and sizing logic).

## ADDED Requirements
### Requirement: Non-Overlapping HUD Safe Area
The system SHALL reserve a top safe area for HUD elements so HUD cards never overlap each other or the gameplay drawing zone.

#### Scenario: HUD wraps on narrow viewport
- **WHEN** the viewport width is below the compact breakpoint
- **THEN** HUD cards wrap to additional rows with consistent gaps
- **AND** no HUD card intersects another HUD card.

#### Scenario: HUD and gameplay separation
- **WHEN** the frame is rendered
- **THEN** bottle tops and target-label text begin below the HUD safe area
- **AND** no gameplay text is drawn underneath HUD cards.

### Requirement: Bottle Layout Collision Prevention
The system SHALL enforce bottle spacing and height constraints to prevent visual overlap or stacked collisions between adjacent bottles.

#### Scenario: Dense level capacities
- **WHEN** bottle heights differ significantly due to capacities
- **THEN** horizontal spacing remains above minimum threshold
- **AND** bottle outlines and fills do not intersect neighboring bottles.

#### Scenario: Small screen height
- **WHEN** available vertical space is limited
- **THEN** bottle height is clamped and baseline shifts within bounds
- **AND** bottom controls remain unobstructed.

### Requirement: Target Line and Label Placement Safety
The system SHALL keep target line label outside HUD-safe rows and readable against bottle content.

#### Scenario: High target amount
- **WHEN** the computed target line is near the top section
- **THEN** label placement is clamped to a non-overlapping y-position
- **AND** label remains fully visible within canvas bounds.

## MODIFIED Requirements
### Requirement: Classic Mode Responsive Behavior
Classic mode SHALL prioritize readability by reflowing HUD rows and adjusting gameplay margins before shrinking text or forcing overlap.

### Requirement: Layout Computation
Layout computation SHALL include explicit safe-area offsets (top HUD, bottom banner, side padding) before calculating bottle width, spacing, and vertical scale.

## REMOVED Requirements
### Requirement: Implicit Header-to-Canvas Coupling
**Reason**: Implicit drawing offsets allow header and gameplay elements to drift into overlap under some resolutions.
**Migration**: Replace implicit offsets with explicit safe-area and clamp-based layout calculations in shared layout helpers.
