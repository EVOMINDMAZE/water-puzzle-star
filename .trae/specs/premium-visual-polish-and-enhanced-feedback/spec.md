# Premium Visual Polish and Enhanced Feedback Spec

## Why
The game has a solid foundation but lacks premium visual polish, smooth transitions, and nuanced feedback systems that elevate it from functional to exceptional. Adding these enhancements will improve user engagement, perceived quality, and overall UX/UI sophistication without changing core gameplay mechanics.

## What Changes
- Implement enhanced glassmorphism with multi-layer backdrop blur and subtle gradients
- Add smooth transitions for overlays, buttons, and HUD elements
- Implement nuanced haptic patterns for different actions (tap, pour, error, win)
- Enhance audio with layered sound effects and spatial panning
- Add subtle animations for bottle selection, hint highlights, and transfer cues
- Improve win celebration with enhanced particle effects and star reveal animations
- Add smooth level transition with cross-fade effect
- Implement responsive animations that respect `prefers-reduced-motion`

## Impact
- Affected specs: existing UI/UX specs, animation systems, audio/haptic feedback
- Affected code: `index.html` (CSS transitions, keyframes, enhanced styles), `main.js` (animation timing, state transitions, particle enhancements)

## ADDED Requirements

### Requirement: Enhanced Glassmorphism Visual Layering
The system SHALL implement multi-layer backdrop blur and subtle gradient overlays for UI elements to create depth and premium feel.

#### Scenario: Overlay rendering
- **WHEN** level menu or win overlay opens
- **THEN** backdrop uses multi-layer blur (12px + 8px)
- **AND** UI cards have subtle gradient overlays
- **AND** borders use semi-transparent white with 8-16% opacity

#### Scenario: Button visual depth
- **WHEN** button is rendered
- **THEN** background uses glass effect with 5% base opacity
- **AND** hover state adds 10% opacity with subtle lift
- **AND** active state scales down 4% with increased opacity

### Requirement: Smooth Transitions System
The system SHALL implement smooth transitions for all interactive elements with consistent timing functions.

#### Scenario: Overlay open/close
- **WHEN** level menu or win overlay state changes
- **THEN** opacity transitions over 0.3s with ease-out
- **AND** content slides up over 0.25s with cubic-bezier(0.4, 0.0, 0.2, 1)
- **AND** no jarring or abrupt state changes

#### Scenario: HUD value updates
- **WHEN** move count, stars, or other HUD values change
- **THEN** values animate with smooth counter transition
- **AND** text shadow updates without flicker
- **AND** transition duration ≤ 200ms

### Requirement: Nuanced Haptic Feedback
The system SHALL provide different vibration patterns for different user actions.

#### Scenario: Bottle selection
- **WHEN** player taps a bottle to select
- **THEN** device vibrates with 10ms light tap
- **AND** pattern is [10] (single short pulse)

#### Scenario: Valid pour
- **WHEN** player performs valid pour
- **THEN** device vibrates with 20ms medium pulse
- **AND** pattern is [20] (single medium pulse)

#### Scenario: Invalid move
- **WHEN** player attempts invalid move
- **THEN** device vibrates with double tap pattern
- **AND** pattern is [15, 30, 15] (two quick pulses)

#### Scenario: Level win
- **WHEN** player completes level
- **THEN** device vibrates with extended pattern
- **AND** pattern is [50, 30, 50, 30, 50] (rhythmic sequence)

### Requirement: Enhanced Audio Effects
The system SHALL implement layered sound effects with appropriate envelopes for different actions.

#### Scenario: Tap sound
- **WHEN** player taps interactive element
- **THEN** sound is short (≤ 100ms) and crisp
- **AND** frequency rises from 440Hz to 880Hz
- **AND** gain envelope is 0.1 → 0 over 0.1s

#### Scenario: Pour sound
- **WHEN** player performs pour
- **THEN** sound is smooth glide over 400ms
- **AND** frequency falls from 150Hz to 100Hz
- **AND** gain envelope is 0.05 → 0 over 0.4s

#### Scenario: Win sound
- **WHEN** level is completed
- **THEN** sound is ascending arpeggio (C-E-G-C)
- **AND** each note has 400ms decay
- **AND** overall duration is ~1.6s

### Requirement: Enhanced Win Celebration
The system SHALL implement enhanced particle effects and animations for level completion.

