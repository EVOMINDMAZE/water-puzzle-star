const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join('/Users/riad/Downloads/water-puzzle-star/test-artifacts', `run-${ts}`);
  fs.mkdirSync(outDir, { recursive: true });

  const results = [];
  const defects = [];
  const consoleEntries = [];

  function record(name, pass, details = '') {
    results.push({ name, pass, details });
  }

  function defect(severity, title, details) {
    defects.push({ severity, title, details });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    consoleEntries.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', err => {
    consoleEntries.push({ type: 'pageerror', text: err.message || String(err) });
  });

  try {
    await page.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' });

    // Reset baseline state
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('water_puzzle_lvl', '0');
      localStorage.setItem('maxUnlockedLevel', '0');
      localStorage.setItem('water_puzzle_hints', '5');
      localStorage.setItem('water_puzzle_stars', '0');
      // Keep tutorial overlay disabled during deterministic UX automation.
      localStorage.setItem('water_puzzle_tutorial_completed', 'true');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    await page.screenshot({ path: path.join(outDir, '01-initial.png'), fullPage: true });

    // Menu open via click
    await page.click('#menu-btn');
    await page.waitForTimeout(250);
    let menuActive = await page.locator('#level-menu-overlay').evaluate(el => el.classList.contains('active'));
    record('Menu opens via menu button click', menuActive, menuActive ? 'overlay active' : 'overlay not active');
    await page.screenshot({ path: path.join(outDir, '02-menu-open.png'), fullPage: true });

    // Close via close button
    await page.click('#lm-close');
    await page.waitForTimeout(250);
    menuActive = await page.locator('#level-menu-overlay').evaluate(el => el.classList.contains('active'));
    record('Menu closes via close button', !menuActive, menuActive ? 'still active' : 'closed');

    // Open again and test backdrop close
    await page.click('#menu-btn');
    await page.waitForTimeout(250);
    await page.mouse.click(8, 8); // Attempt backdrop click
    await page.waitForTimeout(250);
    menuActive = await page.locator('#level-menu-overlay').evaluate(el => el.classList.contains('active'));
    const backdropClosePass = !menuActive;
    record('Menu closes via backdrop click', backdropClosePass, backdropClosePass ? 'closed' : 'remains open');
    if (!backdropClosePass) {
      defect('major', 'Menu backdrop click does not close overlay', 'Clicking apparent backdrop area (x=8,y=8) leaves #level-menu-overlay active. Overlay children likely consume all clicks, preventing e.target===overlay path.');
    }
    await page.screenshot({ path: path.join(outDir, '03-menu-backdrop-attempt.png'), fullPage: true });

    // Escape should close menu
    if (!backdropClosePass) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
    }
    await page.click('#menu-btn');
    await page.waitForTimeout(250);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    menuActive = await page.locator('#level-menu-overlay').evaluate(el => el.classList.contains('active'));
    record('Escape closes menu overlay', !menuActive, menuActive ? 'still active' : 'closed');

    // Paging disabled states
    await page.click('#menu-btn');
    await page.waitForTimeout(250);
    const prevDisabledInitial = await page.locator('#lm-prev-btn').evaluate(el => ({ disabled: el.disabled, aria: el.getAttribute('aria-disabled') }));
    record('Prev button disabled on first page (visual+semantic)', prevDisabledInitial.disabled && prevDisabledInitial.aria === 'true', JSON.stringify(prevDisabledInitial));

    let guard = 0;
    while (guard < 80) {
      const nextDisabled = await page.locator('#lm-next-btn').evaluate(el => el.disabled);
      if (nextDisabled) break;
      await page.click('#lm-next-btn');
      await page.waitForTimeout(60);
      guard++;
    }
    const nextDisabledLast = await page.locator('#lm-next-btn').evaluate(el => ({ disabled: el.disabled, aria: el.getAttribute('aria-disabled') }));
    record('Next button disabled on last page (visual+semantic)', nextDisabledLast.disabled && nextDisabledLast.aria === 'true', JSON.stringify(nextDisabledLast));
    await page.screenshot({ path: path.join(outDir, '04-menu-last-page.png'), fullPage: true });

    // Inner panel click should not close overlay
    await page.click('#lm-title');
    await page.waitForTimeout(200);
    menuActive = await page.locator('#level-menu-overlay').evaluate(el => el.classList.contains('active'));
    record('Inner panel interaction does not close menu', menuActive, menuActive ? 'remains open' : 'closed unexpectedly');

    // Keyboard Enter/Space for menu button
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    await page.focus('#menu-btn');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(220);
    menuActive = await page.locator('#level-menu-overlay').evaluate(el => el.classList.contains('active'));
    record('Enter activates focused menu button', menuActive, menuActive ? 'opened' : 'did not open');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await page.focus('#menu-btn');
    await page.keyboard.press('Space');
    await page.waitForTimeout(220);
    menuActive = await page.locator('#level-menu-overlay').evaluate(el => el.classList.contains('active'));
    record('Space activates focused menu button', menuActive, menuActive ? 'opened' : 'did not open');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Hint behavior
    const hintTextBefore = await page.locator('#hint-count').innerText();
    const hintHudBefore = await page.locator('#hud-hints').innerText();
    await page.click('#hint-btn');
    await page.waitForTimeout(180);
    const hintTextAfter = await page.locator('#hint-count').innerText();
    const hintHudAfter = await page.locator('#hud-hints').innerText();
    const hintPulsing = await page.locator('#hint-btn').evaluate(el => el.classList.contains('pulsing'));

    const parsedBefore = parseInt(hintTextBefore, 10);
    const parsedAfter = parseInt(hintTextAfter, 10);
    const decremented = Number.isFinite(parsedBefore) && Number.isFinite(parsedAfter) ? (parsedAfter === parsedBefore - 1) : false;
    record('Hint decrements count after successful hint', decremented, `${hintTextBefore} -> ${hintTextAfter}; HUD ${hintHudBefore} -> ${hintHudAfter}`);
    record('Hint activates pulsing guidance state', hintPulsing, hintPulsing ? 'pulsing true' : 'pulsing false');
    await page.screenshot({ path: path.join(outDir, '05-hint-active.png'), fullPage: true });

    // Restart should clear hint pulse immediately
    await page.click('#restart-btn');
    await page.waitForTimeout(220);
    const pulseAfterRestart = await page.locator('#hint-btn').evaluate(el => el.classList.contains('pulsing'));
    record('Restart clears active hint guidance', !pulseAfterRestart, pulseAfterRestart ? 'pulsing still active' : 'pulsing cleared');

    // Hint pulse timeout behavior
    await page.click('#hint-btn');
    await page.waitForTimeout(200);
    const pulseAfterHint2 = await page.locator('#hint-btn').evaluate(el => el.classList.contains('pulsing'));
    await page.waitForTimeout(3100);
    const pulseAfterTimeout = await page.locator('#hint-btn').evaluate(el => el.classList.contains('pulsing'));
    record('Hint guidance auto-clears after timeout', pulseAfterHint2 && !pulseAfterTimeout, `before timeout=${pulseAfterHint2}, after timeout=${pulseAfterTimeout}`);

    // Core button disabled states at idle
    const disabledStates = await page.evaluate(() => ({
      undo: document.querySelector('#undo-btn').disabled,
      restart: document.querySelector('#restart-btn').disabled,
      hint: document.querySelector('#hint-btn').disabled,
      menu: document.querySelector('#menu-btn').disabled,
      undoAria: document.querySelector('#undo-btn').getAttribute('aria-disabled'),
      restartAria: document.querySelector('#restart-btn').getAttribute('aria-disabled'),
      hintAria: document.querySelector('#hint-btn').getAttribute('aria-disabled')
    }));
    record('Undo is disabled at initial idle state (no history)', disabledStates.undo && disabledStates.undoAria === 'true', JSON.stringify(disabledStates));
    record('Restart and Hint are enabled at idle state', !disabledStates.restart && !disabledStates.hint, JSON.stringify(disabledStates));

    // Win overlay keyboard paths (trigger via game API)
    const showWinAvailable = await page.evaluate(() => typeof showWin === 'function');
    if (showWinAvailable) {
      await page.evaluate(() => showWin());
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(outDir, '06-win-open.png'), fullPage: true });

      let winActive = await page.locator('#win-overlay').evaluate(el => el.classList.contains('active'));
      record('Win overlay can be opened (test hook)', winActive, winActive ? 'opened via showWin()' : 'did not open');

      await page.keyboard.press('Escape');
      await page.waitForTimeout(220);
      winActive = await page.locator('#win-overlay').evaluate(el => el.classList.contains('active'));
      record('Escape closes win overlay', !winActive, winActive ? 'still active' : 'closed');

      await page.evaluate(() => showWin());
      await page.waitForTimeout(220);
      await page.mouse.click(20, 20);
      await page.waitForTimeout(220);
      winActive = await page.locator('#win-overlay').evaluate(el => el.classList.contains('active'));
      record('Win overlay closes via backdrop click', !winActive, winActive ? 'still active' : 'closed');

      await page.evaluate(() => showWin());
      await page.waitForTimeout(220);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(260);
      winActive = await page.locator('#win-overlay').evaluate(el => el.classList.contains('active'));
      record('Enter triggers win primary action', !winActive, winActive ? 'still active' : 'closed/advanced');

      await page.evaluate(() => showWin());
      await page.waitForTimeout(220);
      await page.keyboard.press('Space');
      await page.waitForTimeout(260);
      winActive = await page.locator('#win-overlay').evaluate(el => el.classList.contains('active'));
      record('Space triggers win primary action', !winActive, winActive ? 'still active' : 'closed/advanced');
    } else {
      record('Win overlay keyboard tests', false, 'showWin() function not available in page context for deterministic overlay invocation');
      defect('minor', 'Win overlay deterministic keyboard test skipped', 'showWin test hook unavailable; could not reliably force solved state during automation.');
    }

    // Console error check
    const severe = consoleEntries.filter(e => e.type === 'error' || e.type === 'pageerror');
    record('No console errors/page exceptions during test run', severe.length === 0, `errors=${severe.length}`);
    if (severe.length > 0) {
      defect('major', 'Console errors detected during UX regression run', severe.map(e => `${e.type}: ${e.text}`).join(' | '));
    }

    await page.screenshot({ path: path.join(outDir, '07-final-state.png'), fullPage: true });

  } catch (err) {
    defect('critical', 'Test runner crashed', err.stack || String(err));
    record('Test execution completed', false, String(err));
  } finally {
    await browser.close();
  }

  const summary = {
    timestamp: new Date().toISOString(),
    outDir,
    passed: results.filter(r => r.pass).length,
    failed: results.filter(r => !r.pass).length,
    total: results.length,
    results,
    defects,
    consoleEntries
  };

  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
})();
