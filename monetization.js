class MonetizationSystem {
  constructor() {
    this.storageKey = 'water_puzzle_economy_v1';
    this.adModeGrantKey = 'water_puzzle_ad_mode_grant_v1';
    this.defaultAdMode = 'ads';
    this.inviteVerifyTimeoutMs = 3000;
    this.inviteVerifyRetries = 1;
    this.adModeResolution = { mode: 'ads', source: 'startup_default', reason: 'boot' };
    this.inviteVerifyEndpoint = typeof window !== 'undefined' && typeof window.AD_MODE_VERIFY_ENDPOINT === 'string'
      ? window.AD_MODE_VERIFY_ENDPOINT
      : '';
    this.catalog = {
      ad_free: {
        id: 'ad_free',
        type: 'entitlement',
        title: 'Ad-Free Mode',
        priceUsd: 4.99
      },
      hints_small: {
        id: 'hints_small',
        type: 'consumable',
        title: 'Hint Bundle S',
        hints: 10,
        priceUsd: 1.99
      },
      hints_medium: {
        id: 'hints_medium',
        type: 'consumable',
        title: 'Hint Bundle M',
        hints: 25,
        priceUsd: 3.99
      }
    };
    this.state = {
      adFreeEntitled: false,
      adFreePurchased: false,
      hintsBalance: 5,
      processedTransactions: {},
      updatedAt: Date.now()
    };
    this.restoreState();
    this.initializeAdMode();
  }

  restoreState() {
    const persisted = localStorage.getItem(this.storageKey);
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted);
        this.state.adFreeEntitled = Boolean(parsed?.adFreeEntitled);
        if (typeof parsed?.adFreePurchased === 'boolean') {
          this.state.adFreePurchased = parsed.adFreePurchased;
        } else {
          this.state.adFreePurchased = this.state.adFreeEntitled;
        }
        const parsedHints = Number(parsed?.hintsBalance);
        this.state.hintsBalance = Number.isFinite(parsedHints) ? Math.max(0, Math.floor(parsedHints)) : 5;
        this.state.processedTransactions = parsed?.processedTransactions && typeof parsed.processedTransactions === 'object'
          ? parsed.processedTransactions
          : {};
      } catch (_) {
        this.state = {
          adFreeEntitled: false,
          adFreePurchased: false,
          hintsBalance: 5,
          processedTransactions: {},
          updatedAt: Date.now()
        };
      }
    } else {
      const legacyHints = Number(localStorage.getItem('water_puzzle_hints'));
      if (Number.isFinite(legacyHints) && legacyHints >= 0) {
        this.state.hintsBalance = Math.floor(legacyHints);
      }
    }
    this.persistState();
  }

  persistState() {
    this.state.adFreeEntitled = Boolean(this.state.adFreePurchased || this.state.adFreeEntitled);
    this.state.updatedAt = Date.now();
    localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    localStorage.setItem('water_puzzle_hints', String(this.state.hintsBalance));
  }

  track(eventName, payload = {}) {
    const normalizedPayload = {
      ...payload,
      adFreeEntitled: this.state.adFreeEntitled,
      hintsBalance: this.state.hintsBalance,
      timestamp: Date.now()
    };
    if (window.SocialSystem && typeof window.SocialSystem.trackEvent === 'function') {
      window.SocialSystem.trackEvent(`monetization_${eventName}`, normalizedPayload);
    }
    window.dispatchEvent(new CustomEvent('monetizationEvent', {
      detail: {
        name: eventName,
        payload: normalizedPayload
      }
    }));
    if ((eventName === 'ad_failed' || eventName === 'purchase_failed') && window.DiagnosticsSystem && typeof window.DiagnosticsSystem.record === 'function') {
      window.DiagnosticsSystem.record('monetization_failure', {
        eventName,
        payload: normalizedPayload
      }, 'warning');
    }
  }

  getCatalog() {
    return Object.values(this.catalog).map((item) => ({ ...item }));
  }

  getHintBalance() {
    return this.state.hintsBalance;
  }

  getStarBalance() {
    const stars = Number(localStorage.getItem('water_puzzle_stars'));
    if (!Number.isFinite(stars)) return 0;
    return Math.max(0, Math.floor(stars));
  }

  getInviteVerifyEndpoint() {
    if (typeof window !== 'undefined' && typeof window.AD_MODE_VERIFY_ENDPOINT === 'string' && window.AD_MODE_VERIFY_ENDPOINT.trim()) {
      return window.AD_MODE_VERIFY_ENDPOINT.trim();
    }
    return this.inviteVerifyEndpoint;
  }

  getQueryParams() {
    if (typeof window === 'undefined' || !window.location || !window.location.search) return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }

  getQueryMode() {
    const mode = this.getQueryParams().get('mode');
    if (mode === 'ads' || mode === 'adfree') return mode;
    return '';
  }

  getPathMode() {
    if (typeof window === 'undefined' || !window.location || typeof window.location.pathname !== 'string') return '';
    const path = window.location.pathname.trim().toLowerCase();
    if (path === '/vip' || path === '/vip/') return 'adfree';
    if (path === '/play' || path === '/play/') return 'ads';
    return '';
  }

  getInviteTokenFromQuery() {
    const token = this.getQueryParams().get('invite');
    if (!token || typeof token !== 'string') return '';
    return token.trim();
  }

  getPersistedAdModeGrant() {
    const raw = localStorage.getItem(this.adModeGrantKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.mode !== 'adfree') return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  setPersistedAdModeGrant(grant) {
    if (!grant || typeof grant !== 'object') return;
    localStorage.setItem(this.adModeGrantKey, JSON.stringify({
      mode: 'adfree',
      source: typeof grant.source === 'string' ? grant.source : 'invite',
      expiresAt: typeof grant.expiresAt === 'string' ? grant.expiresAt : null,
      campaignId: typeof grant.campaignId === 'string' ? grant.campaignId : '',
      updatedAt: Date.now()
    }));
  }

  clearPersistedAdModeGrant(reason = 'cleared') {
    localStorage.removeItem(this.adModeGrantKey);
    this.track('invite_rejected', { reason });
  }

  isGrantActive(grant, nowMs = Date.now()) {
    if (!grant || grant.mode !== 'adfree') return false;
    if (!grant.expiresAt) return true;
    const expiresMs = Date.parse(grant.expiresAt);
    if (!Number.isFinite(expiresMs)) return false;
    return expiresMs > nowMs;
  }

  buildResolution(mode, source, reason = '') {
    return {
      mode: mode === 'adfree' ? 'adfree' : 'ads',
      source: typeof source === 'string' ? source : 'default',
      reason: typeof reason === 'string' ? reason : ''
    };
  }

  resolveAdMode(options = {}) {
    const purchased = Boolean(this.state.adFreePurchased);
    if (purchased) {
      return this.buildResolution('adfree', 'purchase_entitlement', 'purchased_ad_free');
    }
    if (options.forceAdsFallback) {
      return this.buildResolution('ads', 'invite_fallback', 'forced_ads_fallback');
    }
    const queryMode = this.getQueryMode();
    if (queryMode === 'ads') {
      return this.buildResolution('ads', 'query_mode', 'explicit_ads_mode');
    }
    if (queryMode === 'adfree' && !options.ignoreQueryAdfree) {
      return this.buildResolution('adfree', 'query_mode', 'explicit_adfree_mode');
    }
    const pathMode = this.getPathMode();
    if (pathMode === 'adfree') {
      return this.buildResolution('adfree', 'path_mode', 'vip_path_mode');
    }
    if (pathMode === 'ads') {
      return this.buildResolution('ads', 'path_mode', 'play_path_mode');
    }
    const persistedGrant = this.getPersistedAdModeGrant();
    if (persistedGrant) {
      if (this.isGrantActive(persistedGrant)) {
        const result = this.buildResolution('adfree', persistedGrant.source || 'persisted_grant', 'valid_persisted_grant');
        result.expiresAt = persistedGrant.expiresAt || null;
        result.campaignId = persistedGrant.campaignId || '';
        return result;
      }
      localStorage.removeItem(this.adModeGrantKey);
      return this.buildResolution('ads', 'expired_grant', 'persisted_grant_expired');
    }
    return this.buildResolution(this.defaultAdMode, 'default_mode', 'no_override');
  }

  applyAdModeResolution(resolution) {
    const resolved = resolution && typeof resolution === 'object'
      ? resolution
      : this.buildResolution(this.defaultAdMode, 'default_mode', 'invalid_resolution');
    this.adModeResolution = resolved;
    const entitled = Boolean(this.state.adFreePurchased || resolved.mode === 'adfree');
    if (this.state.adFreeEntitled !== entitled) {
      this.state.adFreeEntitled = entitled;
      this.persistState();
    }
    return {
      mode: entitled ? 'adfree' : 'ads',
      source: resolved.source || 'default_mode',
      reason: resolved.reason || '',
      expiresAt: resolved.expiresAt || null,
      campaignId: resolved.campaignId || ''
    };
  }

  hashTokenFragment(token) {
    if (typeof token !== 'string' || !token) return '';
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = ((hash << 5) - hash + token.charCodeAt(i)) | 0;
    }
    return String(Math.abs(hash)).slice(0, 10);
  }

  async verifyInviteToken(token) {
    const endpoint = this.getInviteVerifyEndpoint();
    if (!endpoint) {
      return {
        valid: false,
        reason: 'missing_verify_endpoint'
      };
    }
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller
      ? setTimeout(() => controller.abort(), this.inviteVerifyTimeoutMs)
      : null;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        signal: controller ? controller.signal : undefined
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data || typeof data !== 'object') {
        return {
          valid: false,
          reason: 'verify_request_failed'
        };
      }
      return {
        valid: Boolean(data.valid),
        mode: data.mode === 'adfree' ? 'adfree' : 'ads',
        expiresAt: typeof data.expiresAt === 'string' ? data.expiresAt : null,
        campaignId: typeof data.campaignId === 'string' ? data.campaignId : '',
        reason: typeof data.reason === 'string' ? data.reason : ''
      };
    } catch (_) {
      return {
        valid: false,
        reason: 'verify_network_error'
      };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async verifyInviteTokenWithRetry(token) {
    let attempt = 0;
    let result = { valid: false, reason: 'verify_unknown' };
    while (attempt <= this.inviteVerifyRetries) {
      result = await this.verifyInviteToken(token);
      if (result.valid) return result;
      if (result.reason !== 'verify_network_error') return result;
      attempt++;
    }
    return result;
  }

  async processInviteToken(token) {
    const safeToken = typeof token === 'string' ? token.trim() : '';
    if (!safeToken) {
      const fallbackResolution = this.applyAdModeResolution(this.resolveAdMode({ forceAdsFallback: true }));
      this.track('invite_rejected', { reason: 'missing_invite_token' });
      this.track('ad_mode_resolved', fallbackResolution);
      return fallbackResolution;
    }
    const result = await this.verifyInviteTokenWithRetry(safeToken);
    if (result.valid && result.mode === 'adfree') {
      this.setPersistedAdModeGrant({
        mode: 'adfree',
        source: 'invite',
        expiresAt: result.expiresAt,
        campaignId: result.campaignId
      });
      this.track('invite_verified', {
        tokenHash: this.hashTokenFragment(safeToken),
        campaignId: result.campaignId || '',
        expiresAt: result.expiresAt || null
      });
      const resolved = this.applyAdModeResolution(this.resolveAdMode());
      this.track('ad_mode_resolved', resolved);
      return resolved;
    }
    const failureReason = result.reason || 'invalid_invite';
    this.track(result.reason === 'verify_network_error' ? 'invite_verification_failed' : 'invite_rejected', {
      reason: failureReason,
      tokenHash: this.hashTokenFragment(safeToken)
    });
    this.clearPersistedAdModeGrant('invalid_or_expired_invite');
    const fallbackResolution = this.applyAdModeResolution(this.resolveAdMode({ forceAdsFallback: true }));
    this.track('ad_mode_resolved', fallbackResolution);
    return fallbackResolution;
  }

  initializeAdMode() {
    const initialResolution = this.applyAdModeResolution(this.resolveAdMode());
    this.track('ad_mode_resolved', initialResolution);
    const inviteToken = this.getInviteTokenFromQuery();
    if (inviteToken) {
      this.processInviteToken(inviteToken);
    }
  }

  isAdFreeEntitled() {
    return Boolean(this.state.adFreePurchased || this.state.adFreeEntitled);
  }

  shouldShowInterstitial(placement) {
    const allowed = !this.isAdFreeEntitled();
    this.track('interstitial_check', { placement, allowed });
    return allowed;
  }

  applyHintGrant(amount, context = {}) {
    const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
    if (!safeAmount) return 0;
    this.state.hintsBalance += safeAmount;
    this.persistState();
    this.track('hint_granted', { amount: safeAmount, ...context });
    return safeAmount;
  }

  consumeHint(amount = 1, context = {}) {
    const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
    if (!safeAmount) return 0;
    const consumed = Math.min(this.state.hintsBalance, safeAmount);
    this.state.hintsBalance -= consumed;
    this.persistState();
    this.track('hint_consumed', { amount: consumed, requested: safeAmount, ...context });
    return consumed;
  }

  applyStarGrant(amount, context = {}) {
    const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
    if (!safeAmount) return 0;
    const currentStars = this.getStarBalance();
    localStorage.setItem('water_puzzle_stars', String(currentStars + safeAmount));
    this.track('stars_granted', { amount: safeAmount, ...context });
    return safeAmount;
  }

  grantRewards(rewards = {}, context = {}) {
    const safeRewards = rewards && typeof rewards === 'object' ? rewards : {};
    const starsGranted = this.applyStarGrant(safeRewards.stars, context);
    const hintsGranted = this.applyHintGrant(safeRewards.hints, context);
    this.track('rewards_granted', {
      stars: starsGranted,
      hints: hintsGranted,
      ...context
    });
    return {
      starsGranted,
      hintsGranted,
      starsBalance: this.getStarBalance(),
      hintsBalance: this.getHintBalance()
    };
  }

  spendStars(amount, context = {}) {
    const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
    if (!safeAmount) {
      return {
        success: false,
        spent: 0,
        reason: 'invalid_amount',
        starsBalance: this.getStarBalance()
      };
    }
    const currentStars = this.getStarBalance();
    if (currentStars < safeAmount) {
      this.track('stars_spend_denied', {
        amount: safeAmount,
        balance: currentStars,
        reason: 'insufficient_stars',
        ...context
      });
      return {
        success: false,
        spent: 0,
        reason: 'insufficient_stars',
        starsBalance: currentStars
      };
    }
    const nextBalance = currentStars - safeAmount;
    localStorage.setItem('water_puzzle_stars', String(nextBalance));
    this.track('stars_spent', {
      amount: safeAmount,
      balance: nextBalance,
      ...context
    });
    return {
      success: true,
      spent: safeAmount,
      starsBalance: nextBalance
    };
  }

  async runRewardedOffer(offerId, options = {}) {
    const offerConfig = {
      hint_refill: {
        title: 'Watch Ad for Hints',
        message: 'Watch a rewarded ad to get +3 hints.',
        rewardType: 'hints',
        amount: Number(options.hintAmount) || 3
      },
      retry_assist: {
        title: 'Watch Ad for Retry Assist',
        message: 'Watch a rewarded ad to get +1 hint and a retry assist.',
        rewardType: 'hints',
        amount: Number(options.hintAmount) || 1
      },
      bonus_reward: {
        title: 'Watch Ad for Bonus Stars',
        message: 'Watch a rewarded ad to get +2 bonus stars.',
        rewardType: 'stars',
        amount: Number(options.starAmount) || 2
      }
    }[offerId];

    if (!offerConfig) {
      this.track('ad_failed', { offerId, reason: 'unknown_offer' });
      return { status: 'failed', offerId, reason: 'unknown_offer' };
    }

    this.track('ad_offer_shown', { offerId, placement: options.placement || 'unspecified' });
    const accepted = await this.confirm(offerConfig.title, offerConfig.message, 'Watch Ad', 'Not Now');
    if (!accepted) {
      this.track('ad_canceled', { offerId, placement: options.placement || 'unspecified' });
      return { status: 'canceled', offerId };
    }

    this.track('ad_started', { offerId, placement: options.placement || 'unspecified' });
    if (options.forceFail || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
      this.track('ad_failed', { offerId, reason: options.forceFail ? 'forced_failure' : 'offline' });
      return { status: 'failed', offerId, reason: options.forceFail ? 'forced_failure' : 'offline' };
    }

    this.track('ad_completed', { offerId, placement: options.placement || 'unspecified' });
    let granted = 0;
    if (offerConfig.rewardType === 'hints') {
      granted = this.grantRewards({ hints: offerConfig.amount }, { source: 'rewarded_ad', offerId }).hintsGranted;
    } else if (offerConfig.rewardType === 'stars') {
      granted = this.grantRewards({ stars: offerConfig.amount }, { source: 'rewarded_ad', offerId }).starsGranted;
    }

    this.track('ad_reward_granted', {
      offerId,
      rewardType: offerConfig.rewardType,
      amount: granted
    });
    return {
      status: 'completed',
      offerId,
      rewardType: offerConfig.rewardType,
      amount: granted
    };
  }

  async purchaseProduct(productId, options = {}) {
    const product = this.catalog[productId];
    if (!product) {
      this.track('purchase_failed', { productId, reason: 'unknown_product' });
      return { status: 'failed', reason: 'unknown_product', productId };
    }

    this.track('purchase_offer_shown', { productId, placement: options.placement || 'unspecified' });
    const accepted = await this.confirm(
      `Buy ${product.title}`,
      `Confirm purchase of ${product.title} for $${product.priceUsd.toFixed(2)}.`,
      'Buy',
      'Cancel'
    );

    if (!accepted) {
      this.track('purchase_canceled', { productId, placement: options.placement || 'unspecified' });
      return { status: 'canceled', productId };
    }

    this.track('purchase_started', { productId, placement: options.placement || 'unspecified' });
    const transactionId = options.transactionId || `${productId}:${Date.now()}`;
    const grantResult = this.grantPurchase(transactionId, product);
    this.track('purchase_completed', {
      productId,
      transactionId,
      granted: grantResult.granted,
      alreadyProcessed: !grantResult.granted
    });

    return {
      status: 'completed',
      productId,
      transactionId,
      granted: grantResult.granted,
      alreadyProcessed: !grantResult.granted
    };
  }

  grantPurchase(transactionId, product) {
    if (this.state.processedTransactions[transactionId]) {
      return { granted: false };
    }

    if (product.type === 'entitlement' && product.id === 'ad_free') {
      this.state.adFreePurchased = true;
      this.state.adFreeEntitled = true;
      this.persistState();
      this.track('ad_mode_resolved', this.applyAdModeResolution(this.resolveAdMode()));
    }

    if (product.type === 'consumable') {
      this.applyHintGrant(product.hints || 0, {
        source: 'purchase',
        productId: product.id,
        transactionId
      });
    }

    this.state.processedTransactions[transactionId] = {
      productId: product.id,
      processedAt: Date.now()
    };
    this.persistState();
    return { granted: true };
  }

  async confirm(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    if (window.DialogSystem && typeof window.DialogSystem.confirm === 'function') {
      return window.DialogSystem.confirm({
        title,
        message,
        icon: '🎁',
        confirmText,
        cancelText
      });
    }
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
}

window.MonetizationSystem = new MonetizationSystem();
