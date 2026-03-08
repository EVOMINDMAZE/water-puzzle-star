const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const checks = [];

  function push(name, pass, details = '') {
    checks.push({ name, pass, details });
  }

  await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.removeItem('water_puzzle_economy_v1');
    localStorage.removeItem('water_puzzle_ad_mode_grant_v1');
    localStorage.removeItem('water_puzzle_hints');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const defaultState = await page.evaluate(() => {
    const ms = window.MonetizationSystem;
    const check = ms.shouldShowInterstitial('ad_mode_test_default');
    return {
      interstitialAllowed: check,
      entitled: ms.isAdFreeEntitled(),
      resolution: ms.adModeResolution
    };
  });
  push('Default mode allows interstitials', defaultState.interstitialAllowed === true, JSON.stringify(defaultState));

  const validInviteState = await page.evaluate(async () => {
    const ms = window.MonetizationSystem;
    ms.inviteVerifyEndpoint = 'https://verify.example.test/verify-invite';
    const realFetch = window.fetch.bind(window);
    window.fetch = async () => ({
      ok: true,
      json: async () => ({
        valid: true,
        mode: 'adfree',
        expiresAt: new Date(Date.now() + 600000).toISOString(),
        campaignId: 'qa_campaign',
        reason: ''
      })
    });
    const result = await ms.processInviteToken('valid.token');
    window.fetch = realFetch;
    return {
      result,
      entitled: ms.isAdFreeEntitled(),
      interstitialAllowed: ms.shouldShowInterstitial('ad_mode_test_valid')
    };
  });
  push('Valid invite resolves ad-free', validInviteState.entitled === true && validInviteState.interstitialAllowed === false, JSON.stringify(validInviteState));

  const invalidInviteState = await page.evaluate(async () => {
    const ms = window.MonetizationSystem;
    ms.inviteVerifyEndpoint = 'https://verify.example.test/verify-invite';
    ms.state.adFreePurchased = false;
    ms.state.adFreeEntitled = false;
    ms.persistState();
    localStorage.removeItem('water_puzzle_ad_mode_grant_v1');
    const realFetch = window.fetch.bind(window);
    window.fetch = async () => ({
      ok: true,
      json: async () => ({
        valid: false,
        mode: 'ads',
        expiresAt: null,
        campaignId: '',
        reason: 'expired_token'
      })
    });
    const result = await ms.processInviteToken('invalid.token');
    window.fetch = realFetch;
    return {
      result,
      entitled: ms.isAdFreeEntitled(),
      interstitialAllowed: ms.shouldShowInterstitial('ad_mode_test_invalid')
    };
  });
  push('Invalid invite falls back to ads', invalidInviteState.entitled === false && invalidInviteState.interstitialAllowed === true, JSON.stringify(invalidInviteState));

  const failed = checks.filter((check) => !check.pass);
  console.log(JSON.stringify({ passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
