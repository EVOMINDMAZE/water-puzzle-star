/**
 * @fileoverview Theme Management System for Water Puzzle Star
 * Handles dark/light mode, custom themes, and seasonal themes
 */

class ThemeSystem {
  constructor() {
    this.currentTheme = 'dark';
    this.selectedTheme = 'auto';
    this.currentWorldTheme = 'dark';
    this.worldThemes = ['dark', 'sunset', 'forest', 'ocean', 'dark'];
    this.availableThemes = {
      dark: {
        name: 'Dark Mode',
        bgStart: '#0f172a',
        bgEnd: '#1e1b4b',
        text: '#FFFFFF',
        muted: 'rgba(255, 255, 255, 0.5)',
        primary: '#00D2FF',
        secondary: '#3A7BD5',
        accent: '#FF512F',
        glass: 'rgba(255, 255, 255, 0.05)',
        border: 'rgba(255, 255, 255, 0.1)'
      },
      light: {
        name: 'Light Mode',
        bgStart: '#f8fafc',
        bgEnd: '#e2e8f0',
        text: '#1a202c',
        muted: 'rgba(15, 23, 42, 0.72)',
        primary: '#0891b2',
        secondary: '#2563eb',
        accent: '#ea580c',
        glass: 'rgba(0, 0, 0, 0.05)',
        border: 'rgba(0, 0, 0, 0.1)'
      },
      ocean: {
        name: 'Ocean Theme',
        bgStart: '#0c4a6e',
        bgEnd: '#164e63',
        text: '#FFFFFF',
        muted: 'rgba(255, 255, 255, 0.5)',
        primary: '#22d3ee',
        secondary: '#06b6d4',
        accent: '#f97316',
        glass: 'rgba(255, 255, 255, 0.08)',
        border: 'rgba(255, 255, 255, 0.15)'
      },
      forest: {
        name: 'Forest Theme',
        bgStart: '#14532d',
        bgEnd: '#166534',
        text: '#FFFFFF',
        muted: 'rgba(255, 255, 255, 0.5)',
        primary: '#4ade80',
        secondary: '#22c55e',
        accent: '#fbbf24',
        glass: 'rgba(255, 255, 255, 0.08)',
        border: 'rgba(255, 255, 255, 0.15)'
      },
      sunset: {
        name: 'Sunset Theme',
        bgStart: '#7c2d12',
        bgEnd: '#9a3412',
        text: '#FFFFFF',
        muted: 'rgba(255, 255, 255, 0.5)',
        primary: '#fb923c',
        secondary: '#f97316',
        accent: '#fbbf24',
        glass: 'rgba(255, 255, 255, 0.08)',
        border: 'rgba(255, 255, 255, 0.15)'
      }
    };
    
    this.init();
  }

  init() {
    this.loadSavedTheme();
    this.createThemeToggle();
    this.applyTheme(this.selectedTheme, { persistSelection: false, source: 'init' });
  }

  loadSavedTheme() {
    const savedSelection = localStorage.getItem('water_puzzle_theme_selection');
    if (savedSelection === 'auto' || (savedSelection && this.availableThemes[savedSelection])) {
      this.selectedTheme = savedSelection;
      return;
    }

    const legacySaved = localStorage.getItem('water_puzzle_theme');
    if (legacySaved && this.availableThemes[legacySaved]) {
      this.selectedTheme = legacySaved;
      return;
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      this.currentWorldTheme = 'light';
    }
  }

  createThemeToggle() {
    const topHud = document.getElementById('top-hud');
    if (!topHud) return;
    const menuToggle = document.getElementById('top-menu-toggle');
    
    const themeToggle = document.createElement('button');
    themeToggle.className = 'hud-pill theme-toggle';
    themeToggle.innerHTML = `
      <span class="hud-label">Theme</span>
      <span class="hud-value theme-icon">🌙</span>
    `;
    themeToggle.setAttribute('aria-label', 'Toggle theme');
    themeToggle.style.cursor = 'pointer';
    
    themeToggle.addEventListener('click', () => this.cycleTheme());
    if (menuToggle && menuToggle.parentElement === topHud) {
      topHud.insertBefore(themeToggle, menuToggle);
    } else {
      topHud.appendChild(themeToggle);
    }
    
    this.themeToggle = themeToggle;
    this.updateThemeIcon();
  }

