class MissionSystem {
  constructor() {
    this.storageKey = 'water_puzzle_missions_state_v1';
    this.missionsBtn = null;
    this.overlay = null;
    this.state = {
      dailyDate: '',
      weeklyId: '',
      missions: {}
    };
    this.init();
  }

  init() {
    this.loadState();
    this.ensureMissionSets();
    this.createMissionUI();
    this.setupEventListeners();
    this.updateButtonValue();
  }

  getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  getWeekId(date = new Date()) {
    const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayNum = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);
    return `${utcDate.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  getDailyTemplates() {
    return [
      {
        id: 'd_complete_1',
        cadence: 'daily',
        label: 'Complete 1 level',
        metric: 'levels_completed',
        target: 1,
        rewards: { stars: 4, hints: 0 }
      },
      {
        id: 'd_stars_6',
        cadence: 'daily',
        label: 'Earn 6 stars',
        metric: 'stars_earned',
        target: 6,
        rewards: { stars: 6, hints: 1 }
      },
      {
        id: 'd_no_hints_2',
        cadence: 'daily',
        label: 'Clear 2 levels without hints',
        metric: 'no_hint_levels',
        target: 2,
        rewards: { stars: 7, hints: 1 }
      }
    ];
  }

  getWeeklyTemplates() {
    return [
      {
        id: 'w_levels_12',
        cadence: 'weekly',
        label: 'Complete 12 levels',
        metric: 'levels_completed',
        target: 12,
        rewards: { stars: 20, hints: 2 }
      },
      {
        id: 'w_perfect_5',
        cadence: 'weekly',
        label: 'Get 3 stars on 5 levels',
        metric: 'perfect_levels',
        target: 5,
        rewards: { stars: 24, hints: 3 }
      },
      {
        id: 'w_daily_3',
        cadence: 'weekly',
        label: 'Finish Daily Challenge 3 times',
        metric: 'daily_completions',
        target: 3,
        rewards: { stars: 30, hints: 4 }
      }
    ];
  }

  ensureMissionSets() {
    const today = this.getTodayString();
    const weekId = this.getWeekId();
    if (this.state.dailyDate !== today) {
      this.state.dailyDate = today;
      this.getDailyTemplates().forEach((template) => {
        this.state.missions[template.id] = {
          ...template,
          progress: 0,
          claimed: false,
          updatedAt: Date.now()
        };
      });
    }
    if (this.state.weeklyId !== weekId) {
      this.state.weeklyId = weekId;
      this.getWeeklyTemplates().forEach((template) => {
        this.state.missions[template.id] = {
          ...template,
          progress: 0,
          claimed: false,
          updatedAt: Date.now()
        };
      });
    }
    this.saveState();
  }

  loadState() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        this.state.dailyDate = typeof parsed.dailyDate === 'string' ? parsed.dailyDate : '';
        this.state.weeklyId = typeof parsed.weeklyId === 'string' ? parsed.weeklyId : '';
        this.state.missions = parsed.missions && typeof parsed.missions === 'object' ? parsed.missions : {};
      }
    } catch (_) {
      this.state = {
        dailyDate: '',
        weeklyId: '',
        missions: {}
      };
    }
  }

  saveState() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.state));
  }

  getMissionState() {
    this.ensureMissionSets();
    const missions = Object.values(this.state.missions);
    const daily = missions.filter((mission) => mission.cadence === 'daily');
    const weekly = missions.filter((mission) => mission.cadence === 'weekly');
    return {
      dailyDate: this.state.dailyDate,
      weeklyId: this.state.weeklyId,
      daily,
      weekly
    };
  }

  createMissionUI() {
    const topHud = document.getElementById('top-hud');
    if (!topHud) return;
    const utilityTray = document.getElementById('top-utilities-tray');
    const btn = document.createElement('button');
    btn.className = 'hud-pill missions-btn';
    btn.innerHTML = `
      <span class="hud-label">Missions</span>
      <span class="hud-value">0/0</span>
    `;
    btn.setAttribute('aria-label', 'View missions');
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', () => this.showMissions());
    (utilityTray || topHud).appendChild(btn);
    this.missionsBtn = btn;
    this.injectStyles();
  }

  injectStyles() {
    if (document.getElementById('missions-style-block')) return;
    const style = document.createElement('style');
    style.id = 'missions-style-block';
    style.textContent = `
      .missions-overlay {
        position: fixed;
        inset: 0;
        z-index: 125;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .missions-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.58);
        backdrop-filter: blur(4px);
      }
      .missions-card {
        position: relative;
        width: min(560px, 96vw);
        max-height: 86vh;
        overflow: auto;
        border-radius: 22px;
        padding: 18px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        background: rgba(16, 24, 40, 0.92);
      }
      .missions-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .missions-close {
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 999px;
        font-size: 22px;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.12);
        color: var(--text);
      }
      .missions-section-title {
        margin: 12px 0 8px;
        font-weight: 700;
        font-size: 14px;
        color: var(--muted);
      }
      .mission-item {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px;
        align-items: center;
        border-radius: 14px;
        padding: 10px;
        margin-bottom: 8px;
        background: rgba(255, 255, 255, 0.06);
      }
      .mission-item.done {
        border: 1px solid rgba(74, 222, 128, 0.55);
      }
      .mission-progress {
        font-size: 12px;
        color: var(--muted);
      }
      .mission-claim {
        min-width: 96px;
        min-height: 34px;
        border: none;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        background: linear-gradient(135deg, #00d2ff, #3a7bd5);
        color: #fff;
      }
      .mission-claim[disabled] {
        cursor: default;
        opacity: 0.6;
      }
    `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    window.addEventListener('levelComplete', (e) => {
      const detail = e?.detail || {};
      this.incrementMetric('levels_completed', 1);
      this.incrementMetric('stars_earned', Number(detail.awardedStars) || Number(detail.stars) || 0);
      if (!detail.usedHint) this.incrementMetric('no_hint_levels', 1);
      if (Number(detail.stars) === 3) this.incrementMetric('perfect_levels', 1);
    });
    window.addEventListener('dailyChallengeComplete', () => {
      this.incrementMetric('daily_completions', 1);
    });
  }

  incrementMetric(metric, amount) {
    this.ensureMissionSets();
    const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
    if (!safeAmount) return;
    let changed = false;
    Object.values(this.state.missions).forEach((mission) => {
      if (mission.metric !== metric || mission.claimed) return;
      const current = Math.max(0, Math.floor(Number(mission.progress) || 0));
      const target = Math.max(1, Math.floor(Number(mission.target) || 1));
      if (current >= target) return;
      mission.progress = Math.min(target, current + safeAmount);
      mission.updatedAt = Date.now();
      changed = true;
      window.dispatchEvent(new CustomEvent('missionProgress', {
        detail: {
          missionId: mission.id,
          progress: mission.progress,
          target,
          metric: mission.metric
        }
      }));
    });
    if (changed) {
      this.saveState();
      this.updateButtonValue();
      if (this.overlay?.isConnected) this.renderMissionLists();
    }
  }

  claimMission(missionId) {
    this.ensureMissionSets();
    const mission = this.state.missions[missionId];
    if (!mission) return { success: false, reason: 'unknown_mission' };
    const target = Math.max(1, Math.floor(Number(mission.target) || 1));
    const progress = Math.max(0, Math.floor(Number(mission.progress) || 0));
    if (mission.claimed) return { success: false, reason: 'already_claimed' };
    if (progress < target) return { success: false, reason: 'not_complete' };
    mission.claimed = true;
    mission.updatedAt = Date.now();
    const rewards = {
      stars: Number(mission.rewards?.stars) || 0,
      hints: Number(mission.rewards?.hints) || 0
    };
    if (window.MonetizationSystem && typeof window.MonetizationSystem.grantRewards === 'function') {
      window.MonetizationSystem.grantRewards(rewards, { source: 'mission_claim', missionId: mission.id });
    } else {
      const stars = parseInt(localStorage.getItem('water_puzzle_stars') || '0', 10);
      const hints = parseInt(localStorage.getItem('water_puzzle_hints') || '0', 10);
      localStorage.setItem('water_puzzle_stars', String(stars + rewards.stars));
      localStorage.setItem('water_puzzle_hints', String(hints + rewards.hints));
    }
    this.saveState();
    this.updateButtonValue();
    if (this.overlay?.isConnected) this.renderMissionLists();
    window.dispatchEvent(new CustomEvent('missionClaimed', {
      detail: {
        missionId: mission.id,
        cadence: mission.cadence,
        rewards
      }
    }));
    return { success: true, missionId: mission.id, rewards };
  }

  updateButtonValue() {
    if (!this.missionsBtn) return;
    const missions = Object.values(this.state.missions);
    const complete = missions.filter((mission) => !mission.claimed && Number(mission.progress) >= Number(mission.target)).length;
    const total = missions.length;
    const value = this.missionsBtn.querySelector('.hud-value');
    if (value) value.textContent = `${complete}/${total}`;
  }

  showMissions() {
    if (this.overlay?.isConnected) return;
    const existing = document.querySelector('.missions-overlay');
    if (existing) {
      this.overlay = existing;
      return;
    }
    this.overlay = document.createElement('div');
    this.overlay.className = 'missions-overlay';
    this.overlay.innerHTML = `
      <div class="missions-backdrop"></div>
      <div class="missions-card">
        <div class="missions-header">
          <h2>🎮 Missions</h2>
          <button class="missions-close" aria-label="Close missions">&times;</button>
        </div>
        <div class="missions-list" data-cadence="daily"></div>
        <div class="missions-list" data-cadence="weekly"></div>
      </div>
    `;
    document.body.appendChild(this.overlay);
    this.renderMissionLists();
    const close = () => {
      this.overlay.remove();
      this.overlay = null;
    };
    this.overlay.querySelector('.missions-backdrop').addEventListener('click', close);
    this.overlay.querySelector('.missions-close').addEventListener('click', close);
    this.overlay.addEventListener('click', (e) => {
      const claimBtn = e.target.closest('.mission-claim');
      if (!claimBtn) return;
      const missionId = claimBtn.getAttribute('data-mission-id');
      if (!missionId) return;
      const result = this.claimMission(missionId);
      if (result.success && window.FeedbackSystem) {
        window.FeedbackSystem.success(`Mission claimed! +${result.rewards.stars}⭐ +${result.rewards.hints}💡`);
      }
    });
  }

  renderMissionLists() {
    if (!this.overlay?.isConnected) return;
    const { daily, weekly } = this.getMissionState();
    const dailyContainer = this.overlay.querySelector('.missions-list[data-cadence="daily"]');
    const weeklyContainer = this.overlay.querySelector('.missions-list[data-cadence="weekly"]');
    dailyContainer.innerHTML = `<div class="missions-section-title">Daily Missions</div>${this.renderMissionItems(daily)}`;
    weeklyContainer.innerHTML = `<div class="missions-section-title">Weekly Missions</div>${this.renderMissionItems(weekly)}`;
  }

  renderMissionItems(missions) {
    return missions.map((mission) => {
      const progress = Math.max(0, Math.floor(Number(mission.progress) || 0));
      const target = Math.max(1, Math.floor(Number(mission.target) || 1));
      const done = progress >= target;
      const claimed = Boolean(mission.claimed);
      const buttonLabel = claimed ? 'Claimed' : done ? 'Claim' : 'Locked';
      return `
        <div class="mission-item ${done ? 'done' : ''}">
          <div>
            <div>${mission.label}</div>
            <div class="mission-progress">${progress}/${target} • +${mission.rewards.stars}⭐ +${mission.rewards.hints}💡</div>
          </div>
          <button class="mission-claim" data-mission-id="${mission.id}" ${(!done || claimed) ? 'disabled' : ''}>${buttonLabel}</button>
        </div>
      `;
    }).join('');
  }
}

window.MissionSystem = new MissionSystem();
