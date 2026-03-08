const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:4174/';

async function run() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join('/Users/riad/Downloads/water-puzzle-star/test-artifacts', `rapid-overlay-${ts}`);
  fs.mkdirSync(outDir, { recursive: true });

  const consoleEntries = [];
  const checks = [];
  const failures = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    consoleEntries.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', (err) => {
    consoleEntries.push({ type: 'pageerror', text: err?.message || String(err) });
  });

  function record(name, pass, details) {
    checks.push({ name, pass, details });
    if (!pass) failures.push({ name, details });
  }

  async function rapidClick(selector, count = 30) {
    await page.evaluate(({ selector, count }) => {
      for (let i = 0; i < count; i++) {
        const el = document.querySelector(selector);
        if (!el) break;
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    }, { selector, count });
    await page.waitForTimeout(50);
  }

  async function runOverlayCase(config) {
    const { label, triggerSelector, overlaySelector, closeSelector } = config;
    await rapidClick(triggerSelector, 35);
    await page.waitForTimeout(180);

    const countsOpen = await page.evaluate(({ overlaySelector, closeSelector }) => {
      return {
        overlays: document.querySelectorAll(overlaySelector).length,
        closes: document.querySelectorAll(closeSelector).length,
        activeOverlays: document.querySelectorAll(`${overlaySelector}.active`).length
      };
    }, { overlaySelector, closeSelector });

    const passSingleOverlay = countsOpen.overlays === 1;
    const passSingleClose = countsOpen.closes === 1;
    record(`${label}: only one overlay instance after rapid clicks`, passSingleOverlay, JSON.stringify(countsOpen));
    record(`${label}: only one back/close button instance after rapid clicks`, passSingleClose, JSON.stringify(countsOpen));

    await page.screenshot({
      path: path.join(outDir, `${label.toLowerCase().replace(/\s+/g, '-')}-open.png`),
      fullPage: true
    });

    const closeCountBefore = await page.locator(closeSelector).count();
    if (closeCountBefore > 0) {
      await page.locator(closeSelector).first().click({ timeout: 3000, force: true });
      await page.waitForTimeout(180);
    }

    const countsClosed = await page.evaluate(({ overlaySelector, closeSelector }) => {
      return {
        overlays: document.querySelectorAll(overlaySelector).length,
        closes: document.querySelectorAll(closeSelector).length
      };
    }, { overlaySelector, closeSelector });

    const passClosed = countsClosed.overlays === 0 && countsClosed.closes === 0;
    record(`${label}: overlay fully removed after close`, passClosed, JSON.stringify(countsClosed));

    await page.screenshot({
      path: path.join(outDir, `${label.toLowerCase().replace(/\s+/g, '-')}-closed.png`),
      fullPage: true
    });
  }

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
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '00-baseline.png'), fullPage: true });

    const requiredButtons = [
      { label: 'Daily', selector: '.daily-challenge-btn' },
      { label: 'Mode', selector: '.difficulty-selector' },
      { label: 'Badges', selector: '.achievements-btn' }
    ];
    for (const btn of requiredButtons) {
      const exists = await page.locator(btn.selector).count();
      record(`${btn.label}: trigger button exists`, exists > 0, `count=${exists}`);
    }

    await runOverlayCase({
      label: 'Daily',
      triggerSelector: '.daily-challenge-btn',
      overlaySelector: '.daily-challenge-overlay',
      closeSelector: '.close-daily-btn'
    });

    await runOverlayCase({
      label: 'Mode',
      triggerSelector: '.difficulty-selector',
      overlaySelector: '.difficulty-overlay',
      closeSelector: '.difficulty-close'
    });

    await runOverlayCase({
      label: 'Badges',
      triggerSelector: '.achievements-btn',
      overlaySelector: '.achievements-overlay',
      closeSelector: '.achievements-close'
    });

    const severe = consoleEntries.filter((e) => e.type === 'error' || e.type === 'pageerror');
    record('No console errors/page exceptions during rapid click checks', severe.length === 0, `errors=${severe.length}`);
  } catch (err) {
    record('Test script execution completed', false, err?.stack || String(err));
  } finally {
    await browser.close();
  }

  const summary = {
    timestamp: new Date().toISOString(),
    outDir,
    totals: {
      passed: checks.filter((c) => c.pass).length,
      failed: checks.filter((c) => !c.pass).length,
      total: checks.length
    },
    checks,
    failures,
    consoleEntries
  };

  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

run();
