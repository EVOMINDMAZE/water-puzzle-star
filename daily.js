/**
 * @fileoverview Daily Challenge System for Water Puzzle Star
 * Provides unique daily puzzles with special constraints and rewards
 */

class DailyChallengeSystem {
  constructor() {
    this.todayChallenge = null;
    this.streak = 0;
    this.completedToday = false;
    this.challengeHistory = [];
    this.dailyOverlay = null;
    this.retentionConfig = this.getDefaultRetentionConfig();
    this.claimedMilestones = {};
    this.liveOpsStorageKey = 'water_puzzle_liveops_config';
    this.streakStorageKey = 'water_puzzle_daily_streak';
    this.lastCompletionStorageKey = 'water_puzzle_daily_last_completion';
    this.claimedMilestonesStorageKey = 'water_puzzle_daily_claimed_milestones';
    
    this.init();
  }

  init() {
    this.loadRetentionConfig();
    this.loadClaimedMilestones();
    this.loadStreak();
    this.loadHistory();
    this.generateDailyChallenge();
    this.createDailyChallengeUI();
    this.checkForNewDay();
  }

  getDefaultRetentionConfig() {
    return {
      streakResetPolicy: 'reset_on_miss',
      streakMilestones: [
        { days: 3, rewards: { stars: 5, hints: 1 } },
        { days: 7, rewards: { stars: 12, hints: 2 } },
        { days: 14, rewards: { stars: 24, hints: 4 } },
        { days: 30, rewards: { stars: 50, hints: 8 } }
      ],
      liveEvents: []
    };
  }

  loadRetentionConfig() {
    const fromWindow = window.WATER_PUZZLE_LIVEOPS_CONFIG;
    const fromStorage = localStorage.getItem(this.liveOpsStorageKey);
    let parsedStorage = null;
    if (fromStorage) {
      try {
        parsedStorage = JSON.parse(fromStorage);
      } catch (_) {
        this.recordDiagnostic('liveops_config_parse_failed', {
          storageKey: this.liveOpsStorageKey
        });
      }
    }
    const sourceConfig = parsedStorage && typeof parsedStorage === 'object'
      ? parsedStorage
      : (fromWindow && typeof fromWindow === 'object' ? fromWindow : {});
    const normalized = this.normalizeRetentionConfig(sourceConfig);
    this.retentionConfig = normalized;
  }

  normalizeRetentionConfig(sourceConfig) {
    const fallback = this.getDefaultRetentionConfig();
    const resetPolicy = sourceConfig?.streakResetPolicy === 'grace_day'
      ? 'grace_day'
      : 'reset_on_miss';

    const rawMilestones = Array.isArray(sourceConfig?.streakMilestones)
      ? sourceConfig.streakMilestones
      : fallback.streakMilestones;
    const streakMilestones = rawMilestones
      .map((milestone) => ({
        days: Math.max(1, Math.floor(Number(milestone?.days) || 0)),
        rewards: {
          stars: Math.max(0, Math.floor(Number(milestone?.rewards?.stars) || 0)),
          hints: Math.max(0, Math.floor(Number(milestone?.rewards?.hints) || 0))
        }
      }))
      .filter((milestone) => milestone.days > 0)
      .sort((a, b) => a.days - b.days);

    if (!streakMilestones.length) {
      this.recordDiagnostic('streak_milestones_invalid', {});
    }

    const rawEvents = Array.isArray(sourceConfig?.liveEvents)
      ? sourceConfig.liveEvents
      : fallback.liveEvents;
    const liveEvents = rawEvents
      .map((event, index) => {
        const startAt = Date.parse(event?.startAt || '');
        const endAt = Date.parse(event?.endAt || '');
        const hasValidRange = Number.isFinite(startAt) && Number.isFinite(endAt) && startAt <= endAt;
        if (!hasValidRange) {
          this.recordDiagnostic('live_event_window_invalid', {
            eventId: typeof event?.id === 'string' ? event.id : `event_${index}`
          });
          return null;
        }
        return {
          id: typeof event?.id === 'string' && event.id ? event.id : `event_${index}`,
          title: typeof event?.title === 'string' && event.title ? event.title : 'Limited-Time Event',
          startAt,
          endAt,
          rewards: {
            stars: Math.max(0, Math.floor(Number(event?.rewards?.stars) || 0)),
            hints: Math.max(0, Math.floor(Number(event?.rewards?.hints) || 0))
          }
        };
      })
      .filter(Boolean);

    if (rawEvents.length && !liveEvents.length) {
      this.recordDiagnostic('live_events_fallback_applied', {
        reason: 'all_events_invalid'
      });
    }

    return {
      streakResetPolicy: resetPolicy,
      streakMilestones: streakMilestones.length ? streakMilestones : fallback.streakMilestones,
      liveEvents
    };
  }

