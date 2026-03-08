const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const checks = [];

  function push(name, pass, details = '') {
    checks.push({ name, pass, details });
  }

  await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const rewardApi = await page.evaluate(() => {
    const ms = window.MonetizationSystem;
    return {
      hasGrantRewards: Boolean(ms && typeof ms.grantRewards === 'function'),
      hasSpendStars: Boolean(ms && typeof ms.spendStars === 'function')
    };
  });
  push('Monetization has centralized reward grant API', rewardApi.hasGrantRewards);
  push('Monetization has star spending API', rewardApi.hasSpendStars);

  const missionSystem = await page.evaluate(() => {
    const system = window.MissionSystem;
    return {
      exists: Boolean(system),
      hasListApi: Boolean(system && typeof system.getMissionState === 'function'),
      hasClaimApi: Boolean(system && typeof system.claimMission === 'function')
    };
  });
  push('Mission system exists', missionSystem.exists);
  push('Mission system exposes mission state API', missionSystem.hasListApi);
  push('Mission system exposes claim API', missionSystem.hasClaimApi);

  const missionUi = await page.evaluate(() => {
    return {
      inTray: document.querySelectorAll('#top-utilities-tray .missions-btn').length,
      inHud: document.querySelectorAll('#top-hud .missions-btn').length
    };
  });
  push('Missions button is rendered in top menu surfaces', missionUi.inTray + missionUi.inHud > 0, JSON.stringify(missionUi));

  const failed = checks.filter((c) => !c.pass);
  console.log(JSON.stringify({ passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));

  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
