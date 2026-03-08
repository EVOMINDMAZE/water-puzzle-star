const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:4174/';
const ROOT = '/Users/riad/Downloads/water-puzzle-star';
const RELEASE_CHECKLIST_PATH = path.join(
  ROOT,
  '.trae/specs/build-profitable-publishing-foundation/release-readiness.json'
);

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function verifyReleaseChecklist() {
  if (!fs.existsSync(RELEASE_CHECKLIST_PATH)) {
    return {
      pass: false,
      details: `Missing release checklist file: ${RELEASE_CHECKLIST_PATH}`
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(RELEASE_CHECKLIST_PATH, 'utf8'));
  } catch (err) {
    return {
      pass: false,
      details: `Failed to parse release checklist JSON: ${err.message}`
    };
  }

  const metadataOk =
    hasText(parsed?.product?.appName) &&
    hasText(parsed?.storeMetadata?.shortDescription) &&
    hasText(parsed?.storeMetadata?.fullDescription);
  const privacyOk =
    typeof parsed?.privacyDisclosures?.collectsAnalytics === 'boolean' &&
    typeof parsed?.privacyDisclosures?.collectsCrashLogs === 'boolean' &&
    hasText(parsed?.storeMetadata?.privacyPolicyUrl);
  const ratingOk =
    hasText(parsed?.contentRatings?.googlePlay?.violence) &&
    hasText(parsed?.contentRatings?.appStore?.ageRating);
  const visualAssets = parsed?.visualAssets || {};
  const visualAssetsOk = hasText(visualAssets.icon) &&
    hasText(visualAssets.featureGraphic) &&
    Array.isArray(visualAssets.phoneScreenshots) &&
    visualAssets.phoneScreenshots.length > 0;

  const pass = metadataOk && privacyOk && ratingOk && visualAssetsOk;
  return {
    pass,
    details: JSON.stringify({
      metadataOk,
      privacyOk,
      ratingOk,
      visualAssetsOk
    })
  };
}