#### Scenario: Star reveal animation
- **WHEN** win screen opens
- **THEN** stars appear in sequence with 350ms intervals
- **AND** each star scales from 2.0 to 1.0 with bounce
- **AND** stars rotate from -90° to 0° with elastic easing

#### Scenario: Perfect clear celebration
- **WHEN** player achieves 3 stars (par or better)
- **THEN** confetti explosion spawns 100 particles
- **AND** particles have varied colors and velocities
- **AND** vibration pattern repeats 3 times

### Requirement: Responsive Animation Support
The system SHALL respect user's motion preferences and provide reduced motion alternatives.

#### Scenario: Reduced motion preference detected
- **WHEN** `prefers-reduced-motion` media query matches
- **THEN** all CSS transitions use 0.01ms duration
- **AND** all animation iteration counts are 1
- **AND** no continuous or repeating animations play

#### Scenario: Animation timing override
- **WHEN** reduced motion is active
- **THEN** overlay transitions use 0.01ms instead of 0.3s
- **AND** star reveal uses instant appearance instead of animation
- **AND** button hover effects remain (no motion)

## MODIFIED Requirements

### Requirement: Bottle Selection Feedback
**Current**: Bottle selection shows immediate visual highlight.

**Modified**: Bottle selection SHALL show smooth scale-up animation (1.0 → 1.05) over 150ms with elastic easing, and highlight pulse frequency increases to 180ms interval.

**Reason**: Smooth transitions provide premium feel and clearer feedback state.

### Requirement: Hint Highlight Behavior
**Current**: Hint highlights use static glow with 1.25s pulse.

**Modified**: Hint highlights SHALL use dynamic pulse that intensifies over 2.8s lifetime, with source bottles glowing amber (255, 190, 60) and destinations glowing teal (0, 255, 170).

**Reason**: Dynamic intensity provides clearer indication of active guidance.

## REMOVED Requirements

### Requirement: Simple Haptic Pattern
**Reason**: Single vibration pattern for all actions lacks nuance and doesn't provide tactile differentiation.

**Migration**: Replace with multi-pattern haptic system that matches action types with appropriate vibration profiles.

### Requirement: Static Win Celebration
**Reason**: Static star display lacks excitement and doesn't reward player achievement appropriately.

**Migration**: Replace with animated star reveal sequence and enhanced particle effects for perfect clears.

## Technical Implementation Details

### Animation Timing Constants
```javascript
const ANIMATION = Object.freeze({
  overlayOpen: 300,           // ms
  overlayContentSlide: 250,   // ms
  buttonScale: 150,           // ms
  bottleSelect: 200,          // ms
  hintPulse: 180,             // ms
  starReveal: 350,            // ms
  confettiLife: 1500,         // ms
  transferFeedback: 220       // ms
});
```

### Easing Functions (CSS)
```css
--ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-elastic: cubic-bezier(0.68, 0.0, 0.265, 1.55);
```

### Haptic Pattern Definitions
```javascript
const HAPTIC = Object.freeze({
  TAP: [10],
  POUR: [20],
  ERROR: [15, 30, 15],
  WIN: [50, 30, 50, 30, 50],
  PERFECT: [50, 30, 50, 30, 50, 50, 30, 50, 30, 50]
});
```

### Performance Targets
- 60 FPS maintained during animations
- < 5ms JavaScript execution per frame for animations
- < 10ms layout calculation per frame
- < 20ms rendering time per frame
- Total frame time < 16ms

## Success Criteria

### Visual Quality
- [ ] All transitions feel smooth and intentional
- [ ] Glassmorphism effects are subtle but noticeable
- [ ] Animations have clear start/end states
- [ ] No jarring or unexpected movements

### Performance
- [ ] 60 FPS maintained on target mobile devices
- [ ] < 500ms page load time
- [ ] < 100ms interaction response time
- [ ] < 200ms level transition time

### User Experience
- [ ] Haptic feedback feels responsive and appropriate
- [ ] Audio sounds clear and well-mixed
- [ ] Win celebration feels rewarding and celebratory
- [ ] Animations enhance rather than distract

### Accessibility
- [ ] Reduced motion preference is respected
- [ ] All information remains accessible during animations
- [ ] No flashing animations that could cause seizures