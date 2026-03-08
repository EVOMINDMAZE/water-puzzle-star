const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const checks = [];

  function check(name, pass, details = '') {
    checks.push({ name, pass, details });
  }

  await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('water_puzzle_tutorial_completed', 'true');
    localStorage.setItem('water_puzzle_theme_selection', 'auto');
    localStorage.setItem('water_puzzle_lvl', '0');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  await page.click('#menu-btn');
  await page.waitForTimeout(180);
  const menuOpen = await page.locator('#level-menu-overlay').evaluate((el) => el.classList.contains('active'));
  check('Menu opens', menuOpen);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(180);
  const menuClosed = await page.locator('#level-menu-overlay').evaluate((el) => !el.classList.contains('active'));
  check('Menu closes with Escape', menuClosed);

  await page.evaluate(() => showWin());
  await page.waitForTimeout(800);
  const winOpen = await page.locator('#win-overlay').evaluate((el) => el.classList.contains('active'));
  check('Win overlay opens', winOpen);

  const starCount = await page.locator('.win-star').count();
  check('Win stars render as class-driven nodes', starCount === 3, `stars=${starCount}`);

  const hasThemeClass = await page.locator('body').evaluate((el) =>
    Array.from(el.classList).some((x) => x.startsWith('theme-'))
  );
  check('Theme class applied to body', hasThemeClass);

  const hasHudIds = await page.evaluate(() =>
    ['hud-pill-world', 'hud-pill-moves', 'hud-pill-target', 'hud-pill-hints', 'hud-pill-stars']
      .every((id) => Boolean(document.getElementById(id)))
  );
  check('HUD pill IDs exist for responsive compact mode', hasHudIds);

  const failed = checks.filter((c) => !c.pass);
  console.log(JSON.stringify({ passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));

  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
