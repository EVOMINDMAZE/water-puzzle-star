/**
 * @fileoverview Social & Analytics System for Water Puzzle Star
 * Provides leaderboards, friend system, cloud sync, and analytics
 */

class SocialSystem {
  constructor() {
    this.user = null;
    this.friends = [];
    this.leaderboards = new Map();
    this.isOnline = navigator.onLine;
    
    this.init();
  }

  init() {
    this.setupOnlineStatus();
    this.loadUserData();
    this.setupAnalytics();
  }

  // User Management
  loadUserData() {
    const saved = localStorage.getItem('water_puzzle_user');
    if (saved) {
      try {
        this.user = JSON.parse(saved);
      } catch (e) {
        this.createUser();
      }
    } else {
      this.createUser();
    }
  }

  createUser() {
    this.user = {
      id: this.generateUserId(),
      name: 'Player',
      createdAt: Date.now(),
      stats: {
        totalStars: 0,
        levelsCompleted: 0,
        perfectLevels: 0,
        totalMoves: 0,
        gamesPlayed: 0
      },
      settings: {
        sound: true,
        haptic: true,
        notifications: true
      }
    };
    
    this.saveUserData();
  }

  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  saveUserData() {
    localStorage.setItem('water_puzzle_user', JSON.stringify(this.user));
  }

  updateUserName(name) {
    this.user.name = name;
    this.saveUserData();
  }

  // Online Status
  setupOnlineStatus() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Leaderboards
  async getLeaderboard(type = 'global', timeframe = 'all') {
    const cacheKey = `${type}_${timeframe}`;
    
    if (this.leaderboards.has(cacheKey)) {
      const cached = this.leaderboards.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
        return cached.data;
      }
    }
    
    // Simulate API call
    const leaderboard = await this.fetchLeaderboard(type, timeframe);
    
    this.leaderboards.set(cacheKey, {
      data: leaderboard,
      timestamp: Date.now()
    });
    
