const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:4174/';
const VIEWPORTS = [
  { name: 'portrait', width: 390, height: 844 },
  { name: 'landscape', width: 1280, height: 900 }
];

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

async function setLevelBaseline(page, levelIndex, maxUnlocked = 20) {
  await page.evaluate(({ levelIndex, maxUnlocked }) => {
    localStorage.clear();
    localStorage.setItem('water_puzzle_lvl', String(levelIndex));
    localStorage.setItem('maxUnlockedLevel', String(maxUnlocked));
    localStorage.setItem('water_puzzle_hints', '5');
    localStorage.setItem('water_puzzle_stars', '0');
  }, { levelIndex, maxUnlocked });
}

async function captureLevelState(page) {
  return page.evaluate(() => {
    const state = {
      bottles: bottles.map((b, i) => ({
        idx: i,
        current: b.current,
        capacity: b.capacity
      })),
      moves,
      historyLength: history.length,
      transferFeedbackLength: transferFeedback.length,
      blockedFeedbackLength: blockedFeedback.length,
      isAnimating,
      won
    };
    return state;
  });
}

async function getInteractionPlan(page) {
  return page.evaluate(() => {
    const L = getLayout();
    const rect = canvas.getBoundingClientRect();
    const sxToClient = sx => rect.left + sx * (rect.width / canvas.width);
    const syToClient = sy => rect.top + sy * (rect.height / canvas.height);

    function bottleTapPoint(idx) {
      const sx = L.xs[idx] + L.bottleW / 2;
      const sy = Math.min(L.bottomY - 12, L.bottomSafeY - 8);
      return { x: sxToClient(sx), y: syToClient(sy) };
    }

    let validPair = null;
    for (let i = 0; i < bottles.length; i++) {
      for (let j = 0; j < bottles.length; j++) {
        if (i === j) continue;
        const from = bottles[i];
        const to = bottles[j];
        if (from.current > 0 && to.current < to.capacity) {
          validPair = {
            from: i,
            to: j,
            amount: Math.min(from.current, to.capacity - to.current),
            fromPoint: bottleTapPoint(i),
            toPoint: bottleTapPoint(j)
          };
          break;
        }
      }
      if (validPair) break;
    }

    let invalidPlan = null;
    const emptyIdx = bottles.findIndex(b => b.current === 0);
    if (emptyIdx >= 0) {
      invalidPlan = {
        type: 'empty-source',
        source: emptyIdx,
        sourcePoint: bottleTapPoint(emptyIdx)
      };
    } else {
      // Fallback: select a valid source and attempt to pour into a full destination.
      let src = -1;
      let dst = -1;
      for (let i = 0; i < bottles.length; i++) {
        if (bottles[i].current <= 0) continue;
        for (let j = 0; j < bottles.length; j++) {
          if (i === j) continue;
          if (bottles[j].current >= bottles[j].capacity) {
            src = i;
            dst = j;
            break;
          }
        }
        if (src >= 0) break;
      }
      if (src >= 0 && dst >= 0) {
        invalidPlan = {
          type: 'full-destination',
          source: src,
          destination: dst,
          sourcePoint: bottleTapPoint(src),
          destinationPoint: bottleTapPoint(dst)
        };
      }
    }

    const topHud = document.getElementById('top-hud');
    const bottomBanner = document.getElementById('bottom-banner');
    const hudRect = topHud.getBoundingClientRect();
    const bottomRect = bottomBanner.getBoundingClientRect();
    const canvasPxPerCssY = canvas.height / rect.height;
    const hudBottomInCanvas = (hudRect.bottom - rect.top) * canvasPxPerCssY;
    const bottomTopInCanvas = (bottomRect.top - rect.top) * canvasPxPerCssY;

    const layoutMetrics = {
      topHudClearance: L.topSafeY - hudBottomInCanvas,
      bottomBannerClearance: bottomTopInCanvas - L.bottomSafeY,
      bottleCount: bottles.length,
      bottleW: L.bottleW,
      spacing: L.spacing,
      topSafeY: L.topSafeY,
      bottomSafeY: L.bottomSafeY,
      xs: [...L.xs]
    };

    return { validPair, invalidPlan, layoutMetrics };
  });
}

