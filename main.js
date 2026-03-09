// ─────────────────────────────────────────────────────────────────────────────
// WATER PUZZLE DELUXE — main.js
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @fileoverview Core game logic for Water Puzzle Star.
 * Handles state management, rendering loop, input processing, and progression.
 * 
 * Major Regions:
 * - Global Constants & State
 * - Audio Engine (AudioController)
 * - Particle System (ParticleSystem)
 * - Game Solver (GameSolver)
 * - Level & Menu Management
 * - Drawing & Rendering
 * - Game Logic (Pour, Frame)
 * - Input Handling
 */

// LEVELS array is now loaded from levels.js


const C = {
  bg: '#0B0B0E',
  bottleBorder: 'rgba(255, 255, 255, 0.2)',
  bottleGlass: 'rgba(255, 255, 255, 0.05)',
  selBorder: '#00D2FF',
  selGlow: 'rgba(0, 210, 255, 0.4)',
  targetLine: '#FF512F',
  text: '#FFFFFF',
  muted: 'rgba(255, 255, 255, 0.5)',
  liquids: [
    ['#00D2FF', '#3A7BD5'], // Blue
    ['#FF512F', '#DD2476'], // Pink/Red
    ['#F09819', '#EDDE5D'], // Yellow/Gold
    ['#1D976C', '#93F9B9'], // Green
    ['#8E2DE2', '#4A00E0'], // Purple
    ['#00F260', '#0575E6'], // Teal/Green
  ]
};

function applyCanvasTheme(themeName, colors = {}) {
  C.text = colors.text || (themeName === 'light' ? '#1a202c' : '#FFFFFF');
  C.muted = colors.muted || (themeName === 'light' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.5)');
  if (themeName === 'light') {
    C.bottleBorder = 'rgba(15, 23, 42, 0.24)';
    C.bottleGlass = 'rgba(255, 255, 255, 0.3)';
    return;
  }
  C.bottleBorder = 'rgba(255, 255, 255, 0.2)';
  C.bottleGlass = 'rgba(255, 255, 255, 0.05)';
}

const LAYOUT = Object.freeze({
  baselineViewports: Object.freeze([
    { name: 'mobile', maxWidth: 640 },
    { name: 'desktop', minWidth: 641 }
  ]),
  safeAreaTopBase: 14,
  safeAreaBottomBase: 18,
  safeAreaSide: 22,
  hudToGameplayGap: 14,
  bannerToGameplayGap: 14,
  bottleTopGap: 12,
  bottleLabelGap: 34,
  minBottleSpacing: 10,
  minBottleWidth: 24,
  maxBottleWidth: 70,
  minBottleHeight: 120,
  maxPxPerL: 40
});

let vibrateSupported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

function canUseVibration() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userActivation;
  // Some browsers require transient/sticky user activation for vibration.
  // If the API is unavailable, fall back to previous behavior.
  if (!ua) return true;
  return Boolean(ua.isActive || ua.hasBeenActive);
}

function safeVibrate(pattern) {
  if (!vibrateSupported) return false;
  if (!canUseVibration()) return false;
  try {
    return navigator.vibrate(pattern);
  } catch (_) {
    vibrateSupported = false;
    return false;
  }
}

let hintCount = window.MonetizationSystem && typeof window.MonetizationSystem.getHintBalance === 'function'
  ? window.MonetizationSystem.getHintBalance()
  : (parseInt(localStorage.getItem('water_puzzle_hints'), 10) || 5);
let totalStars = parseInt(localStorage.getItem('water_puzzle_stars')) || 0;
let activeHint = null; // {from, to}
let hintTimeoutId = null;
let currentDifficultyMode = normalizeDifficultyMode(localStorage.getItem('water_puzzle_difficulty'));
let isDailyRunActive = false;
let levelSessionStats = { usedHint: false, usedUndo: false };
const HINT_DISPLAY_MS = 2800;
const BLOCKED_FEEDBACK_MS = 420;
const MAX_BLOCKED_FEEDBACK = 8;
const TRANSFER_FEEDBACK = Object.freeze({
  sourceMs: 120,
  destinationDelayMs: 70,
  destinationMs: 170,
  cueMs: 220,
  maxConcurrent: 6
});
const blockedFeedback = [];
const transferFeedback = [];
let winRevealTimeoutId = null;

function setHintPulseActive(isActive) {
  hintBtn.classList.toggle('pulsing', Boolean(isActive));
}

function queueBlockedFeedback(x, y, label = 'Blocked') {
  blockedFeedback.push({
    x,
    y,
    label,
    start: performance.now()
  });
  if (blockedFeedback.length > MAX_BLOCKED_FEEDBACK) blockedFeedback.shift();
}

function queueBlockedBottleFeedback(idx, label) {
  const L = getLayout();
  if (!L || !L.xs || !Number.isInteger(idx) || idx < 0 || idx >= L.xs.length) return;
  const bh = bottles[idx].capacity * L.pxPerL;
  const x = L.xs[idx] + L.bottleW / 2;
  const y = L.bottomY - bh - 24;
  queueBlockedFeedback(x, y, label);
}

function queueBlockedButtonFeedback(btn, label) {
  if (!btn || !(btn instanceof HTMLElement)) return;
  const canvasRect = canvas.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  if (canvasRect.width <= 0 || canvasRect.height <= 0) return;
  const centerX = btnRect.left + btnRect.width / 2;
  const y = Math.max(btnRect.top - 10, canvasRect.top + 12);
  const x = (centerX - canvasRect.left) * (canvas.width / canvasRect.width);
  const cy = (y - canvasRect.top) * (canvas.height / canvasRect.height);
  queueBlockedFeedback(x, cy, label);
}

function clearWinRevealTimeout() {
  if (winRevealTimeoutId !== null) {
    clearTimeout(winRevealTimeoutId);
    winRevealTimeoutId = null;
  }
}

function normalizeDifficultyMode(mode) {
  const normalized = typeof mode === 'string' ? mode.toLowerCase() : '';
  if (normalized === 'casual' || normalized === 'normal' || normalized === 'challenge' || normalized === 'expert') {
    return normalized;
  }
  return 'normal';
}

function getDifficultySettings() {
  if (!window.DifficultySystem || typeof window.DifficultySystem.getModeSettings !== 'function') return null;
  return window.DifficultySystem.getModeSettings();
}

function getCurrentPar(basePar = 0) {
  if (window.DifficultySystem && typeof window.DifficultySystem.getAdjustedPar === 'function') {
    return window.DifficultySystem.getAdjustedPar(basePar);
  }
  return basePar;
}

function calculateStarCount(currentMoves, basePar) {
  if (window.DifficultySystem && typeof window.DifficultySystem.calculateStars === 'function') {
    return window.DifficultySystem.calculateStars(currentMoves, basePar);
  }
  if (currentMoves <= basePar) return 3;
  if (currentMoves <= basePar + 2) return 2;
  return 1;
}

function getDifficultyRewardBonus() {
  if (currentDifficultyMode === 'expert') return 2;
  if (currentDifficultyMode === 'challenge') return 1;
  return 0;
}

function dispatchGameStateUpdate() {
  window.dispatchEvent(new CustomEvent('gameStateUpdate', {
    detail: {
      bottles: bottles,
      target: targetAmt,
      moves: moves,
      par: getCurrentPar(LEVELS[lvlIdx].par),
      difficulty: currentDifficultyMode
    }
  }));
}

function refreshEconomyFromStorage() {
  if (window.MonetizationSystem && typeof window.MonetizationSystem.getHintBalance === 'function') {
    hintCount = window.MonetizationSystem.getHintBalance();
  } else {
    hintCount = parseInt(localStorage.getItem('water_puzzle_hints') || '5', 10);
  }
  totalStars = parseInt(localStorage.getItem('water_puzzle_stars') || '0', 10) || 0;
}

function consumeHintForHintAction() {
  if (window.MonetizationSystem && typeof window.MonetizationSystem.isAdFreeEntitled === 'function' && window.MonetizationSystem.isAdFreeEntitled()) {
    return 0;
  }
  if (hintCount <= 0) return 0;
  if (window.MonetizationSystem && typeof window.MonetizationSystem.consumeHint === 'function') {
    window.MonetizationSystem.consumeHint(1, { source: 'hint_button', levelIndex: lvlIdx });
    hintCount = window.MonetizationSystem.getHintBalance();
  } else {
    hintCount = Math.max(0, hintCount - 1);
    localStorage.setItem('water_puzzle_hints', hintCount);
  }
  return 1;
}

function queueTransferFeedback(fromI, toI, colorIdx) {
  transferFeedback.push({
    fromI,
    toI,
    colorIdx,
    start: performance.now()
  });
  if (transferFeedback.length > TRANSFER_FEEDBACK.maxConcurrent) transferFeedback.shift();
}

function cleanupTransferFeedback(ts) {
  for (let i = transferFeedback.length - 1; i >= 0; i--) {
    const t = (ts - transferFeedback[i].start) / TRANSFER_FEEDBACK.cueMs;
    if (t >= 1) transferFeedback.splice(i, 1);
  }
}