  getEffectiveThemeName() {
    if (this.selectedTheme === 'auto') return this.currentWorldTheme;
    return this.selectedTheme;
  }

  applyResolvedTheme(themeName) {
    const theme = this.availableThemes[themeName];
    if (!theme) return;
    
    this.currentTheme = themeName;
    
    // Apply CSS variables
    const root = document.documentElement;
    root.style.setProperty('--bg-start', theme.bgStart);
    root.style.setProperty('--bg-end', theme.bgEnd);
    root.style.setProperty('--text', theme.text);
    root.style.setProperty('--muted', theme.muted);
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--glass-bg', theme.glass);
    root.style.setProperty('--glass-border', theme.border);
    
    // Apply theme class to body
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-ocean', 'theme-forest', 'theme-sunset');
    document.body.classList.add(`theme-${themeName}`);
    
    localStorage.setItem('water_puzzle_theme', themeName);
    
    // Update icon
    this.updateThemeIcon();
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('themeChange', {
      detail: {
        theme: themeName,
        selectedTheme: this.selectedTheme,
        worldTheme: this.currentWorldTheme,
        colors: theme
      }
    }));
  }

  applyTheme(themeName, options = {}) {
    const { persistSelection = true } = options;
    const isAuto = themeName === 'auto';
    const isKnownTheme = Boolean(this.availableThemes[themeName]);
    if (!isAuto && !isKnownTheme) return;

    this.selectedTheme = isAuto ? 'auto' : themeName;
    if (persistSelection) {
      localStorage.setItem('water_puzzle_theme_selection', this.selectedTheme);
    }
    this.applyResolvedTheme(this.getEffectiveThemeName());
  }

  cycleTheme() {
    const themeNames = ['auto', ...Object.keys(this.availableThemes)];
    const currentSelectionIndex = Math.max(0, themeNames.indexOf(this.selectedTheme));
    const nextIndex = (currentSelectionIndex + 1) % themeNames.length;
    const nextTheme = themeNames[nextIndex];
    
    this.applyTheme(nextTheme);
    
    // Show feedback
    if (window.FeedbackSystem) {
      const nextLabel = nextTheme === 'auto' ? 'World Adaptive' : this.availableThemes[nextTheme].name;
      window.FeedbackSystem.info(`Theme: ${nextLabel}`);
    }
  }

  updateThemeIcon() {
    if (!this.themeToggle) return;
    
    const icon = this.themeToggle.querySelector('.theme-icon');
    if (!icon) return;
    
    const icons = {
      auto: '🧭',
      dark: '🌙',
      light: '☀️',
      ocean: '🌊',
      forest: '🌲',
      sunset: '🌅'
    };
    
    icon.textContent = icons[this.selectedTheme] || '🌙';
  }

  getTheme() {
    return this.currentTheme;
  }

  getThemeColors() {
    return this.availableThemes[this.currentTheme];
  }

  setTheme(themeName) {
    if (themeName === 'auto' || this.availableThemes[themeName]) {
      this.applyTheme(themeName);
    }
  }

  applyWorldTheme(worldIndex) {
    const normalized = Number.isInteger(worldIndex) ? worldIndex : 0;
    const index = ((normalized % this.worldThemes.length) + this.worldThemes.length) % this.worldThemes.length;
    this.currentWorldTheme = this.worldThemes[index];
    if (this.selectedTheme === 'auto') {
      this.applyResolvedTheme(this.currentWorldTheme);
    }
  }

  // Seasonal themes
  applySeasonalTheme() {
    const month = new Date().getMonth();
    
    // Winter (December - February)
    if (month >= 11 || month <= 1) {
      // Could add a winter theme
    }
    // Spring (March - May)
    else if (month >= 2 && month <= 4) {
      this.setTheme('forest');
    }
    // Summer (June - August)
    else if (month >= 5 && month <= 7) {
      this.setTheme('ocean');
    }
    // Fall (September - November)
    else {
      this.setTheme('sunset');
    }
  }
}

// Create global instance
window.ThemeSystem = new ThemeSystem();
