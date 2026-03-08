/**
 * @fileoverview Responsive Design System for Water Puzzle Star
 * Handles adaptive layouts for mobile, tablet, and desktop
 */

class ResponsiveSystem {
  constructor() {
    this.currentBreakpoint = 'mobile';
    this.breakpoints = {
      mobile: { max: 767 },
      tablet: { min: 768, max: 1023 },
      desktop: { min: 1024 }
    };
    
    this.init();
  }

  init() {
    this.detectBreakpoint();
    this.setupResizeListener();
    this.applyResponsiveClasses();
  }

  detectBreakpoint() {
    const width = window.innerWidth;
    
    if (width <= this.breakpoints.mobile.max) {
      this.currentBreakpoint = 'mobile';
    } else if (width >= this.breakpoints.tablet.min && width <= this.breakpoints.tablet.max) {
      this.currentBreakpoint = 'tablet';
    } else {
      this.currentBreakpoint = 'desktop';
    }
    
    return this.currentBreakpoint;
  }

  setupResizeListener() {
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const oldBreakpoint = this.currentBreakpoint;
        this.detectBreakpoint();
        
        if (oldBreakpoint !== this.currentBreakpoint) {
          this.onBreakpointChange(oldBreakpoint, this.currentBreakpoint);
        }
        
        this.applyResponsiveClasses();
      }, 150);
    });
  }

  onBreakpointChange(oldBreakpoint, newBreakpoint) {
    // Dispatch event for other systems
    window.dispatchEvent(new CustomEvent('breakpointChange', {
      detail: {
        old: oldBreakpoint,
        new: newBreakpoint
      }
    }));
    
    console.log(`Breakpoint changed: ${oldBreakpoint} → ${newBreakpoint}`);
  }

  applyResponsiveClasses() {
    const root = document.documentElement;
    
    // Remove all breakpoint classes
    root.classList.remove('bp-mobile', 'bp-tablet', 'bp-desktop');
    
    // Add current breakpoint class
    root.classList.add(`bp-${this.currentBreakpoint}`);
    
    // Apply specific adjustments
    this.adjustHUD();
    this.adjustBottomBanner();
    this.adjustGameCanvas();
  }

  adjustHUD() {
    const topHud = document.getElementById('top-hud');
    if (!topHud) return;

    const shouldCompact = this.currentBreakpoint === 'mobile' || this.currentBreakpoint === 'tablet';
    const shouldUltraCompact = window.innerWidth < 900;

    topHud.classList.toggle('compact', shouldCompact);
    topHud.classList.toggle('ultra-compact', shouldUltraCompact);
  }

  adjustBottomBanner() {
    const banner = document.getElementById('bottom-banner');
    if (!banner) return;

    const shouldCompact = this.currentBreakpoint === 'mobile' || this.currentBreakpoint === 'tablet';
    banner.classList.toggle('compact', shouldCompact);
  }

  adjustGameCanvas() {
    const canvas = document.getElementById('gameCanvas');
    const gameRoot = document.getElementById('game-root');
    
    if (!canvas || !gameRoot) return;
    
    // Canvas sizing is handled by existing resize logic
    // This is just for additional responsive adjustments
  }

  isMobile() {
    return this.currentBreakpoint === 'mobile';
  }

  isTablet() {
    return this.currentBreakpoint === 'tablet';
  }

  isDesktop() {
    return this.currentBreakpoint === 'desktop';
  }

  getBreakpoint() {
    return this.currentBreakpoint;
  }
}

// Create global instance
window.ResponsiveSystem = new ResponsiveSystem();