function getBottleTransferHighlight(idx, ts) {
  let source = 0;
  let destination = 0;
  for (let i = transferFeedback.length - 1; i >= 0; i--) {
    const fx = transferFeedback[i];
    const elapsed = ts - fx.start;
    if (elapsed < 0) continue;

    if (fx.fromI === idx) {
      const p = Math.min(elapsed / TRANSFER_FEEDBACK.sourceMs, 1);
      source = Math.max(source, 1 - p);
    }

    if (fx.toI === idx) {
      const toElapsed = elapsed - TRANSFER_FEEDBACK.destinationDelayMs;
      if (toElapsed >= 0) {
        const p = Math.min(toElapsed / TRANSFER_FEEDBACK.destinationMs, 1);
        destination = Math.max(destination, 1 - p);
      }
    }
  }
  return { source, destination };
}

function bottleMouthPoint(idx, L) {
  const b = bottles[idx];
  const bh = b.capacity * L.pxPerL;
  return {
    x: L.xs[idx] + L.bottleW / 2,
    y: clamp(L.bottomY - bh + 12, L.topSafeY + 10, L.bottomSafeY - 18)
  };
}

function drawTransferFeedbackCue(L, ts) {
  for (let i = transferFeedback.length - 1; i >= 0; i--) {
    const fx = transferFeedback[i];
    const t = (ts - fx.start) / TRANSFER_FEEDBACK.cueMs;
    if (t >= 1) {
      transferFeedback.splice(i, 1);
      continue;
    }

    const ease = 1 - Math.pow(1 - t, 2);
    const alpha = (1 - t) * (1 - t);
    const from = bottleMouthPoint(fx.fromI, L);
    const to = bottleMouthPoint(fx.toI, L);
    const color = C.liquids[fx.colorIdx % C.liquids.length];
    const ctrlX = (from.x + to.x) / 2;
    const ctrlY = Math.max(L.topSafeY + 8, Math.min(from.y, to.y) - 20);

    ctx.save();
    ctx.globalAlpha = alpha * 0.6;
    ctx.lineCap = 'round';
    ctx.lineWidth = 2 + alpha;
    const grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
    grad.addColorStop(0, color[0]);
    grad.addColorStop(1, color[1]);
    ctx.strokeStyle = grad;
    ctx.shadowBlur = 12;
    ctx.shadowColor = color[0];
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(ctrlX, ctrlY, to.x, to.y);
    ctx.stroke();

    const rippleR = 8 + ease * 12;
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.58)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(to.x, to.y, rippleR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function clearActiveHint() {
  activeHint = null;
  setHintPulseActive(false);
  if (hintTimeoutId !== null) {
    clearTimeout(hintTimeoutId);
    hintTimeoutId = null;
  }
}

function setActiveHint(hint, timeoutMs = HINT_DISPLAY_MS) {
  if (!hint || !Number.isInteger(hint.from) || !Number.isInteger(hint.to) || hint.from === hint.to) {
    clearActiveHint();
    return false;
  }

  clearActiveHint();
  activeHint = { from: hint.from, to: hint.to };
  setHintPulseActive(true);

  if (timeoutMs > 0) {
    hintTimeoutId = setTimeout(() => {
      activeHint = null;
      setHintPulseActive(false);
      hintTimeoutId = null;
    }, timeoutMs);
  }
  return true;
}

let targetMouseX = 0, targetMouseY = 0;
let mouseX = 0, mouseY = 0;
let bottlePhysics = []; // {tilt, vel, targetTilt, squash, squashVel} for each bottle

window.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    targetMouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    targetMouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  }
});

// For touch devices, use the center as default
window.addEventListener('touchstart', (e) => {
  targetMouseX = 0; targetMouseY = 0;
}, { passive: true });


// ── AUDIO ENGINE ─────────────────────────────────────────────────────────────
class AudioController {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('water_puzzle_sound') !== 'false';
  }
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  vibrate(ms) {
    safeVibrate(ms);
  }
  play(type) {
    if (!this.enabled || !this.ctx) return;
    const g = this.ctx.createGain();
    const o = this.ctx.createOscillator();
    g.connect(this.ctx.destination);
    o.connect(g);
    const now = this.ctx.currentTime;
    if (type === 'tap') {
      this.vibrate(10);
      o.type = 'triangle'; o.frequency.setValueAtTime(440, now);
      o.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      g.gain.setValueAtTime(0.1, now); g.gain.linearRampToValueAtTime(0, now + 0.1);
    } else if (type === 'pour') {
      this.vibrate(20);
      o.type = 'sine'; o.frequency.setValueAtTime(150, now);
      o.frequency.linearRampToValueAtTime(100, now + 0.4);
      g.gain.setValueAtTime(0.05, now); g.gain.linearRampToValueAtTime(0, now + 0.4);
    } else if (type === 'win') {
      this.vibrate([50, 30, 50, 30, 50]);
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.frequency.value = f + (Math.random() - 0.5) * 30;
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.4);
        osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 0.5);
      });
      return;
    } else if (type === 'error') {
      this.vibrate([30, 20, 30]);
      o.type = 'sawtooth'; o.frequency.setValueAtTime(60, now);
      g.gain.setValueAtTime(0.1, now); g.gain.linearRampToValueAtTime(0, now + 0.2);
    }
    o.start(); o.stop(now + 0.5);
  }
}

const Audio = new AudioController();

// ── PARTICLES ────────────────────────────────────────────────────────────────
class ParticleSystem {
  constructor() { this.particles = []; }
  burst(x, y, color, count = 20, isStar = false) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y, color, isStar,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0, size: Math.random() * 4 + 2,
        r: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.2
      });
    }
  }
  spawnConfetti(x, y) {
    for (let i = 0; i < 50; i++) {
      const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
      this.particles.push({
        x, y, vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15 - 10,
        r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.2,
        size: 5 + Math.random() * 5, life: 1 + Math.random(), color, isConfetti: true
      });
    }
  }
  spawnLaserSparks(x, y) {
    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 5, y: y + (Math.random() - 0.5) * 5,
        vx: (Math.random() - 0.5) * 1, vy: (Math.random() - 0.5) * 1,
        size: 1 + Math.random() * 2, life: 0.5 + Math.random() * 0.5,
        color: '#FFFFFF', isLaser: true
      });
    }
  }

  update(dt = 1 / 60) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy;
      if (!p.isLaser) p.vy += p.isConfetti ? 0.35 : 0.25;
      p.vx *= 0.98;
      p.life -= p.isLaser ? 0.05 : (p.isConfetti ? 0.012 : 0.025);
      if (p.r !== undefined) p.r += p.vr;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(ctx) {
    ctx.save();
    this.particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      if (p.isConfetti) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r + p.life * 5);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
        ctx.restore();
      } else if (p.isStar) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.shadowBlur = 10; ctx.shadowColor = p.color;
        ctx.beginPath(); for (let j = 0; j < 5; j++) { ctx.lineTo(Math.cos(j * Math.PI * 2 / 5) * p.size, Math.sin(j * Math.PI * 2 / 5) * p.size); ctx.lineTo(Math.cos(j * Math.PI * 2 / 5 + Math.PI / 5) * p.size / 2, Math.sin(j * Math.PI * 2 / 5 + Math.PI / 5) * p.size / 2); }
        ctx.closePath(); ctx.fill(); ctx.restore();
      } else if (p.isLaser) {
        ctx.shadowBlur = 10; ctx.shadowColor = '#FF512F';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
    });
    ctx.restore();
  }
}

const Particles = new ParticleSystem();

// ── GAME STATE ───────────────────────────────────────────────────────────────
let lvlIdx = parseInt(localStorage.getItem('water_puzzle_lvl')) || 0;
let bottles = [];
let dispAmts = [];
let selIdx = null;
let moves = 0;
let history = [];
let won = false;
let targetAmt = 0;
let isAnimating = false;
let shakeAnim = null;
let entryStartTime = 0;

// ── SOLVER ───────────────────────────────────────────────────────────────────
/**
 * BFS Solver for Water Puzzle.
 * Used for hints and level validation.
 */
class GameSolver {
  /**
   * Generates a unique hash string for a given bottle state.
   * @param {Array<number[]>} state - Array of bottle arrays (colors).
   * @returns {string} Unique hash.
   */
  static getHash(state) {
    return state.map(b => `${b.current.toFixed(3)}/${b.capacity.toFixed(3)}`).join('|');
  }

