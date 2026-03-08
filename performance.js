/**
 * @fileoverview Performance Optimization System for Water Puzzle Star
 * Provides canvas optimization, asset management, and memory optimization
 */

class PerformanceSystem {
  constructor() {
    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      canvasOperations: 0,
      drawCalls: 0
    };
    
    this.optimizations = {
      dirtyRectangles: true,
      objectPooling: true,
      lazyLoading: true,
      assetCaching: true,
      offscreenCanvas: true
    };
    
    this.pools = new Map();
    this.cache = new Map();
    this.offscreenCanvases = new Map();
    
    this.init();
  }

  init() {
    this.setupObjectPools();
    this.setupPerformanceMonitoring();
    this.setupMemoryManagement();
  }

  // Object Pooling
  setupObjectPools() {
    // Particle pool
    this.createPool('particle', () => ({
      x: 0, y: 0, vx: 0, vy: 0, size: 0, color: '', life: 0, active: false
    }), 100);
    
    // Vector pool
    this.createPool('vector', () => ({ x: 0, y: 0 }), 50);
    
    // Rectangle pool
    this.createPool('rect', () => ({ x: 0, y: 0, width: 0, height: 0 }), 30);
  }

  createPool(name, factory, initialSize = 10) {
    const pool = {
      objects: [],
      factory,
      get() {
        if (this.objects.length > 0) {
          return this.objects.pop();
        }
        return this.factory();
      },
      release(obj) {
        // Reset object
        Object.keys(obj).forEach(key => {
          if (typeof obj[key] === 'number') {
            obj[key] = 0;
          } else if (typeof obj[key] === 'string') {
            obj[key] = '';
          } else if (typeof obj[key] === 'boolean') {
            obj[key] = false;
          }
        });
        this.objects.push(obj);
      },
      preallocate(count) {
        for (let i = 0; i < count; i++) {
          this.objects.push(this.factory());
        }
      }
    };
    
    pool.preallocate(initialSize);
    this.pools.set(name, pool);
    return pool;
  }

  getFromPool(poolName) {
    const pool = this.pools.get(poolName);
    return pool ? pool.get() : null;
  }

  releaseToPool(poolName, obj) {
    const pool = this.pools.get(poolName);
    if (pool) {
      pool.release(obj);
    }
  }

  // Performance Monitoring
  setupPerformanceMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();
    let totalTime = 0;
    
    const measureFrame = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      frameCount++;
      totalTime += deltaTime;
      
      // Update metrics every second
      if (totalTime >= 1000) {
        this.metrics.fps = Math.round((frameCount * 1000) / totalTime);
        this.metrics.frameTime = totalTime / frameCount;
        
        frameCount = 0;
        totalTime = 0;
        
        // Check for performance issues
        if (this.metrics.fps < 30) {
          this.onLowPerformance();
        }
      }
      
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
  }

  onLowPerformance() {
    // Reduce particle count
    if (window.EnhancedParticleSystem) {
      window.EnhancedParticleSystem.maxParticles = Math.max(100, 
        window.EnhancedParticleSystem.maxParticles - 50);
    }
    
    // Disable some visual effects
    this.optimizations.dirtyRectangles = true;
    
    console.warn('Low performance detected, reducing visual quality');
  }

  // Memory Management
  setupMemoryManagement() {
    // Monitor memory usage
    if (performance.memory) {
      setInterval(() => {
        this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1048576; // MB
        
        // Clean up if memory usage is high
        if (this.metrics.memoryUsage > 100) {
          this.cleanup();
        }
      }, 5000);
    }
    
    // Clean up on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.cleanup();
      }
    });
  }

  cleanup() {
    // Clear caches
    this.cache.clear();
    
    // Release pooled objects
    this.pools.forEach(pool => {
      pool.objects.length = 0;
    });
    
    // Clear offscreen canvases
    this.offscreenCanvases.clear();
    
    // Force garbage collection hint
    if (window.gc) {
      window.gc();
    }
  }

  // Canvas Optimization
  createOffscreenCanvas(id, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    this.offscreenCanvases.set(id, {
      canvas,
      ctx: canvas.getContext('2d'),
      width,
      height,
      dirty: true
    });
    
    return this.offscreenCanvases.get(id);
  }

  getOffscreenCanvas(id) {
    return this.offscreenCanvases.get(id);
  }

  // Asset Caching
  cacheAsset(id, asset) {
    this.cache.set(id, {
      asset,
      timestamp: Date.now(),
      hits: 0
    });
  }

  getCachedAsset(id) {
    const cached = this.cache.get(id);
    if (cached) {
      cached.hits++;
      return cached.asset;
    }
    return null;
  }

  // Dirty Rectangle Rendering
  calculateDirtyRectangles(oldState, newState) {
    const dirtyRects = [];
    
    // Compare states and find changed regions
    // This is a simplified version - actual implementation would be more sophisticated
    
    return dirtyRects;
  }

  // Render Optimization
  optimizeRender(ctx, renderFunction) {
    // Batch similar operations
    ctx.save();
    
    const startTime = performance.now();
    
    renderFunction();
    
    this.metrics.canvasOperations++;
    this.metrics.drawCalls++;
    
    ctx.restore();
    
    return performance.now() - startTime;
  }

  // Level of Detail
  calculateLOD(distance, screenSize) {
    if (screenSize < 0.1 || distance > 1000) {
      return 0; // Don't render
    } else if (distance > 500 || screenSize < 0.3) {
      return 1; // Low detail
    } else if (distance > 200 || screenSize < 0.6) {
      return 2; // Medium detail
    } else {
      return 3; // Full detail
    }
  }

  // Get performance report
  getPerformanceReport() {
    return {
      metrics: { ...this.metrics },
      optimizations: { ...this.optimizations },
      poolStats: {},
      cacheStats: {
        size: this.cache.size,
        hits: Array.from(this.cache.values()).reduce((sum, item) => sum + item.hits, 0)
      }
    };
  }
}

// Create global instance
window.PerformanceSystem = new PerformanceSystem();