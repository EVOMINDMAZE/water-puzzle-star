/**
 * @fileoverview Advanced Game Mechanics for Water Puzzle Star
 * Provides multi-liquid system, special bottles, and level editor
 */

class AdvancedMechanicsSystem {
  constructor() {
    this.liquidTypes = this.defineLiquidTypes();
    this.specialBottles = this.defineSpecialBottles();
    this.activeSpecials = new Map();
    
    this.init();
  }

  init() {
    this.setupLiquidMixing();
    this.setupSpecialBottleEffects();
  }

  // Liquid Types Definition
  defineLiquidTypes() {
    return {
      water: {
        id: 'water',
        name: 'Water',
        color: '#00D2FF',
        density: 1.0,
        mixable: true,
        effect: null
      },
      oil: {
        id: 'oil',
        name: 'Oil',
        color: '#F59E0B',
        density: 0.8,
        mixable: false,
        effect: 'float',
        floatsOn: ['water']
      },
      mercury: {
        id: 'mercury',
        name: 'Mercury',
        color: '#9CA3AF',
        density: 13.5,
        mixable: false,
        effect: 'sink',
        sinksThrough: ['water', 'oil']
      },
      acid: {
        id: 'acid',
        name: 'Acid',
        color: '#10B981',
        density: 1.2,
        mixable: true,
        effect: 'dissolve',
        dissolves: ['oil']
      },
      magic: {
        id: 'magic',
        name: 'Magic',
        color: '#8B5CF6',
        density: 1.0,
        mixable: true,
        effect: 'transform',
        transformsTo: 'water'
      },
      lava: {
        id: 'lava',
        name: 'Lava',
        color: '#EF4444',
        density: 2.5,
        mixable: false,
        effect: 'evaporate',
        evaporates: ['water']
      }
    };
  }

  // Special Bottles Definition
  defineSpecialBottles() {
    return {
      overflow: {
        id: 'overflow',
        name: 'Overflow Bottle',
        description: 'Automatically spills excess liquid',
        icon: '💦',
        effect: (bottle, amount) => {
          const excess = bottle.current + amount - bottle.capacity;
          if (excess > 0) {
            // Create spill effect
            this.createSpillEffect(bottle, excess);
            return bottle.capacity;
          }
          return bottle.current + amount;
        }
      },
      locked: {
        id: 'locked',
        name: 'Locked Bottle',
        description: 'Cannot pour from until unlocked',
        icon: '🔒',
        locked: true,
        unlockCondition: (gameState) => {
          // Unlock when specific condition is met
          return gameState.moves >= 3;
        }
      },
      magic: {
        id: 'magic',
        name: 'Magic Bottle',
        description: 'Changes liquid color on pour',
        icon: '✨',
        effect: (liquid) => {
          // Transform liquid type
          const types = Object.keys(this.liquidTypes);
          const randomType = types[Math.floor(Math.random() * types.length)];
          return this.liquidTypes[randomType];
        }
      },
      timer: {
        id: 'timer',
        name: 'Timer Bottle',
        description: 'Must be filled within time limit',
        icon: '⏱️',
        timeLimit: 30,
        effect: (bottle, gameState) => {
          if (!bottle.timerStarted && bottle.current > 0) {
            bottle.timerStarted = Date.now();
            this.startBottleTimer(bottle);
          }
        }
      },
      multiplier: {
        id: 'multiplier',
        name: 'Multiplier Bottle',
        description: 'Doubles the amount poured',
        icon: '✖️',
        multiplier: 2,
        effect: (amount) => {
          return amount * 2;
        }
      },
      filter: {
        id: 'filter',
        name: 'Filter Bottle',
        description: 'Only accepts specific liquid types',
        icon: '🔍',
        allowedTypes: ['water'],
        effect: (liquid) => {
          return this.allowedTypes.includes(liquid.type);
        }
      }
    };
  }

