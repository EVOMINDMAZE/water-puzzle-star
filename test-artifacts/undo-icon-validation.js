const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const baseUrl = process.env.GAME_URL || 'http://127.0.0.1:4176/';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(__dirname, `undo-icon-validation-${timestamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  const report = {
    startedAt: new Date().toISOString(),
    baseUrl,
    checks: [],
    console: { errors: [], warnings: [] },
    screenshots: {},
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    const entry = `${msg.type()}: ${msg.text()}`;
    if (msg.type() === 'error') report.console.errors.push(entry);
    if (msg.type() === 'warning') report.console.warnings.push(entry);
  });

  page.on('pageerror', (err) => report.console.errors.push(`pageerror: ${err.message}`));

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(900);

    const fullPath = path.join(outDir, '01-initial-fullpage.png');
    await page.screenshot({ path: fullPath, fullPage: true });
    report.screenshots.initial = fullPath;

    const undoShotPath = path.join(outDir, '02-bottom-toolbar-undo-icon.png');
    const undoBtn = page.locator('#undo-btn');
    await undoBtn.waitFor({ state: 'visible', timeout: 10000 });
    await undoBtn.screenshot({ path: undoShotPath });
    report.screenshots.undoButton = undoShotPath;

    const iconData = await page.evaluate(() => {
      const btn = document.querySelector('#undo-btn');
      if (!btn) return { found: false };
      const svg = btn.querySelector('svg');
      const polyline = svg?.querySelector('polyline');
      const line = svg?.querySelector('line');
      return {
        found: true,
        parentId: btn.parentElement?.id || null,
        inBottomToolbar: btn.parentElement?.id === 'bottom-banner',
        ariaLabel: btn.getAttribute('aria-label'),
        hasSvg: Boolean(svg),
        svgViewBox: svg?.getAttribute('viewBox') || null,
        polylinePoints: polyline?.getAttribute('points') || null,
        lineCoords: line
          ? {
              x1: line.getAttribute('x1'),
              y1: line.getAttribute('y1'),
              x2: line.getAttribute('x2'),
              y2: line.getAttribute('y2'),
            }
          : null,
      };
    });

    const expectedNewIcon =
      iconData.polylinePoints === '11 7 5 12 11 17' &&
      iconData.lineCoords?.x1 === '19' &&
      iconData.lineCoords?.y1 === '12' &&
      iconData.lineCoords?.x2 === '6' &&
      iconData.lineCoords?.y2 === '12';

    report.checks.push({ name: 'Undo button exists', pass: iconData.found === true, details: iconData });
    report.checks.push({
      name: 'Undo button is in bottom toolbar',
      pass: iconData.inBottomToolbar === true,
      details: { parentId: iconData.parentId },
    });
    report.checks.push({
      name: 'Undo button renders updated back icon SVG',
      pass: expectedNewIcon,
      details: {
        expectedPolyline: '11 7 5 12 11 17',
        expectedLine: { x1: '19', y1: '12', x2: '6', y2: '12' },
        actualPolyline: iconData.polylinePoints,
        actualLine: iconData.lineCoords,
      },
    });
    report.checks.push({
      name: 'No browser console errors',
      pass: report.console.errors.length === 0,
      details: { errorCount: report.console.errors.length, errors: report.console.errors },
    });

    report.completedAt = new Date().toISOString();
    report.summary = {
      passed: report.checks.filter((c) => c.pass).length,
      failed: report.checks.filter((c) => !c.pass).length,
    };

    const reportPath = path.join(outDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(
      JSON.stringify(
        {
          outDir,
          reportPath,
          screenshots: report.screenshots,
          summary: report.summary,
          consoleErrors: report.console.errors,
        },
        null,
        2
      )
    );

    await browser.close();
    process.exit(report.summary.failed ? 1 : 0);
  } catch (error) {
    report.fatalError = error.message;
    const reportPath = path.join(outDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    await browser.close();
    throw error;
  }
})();
