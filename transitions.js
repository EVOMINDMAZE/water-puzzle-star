/**
 * @fileoverview Loading States and Transitions System for Water Puzzle Star
 * Provides smooth loading states, transitions, and animations
 */

class TransitionSystem {
  constructor() {
    this.loadingOverlay = null;
    this.transitionQueue = [];
    this.isTransitioning = false;
    
    this.init();
  }

  init() {
    this.createLoadingOverlay();
    this.addTransitionStyles();
    this.setupPageTransitions();
  }

  createLoadingOverlay() {
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.id = 'loading-overlay';
    this.loadingOverlay.className = 'loading-overlay';
    this.loadingOverlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <div class="loading-text">Loading...</div>
        <div class="loading-progress">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.loadingOverlay);
  }

  addTransitionStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Loading Overlay */
      .loading-overlay {
        position: fixed;
        inset: 0;
        background: rgba(11, 15, 26, 0.95);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      
      .loading-overlay.active {
        opacity: 1;
        pointer-events: all;
      }
      
      .loading-content {
        text-align: center;
      }
      
      .loading-spinner {
        position: relative;
        width: 80px;
        height: 80px;
        margin: 0 auto 24px;
      }
      
      .spinner-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 3px solid transparent;
        border-top-color: #00D2FF;
        border-radius: 50%;
        animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      }
      
      .spinner-ring:nth-child(1) {
        animation-delay: -0.4s;
        border-top-color: #00D2FF;
      }
      
      .spinner-ring:nth-child(2) {
        animation-delay: -0.2s;
        border-top-color: #3A7BD5;
      }
      
      .spinner-ring:nth-child(3) {
        animation-delay: 0s;
        border-top-color: #FF512F;
      }
      
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
      
      .loading-text {
        font-size: 18px;
        font-weight: 700;
        color: white;
        margin-bottom: 16px;
      }
      
      .loading-progress {
        width: 200px;
        margin: 0 auto;
      }
      
      .loading-progress .progress-bar {
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
      }
      
      .loading-progress .progress-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #00D2FF, #3A7BD5);
        border-radius: 2px;
        transition: width 0.3s ease;
      }
      
      /* Page Transitions */
      .page-transition-enter {
        opacity: 0;
        transform: translateY(20px);
      }
      
      .page-transition-enter-active {
        opacity: 1;
        transform: translateY(0);
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .page-transition-exit {
        opacity: 1;
        transform: translateY(0);
      }
      
      .page-transition-exit-active {
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
      }
      
      /* Fade transitions */
      .fade-enter {
        opacity: 0;
      }
      
      .fade-enter-active {
        opacity: 1;
        transition: opacity 0.3s ease;
      }
      
      .fade-exit {
        opacity: 1;
      }
      
      .fade-exit-active {
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      /* Scale transitions */
      .scale-enter {
        opacity: 0;
        transform: scale(0.9);
      }
      
      .scale-enter-active {
        opacity: 1;
        transform: scale(1);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .scale-exit {
        opacity: 1;
        transform: scale(1);
      }
      
      .scale-exit-active {
        opacity: 0;
        transform: scale(0.9);
        transition: all 0.3s ease;
      }
      
      /* Slide transitions */
      .slide-left-enter {
        transform: translateX(100%);
      }
      
      .slide-left-enter-active {
        transform: translateX(0);
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .slide-left-exit {
        transform: translateX(0);
      }
      
      .slide-left-exit-active {
        transform: translateX(-100%);
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .slide-right-enter {
        transform: translateX(-100%);
      }
      
      .slide-right-enter-active {
        transform: translateX(0);
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .slide-right-exit {
        transform: translateX(0);
      }
      
      .slide-right-exit-active {
        transform: translateX(100%);
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      /* Stagger animations */
      .stagger-item {
        opacity: 0;
        transform: translateY(20px);
      }
      
      .stagger-item.visible {
        opacity: 1;
        transform: translateY(0);
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
    `;
    
    document.head.appendChild(style);
  }

  setupPageTransitions() {
    // Add transition classes to main elements
    const gameRoot = document.getElementById('game-root');
    if (gameRoot) {
      gameRoot.classList.add('page-transition-enter');
      
      // Trigger enter animation after a short delay
      setTimeout(() => {
        gameRoot.classList.add('page-transition-enter-active');
      }, 100);
    }
  }

  // Loading methods
  showLoading(message = 'Loading...', showProgress = false) {
    const textEl = this.loadingOverlay.querySelector('.loading-text');
    const progressEl = this.loadingOverlay.querySelector('.loading-progress');
    
    if (textEl) textEl.textContent = message;
    if (progressEl) {
      progressEl.style.display = showProgress ? 'block' : 'none';
    }
    
    this.loadingOverlay.classList.add('active');
  }

  hideLoading() {
    this.loadingOverlay.classList.remove('active');
  }

  updateProgress(percent) {
    const progressFill = this.loadingOverlay.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    }
  }

  // Transition methods
  async transition(element, type = 'fade', direction = 'enter') {
    return new Promise((resolve) => {
      const enterClass = `${type}-enter`;
      const activeClass = `${type}-enter-active`;
      const exitClass = `${type}-exit`;
      const exitActiveClass = `${type}-exit-active`;
      
      if (direction === 'enter') {
        element.classList.add(enterClass);
        
        requestAnimationFrame(() => {
          element.classList.add(activeClass);
          
          setTimeout(() => {
            element.classList.remove(enterClass, activeClass);
            resolve();
          }, 400);
        });
      } else {
        element.classList.add(exitClass);
        
        requestAnimationFrame(() => {
          element.classList.add(exitActiveClass);
          
          setTimeout(() => {
            element.classList.remove(exitClass, exitActiveClass);
            resolve();
          }, 300);
        });
      }
    });
  }

  // Stagger animation for lists
  staggerAnimate(elements, delay = 100) {
    elements.forEach((el, index) => {
      el.classList.add('stagger-item');
      
      setTimeout(() => {
        el.classList.add('visible');
      }, index * delay);
    });
  }

  // Level transition
  async transitionToLevel(levelIndex) {
    const gameRoot = document.getElementById('game-root');
    if (!gameRoot) return;
    
    // Exit current level
    await this.transition(gameRoot, 'fade', 'exit');
    
    // Load new level (this would be handled by the game)
    if (window.initLevel) {
      window.initLevel(levelIndex);
    }
    
    // Enter new level
    await this.transition(gameRoot, 'fade', 'enter');
  }

  // Overlay transitions
  async showOverlay(overlay) {
    overlay.classList.add('fade-enter');
    overlay.style.display = 'flex';
    
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        overlay.classList.add('fade-enter-active');
        
        setTimeout(() => {
          overlay.classList.remove('fade-enter', 'fade-enter-active');
          resolve();
        }, 300);
      });
    });
  }

  async hideOverlay(overlay) {
    overlay.classList.add('fade-exit');
    
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        overlay.classList.add('fade-exit-active');
        
        setTimeout(() => {
          overlay.classList.remove('fade-exit', 'fade-exit-active');
          overlay.style.display = 'none';
          resolve();
        }, 300);
      });
    });
  }
}

// Create global instance
window.TransitionSystem = new TransitionSystem();