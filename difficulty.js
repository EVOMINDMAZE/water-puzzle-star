/**
 * @fileoverview Difficulty Modes System for Water Puzzle Star
 * Provides Casual, Normal, Challenge, and Expert difficulty modes
 */

class DifficultySystem {
  constructor() {
    this.currentMode = 'normal';
    this.difficultyOverlay = null;
    this.modes = {
      casual: {
        name: 'Casual',
        description: 'Relaxed gameplay with optional assistance',
        icon: '🌱',
        hints: 5,
        parMultiplier: 1.5, // More lenient par
        starThresholds: {
          3: 2.0, // 2x par for 3 stars
          2: 2.5  // 2.5x par for 2 stars
        },
        showHints: true,
        showBestMove: true,
        undoLimit: 'unlimited'
      },
      normal: {
        name: 'Normal',
        description: 'Standard gameplay balance',
        icon: '⭐',
        hints: 5,
        parMultiplier: 1.0,
        starThresholds: {
          3: 1.0, // par for 3 stars
          2: 1.3  // par + 30% for 2 stars
        },
        showHints: true,
        showBestMove: false,
        undoLimit: 'unlimited'
      },
      challenge: {
        name: 'Challenge',
        description: 'Limited hints, stricter par scores',
        icon: '🔥',
        hints: 3,
        parMultiplier: 0.9, // Stricter par
        starThresholds: {
          3: 1.0, // par for 3 stars
          2: 1.2  // par + 20% for 2 stars
        },
        showHints: true,
        showBestMove: false,
        undoLimit: 10
      },
      expert: {
        name: 'Expert',
        description: 'No hints, perfect par required',
        icon: '👑',
        hints: 0,
        parMultiplier: 0.8, // Very strict par
        starThresholds: {
          3: 1.0, // par for 3 stars
          2: 1.1  // par + 10% for 2 stars
        },
        showHints: false,
        showBestMove: false,
        undoLimit: 5
      }
    };
    
    this.init();
  }

  init() {
    this.loadSavedMode();
    this.createDifficultySelector();
    this.applyMode(this.currentMode);
  }

  loadSavedMode() {
    const saved = localStorage.getItem('water_puzzle_difficulty');
    if (saved && this.modes[saved]) {
      this.currentMode = saved;
    }
  }

  createDifficultySelector() {
    const topHud = document.getElementById('top-hud');
    if (!topHud) return;
    const utilityTray = document.getElementById('top-utilities-tray');
    
    const difficultyBtn = document.createElement('button');
    difficultyBtn.className = 'hud-pill difficulty-selector';
    difficultyBtn.innerHTML = `
      <span class="hud-label">Mode</span>
      <span class="hud-value difficulty-icon">${this.modes[this.currentMode].icon}</span>
    `;
    difficultyBtn.setAttribute('aria-label', 'Change difficulty mode');
    difficultyBtn.style.cursor = 'pointer';
    
    difficultyBtn.addEventListener('click', () => this.showDifficultyMenu());
    (utilityTray || topHud).appendChild(difficultyBtn);
    
    this.difficultyBtn = difficultyBtn;
  }

  showDifficultyMenu() {
    if (this.difficultyOverlay?.isConnected) return;
    const existingOverlay = document.querySelector('.difficulty-overlay');
    if (existingOverlay) {
      this.difficultyOverlay = existingOverlay;
      return;
    }

    // Create difficulty selection overlay
    const overlay = document.createElement('div');
    overlay.className = 'difficulty-overlay';
    overlay.innerHTML = `
      <div class="difficulty-backdrop"></div>
      <div class="difficulty-menu">
        <div class="difficulty-header">
          <h2>Select Difficulty</h2>
          <button class="difficulty-close">&times;</button>
        </div>
        <div class="difficulty-options">
          ${Object.entries(this.modes).map(([key, mode]) => `
            <button class="difficulty-option ${key === this.currentMode ? 'selected' : ''}" data-mode="${key}">
              <div class="mode-icon">${mode.icon}</div>
              <div class="mode-info">
                <div class="mode-name">${mode.name}</div>
                <div class="mode-description">${mode.description}</div>
                <div class="mode-details">
                  <span class="detail">Hints: ${mode.hints === 'unlimited' ? '∞' : mode.hints}</span>
                  <span class="detail">Par: ${mode.parMultiplier}x</span>
                </div>
              </div>
              ${key === this.currentMode ? '<div class="check-mark">✓</div>' : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    this.difficultyOverlay = overlay;

    const closeOverlay = () => {
      if (!overlay.isConnected) return;
      overlay.remove();
      if (this.difficultyOverlay === overlay) {
        this.difficultyOverlay = null;
      }
    };
    
    // Event listeners
    overlay.querySelector('.difficulty-close').addEventListener('click', () => {
      closeOverlay();
    });
    
    overlay.querySelector('.difficulty-backdrop').addEventListener('click', () => {
      closeOverlay();
    });
    
    overlay.querySelectorAll('.difficulty-option').forEach(option => {
      option.addEventListener('click', () => {
        const mode = option.dataset.mode;
        this.setMode(mode);
        closeOverlay();
      });
    });
    
    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
  }

  setMode(modeName) {
    if (!this.modes[modeName]) return;
    
    this.currentMode = modeName;
    this.applyMode(modeName);
    
    // Save preference
    localStorage.setItem('water_puzzle_difficulty', modeName);
    
    // Update UI
    if (this.difficultyBtn) {
      const icon = this.difficultyBtn.querySelector('.difficulty-icon');
      if (icon) {
        icon.textContent = this.modes[modeName].icon;
      }
    }
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('difficultyChange', {
      detail: { mode: modeName, settings: this.modes[modeName] }
    }));
    
    // Show feedback
    if (window.FeedbackSystem) {
      window.FeedbackSystem.info(`Mode: ${this.modes[modeName].name}`);
    }
  }

