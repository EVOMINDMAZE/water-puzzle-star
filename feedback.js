/**
 * @fileoverview Enhanced Feedback System for Water Puzzle Star
 * Provides visual, audio, and haptic feedback for all user interactions
 */

class FeedbackSystem {
  constructor() {
    this.feedbackQueue = [];
    this.isProcessing = false;
    this.audioEnabled = true;
    this.hapticEnabled = true;
    this.visualEnabled = true;
    this.infoEnabled = false;
    this.visibleFeedbackLimit = 2;
    this.suppressWindowMs = 1200;
    this.lastMessageTimestamps = new Map();
    
    this.init();
  }

  init() {
    this.createFeedbackContainer();
    this.loadPreferences();
  }

  createFeedbackContainer() {
    const container = document.createElement('div');
    container.id = 'feedback-container';
    container.className = 'feedback-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }

  loadPreferences() {
    this.audioEnabled = localStorage.getItem('water_puzzle_sound') !== 'false';
    this.hapticEnabled = localStorage.getItem('water_puzzle_haptic') !== 'false';
    this.visualEnabled = localStorage.getItem('water_puzzle_visual_feedback') !== 'false';
    this.infoEnabled = localStorage.getItem('water_puzzle_info_feedback') === 'true';
  }

  /**
   * Provide comprehensive feedback for an action
   * @param {Object} options - Feedback options
   * @param {string} options.type - Type of feedback (success, error, warning, info)
   * @param {string} options.message - Message to display
   * @param {number} options.duration - Duration in ms (default: 2000)
   * @param {boolean} options.audio - Whether to play audio
   * @param {boolean} options.haptic - Whether to vibrate
   * @param {Object} options.position - {x, y} for visual feedback
   */
  provide(options) {
    if ((options.type || 'info') === 'info' && !this.infoEnabled) {
      return;
    }

    const now = Date.now();
    const messageKey = `${options.type || 'info'}:${options.message || ''}`;
    const lastSeen = this.lastMessageTimestamps.get(messageKey) || 0;
    if (now - lastSeen < this.suppressWindowMs) {
      return;
    }
    this.lastMessageTimestamps.set(messageKey, now);

    const feedback = {
      id: now,
      type: options.type || 'info',
      message: options.message || '',
      duration: options.duration || 2000,
      audio: options.audio !== false && this.audioEnabled,
      haptic: options.haptic !== false && this.hapticEnabled,
      visual: options.visual !== false && this.visualEnabled,
      position: options.position || null,
      timestamp: now
    };

    if (this.feedbackQueue.length >= 8) {
      this.feedbackQueue.shift();
    }
    this.feedbackQueue.push(feedback);
    this.processQueue();
  }

  processQueue() {
    if (this.isProcessing || this.feedbackQueue.length === 0) return;
    
    this.isProcessing = true;
    const feedback = this.feedbackQueue.shift();
    
    this.executeFeedback(feedback);
    
    setTimeout(() => {
      this.isProcessing = false;
      this.processQueue();
    }, 300);
  }

  executeFeedback(feedback) {
    // Visual feedback
    if (feedback.visual) {
      this.showVisualFeedback(feedback);
    }
    
    // Audio feedback
    if (feedback.audio) {
      this.playAudioFeedback(feedback.type);
    }
    
    // Haptic feedback
    if (feedback.haptic) {
      this.triggerHapticFeedback(feedback.type);
    }
  }

  showVisualFeedback(feedback) {
    const container = document.getElementById('feedback-container');
    if (!container) return;

    while (container.children.length >= this.visibleFeedbackLimit) {
      container.removeChild(container.firstElementChild);
    }
    
    const feedbackEl = document.createElement('div');
    feedbackEl.className = `feedback-item feedback-${feedback.type}`;
    feedbackEl.innerHTML = `
      <div class="feedback-icon">${this.getIcon(feedback.type)}</div>
      <div class="feedback-message">${feedback.message}</div>
    `;
    
    // Position if specified
    if (feedback.position) {
      feedbackEl.style.left = `${feedback.position.x}px`;
      feedbackEl.style.top = `${feedback.position.y}px`;
    }
    
    container.appendChild(feedbackEl);
    
    // Animate in
    requestAnimationFrame(() => {
      feedbackEl.classList.add('active');
    });
    
    // Remove after duration
    setTimeout(() => {
      feedbackEl.classList.remove('active');
      setTimeout(() => feedbackEl.remove(), 300);
    }, feedback.duration);
  }

  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  playAudioFeedback(type) {
    if (!window.Audio || !window.Audio.ctx) return;
    
    try {
      const audio = window.Audio;
      audio.init();
      
      const ctx = audio.ctx;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      switch (type) {
        case 'success':
          oscillator.frequency.setValueAtTime(523.25, now); // C5
          oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
          gainNode.gain.setValueAtTime(0.1, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;
          
        case 'error':
          oscillator.frequency.setValueAtTime(200, now);
          oscillator.frequency.setValueAtTime(150, now + 0.1);
          gainNode.gain.setValueAtTime(0.1, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;
          
        case 'warning':
          oscillator.frequency.setValueAtTime(440, now);
          gainNode.gain.setValueAtTime(0.08, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          oscillator.start(now);
          oscillator.stop(now + 0.15);
          break;
          
        case 'info':
        default:
          oscillator.frequency.setValueAtTime(600, now);
          gainNode.gain.setValueAtTime(0.05, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          oscillator.start(now);
          oscillator.stop(now + 0.1);
          break;
      }
    } catch (error) {
      console.warn('Audio feedback failed:', error);
    }
  }

  triggerHapticFeedback(type) {
    if (!navigator.vibrate) return;
    
    try {
      switch (type) {
        case 'success':
          navigator.vibrate([50, 50, 50]);
          break;
        case 'error':
          navigator.vibrate([100, 50, 100]);
          break;
        case 'warning':
          navigator.vibrate([75]);
          break;
        case 'info':
        default:
          navigator.vibrate(25);
          break;
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  // Convenience methods
  success(message, options = {}) {
    this.provide({ type: 'success', message, ...options });
  }

  error(message, options = {}) {
    this.provide({ type: 'error', message, ...options });
  }

  warning(message, options = {}) {
    this.provide({ type: 'warning', message, ...options });
  }

  info(message, options = {}) {
    this.provide({ type: 'info', message, ...options });
  }

  // Specialized feedback for game actions
  pourSuccess(fromBottle, toBottle) {
  }

  pourError(reason) {
    const messages = {
      empty: 'Cannot pour from empty bottle',
      full: 'Destination bottle is full',
      invalid: 'Invalid pour action'
    };
    this.error(messages[reason] || 'Cannot pour', { duration: 2000 });
  }

  levelComplete(stars, moves, par) {
    const messages = {
      3: `Perfect! ${moves} moves (Par: ${par})`,
      2: `Great job! ${moves} moves (Par: ${par})`,
      1: `Level complete! ${moves} moves (Par: ${par})`
    };
    this.success(messages[stars], { duration: 3000 });
  }

  hintUsed(remaining) {
    this.info(`Hint used. ${remaining} hints remaining`, { duration: 1200, audio: false, haptic: false });
  }

  undoPerformed() {
    this.info('Move undone', { duration: 1000, audio: false, haptic: false });
  }

  levelRestarted() {
    this.info('Level restarted', { duration: 1000, audio: false, haptic: false });
  }
}

// Create global instance
window.FeedbackSystem = new FeedbackSystem();