  recordDiagnostic(code, detail) {
    if (window.DiagnosticsSystem && typeof window.DiagnosticsSystem.record === 'function') {
      window.DiagnosticsSystem.record(code, detail, 'warning');
    }
  }

  loadClaimedMilestones() {
    const saved = localStorage.getItem(this.claimedMilestonesStorageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      this.claimedMilestones = parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      this.claimedMilestones = {};
    }
  }

  saveClaimedMilestones() {
    localStorage.setItem(this.claimedMilestonesStorageKey, JSON.stringify(this.claimedMilestones));
  }

  loadStreak() {
    const parsed = Number(localStorage.getItem(this.streakStorageKey) || 0);
    this.streak = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
    this.applyStreakResetPolicy();
  }

  loadHistory() {
    const saved = localStorage.getItem('water_puzzle_daily_history');
    if (saved) {
      try {
        this.challengeHistory = JSON.parse(saved);
      } catch (e) {
        this.challengeHistory = [];
      }
    }
  }

  generateDailyChallenge() {
    const today = this.getTodayString();
    this.applyStreakResetPolicy(today);
    
    // Check if we already have today's challenge
    const existingChallenge = this.challengeHistory.find(c => c.date === today);
    if (existingChallenge) {
      this.todayChallenge = existingChallenge;
      this.completedToday = existingChallenge.completed;
      return;
    }
    
    // Generate new challenge based on date seed
    const seed = this.hashCode(today);
    const challenge = this.createChallengeFromSeed(seed);
    
    this.todayChallenge = {
      date: today,
      level: challenge.level,
      constraints: challenge.constraints,
      rewards: challenge.rewards,
      eventRewards: challenge.eventRewards,
      activeEvents: challenge.activeEvents,
      completed: false,
      stars: 0,
      moves: 0
    };
    
    this.completedToday = false;
  }

  getTodayString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  applyStreakResetPolicy(todayValue = this.getTodayString()) {
    const lastCompletion = localStorage.getItem(this.lastCompletionStorageKey);
    if (!lastCompletion) return;
    const dayDelta = this.dayDifference(lastCompletion, todayValue);
    const policy = this.retentionConfig.streakResetPolicy;
    const shouldReset = policy === 'grace_day' ? dayDelta > 2 : dayDelta > 1;
    if (shouldReset && !this.completedToday && this.streak > 0) {
      this.streak = 0;
      localStorage.setItem(this.streakStorageKey, String(this.streak));
      this.recordDiagnostic('streak_reset_applied', {
        policy,
        dayDelta
      });
    }
  }

