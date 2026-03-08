# Tasks

## Phase 1: Enhanced Glassmorphism and Visual Polish

- [ ] Task 1: Implement enhanced glassmorphism visual layering
  - [ ] SubTask 1.1: Add multi-layer backdrop blur to overlay styles (12px + 8px)
  - [ ] SubTask 1.2: Implement subtle gradient overlays on UI cards
  - [ ] SubTask 1.3: Update button styles with glass effect and hover states
  - [ ] SubTask 1.4: Add shimmer effect to active/hint states

- [ ] Task 2: Implement smooth transitions system
  - [ ] SubTask 2.1: Add CSS transitions for overlay open/close (0.3s ease-out)
  - [ ] SubTask 2.2: Implement content slide-up animation (0.25s cubic-bezier)
  - [ ] SubTask 2.3: Add smooth transitions for HUD value updates
  - [ ] SubTask 2.4: Implement button scale animation on press

## Phase 2: Enhanced Haptic Feedback

- [ ] Task 3: Implement nuanced haptic patterns
  - [ ] SubTask 3.1: Add TAP pattern [10] for bottle selection
  - [ ] SubTask 3.2: Add POUR pattern [20] for valid pours
  - [ ] SubTask 3.3: Add ERROR pattern [15, 30, 15] for invalid moves
  - [ ] SubTask 3.4: Add WIN pattern [50, 30, 50, 30, 50] for level completion
  - [ ] SubTask 3.5: Add PERFECT pattern for 3-star achievements

- [ ] Task 4: Update haptic integration
  - [ ] SubTask 4.1: Replace single vibration call with pattern-based system
  - [ ] SubTask 4.2: Add haptic intensity configuration (optional)
  - [ ] SubTask 4.3: Test haptic patterns on multiple devices

## Phase 3: Enhanced Audio Effects

- [ ] Task 5: Implement layered sound effects
  - [ ] SubTask 5.1: Enhance tap sound with frequency rise (440→880Hz)
  - [ ] SubTask 5.2: Enhance pour sound with smooth glide (150→100Hz over 400ms)
  - [ ] SubTask 5.3: Implement win sound as ascending arpeggio (C-E-G-C)
  - [ ] SubTask 5.4: Add spatial audio panning for pour sounds

- [ ] Task 6: Add volume control
  - [ ] SubTask 6.1: Implement volume slider in settings
  - [ ] SubTask 6.2: Add smooth fade for volume changes
  - [ ] SubTask 6.3: Persist volume preference

## Phase 4: Enhanced Win Celebration

- [ ] Task 7: Implement enhanced particle effects
  - [ ] SubTask 7.1: Add confetti explosion with 100+ particles
  - [ ] SubTask 7.2: Implement varied particle colors and velocities
  - [ ] SubTask 7.3: Add star particle type with rotation
  - [ ] SubTask 7.4: Implement laser spark particles for perfect clears

- [ ] Task 8: Implement star reveal animation
  - [ ] SubTask 8.1: Add sequential star appearance (350ms intervals)
  - [ ] SubTask 8.2: Implement scale animation (2.0 → 1.0 with bounce)
  - [ ] SubTask 8.3: Add rotation animation (-90° → 0°)
  - [ ] SubTask 8.4: Add elastic easing for bounce effect

- [ ] Task 9: Implement perfect clear celebration
  - [ ] SubTask 9.1: Trigger confetti explosion on 3-star achievement
  - [ ] SubTask 9.2: Repeat vibration pattern 3 times
  - [ ] SubTask 9.3: Add "PERFECT CLEAR!" visual indicator
  - [ ] SubTask 9.4: Enhance win sound with reverb effect

## Phase 5: Responsive Animation Support

- [ ] Task 10: Implement reduced motion support
  - [ ] SubTask 10.1: Add `prefers-reduced-motion` media query detection
  - [ ] SubTask 10.2: Override CSS transitions to 0.01ms when reduced motion active
  - [ ] SubTask 10.3: Disable animation iterations when reduced motion active
  - [ ] SubTask 10.4: Ensure reduced motion doesn't break functionality

- [ ] Task 11: Update existing animations
  - [ ] SubTask 11.1: Enhance bottle selection with smooth scale-up (150ms)
  - [ ] SubTask 11.2: Increase hint pulse frequency to 180ms
  - [ ] SubTask 11.3: Add dynamic intensity to hint highlights
  - [ ] SubTask 11.4: Implement smooth level transition cross-fade

## Phase 6: Validation and Testing

- [ ] Task 12: Run regression verification
  - [ ] SubTask 12.1: Validate menu/classic interactions still function
  - [ ] SubTask 12.2: Run UX regression script and confirm no new failures
  - [ ] SubTask 12.3: Perform manual viewport checks (portrait and landscape)
  - [ ] SubTask 12.4: Test on multiple devices and browsers

- [ ] Task 13: Performance verification
  - [ ] SubTask 13.1: Verify 60 FPS maintained during animations
  - [ ] SubTask 13.2: Measure JavaScript execution time per frame
  - [ ] SubTask 13.3: Test on low-end devices
  - [ ] SubTask 13.4: Verify battery impact is acceptable

- [ ] Task 14: Accessibility verification
  - [ ] SubTask 14.1: Test reduced motion preference handling
  - [ ] SubTask 14.2: Verify screen reader compatibility
  - [ ] SubTask 14.3: Ensure keyboard navigation still works
  - [ ] SubTask 14.4: Check color contrast ratios

# Task Dependencies

- Phase 1 (Visual Polish) must complete before Phase 6 (Validation)
- Phase 2 (Haptics) can run in parallel with Phase 1
- Phase 3 (Audio) can run in parallel with Phase 1
- Phase 4 (Win Celebration) depends on Phase 1 and Phase 2
- Phase 5 (Responsive) must complete before Phase 6
- Phase 6 depends on all previous phases