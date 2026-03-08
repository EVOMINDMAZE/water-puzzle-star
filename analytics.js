class DiagnosticsSystem {
  constructor() {
    this.entries = [];
    this.storageKey = 'water_puzzle_diagnostics_v1';
    this.maxEntries = 100;
    this.restore();
  }

  restore() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        this.entries = parsed.slice(-this.maxEntries);
      }
    } catch (_) {
      this.entries = [];
    }
  }

  persist() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.entries.slice(-this.maxEntries)));
  }

  record(code, detail = {}, severity = 'warning') {
    const entry = {
      code,
      detail,
      severity,
      timestamp: Date.now()
    };
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
    this.persist();
    window.dispatchEvent(new CustomEvent('diagnosticsEvent', { detail: entry }));
    if (window.SocialSystem && typeof window.SocialSystem.trackEvent === 'function') {
      window.SocialSystem.trackEvent('diagnostic', entry);
    }
    return entry;
  }

  getEntries() {
    return [...this.entries];
  }
}

class AnalyticsSystem {
  constructor() {
    this.schemaVersion = '1.0.0';
    this.sessionId = `analytics_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.events = [];
    this.maxEvents = 500;
    this.schemas = {
      session_start: { category: 'session', required: { entryPoint: 'string' } },
      session_pause: { category: 'session', required: {} },
      session_resume: { category: 'session', required: {} },
      session_end: { category: 'session', required: { durationMs: 'number' } },
      level_start: { category: 'progression', required: { levelIndex: 'number', difficulty: 'string' } },
      level_complete: { category: 'progression', required: { levelIndex: 'number', moves: 'number', stars: 'number' } },
      hint_used: { category: 'progression', required: { levelIndex: 'number' } },
      undo_used: { category: 'progression', required: { levelIndex: 'number' } },
      daily_challenge_start: { category: 'retention', required: { level: 'number' } },
      daily_challenge_complete: { category: 'retention', required: { streak: 'number', stars: 'number', moves: 'number' } },
      streak_milestone_claimed: { category: 'retention', required: { milestoneDays: 'number' } },
      live_event_reward_granted: { category: 'retention', required: { eventId: 'string', stars: 'number', hints: 'number' } },
      mission_progress: { category: 'retention', required: { missionId: 'string', progress: 'number', target: 'number', metric: 'string' } },
      mission_claimed: { category: 'retention', required: { missionId: 'string', cadence: 'string' } },
      ad_offer_shown: { category: 'ad', required: { offerId: 'string', placement: 'string' } },
      ad_started: { category: 'ad', required: { offerId: 'string', placement: 'string' } },
      ad_completed: { category: 'ad', required: { offerId: 'string', placement: 'string' } },
      ad_canceled: { category: 'ad', required: { offerId: 'string' } },
      ad_failed: { category: 'ad', required: { offerId: 'string', reason: 'string' } },
      ad_reward_granted: { category: 'ad', required: { offerId: 'string', rewardType: 'string', amount: 'number' } },
      purchase_offer_shown: { category: 'purchase', required: { productId: 'string', placement: 'string' } },
      purchase_started: { category: 'purchase', required: { productId: 'string', placement: 'string' } },
      purchase_completed: { category: 'purchase', required: { productId: 'string', transactionId: 'string', granted: 'boolean' } },
      purchase_canceled: { category: 'purchase', required: { productId: 'string' } },
      purchase_failed: { category: 'purchase', required: { productId: 'string', reason: 'string' } },
      rewards_granted: { category: 'economy', required: { stars: 'number', hints: 'number' } },
      stars_spent: { category: 'economy', required: { amount: 'number', balance: 'number' } },
      stars_spend_denied: { category: 'economy', required: { amount: 'number', balance: 'number', reason: 'string' } },
      diagnostic_recorded: { category: 'diagnostics', required: { code: 'string', severity: 'string' } }
    };
    this.sessionStartAt = Date.now();
    this.setupEventBridge();
    this.track('session_start', {
      entryPoint: document.referrer ? 'referral' : 'direct'
    });
    window.addEventListener('beforeunload', () => {
      this.track('session_end', { durationMs: Date.now() - this.sessionStartAt });
    });
  }

  setupEventBridge() {
    document.addEventListener('visibilitychange', () => {
      this.track(document.hidden ? 'session_pause' : 'session_resume', {});
    });

    window.addEventListener('levelLoaded', (e) => {
      const detail = e?.detail || {};
      this.track('level_start', {
        levelIndex: Number(detail.levelIndex) || 0,
        difficulty: typeof detail.difficulty === 'string' ? detail.difficulty : 'normal'
      });
    });

    window.addEventListener('levelComplete', (e) => {
      const detail = e?.detail || {};
      this.track('level_complete', {
        levelIndex: Number(detail.levelIndex) || 0,
        moves: Number(detail.moves) || 0,
        stars: Number(detail.stars) || 0,
        awardedStars: Number(detail.awardedStars) || 0,
        durationSec: Number(detail.durationSec) || 0,
        difficulty: typeof detail.difficulty === 'string' ? detail.difficulty : 'normal'
      });
    });

    window.addEventListener('hintUsed', () => {
      this.track('hint_used', {
        levelIndex: Number(localStorage.getItem('water_puzzle_lvl') || 0)
      });
    });

    window.addEventListener('undoUsed', (e) => {
      const detail = e?.detail || {};
      this.track('undo_used', {
        levelIndex: Number(localStorage.getItem('water_puzzle_lvl') || 0),
        source: typeof detail.source === 'string' ? detail.source : 'manual'
      });
    });

    window.addEventListener('dailyChallengeStart', (e) => {
      const detail = e?.detail || {};
      this.track('daily_challenge_start', {
        level: Number(detail.level) || 0
      });
    });

    window.addEventListener('dailyChallengeComplete', (e) => {
      const detail = e?.detail || {};
      this.track('daily_challenge_complete', {
        streak: Number(detail.streak) || 0,
        stars: Number(detail.stars) || 0,
        moves: Number(detail.moves) || 0
      });
    });

    window.addEventListener('streakMilestoneClaimed', (e) => {
      const detail = e?.detail || {};
      this.track('streak_milestone_claimed', {
        milestoneDays: Number(detail.milestoneDays) || 0,
        stars: Number(detail.stars) || 0,
        hints: Number(detail.hints) || 0
      });
    });

    window.addEventListener('liveEventRewardGranted', (e) => {
      const detail = e?.detail || {};
      this.track('live_event_reward_granted', {
        eventId: typeof detail.eventId === 'string' ? detail.eventId : 'unknown_event',
        stars: Number(detail.stars) || 0,
        hints: Number(detail.hints) || 0
      });
    });

    window.addEventListener('missionProgress', (e) => {
      const detail = e?.detail || {};
      this.track('mission_progress', {
        missionId: typeof detail.missionId === 'string' ? detail.missionId : 'unknown_mission',
        progress: Number(detail.progress) || 0,
        target: Number(detail.target) || 0,
        metric: typeof detail.metric === 'string' ? detail.metric : 'unknown_metric'
      });
    });

    window.addEventListener('missionClaimed', (e) => {
      const detail = e?.detail || {};
      this.track('mission_claimed', {
        missionId: typeof detail.missionId === 'string' ? detail.missionId : 'unknown_mission',
        cadence: typeof detail.cadence === 'string' ? detail.cadence : 'unknown'
      });
    });

    window.addEventListener('diagnosticsEvent', (e) => {
      const detail = e?.detail || {};
      this.track('diagnostic_recorded', {
        code: typeof detail.code === 'string' ? detail.code : 'unknown',
        severity: typeof detail.severity === 'string' ? detail.severity : 'warning'
      }, { skipValidationDiagnostic: true });
    });

    window.addEventListener('monetizationEvent', (e) => {
      const detail = e?.detail || {};
      const name = typeof detail.name === 'string' ? detail.name : '';
      const payload = detail.payload && typeof detail.payload === 'object' ? detail.payload : {};
      const monetizationEventMap = {
        ad_offer_shown: 'ad_offer_shown',
        ad_started: 'ad_started',
        ad_completed: 'ad_completed',
        ad_canceled: 'ad_canceled',
        ad_failed: 'ad_failed',
        ad_reward_granted: 'ad_reward_granted',
        purchase_offer_shown: 'purchase_offer_shown',
        purchase_started: 'purchase_started',
        purchase_completed: 'purchase_completed',
        purchase_canceled: 'purchase_canceled',
        purchase_failed: 'purchase_failed',
        rewards_granted: 'rewards_granted',
        stars_spent: 'stars_spent',
        stars_spend_denied: 'stars_spend_denied'
      };
      const eventType = monetizationEventMap[name];
      if (!eventType) return;
      this.track(eventType, payload);
    });
  }

  isType(value, expectedType) {
    if (expectedType === 'number') return typeof value === 'number' && Number.isFinite(value);
    if (expectedType === 'string') return typeof value === 'string' && value.length > 0;
    if (expectedType === 'boolean') return typeof value === 'boolean';
    return false;
  }

  validate(eventType, payload) {
    const schema = this.schemas[eventType];
    if (!schema) return { valid: true };
    const required = schema.required || {};
    const issues = Object.keys(required).filter((key) => !this.isType(payload[key], required[key]));
    return {
      valid: issues.length === 0,
      issues
    };
  }

  track(eventType, payload = {}, options = {}) {
    const safePayload = payload && typeof payload === 'object' ? payload : {};
    const validation = this.validate(eventType, safePayload);
    if (!validation.valid) {
      if (!options.skipValidationDiagnostic && window.DiagnosticsSystem) {
        window.DiagnosticsSystem.record('analytics_invalid_payload', {
          eventType,
          issues: validation.issues
        });
      }
      return null;
    }
    const schema = this.schemas[eventType] || { category: 'custom' };
    const event = {
      schemaVersion: this.schemaVersion,
      eventType,
      category: schema.category,
      payload: safePayload,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: window.SocialSystem?.user?.id || null
    };
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    if (window.SocialSystem && typeof window.SocialSystem.trackEvent === 'function') {
      window.SocialSystem.trackEvent('analytics_event', event);
    }
    return event;
  }

  getEvents() {
    return [...this.events];
  }
}

window.DiagnosticsSystem = new DiagnosticsSystem();
window.AnalyticsSystem = new AnalyticsSystem();
