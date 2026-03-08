class MonetizationSystem {
  constructor() {
    this.storageKey = 'water_puzzle_economy_v1';
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
      hintsBalance: 5,
      processedTransactions: {},
      updatedAt: Date.now()
    };
    this.restoreState();
  }

  restoreState() {
    const persisted = localStorage.getItem(this.storageKey);
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted);
        this.state.adFreeEntitled = Boolean(parsed?.adFreeEntitled);
        const parsedHints = Number(parsed?.hintsBalance);
        this.state.hintsBalance = Number.isFinite(parsedHints) ? Math.max(0, Math.floor(parsedHints)) : 5;
        this.state.processedTransactions = parsed?.processedTransactions && typeof parsed.processedTransactions === 'object'
          ? parsed.processedTransactions
          : {};
      } catch (_) {
        this.state = {
          adFreeEntitled: false,
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

  isAdFreeEntitled() {
    return this.state.adFreeEntitled;
  }

  shouldShowInterstitial(placement) {
    const allowed = !this.state.adFreeEntitled;
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
      this.state.adFreeEntitled = true;
      this.persistState();
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
