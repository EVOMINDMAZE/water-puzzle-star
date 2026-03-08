window.WATER_PUZZLE_LIVEOPS_CONFIG = {
  streakResetPolicy: 'reset_on_miss',
  streakMilestones: [
    { days: 3, rewards: { stars: 5, hints: 1 } },
    { days: 7, rewards: { stars: 12, hints: 2 } },
    { days: 14, rewards: { stars: 24, hints: 4 } },
    { days: 30, rewards: { stars: 50, hints: 8 } }
  ],
  liveEvents: [
    {
      id: 'spring_surge',
      title: 'Spring Surge',
      startAt: '2026-03-01T00:00:00.000Z',
      endAt: '2026-03-31T23:59:59.000Z',
      rewards: { stars: 2, hints: 1 }
    }
  ]
};
