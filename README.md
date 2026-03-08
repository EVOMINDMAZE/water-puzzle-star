# Water Puzzle Star

A browser-based water sorting puzzle game where players transfer colored liquids between bottles to sort them by color.

## Repository Map

- **Runtime**
  - `index.html`: Game entry point, DOM HUD, bottom action bar, and dialog overlays.
  - `main.js`: Core game logic, canvas rendering loop, input handling, hint logic, and overlay state.
  - `levels.js`: Data file containing the 1000 generated levels.

- **Tooling**
  - `generate_levels.js`: Node.js script to generate procedural levels with solvability guarantees.
  - `validate_levels.js`: Standalone script to validate a sample set of levels.

- **Assets**
  - `assets/`: Image assets (backgrounds, icons).

## Quick Start

1. **Play the Game**
   Open `index.html` in any modern web browser. No build step is required.

2. **Generate New Levels**
   ```bash
   node generate_levels.js
   # Outputs: levels.js
   ```

3. **Validate Levels**
   ```bash
   node validate_levels.js
   # Outputs: Solvability check for sample levels
   ```

## Gameplay UI Highlights

- **Menu overlay**: World/level picker opens from the bottom menu button, supports backdrop click + `Escape` close, and restores focus to the previously focused control.
- **DOM HUD**: Top pills show `World/Level`, `Moves/PAR`, `Target`, `Hints`, and `Stars`; values are updated from `updateHUD()` in `main.js`.
- **Hint guidance**: Hint action computes a BFS move and highlights source/destination bottles with timed pulse states (auto-clears after ~2.8s or on state reset).
- **Accessibility/keyboard**: Buttons and overlays use semantic attributes (`aria-label`, `aria-disabled`, `aria-hidden`, `aria-modal`, `aria-pressed`) with focus-visible styles and `Enter`/`Space` support on focused controls.

## Validation Workflow

1. **Solver sanity check (Node script)**
   ```bash
   node validate_levels.js
   ```
   Runs a fixed sample pack through BFS solvability checks.

2. **UX regression sweep (Playwright)**
   - Start a local static server for this repo (test script expects `http://127.0.0.1:4174/`).
   - Run:
     ```bash
     node test-artifacts/ux-regression-test.js
     ```
   - Outputs screenshots + `report.json` under `test-artifacts/run-<timestamp>/`.

For a deeper dive into the system design, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Deploy to Cloudflare Pages

- Static hosting is supported with no build step.
- Deployment workflow is included at `.github/workflows/cloudflare-pages.yml`.
- Cloudflare headers are configured in `_headers` for safer cache behavior during testing.
- Setup guide: [docs/CLOUDFLARE_PAGES.md](docs/CLOUDFLARE_PAGES.md)
