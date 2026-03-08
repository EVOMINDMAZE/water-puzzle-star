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
    localStorage.setItem('water_puzzle_difficulty', 'casual');
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
  await page.waitForTimeout(350);

  const casualAdsState = await page.evaluate(() => ({
    canUseHint: window.DifficultySystem.canUseHint(),
    entitled: window.MonetizationSystem.isAdFreeEntitled(),
    hintBalance: window.MonetizationSystem.getHintBalance()
  }));
  push('Casual mode with ads does not grant free unlimited hints', casualAdsState.canUseHint === false, JSON.stringify(casualAdsState));

  await page.evaluate(() => {
    localStorage.setItem('water_puzzle_difficulty', 'normal');
    localStorage.setItem('water_puzzle_economy_v1', JSON.stringify({
      adFreeEntitled: false,
      adFreePurchased: false,
      hintsBalance: 2,
      processedTransactions: {},
      updatedAt: Date.now()
    }));
    localStorage.setItem('water_puzzle_hints', '2');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(350);
  await page.click('#hint-btn');
  await page.waitForTimeout(450);

  const adsConsumption = await page.evaluate(() => ({
    entitled: window.MonetizationSystem.isAdFreeEntitled(),
    hintBalance: window.MonetizationSystem.getHintBalance(),
    hudText: document.getElementById('hint-count')?.textContent || ''
  }));
  push('Ads mode consumes one hint', adsConsumption.hintBalance === 1, JSON.stringify(adsConsumption));

  await page.evaluate(() => {
    localStorage.setItem('water_puzzle_difficulty', 'normal');
    localStorage.setItem('water_puzzle_economy_v1', JSON.stringify({
      adFreeEntitled: true,
      adFreePurchased: true,
      hintsBalance: 2,
      processedTransactions: {},
      updatedAt: Date.now()
    }));
    localStorage.setItem('water_puzzle_hints', '2');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(350);
  await page.click('#hint-btn');
  await page.waitForTimeout(450);

  const adfreeState = await page.evaluate(() => ({
    entitled: window.MonetizationSystem.isAdFreeEntitled(),
    canUseHint: window.DifficultySystem.canUseHint(),
    hintBalance: window.MonetizationSystem.getHintBalance(),
    hudText: document.getElementById('hint-count')?.textContent || ''
  }));
  push('Ad-free mode keeps hint balance unchanged after hint use', adfreeState.hintBalance === 2, JSON.stringify(adfreeState));
  push('Ad-free mode always allows hint usage', adfreeState.canUseHint === true, JSON.stringify(adfreeState));

  const failed = checks.filter((item) => !item.pass);
  console.log(JSON.stringify({ passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
