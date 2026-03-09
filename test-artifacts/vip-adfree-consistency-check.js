const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const checks = [];

  function push(name, pass, details = '') {
    checks.push({ name, pass, details });
  }

  await page.goto('http://127.0.0.1:4175/?mode=ads', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('water_puzzle_economy_v1', JSON.stringify({
      adFreeEntitled: false,
      adFreePurchased: false,
      hintsBalance: 0,
      processedTransactions: {},
      updatedAt: Date.now()
    }));
    localStorage.setItem('water_puzzle_hints', '0');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(250);

  const vipResolution = await page.evaluate(() => {
    window.history.replaceState({}, '', '/vip');
    return window.MonetizationSystem.resolveAdMode();
  });
  push('VIP path resolves adfree mode', vipResolution.mode === 'adfree', JSON.stringify(vipResolution));

  const staleHudBefore = await page.evaluate(() => ({
    hud: document.getElementById('hint-count')?.textContent || '',
    aria: document.getElementById('hint-btn')?.getAttribute('aria-label') || '',
    disabled: Boolean(document.getElementById('hint-btn')?.disabled)
  }));

  const staleHudAfterResolution = await page.evaluate(() => {
    const applied = window.MonetizationSystem.applyAdModeResolution({
      mode: 'adfree',
      source: 'test',
      reason: 'vip_route'
    });
    window.MonetizationSystem.track('ad_mode_resolved', applied);
    return {
      applied,
      hud: document.getElementById('hint-count')?.textContent || '',
      aria: document.getElementById('hint-btn')?.getAttribute('aria-label') || '',
      disabled: Boolean(document.getElementById('hint-btn')?.disabled)
    };
  });

  push(
    'HUD reflects FREE hint immediately after adfree resolution',
    staleHudAfterResolution.hud === 'FREE',
    JSON.stringify({ before: staleHudBefore, after: staleHudAfterResolution })
  );
  push(
    'Hint button is enabled after adfree resolution',
    staleHudAfterResolution.disabled === false,
    JSON.stringify({ before: staleHudBefore, after: staleHudAfterResolution })
  );

  const failed = checks.filter((item) => !item.pass);
  console.log(JSON.stringify({ passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
