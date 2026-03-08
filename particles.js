/**
 * @fileoverview Enhanced Particle System for Water Puzzle Star
 * Provides advanced particle effects for celebrations, interactions, and ambient effects
 */

class EnhancedParticleSystem {
  constructor() {
    this.particles = [];
    this.emitters = [];
    this.maxParticles = 500;
    this.isRunning = false;
    
    this.init();
  }

  init() {
    this.startParticleLoop();
  }

  startParticleLoop() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  loop() {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    
    requestAnimationFrame(() => this.loop());
  }

  update(deltaTime) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(deltaTime);
      
      if (p.isDead()) {
        this.particles.splice(i, 1);
      }
    }
    
    // Update emitters
    this.emitters.forEach(emitter => {
      if (emitter.active) {
        emitter.update(deltaTime);
      }
    });
  }

  // Create different particle types
  createParticle(options) {
    if (this.particles.length >= this.maxParticles) {
      // Remove oldest particle
      this.particles.shift();
    }
    
    const particle = new Particle(options);
    this.particles.push(particle);
    return particle;
  }

  // Celebration effects
  celebrationBurst(x, y, intensity = 1) {
    const count = Math.floor(50 * intensity);
    
    for (let i = 0; i < count; i++) {
      this.createParticle({
        x,
        y,
        vx: (Math.random() - 0.5) * 15 * intensity,
        vy: (Math.random() - 0.5) * 15 * intensity - 5,
        size: Math.random() * 8 + 4,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        life: 2 + Math.random(),
        type: 'confetti',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }
  }

  starBurst(x, y, count = 20) {
    for (let i = 0; i < count; i++) {
      this.createParticle({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 6 + 4,
        color: '#FFD700',
        life: 1.5 + Math.random(),
        type: 'star',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 5
      });
    }
  }

  sparkleEffect(x, y, color = '#FFFFFF') {
    for (let i = 0; i < 10; i++) {
      this.createParticle({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        size: Math.random() * 3 + 1,
        color,
        life: 0.5 + Math.random() * 0.5,
        type: 'sparkle'
      });
    }
  }

  liquidSplash(x, y, color, amount = 20) {
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: Math.random() * 4 + 2,
        color,
        life: 0.8 + Math.random() * 0.4,
        type: 'liquid',
        gravity: 15
      });
    }
  }

  firework(x, y) {
    // Initial burst
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const speed = 8 + Math.random() * 4;
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        color,
        life: 1 + Math.random() * 0.5,
        type: 'firework',
        trail: true,
        trailColor: color
      });
    }
  }

  // Ambient effects
  floatingParticles(bounds, count = 10) {
    for (let i = 0; i < count; i++) {
      this.createParticle({
        x: bounds.x + Math.random() * bounds.width,
        y: bounds.y + Math.random() * bounds.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.5 - 0.2,
        size: Math.random() * 2 + 1,
        color: 'rgba(255, 255, 255, 0.3)',
        life: 5 + Math.random() * 5,
        type: 'ambient',
        wrapBounds: bounds
      });
    }
  }

  // Emitters for continuous effects
  createEmitter(options) {
    const emitter = {
      x: options.x,
      y: options.y,
      rate: options.rate || 10,
      active: true,
      elapsed: 0,
      particleOptions: options.particleOptions || {},
      
      update(deltaTime) {
        this.elapsed += deltaTime;
        
        const particlesToEmit = Math.floor(this.elapsed * this.rate);
        
        if (particlesToEmit > 0) {
          this.elapsed -= particlesToEmit / this.rate;
          
          for (let i = 0; i < particlesToEmit; i++) {
            window.EnhancedParticleSystem?.createParticle({
              x: this.x + (Math.random() - 0.5) * 10,
              y: this.y + (Math.random() - 0.5) * 10,
              ...this.particleOptions
            });
          }
        }
      },
      
      stop() {
        this.active = false;
      }
    };
    
    this.emitters.push(emitter);
    return emitter;
  }

  // Render particles
  render(ctx) {
    this.particles.forEach(p => p.render(ctx));
  }
}

// Individual Particle class
class Particle {
  constructor(options) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.vx = options.vx || 0;
    this.vy = options.vy || 0;
    this.ax = options.ax || 0;
    this.ay = options.ay || options.gravity || 0;
    this.size = options.size || 5;
    this.color = options.color || '#FFFFFF';
    this.life = options.life || 1;
    this.maxLife = this.life;
    this.type = options.type || 'default';
    this.rotation = options.rotation || 0;
    this.rotationSpeed = options.rotationSpeed || 0;
    this.alpha = 1;
    this.trail = options.trail || false;
    this.trailColor = options.trailColor || this.color;
    this.trailPositions = [];
    this.wrapBounds = options.wrapBounds || null;
  }

  update(deltaTime) {
    // Store trail position
    if (this.trail) {
      this.trailPositions.push({ x: this.x, y: this.y });
      if (this.trailPositions.length > 10) {
        this.trailPositions.shift();
      }
    }
    
    // Apply physics
    this.vx += this.ax * deltaTime;
    this.vy += this.ay * deltaTime;
    
    this.x += this.vx * deltaTime * 60;
    this.y += this.vy * deltaTime * 60;
    
    // Apply rotation
    this.rotation += this.rotationSpeed * deltaTime;
    
    // Update life
    this.life -= deltaTime;
    this.alpha = Math.max(0, this.life / this.maxLife);
    
    // Wrap bounds if specified
    if (this.wrapBounds) {
      if (this.y < this.wrapBounds.y) {
        this.y = this.wrapBounds.y + this.wrapBounds.height;
      }
      if (this.y > this.wrapBounds.y + this.wrapBounds.height) {
        this.y = this.wrapBounds.y;
      }
    }
    
    // Apply drag
    this.vx *= 0.99;
    this.vy *= 0.99;
  }

  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    
    // Render trail
    if (this.trail && this.trailPositions.length > 1) {
      ctx.strokeStyle = this.trailColor;
      ctx.lineWidth = this.size * 0.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.trailPositions[0].x, this.trailPositions[0].y);
      
      for (let i = 1; i < this.trailPositions.length; i++) {
        ctx.lineTo(this.trailPositions[i].x, this.trailPositions[i].y);
      }
      
      ctx.stroke();
    }
    
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    switch (this.type) {
      case 'star':
        this.drawStar(ctx);
        break;
      case 'confetti':
        this.drawConfetti(ctx);
        break;
      case 'sparkle':
        this.drawSparkle(ctx);
        break;
      case 'liquid':
        this.drawLiquid(ctx);
        break;
      case 'firework':
        this.drawFirework(ctx);
        break;
      default:
        this.drawDefault(ctx);
    }
    
    ctx.restore();
  }

  drawStar(ctx) {
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = Math.cos(angle) * this.size;
      const y = Math.sin(angle) * this.size;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  drawConfetti(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
  }

  drawSparkle(ctx) {
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  drawLiquid(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFirework(ctx) {
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.color;
    
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  drawDefault(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  isDead() {
    return this.life <= 0;
  }
}

// Create global instance
window.EnhancedParticleSystem = new EnhancedParticleSystem();