  /**
   * Finds the shortest path to solve the level.
   * @param {Array<{current:number,capacity:number}>} bottles - Current bottle states.
   * @param {number} targetAmt - Amount needed to win.
   * @returns {Object|null} {from, to} for the first move, or null if no solution.
   */
  static solve(bottles, targetAmt) {
    if (!Array.isArray(bottles) || bottles.length < 2 || typeof targetAmt !== 'number' || !Number.isFinite(targetAmt) || targetAmt <= 0) {
      return null;
    }

    const startState = bottles.map((b) => ({
      current: Number(b.current),
      capacity: Number(b.capacity)
    }));

    if (startState.some((b) => !Number.isFinite(b.current) || !Number.isFinite(b.capacity) || b.capacity <= 0)) {
      return null;
    }

    const queue = [{ state: startState, path: [] }];
    const visited = new Set([this.getHash(startState)]);

    // Safety limit to prevent browser hang
    let iterations = 0;
    while (queue.length > 0 && iterations < 50000) {
      iterations++;
      const { state, path } = queue.shift();

      // Check win condition
      if (path.length > 0 && state.some(b => Math.abs(b.current - targetAmt) < 0.01)) return path[0];

      // Try all possible moves
      for (let i = 0; i < state.length; i++) {
        for (let j = 0; j < state.length; j++) {
          if (i === j) continue;
          if (state[i].current === 0) continue;
          if (state[j].current === state[j].capacity) continue;

          // Simulate pour
          const nextState = state.map(b => ({ ...b }));
          const canTake = nextState[j].capacity - nextState[j].current;
          const amount = Math.min(nextState[i].current, canTake);
          if (amount <= 0) continue;
          nextState[i].current -= amount;
          nextState[j].current += amount;

          const hash = this.getHash(nextState);
          if (!visited.has(hash)) {
            visited.add(hash);
            queue.push({ state: nextState, path: [...path, { from: i, to: j }] });
          }
        }
      }
    }
    return null;
  }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const restartBtn = document.getElementById('restart-btn');
const undoBtn = document.getElementById('undo-btn');
const hintBtn = document.getElementById('hint-btn');
const soundBtn = document.getElementById('sound-btn');
const menuBtn = document.getElementById('menu-btn');
const hudWorldLevel = document.getElementById('hud-world-level');
const hudMovesPar = document.getElementById('hud-moves-par');
const hudTarget = document.getElementById('hud-target');
const hudHints = document.getElementById('hud-hints');
const hudStars = document.getElementById('hud-stars');

const levelMenuOverlay = document.getElementById('level-menu-overlay');
const lmClose = document.getElementById('lm-close');
const lmGrid = document.getElementById('lm-grid');
const lmPrevBtn = document.getElementById('lm-prev-btn');
const lmNextBtn = document.getElementById('lm-next-btn');
const lmPageInfo = document.getElementById('lm-page-info');
const lmTitle = document.getElementById('lm-title');
const lmCard = document.getElementById('lm-card');
const winOverlay = document.getElementById('win-overlay');
const winCard = document.querySelector('.win-card');
const winNextBtn = document.getElementById('win-next-btn');
const topHud = document.getElementById('top-hud');
const topMenuToggle = document.getElementById('top-menu-toggle');
const topUtilitiesTray = document.getElementById('top-utilities-tray');
const hudHintsPill = document.getElementById('hud-pill-hints');
const hudStarsPill = document.getElementById('hud-pill-stars');
const bottomBanner = document.getElementById('bottom-banner');
const lmHeader = document.querySelector('.lm-header');
const lmContent = document.querySelector('.lm-content');
const lmFooter = document.querySelector('.lm-footer');
let watchHintsOfferBtn = null;
let retryAssistOfferBtn = null;
let buyAdFreeBtn = null;
let buyHintsOfferBtn = null;
let winBonusBtn = null;
let winBonusClaimed = false;

let currentLevelPage = 0;
const LEVELS_PER_PAGE = 20;
let levelMenuReturnFocus = null;
let winReturnFocus = null;

if (topUtilitiesTray) {
  if (hudHintsPill) topUtilitiesTray.appendChild(hudHintsPill);
  if (hudStarsPill) topUtilitiesTray.appendChild(hudStarsPill);
}

function createUtilityOfferButton(label, value, ariaLabel) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'hud-pill';
  btn.innerHTML = `
    <span class="hud-label">${label}</span>
    <span class="hud-value">${value}</span>
  `;
  btn.setAttribute('aria-label', ariaLabel);
  btn.style.cursor = 'pointer';
  btn.style.pointerEvents = 'auto';
  return btn;
}

function renderMonetizationOfferStates() {
  refreshEconomyFromStorage();
  const adFreeActive = window.MonetizationSystem && typeof window.MonetizationSystem.isAdFreeEntitled === 'function'
    ? window.MonetizationSystem.isAdFreeEntitled()
    : false;
  if (watchHintsOfferBtn) watchHintsOfferBtn.querySelector('.hud-value').textContent = '+3 Hints';
  if (retryAssistOfferBtn) retryAssistOfferBtn.querySelector('.hud-value').textContent = 'Retry Assist';
  if (buyAdFreeBtn) {
    buyAdFreeBtn.querySelector('.hud-value').textContent = adFreeActive ? 'Owned' : '$4.99';
    buyAdFreeBtn.disabled = adFreeActive;
    buyAdFreeBtn.setAttribute('aria-disabled', String(adFreeActive));
  }
  if (buyHintsOfferBtn) buyHintsOfferBtn.querySelector('.hud-value').textContent = '+10 • $1.99';
  if (winBonusBtn) {
    winBonusBtn.disabled = winBonusClaimed;
    winBonusBtn.setAttribute('aria-disabled', String(winBonusClaimed));
    winBonusBtn.textContent = winBonusClaimed ? 'Bonus Claimed' : 'Watch Ad for +2 Bonus ⭐';
  }
}

function performRetryAssist() {
  if (!isAnimating && !won && history.length > 0) {
    const previous = history.pop();
    bottles = previous.bottles;
    dispAmts = bottles.map(b => b.current);
    moves = previous.moves;
    clearActiveHint();
    levelSessionStats.usedUndo = true;
    window.dispatchEvent(new CustomEvent('undoUsed', {
      detail: { source: 'retry_assist' }
    }));
    if (window.FeedbackSystem) window.FeedbackSystem.undoPerformed();
    dispatchGameStateUpdate();
    updateHUD();
    return true;
  }
  initLevel(lvlIdx);
  return true;
}

function setupMonetizationEntryPoints() {
  if (!topUtilitiesTray || !window.MonetizationSystem) return;
  watchHintsOfferBtn = createUtilityOfferButton('Rewarded', '+3 Hints', 'Watch ad for hints');
  retryAssistOfferBtn = createUtilityOfferButton('Rewarded', 'Retry Assist', 'Watch ad for retry assist');
  buyAdFreeBtn = createUtilityOfferButton('Ad-Free', '$4.99', 'Buy ad-free entitlement');
  buyHintsOfferBtn = createUtilityOfferButton('Hints Pack', '+10 • $1.99', 'Buy hint bundle');

  watchHintsOfferBtn.addEventListener('click', async () => {
    const result = await window.MonetizationSystem.runRewardedOffer('hint_refill', {
      placement: 'hud_utility'
    });
    if (result.status === 'completed') {
      refreshEconomyFromStorage();
      updateHUD();
      renderMonetizationOfferStates();
      if (window.FeedbackSystem) window.FeedbackSystem.success(`+${result.amount} hints`);
    } else if (result.status === 'failed' && window.FeedbackSystem) {
      window.FeedbackSystem.warning('Rewarded ad unavailable');
    }
  });

  retryAssistOfferBtn.addEventListener('click', async () => {
    const result = await window.MonetizationSystem.runRewardedOffer('retry_assist', {
      placement: 'hud_utility'
    });
    if (result.status === 'completed') {
      performRetryAssist();
      renderMonetizationOfferStates();
      Audio.play('tap');
    } else if (result.status === 'failed' && window.FeedbackSystem) {
      window.FeedbackSystem.warning('Rewarded ad unavailable');
    }
  });

  buyAdFreeBtn.addEventListener('click', async () => {
    const purchase = await window.MonetizationSystem.purchaseProduct('ad_free', {
      placement: 'hud_utility'
    });
    if (purchase.status === 'completed' && window.FeedbackSystem) {
      window.FeedbackSystem.success('Ad-free entitlement activated');
    }
    renderMonetizationOfferStates();
  });

  buyHintsOfferBtn.addEventListener('click', async () => {
    const purchase = await window.MonetizationSystem.purchaseProduct('hints_small', {
      placement: 'hud_utility'
    });
    if (purchase.status === 'completed') {
      refreshEconomyFromStorage();
      updateHUD();
      if (window.FeedbackSystem) window.FeedbackSystem.success('+10 hints added');
    }
    renderMonetizationOfferStates();
  });

  topUtilitiesTray.appendChild(watchHintsOfferBtn);
  topUtilitiesTray.appendChild(retryAssistOfferBtn);
  topUtilitiesTray.appendChild(buyAdFreeBtn);
  topUtilitiesTray.appendChild(buyHintsOfferBtn);

  winBonusBtn = document.createElement('button');
  winBonusBtn.type = 'button';
  winBonusBtn.className = 'win-next-btn';
  winBonusBtn.style.marginBottom = '12px';
  winBonusBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
  winBonusBtn.textContent = 'Watch Ad for +2 Bonus ⭐';
  winBonusBtn.addEventListener('click', async () => {
    if (winBonusClaimed) return;
    const result = await window.MonetizationSystem.runRewardedOffer('bonus_reward', {
      placement: 'win_overlay'
    });
    if (result.status === 'completed') {
      winBonusClaimed = true;
      refreshEconomyFromStorage();
      updateHUD();
      renderMonetizationOfferStates();
      if (window.FeedbackSystem) window.FeedbackSystem.success(`+${result.amount} bonus stars`);
    } else if (result.status === 'failed' && window.FeedbackSystem) {
      window.FeedbackSystem.warning('Rewarded ad unavailable');
    }
  });
  winNextBtn.parentNode.insertBefore(winBonusBtn, winNextBtn);
  renderMonetizationOfferStates();
}

