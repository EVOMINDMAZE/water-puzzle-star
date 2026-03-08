/**
 * @fileoverview Achievement System for Water Puzzle Star
 * Provides achievements, badges, and progression rewards
 */

class AchievementSystem {
  constructor() {
    this.achievements = this.defineAchievements();
    this.unlockedAchievements = new Set();
    this.achievementsOverlay = null;
    this.stats = {
      totalMoves: 0,
      levelsCompleted: 0,
      perfectLevels: 0,
      hintsUsed: 0,
      dailyStreak: 0,
      totalStars: 0,
      gamesPlayed: 0,
      undoUsed: 0,
      noHintLevels: 0,
      noUndoLevels: 0,
      fastCompletions: 0
    };
    
    this.init();
  }

  init() {
    this.loadAchievements();
    this.loadStats();
    this.createAchievementUI();
    this.setupEventListeners();
  }

  defineAchievements() {
    return {
      // Progression achievements
      first_win: {
        id: 'first_win',
        name: 'First Steps',
        description: 'Complete your first level',
        icon: '🎯',
        category: 'progression',
        reward: { stars: 5, hints: 1 }
      },
      level_10: {
        id: 'level_10',
        name: 'Getting Started',
        description: 'Complete 10 levels',
        icon: '🌟',
        category: 'progression',
        reward: { stars: 10, hints: 2 }
      },
      level_50: {
        id: 'level_50',
        name: 'Halfway There',
        description: 'Complete 50 levels',
        icon: '⭐',
        category: 'progression',
        reward: { stars: 25, hints: 5 }
      },
      level_100: {
        id: 'level_100',
        name: 'Century',
        description: 'Complete 100 levels',
        icon: '🏆',
        category: 'progression',
        reward: { stars: 50, hints: 10 }
      },
      level_500: {
        id: 'level_500',
        name: 'Puzzle Master',
        description: 'Complete 500 levels',
        icon: '👑',
        category: 'progression',
        reward: { stars: 100, hints: 20 }
      },
      level_1000: {
        id: 'level_1000',
        name: 'Legend',
        description: 'Complete all 1000 levels',
        icon: '💎',
        category: 'progression',
        reward: { stars: 500, hints: 50 }
      },
      
      // Performance achievements
      perfect_10: {
        id: 'perfect_10',
        name: 'Perfectionist',
        description: 'Get 3 stars on 10 levels',
        icon: '✨',
        category: 'performance',
        reward: { stars: 15, hints: 3 }
      },
      perfect_50: {
        id: 'perfect_50',
        name: 'Perfect Player',
        description: 'Get 3 stars on 50 levels',
        icon: '💫',
        category: 'performance',
        reward: { stars: 30, hints: 6 }
      },
      perfect_100: {
        id: 'perfect_100',
        name: 'Flawless',
        description: 'Get 3 stars on 100 levels',
        icon: '🌟',
        category: 'performance',
        reward: { stars: 60, hints: 12 }
      },
      speed_demon: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete 10 levels in under 10 seconds each',
        icon: '⚡',
        category: 'performance',
        reward: { stars: 20, hints: 4 }
      },
      
      // Challenge achievements
      no_hints_10: {
        id: 'no_hints_10',
        name: 'Independent Thinker',
        description: 'Complete 10 levels without using hints',
        icon: '🧠',
        category: 'challenge',
        reward: { stars: 15, hints: 0 }
      },
      no_hints_50: {
        id: 'no_hints_50',
        name: 'Master Solver',
        description: 'Complete 50 levels without using hints',
        icon: '🎓',
        category: 'challenge',
        reward: { stars: 40, hints: 0 }
      },
      no_undo_10: {
        id: 'no_undo_10',
        name: 'No Regrets',
        description: 'Complete 10 levels without using undo',
        icon: '💪',
        category: 'challenge',
        reward: { stars: 15, hints: 3 }
      },
      
      // Daily challenge achievements
      daily_7: {
        id: 'daily_7',
        name: 'Week Warrior',
        description: 'Complete daily challenges 7 days in a row',
        icon: '📅',
        category: 'daily',
        reward: { stars: 20, hints: 5 }
      },
      daily_30: {
        id: 'daily_30',
        name: 'Monthly Master',
        description: 'Complete daily challenges 30 days in a row',
        icon: '🗓️',
        category: 'daily',
        reward: { stars: 50, hints: 10 }
      },
      
      // Special achievements
      world_1_complete: {
        id: 'world_1_complete',
        name: 'World 1 Champion',
        description: 'Complete all levels in World 1',
        icon: '🌍',
        category: 'special',
        reward: { stars: 30, hints: 5 }
      },
      all_worlds_complete: {
        id: 'all_worlds_complete',
        name: 'World Traveler',
        description: 'Complete all worlds',
        icon: '🗺️',
        category: 'special',
        reward: { stars: 200, hints: 25 }
      },
      star_collector_100: {
        id: 'star_collector_100',
        name: 'Star Collector',
        description: 'Earn 100 stars total',
        icon: '⭐',
        category: 'special',
        reward: { stars: 10, hints: 2 }
      },
      star_collector_500: {
        id: 'star_collector_500',
        name: 'Star Hoarder',
        description: 'Earn 500 stars total',
        icon: '🌟',
        category: 'special',
        reward: { stars: 25, hints: 5 }
      },
      star_collector_1000: {
        id: 'star_collector_1000',
        name: 'Star King',
        description: 'Earn 1000 stars total',
        icon: '👑',
        category: 'special',
        reward: { stars: 50, hints: 10 }
      }
    };
  }

  loadAchievements() {
    const saved = localStorage.getItem('water_puzzle_achievements');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        this.unlockedAchievements = new Set(arr);
      } catch (e) {
        this.unlockedAchievements = new Set();
      }
    }
  }

  loadStats() {
    const numericKeys = Object.keys(this.stats);
    const normalizedStats = {};
    numericKeys.forEach((key) => {
      normalizedStats[key] = 0;
    });
    const saved = localStorage.getItem('water_puzzle_stats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        numericKeys.forEach((key) => {
          const value = Number(parsed?.[key]);
          normalizedStats[key] = Number.isFinite(value) && value >= 0 ? Math.floor(value) : this.stats[key];
        });
      } catch (e) {
        numericKeys.forEach((key) => {
          normalizedStats[key] = this.stats[key];
        });
      }
    } else {
      numericKeys.forEach((key) => {
        normalizedStats[key] = this.stats[key];
      });
    }
    this.stats = normalizedStats;
  }

  saveStats() {
    localStorage.setItem('water_puzzle_stats', JSON.stringify(this.stats));
  }

  saveAchievements() {
    localStorage.setItem('water_puzzle_achievements', JSON.stringify([...this.unlockedAchievements]));
  }

  createAchievementUI() {
    const topHud = document.getElementById('top-hud');
    if (!topHud) return;
    const utilityTray = document.getElementById('top-utilities-tray');
    
    const achievementsBtn = document.createElement('button');
    achievementsBtn.className = 'hud-pill achievements-btn';
    achievementsBtn.innerHTML = `
      <span class="hud-label">Badges</span>
      <span class="hud-value">${this.unlockedAchievements.size}/${Object.keys(this.achievements).length}</span>
    `;
    achievementsBtn.setAttribute('aria-label', 'View achievements');
    achievementsBtn.style.cursor = 'pointer';
    
    achievementsBtn.addEventListener('click', () => this.showAchievements());
    (utilityTray || topHud).appendChild(achievementsBtn);
    
    this.achievementsBtn = achievementsBtn;
  }

  setupEventListeners() {
    window.addEventListener('levelComplete', (e) => {
      this.onLevelComplete(e.detail);
    });
    
    window.addEventListener('hintUsed', () => {
      this.stats.hintsUsed++;
      this.saveStats();
    });
    
    window.addEventListener('undoUsed', () => {
      this.stats.undoUsed++;
      this.saveStats();
    });

    window.addEventListener('dailyChallengeComplete', (e) => {
      const streak = e?.detail?.streak;
      if (Number.isInteger(streak)) {
        this.stats.dailyStreak = streak;
        this.saveStats();
        this.checkAchievements({});
      }
    });
  }

  onLevelComplete(data) {
    const moves = Number.isFinite(data?.moves) ? data.moves : 0;
    const stars = Number.isFinite(data?.stars) ? data.stars : 1;
    const durationSec = Number.isFinite(data?.durationSec) ? data.durationSec : Infinity;
    this.stats.levelsCompleted++;
    this.stats.totalMoves += Math.max(0, moves);
    this.stats.gamesPlayed++;
    this.stats.totalStars = parseInt(localStorage.getItem('water_puzzle_stars') || '0', 10);
    
    if (stars === 3) {
      this.stats.perfectLevels++;
    }

    if (!data?.usedHint) {
      this.stats.noHintLevels++;
    }

    if (!data?.usedUndo) {
      this.stats.noUndoLevels++;
    }

    if (durationSec <= 10) {
      this.stats.fastCompletions++;
    }
    
    this.saveStats();
    this.checkAchievements(data);
  }

  checkAchievements(levelData) {
    const newAchievements = [];
    
    // Check progression achievements
    if (this.stats.levelsCompleted >= 1 && !this.unlockedAchievements.has('first_win')) {
      newAchievements.push('first_win');
    }
    if (this.stats.levelsCompleted >= 10 && !this.unlockedAchievements.has('level_10')) {
      newAchievements.push('level_10');
    }
    if (this.stats.levelsCompleted >= 50 && !this.unlockedAchievements.has('level_50')) {
      newAchievements.push('level_50');
    }
    if (this.stats.levelsCompleted >= 100 && !this.unlockedAchievements.has('level_100')) {
      newAchievements.push('level_100');
    }
    if (this.stats.levelsCompleted >= 500 && !this.unlockedAchievements.has('level_500')) {
      newAchievements.push('level_500');
    }
    if (this.stats.levelsCompleted >= 1000 && !this.unlockedAchievements.has('level_1000')) {
      newAchievements.push('level_1000');
    }
    
    // Check performance achievements
    if (this.stats.perfectLevels >= 10 && !this.unlockedAchievements.has('perfect_10')) {
      newAchievements.push('perfect_10');
    }
    if (this.stats.perfectLevels >= 50 && !this.unlockedAchievements.has('perfect_50')) {
      newAchievements.push('perfect_50');
    }
    if (this.stats.perfectLevels >= 100 && !this.unlockedAchievements.has('perfect_100')) {
      newAchievements.push('perfect_100');
    }
    if (this.stats.fastCompletions >= 10 && !this.unlockedAchievements.has('speed_demon')) {
      newAchievements.push('speed_demon');
    }

    if (this.stats.noHintLevels >= 10 && !this.unlockedAchievements.has('no_hints_10')) {
      newAchievements.push('no_hints_10');
    }
    if (this.stats.noHintLevels >= 50 && !this.unlockedAchievements.has('no_hints_50')) {
      newAchievements.push('no_hints_50');
    }
    if (this.stats.noUndoLevels >= 10 && !this.unlockedAchievements.has('no_undo_10')) {
      newAchievements.push('no_undo_10');
    }

    if (this.stats.dailyStreak >= 7 && !this.unlockedAchievements.has('daily_7')) {
      newAchievements.push('daily_7');
    }
    if (this.stats.dailyStreak >= 30 && !this.unlockedAchievements.has('daily_30')) {
      newAchievements.push('daily_30');
    }
    
    // Check star achievements
    const totalStars = parseInt(localStorage.getItem('water_puzzle_stars') || '0');
    if (totalStars >= 100 && !this.unlockedAchievements.has('star_collector_100')) {
      newAchievements.push('star_collector_100');
    }
    if (totalStars >= 500 && !this.unlockedAchievements.has('star_collector_500')) {
      newAchievements.push('star_collector_500');
    }
    if (totalStars >= 1000 && !this.unlockedAchievements.has('star_collector_1000')) {
      newAchievements.push('star_collector_1000');
    }

    if (this.isWorldComplete(1) && !this.unlockedAchievements.has('world_1_complete')) {
      newAchievements.push('world_1_complete');
    }
    if (this.isAllWorldsComplete() && !this.unlockedAchievements.has('all_worlds_complete')) {
      newAchievements.push('all_worlds_complete');
    }
    
    // Unlock new achievements
    newAchievements.forEach(id => this.unlockAchievement(id));
  }

  isWorldComplete(worldNumber) {
    const startIndex = (worldNumber - 1) * 20;
    const endIndex = startIndex + 20;
    for (let i = startIndex; i < endIndex; i++) {
      const stars = parseInt(localStorage.getItem(`level_${i}_stars`) || '0', 10);
      if (!Number.isFinite(stars) || stars <= 0) return false;
    }
    return true;
  }

  isAllWorldsComplete() {
    if (!Array.isArray(window.LEVELS) || window.LEVELS.length === 0) return false;
    for (let i = 0; i < window.LEVELS.length; i++) {
      const stars = parseInt(localStorage.getItem(`level_${i}_stars`) || '0', 10);
      if (!Number.isFinite(stars) || stars <= 0) return false;
    }
    return true;
  }

  unlockAchievement(achievementId) {
    if (this.unlockedAchievements.has(achievementId)) return;
    
    const achievement = this.achievements[achievementId];
    if (!achievement) return;
    
    this.unlockedAchievements.add(achievementId);
    this.saveAchievements();
    
    // Award rewards
    if (achievement.reward) {
      const stars = Math.max(0, Math.floor(Number(achievement.reward.stars) || 0));
      const hints = Math.max(0, Math.floor(Number(achievement.reward.hints) || 0));
      if (window.MonetizationSystem && typeof window.MonetizationSystem.grantRewards === 'function') {
        window.MonetizationSystem.grantRewards({ stars, hints }, {
          source: 'achievement_unlock',
          achievementId
        });
      } else {
        const totalStars = parseInt(localStorage.getItem('water_puzzle_stars') || '0', 10);
        localStorage.setItem('water_puzzle_stars', String(totalStars + stars));
        const hintBalance = parseInt(localStorage.getItem('water_puzzle_hints') || '0', 10);
        localStorage.setItem('water_puzzle_hints', String(hintBalance + hints));
      }
    }
    
    // Show notification
    this.showAchievementNotification(achievement);
    
    // Update UI
    this.updateAchievementButton();
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('achievementUnlocked', {
      detail: achievement
    }));
  }

  showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-content">
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
          <div class="achievement-title">Achievement Unlocked!</div>
          <div class="achievement-name">${achievement.name}</div>
          <div class="achievement-reward">
            +${achievement.reward?.stars || 0} ⭐ +${achievement.reward?.hints || 0} 💡
          </div>
        </div>
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
      setTimeout(() => notification.remove(), 500);
    }, 4000);
  }

  updateAchievementButton() {
    if (this.achievementsBtn) {
      const value = this.achievementsBtn.querySelector('.hud-value');
      if (value) {
        value.textContent = `${this.unlockedAchievements.size}/${Object.keys(this.achievements).length}`;
      }
    }
  }

  showAchievements() {
    if (this.achievementsOverlay?.isConnected) return;
    const existingOverlay = document.querySelector('.achievements-overlay');
    if (existingOverlay) {
      this.achievementsOverlay = existingOverlay;
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'achievements-overlay';
    
    const categories = ['progression', 'performance', 'challenge', 'daily', 'special'];
    
    overlay.innerHTML = `
      <div class="achievements-backdrop"></div>
      <div class="achievements-content">
        <div class="achievements-header">
          <h2>🏆 Achievements</h2>
          <button class="achievements-close">&times;</button>
        </div>
        
        <div class="achievements-stats">
          <div class="stat">
            <span class="stat-value">${this.stats.levelsCompleted}</span>
            <span class="stat-label">Levels</span>
          </div>
          <div class="stat">
            <span class="stat-value">${this.stats.perfectLevels}</span>
            <span class="stat-label">Perfect</span>
          </div>
          <div class="stat">
            <span class="stat-value">${this.stats.totalMoves}</span>
            <span class="stat-label">Moves</span>
          </div>
        </div>
        
        <div class="achievements-list">
          ${categories.map(category => `
            <div class="achievement-category">
              <h3 class="category-title">${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
              <div class="category-items">
                ${Object.values(this.achievements)
                  .filter(a => a.category === category)
                  .map(a => `
                    <div class="achievement-item ${this.unlockedAchievements.has(a.id) ? 'unlocked' : 'locked'}">
                      <div class="item-icon">${this.unlockedAchievements.has(a.id) ? a.icon : '🔒'}</div>
                      <div class="item-info">
                        <div class="item-name">${a.name}</div>
                        <div class="item-description">${a.description}</div>
                        ${this.unlockedAchievements.has(a.id) ? `
                          <div class="item-reward">+${a.reward?.stars || 0} ⭐ +${a.reward?.hints || 0} 💡</div>
                        ` : ''}
                      </div>
                    </div>
                  `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    this.achievementsOverlay = overlay;

    const closeOverlay = () => {
      if (!overlay.isConnected) return;
      overlay.remove();
      if (this.achievementsOverlay === overlay) {
        this.achievementsOverlay = null;
      }
    };
    
    // Event listeners
    overlay.querySelector('.achievements-close').addEventListener('click', () => {
      closeOverlay();
    });
    
    overlay.querySelector('.achievements-backdrop').addEventListener('click', () => {
      closeOverlay();
    });
    
    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
  }

  getProgress() {
    return {
      unlocked: this.unlockedAchievements.size,
      total: Object.keys(this.achievements).length,
      percentage: Math.round((this.unlockedAchievements.size / Object.keys(this.achievements).length) * 100)
    };
  }
}

// Create global instance
window.AchievementSystem = new AchievementSystem();
