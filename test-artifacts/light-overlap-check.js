const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const checks = [];

  function check(name, pass, details = '') {
    checks.push({ name, pass, details });
  }

  await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('water_puzzle_tutorial_completed', 'true');
    localStorage.setItem('water_puzzle_theme_selection', 'light');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  await page.evaluate(() => window.ThemeSystem?.setTheme('light'));
  await page.waitForTimeout(150);

  await page.click('#top-menu-toggle');
  await page.waitForTimeout(180);

  const layout = await page.evaluate(() => {
    const tray = document.getElementById('top-utilities-tray');
    const progress = document.getElementById('progress-container');
    const canvas = document.getElementById('gameCanvas');
    const hintsParent = document.getElementById('hud-pill-hints')?.parentElement?.id || null;
    const starsParent = document.getElementById('hud-pill-stars')?.parentElement?.id || null;
    const body = document.body;

    const trayRect = tray.getBoundingClientRect();
    const progressRect = progress.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const progressDisplay = getComputedStyle(progress).display;
    const hasLayoutApi = typeof window.getLayout === 'function';
    const topSafeCanvas = hasLayoutApi ? window.getLayout().topSafeY : 0;
    const topSafeCss = hasLayoutApi
      ? canvasRect.top + topSafeCanvas * (canvasRect.height / canvas.height)
      : 0;

    return {
      trayOpen: tray.classList.contains('open'),
      bodyLight: body.classList.contains('theme-light'),
      bodyUtilitiesOpen: body.classList.contains('utilities-open'),
      trayBottom: trayRect.bottom,
      progressTop: progressRect.top,
      progressBottom: progressRect.bottom,
      progressDisplay,
      hasLayoutApi,
      topSafeCss,
      hintsParent,
      starsParent
    };
  });

  check('Theme is light', layout.bodyLight);
  check('Utilities-open class applied', layout.bodyUtilitiesOpen);
  check('Utilities tray open', layout.trayOpen);
  check('Progress remains visible in desktop light mode', layout.progressDisplay !== 'none', layout.progressDisplay);
  check('Progress sits below tray when open', layout.progressTop >= layout.trayBottom, `${layout.progressTop} vs ${layout.trayBottom}`);
  check('Gameplay safe top clears progress panel', layout.hasLayoutApi && layout.topSafeCss >= layout.progressBottom, `${layout.topSafeCss} vs ${layout.progressBottom}`);
  check('Hints pill moved to utility tray', layout.hintsParent === 'top-utilities-tray', layout.hintsParent || 'none');
  check('Stars pill moved to utility tray', layout.starsParent === 'top-utilities-tray', layout.starsParent || 'none');

  const failed = checks.filter((c) => !c.pass);
  console.log(JSON.stringify({ passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));

  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
