/**
 * @fileoverview Interactive Tutorial System for Water Puzzle Star
 * Provides step-by-step guidance for new players
 */

class TutorialSystem {
  constructor() {
    this.isActive = false;
    this.currentStep = 0;
    this.tutorialSteps = [];
    this.overlay = null;
    this.highlightElement = null;
    this.tooltipElement = null;
    this.onComplete = null;
    this.hasSeenTutorial = localStorage.getItem('water_puzzle_tutorial_completed') === 'true';
    this.contextualStartTimeout = null;
    this.contextualStartHandler = null;
    
    this.init();
  }

  init() {
    this.createTutorialOverlay();
    this.defineTutorialSteps();
    
    if (!this.hasSeenTutorial) {
      this.setupContextualStart();
    }
  }

  setupContextualStart() {
    if (this.hasSeenTutorial) return;
    const start = () => {
      if (this.hasSeenTutorial || this.isActive) return;
      this.startTutorial();
    };
    this.contextualStartHandler = start;
    window.addEventListener('tutorialNudge', this.contextualStartHandler, { once: true });
    this.contextualStartTimeout = setTimeout(() => {
      start();
    }, 15000);
  }

  clearContextualStart() {
    if (this.contextualStartTimeout) {
      clearTimeout(this.contextualStartTimeout);
      this.contextualStartTimeout = null;
    }
    if (this.contextualStartHandler) {
      window.removeEventListener('tutorialNudge', this.contextualStartHandler);
      this.contextualStartHandler = null;
    }
  }