async function runViewportChecks(context, page, outDir, viewport, consoleEntries) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  const levelResults = [];
  const levelsToCheck = [0, 1, 2];

  for (const levelIndex of levelsToCheck) {
    await setLevelBaseline(page, levelIndex);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const before = await captureLevelState(page);
    const plan = await getInteractionPlan(page);

    if (!plan.validPair) {
      levelResults.push({
        viewport: viewport.name,
        levelIndex,
        pass: false,
        reason: 'No valid transfer pair found'
      });
      continue;
    }
    if (!plan.invalidPlan) {
      levelResults.push({
        viewport: viewport.name,
        levelIndex,
        pass: false,
        reason: 'No invalid feedback plan found'
      });
      continue;
    }

    await page.mouse.click(plan.validPair.fromPoint.x, plan.validPair.fromPoint.y);
    await page.mouse.click(plan.validPair.toPoint.x, plan.validPair.toPoint.y);
    const validImmediate = await captureLevelState(page);
    await page.waitForTimeout(80);
    await page.screenshot({
      path: path.join(outDir, `${viewport.name}-level${levelIndex + 1}-valid-feedback.png`),
      fullPage: true
    });

    const expectedAmount = plan.validPair.amount;
    const fromBefore = before.bottles[plan.validPair.from].current;
    const toBefore = before.bottles[plan.validPair.to].current;
    const fromAfter = validImmediate.bottles[plan.validPair.from].current;
    const toAfter = validImmediate.bottles[plan.validPair.to].current;

    const validTransferPass =
      isFiniteNumber(expectedAmount) &&
      fromAfter === fromBefore - expectedAmount &&
      toAfter === toBefore + expectedAmount &&
      validImmediate.moves === before.moves + 1 &&
      validImmediate.historyLength === before.historyLength + 1 &&
      validImmediate.transferFeedbackLength >= before.transferFeedbackLength + 1 &&
      validImmediate.isAnimating === false;

    const invalidBefore = await captureLevelState(page);
    const postValidPlan = await getInteractionPlan(page);
    const invalidPlan = postValidPlan.invalidPlan;

    if (!invalidPlan) {
      levelResults.push({
        viewport: viewport.name,
        levelIndex,
        validTransferPass,
        invalidFeedbackPass: false,
        readabilityPass,
        details: {
          expectedAmount,
          fromBefore,
          fromAfter,
          toBefore,
          toAfter,
          before,
          validImmediate,
          invalidBefore,
          invalidImmediate: null,
          layoutMetrics: plan.layoutMetrics,
          invalidReason: 'No invalid plan available after valid transfer'
        }
      });
      continue;
    }

    if (invalidPlan.type === 'empty-source') {
      await page.mouse.click(invalidPlan.sourcePoint.x, invalidPlan.sourcePoint.y);
    } else {
      await page.mouse.click(invalidPlan.sourcePoint.x, invalidPlan.sourcePoint.y);
      await page.mouse.click(invalidPlan.destinationPoint.x, invalidPlan.destinationPoint.y);
    }
    const invalidImmediate = await captureLevelState(page);
    await page.waitForTimeout(80);
    await page.screenshot({
      path: path.join(outDir, `${viewport.name}-level${levelIndex + 1}-invalid-feedback.png`),
      fullPage: true
    });

    const invalidFeedbackPass =
      invalidImmediate.moves === invalidBefore.moves &&
      invalidImmediate.historyLength === invalidBefore.historyLength &&
      invalidImmediate.transferFeedbackLength <= invalidBefore.transferFeedbackLength &&
      invalidImmediate.blockedFeedbackLength >= invalidBefore.blockedFeedbackLength + 1;

    const readabilityPass =
      plan.layoutMetrics.topHudClearance >= 0 &&
      plan.layoutMetrics.bottomBannerClearance >= 0;

    levelResults.push({
      viewport: viewport.name,
      levelIndex,
      validTransferPass,
      invalidFeedbackPass,
      readabilityPass,
      details: {
        expectedAmount,
        fromBefore,
        fromAfter,
        toBefore,
        toAfter,
        before,
        validImmediate,
        invalidBefore,
        invalidImmediate,
        layoutMetrics: plan.layoutMetrics
      }
    });
  }

  await page.screenshot({
    path: path.join(outDir, `${viewport.name}-final.png`),
    fullPage: true
  });

  return {
    viewport: viewport.name,
    dimensions: { width: viewport.width, height: viewport.height },
    levelResults,
    consoleEntries: [...consoleEntries]
  };
}

(async () => {
  const outDir = path.join(
    '/Users/riad/Downloads/water-puzzle-star/test-artifacts',
    `task4-manual-${nowStamp()}`
  );
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const consoleEntries = [];

  page.on('console', msg => {
    consoleEntries.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', err => {
    consoleEntries.push({ type: 'pageerror', text: err.message || String(err) });
  });

  const runResults = [];
  try {
    for (const viewport of VIEWPORTS) {
      const result = await runViewportChecks(context, page, outDir, viewport, consoleEntries);
      runResults.push(result);
    }
  } finally {
    await browser.close();
  }

  const allLevelChecks = runResults.flatMap(r => r.levelResults);
  const aggregate = {
    timestamp: new Date().toISOString(),
    outDir,
    passSummary: {
      totalLevelChecks: allLevelChecks.length,
      validTransferPasses: allLevelChecks.filter(r => r.validTransferPass).length,
      invalidFeedbackPasses: allLevelChecks.filter(r => r.invalidFeedbackPass).length,
      readabilityPasses: allLevelChecks.filter(r => r.readabilityPass).length
    },
    noConsoleErrors: consoleEntries.filter(e => e.type === 'error' || e.type === 'pageerror').length === 0,
    runResults
  };

  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(aggregate, null, 2));
  console.log(JSON.stringify(aggregate, null, 2));
})();
