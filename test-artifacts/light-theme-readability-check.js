const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = process.env.GAME_URL || 'http://127.0.0.1:5123/';

function relativeLuminance(rgb) {
  const toLinear = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = rgb;
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

(async () => {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(__dirname, `light-theme-check-${ts}`);
  fs.mkdirSync(outDir, { recursive: true });

  const results = [];
  const defects = [];
  const consoleEntries = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
  const page = await context.newPage();

  page.on('console', (msg) => consoleEntries.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', (err) => consoleEntries.push({ type: 'pageerror', text: err.message || String(err) }));

  const record = (name, pass, details = '') => results.push({ name, pass, details });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('water_puzzle_theme_selection', 'light');
      localStorage.setItem('water_puzzle_theme', 'light');
      localStorage.setItem('water_puzzle_tutorial_completed', 'true');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(700);

    const themeState = await page.evaluate(() => ({
      bodyClass: document.body.className,
      selectedTheme: localStorage.getItem('water_puzzle_theme_selection'),
      resolvedTheme: localStorage.getItem('water_puzzle_theme')
    }));
    const lightApplied = themeState.bodyClass.includes('theme-light') && themeState.selectedTheme === 'light';
    record('Light theme is active', lightApplied, JSON.stringify(themeState));

    await page.screenshot({ path: path.join(outDir, '01-light-theme-full.png'), fullPage: true });

    const readability = await page.evaluate(() => {
      const parseRGB = (value) => {
        if (!value) return null;
        const m = value.match(/rgba?\(([^)]+)\)/i);
        if (!m) return null;
        const nums = m[1].split(',').map((part) => Number(part.trim()));
        const [r, g, b, a] = nums;
        return [r || 0, g || 0, b || 0, Number.isFinite(a) ? a : 1];
      };

      const pickBackground = (el) => {
        let cur = el;
        while (cur && cur !== document.documentElement) {
          const bg = getComputedStyle(cur).backgroundColor;
          const rgba = parseRGB(bg);
          if (rgba && rgba[3] > 0.01) return rgba;
          cur = cur.parentElement;
        }
        const bodyBg = parseRGB(getComputedStyle(document.body).backgroundColor);
        return bodyBg || [255, 255, 255, 1];
      };

      const flattenOnWhite = (rgba) => {
        const [r, g, b, a] = rgba;
        if (a >= 0.999) return [r, g, b];
        return [
          Math.round(r * a + 255 * (1 - a)),
          Math.round(g * a + 255 * (1 - a)),
          Math.round(b * a + 255 * (1 - a)),
        ];
      };

      const items = [];
      const hudLabels = ['#hud-pill-world .hud-label', '#hud-pill-moves .hud-label', '#hud-pill-target .hud-label', '#hud-pill-hints .hud-label', '#hud-pill-stars .hud-label'];
      const iconButtons = ['#menu-btn', '#undo-btn', '#restart-btn', '#hint-btn', '#sound-btn'];

      for (const selector of hudLabels) {
        const el = document.querySelector(selector);
        if (!el) continue;
        const style = getComputedStyle(el);
        const fg = flattenOnWhite(parseRGB(style.color) || [0, 0, 0, 1]);
        const bg = flattenOnWhite(pickBackground(el));
        items.push({ group: 'hud-label', selector, text: el.textContent?.trim() || '', fg, bg });
      }

      for (const selector of iconButtons) {
        const el = document.querySelector(selector);
        if (!el) continue;
        const style = getComputedStyle(el);
        const fg = flattenOnWhite(parseRGB(style.color) || [0, 0, 0, 1]);
        const bg = flattenOnWhite(pickBackground(el));
        items.push({ group: 'icon-btn', selector, text: el.getAttribute('aria-label') || '', fg, bg });
      }

      const canvas = document.querySelector('#gameCanvas');
      let bottleColor = null;
      try {
        bottleColor = typeof C !== 'undefined' ? C.muted : null;
      } catch (_) {
        bottleColor = null;
      }

      return {
        items,
        canvasRect: canvas ? canvas.getBoundingClientRect().toJSON() : null,
        bottleVolumeStyle: bottleColor
      };
    });

    const checked = readability.items.map((item) => {
      const ratio = contrastRatio(item.fg, item.bg);
      return { ...item, ratio: Number(ratio.toFixed(2)) };
    });

    const lowContrast = checked.filter((item) => item.ratio < 4.5);
    record(
      'HUD labels + icon buttons meet >= 4.5:1 contrast (approximation)',
      lowContrast.length === 0,
      lowContrast.length ? JSON.stringify(lowContrast) : `checked=${checked.length}`
    );

    const canvasRect = readability.canvasRect || { x: 0, y: 0, width: 1200, height: 720 };
    await page.screenshot({
      path: path.join(outDir, '02-hud-and-controls.png'),
      clip: {
        x: Math.max(0, Math.round(canvasRect.x)),
        y: 0,
        width: Math.min(1440, Math.max(600, Math.round(canvasRect.width))),
        height: Math.min(420, Math.max(260, Math.round((canvasRect.y || 0) + 220)))
      }
    });

    await page.screenshot({
      path: path.join(outDir, '03-canvas-bottle-text.png'),
      clip: {
        x: Math.max(0, Math.round(canvasRect.x)),
        y: Math.max(0, Math.round((canvasRect.y || 0) + (canvasRect.height || 720) * 0.42)),
        width: Math.min(1440, Math.max(600, Math.round(canvasRect.width || 1200))),
        height: Math.min(420, Math.max(220, Math.round((canvasRect.height || 720) * 0.5)))
      }
    });

    const bottleStyle = readability.bottleVolumeStyle || 'unknown';
    const bottleLikelyReadable = typeof bottleStyle === 'string' ? !/255,\s*255,\s*255/.test(bottleStyle) : true;
    record(
      'Bottle volume text uses non-white muted color in light mode',
      bottleLikelyReadable,
      `C.muted=${bottleStyle}`
    );

    const severe = consoleEntries.filter((e) => e.type === 'error' || e.type === 'pageerror');
    record('No console/runtime errors during light-theme check', severe.length === 0, `errors=${severe.length}`);
    if (severe.length > 0) {
      defects.push({
        severity: 'major',
        title: 'Console/runtime errors detected',
        details: severe.map((e) => `${e.type}: ${e.text}`).join(' | ')
      });
    }
  } catch (error) {
    defects.push({ severity: 'critical', title: 'Test run crashed', details: error.stack || String(error) });
    results.push({ name: 'Execution completed', pass: false, details: String(error) });
  } finally {
    await browser.close();
  }

  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    outDir,
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass).length,
    total: results.length,
    results,
    defects,
    consoleEntries
  };

  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
})();