function setOverlayOpenState(overlay, isOpen) {
  overlay.classList.toggle('active', isOpen);
  overlay.setAttribute('aria-hidden', String(!isOpen));
}

function restoreFocus(target, fallback) {
  if (target && typeof target.focus === 'function' && document.contains(target)) {
    target.focus();
    return;
  }
  if (fallback && typeof fallback.focus === 'function' && document.contains(fallback)) {
    fallback.focus();
  }
}

function isKeyboardActivateKey(key) {
  return key === 'Enter' || key === ' ' || key === 'Spacebar';
}

function renderLevelPage(pageIdx) {
  const maxPage = Math.ceil(LEVELS.length / LEVELS_PER_PAGE) - 1;
  currentLevelPage = Math.max(0, Math.min(pageIdx, maxPage));

  lmTitle.textContent = `WORLD ${currentLevelPage + 1}`;
  lmPageInfo.textContent = `${currentLevelPage + 1} / ${maxPage + 1}`;

  lmPrevBtn.disabled = currentLevelPage === 0;
  lmNextBtn.disabled = currentLevelPage === maxPage;
  lmPrevBtn.setAttribute('aria-disabled', String(lmPrevBtn.disabled));
  lmNextBtn.setAttribute('aria-disabled', String(lmNextBtn.disabled));

  lmGrid.classList.remove('enter');
  lmGrid.innerHTML = '';
  const startIdx = currentLevelPage * LEVELS_PER_PAGE;
  const endIdx = Math.min(startIdx + LEVELS_PER_PAGE, LEVELS.length);
  const unlockedLevel = parseInt(localStorage.getItem('maxUnlockedLevel') || '0', 10);

  for (let i = startIdx; i < endIdx; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lm-btn';
    const tileDelay = Math.min((i - startIdx) * 16, 180);
    btn.style.setProperty('--tile-delay', `${tileDelay}ms`);

    if (i < unlockedLevel) btn.classList.add('passed');
    else if (i === unlockedLevel) btn.classList.add('unlocked');
    else btn.classList.add('locked');

    const levelNumber = i + 1;

    const num = document.createElement('div');
    num.className = 'lm-num';
    num.textContent = levelNumber;
    btn.appendChild(num);

    if (i <= unlockedLevel) {
      btn.setAttribute('aria-label', `Play level ${levelNumber}`);
      const starsDiv = document.createElement('div');
      starsDiv.className = 'lm-stars';
      const storedStars = parseInt(localStorage.getItem(`level_${i}_stars`) || '0', 10);
      starsDiv.textContent = storedStars > 0 ? '⭐'.repeat(storedStars) : '☆☆☆';
      starsDiv.style.opacity = storedStars > 0 ? '1' : '0.4';
      if (i === unlockedLevel) starsDiv.textContent = 'Current';
      btn.appendChild(starsDiv);

      btn.addEventListener('click', () => {
        closeLevelMenu();
        if (i !== lvlIdx) {
          lvlIdx = i;
          initLevel(lvlIdx);
        }
      });
    } else {
      btn.disabled = true;
      btn.setAttribute('aria-label', `Level ${levelNumber} locked`);
      const lockIcon = document.createElement('div');
      lockIcon.innerHTML = '🔒';
      lockIcon.style.fontSize = '16px';
      lockIcon.style.marginTop = '6px';
      lockIcon.style.opacity = '0.85';
      lockIcon.style.textShadow = '0 1px 2px rgba(0,0,0,0.6)';
      btn.appendChild(lockIcon);
    }
    lmGrid.appendChild(btn);
  }

  requestAnimationFrame(() => lmGrid.classList.add('enter'));
}

function openLevelMenu() {
  const unlockedLevel = parseInt(localStorage.getItem('maxUnlockedLevel') || '0', 10);
  levelMenuReturnFocus = document.activeElement;
  currentLevelPage = Math.floor(unlockedLevel / LEVELS_PER_PAGE);
  renderLevelPage(currentLevelPage);
  setOverlayOpenState(levelMenuOverlay, true);
  requestAnimationFrame(() => lmClose.focus());
}

function closeLevelMenu() {
  const wasOpen = levelMenuOverlay.classList.contains('active');
  setOverlayOpenState(levelMenuOverlay, false);
  lmGrid.classList.remove('enter');
  if (wasOpen) restoreFocus(levelMenuReturnFocus, menuBtn);
  levelMenuReturnFocus = null;
}

function closeTopOverlay() {
  if (topUtilitiesTray && topUtilitiesTray.classList.contains('open')) {
    setTopUtilitiesOpen(false);
    return true;
  }
  if (levelMenuOverlay.classList.contains('active')) {
    closeLevelMenu();
    return true;
  }
  if (winOverlay.classList.contains('active')) {
    hideWin();
    return true;
  }
  return false;
}

function setTopUtilitiesOpen(isOpen) {
  if (!topUtilitiesTray || !topMenuToggle) return;
  topUtilitiesTray.classList.toggle('open', isOpen);
  topUtilitiesTray.setAttribute('aria-hidden', String(!isOpen));
  topMenuToggle.setAttribute('aria-expanded', String(isOpen));
  document.body.classList.toggle('utilities-open', isOpen);
}

function saveProgress() { localStorage.setItem('water_puzzle_lvl', lvlIdx); }

function updateBackgroundTheme() {
  const worldIdx = Math.floor(lvlIdx / 20);
  if (window.ThemeSystem && typeof window.ThemeSystem.applyWorldTheme === 'function') {
    window.ThemeSystem.applyWorldTheme(worldIdx);
    return;
  }
  const themes = [
    ['#0f172a', '#1e1b4b'],
    ['#1a0f2e', '#4b1b3e'],
    ['#0f2a1e', '#1b4b32'],
    ['#2a1e0f', '#4b321b'],
    ['#0c0c0c', '#2c2c2c'],
  ];
  const theme = themes[worldIdx % themes.length];
  document.documentElement.style.setProperty('--bg-start', theme[0]);
  document.documentElement.style.setProperty('--bg-end', theme[1]);
}

function initLevel(idx) {
  lvlIdx = idx % LEVELS.length;
  updateBackgroundTheme();
  saveProgress();
  safeVibrate(10);
  const lvl = LEVELS[lvlIdx];
  bottles = lvl.initial.map((amt, i) => ({
    capacity: lvl.capacities[i], current: amt, colorIdx: i % C.liquids.length, entryScale: 0
  }));
  targetAmt = lvl.target;
  dispAmts = bottles.map(b => b.current);
  bottlePhysics = bottles.map(() => ({ tilt: 0, vel: 0, targetTilt: 0, squash: 1, squashVel: 0 }));
  selIdx = null; moves = 0; history = []; won = false; isAnimating = false;
  levelSessionStats = { usedHint: false, usedUndo: false };
  isDailyRunActive = false;
  shakeAnim = null;
  transferFeedback.length = 0;
  clearWinRevealTimeout();
  entryStartTime = performance.now();
  clearActiveHint();
  saveProgress(); updateHUD(); hideWin();
  
  // Dispatch level loaded event for progress system
  window.dispatchEvent(new CustomEvent('levelLoaded', {
    detail: {
      level: lvl,
      levelIndex: lvlIdx,
      par: getCurrentPar(lvl.par),
      target: lvl.target,
      bottles: bottles,
      difficulty: currentDifficultyMode
    }
  }));
  
  // Show progress container
  const progressContainer = document.getElementById('progress-container');
  if (progressContainer) {
    progressContainer.classList.add('visible');
  }
}

function setButtonDisabled(btn, disabled) {
  btn.disabled = disabled;
  btn.setAttribute('aria-disabled', String(disabled));
}

function updateHUD() {
  const level = LEVELS[lvlIdx];
  const worldNum = Math.floor(lvlIdx / 20) + 1;
  const basePar = level?.par ?? 0;
  const par = getCurrentPar(basePar);
  const target = level?.target ?? targetAmt;
  const difficultySettings = getDifficultySettings();
  const isAdFreeEntitled = Boolean(window.MonetizationSystem && typeof window.MonetizationSystem.isAdFreeEntitled === 'function' && window.MonetizationSystem.isAdFreeEntitled());
  const canUseHint = difficultySettings && typeof window.DifficultySystem?.canUseHint === 'function'
    ? window.DifficultySystem.canUseHint()
    : true;

  hudWorldLevel.textContent = `W${worldNum} • L${lvlIdx + 1}`;
  hudMovesPar.textContent = `${moves} / PAR ${par}`;
  hudTarget.textContent = `${target}L`;
  hudHints.textContent = isAdFreeEntitled ? 'FREE' : String(Math.max(0, hintCount));
  hudStars.textContent = `${totalStars} ⭐`;

  document.getElementById('hint-count').textContent = isAdFreeEntitled ? 'FREE' : String(Math.max(0, hintCount));
  soundBtn.classList.toggle('muted', !Audio.enabled);
  soundBtn.setAttribute('aria-pressed', String(Audio.enabled));
  soundBtn.setAttribute('aria-label', Audio.enabled ? 'Mute sound' : 'Unmute sound');
  hintBtn.setAttribute('aria-label', canUseHint ? (isAdFreeEntitled ? 'Use free hint' : `Use hint (${Math.max(0, hintCount)} remaining)`) : 'Hints unavailable in this mode');

  const actionsBlocked = isAnimating || won;
  setButtonDisabled(menuBtn, isAnimating);
  setButtonDisabled(restartBtn, isAnimating);
  setButtonDisabled(undoBtn, actionsBlocked || history.length === 0);
  setButtonDisabled(hintBtn, actionsBlocked || !canUseHint);
  setHintPulseActive(Boolean(activeHint && !actionsBlocked));
  renderMonetizationOfferStates();
}