  applyMode(modeName) {
    const mode = this.modes[modeName];
    if (!mode) return;
    
    // Update hint count based on mode
    if (mode.hints !== 'unlimited') {
      // This would integrate with the existing hint system
      if (window.hintCount !== undefined) {
        window.hintCount = mode.hints;
      }
    }
    
    // Add mode class to body
    document.body.classList.remove('mode-casual', 'mode-normal', 'mode-challenge', 'mode-expert');
    document.body.classList.add(`mode-${modeName}`);
  }

  getMode() {
    return this.currentMode;
  }

  getModeSettings() {
    return this.modes[this.currentMode];
  }

  calculateStars(moves, par) {
    const mode = this.modes[this.currentMode];
    const ratio = moves / par;
    
    if (ratio <= mode.starThresholds[3]) {
      return 3;
    } else if (ratio <= mode.starThresholds[2]) {
      return 2;
    } else {
      return 1;
    }
  }

  getAdjustedPar(basePar) {
    const mode = this.modes[this.currentMode];
    return Math.ceil(basePar * mode.parMultiplier);
  }

  canUseHint() {
    if (window.MonetizationSystem && typeof window.MonetizationSystem.isAdFreeEntitled === 'function' && window.MonetizationSystem.isAdFreeEntitled()) {
      return true;
    }
    const mode = this.modes[this.currentMode];
    if (mode.hints === 0) return false;
    
    // Check current hint count
    const currentHints = parseInt(localStorage.getItem('water_puzzle_hints') || '0');
    return currentHints > 0;
  }

  canUndo() {
    const mode = this.modes[this.currentMode];
    if (mode.undoLimit === 'unlimited') return true;
    
    // This would check against current undo count
    return true; // Simplified for now
  }

  addDifficultyStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .difficulty-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      
      .difficulty-overlay.active {
        opacity: 1;
        pointer-events: all;
      }
      
      .difficulty-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
      }
      
      .difficulty-menu {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(30, 41, 59, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        padding: 24px;
        width: 90%;
        max-width: 400px;
      }
      
      .difficulty-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      
      .difficulty-header h2 {
        font-size: 24px;
        font-weight: 900;
        color: white;
      }
      
      .difficulty-close {
        background: transparent;
        border: none;
        color: white;
        font-size: 28px;
        cursor: pointer;
      }
      
      .difficulty-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .difficulty-option {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
      }
      
      .difficulty-option:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(0, 210, 255, 0.5);
      }
      
      .difficulty-option.selected {
        border-color: #00D2FF;
        background: rgba(0, 210, 255, 0.1);
      }
      
      .mode-icon {
        font-size: 32px;
      }
      
      .mode-info {
        flex: 1;
      }
      
      .mode-name {
        font-size: 18px;
        font-weight: 700;
        color: white;
        margin-bottom: 4px;
      }
      
      .mode-description {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 8px;
      }
      
      .mode-details {
        display: flex;
        gap: 12px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
      }
      
      .check-mark {
        font-size: 24px;
        color: #00D2FF;
      }
    `;
    
    document.head.appendChild(style);
  }
}

// Create global instance
window.DifficultySystem = new DifficultySystem();