(async () => {
  const outDir = path.join(ROOT, 'test-artifacts', `task5-validation-${nowStamp()}`);
  fs.mkdirSync(outDir, { recursive: true });

  const checks = [];
  const consoleEntries = [];

  function record(name, pass, details = '') {
    checks.push({ name, pass, details });
  }

  const releaseChecklistCheck = verifyReleaseChecklist();
  record(
    'Release checklist includes metadata, privacy, ratings, and visual assets',
    releaseChecklistCheck.pass,
    releaseChecklistCheck.details
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    consoleEntries.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', err => {
    consoleEntries.push({ type: 'pageerror', text: err.message || String(err) });
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('water_puzzle_lvl', '0');
      localStorage.setItem('maxUnlockedLevel', '0');
      localStorage.setItem('water_puzzle_hints', '5');
      localStorage.setItem('water_puzzle_stars', '0');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    await page.click('#top-menu-toggle');
    await page.waitForTimeout(200);

    const rewardedHintOffer = page.locator('button[aria-label="Watch ad for hints"]');
    const rewardedRetryOffer = page.locator('button[aria-label="Watch ad for retry assist"]');
    const adFreeOffer = page.locator('button[aria-label="Buy ad-free entitlement"]');
    const hintBundleOffer = page.locator('button[aria-label="Buy hint bundle"]');

    const monetizationButtonsPresent = await rewardedHintOffer.count() > 0 &&
      await rewardedRetryOffer.count() > 0 &&
      await adFreeOffer.count() > 0 &&
      await hintBundleOffer.count() > 0;
    record(
      'Rewarded ad and purchase offers are present in HUD utility tray',
      monetizationButtonsPresent
    );

    const hintsBeforeDecline = await page.locator('#hint-count').innerText();
    await rewardedHintOffer.click();
    await page.waitForTimeout(180);
    const rewardDialogText = await page.locator('.dialog-message').first().innerText();
    const rewardMessageClear = rewardDialogText.includes('rewarded ad') && rewardDialogText.includes('+3 hints');
    await page.click('.dialog-btn:has-text("Not Now")');
    await page.waitForTimeout(180);
    const hintsAfterDecline = await page.locator('#hint-count').innerText();

    record(
      'Rewarded hint dialog communicates value exchange clearly',
      rewardMessageClear,
      rewardDialogText
    );
    record(
      'Declining rewarded hint offer does not grant reward',
      hintsBeforeDecline === hintsAfterDecline,
      `${hintsBeforeDecline} -> ${hintsAfterDecline}`
    );

    await hintBundleOffer.click();
    await page.waitForTimeout(180);
    const purchaseDialogText = await page.locator('.dialog-message').first().innerText();
    const purchaseMessageClear = purchaseDialogText.includes('Hint Bundle') && purchaseDialogText.includes('$1.99');
    await page.click('.dialog-btn:has-text("Cancel")');
    await page.waitForTimeout(180);
    record(
      'Purchase dialog communicates bundle value and price clearly',
      purchaseMessageClear,
      purchaseDialogText
    );

    const analyticsCheck = await page.evaluate(() => {
      const events = window.AnalyticsSystem.getEvents();
      const hasSession = events.some((event) => event.eventType === 'session_start');
      const hasAd = events.some((event) => event.eventType === 'ad_offer_shown');
      const hasPurchase = events.some((event) => event.eventType === 'purchase_offer_shown');
      return {
        pass: hasSession && hasAd && hasPurchase,
        hasSession,
        hasAd,
        hasPurchase
      };
    });
    record(
      'Analytics events emit for session, ad funnel, and purchase funnel states',
      analyticsCheck.pass,
      JSON.stringify(analyticsCheck)
    );

    const noForcedGate = await page.evaluate(() => {
      const beforeLevel = lvlIdx;
      initLevel(lvlIdx + 1);
      const afterLevel = lvlIdx;
      return {
        pass: Number.isInteger(beforeLevel) && Number.isInteger(afterLevel) && afterLevel === beforeLevel + 1,
        beforeLevel,
        afterLevel
      };
    });
    record(
      'Core progression remains playable without accepting monetization offers',
      noForcedGate.pass,
      JSON.stringify(noForcedGate)
    );

    const entitlementCheck = await page.evaluate(() => {
      const monetization = window.MonetizationSystem;
      if (!monetization) return { pass: false, reason: 'missing_monetization_system' };
      monetization.state.adFreeEntitled = true;
      const interstitialAllowed = monetization.shouldShowInterstitial('task5_validation');
      const rewardedButtons = Array.from(document.querySelectorAll('#top-utilities-tray button'))
        .map((btn) => btn.getAttribute('aria-label') || '')
        .filter(Boolean);
      const rewardedStillVisible = rewardedButtons.some((label) => label.includes('Watch ad for hints'));
      return {
        pass: interstitialAllowed === false && rewardedStillVisible === true,
        interstitialAllowed,
        rewardedStillVisible
      };
    });
    record(
      'Ad-free entitlement disables interstitial checks while rewarded ads remain optional',
      entitlementCheck.pass,
      JSON.stringify(entitlementCheck)
    );

    const idempotencyCheck = await page.evaluate(() => {
      const monetization = window.MonetizationSystem;
      if (!monetization) return { pass: false, reason: 'missing_monetization_system' };
      const baseline = monetization.getHintBalance();
      const txId = `task5_idempotency_${Date.now()}`;
      const product = monetization.catalog.hints_small;
      const first = monetization.grantPurchase(txId, product);
      const afterFirst = monetization.getHintBalance();
      const second = monetization.grantPurchase(txId, product);
      const afterSecond = monetization.getHintBalance();
      return {
        pass: first.granted === true &&
          second.granted === false &&
          afterFirst - baseline === (product.hints || 0) &&
          afterSecond === afterFirst,
        baseline,
        afterFirst,
        afterSecond,
        first,
        second
      };
    });
    await page.reload({ waitUntil: 'networkidle' });
    const persistedHints = await page.evaluate(() => window.MonetizationSystem.getHintBalance());
    record(
      'Hint bundle grants are idempotent and persist after reload',
      idempotencyCheck.pass && Number.isFinite(persistedHints) && persistedHints === idempotencyCheck.afterSecond,
      JSON.stringify({ idempotencyCheck, persistedHints })
    );

    const retentionChecks = await page.evaluate(() => {
      const ds = window.DailyChallengeSystem;
      if (!ds) return { pass: false, reason: 'missing_daily_system' };
      const now = Date.now();
      const activeNow = ds.getActiveLiveEvents(now);
      const activeBefore = ds.getActiveLiveEvents(Date.parse('2026-02-20T12:00:00Z'));
      const milestoneExists = ds.retentionConfig.streakMilestones.some((m) => m.days === 3);
      const prevStreak = ds.streak;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);
      const date = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      localStorage.setItem(ds.streakStorageKey, '4');
      localStorage.setItem(ds.lastCompletionStorageKey, date);
      ds.streak = 4;
      ds.applyStreakResetPolicy(ds.getTodayString());
      const resetApplied = ds.streak === 0;
      ds.streak = prevStreak;
      localStorage.setItem(ds.streakStorageKey, String(prevStreak));
      return {
        pass: milestoneExists && activeNow.length > 0 && activeBefore.length === 0 && resetApplied,
        milestoneExists,
        activeNow: activeNow.map((e) => e.id),
        activeBeforeCount: activeBefore.length,
        resetApplied
      };
    });
    record(
      'Streak milestones and missed-day reset policy follow configured rules',
      retentionChecks.pass,
      JSON.stringify(retentionChecks)
    );
    record(
      'Limited-time events activate/deactivate by configured windows',
      retentionChecks.activeNow && retentionChecks.activeBeforeCount === 0,
      JSON.stringify({ activeNow: retentionChecks.activeNow, activeBeforeCount: retentionChecks.activeBeforeCount })
    );

    const diagnosticsCheck = await page.evaluate(() => {
      localStorage.setItem('water_puzzle_liveops_config', JSON.stringify({
        streakMilestones: [{ days: 0, rewards: { stars: -1, hints: -1 } }],
        liveEvents: [{ id: 'broken_event', startAt: 'oops', endAt: 'invalid', rewards: {} }]
      }));
      const ds = window.DailyChallengeSystem;
      ds.loadRetentionConfig();
      const entries = window.DiagnosticsSystem.getEntries();
      const hasLiveEventDiagnostic = entries.some((entry) => entry.code === 'live_event_window_invalid');
      const hasFallbackDiagnostic = entries.some((entry) => entry.code === 'live_events_fallback_applied');
      localStorage.removeItem('water_puzzle_liveops_config');
      ds.loadRetentionConfig();
      return {
        pass: hasLiveEventDiagnostic && hasFallbackDiagnostic,
        hasLiveEventDiagnostic,
        hasFallbackDiagnostic
      };
    });
    record(
      'Invalid monetization/event config fails safely with diagnostics',
      diagnosticsCheck.pass,
      JSON.stringify(diagnosticsCheck)
    );

    await page.screenshot({ path: path.join(outDir, 'task5-final.png'), fullPage: true });
  } catch (error) {
    record('Task 5 validation script completed without runtime crash', false, error.stack || String(error));
  } finally {
    await browser.close();
  }

  const severeConsole = consoleEntries.filter((entry) => entry.type === 'error' || entry.type === 'pageerror');
  record(
    'No console errors/page exceptions during Task 5 validation',
    severeConsole.length === 0,
    severeConsole.map((entry) => `${entry.type}: ${entry.text}`).join(' | ')
  );

  const summary = {
    timestamp: new Date().toISOString(),
    outDir,
    passed: checks.filter((check) => check.pass).length,
    failed: checks.filter((check) => !check.pass).length,
    total: checks.length,
    checks,
    consoleEntries
  };

  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
})();