// ── LAYOUT ───────────────────────────────────────────────────────────────────

const baselineSnapshots = new Set();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getViewportBucket(width) {
  for (const viewport of LAYOUT.baselineViewports) {
    if (viewport.maxWidth && width <= viewport.maxWidth) return viewport.name;
    if (viewport.minWidth && width >= viewport.minWidth) return viewport.name;
  }
  return 'unknown';
}

function readLayoutSafeArea(H) {
  const canvasRect = canvas.getBoundingClientRect();
  const hudRect = topHud?.getBoundingClientRect();
  const utilityTrayRect = topUtilitiesTray?.getBoundingClientRect();
  const progressContainer = document.getElementById('progress-container');
  const progressRect = progressContainer?.getBoundingClientRect();
  const utilityTrayOpen = Boolean(topUtilitiesTray && topUtilitiesTray.classList.contains('open'));
  const progressVisible = Boolean(
    progressContainer &&
    progressRect &&
    getComputedStyle(progressContainer).display !== 'none' &&
    progressContainer.classList.contains('visible')
  );
  const bannerRect = bottomBanner?.getBoundingClientRect();

  const hudBottomInCanvas = hudRect ? Math.max(0, hudRect.bottom - canvasRect.top) : 0;
  const trayBottomInCanvas = utilityTrayOpen && utilityTrayRect ? Math.max(0, utilityTrayRect.bottom - canvasRect.top) : 0;
  const progressBottomInCanvas = progressVisible && progressRect ? Math.max(0, progressRect.bottom - canvasRect.top) : 0;
  const topOverlayBottomInCanvas = Math.max(hudBottomInCanvas, trayBottomInCanvas, progressBottomInCanvas);
  const bannerOverlapInCanvas = bannerRect ? Math.max(0, canvasRect.bottom - bannerRect.top) : 0;

  const topSafe = clamp(
    Math.max(LAYOUT.safeAreaTopBase, topOverlayBottomInCanvas + LAYOUT.hudToGameplayGap),
    0,
    Math.max(0, H - LAYOUT.safeAreaBottomBase)
  );
  const bottomSafe = clamp(
    Math.max(LAYOUT.safeAreaBottomBase, bannerOverlapInCanvas + LAYOUT.bannerToGameplayGap),
    0,
    Math.max(0, H - topSafe)
  );

  return {
    topSafe,
    bottomSafe,
    sideSafe: LAYOUT.safeAreaSide
  };
}

function captureLayoutBaseline(layout, safeArea) {
  const bucket = getViewportBucket(window.innerWidth);
  const key = `${bucket}:${window.innerWidth}x${window.innerHeight}`;
  if (baselineSnapshots.has(key)) return;
  baselineSnapshots.add(key);

  window.__waterPuzzleLayoutBaseline = window.__waterPuzzleLayoutBaseline || {};
  window.__waterPuzzleLayoutBaseline[key] = {
    viewport: bucket,
    width: window.innerWidth,
    height: window.innerHeight,
    hudSafeTop: Math.round(safeArea.topSafe),
    gameplayBottomSafe: Math.round(safeArea.bottomSafe),
    bottleSpacing: Number(layout.spacing.toFixed(2)),
    bottleHeightMax: Number((layout.maxCap * layout.pxPerL).toFixed(2))
  };
}

function getLayout() {
  const W = canvas.width, H = canvas.height;
  const n = bottles.length;
  if (!n) {
    return {
      W,
      H,
      n,
      maxCap: 1,
      pxPerL: 0,
      bottleW: 0,
      bottomY: H,
      xs: [],
      spacing: 0,
      topSafeY: 0,
      bottomSafeY: H
    };
  }

  const maxCap = Math.max(...bottles.map(b => b.capacity));
  const safeArea = readLayoutSafeArea(H);
  const topSafeY = safeArea.topSafe;
  const sideSafe = safeArea.sideSafe;
  const bottomSafeY = H - safeArea.bottomSafe;

  const topLimit = topSafeY + LAYOUT.bottleTopGap;
  const bottomY = clamp(bottomSafeY - LAYOUT.bottleLabelGap, topLimit + 40, bottomSafeY);

  const maxBottleHeightByViewport = Math.max(80, bottomY - topLimit);
  const minBottleHeight = Math.min(LAYOUT.minBottleHeight, maxBottleHeightByViewport);
  const unclampedBottleHeight = Math.min(LAYOUT.maxPxPerL, maxBottleHeightByViewport / maxCap) * maxCap;
  const clampedBottleHeight = clamp(unclampedBottleHeight, minBottleHeight, maxBottleHeightByViewport);
  const pxPerL = clampedBottleHeight / maxCap;

  const innerW = Math.max(0, W - sideSafe * 2);
  const maxBottleWBySpacing = n > 1
    ? (innerW - LAYOUT.minBottleSpacing * (n - 1)) / n
    : innerW;
  const bottleW = Math.max(16, Math.min(LAYOUT.maxBottleWidth, maxBottleWBySpacing));
  const spacing = n > 1
    ? Math.max(LAYOUT.minBottleSpacing, (innerW - bottleW * n) / (n - 1))
    : 0;
  const totalBottleWidth = bottleW * n + spacing * (n - 1);
  const startX = (W - totalBottleWidth) / 2;
  const xs = bottles.map((_, i) => startX + i * (bottleW + spacing));

  const layout = {
    W,
    H,
    n,
    maxCap,
    pxPerL,
    bottleW,
    bottomY,
    xs,
    spacing,
    topSafeY,
    bottomSafeY
  };
  captureLayoutBaseline(layout, safeArea);
  return layout;
}