  dayDifference(fromDateStr, toDateStr) {
    const from = Date.parse(`${fromDateStr}T00:00:00`);
    const to = Date.parse(`${toDateStr}T00:00:00`);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
    return Math.floor((to - from) / 86400000);
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  createChallengeFromSeed(seed) {
    // Use seed to generate deterministic challenge
    const random = this.seededRandom(seed);
    
    // Select level based on seed
    const levelIndex = Math.floor(random() * 100); // First 100 levels for daily
    
    // Generate constraints
    const constraints = [];
    
    // Random constraint types
    if (random() > 0.7) {
      constraints.push({
        type: 'time_limit',
        value: 60 + Math.floor(random() * 60), // 60-120 seconds
        description: 'Time limit'
      });
    }
    
    if (random() > 0.8) {
      constraints.push({
        type: 'move_limit',
        value: 10 + Math.floor(random() * 10), // 10-20 moves
        description: 'Move limit'
      });
    }
    
    if (random() > 0.9) {
      constraints.push({
        type: 'no_hints',
        description: 'No hints allowed'
      });
    }
    
    // Generate rewards
    const baseReward = 5;
    const bonusMultiplier = constraints.length;
    const activeEvents = this.getActiveLiveEvents();
    const eventRewards = activeEvents.map((event) => ({
      eventId: event.id,
      title: event.title,
      stars: event.rewards.stars,
      hints: event.rewards.hints
    }));

    const rewards = {
      stars: baseReward + bonusMultiplier * 2,
      hints: Math.floor(random() * 3) + 1,
      bonus: constraints.length > 0 ? 'Special badge' : null
    };
    
    return {
      level: levelIndex,
      constraints,
      rewards,
      eventRewards,
      activeEvents: activeEvents.map((event) => ({
        id: event.id,
        title: event.title,
        startAt: event.startAt,
        endAt: event.endAt
      }))
    };
  }

  getActiveLiveEvents(referenceTime = Date.now()) {
    return this.retentionConfig.liveEvents.filter((event) => referenceTime >= event.startAt && referenceTime <= event.endAt);
  }

  seededRandom(seed) {
    let s = seed;
    return function() {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }

  createDailyChallengeUI() {
    const topHud = document.getElementById('top-hud');
    if (!topHud) return;
    const utilityTray = document.getElementById('top-utilities-tray');
    
    const dailyBtn = document.createElement('button');
    dailyBtn.className = 'hud-pill daily-challenge-btn';
    dailyBtn.innerHTML = `
      <span class="hud-label">Daily</span>
      <span class="hud-value">${this.completedToday ? '✓' : '🎯'}</span>
    `;
    dailyBtn.setAttribute('aria-label', 'Play daily challenge');
    dailyBtn.style.cursor = 'pointer';
    
    dailyBtn.addEventListener('click', () => this.showDailyChallenge());
    (utilityTray || topHud).appendChild(dailyBtn);
    
    this.dailyBtn = dailyBtn;
  }

  showDailyChallenge() {
    if (!this.todayChallenge) return;
    if (this.dailyOverlay?.isConnected) return;
    const existingOverlay = document.querySelector('.daily-challenge-overlay');
    if (existingOverlay) {
      this.dailyOverlay = existingOverlay;
      return;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'daily-challenge-overlay';
    const nextMilestone = this.getNextMilestone();
    const activeEvents = Array.isArray(this.todayChallenge.activeEvents) ? this.todayChallenge.activeEvents : [];
    overlay.innerHTML = `
      <div class="daily-backdrop"></div>
      <div class="daily-content">
        <div class="daily-header">
          <h2>📅 Daily Challenge</h2>
          <div class="streak-badge">
            <span class="streak-count">🔥 ${this.streak} day streak</span>
          </div>
        </div>
        
        <div class="daily-info">
          <div class="challenge-date">${this.formatDate(this.todayChallenge.date)}</div>
          
          ${this.todayChallenge.constraints.length > 0 ? `
            <div class="challenge-constraints">
              <h3>Special Constraints</h3>
              ${this.todayChallenge.constraints.map(c => `
                <div class="constraint">
                  <span class="constraint-icon">⚡</span>
                  <span class="constraint-text">${c.description}${c.value ? `: ${c.value}` : ''}</span>
                </div>
              `).join('')}
            </div>
          ` : '<p class="no-constraints">Standard challenge - no special constraints today!</p>'}

          ${nextMilestone ? `
            <div class="challenge-constraints">
              <h3>Streak Milestone</h3>
              <div class="constraint">
                <span class="constraint-icon">🔥</span>
                <span class="constraint-text">${nextMilestone.days}-day reward: +${nextMilestone.rewards.stars} stars, +${nextMilestone.rewards.hints} hints</span>
              </div>
            </div>
          ` : ''}

          ${activeEvents.length ? `
            <div class="challenge-constraints">
              <h3>Active Events</h3>
              ${activeEvents.map(event => `
                <div class="constraint">
                  <span class="constraint-icon">🎉</span>
                  <span class="constraint-text">${event.title} is live</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <div class="challenge-rewards">
            <h3>Rewards</h3>
            <div class="rewards-list">
              <div class="reward">
                <span class="reward-icon">⭐</span>
                <span class="reward-text">${this.todayChallenge.rewards.stars} Stars</span>
              </div>
              <div class="reward">
                <span class="reward-icon">💡</span>
                <span class="reward-text">${this.todayChallenge.rewards.hints} Hints</span>
              </div>
              ${this.todayChallenge.rewards.bonus ? `
                <div class="reward bonus">
                  <span class="reward-icon">🏆</span>
                  <span class="reward-text">${this.todayChallenge.rewards.bonus}</span>
                </div>
              ` : ''}
              ${(Array.isArray(this.todayChallenge.eventRewards) ? this.todayChallenge.eventRewards : []).map((reward) => `
                <div class="reward bonus">
                  <span class="reward-icon">🎉</span>
                  <span class="reward-text">${reward.title}: +${reward.stars} stars, +${reward.hints} hints</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div class="daily-actions">
          ${this.completedToday ? `
            <div class="completed-message">
              <span class="completed-icon">✅</span>
              <span>Completed today!</span>
              <div class="completed-stats">
                Stars: ${this.todayChallenge.stars} | Moves: ${this.todayChallenge.moves}
              </div>
            </div>
          ` : `
            <button class="start-challenge-btn">Start Challenge</button>
          `}
          <button class="close-daily-btn">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    this.dailyOverlay = overlay;

    const closeOverlay = () => {
      if (!overlay.isConnected) return;
      overlay.remove();
      if (this.dailyOverlay === overlay) {
        this.dailyOverlay = null;
      }
    };
    
    // Event listeners
    overlay.querySelector('.close-daily-btn').addEventListener('click', () => {
      closeOverlay();
    });
    
    overlay.querySelector('.daily-backdrop').addEventListener('click', () => {
      closeOverlay();
    });
    
    const startBtn = overlay.querySelector('.start-challenge-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        closeOverlay();
        this.startDailyChallenge();
      });
    }
    
    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getNextMilestone() {
    return this.retentionConfig.streakMilestones.find((milestone) => {
      const key = String(milestone.days);
      return milestone.days > this.streak && !this.claimedMilestones[key];
    }) || null;
  }

  startDailyChallenge() {
    if (this.completedToday) return;
    
    // Load the daily challenge level
    if (window.initLevel) {
      window.initLevel(this.todayChallenge.level);
    }
    
    // Apply constraints
    this.applyConstraints(this.todayChallenge.constraints);
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('dailyChallengeStart', {
      detail: this.todayChallenge
    }));
  }

  applyConstraints(constraints) {
    constraints.forEach(constraint => {
      switch (constraint.type) {
        case 'time_limit':
          // Start timer
          this.startTimeLimit(constraint.value);
          break;
        case 'move_limit':
          // Set move limit
          this.moveLimit = constraint.value;
          break;
        case 'no_hints':
          // Disable hints
          if (window.hintCount !== undefined) {
            window.hintCount = 0;
          }
          break;
      }
    });
  }

  startTimeLimit(seconds) {
    // Create timer UI
    const timerEl = document.createElement('div');
    timerEl.className = 'challenge-timer';
    timerEl.innerHTML = `
      <div class="timer-display">
        <span class="timer-icon">⏱️</span>
        <span class="timer-value">${seconds}s</span>
      </div>
    `;
    
    const topHud = document.getElementById('top-hud');
    if (topHud) {
      topHud.appendChild(timerEl);
    }
    
    // Start countdown
    let remaining = seconds;
    const interval = setInterval(() => {
      remaining--;
      
      const timerValue = timerEl.querySelector('.timer-value');
      if (timerValue) {
        timerValue.textContent = `${remaining}s`;
      }
      
      if (remaining <= 10) {
        timerEl.classList.add('warning');
      }
      
      if (remaining <= 0) {
        clearInterval(interval);
        this.onTimeUp();
      }
    }, 1000);
    
    this.timerInterval = interval;
  }

  onTimeUp() {
    // Time's up - show failure
    if (window.DialogSystem) {
      window.DialogSystem.alert({
        title: 'Time\'s Up! ⏰',
        message: 'You ran out of time. Try again tomorrow!',
        icon: '⏰'
      });
    }
    
    // Reset level
    if (window.initLevel) {
      window.initLevel(this.todayChallenge.level);
    }
  }

  completeDailyChallenge(stars, moves) {
    if (this.completedToday) return;
    
    this.completedToday = true;
    this.todayChallenge.completed = true;
    this.todayChallenge.stars = stars;
    this.todayChallenge.moves = moves;
    
    // Update streak
    this.streak++;
    localStorage.setItem(this.streakStorageKey, String(this.streak));
    localStorage.setItem(this.lastCompletionStorageKey, this.todayChallenge.date);
    
    // Award rewards
    this.grantRewards({
      stars: this.todayChallenge.rewards.stars,
      hints: this.todayChallenge.rewards.hints,
      source: 'daily_challenge'
    });

    if (Array.isArray(this.todayChallenge.eventRewards)) {
      this.todayChallenge.eventRewards.forEach((reward) => {
        this.grantRewards({
          stars: reward.stars,
          hints: reward.hints,
          source: 'live_event',
          eventId: reward.eventId
        });
        window.dispatchEvent(new CustomEvent('liveEventRewardGranted', {
          detail: {
            eventId: reward.eventId,
            title: reward.title,
            stars: reward.stars,
            hints: reward.hints
          }
        }));
      });
    }

    this.claimStreakMilestones();
    
    // Save to history
    this.challengeHistory.push(this.todayChallenge);
    localStorage.setItem('water_puzzle_daily_history', JSON.stringify(this.challengeHistory));
    
    // Update UI
    if (this.dailyBtn) {
      const value = this.dailyBtn.querySelector('.hud-value');
      if (value) {
        value.textContent = '✓';
      }
    }
    
    // Clear timer if exists
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    // Show celebration
    if (window.FeedbackSystem) {
      const bonusLines = (this.todayChallenge.eventRewards || [])
        .map((reward) => `${reward.title}: +${reward.stars}⭐ +${reward.hints}💡`)
        .join(' • ');
      const summary = bonusLines
        ? `Daily challenge complete! +${this.todayChallenge.rewards.stars} stars, +${this.todayChallenge.rewards.hints} hints. ${bonusLines}`
        : `Daily challenge complete! +${this.todayChallenge.rewards.stars} stars, +${this.todayChallenge.rewards.hints} hints`;
      window.FeedbackSystem.success(summary);
    }
  }

  grantRewards({ stars = 0, hints = 0, source = 'daily_challenge', eventId = null }) {
    const safeStars = Math.max(0, Math.floor(Number(stars) || 0));
    const safeHints = Math.max(0, Math.floor(Number(hints) || 0));
    if (window.MonetizationSystem && typeof window.MonetizationSystem.grantRewards === 'function') {
      window.MonetizationSystem.grantRewards({ stars: safeStars, hints: safeHints }, { source, eventId });
    } else if (safeStars > 0) {
      const totalStars = parseInt(localStorage.getItem('water_puzzle_stars') || '0', 10);
      localStorage.setItem('water_puzzle_stars', String(totalStars + safeStars));
      const hintsBalance = parseInt(localStorage.getItem('water_puzzle_hints') || '0', 10);
      localStorage.setItem('water_puzzle_hints', String(hintsBalance + safeHints));
    }
  }

  claimStreakMilestones() {
    const claimedNow = [];
    this.retentionConfig.streakMilestones.forEach((milestone) => {
      const key = String(milestone.days);
      if (milestone.days > this.streak || this.claimedMilestones[key]) return;
      this.claimedMilestones[key] = {
        claimedAt: Date.now(),
        streak: this.streak
      };
      this.grantRewards({
        stars: milestone.rewards.stars,
        hints: milestone.rewards.hints,
        source: 'streak_milestone'
      });
      claimedNow.push(milestone);
      window.dispatchEvent(new CustomEvent('streakMilestoneClaimed', {
        detail: {
          milestoneDays: milestone.days,
          stars: milestone.rewards.stars,
          hints: milestone.rewards.hints
        }
      }));
    });
    if (claimedNow.length) {
      this.saveClaimedMilestones();
      if (window.FeedbackSystem) {
        const message = claimedNow
          .map((milestone) => `🔥 ${milestone.days}-day: +${milestone.rewards.stars}⭐ +${milestone.rewards.hints}💡`)
          .join(' • ');
        window.FeedbackSystem.success(`Streak milestone claimed! ${message}`);
      }
    }
  }

  checkForNewDay() {
    // Check every minute if day has changed
    setInterval(() => {
      const today = this.getTodayString();
      if (this.todayChallenge && this.todayChallenge.date !== today) {
        this.generateDailyChallenge();
      }
    }, 60000);
  }
}

// Create global instance
window.DailyChallengeSystem = new DailyChallengeSystem();
