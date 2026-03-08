const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const checks = [];

  function push(name, pass, details = '') {
    checks.push({ name, pass, details });
  }

  await page.goto('http://127.0.0.1:4175/?utm_source=reddit&utm_medium=community&utm_campaign=launch&utm_content=thread1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const base = await page.evaluate(() => {
    const analytics = window.AnalyticsSystem;
    const mainBtn = Boolean(document.getElementById('feedback-btn'));
    const trayBtn = Boolean(document.querySelector('#top-utilities-tray .feedback-entry-btn'));
    const consentBtn = Boolean(document.querySelector('#top-utilities-tray .analytics-consent-btn'));
    const events = analytics.getEvents();
    const hasAcq = events.some((e) => e.eventType === 'acquisition_attributed');
    const hasPlayerId = typeof analytics.playerId === 'string' && analytics.playerId.length > 8;
    return {
      mainBtn,
      trayBtn,
      consentBtn,
      hasAcq,
      hasPlayerId,
      sessionIndex: analytics.sessionIndex
    };
  });

  push('Feedback button exists in main controls', base.mainBtn, JSON.stringify(base));
  push('Legacy submenu feedback button removed', !base.trayBtn, JSON.stringify(base));
  push('Consent toggle exists in utility tray', base.consentBtn, JSON.stringify(base));
  push('Acquisition event emitted', base.hasAcq, JSON.stringify(base));
  push('Player ID generated', base.hasPlayerId, JSON.stringify(base));

  await page.click('#feedback-btn');
  await page.waitForTimeout(250);
  await page.click('#feedback-stars .feedback-star-btn[data-value="5"]');
  await page.check('#feedback-modal .feedback-tags input[value="difficulty"]');
  await page.check('#feedback-modal .feedback-tags input[value="ui"]');
  await page.fill('#feedback-message', 'Great puzzle loop');
  await page.click('#feedback-submit');
  await page.waitForTimeout(250);

  const feedbackFlow = await page.evaluate(() => {
    const analytics = window.AnalyticsSystem;
    const events = analytics.getEvents();
    const rating = events.find((e) => e.eventType === 'rating_submitted');
    const feedback = events.find((e) => e.eventType === 'feedback_submitted');
    return {
      hasRating: Boolean(rating),
      hasFeedback: Boolean(feedback),
      ratingPayload: rating ? rating.payload : null,
      feedbackPayload: feedback ? feedback.payload : null
    };
  });

  push('Rating submission event emitted', feedbackFlow.hasRating, JSON.stringify(feedbackFlow));
  push('Feedback submission event emitted', feedbackFlow.hasFeedback, JSON.stringify(feedbackFlow));
  push('Rating payload captures 1-5 score', Number(feedbackFlow.ratingPayload?.rating) === 5, JSON.stringify(feedbackFlow.ratingPayload));
  push('Feedback payload captures tags', typeof feedbackFlow.feedbackPayload?.tags === 'string' && feedbackFlow.feedbackPayload.tags.includes('difficulty'), JSON.stringify(feedbackFlow.feedbackPayload));

  const failed = checks.filter((item) => !item.pass);
  console.log(JSON.stringify({ passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