  // Liquid Mixing System
  setupLiquidMixing() {
    this.mixingRules = {
      water_oil: {
        result: 'separate',
        order: ['oil', 'water'], // Oil floats on water
        time: 2 // seconds to separate
      },
      water_acid: {
        result: 'mix',
        newColor: '#059669',
        effect: 'neutralize'
      },
      water_lava: {
        result: 'evaporate',
        evaporates: 'water',
        creates: 'steam'
      },
      oil_acid: {
        result: 'dissolve',
        dissolves: 'oil'
      },
      magic_any: {
        result: 'transform',
        transformsTo: 'water'
      }
    };
  }

  mixLiquids(liquid1, liquid2) {
    const key1 = `${liquid1.type}_${liquid2.type}`;
    const key2 = `${liquid2.type}_${liquid1.type}`;
    
    const rule = this.mixingRules[key1] || this.mixingRules[key2];
    
    if (!rule) {
      // Default: liquids mix
      return {
        result: 'mix',
        color: this.blendColors(liquid1.color, liquid2.color),
        type: liquid1.type
      };
    }
    
    return this.applyMixingRule(rule, liquid1, liquid2);
  }

  applyMixingRule(rule, liquid1, liquid2) {
    switch (rule.result) {
      case 'separate':
        return {
          result: 'separate',
          layers: [
            { type: rule.order[0], amount: liquid1.amount },
            { type: rule.order[1], amount: liquid2.amount }
          ]
        };
      
      case 'mix':
        return {
          result: 'mix',
          color: rule.newColor || this.blendColors(liquid1.color, liquid2.color),
          type: liquid1.type,
          effect: rule.effect
        };
      
      case 'evaporate':
        return {
          result: 'evaporate',
          evaporated: rule.evaporates,
          remaining: liquid1.type === rule.evaporates ? liquid2 : liquid1,
          effect: 'steam'
        };
      
      case 'dissolve':
        return {
          result: 'dissolve',
          dissolved: rule.dissolves,
          remaining: liquid1.type === rule.dissolves ? liquid2 : liquid1
        };
      
      case 'transform':
        return {
          result: 'transform',
          type: rule.transformsTo,
          color: this.liquidTypes[rule.transformsTo].color
        };
      
      default:
        return { result: 'mix', color: liquid1.color, type: liquid1.type };
    }
  }

