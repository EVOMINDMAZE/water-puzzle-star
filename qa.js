/**
 * @fileoverview Quality Assurance System for Water Puzzle Star
 * Provides testing utilities, accessibility audits, and bug tracking
 */

class QualityAssuranceSystem {
  constructor() {
    this.testResults = [];
    this.accessibilityIssues = [];
    this.performanceMetrics = {};
    this.bugReports = [];
    
    this.init();
  }

  init() {
    this.setupErrorTracking();
    this.setupPerformanceTracking();
    this.setupAccessibilityChecks();
  }

  // Error Tracking
  setupErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    });
    
    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: Date.now()
      });
    });
    
    // Console error interceptor
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.logError({
        type: 'console',
        message: args.map(a => String(a)).join(' '),
        timestamp: Date.now()
      });
      originalConsoleError.apply(console, args);
    };
  }

  logError(error) {
    this.bugReports.push(error);
    
    // Store in localStorage
    const stored = JSON.parse(localStorage.getItem('water_puzzle_errors') || '[]');
    stored.push(error);
    
    // Keep only last 50 errors
    if (stored.length > 50) {
      stored.splice(0, stored.length - 50);
    }
    
    localStorage.setItem('water_puzzle_errors', JSON.stringify(stored));
    
    // Send to analytics if available
    if (window.SocialSystem) {
      window.SocialSystem.trackEvent('error', error);
    }
  }

  // Performance Tracking
  setupPerformanceTracking() {
    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        
        if (perfData) {
          this.performanceMetrics = {
            dns: perfData.domainLookupEnd - perfData.domainLookupStart,
            tcp: perfData.connectEnd - perfData.connectStart,
            request: perfData.responseStart - perfData.requestStart,
            response: perfData.responseEnd - perfData.responseStart,
            domProcessing: perfData.domComplete - perfData.domInteractive,
            totalLoad: perfData.loadEventEnd - perfData.fetchStart
          };
          
          // Check for performance issues
          this.checkPerformanceThresholds();
        }
      }, 0);
    });
    
    // Track long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              this.logPerformanceIssue({
                type: 'long-task',
                duration: entry.duration,
                startTime: entry.startTime
              });
            }
          });
        });
        
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // LongTask API not supported
      }
    }
  }

  checkPerformanceThresholds() {
    const thresholds = {
      totalLoad: 3000, // 3 seconds
      domProcessing: 1500 // 1.5 seconds
    };
    
    Object.keys(thresholds).forEach((metric) => {
      if (this.performanceMetrics[metric] > thresholds[metric]) {
        this.logPerformanceIssue({
          type: 'threshold-exceeded',
          metric,
          value: this.performanceMetrics[metric],
          threshold: thresholds[metric]
        });
      }
    });
  }

  logPerformanceIssue(issue) {
    console.warn('Performance issue:', issue);
    
    if (window.SocialSystem) {
      window.SocialSystem.trackEvent('performance_issue', issue);
    }
  }

  // Accessibility Checks
  setupAccessibilityChecks() {
    // Run checks after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.runAccessibilityChecks());
    } else {
      this.runAccessibilityChecks();
    }
  }

  runAccessibilityChecks() {
    this.checkImages();
    this.checkButtons();
    this.checkForms();
    this.checkHeadings();
    this.checkContrast();
    this.checkAria();
    this.checkKeyboardNavigation();
    
    // Report issues
    if (this.accessibilityIssues.length > 0) {
      console.warn(`Found ${this.accessibilityIssues.length} accessibility issues:`, this.accessibilityIssues);
    }
  }

  checkImages() {
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.alt) {
        this.accessibilityIssues.push({
          type: 'image-missing-alt',
          element: img,
          index,
          message: 'Image missing alt attribute'
        });
      }
    });
  }

  checkButtons() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach((button, index) => {
      const hasText = button.textContent.trim().length > 0;
      const hasAriaLabel = button.hasAttribute('aria-label');
      const hasAriaLabelledBy = button.hasAttribute('aria-labelledby');
      
      if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
        this.accessibilityIssues.push({
          type: 'button-missing-label',
          element: button,
          index,
          message: 'Button missing accessible name'
        });
      }
    });
  }

  checkForms() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach((input, index) => {
      const hasLabel = input.labels && input.labels.length > 0;
      const hasAriaLabel = input.hasAttribute('aria-label');
      const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');
      
      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        this.accessibilityIssues.push({
          type: 'input-missing-label',
          element: input,
          index,
          message: 'Form input missing label'
        });
      }
    });
  }

  checkHeadings() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (level - lastLevel > 1 && lastLevel !== 0) {
        this.accessibilityIssues.push({
          type: 'heading-skipped',
          element: heading,
          index,
          message: `Heading level skipped from h${lastLevel} to h${level}`
        });
      }
      
      lastLevel = level;
    });
  }

  checkContrast() {
    // Simplified contrast check
    const textElements = document.querySelectorAll('p, span, a, button, label');
    
    textElements.forEach((element, index) => {
      const style = window.getComputedStyle(element);
      const color = style.color;
      const bgColor = style.backgroundColor;
      
      // This is a simplified check - real implementation would calculate actual contrast ratio
      if (color === bgColor) {
        this.accessibilityIssues.push({
          type: 'contrast-issue',
          element,
          index,
          message: 'Text color matches background color'
        });
      }
    });
  }

  checkAria() {
    // Check for invalid ARIA attributes
    const elementsWithAria = document.querySelectorAll('[aria-]');
    
    elementsWithAria.forEach((element, index) => {
      const ariaAttrs = Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('aria-'));
      
      ariaAttrs.forEach(attr => {
        // Check if ARIA attribute value is valid
        if (attr.value === '' && !['aria-label', 'aria-labelledby', 'aria-describedby'].includes(attr.name)) {
          this.accessibilityIssues.push({
            type: 'invalid-aria',
            element,
            index,
            message: `Empty ARIA attribute: ${attr.name}`
          });
        }
      });
    });
  }

  checkKeyboardNavigation() {
    // Check for elements that should be focusable but aren't
    const clickableElements = document.querySelectorAll('[onclick]');
    
    clickableElements.forEach((element, index) => {
      const isFocusable = element.tabIndex >= 0 || 
        ['button', 'a', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase());
      
      if (!isFocusable) {
        this.accessibilityIssues.push({
          type: 'keyboard-navigation',
          element,
          index,
          message: 'Clickable element is not keyboard accessible'
        });
      }
    });
  }

  // Test Utilities
  runTests() {
    console.log('Running automated tests...');
    
    const tests = [
      this.testTutorialSystem(),
      this.testHelpSystem(),
      this.testFeedbackSystem(),
      this.testProgressSystem(),
      this.testDialogSystem(),
      this.testThemeSystem(),
      this.testDifficultySystem(),
      this.testDailyChallengeSystem(),
      this.testAchievementSystem(),
      this.testAnimationSystem(),
      this.testParticleSystem(),
      this.testPerformanceSystem(),
      this.testSocialSystem()
    ];
    
    const results = tests.map(test => {
      try {
        const result = test;
        this.testResults.push(result);
        return result;
      } catch (error) {
        const result = {
          name: test.name || 'Unknown test',
          passed: false,
          error: error.message
        };
        this.testResults.push(result);
        return result;
      }
    });
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log(`Tests complete: ${passed} passed, ${failed} failed`);
    
    return {
      total: results.length,
      passed,
      failed,
      results
    };
  }

  testTutorialSystem() {
    return {
      name: 'Tutorial System',
      passed: !!window.TutorialSystem,
      details: window.TutorialSystem ? 'Tutorial system loaded' : 'Tutorial system not found'
    };
  }

  testHelpSystem() {
    return {
      name: 'Help System',
      passed: !!window.HelpSystem,
      details: window.HelpSystem ? 'Help system loaded' : 'Help system not found'
    };
  }

  testFeedbackSystem() {
    return {
      name: 'Feedback System',
      passed: !!window.FeedbackSystem,
      details: window.FeedbackSystem ? 'Feedback system loaded' : 'Feedback system not found'
    };
  }

  testProgressSystem() {
    return {
      name: 'Progress System',
      passed: !!window.ProgressSystem,
      details: window.ProgressSystem ? 'Progress system loaded' : 'Progress system not found'
    };
  }

  testDialogSystem() {
    return {
      name: 'Dialog System',
      passed: !!window.DialogSystem,
      details: window.DialogSystem ? 'Dialog system loaded' : 'Dialog system not found'
    };
  }

  testThemeSystem() {
    return {
      name: 'Theme System',
      passed: !!window.ThemeSystem,
      details: window.ThemeSystem ? 'Theme system loaded' : 'Theme system not found'
    };
  }

  testDifficultySystem() {
    return {
      name: 'Difficulty System',
      passed: !!window.DifficultySystem,
      details: window.DifficultySystem ? 'Difficulty system loaded' : 'Difficulty system not found'
    };
  }

  testDailyChallengeSystem() {
    return {
      name: 'Daily Challenge System',
      passed: !!window.DailyChallengeSystem,
      details: window.DailyChallengeSystem ? 'Daily challenge system loaded' : 'Daily challenge system not found'
    };
  }

  testAchievementSystem() {
    return {
      name: 'Achievement System',
      passed: !!window.AchievementSystem,
      details: window.AchievementSystem ? 'Achievement system loaded' : 'Achievement system not found'
    };
  }

  testAnimationSystem() {
    return {
      name: 'Animation System',
      passed: !!window.AnimationSystem,
      details: window.AnimationSystem ? 'Animation system loaded' : 'Animation system not found'
    };
  }

  testParticleSystem() {
    return {
      name: 'Particle System',
      passed: !!window.EnhancedParticleSystem,
      details: window.EnhancedParticleSystem ? 'Particle system loaded' : 'Particle system not found'
    };
  }

  testPerformanceSystem() {
    return {
      name: 'Performance System',
      passed: !!window.PerformanceSystem,
      details: window.PerformanceSystem ? 'Performance system loaded' : 'Performance system not found'
    };
  }

  testSocialSystem() {
    return {
      name: 'Social System',
      passed: !!window.SocialSystem,
      details: window.SocialSystem ? 'Social system loaded' : 'Social system not found'
    };
  }

  // Bug Reporting
  reportBug(description, steps, expected, actual) {
    const bug = {
      id: 'bug_' + Date.now(),
      description,
      steps,
      expected,
      actual,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
      state: this.captureState()
    };
    
    this.bugReports.push(bug);
    
    // Store locally
    const stored = JSON.parse(localStorage.getItem('water_puzzle_bugs') || '[]');
    stored.push(bug);
    localStorage.setItem('water_puzzle_bugs', JSON.stringify(stored));
    
    return bug;
  }

  captureState() {
    return {
      level: localStorage.getItem('water_puzzle_lvl'),
      stars: localStorage.getItem('water_puzzle_stars'),
      hints: localStorage.getItem('water_puzzle_hints'),
      theme: localStorage.getItem('water_puzzle_theme'),
      difficulty: localStorage.getItem('water_puzzle_difficulty'),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  // Generate QA Report
  generateReport() {
    return {
      timestamp: Date.now(),
      testResults: this.testResults,
      accessibilityIssues: this.accessibilityIssues,
      performanceMetrics: this.performanceMetrics,
      bugReports: this.bugReports,
      systemInfo: {
        userAgent: navigator.userAgent,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        devicePixelRatio: window.devicePixelRatio,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      }
    };
  }
}

// Create global instance
window.QualityAssuranceSystem = new QualityAssuranceSystem();