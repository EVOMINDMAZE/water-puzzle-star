/**
 * @fileoverview Contextual Help System for Water Puzzle Star
 * Provides tooltips, hints, and contextual guidance
 */

class HelpSystem {
  constructor() {
    this.tooltips = new Map();
    this.activeTooltip = null;
    this.helpButton = null;
    this.helpPanel = null;
    
    this.init();
  }

  init() {
    this.createHelpButton();
    this.createHelpPanel();
    this.defineTooltips();
    this.attachTooltipListeners();
  }

  createHelpButton() {
    const topHud = document.getElementById('top-hud');
    if (!topHud) return;
    const utilityTray = document.getElementById('top-utilities-tray');
    
    this.helpButton = document.createElement('button');
    this.helpButton.className = 'hud-pill help-trigger';
    this.helpButton.innerHTML = `
      <span class="hud-label">Help</span>
      <span class="hud-value">?</span>
    `;
    this.helpButton.setAttribute('aria-label', 'Open help panel');
    this.helpButton.style.cursor = 'pointer';
    
    this.helpButton.addEventListener('click', () => this.toggleHelpPanel());
    (utilityTray || topHud).appendChild(this.helpButton);
  }

  createHelpPanel() {
    this.helpPanel = document.createElement('div');
    this.helpPanel.id = 'help-panel';
    this.helpPanel.className = 'help-panel';
    this.helpPanel.setAttribute('role', 'dialog');
    this.helpPanel.setAttribute('aria-modal', 'true');
    this.helpPanel.setAttribute('aria-hidden', 'true');
    this.helpPanel.innerHTML = `
      <div class="help-backdrop"></div>
      <div class="help-content">
        <div class="help-header">
          <h2>How to Play</h2>
          <button class="help-close-btn" aria-label="Close help">&times;</button>
        </div>
        <div class="help-body">
          <div class="help-section">
            <h3>🎯 Objective</h3>
            <p>Pour water between bottles to reach the exact target amount shown by the orange dashed line.</p>
          </div>
          
          <div class="help-section">
            <h3>🎮 Controls</h3>
            <div class="help-item">
              <strong>Tap a bottle</strong> to select it (it will lift up and glow)
            </div>
            <div class="help-item">
              <strong>Tap another bottle</strong> to pour water from the selected bottle
            </div>
            <div class="help-item">
              <strong>Tap the same bottle</strong> again to deselect it
            </div>
          </div>
          
          <div class="help-section">
            <h3>⭐ Star Rating</h3>
            <div class="help-item">
              <strong>3 Stars:</strong> Complete in par moves or fewer
            </div>
            <div class="help-item">
              <strong>2 Stars:</strong> Complete in par + 1-2 moves
            </div>
            <div class="help-item">
              <strong>1 Star:</strong> Complete in more moves
            </div>
          </div>
          
          <div class="help-section">
            <h3>🛠️ Tools</h3>
            <div class="help-item">
              <strong>Undo:</strong> Reverse your last move
            </div>
            <div class="help-item">
              <strong>Restart:</strong> Start the level over
            </div>
            <div class="help-item">
              <strong>Hint:</strong> Shows the next best move
            </div>
            <div class="help-item">
              <strong>Sound:</strong> Toggle audio on/off
            </div>
          </div>
          
          <div class="help-section">
            <h3>💡 Tips</h3>
            <div class="help-item">• Plan your moves ahead</div>
            <div class="help-item">• Use undo to experiment</div>
            <div class="help-item">• Watch the target line carefully</div>
            <div class="help-item">• Try to match the par score for 3 stars</div>
          </div>
        </div>
        <div class="help-footer">
          <button class="help-btn help-replay-tutorial">Replay Tutorial</button>
          <button class="help-btn help-close">Got it!</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.helpPanel);
    
    // Event listeners
    this.helpPanel.querySelector('.help-close-btn').addEventListener('click', () => this.closeHelpPanel());
    this.helpPanel.querySelector('.help-close').addEventListener('click', () => this.closeHelpPanel());
    this.helpPanel.querySelector('.help-replay-tutorial').addEventListener('click', () => {
      this.closeHelpPanel();
      if (window.TutorialSystem) {
        window.TutorialSystem.resetTutorial();
        window.TutorialSystem.startTutorial();
      }
    });
    this.helpPanel.querySelector('.help-backdrop').addEventListener('click', () => this.closeHelpPanel());
    
    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.helpPanel.classList.contains('active')) {
        this.closeHelpPanel();
      }
    });
  }

  defineTooltips() {
    this.tooltips.set('#menu-btn', {
      title: 'Level Menu',
      content: 'Browse and select levels from different worlds',
      position: 'top'
    });
    
    this.tooltips.set('#undo-btn', {
      title: 'Undo Move',
      content: 'Reverse your last pour action',
      position: 'top'
    });
    
    this.tooltips.set('#restart-btn', {
      title: 'Restart Level',
      content: 'Start the current level from the beginning',
      position: 'top'
    });
    
    this.tooltips.set('#hint-btn', {
      title: 'Get Hint',
      content: 'Shows the next optimal move to solve the puzzle',
      position: 'top'
    });
    
    this.tooltips.set('#sound-btn', {
      title: 'Toggle Sound',
      content: 'Turn game audio on or off',
      position: 'top'
    });
    
    this.tooltips.set('#hud-target', {
      title: 'Target Amount',
      content: 'Get any bottle to exactly this amount to win',
      position: 'bottom'
    });
    
    this.tooltips.set('#hud-moves-par', {
      title: 'Move Counter',
      content: 'Current moves / Par (optimal moves for 3 stars)',
      position: 'bottom'
    });
  }

  attachTooltipListeners() {
    this.tooltips.forEach((tooltip, selector) => {
      const element = document.querySelector(selector);
      if (!element) return;
      
      element.addEventListener('mouseenter', (e) => this.showTooltip(e, tooltip));
      element.addEventListener('mouseleave', () => this.hideTooltip());
      element.addEventListener('focus', (e) => this.showTooltip(e, tooltip));
      element.addEventListener('blur', () => this.hideTooltip());
    });
  }

  showTooltip(event, tooltip) {
    this.hideTooltip();
    
    const tooltipEl = document.createElement('div');
    tooltipEl.className = `contextual-tooltip tooltip-${tooltip.position}`;
    tooltipEl.innerHTML = `
      <div class="tooltip-title">${tooltip.title}</div>
      <div class="tooltip-content">${tooltip.content}</div>
    `;
    
    document.body.appendChild(tooltipEl);
    this.activeTooltip = tooltipEl;
    
    // Position tooltip
    const targetRect = event.target.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    
    let top, left;
    
    if (tooltip.position === 'top') {
      top = targetRect.top - tooltipRect.height - 10;
      left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
    } else if (tooltip.position === 'bottom') {
      top = targetRect.bottom + 10;
      left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
    } else if (tooltip.position === 'left') {
      top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
      left = targetRect.left - tooltipRect.width - 10;
    } else if (tooltip.position === 'right') {
      top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
      left = targetRect.right + 10;
    }
    
    // Keep within viewport
    top = Math.max(10, Math.min(window.innerHeight - tooltipRect.height - 10, top));
    left = Math.max(10, Math.min(window.innerWidth - tooltipRect.width - 10, left));
    
    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.left = `${left}px`;
    
    // Animate in
    requestAnimationFrame(() => {
      tooltipEl.classList.add('active');
    });
  }

  hideTooltip() {
    if (this.activeTooltip) {
      this.activeTooltip.remove();
      this.activeTooltip = null;
    }
  }

  toggleHelpPanel() {
    if (this.helpPanel.classList.contains('active')) {
      this.closeHelpPanel();
    } else {
      this.openHelpPanel();
    }
  }

  openHelpPanel() {
    this.helpPanel.classList.add('active');
    this.helpPanel.setAttribute('aria-hidden', 'false');
    this.helpPanel.querySelector('.help-close').focus();
  }

  closeHelpPanel() {
    this.helpPanel.classList.remove('active');
    this.helpPanel.setAttribute('aria-hidden', 'true');
    if (this.helpButton) {
      this.helpButton.focus();
    }
  }
}

// Create global instance
window.HelpSystem = new HelpSystem();