  blendColors(color1, color2) {
    // Simple color blending
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    
    const blended = {
      r: Math.round((c1.r + c2.r) / 2),
      g: Math.round((c1.g + c2.g) / 2),
      b: Math.round((c1.b + c2.b) / 2)
    };
    
    return this.rgbToHex(blended.r, blended.g, blended.b);
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  // Special Bottle Effects
  setupSpecialBottleEffects() {
    // Register special bottle effects
  }

  applySpecialEffect(bottle, type, ...args) {
    const special = this.specialBottles[type];
    if (!special || !special.effect) return null;
    
    return special.effect(bottle, ...args);
  }

  createSpillEffect(bottle, amount) {
    // Create visual spill effect
    if (window.EnhancedParticleSystem) {
      window.EnhancedParticleSystem.liquidSplash(
        bottle.x,
        bottle.y,
        bottle.liquidColor,
        Math.floor(amount * 5)
      );
    }
  }

  startBottleTimer(bottle) {
    const timeLimit = this.specialBottles.timer.timeLimit * 1000;
    
    const checkTimer = () => {
      const elapsed = Date.now() - bottle.timerStarted;
      
      if (elapsed >= timeLimit && bottle.current < bottle.capacity) {
        // Timer expired - fail the level or apply penalty
        this.onTimerExpired(bottle);
      } else if (bottle.current >= bottle.capacity) {
        // Bottle filled in time - success
        bottle.timerStarted = null;
      } else {
        // Continue checking
        requestAnimationFrame(checkTimer);
      }
    };
    
    requestAnimationFrame(checkTimer);
  }

  onTimerExpired(bottle) {
    // Dispatch event for game to handle
    window.dispatchEvent(new CustomEvent('bottleTimerExpired', {
      detail: { bottle }
    }));
    
    if (window.FeedbackSystem) {
      window.FeedbackSystem.error('Timer expired!');
    }
  }

  // Level Editor
  createLevelEditor() {
    return new LevelEditor(this);
  }
}

// Level Editor Class
class LevelEditor {
  constructor(mechanicsSystem) {
    this.mechanics = mechanicsSystem;
    this.currentLevel = {
      capacities: [],
      initial: [],
      target: 0,
      par: 0,
      specialBottles: [],
      liquidTypes: []
    };
    
    this.tools = ['add', 'remove', 'edit', 'pour', 'target'];
    this.currentTool = 'add';
    this.selectedBottle = null;
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  addBottle(capacity, initialAmount, liquidType = 'water') {
    this.currentLevel.capacities.push(capacity);
    this.currentLevel.initial.push(initialAmount);
    this.currentLevel.liquidTypes.push(liquidType);
  }

  removeBottle(index) {
    this.currentLevel.capacities.splice(index, 1);
    this.currentLevel.initial.splice(index, 1);
    this.currentLevel.liquidTypes.splice(index, 1);
  }

  setBottleCapacity(index, capacity) {
    this.currentLevel.capacities[index] = capacity;
  }

  setBottleInitial(index, amount) {
    this.currentLevel.initial[index] = Math.min(amount, this.currentLevel.capacities[index]);
  }

  setTarget(target) {
    this.currentLevel.target = target;
  }

  setPar(par) {
    this.currentLevel.par = par;
  }

  addSpecialBottle(index, type) {
    this.currentLevel.specialBottles.push({
      index,
      type,
      ...this.mechanics.specialBottles[type]
    });
  }

  removeSpecialBottle(index) {
    this.currentLevel.specialBottles = this.currentLevel.specialBottles.filter(
      sb => sb.index !== index
    );
  }

  validateLevel() {
    const errors = [];
    
    // Check minimum bottles
    if (this.currentLevel.capacities.length < 2) {
      errors.push('Level must have at least 2 bottles');
    }
    
    // Check target is achievable
    const totalLiquid = this.currentLevel.initial.reduce((a, b) => a + b, 0);
    if (this.currentLevel.target > totalLiquid) {
      errors.push('Target cannot exceed total liquid available');
    }
    
    // Check if level is solvable
    if (!this.isSolvable()) {
      errors.push('Level may not be solvable');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  isSolvable() {
    // Use BFS solver to check if level is solvable
    if (window.GameSolver) {
      const bottles = this.currentLevel.capacities.map((cap, i) => ({
        capacity: cap,
        current: this.currentLevel.initial[i]
      }));
      
      const solution = window.GameSolver.solve(bottles, this.currentLevel.target);
      return solution !== null;
    }
    return true; // Assume solvable if solver not available
  }

  calculatePar() {
    // Use BFS solver to find optimal solution length
    if (window.GameSolver) {
      const bottles = this.currentLevel.capacities.map((cap, i) => ({
        capacity: cap,
        current: this.currentLevel.initial[i]
      }));
      
      // This would need to be implemented in the solver
      // For now, return a placeholder
      return Math.ceil(this.currentLevel.capacities.length * 1.5);
    }
    return 5;
  }

  exportLevel() {
    return JSON.stringify(this.currentLevel, null, 2);
  }

  importLevel(json) {
    try {
      const level = JSON.parse(json);
      this.currentLevel = level;
      return true;
    } catch (e) {
      console.error('Failed to import level:', e);
      return false;
    }
  }

  saveLevel(name) {
    const levels = JSON.parse(localStorage.getItem('custom_levels') || '[]');
    levels.push({
      name,
      ...this.currentLevel,
      created: Date.now()
    });
    localStorage.setItem('custom_levels', JSON.stringify(levels));
  }

  loadCustomLevels() {
    return JSON.parse(localStorage.getItem('custom_levels') || '[]');
  }

  deleteCustomLevel(index) {
    const levels = this.loadCustomLevels();
    levels.splice(index, 1);
    localStorage.setItem('custom_levels', JSON.stringify(levels));
  }
}

// Create global instance
window.AdvancedMechanicsSystem = new AdvancedMechanicsSystem();