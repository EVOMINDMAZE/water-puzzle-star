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
    localStorage.setItem('water_puzzle_tutorial_completed', 'true');
    localStorage.removeItem('water_puzzle_info_feedback');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const inTopHud = await page.$$eval('#top-hud .help-trigger, #top-hud .theme-toggle, #top-hud .difficulty-selector, #top-hud .daily-challenge-btn, #top-hud .achievements-btn', (els) => els.length);
  push('Utility pills removed from top HUD row', inTopHud === 0, `count=${inTopHud}`);

  const inTray = await page.$$eval('#top-utilities-tray .help-trigger, #top-utilities-tray .theme-toggle, #top-utilities-tray .difficulty-selector, #top-utilities-tray .daily-challenge-btn, #top-utilities-tray .achievements-btn', (els) => els.length);
  push('Utility pills moved into utility tray', inTray >= 3, `count=${inTray}`);

  const trayHiddenBefore = await page.$eval('#top-utilities-tray', (el) => !el.classList.contains('open'));
  push('Utility tray closed by default', trayHiddenBefore);

  await page.click('#top-menu-toggle');
  await page.waitForTimeout(160);
  const trayOpenAfterToggle = await page.$eval('#top-utilities-tray', (el) => el.classList.contains('open'));
  push('Utility tray opens from menu toggle', trayOpenAfterToggle);

  await page.mouse.click(8, 8);
  await page.waitForTimeout(160);
  const trayClosedOutside = await page.$eval('#top-utilities-tray', (el) => !el.classList.contains('open'));
  push('Utility tray closes on outside click', trayClosedOutside);

  const infoQueueBlocked = await page.evaluate(() => {
    const fs = window.FeedbackSystem;
    if (!fs) return false;
    const before = fs.feedbackQueue.length;
    fs.info('Temporary info test');
    return fs.feedbackQueue.length === before;
  });
  push('Info notifications suppressed by default', infoQueueBlocked);

  const failed = checks.filter((c) => !c.pass);
  console.log(JSON.stringify({ passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));

  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
