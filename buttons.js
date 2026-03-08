/**
 * @fileoverview Enhanced Button System for Water Puzzle Star
 * Provides improved button states, animations, and feedback
 */

class ButtonSystem {
  constructor() {
    this.buttons = new Map();
    this.init();
  }

  init() {
    this.enhanceExistingButtons();
    this.addButtonStyles();
  }

  enhanceExistingButtons() {
    // Enhance all icon buttons
    const iconButtons = document.querySelectorAll('.icon-btn');
    iconButtons.forEach(btn => this.enhanceButton(btn, 'icon'));
    
    // Enhance HUD pills
    const hudPills = document.querySelectorAll('.hud-pill');
    hudPills.forEach(pill => {
      if (!pill.classList.contains('theme-toggle') && !pill.classList.contains('help-trigger')) {
        // Make non-interactive pills not look clickable
        pill.style.cursor = 'default';
      }
    });
    
    // Enhance dialog buttons
    const dialogButtons = document.querySelectorAll('.dialog-btn, .tutorial-btn, .help-btn');
    dialogButtons.forEach(btn => this.enhanceButton(btn, 'dialog'));
  }

  enhanceButton(button, type = 'default') {
    const id = button.id || `btn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store button info
    this.buttons.set(id, {
      element: button,
      type: type,
      originalContent: button.innerHTML,
      isLoading: false,
      isDisabled: false
    });
    
    button.setAttribute('data-enhanced', 'true');
    
    // Add ripple effect
    this.addRippleEffect(button);
    
    // Add loading state support
    this.addLoadingSupport(button, id);
    
    // Add improved hover/active states
    this.addStateAnimations(button);
  }

  addRippleEffect(button) {
    button.addEventListener('click', (e) => {
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        width: ${size}px;
        height: ${size}px;
        left: ${e.clientX - rect.left - size / 2}px;
        top: ${e.clientY - rect.top - size / 2}px;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      `;
      
      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  }

  addLoadingSupport(button, id) {
    // Add methods to show/hide loading state
    button.showLoading = () => {
      const btnData = this.buttons.get(id);
      if (!btnData || btnData.isLoading) return;
      
      btnData.isLoading = true;
      button.disabled = true;
      button.setAttribute('data-loading', 'true');
      
      // Store original content
      btnData.originalContent = button.innerHTML;
      
      // Show loading spinner
      button.innerHTML = `
        <div class="btn-loading-spinner">
          <div class="spinner"></div>
        </div>
      `;
    };
    
    button.hideLoading = () => {
      const btnData = this.buttons.get(id);
      if (!btnData || !btnData.isLoading) return;
      
      btnData.isLoading = false;
      button.disabled = btnData.isDisabled;
      button.setAttribute('data-loading', 'false');
      
      // Restore original content
      button.innerHTML = btnData.originalContent;
    };
  }

  addStateAnimations(button) {
    // Add touch feedback for mobile
    button.addEventListener('touchstart', () => {
      button.classList.add('btn-touching');
    }, { passive: true });
    
    button.addEventListener('touchend', () => {
      button.classList.remove('btn-touching');
    }, { passive: true });
    
    button.addEventListener('touchcancel', () => {
      button.classList.remove('btn-touching');
    }, { passive: true });
  }

  addButtonStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Ripple animation */
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
      
      /* Button touch state */
      .btn-touching {
        transform: scale(0.95) !important;
        opacity: 0.8 !important;
      }
      
      /* Loading spinner */
      .btn-loading-spinner {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }
      
      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      
      /* Enhanced button states */
      .icon-btn[data-enhanced="true"] {
        transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      
      .icon-btn[data-enhanced="true"]:hover:not(:disabled) {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
      }
      
      .icon-btn[data-enhanced="true"]:active:not(:disabled) {
        transform: scale(0.92);
      }
      
      .icon-btn[data-enhanced="true"]:disabled {
        opacity: 0.35;
        cursor: not-allowed;
        transform: none;
      }
      
      /* Loading state */
      .icon-btn[data-loading="true"] {
        pointer-events: none;
        opacity: 0.6;
      }
      
      /* Success state */
      .icon-btn.btn-success {
        background: linear-gradient(135deg, #10B981, #059669) !important;
        animation: successPulse 0.5s ease;
      }
      
      @keyframes successPulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
      }
      
      /* Error state */
      .icon-btn.btn-error {
        background: linear-gradient(135deg, #EF4444, #DC2626) !important;
        animation: errorShake 0.5s ease;
      }
      
      @keyframes errorShake {
        0%, 100% {
          transform: translateX(0);
        }
        25% {
          transform: translateX(-5px);
        }
        75% {
          transform: translateX(5px);
        }
      }
      
      /* HUD pill enhancements */
      .hud-pill[data-enhanced="true"] {
        transition: all 0.2s ease;
      }
      
      .hud-pill.theme-toggle:hover,
      .hud-pill.help-trigger:hover {
        transform: translateY(-2px);
        background: rgba(255, 255, 255, 0.1);
      }
      
      /* Dialog button enhancements */
      .dialog-btn[data-enhanced="true"] {
        transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      
      .dialog-btn[data-enhanced="true"]:hover {
        transform: translateY(-2px);
      }
      
      .dialog-btn[data-enhanced="true"]:active {
        transform: scale(0.95);
      }
    `;
    
    document.head.appendChild(style);
  }

  // Public methods for button states
  setSuccess(buttonId, duration = 2000) {
    const btnData = this.buttons.get(buttonId);
    if (!btnData) return;
    
    btnData.element.classList.add('btn-success');
    
    setTimeout(() => {
      btnData.element.classList.remove('btn-success');
    }, duration);
  }

  setError(buttonId, duration = 2000) {
    const btnData = this.buttons.get(buttonId);
    if (!btnData) return;
    
    btnData.element.classList.add('btn-error');
    
    setTimeout(() => {
      btnData.element.classList.remove('btn-error');
    }, duration);
  }

  showLoading(buttonId) {
    const btnData = this.buttons.get(buttonId);
    if (btnData && btnData.element.showLoading) {
      btnData.element.showLoading();
    }
  }

  hideLoading(buttonId) {
    const btnData = this.buttons.get(buttonId);
    if (btnData && btnData.element.hideLoading) {
      btnData.element.hideLoading();
    }
  }
}

// Create global instance
window.ButtonSystem = new ButtonSystem();