function bottlePath(x, y, w, h) {
  // Simple test-tube shape: rounded rectangle
  const r = Math.min(14, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function roundRect(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function drawBackground(L, ts) {
  // Clear with a very slight gradient overlay to enhance the CSS gradient
  ctx.clearRect(0, 0, L.W, L.H);

  // Subtle drift particles in background
  ctx.save();
  const time = ts * 0.0002;
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 5; i++) {
    const x = (Math.sin(time + i * 2) * 0.5 + 0.5) * L.W;
    const y = (Math.cos(time * 0.8 + i) * 0.5 + 0.5) * L.H;
    const r = 100 + Math.sin(time * 0.5 + i) * 50;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(58, 123, 213, ${0.05 + Math.sin(time + i) * 0.02})`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, L.W, L.H);
  }
  ctx.restore();
}

function drawHeader(W, ts) {
  const entryProgress = Math.max(0, Math.min(1, (ts - entryStartTime) / 800));
  const alpha = entryProgress;
  const yOffset = (1 - entryProgress) * 20;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Level info (left)
  ctx.fillStyle = C.muted; ctx.textAlign = 'left';
  ctx.font = '700 13px Inter';
  ctx.fillText(`WORLD ${Math.floor(lvlIdx / 20) + 1}`, 24, 35 - yOffset);
  ctx.font = '800 11px Inter'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText(`LEVEL ${lvlIdx + 1} • TARGET ${LEVELS[lvlIdx].target}L`, 24, 54 - yOffset * 0.5);

  // Move counter (center)
  ctx.textAlign = 'center';
  ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.fillStyle = C.text; ctx.font = '900 32px Inter';
  ctx.fillText(moves, W / 2, 45 - yOffset);
  ctx.shadowBlur = 0;
  ctx.fillStyle = C.muted; ctx.font = '700 10px Inter';
  ctx.fillText(`PAR ${LEVELS[lvlIdx].par}`, W / 2, 62 - yOffset * 0.5);

  // Stars (right)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 15px Inter';
  ctx.fillText(`${totalStars} ⭐`, W - 24, 44 - yOffset);

  ctx.restore();
}

function drawBottle(i, L, ts) {
  const { pxPerL, bottleW, bottomY, xs } = L;
  const b = bottles[i];
  const p = bottlePhysics[i];
  if (!p) return;
  const bh = b.capacity * pxPerL;
  const isTarget = Math.abs(dispAmts[i] - targetAmt) < 0.01 && targetAmt > 0;

  const entryDelay = i * 80;
  const entryProgress = Math.max(0, Math.min(1, (ts - entryStartTime - entryDelay) / 400));
  const entryYOffset = (1 - entryProgress) * 60;
  const entryScale = 0.9 + 0.1 * entryProgress;

  let x = xs[i], lift = 0;

  // Selection Lift (Springy)
  if (selIdx === i) {
    const t = Math.min(1, (ts - lastSelTime) / 400);
    const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
    lift = -25 * e;
  }

  if (shakeAnim && shakeAnim.idx === i) {
    const t = (ts - shakeAnim.start) / 350;
    if (t < 1) x += Math.sin(t * Math.PI * 8) * 4 * (1 - t);
    else shakeAnim = null;
  }

  const ty = bottomY - bh + lift + entryYOffset;

  ctx.save();
  ctx.translate(x + bottleW / 2, ty + bh / 2);
  ctx.rotate(p.tilt * Math.PI / 180);

  // Apply Squash & Stretch
  const s = p.squash || 1;
  const invS = 1 / s;
  ctx.scale(entryScale * invS, entryScale * s);

  ctx.translate(-(x + bottleW / 2), -(ty + bh / 2));

  // Selection Glow with Pulse
  if (selIdx === i) {
    const pulse = 1 + 0.1 * Math.sin(ts / 200);
    ctx.save();
    ctx.shadowBlur = 30 * pulse; ctx.shadowColor = 'rgba(0, 210, 255, 0.4)';
    bottlePath(x, ty, bottleW, bh);
    ctx.strokeStyle = `rgba(0, 210, 255, ${0.6 + 0.2 * pulse})`;
    ctx.lineWidth = 4 * pulse;
    ctx.stroke();
    ctx.restore();
  }

  const isHintSource = activeHint && activeHint.from === i;
  const isHintDestination = activeHint && activeHint.to === i;
  if (isHintSource || isHintDestination) {
    const pulse = 0.65 + 0.35 * Math.sin(ts / 160);
    ctx.save();
    bottlePath(x, ty, bottleW, bh);
    ctx.lineWidth = isHintDestination ? 4 : 3;
    ctx.shadowBlur = 22 + pulse * 10;
    ctx.shadowColor = isHintDestination ? 'rgba(0, 255, 170, 0.8)' : 'rgba(255, 190, 60, 0.8)';
    ctx.strokeStyle = isHintDestination
      ? `rgba(0, 255, 170, ${0.65 + pulse * 0.3})`
      : `rgba(255, 190, 60, ${0.65 + pulse * 0.3})`;
    ctx.stroke();
    ctx.restore();
  }

  const transferGlow = getBottleTransferHighlight(i, ts);
  if (transferGlow.source > 0 || transferGlow.destination > 0) {
    const sourceAlpha = transferGlow.source * 0.32;
    const destinationAlpha = transferGlow.destination * 0.42;
    const highlightAlpha = Math.max(sourceAlpha, destinationAlpha);
    const strokeColor = destinationAlpha >= sourceAlpha
      ? `rgba(88, 244, 197, ${highlightAlpha})`
      : `rgba(255, 204, 122, ${highlightAlpha})`;
    ctx.save();
    bottlePath(x, ty, bottleW, bh);
    ctx.lineWidth = 2.5 + highlightAlpha * 3;
    ctx.strokeStyle = strokeColor;
    ctx.shadowBlur = 14 + highlightAlpha * 16;
    ctx.shadowColor = strokeColor;
    ctx.stroke();
    ctx.restore();
  }

  // Draw Glass Container
  ctx.save();
  const isError = shakeAnim && shakeAnim.idx === i;

  if (isError) {
    ctx.strokeStyle = 'rgba(255, 80, 80, 0.8)';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(255, 80, 80, 0.5)';
  } else if (isTarget) {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15; ctx.shadowColor = '#00FF88';
  } else {
    ctx.strokeStyle = C.bottleBorder;
    ctx.lineWidth = 2.5;
  }

  // Draw bottle shadow
  ctx.shadowBlur = 20; ctx.shadowColor = 'rgba(0,0,0,0.4)';
  bottlePath(x, ty, bottleW, bh);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Glass Inner Surface
  const gradGlass = ctx.createLinearGradient(x, ty, x + bottleW, ty);
  gradGlass.addColorStop(0, 'rgba(255,255,255,0.08)');
  gradGlass.addColorStop(0.5, 'rgba(255,255,255,0.03)');
  gradGlass.addColorStop(1, 'rgba(255,255,255,0.08)');
  ctx.fillStyle = gradGlass;
  ctx.fill();
  ctx.restore();

  // Liquid with Wave Animation
  const amt = dispAmts[i];
  if (amt > 0) {
    ctx.save();
    bottlePath(x, ty, bottleW, bh); ctx.clip();
    const lH = (amt / b.capacity) * bh;
    const baseLY = ty + bh - lH;

    const colors = C.liquids[b.colorIdx];
    const grad = ctx.createLinearGradient(x, baseLY - 10, x, ty + bh);
    grad.addColorStop(0, colors[1]);
    grad.addColorStop(1, colors[0]);

    // Wave path
    ctx.beginPath();
    const waveFreq = 0.04;
    const waveBoost = Math.max(transferGlow.source, transferGlow.destination) * 2;
    const waveAmp = won ? 1 : (1.2 + waveBoost);
    const waveSpeed = ts * 0.005;

    ctx.moveTo(x - 5, ty + bh + 5);
    ctx.lineTo(x - 5, baseLY);

    // Draw surface waves
    for (let wx = 0; wx <= bottleW + 10; wx += 2) {
      const wy = Math.sin(wx * waveFreq + waveSpeed) * waveAmp;
      ctx.lineTo(x + wx, baseLY + wy);
    }

    ctx.lineTo(x + bottleW + 5, ty + bh + 5);
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.fill();

    // Wave Foam/Surface Highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Subtle internal reflections
    const reflectionGrad = ctx.createLinearGradient(x, baseLY, x + bottleW, baseLY);
    reflectionGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
    reflectionGrad.addColorStop(0.5, 'transparent');
    reflectionGrad.addColorStop(1, 'rgba(255,255,255,0.1)');
    ctx.fillStyle = reflectionGrad;
    ctx.fillRect(x, baseLY, bottleW, lH);

    ctx.restore();
  }

  // Specular Glossy Highlights
  ctx.save();
  // Main vertical highlight
  const highlightW = bottleW * 0.12;
  const highlightX = x + bottleW * 0.12;
  ctx.beginPath();
  roundRect(highlightX, ty + 12, highlightW, bh - 24, 6);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fill();

  // Mouth shadow/detail
  ctx.beginPath();
  ctx.moveTo(x + 5, ty + 2);
  ctx.lineTo(x + bottleW - 5, ty + 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Volume Label
  ctx.save();
  ctx.fillStyle = isTarget ? '#FFFFFF' : C.muted;
  ctx.font = isTarget ? '900 12px Inter' : '700 10px Inter';
  ctx.textAlign = 'center';
  ctx.shadowBlur = isTarget ? 10 : 0;
  ctx.shadowColor = isTarget ? '#00FF88' : 'transparent';
  ctx.fillText(`${Math.round(b.current * 10) / 10}/${b.capacity}L`, x + bottleW / 2, ty + bh + 24);
  ctx.restore();

  ctx.restore();
}

/**
 * Draws the target amount line with glowing effect.
 * @param {Object} L - Layout object.
 * @param {number} ts - Timestamp for animation.
 */
function drawTargetLine(L, ts) {
  const { W, bottomY } = L;
  if (targetAmt <= 0) return;
  const unclampedY = bottomY - targetAmt * L.pxPerL;
  const lineYMin = L.topSafeY + 18;
  const lineYMax = bottomY - 14;
  const y = clamp(unclampedY, lineYMin, lineYMax);

  const time = ts * 0.002;
  const pulse = 0.5 + 0.5 * Math.sin(time);

  ctx.save();
  // Line Glow
  ctx.shadowBlur = 10 + pulse * 10;
  ctx.shadowColor = C.targetLine;
  ctx.strokeStyle = C.targetLine;
  ctx.lineWidth = 2;

  // Static dashed line
  ctx.setLineDash([15, 10]);

  ctx.beginPath();
  ctx.moveTo(24, y);
  ctx.lineTo(W - 24, y);
  ctx.stroke();

  // Side glow markers
  ctx.setLineDash([]);
  ctx.fillStyle = C.targetLine;
  ctx.beginPath();
  ctx.arc(24, y, 3, 0, Math.PI * 2);
  ctx.arc(W - 24, y, 3, 0, Math.PI * 2);
  ctx.fill();

  // Label with clamped position and contrast background
  const label = `TARGET ${targetAmt}L`;
  ctx.font = '900 11px Inter';
  const labelW = Math.ceil(ctx.measureText(label).width) + 14;
  const labelH = 20;
  const labelX = clamp(W - 28 - labelW, 8, W - labelW - 8);
  const proposedLabelTop = y - (labelH + 8);
  const labelY = clamp(proposedLabelTop, L.topSafeY + 6, L.bottomSafeY - labelH - 6);

  roundRect(labelX, labelY, labelW, labelH, 10);
  ctx.fillStyle = 'rgba(11, 15, 26, 0.82)';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 81, 47, 0.45)';
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 8;
  ctx.fillText(label, labelX + 7, labelY + labelH / 2);
  ctx.restore();
}

function drawBlockedFeedback(ts) {
  for (let i = blockedFeedback.length - 1; i >= 0; i--) {
    const fx = blockedFeedback[i];
    const t = (ts - fx.start) / BLOCKED_FEEDBACK_MS;
    if (t >= 1) {
      blockedFeedback.splice(i, 1);
      continue;
    }

    const alpha = (1 - t) * (1 - t);
    const rise = t * 24;
    const radius = 10 + t * 10;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(fx.x, fx.y - rise);

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 120, 120, 0.75)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '700 11px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(fx.label, 0, -12);
    ctx.restore();
  }
}

/**
 * Executes a pour move from one bottle to another.
 * Handles validation, instant state update, micro-feedback trigger, and history push.
 * @param {number} fromI - Source bottle index.
 * @param {number} toI - Destination bottle index.
 * @returns {boolean} True if pour was valid and applied.
 */
function pour(fromI, toI) {
  const from = bottles[fromI], to = bottles[toI];
  if (from.current === 0 || to.current === to.capacity) {
    const blockedIdx = from.current === 0 ? fromI : toI;
    shakeAnim = { idx: blockedIdx, start: performance.now() };
    queueBlockedBottleFeedback(blockedIdx, from.current === 0 ? 'Empty' : 'Full');
    Audio.play('error');
    safeVibrate([30, 30, 30]);
    
    // Enhanced feedback
    if (window.FeedbackSystem) {
      window.FeedbackSystem.pourError(from.current === 0 ? 'empty' : 'full');
    }
    window.dispatchEvent(new CustomEvent('tutorialNudge', {
      detail: { reason: 'invalid_move' }
    }));
    return false;
  }
  const val = Math.min(from.current, to.capacity - to.current);
  history.push({ bottles: JSON.parse(JSON.stringify(bottles)), moves });
  from.current -= val; to.current += val; moves++;
  dispAmts[fromI] = from.current;
  dispAmts[toI] = to.current;
  clearActiveHint();
  queueTransferFeedback(fromI, toI, from.colorIdx);
  bottlePhysics[fromI].squash = Math.min(bottlePhysics[fromI].squash, 0.9);
  bottlePhysics[toI].squash = Math.min(bottlePhysics[toI].squash, 0.88);
  Audio.play('pour');
  safeVibrate(15);
  
  // Enhanced feedback
  if (window.FeedbackSystem) {
    window.FeedbackSystem.pourSuccess(fromI, toI);
  }
  
  // Dispatch game state update for progress system
  dispatchGameStateUpdate();
  const EPS = 0.01;
  if (!won && bottles.some(b => Math.abs(b.current - LEVELS[lvlIdx].target) < EPS)) {
    won = true;
    Audio.play('win');
    Particles.burst(canvas.width / 2, canvas.height / 2, '#FFD700', 50, true);
    clearWinRevealTimeout();
    winRevealTimeoutId = setTimeout(() => {
      winRevealTimeoutId = null;
      if (won) showWin();
    }, 420);
  }
  updateHUD();
  return true;
}

/**
 * Main game loop.
 * Updates physics, micro-feedback cues, particles, and renders the scene.
 * @param {number} ts - Current timestamp.
 */
function frame(ts) {
  const L = getLayout();

  // Parallax interpolation
  mouseX += (targetMouseX - mouseX) * 0.08;
  mouseY += (targetMouseY - mouseY) * 0.08;

  // Bottle physics (Tilt & Squash)
  bottlePhysics.forEach((p, i) => {
    // Tilt
    p.vel += (0 - p.tilt) * 0.12;
    p.vel *= 0.82;
    p.tilt += p.vel;

    // Squash & Stretch Spring
    const targetSquash = 1;
    const sSpring = 0.15;
    const sFriction = 0.8;
    p.squashVel += (targetSquash - p.squash) * sSpring;
    p.squashVel *= sFriction;
    p.squash += p.squashVel;
  });

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  drawBackground(L, ts);
  cleanupTransferFeedback(ts);
  for (let i = 0; i < bottles.length; i++) drawBottle(i, L, ts);
  drawTransferFeedbackCue(L, ts);
  drawTargetLine(L, ts);
  drawBlockedFeedback(ts);
  Particles.update();
  Particles.draw(ctx);
  requestAnimationFrame(frame);
}

function showWin() {
  refreshEconomyFromStorage();
  winBonusClaimed = false;
  winReturnFocus = document.activeElement;
  const isLast = lvlIdx >= LEVELS.length - 1;
  const basePar = LEVELS[lvlIdx].par;
  const par = getCurrentPar(basePar);
  document.getElementById('win-emoji').textContent = isLast ? '🏆' : '🔥';
  document.getElementById('win-title').textContent = isLast ? 'All Cleared!' : 'Brilliant!';

  const starCount = calculateStarCount(moves, basePar);
  const rewardBonus = getDifficultyRewardBonus();
  const awardedStars = starCount + rewardBonus;
  const modeLabel = currentDifficultyMode.toUpperCase();
  const durationSec = Math.max(0, (performance.now() - entryStartTime) / 1000);
  const isPerfect = starCount === 3;
  winCard.classList.toggle('perfect', isPerfect);

  document.getElementById('win-sub').innerHTML = `
    <div class="win-level-line">Level ${lvlIdx + 1} Cleared</div>
    <div class="win-moves-line">${moves} MOVES</div>
    <div class="win-par-line">Target Par: ${par}</div>
    ${rewardBonus > 0 ? `<div class="win-perfect-line">+${rewardBonus} bonus ⭐ (${modeLabel})</div>` : ''}
    ${isPerfect ? '<div class="win-perfect-line">PERFECT CLEAR!</div>' : ''}
  `;

  if (window.MonetizationSystem && typeof window.MonetizationSystem.grantRewards === 'function') {
    window.MonetizationSystem.grantRewards({ stars: awardedStars }, {
      source: 'level_complete',
      levelIndex: lvlIdx,
      difficulty: currentDifficultyMode
    });
    totalStars = window.MonetizationSystem.getStarBalance();
  } else {
    totalStars += awardedStars;
    localStorage.setItem('water_puzzle_stars', String(totalStars));
  }
  updateHUD();
  
  // Enhanced feedback
  if (window.FeedbackSystem) {
    window.FeedbackSystem.levelComplete(starCount, moves, par);
  }

  window.dispatchEvent(new CustomEvent('levelComplete', {
    detail: {
      levelIndex: lvlIdx,
      stars: starCount,
      awardedStars,
      bonusStars: rewardBonus,
      moves,
      durationSec,
      par,
      basePar,
      difficulty: currentDifficultyMode,
      usedHint: levelSessionStats.usedHint,
      usedUndo: levelSessionStats.usedUndo
    }
  }));

  if (isDailyRunActive && window.DailyChallengeSystem && typeof window.DailyChallengeSystem.completeDailyChallenge === 'function' && !window.DailyChallengeSystem.completedToday) {
    window.DailyChallengeSystem.completeDailyChallenge(starCount, moves);
    window.dispatchEvent(new CustomEvent('dailyChallengeComplete', {
      detail: {
        stars: starCount,
        moves,
        streak: window.DailyChallengeSystem.streak
      }
    }));
  }
  isDailyRunActive = false;

  const currentLevelStars = parseInt(localStorage.getItem(`level_${lvlIdx}_stars`) || '0', 10);
  localStorage.setItem(`level_${lvlIdx}_stars`, Math.max(starCount, currentLevelStars));

  const currentMax = parseInt(localStorage.getItem('maxUnlockedLevel') || '0', 10);
  if (lvlIdx >= currentMax) {
    localStorage.setItem('maxUnlockedLevel', lvlIdx + 1);
  }

  const starEl = document.getElementById('win-stars');
  starEl.innerHTML = '';
  starEl.classList.add('win-stars-grid');

  for (let i = 0; i < 3; i++) {
    const s = document.createElement('div');
    s.className = 'win-star';
    s.textContent = '⭐';
    starEl.appendChild(s);

    setTimeout(() => {
      if (i < starCount) {
        s.classList.add('earned');
        Audio.play('tap');
        setTimeout(() => {
          s.classList.add('pop');
          setTimeout(() => s.classList.remove('pop'), 150);
        }, 300);
      } else {
        s.classList.add('muted');
      }
    }, 500 + i * 350);
  }

  if (isPerfect) {
    for (let i = 0; i < 100; i++) Particles.spawnConfetti(canvas.width / 2, canvas.height / 2);
    safeVibrate([50, 50, 50]);
    Audio.play('win');
  } else {
    Particles.burst(canvas.width / 2, canvas.height / 2, '#FFD700', 40);
  }

  winNextBtn.textContent = isLast ? 'Restart Pack' : 'Next Level →';
  if (window.MonetizationSystem && typeof window.MonetizationSystem.shouldShowInterstitial === 'function') {
    window.MonetizationSystem.shouldShowInterstitial('level_complete');
  }
  renderMonetizationOfferStates();
  setOverlayOpenState(winOverlay, true);
  requestAnimationFrame(() => winNextBtn.focus());
}

function hideWin() {
  const wasOpen = winOverlay.classList.contains('active');
  setOverlayOpenState(winOverlay, false);
  if (wasOpen) restoreFocus(winReturnFocus, menuBtn);
  winReturnFocus = null;
}

function onTap(cx, cy) {
  Audio.init();
  if (isAnimating || won) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const sx = (cx - rect.left) * (canvas.width / rect.width);
      const sy = (cy - rect.top) * (canvas.height / rect.height);
      queueBlockedFeedback(sx, sy, won ? 'Solved' : 'Wait');
    }
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const sx = (cx - rect.left) * (canvas.width / rect.width), sy = (cy - rect.top) * (canvas.height / rect.height);
  const L = getLayout();
  let hit = -1;
  L.xs.forEach((x, i) => {
    const bh = bottles[i].capacity * L.pxPerL;
    if (sx >= x - 10 && sx <= x + L.bottleW + 10 && sy >= L.bottomY - bh - 40 && sy <= L.bottomY + 40) hit = i;
  });
  if (hit === -1) { selIdx = null; return; }
  safeVibrate(8);
  Audio.play('tap');
  if (selIdx === null) {
    if (bottles[hit].current > 0) {
      selIdx = hit; lastSelTime = performance.now();
      bottlePhysics[hit].squash = 0.8; // Initial squash on select
    } else {
      queueBlockedBottleFeedback(hit, 'Empty');
      Audio.play('error');
      window.dispatchEvent(new CustomEvent('tutorialNudge', {
        detail: { reason: 'empty_bottle' }
      }));
    }
  }
  else if (selIdx === hit) selIdx = null;
  else {
    if (pour(selIdx, hit)) {
      selIdx = null;
    } else {
      // pour already handles error feedback
    }
  }
}

let lastSelTime = 0;

canvas.addEventListener('click', e => onTap(e.clientX, e.clientY));
canvas.addEventListener('touchstart', e => { e.preventDefault(); onTap(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });

menuBtn.addEventListener('click', openLevelMenu);
lmClose.addEventListener('click', closeLevelMenu);
lmPrevBtn.addEventListener('click', () => renderLevelPage(currentLevelPage - 1));
lmNextBtn.addEventListener('click', () => renderLevelPage(currentLevelPage + 1));
levelMenuOverlay.addEventListener('click', e => {
  if (e.target === levelMenuOverlay) closeLevelMenu();
});
winOverlay.addEventListener('click', e => {
  if (e.target === winOverlay) hideWin();
});
winCard.addEventListener('click', e => e.stopPropagation());
lmCard.addEventListener('click', e => e.stopPropagation());
if (topMenuToggle && topUtilitiesTray) {
  topMenuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = topUtilitiesTray.classList.contains('open');
    setTopUtilitiesOpen(!open);
  });
  topUtilitiesTray.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', () => {
    if (topUtilitiesTray.classList.contains('open')) setTopUtilitiesOpen(false);
  });
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeTopOverlay();
    return;
  }

  const target = e.target;
  const targetIsInteractive = target instanceof HTMLElement &&
    !!target.closest('button, [role="button"], input, textarea, select, a[href]');

  if (winOverlay.classList.contains('active') && isKeyboardActivateKey(e.key) && !targetIsInteractive) {
    e.preventDefault();
    winNextBtn.click();
  }
});


undoBtn.addEventListener('click', () => {
  if (!history.length || isAnimating || won) return;
  const p = history.pop(); bottles = p.bottles; dispAmts = bottles.map(b => b.current); moves = p.moves;
  clearActiveHint(); updateHUD(); Audio.play('tap');
  levelSessionStats.usedUndo = true;
  window.dispatchEvent(new CustomEvent('undoUsed'));
  
  // Enhanced feedback
  if (window.FeedbackSystem) {
    window.FeedbackSystem.undoPerformed();
  }
  
  // Dispatch game state update
  dispatchGameStateUpdate();
});

restartBtn.addEventListener('click', async () => {
  if (moves > 0 && window.DialogSystem) {
    const confirmed = await window.DialogSystem.confirmRestart();
    if (!confirmed && window.MonetizationSystem) {
      const offerRetryAssist = await window.DialogSystem.confirm({
        title: 'Need a Retry Assist?',
        message: 'Watch a rewarded ad to get +1 hint and rewind your run.',
        icon: '🎁',
        confirmText: 'Watch Ad',
        cancelText: 'Cancel'
      });
      if (offerRetryAssist) {
        const reward = await window.MonetizationSystem.runRewardedOffer('retry_assist', {
          placement: 'restart_dialog'
        });
        if (reward.status === 'completed') {
          performRetryAssist();
          renderMonetizationOfferStates();
          Audio.play('tap');
        }
      }
      return;
    }
    if (!confirmed) return;
  }
  
  initLevel(lvlIdx);
  Audio.play('tap');
  
  // Enhanced feedback
  if (window.FeedbackSystem) {
    window.FeedbackSystem.levelRestarted();
  }
});
hintBtn.addEventListener('click', () => {
  if (won || isAnimating) return;
  if (window.DifficultySystem && typeof window.DifficultySystem.canUseHint === 'function' && !window.DifficultySystem.canUseHint()) {
    queueBlockedButtonFeedback(hintBtn, 'Mode lock');
    Audio.play('error');
    return;
  }
  const level = LEVELS[lvlIdx];
  if (!level || typeof level.target !== 'number') return;

  let bestMove = null;
  try {
    bestMove = GameSolver.solve(bottles, level.target);
  } catch (err) {
    bestMove = null;
  }

  const isValidBestMove =
    bestMove &&
    Number.isInteger(bestMove.from) &&
    Number.isInteger(bestMove.to) &&
    bestMove.from >= 0 &&
    bestMove.to >= 0 &&
    bestMove.from < bottles.length &&
    bestMove.to < bottles.length &&
    bestMove.from !== bestMove.to;

  if (isValidBestMove && setActiveHint(bestMove)) {
    consumeHintForHintAction();
    levelSessionStats.usedHint = true;
    window.dispatchEvent(new CustomEvent('hintUsed', { detail: { remaining: hintCount } }));
    updateHUD();
    Audio.play('tap');
    
    // Enhanced feedback
    if (window.FeedbackSystem) {
      window.FeedbackSystem.hintUsed(hintCount);
    }
  } else {
    // No solution found
    Audio.play('error');
    queueBlockedButtonFeedback(hintBtn, 'No move');
    document.getElementById('hint-count').textContent = 'STUCK?';
    hudHints.textContent = 'STUCK?';
    hintBtn.classList.add('is-warning');
    
    // Enhanced feedback
    if (window.FeedbackSystem) {
      window.FeedbackSystem.warning('No hint available');
    }
    
    setTimeout(() => {
      hintBtn.classList.remove('is-warning');
      updateHUD();
    }, 2000);
  }
});
winNextBtn.addEventListener('click', () => initLevel(lvlIdx + 1));
soundBtn.addEventListener('click', () => {
  Audio.enabled = !Audio.enabled;
  localStorage.setItem('water_puzzle_sound', Audio.enabled);
  updateHUD();
});

window.addEventListener('resize', () => {
  const r = document.getElementById('game-root'), b = document.getElementById('bottom-banner');
  canvas.width = r.clientWidth; canvas.height = r.clientHeight - b.offsetHeight;
});

window.addEventListener('difficultyChange', (e) => {
  const mode = e?.detail?.mode;
  currentDifficultyMode = normalizeDifficultyMode(mode);
  updateHUD();
  dispatchGameStateUpdate();
  window.dispatchEvent(new CustomEvent('levelLoaded', {
    detail: {
      level: LEVELS[lvlIdx],
      levelIndex: lvlIdx,
      par: getCurrentPar(LEVELS[lvlIdx].par),
      target: targetAmt,
      bottles,
      difficulty: currentDifficultyMode
    }
  }));
});

window.addEventListener('dailyChallengeStart', (e) => {
  const dailyLevel = e?.detail?.level;
  isDailyRunActive = Number.isInteger(dailyLevel) && dailyLevel === lvlIdx;
  levelSessionStats = { usedHint: false, usedUndo: false };
});

window.addEventListener('themeChange', (e) => {
  const themeName = e?.detail?.theme || 'dark';
  applyCanvasTheme(themeName, e?.detail?.colors || {});
});

window.addEventListener('monetizationEvent', () => {
  refreshEconomyFromStorage();
  updateHUD();
});

document.addEventListener('DOMContentLoaded', () => {
  if (window.ThemeSystem && typeof window.ThemeSystem.getTheme === 'function' && typeof window.ThemeSystem.getThemeColors === 'function') {
    applyCanvasTheme(window.ThemeSystem.getTheme(), window.ThemeSystem.getThemeColors() || {});
  } else {
    const initialTheme = document.body.classList.contains('theme-light') ? 'light' : 'dark';
    applyCanvasTheme(initialTheme, {});
  }
  setupMonetizationEntryPoints();
  refreshEconomyFromStorage();
  window.dispatchEvent(new Event('resize')); initLevel(lvlIdx); requestAnimationFrame(frame);
});