  createTutorialOverlay() {
    // Create main overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'tutorial-overlay';
    this.overlay.className = 'tutorial-overlay';
    this.overlay.innerHTML = `
      <div class="tutorial-backdrop"></div>
      <div class="tutorial-tooltip">
        <div class="tutorial-header">
          <span class="tutorial-step-indicator">Step 1 of 5</span>
          <button class="tutorial-skip-btn" aria-label="Skip tutorial">Skip</button>
        </div>
        <div class="tutorial-content">
          <h3 class="tutorial-title">Welcome to Water Puzzle!</h3>
          <p class="tutorial-description">Learn how to play this exciting puzzle game.</p>
        </div>
        <div class="tutorial-footer">
          <button class="tutorial-btn tutorial-prev-btn" style="display: none;">← Previous</button>
          <button class="tutorial-btn tutorial-next-btn">Next →</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.overlay);
    
    // Event listeners
    this.overlay.querySelector('.tutorial-skip-btn').addEventListener('click', () => this.skipTutorial());
    this.overlay.querySelector('.tutorial-next-btn').addEventListener('click', () => this.nextStep());
    this.overlay.querySelector('.tutorial-prev-btn').addEventListener('click', () => this.prevStep());
    this.overlay.querySelector('.tutorial-backdrop').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.skipTutorial();
      }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      
      if (e.key === 'Escape') {
        this.skipTutorial();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        this.nextStep();
      } else if (e.key === 'ArrowLeft') {
        this.prevStep();
      }
    });
  }

  defineTutorialSteps() {
    this.tutorialSteps = [
      {
        title: "Welcome to Water Puzzle! 🎮",
        description: "Your goal is to pour water between bottles to reach the exact target amount shown. Let's learn how to play!",
        target: null,
        position: 'center',
        action: null
      },
      {
        title: "Select a Bottle 🫗",
        description: "Tap on any bottle to select it. The selected bottle will lift up and glow. Try tapping a bottle with water in it!",
        target: '#gameCanvas',
        position: 'top',
        action: 'selectBottle'
      },
      {
        title: "Pour Water 💧",
        description: "With a bottle selected, tap another bottle to pour water into it. Water will flow until the source is empty or the destination is full.",
        target: '#gameCanvas',
        position: 'top',
        action: 'pourWater'
      },
      {
        title: "Reach the Target 🎯",
        description: "The dashed orange line shows your target amount. Get any bottle to exactly that level to win! The target is shown in the HUD.",
        target: '#hud-target',
        position: 'bottom',
        action: null
      },
      {
        title: "Use Tools Wisely 🛠️",
        description: "Use UNDO to reverse mistakes, RESTART to try again, and HINTS when you're stuck. Try to solve each level in the minimum moves for 3 stars!",
        target: '#bottom-banner',
        position: 'top',
        action: null
      },
      {
        title: "You're Ready! 🌟",
        description: "Complete levels to unlock new worlds and earn stars. Good luck, and have fun!",
        target: null,
        position: 'center',
        action: null
      }
    ];
  }

  startTutorial() {
    if (this.hasSeenTutorial) return;
    this.clearContextualStart();
    
    this.isActive = true;
    this.currentStep = 0;
    this.showStep();
    this.overlay.classList.add('active');
    
    // Dispatch event for other systems
    window.dispatchEvent(new CustomEvent('tutorialStarted'));
  }

  showStep() {
    const step = this.tutorialSteps[this.currentStep];
    if (!step) return;
    
    const titleEl = this.overlay.querySelector('.tutorial-title');
    const descriptionEl = this.overlay.querySelector('.tutorial-description');
    const indicatorEl = this.overlay.querySelector('.tutorial-step-indicator');
    const prevBtn = this.overlay.querySelector('.tutorial-prev-btn');
    const nextBtn = this.overlay.querySelector('.tutorial-next-btn');
    const tooltip = this.overlay.querySelector('.tutorial-tooltip');
    
    // Update content
    titleEl.textContent = step.title;
    descriptionEl.textContent = step.description;
    indicatorEl.textContent = `Step ${this.currentStep + 1} of ${this.tutorialSteps.length}`;
    
    // Update buttons
    prevBtn.style.display = this.currentStep > 0 ? 'block' : 'none';
    nextBtn.textContent = this.currentStep === this.tutorialSteps.length - 1 ? 'Finish' : 'Next →';
    
    // Position tooltip
    this.positionTooltip(step);
    
    // Highlight target element
    this.highlightTarget(step.target);
    
    // Execute action if any
    if (step.action) {
      this.executeAction(step.action);
    }
  }

  positionTooltip(step) {
    const tooltip = this.overlay.querySelector('.tutorial-tooltip');
    tooltip.className = 'tutorial-tooltip';
    tooltip.style.top = '';
    tooltip.style.left = '';
    const viewportPadding = window.innerWidth <= 480 ? 10 : 20;
    
    if (step.position === 'center') {
      tooltip.classList.add('position-center');
      tooltip.style.top = '50%';
      tooltip.style.left = '50%';
      return;
    }
    
    if (step.target) {
      const targetEl = document.querySelector(step.target);
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        tooltip.classList.add(`position-${step.position}`);
        
        // Calculate position
        let top, left;
        
        if (step.position === 'top') {
          top = rect.top - tooltipRect.height - 20;
          left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        } else if (step.position === 'bottom') {
          top = rect.bottom + 20;
          left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        } else if (step.position === 'left') {
          top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
          left = rect.left - tooltipRect.width - 20;
        } else if (step.position === 'right') {
          top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
          left = rect.right + 20;
        }
        
        // Keep within viewport
        const maxTop = Math.max(viewportPadding, window.innerHeight - tooltipRect.height - viewportPadding);
        const maxLeft = Math.max(viewportPadding, window.innerWidth - tooltipRect.width - viewportPadding);
        top = Math.max(viewportPadding, Math.min(maxTop, top));
        left = Math.max(viewportPadding, Math.min(maxLeft, left));
        
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        return;
      }
    }

    tooltip.classList.add('position-center');
    tooltip.style.top = '50%';
    tooltip.style.left = '50%';
  }

  highlightTarget(selector) {
    // Remove previous highlight
    if (this.highlightElement) {
      this.highlightElement.remove();
      this.highlightElement = null;
    }
    
    if (!selector) return;
    
    const targetEl = document.querySelector(selector);
    if (!targetEl) return;
    
    // Create highlight element
    this.highlightElement = document.createElement('div');
    this.highlightElement.className = 'tutorial-highlight';
    
    const rect = targetEl.getBoundingClientRect();
    this.highlightElement.style.cssText = `
      position: fixed;
      top: ${rect.top - 5}px;
      left: ${rect.left - 5}px;
      width: ${rect.width + 10}px;
      height: ${rect.height + 10}px;
      border: 3px solid #00D2FF;
      border-radius: 8px;
      pointer-events: none;
      z-index: 9998;
      animation: tutorial-pulse 2s infinite;
    `;
    
    document.body.appendChild(this.highlightElement);
  }

  executeAction(action) {
    // These actions are hints for the player, not forced interactions
    switch (action) {
      case 'selectBottle':
        // Visual hint to select a bottle
        break;
      case 'pourWater':
        // Visual hint to pour water
        break;
    }
  }

  nextStep() {
    if (this.currentStep < this.tutorialSteps.length - 1) {
      this.currentStep++;
      this.showStep();
    } else {
      this.completeTutorial();
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showStep();
    }
  }

  skipTutorial() {
    this.completeTutorial();
  }

  completeTutorial() {
    this.isActive = false;
    this.hasSeenTutorial = true;
    localStorage.setItem('water_puzzle_tutorial_completed', 'true');
    this.clearContextualStart();
    
    this.overlay.classList.remove('active');
    
    if (this.highlightElement) {
      this.highlightElement.remove();
      this.highlightElement = null;
    }
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('tutorialCompleted'));
  }

  resetTutorial() {
    localStorage.removeItem('water_puzzle_tutorial_completed');
    this.hasSeenTutorial = false;
    this.currentStep = 0;
    this.clearContextualStart();
    this.setupContextualStart();
  }
}

// Create global instance
window.TutorialSystem = new TutorialSystem();
