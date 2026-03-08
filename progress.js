/**
 * @fileoverview Progress Indicators System for Water Puzzle Star
 * Provides visual progress tracking and indicators during gameplay
 */

class ProgressSystem {
  constructor() {
    this.progressBar = null;
    this.targetIndicator = null;
    this.moveIndicator = null;
    this.starPreview = null;
    this.progressText = null;
    this.lastNearTargetAt = 0;
    this.lastNearTargetKey = '';
    
    this.init();
  }

  init() {
    this.createProgressElements();
    this.attachToGame();
  }

  createProgressElements() {
    // Create progress bar container
    const progressContainer = document.createElement('div');
    progressContainer.id = 'progress-container';
    progressContainer.className = 'progress-container';
    progressContainer.innerHTML = `
      <div class="progress-bar-wrapper">
        <div class="progress-label">Progress to Target</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: 0%"></div>
          <div class="progress-target-marker" style="left: 0%"></div>
        </div>
        <div class="progress-text">0% Complete</div>
      </div>
      
      <div class="move-indicator">
        <div class="move-bar">
          <div class="move-fill par-zone" style="width: 100%"></div>
          <div class="move-fill warning-zone" style="width: 0%"></div>
          <div class="move-fill danger-zone" style="width: 0%"></div>
          <div class="move-current" style="left: 0%"></div>
        </div>
        <div class="move-labels">
          <span class="par-label">Par: 0</span>
          <span class="current-label">Moves: 0</span>
        </div>
      </div>
      
      <div class="star-preview">
        <div class="star star-1">☆</div>
        <div class="star star-2">☆</div>
        <div class="star star-3">☆</div>
      </div>
    `;
    
    // Insert after top HUD
    const topHud = document.getElementById('top-hud');
    if (topHud && topHud.nextSibling) {
      topHud.parentNode.insertBefore(progressContainer, topHud.nextSibling);
    } else {
      document.getElementById('game-root').appendChild(progressContainer);
    }
    
    this.progressBar = progressContainer.querySelector('.progress-bar');
    this.moveIndicator = progressContainer.querySelector('.move-indicator');
    this.starPreview = progressContainer.querySelector('.star-preview');
    this.progressText = progressContainer.querySelector('.progress-text');
  }

  attachToGame() {
    // Listen for game state changes
    window.addEventListener('gameStateUpdate', (e) => {
      this.updateProgress(e.detail);
    });
    
    window.addEventListener('levelLoaded', (e) => {
      this.setLevelInfo(e.detail);
    });
  }

  setLevelInfo(levelData) {
    if (!levelData) return;
    
    const par = levelData.par || 0;
    const target = levelData.target || 0;
    
    // Update par label
    const parLabel = this.moveIndicator.querySelector('.par-label');
    if (parLabel) {
      parLabel.textContent = `Par: ${par}`;
    }
    
    // Reset progress
    this.updateProgress({
      bottles: [],
      target: target,
      moves: 0,
      par: par
    });
  }

  updateProgress(gameState) {
    if (!gameState) return;
    
    // Update target progress
    this.updateTargetProgress(gameState.bottles, gameState.target);
    
    // Update move progress
    this.updateMoveProgress(gameState.moves, gameState.par);
    
    // Update star preview
    this.updateStarPreview(gameState.moves, gameState.par);
  }

  updateTargetProgress(bottles, target) {
    if (!bottles || !target) return;
    
    let closestAmount = 0;
    let maxProgress = 0;
    let closestBottleIndex = -1;
    
    bottles.forEach((bottle, index) => {
      const current = bottle.current || 0;
      const progress = Math.min(100, (current / target) * 100);
      
      if (progress > maxProgress) {
        maxProgress = progress;
        closestAmount = current;
        closestBottleIndex = index;
      }
    });
    
    // Update progress bar
    const progressFill = this.progressBar.querySelector('.progress-fill');
    const progressText = this.progressText;
    
    if (progressFill) {
      progressFill.style.width = `${maxProgress}%`;
    }
    
    if (progressText) {
      const percentage = Math.round(maxProgress);
      progressText.textContent = `${percentage}% Complete`;
      
      // Color coding
      if (percentage >= 100) {
        progressText.classList.add('complete');
      } else if (percentage >= 75) {
        progressText.classList.add('close');
      } else {
        progressText.classList.remove('complete', 'close');
      }
    }

    const difference = Math.abs(closestAmount - target);
    const now = Date.now();
    const key = `${closestBottleIndex}:${closestAmount}:${target}`;
    if (difference > 0 && difference <= 2 && this.lastNearTargetKey !== key && now - this.lastNearTargetAt > 2500) {
      this.showNearTargetNotification(closestBottleIndex, closestAmount, target);
      this.lastNearTargetAt = now;
      this.lastNearTargetKey = key;
    }
  }

