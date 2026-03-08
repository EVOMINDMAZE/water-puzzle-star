/**
 * @fileoverview Error Prevention and Confirmation Dialogs for Water Puzzle Star
 * Provides user-friendly confirmation dialogs and error prevention mechanisms
 */

class DialogSystem {
  constructor() {
    this.activeDialog = null;
    this.dialogQueue = [];
    this.init();
  }

  init() {
    this.createDialogContainer();
    this.setupGlobalErrorHandling();
  }

  createDialogContainer() {
    const container = document.createElement('div');
    container.id = 'dialog-container';
    container.className = 'dialog-container';
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    container.setAttribute('aria-hidden', 'true');
    document.body.appendChild(container);
  }

  /**
   * Show a confirmation dialog
   * @param {Object} options - Dialog options
   * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
   */
  confirm(options) {
    return new Promise((resolve) => {
      const dialog = this.createDialog({
        type: 'confirm',
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        icon: options.icon || '⚠️',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        confirmClass: options.confirmClass || 'dialog-btn-primary',
        cancelClass: options.cancelClass || 'dialog-btn-secondary',
        dangerous: options.dangerous || false
      });
      
      dialog.onConfirm = () => resolve(true);
      dialog.onCancel = () => resolve(false);
      
      this.showDialog(dialog);
    });
  }

  /**
   * Show an alert dialog
   * @param {Object} options - Dialog options
   * @returns {Promise<void>} - Resolves when dismissed
   */
  alert(options) {
    return new Promise((resolve) => {
      const dialog = this.createDialog({
        type: 'alert',
        title: options.title || 'Notice',
        message: options.message || '',
        icon: options.icon || 'ℹ️',
        dismissText: options.dismissText || 'OK'
      });
      
      dialog.onDismiss = () => resolve();
      
      this.showDialog(dialog);
    });
  }

  /**
   * Show a custom dialog
   * @param {Object} options - Dialog options
   * @returns {Object} - Dialog controller
   */
  custom(options) {
    const dialog = this.createDialog({
      type: 'custom',
      title: options.title || '',
      content: options.content || '',
      buttons: options.buttons || [],
      width: options.width || 'auto',
      className: options.className || ''
    });
    
    this.showDialog(dialog);
    return dialog;
  }

