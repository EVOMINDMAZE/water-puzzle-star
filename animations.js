/**
 * @fileoverview Enhanced Animation System for Water Puzzle Star
 * Provides advanced animations, transitions, and visual effects
 */

class AnimationSystem {
  constructor() {
    this.animations = new Map();
    this.isRunning = false;
    this.lastTime = 0;
    
    this.init();
  }

  init() {
    this.addAnimationStyles();
    this.startAnimationLoop();
  }

  addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Advanced Animations */
      
      /* Liquid Wave Animation */
      @keyframes liquidWave {
        0%, 100% {
          transform: translateX(0) scaleY(1);
        }
        25% {
          transform: translateX(-5px) scaleY(1.02);
        }
        50% {
          transform: translateX(0) scaleY(0.98);
        }
        75% {
          transform: translateX(5px) scaleY(1.02);
        }
      }
      
      /* Glow Pulse */
      @keyframes glowPulse {
        0%, 100% {
          box-shadow: 0 0 20px rgba(0, 210, 255, 0.3);
        }
        50% {
          box-shadow: 0 0 40px rgba(0, 210, 255, 0.6);
        }
      }
      
      /* Float Animation */
      @keyframes float {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
      }
      
      /* Shake Animation */
      @keyframes shake {
        0%, 100% {
          transform: translateX(0);
        }
        10%, 30%, 50%, 70%, 90% {
          transform: translateX(-5px);
        }
        20%, 40%, 60%, 80% {
          transform: translateX(5px);
        }
      }
      
