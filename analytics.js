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
    this.schemaVersion = '1.1.0';
    this.storageKeys = {
      playerId: 'water_puzzle_player_id_v1',
      queue: 'water_puzzle_analytics_queue_v1',
      consent: 'water_puzzle_analytics_consent_v1',
      attribution: 'water_puzzle_attribution_v1',
      feedbackPromptState: 'water_puzzle_feedback_prompt_v1',
      feedbackSubmitted: 'water_puzzle_feedback_submitted_v1'
    };
    this.playerId = this.ensurePlayerId();
    this.sessionId = `analytics_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    this.sessionIndex = this.bumpSessionCount();
    this.sessionStartAt = Date.now();
    this.endpoint = typeof window.ANALYTICS_INGEST_ENDPOINT === 'string' ? window.ANALYTICS_INGEST_ENDPOINT.trim() : '';
    this.flushIntervalMs = 15000;
    this.heartbeatIntervalMs = 60000;
    this.maxEvents = 500;
    this.maxQueueSize = 2000;
    this.maxBatchSize = 40;
    this.pendingQueue = this.restoreQueue();
    this.flushInFlight = false;
    this.lastFlushAt = 0;
    this.retryDelayMs = 2000;
    this.nextRetryAt = 0;
    this.consentGranted = localStorage.getItem(this.storageKeys.consent) !== 'false';
    this.acquisition = this.resolveAttribution();
    this.events = [];
    this.schemas = {
      session_start: { category: 'session', required: { entryPoint: 'string' } },
      session_pause: { category: 'session', required: {} },
      session_resume: { category: 'session', required: {} },
      session_end: { category: 'session', required: { durationMs: 'number' } },
      session_heartbeat: { category: 'session', required: { durationMs: 'number', levelIndex: 'number' } },
      acquisition_attributed: { category: 'growth', required: { source: 'string', medium: 'string', campaign: 'string', firstTouch: 'boolean' } },
      level_start: { category: 'progression', required: { levelIndex: 'number', difficulty: 'string' } },
      level_complete: { category: 'progression', required: { levelIndex: 'number', moves: 'number', stars: 'number' } },
      level_fail_or_restart: { category: 'progression', required: { levelIndex: 'number', reason: 'string' } },
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
      ad_mode_resolved: { category: 'ad', required: { mode: 'string', source: 'string' } },
      invite_verified: { category: 'ad', required: { tokenHash: 'string', campaignId: 'string' } },
      invite_rejected: { category: 'ad', required: { reason: 'string' } },
      invite_verification_failed: { category: 'ad', required: { reason: 'string' } },
      rating_prompt_shown: { category: 'feedback', required: { source: 'string', levelIndex: 'number', sessionIndex: 'number' } },
      rating_submitted: { category: 'feedback', required: { rating: 'number', source: 'string', levelIndex: 'number' } },
      feedback_submitted: { category: 'feedback', required: { rating: 'number', tags: 'string', messageLength: 'number' } },
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
    this.setupEventBridge();
    this.setupTransportLoop();
    this.setupFeedbackEntry();
    this.track('acquisition_attributed', {
      source: this.acquisition.source,
      medium: this.acquisition.medium,
      campaign: this.acquisition.campaign,
      firstTouch: this.acquisition.firstTouch
    });
    this.track('session_start', {
      entryPoint: document.referrer ? 'referral' : 'direct'
    });
    window.addEventListener('beforeunload', () => {
      this.track('session_end', { durationMs: Date.now() - this.sessionStartAt });
      this.flushWithBeacon();
    });
  }

  ensurePlayerId() {
    const existing = localStorage.getItem(this.storageKeys.playerId);
    if (existing && existing.length > 8) return existing;
    const created = `player_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(this.storageKeys.playerId, created);
    return created;
  }

  bumpSessionCount() {
    const key = 'water_puzzle_session_count_v1';
    const next = Math.max(1, Number(localStorage.getItem(key) || 0) + 1);
    localStorage.setItem(key, String(next));
    return next;
  }

  getQueryValue(params, key) {
    const raw = params.get(key);
    return typeof raw === 'string' && raw.trim() ? raw.trim() : 'none';
  }

  resolveAttribution() {
    const params = new URLSearchParams(window.location.search || '');
    const source = this.getQueryValue(params, 'utm_source');
    const medium = this.getQueryValue(params, 'utm_medium');
    const campaign = this.getQueryValue(params, 'utm_campaign');
    const content = this.getQueryValue(params, 'utm_content');
    const referrer = document.referrer && document.referrer.trim() ? document.referrer : 'direct';
    const now = Date.now();
    const existingRaw = localStorage.getItem(this.storageKeys.attribution);
    let existing = null;
    if (existingRaw) {
      try {
        existing = JSON.parse(existingRaw);
      } catch (_) {
        existing = null;
      }
    }
    if (existing && typeof existing === 'object' && existing.source) {
      return {
        source: existing.source || 'none',
        medium: existing.medium || 'none',
        campaign: existing.campaign || 'none',
        content: existing.content || 'none',
        referrer: existing.referrer || 'direct',
        firstTouch: false,
        capturedAt: existing.capturedAt || now
      };
    }
    const attribution = {
      source,
      medium,
      campaign,
      content,
      referrer,
      firstTouch: true,
      capturedAt: now
    };
    localStorage.setItem(this.storageKeys.attribution, JSON.stringify(attribution));
    return attribution;
  }

  restoreQueue() {
    const raw = localStorage.getItem(this.storageKeys.queue);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(-this.maxQueueSize);
    } catch (_) {
      return [];
    }
  }

  persistQueue() {
    const trimmed = this.pendingQueue.slice(-this.maxQueueSize);
    this.pendingQueue = trimmed;
    localStorage.setItem(this.storageKeys.queue, JSON.stringify(trimmed));
  }

  setupTransportLoop() {
    this.heartbeatTimer = setInterval(() => {
      this.track('session_heartbeat', {
        durationMs: Date.now() - this.sessionStartAt,
        levelIndex: Number(localStorage.getItem('water_puzzle_lvl') || 0)
      });
    }, this.heartbeatIntervalMs);
    this.flushTimer = setInterval(() => {
      this.flushQueue();
    }, this.flushIntervalMs);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.flushWithBeacon();
      else this.flushQueue();
    });
    setTimeout(() => this.flushQueue(), 1200);
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
      this.maybePromptForRating('level_complete');
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

    const restartButton = document.getElementById('restart-btn');
    if (restartButton) {
      restartButton.addEventListener('click', () => {
        this.track('level_fail_or_restart', {
          levelIndex: Number(localStorage.getItem('water_puzzle_lvl') || 0),
          reason: 'restart_button'
        });
      });
    }

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
        ad_mode_resolved: 'ad_mode_resolved',
        invite_verified: 'invite_verified',
        invite_rejected: 'invite_rejected',
        invite_verification_failed: 'invite_verification_failed',
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

  setupFeedbackEntry() {
    const utilityTray = document.getElementById('top-utilities-tray');
    this.injectFeedbackStyles();
    this.ensureFeedbackModal();
    const mainFeedbackButton = document.getElementById('feedback-btn');
    if (mainFeedbackButton && !mainFeedbackButton.dataset.feedbackBound) {
      mainFeedbackButton.dataset.feedbackBound = '1';
      mainFeedbackButton.addEventListener('click', () => this.openFeedbackFlow('main_menu_button'));
    }
    this.updateFeedbackButtonState();
    const oldFab = document.getElementById('feedback-fab');
    if (oldFab) oldFab.remove();
    if (utilityTray) {
      const legacyFeedbackButton = utilityTray.querySelector('.feedback-entry-btn');
      if (legacyFeedbackButton) legacyFeedbackButton.remove();
    }
    if (!utilityTray) return;
    if (!utilityTray.querySelector('.analytics-consent-btn')) {
      const consentButton = document.createElement('button');
      consentButton.type = 'button';
      consentButton.className = 'hud-pill analytics-consent-btn';
      const updateLabel = () => {
        consentButton.innerHTML = `<span class="hud-label">Tracking</span><span class="hud-value">${this.consentGranted ? 'ON' : 'OFF'}</span>`;
      };
      updateLabel();
      consentButton.setAttribute('aria-label', 'Toggle analytics tracking consent');
      consentButton.addEventListener('click', async () => {
        const next = !this.consentGranted;
        let allow = next;
        if (next && window.DialogSystem && typeof window.DialogSystem.confirm === 'function') {
          allow = await window.DialogSystem.confirm({
            title: 'Enable analytics',
            message: 'Allow anonymous analytics to improve gameplay and levels?',
            icon: '📊',
            confirmText: 'Enable',
            cancelText: 'Cancel'
          });
        }
        if (next && !allow) return;
        this.setAnalyticsConsent(next);
        updateLabel();
      });
      utilityTray.appendChild(consentButton);
    }
  }

  injectFeedbackStyles() {
    if (document.getElementById('analytics-feedback-style')) return;
    const style = document.createElement('style');
    style.id = 'analytics-feedback-style';
    style.textContent = `
      #feedback-modal {
        position: fixed;
        inset: 0;
        z-index: 190;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(2, 9, 24, 0.8);
        padding: 16px;
      }
      #feedback-modal.open { display: flex; }
      #feedback-modal .feedback-modal-card {
        width: min(520px, calc(100vw - 24px));
        border-radius: 20px;
        background: linear-gradient(170deg, #0c1f4d, #081733);
        border: 1px solid rgba(255,255,255,0.2);
        color: #f6fbff;
        box-shadow: 0 24px 54px rgba(0,0,0,0.48);
        padding: 20px;
      }
      #feedback-modal .feedback-modal-head {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 12px;
      }
      #feedback-modal .feedback-close {
        border: 0;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        font-size: 22px;
        line-height: 1;
        color: #e8f0ff;
        background: rgba(255,255,255,0.08);
        cursor: pointer;
      }
      #feedback-modal .feedback-modal-title {
        margin: 0 0 8px;
        font-size: 23px;
        font-weight: 800;
      }
      #feedback-modal .feedback-modal-copy {
        margin: 0 0 14px;
        opacity: 0.92;
        font-size: 14px;
      }
      #feedback-modal .feedback-stars {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
      }
      #feedback-modal .feedback-star-btn {
        flex: 1;
        border: 1px solid rgba(255,255,255,0.24);
        border-radius: 11px;
        height: 42px;
        font-size: 21px;
        background: rgba(255,255,255,0.06);
        color: #ffe083;
        cursor: pointer;
      }
      #feedback-modal .feedback-star-btn.active {
        background: rgba(255, 224, 131, 0.24);
        border-color: rgba(255, 224, 131, 0.6);
      }
      #feedback-modal .feedback-rating-caption {
        margin: 0 0 12px;
        min-height: 20px;
        color: #cde5ff;
        font-size: 13px;
      }
      #feedback-modal .feedback-tags {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin-bottom: 12px;
        font-size: 13px;
      }
      #feedback-modal .feedback-tags label {
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      #feedback-modal textarea {
        width: 100%;
        resize: vertical;
        min-height: 84px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.2);
        background: rgba(255,255,255,0.05);
        color: #fff;
        padding: 10px;
        font: inherit;
        margin-bottom: 6px;
      }
      #feedback-modal .feedback-char-count {
        text-align: right;
        margin: 0 0 14px;
        color: rgba(206, 223, 255, 0.86);
        font-size: 12px;
      }
      #feedback-modal .feedback-modal-actions {
        display: flex;
        gap: 10px;
      }
      #feedback-modal .feedback-modal-actions button {
        flex: 1;
        height: 42px;
        border: 0;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
      }
      #feedback-modal .feedback-modal-cancel {
        background: rgba(255,255,255,0.12);
        color: #fff;
      }
      #feedback-modal .feedback-modal-submit {
        background: linear-gradient(135deg, #32b8ff, #297dff);
        color: #fff;
      }
      #feedback-modal .feedback-modal-submit:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      @media (max-width: 720px) {
        #feedback-modal .feedback-tags {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `;
    document.head.appendChild(style);
  }

  ensureFeedbackModal() {
    if (document.getElementById('feedback-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'feedback-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="feedback-modal-card" role="dialog" aria-modal="true" aria-label="Feedback">
        <div class="feedback-modal-head">
          <div>
            <h3 class="feedback-modal-title">Share feedback</h3>
            <p class="feedback-modal-copy">Tell us what feels great and what needs improving.</p>
          </div>
          <button type="button" class="feedback-close" id="feedback-close" aria-label="Close feedback">&times;</button>
        </div>
        <div class="feedback-stars" id="feedback-stars">
          <button type="button" class="feedback-star-btn" data-value="1">★</button>
          <button type="button" class="feedback-star-btn" data-value="2">★</button>
          <button type="button" class="feedback-star-btn" data-value="3">★</button>
          <button type="button" class="feedback-star-btn" data-value="4">★</button>
          <button type="button" class="feedback-star-btn" data-value="5">★</button>
        </div>
        <p class="feedback-rating-caption" id="feedback-rating-caption">Choose a rating</p>
        <div class="feedback-tags">
          <label><input type="checkbox" value="difficulty"> Difficulty</label>
          <label><input type="checkbox" value="levels"> Levels</label>
          <label><input type="checkbox" value="ui"> UI</label>
          <label><input type="checkbox" value="performance"> Performance</label>
          <label><input type="checkbox" value="ads"> Ads</label>
          <label><input type="checkbox" value="bugs"> Bugs</label>
        </div>
        <textarea id="feedback-message" maxlength="500" placeholder="Optional note (what felt good or frustrating?)"></textarea>
        <p class="feedback-char-count"><span id="feedback-char-count">0</span>/500</p>
        <div class="feedback-modal-actions">
          <button type="button" class="feedback-modal-cancel" id="feedback-cancel">Not now</button>
          <button type="button" class="feedback-modal-submit" id="feedback-submit" disabled>Send</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.feedbackDraft = { source: 'manual', rating: 0 };
    modal.addEventListener('click', (event) => {
      if (event.target === modal) this.closeFeedbackModal();
    });
    modal.querySelectorAll('.feedback-star-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const value = Number(button.dataset.value || 0);
        this.feedbackDraft.rating = value;
        modal.querySelectorAll('.feedback-star-btn').forEach((candidate) => {
          candidate.classList.toggle('active', Number(candidate.dataset.value || 0) <= value);
        });
        const caption = modal.querySelector('#feedback-rating-caption');
        if (caption) {
          const labels = ['', 'Needs work', 'Okay', 'Good', 'Great', 'Excellent'];
          caption.textContent = `${value}/5 • ${labels[value]}`;
        }
        const submitButton = modal.querySelector('#feedback-submit');
        if (submitButton) submitButton.disabled = value < 1;
      });
    });
    modal.querySelector('#feedback-close').addEventListener('click', () => this.closeFeedbackModal());
    modal.querySelector('#feedback-cancel').addEventListener('click', () => this.closeFeedbackModal());
    modal.querySelector('#feedback-submit').addEventListener('click', () => this.submitFeedbackModal());
    const messageInput = modal.querySelector('#feedback-message');
    if (messageInput) {
      messageInput.addEventListener('input', () => {
        const counter = modal.querySelector('#feedback-char-count');
        if (counter) counter.textContent = String(messageInput.value.length);
      });
    }
  }

  closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  submitFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    if (!modal) return;
    const rating = Number(this.feedbackDraft?.rating || 0);
    if (!rating) {
      if (window.FeedbackSystem && typeof window.FeedbackSystem.warning === 'function') {
        window.FeedbackSystem.warning('Choose a star rating first');
      }
      return;
    }
    const selectedTags = Array.from(modal.querySelectorAll('.feedback-tags input:checked')).map((node) => node.value);
    const messageRaw = modal.querySelector('#feedback-message')?.value || '';
    this.submitFeedback(this.feedbackDraft?.source || 'manual', rating, selectedTags.join(','), messageRaw);
    localStorage.setItem(this.storageKeys.feedbackSubmitted, 'true');
    this.updateFeedbackButtonState();
    this.closeFeedbackModal();
  }

  updateFeedbackButtonState() {
    const button = document.getElementById('feedback-btn');
    if (!button) return;
    const submitted = localStorage.getItem(this.storageKeys.feedbackSubmitted) === 'true';
    button.classList.toggle('feedback-complete', submitted);
  }

  setAnalyticsConsent(enabled) {
    this.consentGranted = Boolean(enabled);
    localStorage.setItem(this.storageKeys.consent, this.consentGranted ? 'true' : 'false');
    if (!this.consentGranted) this.flushWithBeacon();
  }

  maybePromptForRating(source) {
    const level = Number(localStorage.getItem('water_puzzle_lvl') || 0);
    if (level <= 0) return;
    const stateRaw = localStorage.getItem(this.storageKeys.feedbackPromptState);
    let state = { shownCount: 0, lastPromptAt: 0 };
    if (stateRaw) {
      try {
        const parsed = JSON.parse(stateRaw);
        if (parsed && typeof parsed === 'object') {
          state = {
            shownCount: Number(parsed.shownCount) || 0,
            lastPromptAt: Number(parsed.lastPromptAt) || 0
          };
        }
      } catch (_) {}
    }
    const now = Date.now();
    if (now - state.lastPromptAt < 24 * 60 * 60 * 1000) return;
    if (state.shownCount >= 5) return;
    if (level % 10 !== 0 && this.sessionIndex % 3 !== 0) return;
    state.shownCount += 1;
    state.lastPromptAt = now;
    localStorage.setItem(this.storageKeys.feedbackPromptState, JSON.stringify(state));
    this.openFeedbackFlow(source || 'auto_prompt');
  }

  normalizeTags(input) {
    if (typeof input !== 'string' || !input.trim()) return 'none';
    const tags = input.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 6);
    return tags.length ? tags.join('|') : 'none';
  }

  sanitizeFeedbackText(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/[<>]/g, '').trim().slice(0, 500);
  }

  async openFeedbackFlow(source = 'manual') {
    try {
      this.ensureFeedbackModal();
      this.feedbackDraft = { source, rating: 0 };
      const modal = document.getElementById('feedback-modal');
      if (!modal) return;
      modal.querySelectorAll('.feedback-star-btn').forEach((candidate) => candidate.classList.remove('active'));
      modal.querySelectorAll('.feedback-tags input').forEach((node) => {
        node.checked = false;
      });
      const message = modal.querySelector('#feedback-message');
      if (message) message.value = '';
      const counter = modal.querySelector('#feedback-char-count');
      if (counter) counter.textContent = '0';
      const caption = modal.querySelector('#feedback-rating-caption');
      if (caption) caption.textContent = 'Choose a rating';
      const submit = modal.querySelector('#feedback-submit');
      if (submit) submit.disabled = true;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      this.track('rating_prompt_shown', {
        source: source || 'manual',
        levelIndex: Number(localStorage.getItem('water_puzzle_lvl') || 0),
        sessionIndex: this.sessionIndex
      });
    } catch (error) {
      if (window.DiagnosticsSystem && typeof window.DiagnosticsSystem.record === 'function') {
        window.DiagnosticsSystem.record('feedback_flow_open_failed', {
          message: String(error && error.message ? error.message : error)
        }, 'warning');
      }
      if (window.DialogSystem && typeof window.DialogSystem.alert === 'function') {
        window.DialogSystem.alert({
          title: 'Feedback unavailable',
          message: 'Could not open feedback right now. Please try again.',
          icon: '⚠️'
        });
      }
    }
  }

  submitFeedback(source, rating, tagRaw, feedbackRaw) {
    const levelIndex = Number(localStorage.getItem('water_puzzle_lvl') || 0);
    const adMode = window.MonetizationSystem?.adModeResolution?.mode || 'unknown';
    const feedbackText = this.sanitizeFeedbackText(feedbackRaw);
    const tags = this.normalizeTags(tagRaw);
    this.track('rating_submitted', {
      rating,
      source,
      levelIndex,
      adMode
    });
    this.track('feedback_submitted', {
      rating,
      tags,
      messageLength: feedbackText.length,
      source,
      levelIndex,
      adMode,
      message: feedbackText || 'none'
    });
    if (window.FeedbackSystem && typeof window.FeedbackSystem.success === 'function') {
      window.FeedbackSystem.success('Thanks for your feedback');
    }
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
      playerId: this.playerId,
      sessionIndex: this.sessionIndex,
      acquisition: {
        source: this.acquisition.source,
        medium: this.acquisition.medium,
        campaign: this.acquisition.campaign,
        content: this.acquisition.content,
        referrer: this.acquisition.referrer
      },
      userId: window.SocialSystem?.user?.id || null
    };
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    this.pendingQueue.push(event);
    if (this.pendingQueue.length > this.maxQueueSize) {
      this.pendingQueue = this.pendingQueue.slice(-this.maxQueueSize);
    }
    this.persistQueue();
    if (!document.hidden && this.pendingQueue.length >= this.maxBatchSize) {
      this.flushQueue();
    }
    if (window.SocialSystem && typeof window.SocialSystem.trackEvent === 'function') {
      window.SocialSystem.trackEvent('analytics_event', event);
    }
    return event;
  }

  async flushQueue() {
    if (!this.consentGranted) return;
    if (!this.endpoint) return;
    if (!navigator.onLine) return;
    if (this.flushInFlight) return;
    if (!this.pendingQueue.length) return;
    if (Date.now() < this.nextRetryAt) return;
    this.flushInFlight = true;
    try {
      const batch = this.pendingQueue.slice(0, this.maxBatchSize);
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemaVersion: this.schemaVersion,
          playerId: this.playerId,
          sessionId: this.sessionId,
          events: batch
        })
      });
      if (!response.ok) {
        this.nextRetryAt = Date.now() + this.retryDelayMs;
        this.retryDelayMs = Math.min(120000, this.retryDelayMs * 2);
        return;
      }
      const result = await response.json().catch(() => ({}));
      const accepted = Math.max(0, Math.min(batch.length, Number(result.accepted) || batch.length));
      this.pendingQueue = this.pendingQueue.slice(accepted);
      this.persistQueue();
      this.retryDelayMs = 2000;
      this.nextRetryAt = 0;
      this.lastFlushAt = Date.now();
      if (accepted < batch.length) {
        this.nextRetryAt = Date.now() + 5000;
      }
      if (this.pendingQueue.length > 0) {
        setTimeout(() => this.flushQueue(), 50);
      }
    } catch (_) {
      this.nextRetryAt = Date.now() + this.retryDelayMs;
      this.retryDelayMs = Math.min(120000, this.retryDelayMs * 2);
    } finally {
      this.flushInFlight = false;
    }
  }

  flushWithBeacon() {
    if (!this.consentGranted) return;
    if (!this.endpoint) return;
    if (!navigator.sendBeacon) return;
    if (!this.pendingQueue.length) return;
    const batch = this.pendingQueue.slice(0, this.maxBatchSize);
    const payload = JSON.stringify({
      schemaVersion: this.schemaVersion,
      playerId: this.playerId,
      sessionId: this.sessionId,
      events: batch
    });
    const sent = navigator.sendBeacon(this.endpoint, new Blob([payload], { type: 'application/json' }));
    if (sent) {
      this.pendingQueue = this.pendingQueue.slice(batch.length);
      this.persistQueue();
    }
  }

  getEvents() {
    return [...this.events];
  }
}

window.DiagnosticsSystem = new DiagnosticsSystem();
window.AnalyticsSystem = new AnalyticsSystem();