  createDialog(options) {
    const dialog = {
      id: `dialog-${Date.now()}`,
      type: options.type,
      element: null,
      onConfirm: null,
      onCancel: null,
      onDismiss: null
    };
    
    const dialogEl = document.createElement('div');
    dialogEl.className = `dialog dialog-${options.type}`;
    if (options.className) {
      dialogEl.classList.add(options.className);
    }
    dialogEl.id = dialog.id;
    
    let buttonsHTML = '';
    
    if (options.type === 'confirm') {
      buttonsHTML = `
        <div class="dialog-buttons">
          <button class="dialog-btn ${options.cancelClass}" data-action="cancel">
            ${options.cancelText}
          </button>
          <button class="dialog-btn ${options.confirmClass} ${options.dangerous ? 'dangerous' : ''}" data-action="confirm">
            ${options.confirmText}
          </button>
        </div>
      `;
    } else if (options.type === 'alert') {
      buttonsHTML = `
        <div class="dialog-buttons">
          <button class="dialog-btn dialog-btn-primary" data-action="dismiss">
            ${options.dismissText}
          </button>
        </div>
      `;
    } else if (options.type === 'custom' && options.buttons) {
      buttonsHTML = `
        <div class="dialog-buttons">
          ${options.buttons.map((btn, index) => `
            <button class="dialog-btn ${btn.class || 'dialog-btn-secondary'}" data-action="${btn.action || index}">
              ${btn.text}
            </button>
          `).join('')}
        </div>
      `;
    }
    
    dialogEl.innerHTML = `
      <div class="dialog-backdrop"></div>
      <div class="dialog-content" style="width: ${options.width}">
        ${options.icon ? `<div class="dialog-icon">${options.icon}</div>` : ''}
        ${options.title ? `<h3 class="dialog-title">${options.title}</h3>` : ''}
        ${options.message ? `<p class="dialog-message">${options.message}</p>` : ''}
        ${options.content || ''}
        ${buttonsHTML}
      </div>
    `;
    
    // Event listeners
    dialogEl.querySelector('.dialog-backdrop').addEventListener('click', () => {
      this.handleDialogAction(dialog, 'cancel');
    });
    
    dialogEl.querySelectorAll('.dialog-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleDialogAction(dialog, action);
      });
    });
    
    // Keyboard support
    dialogEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleDialogAction(dialog, 'cancel');
      } else if (e.key === 'Enter') {
        const primaryBtn = dialogEl.querySelector('.dialog-btn-primary');
        if (primaryBtn) {
          primaryBtn.click();
        }
      }
    });
    
    dialog.element = dialogEl;
    return dialog;
  }

  showDialog(dialog) {
    const container = document.getElementById('dialog-container');
    if (!container) return;
    
    // Add to queue if another dialog is active
    if (this.activeDialog) {
      this.dialogQueue.push(dialog);
      return;
    }
    
    this.activeDialog = dialog;
    container.appendChild(dialog.element);
    container.setAttribute('aria-hidden', 'false');
    
    // Focus first button
    requestAnimationFrame(() => {
      const firstBtn = dialog.element.querySelector('.dialog-btn');
      if (firstBtn) firstBtn.focus();
      
      dialog.element.classList.add('active');
    });
  }

  handleDialogAction(dialog, action) {
    if (dialog.type === 'confirm') {
      if (action === 'confirm' && dialog.onConfirm) {
        dialog.onConfirm();
      } else if (action === 'cancel' && dialog.onCancel) {
        dialog.onCancel();
      }
    } else if (dialog.type === 'alert') {
      if (dialog.onDismiss) {
        dialog.onDismiss();
      }
    } else if (dialog.type === 'custom') {
      const button = dialog.buttons?.find(btn => btn.action === action);
      if (button?.onClick) {
        button.onClick(action);
      }
    }
    
    this.closeDialog(dialog);
  }

  closeDialog(dialog) {
    if (!dialog || !dialog.element) return;
    
    dialog.element.classList.remove('active');
    
    setTimeout(() => {
      dialog.element.remove();
      this.activeDialog = null;
      
      const container = document.getElementById('dialog-container');
      if (container && !container.children.length) {
        container.setAttribute('aria-hidden', 'true');
      }
      
      // Process next dialog in queue
      if (this.dialogQueue.length > 0) {
        const nextDialog = this.dialogQueue.shift();
        this.showDialog(nextDialog);
      }
    }, 300);
  }

  // Convenience methods for common dialogs
  async confirmRestart() {
    return this.confirm({
      title: 'Restart Level',
      message: 'Are you sure you want to restart this level? All progress will be lost.',
      icon: '🔄',
      confirmText: 'Restart',
      cancelText: 'Cancel',
      dangerous: true
    });
  }

  async confirmQuit() {
    return this.confirm({
      title: 'Quit Game',
      message: 'Are you sure you want to quit? Your progress will be saved.',
      icon: '🚪',
      confirmText: 'Quit',
      cancelText: 'Stay'
    });
  }

  async confirmSkipLevel() {
    return this.confirm({
      title: 'Skip Level',
      message: 'Skip this level and move to the next? You can come back later.',
      icon: '⏭️',
      confirmText: 'Skip',
      cancelText: 'Stay'
    });
  }

  showLevelComplete(stars, moves, par) {
    const starText = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const message = stars === 3 
      ? `Perfect! Completed in ${moves} moves (Par: ${par})`
      : stars === 2
      ? `Great job! Completed in ${moves} moves (Par: ${par})`
      : `Completed in ${moves} moves (Par: ${par})`;
    
    return this.alert({
      title: 'Level Complete!',
      message: `${starText}\n${message}`,
      icon: '🎉',
      dismissText: 'Continue'
    });
  }

  showNoHints() {
    return this.alert({
      title: 'No Hints Available',
      message: "You've used all your hints. Complete levels to earn more!",
      icon: '💡',
      dismissText: 'OK'
    });
  }

  showLockedLevel(requiredStars) {
    return this.alert({
      title: 'Level Locked',
      message: `You need ${requiredStars} stars to unlock this level.`,
      icon: '🔒',
      dismissText: 'OK'
    });
  }

  setupGlobalErrorHandling() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.alert({
        title: 'Oops! Something went wrong',
        message: 'An unexpected error occurred. Please try refreshing the page.',
        icon: '⚠️'
      });
    });
    
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled rejection:', event.reason);
      this.alert({
        title: 'Oops! Something went wrong',
        message: 'An unexpected error occurred. Please try refreshing the page.',
        icon: '⚠️'
      });
    });
  }
}

// Create global instance
window.DialogSystem = new DialogSystem();