      /* Pop Animation */
      @keyframes pop {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        50% {
          transform: scale(1.2);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      /* Slide In Animations */
      @keyframes slideInLeft {
        from {
          transform: translateX(-100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideInUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes slideInDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      /* Zoom Animations */
      @keyframes zoomIn {
        from {
          transform: scale(0.5);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      @keyframes zoomOut {
        from {
          transform: scale(1);
          opacity: 1;
        }
        to {
          transform: scale(0.5);
          opacity: 0;
        }
      }
      
      /* Rotate Animations */
      @keyframes rotateIn {
        from {
          transform: rotate(-180deg);
          opacity: 0;
        }
        to {
          transform: rotate(0);
          opacity: 1;
        }
      }
      
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      
      /* Bounce Animation */
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-20px);
        }
        60% {
          transform: translateY(-10px);
        }
      }
      
      /* Pulse Animation */
      @keyframes pulse {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1);
        }
      }
      
      /* Heartbeat Animation */
      @keyframes heartbeat {
        0% {
          transform: scale(1);
        }
        14% {
          transform: scale(1.3);
        }
        28% {
          transform: scale(1);
        }
        42% {
          transform: scale(1.3);
        }
        70% {
          transform: scale(1);
        }
      }
      
      /* Wiggle Animation */
      @keyframes wiggle {
        0%, 100% {
          transform: rotate(0deg);
        }
        25% {
          transform: rotate(-5deg);
        }
        75% {
          transform: rotate(5deg);
        }
      }
      
      /* Flash Animation */
      @keyframes flash {
        0%, 50%, 100% {
          opacity: 1;
        }
        25%, 75% {
          opacity: 0;
        }
      }
      
      /* Tada Animation */
      @keyframes tada {
        0% {
          transform: scale(1);
        }
        10%, 20% {
          transform: scale(0.9) rotate(-3deg);
        }
        30%, 50%, 70%, 90% {
          transform: scale(1.1) rotate(3deg);
        }
        40%, 60%, 80% {
          transform: scale(1.1) rotate(-3deg);
        }
        100% {
          transform: scale(1) rotate(0);
        }
      }
      
      /* Jello Animation */
      @keyframes jello {
        11.1% {
          transform: none;
        }
        22.2% {
          transform: skewX(-12.5deg) skewY(-12.5deg);
        }
        33.3% {
          transform: skewX(6.25deg) skewY(6.25deg);
        }
        44.4% {
          transform: skewX(-3.125deg) skewY(-3.125deg);
        }
        55.5% {
          transform: skewX(1.5625deg) skewY(1.5625deg);
        }
        66.6% {
          transform: skewX(-0.78125deg) skewY(-0.78125deg);
        }
        77.7% {
          transform: skewX(0.390625deg) skewY(0.390625deg);
        }
        88.8% {
          transform: skewX(-0.1953125deg) skewY(-0.1953125deg);
        }
        100% {
          transform: none;
        }
      }
      
      /* Animation Classes */
      .animate-float {
        animation: float 3s ease-in-out infinite;
      }
      
      .animate-pulse-glow {
        animation: glowPulse 2s ease-in-out infinite;
      }
      
      .animate-shake {
        animation: shake 0.5s ease-in-out;
      }
      
      .animate-pop {
        animation: pop 0.3s ease-out;
      }
      
      .animate-bounce {
        animation: bounce 1s ease-in-out;
      }
      
      .animate-wiggle {
        animation: wiggle 0.5s ease-in-out;
      }
      
      .animate-heartbeat {
        animation: heartbeat 1.5s ease-in-out;
      }
      
      .animate-tada {
        animation: tada 1s ease-in-out;
      }
      
      .animate-jello {
        animation: jello 1s ease-in-out;
      }
      
      /* Entrance Animations */
      .animate-slide-in-left {
        animation: slideInLeft 0.4s ease-out;
      }
      
      .animate-slide-in-right {
        animation: slideInRight 0.4s ease-out;
      }
      
      .animate-slide-in-up {
        animation: slideInUp 0.4s ease-out;
      }
      
      .animate-slide-in-down {
        animation: slideInDown 0.4s ease-out;
      }
      
      .animate-zoom-in {
        animation: zoomIn 0.3s ease-out;
      }
      
      .animate-rotate-in {
        animation: rotateIn 0.4s ease-out;
      }
      
      /* Exit Animations */
      .animate-zoom-out {
        animation: zoomOut 0.3s ease-in forwards;
      }
      
      /* Stagger Animation Support */
      .stagger-animation {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .stagger-animation.visible {
        opacity: 1;
        transform: translateY(0);
      }
      
      /* Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  startAnimationLoop() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  loop() {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Update all active animations
    this.animations.forEach((animation, id) => {
      if (animation.active) {
        animation.update(deltaTime);
      }
    });
    
    requestAnimationFrame(() => this.loop());
  }

  // Create custom animation
  createAnimation(id, options) {
    const animation = {
      id,
      active: true,
      duration: options.duration || 1000,
      easing: options.easing || 'ease-out',
      onStart: options.onStart || null,
      onUpdate: options.onUpdate || null,
      onComplete: options.onComplete || null,
      elapsed: 0,
      progress: 0,
      
      update(deltaTime) {
        if (!this.active) return;
        
        this.elapsed += deltaTime;
        this.progress = Math.min(1, this.elapsed / this.duration);
        
        // Apply easing
        const easedProgress = this.applyEasing(this.progress, this.easing);
        
        if (this.onUpdate) {
          this.onUpdate(easedProgress);
        }
        
        if (this.progress >= 1) {
          this.active = false;
          if (this.onComplete) {
            this.onComplete();
          }
        }
      },
      
      applyEasing(t, easing) {
        switch (easing) {
          case 'linear':
            return t;
          case 'ease-in':
            return t * t;
          case 'ease-out':
            return t * (2 - t);
          case 'ease-in-out':
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          case 'bounce':
            if (t < 1 / 2.75) {
              return 7.5625 * t * t;
            } else if (t < 2 / 2.75) {
              return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
            } else if (t < 2.5 / 2.75) {
              return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
            } else {
              return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
            }
          case 'elastic':
            return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
          default:
            return t;
        }
      },
      
      stop() {
        this.active = false;
      },
      
      reset() {
        this.active = true;
        this.elapsed = 0;
        this.progress = 0;
      }
    };
    
    this.animations.set(id, animation);
    
    if (animation.onStart) {
      animation.onStart();
    }
    
    return animation;
  }

  // Animate element
  animateElement(element, properties, duration = 300, easing = 'ease-out') {
    const id = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startValues = {};
    const endValues = {};
    
    // Get start values
    Object.keys(properties).forEach(prop => {
      startValues[prop] = parseFloat(getComputedStyle(element)[prop]) || 0;
      endValues[prop] = properties[prop];
    });
    
    return this.createAnimation(id, {
      duration,
      easing,
      onUpdate: (progress) => {
        Object.keys(properties).forEach(prop => {
          const start = startValues[prop];
          const end = endValues[prop];
          const current = start + (end - start) * progress;
          element.style[prop] = current + (prop === 'opacity' ? '' : 'px');
        });
      },
      onComplete: () => {
        this.animations.delete(id);
      }
    });
  }

  // Convenience methods
  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    return this.animateElement(element, { opacity: 1 }, duration);
  }

  fadeOut(element, duration = 300) {
    const animation = this.animateElement(element, { opacity: 0 }, duration);
    
    animation.onComplete = () => {
      element.style.display = 'none';
    };
    
    return animation;
  }

  slideIn(element, direction = 'up', duration = 400) {
    const transforms = {
      up: { transform: 0 },
      down: { transform: 0 },
      left: { transform: 0 },
      right: { transform: 0 }
    };
    
    element.classList.add(`animate-slide-in-${direction}`);
    
    setTimeout(() => {
      element.classList.remove(`animate-slide-in-${direction}`);
    }, duration);
  }

  bounce(element) {
    element.classList.add('animate-bounce');
    
    setTimeout(() => {
      element.classList.remove('animate-bounce');
    }, 1000);
  }

  shake(element) {
    element.classList.add('animate-shake');
    
    setTimeout(() => {
      element.classList.remove('animate-shake');
    }, 500);
  }

  pop(element) {
    element.classList.add('animate-pop');
    
    setTimeout(() => {
      element.classList.remove('animate-pop');
    }, 300);
  }

  // Stagger animation for multiple elements
  staggerElements(elements, delay = 100) {
    elements.forEach((el, index) => {
      el.classList.add('stagger-animation');
      
      setTimeout(() => {
        el.classList.add('visible');
      }, index * delay);
    });
  }

  stopAnimation(id) {
    const animation = this.animations.get(id);
    if (animation) {
      animation.stop();
      this.animations.delete(id);
    }
  }

  stopAllAnimations() {
    this.animations.forEach(animation => animation.stop());
    this.animations.clear();
  }
}

// Create global instance
window.AnimationSystem = new AnimationSystem();