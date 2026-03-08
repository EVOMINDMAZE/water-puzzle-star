const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const sizes = [
    { name: 'tablet-portrait', width: 828, height: 1064 },
    { name: 'mobile-portrait', width: 390, height: 844 }
  ];

  const report = [];

  for (const size of sizes) {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('water_puzzle_tutorial_completed', 'true');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const row = await page.evaluate(() => {
      const hud = document.getElementById('top-hud');
      const pills = Array.from(hud.querySelectorAll('.hud-pill'));
      const visible = pills.filter((el) => getComputedStyle(el).display !== 'none');
      const progress = document.getElementById('progress-container');
      return {
        hudClasses: hud.className,
        totalPills: pills.length,
        visiblePills: visible.length,
        visiblePillLabels: visible.map((el) => (el.querySelector('.hud-label')?.textContent || '').trim()),
        progressDisplay: progress ? getComputedStyle(progress).display : 'missing'
      };
    });

    report.push({ viewport: size.name, ...row });
  }

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