    return leaderboard;
  }

  async fetchLeaderboard(type, timeframe) {
    // Placeholder - would connect to actual backend
    return {
      type,
      timeframe,
      entries: [
        { rank: 1, name: 'Champion', score: 5000, stars: 1500 },
        { rank: 2, name: 'Master', score: 4500, stars: 1400 },
        { rank: 3, name: 'Expert', score: 4000, stars: 1300 },
        { rank: 4, name: 'Pro', score: 3500, stars: 1200 },
        { rank: 5, name: 'Skilled', score: 3000, stars: 1100 }
      ],
      userRank: this.calculateUserRank()
    };
  }

  calculateUserRank() {
    const totalStars = parseInt(localStorage.getItem('water_puzzle_stars') || '0');
    // Simplified rank calculation
    if (totalStars >= 1500) return 1;
    if (totalStars >= 1400) return 2;
    if (totalStars >= 1300) return 3;
    if (totalStars >= 1200) return 4;
    if (totalStars >= 1100) return 5;
    return Math.max(6, 100 - Math.floor(totalStars / 15));
  }

  async submitScore(levelId, moves, stars) {
    const score = {
      levelId,
      moves,
      stars,
      timestamp: Date.now(),
      userId: this.user.id
    };
    
    // Store locally
    const scores = JSON.parse(localStorage.getItem('water_puzzle_scores') || '[]');
    scores.push(score);
    localStorage.setItem('water_puzzle_scores', JSON.stringify(scores));
    
    // Sync to server if online
    if (this.isOnline) {
      await this.syncScore(score);
    }
    
    return score;
  }

  async syncScore(score) {
    // Placeholder - would sync to backend
    console.log('Syncing score:', score);
  }

  // Friends System
  async getFriends() {
    const saved = localStorage.getItem('water_puzzle_friends');
    if (saved) {
      this.friends = JSON.parse(saved);
    }
    return this.friends;
  }

  async addFriend(friendId) {
    // Placeholder - would connect to backend
    const friend = {
      id: friendId,
      name: 'Friend',
      addedAt: Date.now(),
      status: 'pending'
    };
    
    this.friends.push(friend);
    localStorage.setItem('water_puzzle_friends', JSON.stringify(this.friends));
    
    return friend;
  }

  async removeFriend(friendId) {
    this.friends = this.friends.filter(f => f.id !== friendId);
    localStorage.setItem('water_puzzle_friends', JSON.stringify(this.friends));
  }

  async challengeFriend(friendId, levelId) {
    const challenge = {
      id: 'challenge_' + Date.now(),
      from: this.user.id,
      to: friendId,
      levelId,
      createdAt: Date.now(),
      status: 'pending'
    };
    
    // Store challenge
    const challenges = JSON.parse(localStorage.getItem('water_puzzle_challenges') || '[]');
    challenges.push(challenge);
    localStorage.setItem('water_puzzle_challenges', JSON.stringify(challenges));
    
    return challenge;
  }

  // Cloud Sync
  async syncData() {
    if (!this.isOnline) {
      console.log('Offline - sync postponed');
      return false;
    }
    
    try {
      const localData = this.getLocalData();
      
      // Placeholder - would sync with backend
      // const response = await fetch('/api/sync', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(localData)
      // });
      
      console.log('Data synced:', localData);
      localStorage.setItem('water_puzzle_last_sync', Date.now().toString());
      
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      return false;
    }
  }

  getLocalData() {
    return {
      user: this.user,
      progress: {
        currentLevel: parseInt(localStorage.getItem('water_puzzle_lvl') || '0'),
        maxUnlockedLevel: parseInt(localStorage.getItem('maxUnlockedLevel') || '0'),
        totalStars: parseInt(localStorage.getItem('water_puzzle_stars') || '0'),
        hints: parseInt(localStorage.getItem('water_puzzle_hints') || '5')
      },
      achievements: JSON.parse(localStorage.getItem('water_puzzle_achievements') || '[]'),
      stats: JSON.parse(localStorage.getItem('water_puzzle_stats') || '{}'),
      settings: {
        sound: localStorage.getItem('water_puzzle_sound') !== 'false',
        theme: localStorage.getItem('water_puzzle_theme') || 'dark',
        difficulty: localStorage.getItem('water_puzzle_difficulty') || 'normal'
      }
    };
  }

  // Analytics
  setupAnalytics() {
    this.analytics = {
      events: [],
      sessionStart: Date.now(),
      pageViews: 0,
      eventsSent: 0
    };
    
    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('session_pause');
      } else {
        this.trackEvent('session_resume');
      }
    });
    
    // Track before unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('session_end');
      this.sendAnalytics();
    });
  }

  trackEvent(eventName, properties = {}) {
    const event = {
      name: eventName,
      properties,
      timestamp: Date.now(),
      sessionId: this.analytics.sessionStart,
      userId: this.user?.id
    };
    
    this.analytics.events.push(event);
    
    // Send if buffer is full
    if (this.analytics.events.length >= 10) {
      this.sendAnalytics();
    }
    
    return event;
  }

  trackLevelStart(levelId) {
    return this.trackEvent('level_start', { levelId });
  }

  trackLevelComplete(levelId, moves, stars, time) {
    return this.trackEvent('level_complete', {
      levelId,
      moves,
      stars,
      time,
      par: this.getLevelPar(levelId)
    });
  }

  trackLevelFail(levelId, moves, reason) {
    return this.trackEvent('level_fail', {
      levelId,
      moves,
      reason
    });
  }

  trackHintUsed(levelId) {
    return this.trackEvent('hint_used', { levelId });
  }

  trackUndoUsed(levelId) {
    return this.trackEvent('undo_used', { levelId });
  }

  trackPurchase(itemId, price) {
    return this.trackEvent('purchase', { itemId, price });
  }

  trackAdWatched(adType) {
    return this.trackEvent('ad_watched', { adType });
  }

  getLevelPar(levelId) {
    if (window.LEVELS && window.LEVELS[levelId]) {
      return window.LEVELS[levelId].par;
    }
    return 0;
  }

  async sendAnalytics() {
    if (!this.isOnline || this.analytics.events.length === 0) {
      return;
    }
    
    const events = [...this.analytics.events];
    this.analytics.events = [];
    
    try {
      // Placeholder - would send to analytics service
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ events })
      // });
      
      this.analytics.eventsSent += events.length;
      console.log('Analytics sent:', events.length, 'events');
    } catch (error) {
      console.error('Failed to send analytics:', error);
      // Re-add events to buffer
      this.analytics.events = [...events, ...this.analytics.events];
    }
  }

  // Share functionality
  async shareScore(levelId, moves, stars) {
    const shareData = {
      title: 'Water Puzzle Star',
      text: `I just completed level ${levelId + 1} in ${moves} moves and earned ${stars} stars! Can you beat my score?`,
      url: window.location.href
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        this.trackEvent('share_success', { method: 'native', levelId });
        return true;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
        return false;
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        this.trackEvent('share_success', { method: 'clipboard', levelId });
        
        if (window.FeedbackSystem) {
          window.FeedbackSystem.success('Score copied to clipboard!');
        }
        return true;
      } catch (error) {
        console.error('Clipboard failed:', error);
        return false;
      }
    }
  }

  // Screenshot and share
  async captureAndShare(canvas) {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      
      // Convert to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      const file = new File([blob], 'water-puzzle-score.png', { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Water Puzzle Star',
          text: 'Check out my score!',
          files: [file]
        });
        
        this.trackEvent('share_success', { method: 'screenshot' });
        return true;
      }
    } catch (error) {
      console.error('Screenshot share failed:', error);
    }
    
    return false;
  }
}

// Create global instance
window.SocialSystem = new SocialSystem();