  updateMoveProgress(currentMoves, par) {
    if (!par) return;
    
    const moveFill = this.moveIndicator.querySelector('.move-fill');
    const moveCurrent = this.moveIndicator.querySelector('.move-current');
    const currentLabel = this.moveIndicator.querySelector('.current-label');
    
    if (currentLabel) {
      currentLabel.textContent = `Moves: ${currentMoves}`;
    }
    
    // Calculate move zones
    const parZone = Math.min(100, (par / (par + 5)) * 100);
    const warningZone = Math.min(100, ((par + 2) / (par + 5)) * 100);
    
    // Update move indicator position
    const movePercentage = Math.min(100, (currentMoves / (par + 5)) * 100);
    
    if (moveCurrent) {
      moveCurrent.style.left = `${movePercentage}%`;
    }
    
    // Update zone visibility
    const parZoneEl = this.moveIndicator.querySelector('.par-zone');
    const warningZoneEl = this.moveIndicator.querySelector('.warning-zone');
    const dangerZoneEl = this.moveIndicator.querySelector('.danger-zone');
    
    if (currentMoves <= par) {
      // In par zone - green
      if (parZoneEl) parZoneEl.style.width = '100%';
      if (warningZoneEl) warningZoneEl.style.width = '0%';
      if (dangerZoneEl) dangerZoneEl.style.width = '0%';
    } else if (currentMoves <= par + 2) {
      // Warning zone - yellow
      if (parZoneEl) parZoneEl.style.width = `${parZone}%`;
      if (warningZoneEl) warningZoneEl.style.width = `${warningZone - parZone}%`;
      if (dangerZoneEl) dangerZoneEl.style.width = '0%';
    } else {
      // Danger zone - red
      if (parZoneEl) parZoneEl.style.width = `${parZone}%`;
      if (warningZoneEl) warningZoneEl.style.width = `${warningZone - parZone}%`;
      if (dangerZoneEl) dangerZoneEl.style.width = `${100 - warningZone}%`;
    }
  }

  updateStarPreview(currentMoves, par) {
    if (!par) return;
    
    const stars = this.calculateStars(currentMoves, par);
    
    // Update star display
    for (let i = 1; i <= 3; i++) {
      const starEl = this.starPreview.querySelector(`.star-${i}`);
      if (starEl) {
        if (i <= stars) {
          starEl.textContent = '⭐';
          starEl.classList.add('earned');
        } else {
          starEl.textContent = '☆';
          starEl.classList.remove('earned');
        }
      }
    }
  }

  calculateStars(moves, par) {
    if (window.DifficultySystem && typeof window.DifficultySystem.calculateStars === 'function') {
      return window.DifficultySystem.calculateStars(moves, par);
    }
    if (moves <= par) return 3;
    if (moves <= par + 2) return 2;
    return 1;
  }

  showNearTargetNotification(bottleIndex, currentAmount, targetAmount) {
    const difference = Math.abs(currentAmount - targetAmount);
    
    if (difference <= 2 && difference > 0) {
      const notification = document.createElement('div');
      notification.className = 'near-target-notification';
      notification.innerHTML = `
        <div class="notification-content">
          <span class="notification-icon">🎯</span>
          <span class="notification-text">Almost there! ${difference}L away from target</span>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Animate in
      requestAnimationFrame(() => {
        notification.classList.add('active');
      });
      
      // Remove after delay
      setTimeout(() => {
        notification.classList.remove('active');
        setTimeout(() => notification.remove(), 300);
      }, 2000);
    }
  }

  showPerfectMoveNotification() {
    const notification = document.createElement('div');
    notification.className = 'perfect-move-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">✨</span>
        <span class="notification-text">Perfect move!</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    requestAnimationFrame(() => {
      notification.classList.add('active');
    });
    
    setTimeout(() => {
      notification.classList.remove('active');
      setTimeout(() => notification.remove(), 300);
    }, 1500);
  }

  reset() {
    // Reset all progress indicators
    if (this.progressBar) {
      const progressFill = this.progressBar.querySelector('.progress-fill');
      if (progressFill) progressFill.style.width = '0%';
    }
    
    const progressText = this.progressText;
    if (progressText) {
      progressText.textContent = '0% Complete';
      progressText.classList.remove('complete', 'close');
    }
    
    // Reset stars
    for (let i = 1; i <= 3; i++) {
      const starEl = this.starPreview?.querySelector(`.star-${i}`);
      if (starEl) {
        starEl.textContent = '☆';
        starEl.classList.remove('earned');
      }
    }
    this.lastNearTargetAt = 0;
    this.lastNearTargetKey = '';
  }
}

// Create global instance
window.ProgressSystem = new ProgressSystem();
